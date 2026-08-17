import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { calcShipping } from '../src/lib/shipping.js'

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
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Clients are created HERE, not at module scope. If an env var is missing,
    // this throws inside the try/catch below and returns clean JSON — instead
    // of crashing at cold-start and making Vercel emit its own plain-text
    // error page (which is what broke JSON.parse on the frontend before).
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Server misconfigured: missing Supabase environment variables.')
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Server misconfigured: missing Razorpay environment variables.')
    }

    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const { customer, items } = req.body || {}

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city || !customer?.pincode) {
      return res.status(400).json({ error: 'Missing customer details.' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }

    // Recompute the total from the DATABASE price, not whatever the browser sent —
    // this is what stops someone from editing the price in devtools before paying.
    let subtotal = 0
    const verifiedItems = []
    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('id, name, price, stock')
        .eq('id', item.productId)
        .single()

      if (error || !product) return res.status(400).json({ error: `Product not found: ${item.name}` })
      if (product.stock < item.qty) {
        return res.status(400).json({ error: `Only ${product.stock} left of ${product.name} — please update your cart.` })
      }

      subtotal += product.price * item.qty
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        size: item.size,
        color: item.color,
        qty: item.qty,
      })
    }

    // Add shipping the same way the checkout page displays it — computed once,
    // server-side, so the amount actually charged always matches what the
    // customer saw on screen.
    const shippingFee = calcShipping(subtotal)
    const total = subtotal + shippingFee

    // Create the order row first, in "pending" state
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
        items: verifiedItems,
        total,
        payment_status: 'pending',
        order_status: 'placed',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Now create the actual Razorpay order (amount is in paise)
    const amountInPaise = Math.round(total * 100)
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.id,
    })

    await supabaseAdmin
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id)

    return res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      internalOrderId: order.id,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
