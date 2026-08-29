export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-maroon mb-6">Privacy Policy</h1>
      <p className="text-sm text-ink/50 mb-8">Last updated: August 2026</p>

      <div className="space-y-6 text-ink/80 leading-relaxed">
        <p>
          Garba Vastra ("we", "us", "our") is an individual/proprietorship business based in Rajkot,
          Gujarat, India. We respect your privacy. This policy explains what information we collect
          when you shop with us and how we use it.
        </p>

        <div>
          <h2 className="font-display text-xl text-maroon mb-2">Information we collect</h2>
          <p>
            When you place an order, we collect your name, phone number, email (optional), delivery
            address, and city/pincode — only what's needed to process and deliver your order. You do
            not need to create an account to browse or shop; if you choose to sign in with Google, we
            only receive your name and email from Google to speed up checkout.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-maroon mb-2">Payment information</h2>
          <p>
            We never see or store your card, UPI, or bank details. All payments are processed
            directly by Razorpay, our payment partner, which is PCI-DSS compliant. We only receive
            confirmation that a payment succeeded or failed.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-maroon mb-2">How we use your information</h2>
          <p>
            Solely to process your order, arrange delivery, and contact you about that order. We do
            not sell or share your personal information with third parties, other than the courier
            partner needed to deliver your package to you.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-maroon mb-2">Data retention</h2>
          <p>
            We retain order details as required for accounting and legal purposes. You may request
            deletion of your personal data by contacting us below, subject to any records we're
            legally required to keep.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-maroon mb-2">Contact us</h2>
          <p>
            Questions about this policy can be sent to <strong>vritika110@gmail.com</strong> or{' '}
            <strong>+91 97120 29713</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
