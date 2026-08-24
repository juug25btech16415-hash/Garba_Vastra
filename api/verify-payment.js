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

    // If tied to an internal Supabase order, update DB and stock
    if (internalOrderId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        const { data: order, error: fetchError } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', internalOrderId)
          .single()

        if (!fetchError && order) {
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

          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'paid', razorpay_payment_id: paymentId })
            .eq('id', internalOrderId)
        }
      } catch (dbErr) {
        console.error('Database update error after successful verification:', dbErr)
      }
    }

    return res.status(200).json({ success: true, message: 'Payment signature verified successfully.' })
  } catch (err) {
    console.error('Payment verification error:', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' })
  }
}
