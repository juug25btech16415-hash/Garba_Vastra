import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { calcShipping } from './_shipping.js'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read environment variables safely inside the handler
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) in Vercel environment variables.'
      })
    }
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({
        error: 'Missing Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) in Vercel environment variables.'
      })
    }

    // Initialize clients inside handler
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        // use as-is if already parsed or invalid
      }
    }

    const { customer, items } = body || {}

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city || !customer?.pincode) {
      return res.status(400).json({ error: 'Missing customer details.' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }

    // Recompute total from database prices
    let subtotal = 0
    const verifiedItems = []
    for (const item of items) {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('id, name, price, stock')
        .eq('id', item.productId)
        .single()

      if (error || !product) {
        return res.status(400).json({ error: `Product not found: ${item.name || item.productId}` })
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ error: `Only ${product.stock} left of ${product.name} — please update your cart.` })
      }

      subtotal += Number(product.price) * item.qty
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        size: item.size || '',
        color: item.color || '',
        qty: item.qty,
      })
    }

    const shippingFee = calcShipping(subtotal)
    const total = subtotal + shippingFee

    // Insert order in 'pending' state
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

    if (orderError) {
      console.error('Order creation error:', orderError)
      return res.status(500).json({ error: orderError.message || 'Failed to create order record.' })
    }

    // Create Razorpay order (amount in paise)
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
    console.error('Error in create-razorpay-order:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
