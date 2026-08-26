import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return res.status(401).json({ success: false, error: 'Razorpay secret key not configured on server.' })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
      internalOrderId,
    } = req.body || {}

    const orderId = razorpay_order_id || order_id
    const paymentId = razorpay_payment_id || payment_id
    const sig = razorpay_signature || signature

    if (!orderId || !paymentId || !sig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields (order_id, payment_id, signature).',
      })
    }

    // Verify signature using HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature !== sig) {
      if (internalOrderId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
          await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', internalOrderId)
        } catch (dbErr) {
          console.error('Failed to record payment failure:', dbErr)
        }
      }
      return res.status(400).json({ success: false, error: 'Signature verification failed (Signature mismatch).' })
    }

    // If tied to an internal Supabase order, update DB, reduce stock, and trigger Shiprocket fulfillment
    if (internalOrderId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      const { data: order, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', internalOrderId)
        .single()

      if (fetchError || !order) {
        console.error('Order not found in Supabase:', fetchError)
      } else {
        // Decrement stock for each item safely
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.productId) {
              const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
                p_product_id: item.productId,
                p_qty: item.qty,
              })
              if (stockError) {
                console.error('Stock decrement failed for', item.productId, stockError)
                await supabaseAdmin
                  .from('orders')
                  .update({ payment_status: 'paid', order_status: 'needs_review', razorpay_payment_id: paymentId })
                  .eq('id', internalOrderId)
                return res.status(200).json({ success: true, warning: 'Stock adjustment needs review.' })
              }
            }
          }
        }

        // Update database to paid
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'paid', razorpay_payment_id: paymentId })
          .eq('id', internalOrderId)

        // Shiprocket Order Creation Automation
        const shiprocketEmail = process.env.SHIPROCKET_EMAIL
        const shiprocketPassword = process.env.SHIPROCKET_PASSWORD
        const pickupLocation =
          process.env.SHIPROCKET_PICKUP_LOCATION ||
          process.env.SHIPROCKET_PICKUP_NICKNAME ||
          'Primary'

        if (!shiprocketEmail || !shiprocketPassword) {
          console.error('Shiprocket credentials missing from environment (SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not configured).')
        } else {
          try {
            // Step 1: Generate Bearer token via Shiprocket login
            const loginRes = await fetch('https://apiv2.shiprocket.in/v2/console/data/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: shiprocketEmail,
                password: shiprocketPassword,
              }),
            })

            const loginData = await loginRes.json()

            if (!loginRes.ok || !loginData.token) {
              console.error('Shiprocket Login Failed:', {
                status: loginRes.status,
                statusText: loginRes.statusText,
                error: loginData,
              })
            } else {
              const token = loginData.token

              // Step 2: Format recipient customer names
              const customerName = (order.customer_name || 'Customer').trim()
              const nameParts = customerName.split(/\s+/)
              const billingFirstName = nameParts[0] || 'Customer'
              const billingLastName = nameParts.slice(1).join(' ') || ''

              // Step 3: Format line items for Shiprocket
              const orderItems = Array.isArray(order.items) && order.items.length > 0
                ? order.items.map((item, idx) => ({
                    name: item.name || `Garba Vastra Piece ${idx + 1}`,
                    sku: String(item.sku || item.productId || `SKU-${idx + 1}`),
                    units: Number(item.qty) || 1,
                    selling_price: Number(item.price) || 0,
                    discount: 0,
                    tax: 0,
                    hsn: '',
                  }))
                : [
                    {
                      name: 'Garba Vastra Piece',
                      sku: 'GV-001',
                      units: 1,
                      selling_price: Number(order.total) || 0,
                      discount: 0,
                      tax: 0,
                    },
                  ]

              const orderDate = new Date(order.created_at || Date.now())
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ')

              const shiprocketPayload = {
                order_id: String(internalOrderId),
                order_date: orderDate,
                pickup_location: pickupLocation,
                channel_id: '',
                comment: 'Order placed via Garba Vastra Website',
                billing_customer_name: billingFirstName,
                billing_last_name: billingLastName,
                billing_address: order.address || '',
                billing_address_2: '',
                billing_city: order.city || '',
                billing_pincode: order.pincode || '',
                billing_state: order.state || order.city || '',
                billing_country: 'India',
                billing_email: order.email || 'customer@garbavastra.com',
                billing_phone: order.phone || '',
                shipping_is_billing: true,
                order_items: orderItems,
                payment_method: 'Prepaid',
                shipping_charges: 0,
                giftwrap_charges: 0,
                transaction_charges: 0,
                total_discount: 0,
                sub_total: Number(order.total) || 0,
                length: 10,
                breadth: 10,
                height: 10,
                weight: 0.5,
              }

              // Step 4: Call Shiprocket Create Custom Order API (/v2/console/data/orders/create/adhoc)
              const createOrderRes = await fetch('https://apiv2.shiprocket.in/v2/console/data/orders/create/adhoc', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(shiprocketPayload),
              })

              const createOrderData = await createOrderRes.json()

              if (!createOrderRes.ok || (!createOrderData.order_id && !createOrderData.shipment_id)) {
                console.error('Shiprocket Create Order API Failed:', {
                  status: createOrderRes.status,
                  statusText: createOrderRes.statusText,
                  error: createOrderData,
                  sentPayload: shiprocketPayload,
                })
              } else {
                const shiprocketOrderId = createOrderData.order_id
                const shipmentId = createOrderData.shipment_id
                const awbCode = createOrderData.awb_code || null

                // Step 5: Update Supabase order record with Shiprocket IDs
                const updateFields = {
                  shiprocket_order_id: String(shiprocketOrderId),
                  shipment_id: String(shipmentId),
                  tracking_id: String(shipmentId || shiprocketOrderId),
                  ...(awbCode ? { awb_number: String(awbCode) } : {}),
                }

                const { error: updateOrderErr } = await supabaseAdmin
                  .from('orders')
                  .update(updateFields)
                  .eq('id', internalOrderId)

                if (updateOrderErr) {
                  console.error('Failed to update Supabase order with Shiprocket IDs:', {
                    error: updateOrderErr,
                    internalOrderId,
                    updateFields,
                  })
                  // Fallback in case custom columns do not exist yet
                  await supabaseAdmin
                    .from('orders')
                    .update({ tracking_id: String(shipmentId || shiprocketOrderId) })
                    .eq('id', internalOrderId)
                }
              }
            }
          } catch (shiprocketError) {
            console.error('Shiprocket automation encountered an error:', shiprocketError)
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Payment signature verified successfully.' })
  } catch (err) {
    console.error('Payment verification error:', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' })
  }
}
