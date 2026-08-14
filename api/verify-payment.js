import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

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
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) in Vercel environment variables.'
      })
    }
    if (!razorpayKeySecret) {
      return res.status(500).json({
        success: false,
        error: 'Missing Razorpay key secret (RAZORPAY_KEY_SECRET) in Vercel environment variables.'
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        // use as-is
      }
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internalOrderId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification parameters.' })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', internalOrderId)
      return res.status(400).json({ success: false, error: 'Signature mismatch.' })
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', internalOrderId)
      .single()

    if (fetchError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found.' })
    }

    // Decrement stock
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
          p_product_id: item.productId,
          p_qty: item.qty,
        })
        if (stockError) {
          console.error('Stock decrement failed for', item.productId, stockError)
          await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'paid', order_status: 'needs_review', razorpay_payment_id })
            .eq('id', internalOrderId)
          return res.status(200).json({ success: true, warning: 'Stock adjustment needs review.' })
        }
      }
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', razorpay_payment_id })
      .eq('id', internalOrderId)

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Error in verify-payment:', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' })
  }
}
