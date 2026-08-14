import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { calcShipping } from './_shipping.js'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables are missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).')
  }
  return createClient(url, key)
}

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Razorpay environment variables are missing (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET).')
  }
  return new Razorpay({ key_id, key_secret })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const razorpay = getRazorpay()

    const { customer, items } = req.body || {}

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city || !customer?.pincode) {
      return res.status(400).json({ error: 'Missing customer details.' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }

    // Recompute the total from the DATABASE price, not whatever the browser sent
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

    if (orderError) {
      console.error('Order creation error:', orderError)
      return res.status(500).json({ error: orderError.message || 'Failed to create order record.' })
    }

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
    console.error('Error in create-razorpay-order:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
