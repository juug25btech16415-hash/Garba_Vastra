import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables are missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).')
  }
  return createClient(url, key)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      throw new Error('RAZORPAY_KEY_SECRET environment variable is missing.')
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = req.body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internalOrderId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification parameters.' })
    }

    // Verify the payment is genuinely from Razorpay and wasn't tampered with
    const expectedSignature = crypto
      .createHmac('sha256', secret)
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

    // Reduce stock for each item
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
