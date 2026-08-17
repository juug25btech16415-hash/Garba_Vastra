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
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Server misconfigured: missing Supabase environment variables.')
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Server misconfigured: missing Razorpay environment variables.')
    }

    // Client is created HERE, not at module scope — see create-razorpay-order.js
    // for why (avoids an unhandled cold-start crash producing non-JSON output).
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = req.body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internalOrderId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields.' })
    }

    // Verify the payment is genuinely from Razorpay and wasn't tampered with
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
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

    if (fetchError || !order) return res.status(404).json({ success: false, error: 'Order not found.' })

    // Reduce stock for each item — decrement_stock() is written to never go below zero,
    // even if two people pay for the last piece at the same moment.
    for (const item of order.items) {
      const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_qty: item.qty,
      })
      if (stockError) {
        console.error('Stock decrement failed for', item.productId, stockError)
        // Payment already succeeded — flag for manual review rather than losing the order
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'paid', order_status: 'needs_review', razorpay_payment_id })
          .eq('id', internalOrderId)
        return res.status(200).json({ success: true, warning: 'Stock adjustment needs review.' })
      }
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', razorpay_payment_id })
      .eq('id', internalOrderId)

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' })
  }
}
