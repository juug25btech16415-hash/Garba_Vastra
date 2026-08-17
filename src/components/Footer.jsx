export default function Footer() {
  return (
    <footer className="border-t border-maroon/10 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink/50">
        <img
          src="/main-logo.png"
          alt="Garba Vastra"
          className="h-12 md:h-14 w-auto object-contain grayscale opacity-80 hover:grayscale-0 transition-all"
        />
        
        <p>Contact for any queries: +91 9712029713</p>
        
        <div className="text-center sm:text-right flex flex-col gap-1">
          <p>Handpicked chaniya cholis, made for the raas.</p>
          <p>Made in Gujarat, India</p>
        </div>
      </div>
    </footer>
  )
}
