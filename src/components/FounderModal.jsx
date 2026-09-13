import { useEffect } from "react"

// Instagram SVG logo (official brand mark proportions)
function InstagramIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  )
}

export default function FounderModal({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="founder-modal-title"
    >
      {/* Blurred overlay — click to dismiss */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-ivory rounded-2xl shadow-2xl overflow-hidden" style={{ animation: "modalFadeIn 0.22s cubic-bezier(0.16,1,0.3,1) both" }}>
        {/* Decorative top strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-maroon via-marigold to-maroon" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-ink/50 hover:text-maroon hover:bg-maroon/10 transition-colors cursor-pointer"
          aria-label="Close founder story"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-7 pb-8 pt-6 text-center">
          {/* Profile picture */}
          <div className="relative mx-auto w-28 h-28 mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-maroon/30 via-marigold/40 to-maroon/20 blur-md scale-110" />
            <img
              src="/founder-avatar.jpg"
              alt="Vritika — Founder of Garba Vastra"
              className="relative w-28 h-28 rounded-full object-cover ring-4 ring-ivory shadow-lg"
            />
          </div>

          {/* Name + badge */}
          <h2
            id="founder-modal-title"
            className="font-display text-2xl font-semibold text-maroon leading-tight mb-1"
          >
            Vritika
          </h2>
          <span className="inline-block text-[11px] uppercase tracking-widest font-bold text-marigold bg-maroon/10 px-3 py-0.5 rounded-full mb-5">
            Founder &middot; Garba Vastra
          </span>

          {/* Divider with motif */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-maroon/15" />
            <span className="text-maroon/30 text-lg">&#10022;</span>
            <div className="flex-1 h-px bg-maroon/15" />
          </div>

          {/* Story text */}
          <p className="text-ink/80 text-sm leading-relaxed text-left mb-6">
            Hi, I&apos;m Vritika. I built Garba Vastra from the ground up during my 2nd year of
            Computer Science Engineering. After moving from Gujarat to Bengaluru for college, I
            realized how hard it was to find the authentic, vibrant Chaniya Cholis I grew up with.
            I wanted to bridge my love for my cultural heritage with my passion for coding, so I
            launched this platform single-handedly. My mission is to bring pure,
            hand-embroidered Gujarati festive wear to everyone while directly supporting the local
            artisans and small businesses who craft them.
          </p>

          {/* Instagram CTA */}
          <a
            href="https://instagram.com/garba.vastra"
            target="_blank"
            rel="noopener noreferrer"
            id="founder-instagram-link"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
            style={{ background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)" }}
          >
            <InstagramIcon className="w-4 h-4" />
            <span>@garba.vastra</span>
          </a>
        </div>
      </div>
    </div>
  )
}
