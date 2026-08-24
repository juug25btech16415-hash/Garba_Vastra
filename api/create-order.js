import Razorpay from 'razorpay'

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
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      return res.status(401).json({ error: 'Razorpay API credentials not configured.' })
    }

    const { amount, currency = 'INR', receipt } = req.body || {}

    // Amount validation (minimum 100 paise)
    const amountInPaise = Number(amount)
    if (!amount || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount is required and must be at least 100 paise.' })
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    })

    const options = {
      amount: Math.round(amountInPaise),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    })
  } catch (err) {
    console.error('Error creating Razorpay order:', err)
    const statusCode = err.statusCode || (err.error && err.error.code === 'BAD_REQUEST_ERROR' ? 400 : 500)
    return res.status(statusCode).json({
      error: err.error?.description || err.message || 'Failed to create Razorpay order.',
    })
  }
}
