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
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[create-razorpay-order] Razorpay keys missing in environment:', {
        hasKeyId: Boolean(razorpayKeyId),
        hasKeySecret: Boolean(razorpayKeySecret),
      })
      return res.status(500).json({ error: 'Razorpay keys missing in environment' })
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[create-razorpay-order] Supabase credentials missing in environment:', {
        hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      })
      return res.status(500).json({ error: 'Supabase environment variables missing in environment' })
    }

    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
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
    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Order total must be at least ₹1 (100 paise).' })
    }

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
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      internalOrderId: order.id,
    })
  } catch (err) {
    console.error('[create-razorpay-order] Order creation failed with exception:', {
      message: err?.message,
      stack: err?.stack,
      error: err,
    })
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
