export default function Footer() {
  return (
    <footer className="border-t border-maroon/10 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink/50">
        <img
          src="/main-logo.png"
          alt="Garba Vastra"
          className="h-8 w-auto grayscale opacity-75 hover:grayscale-0 transition"
        />
        <p>Handpicked chaniya cholis, made for the raas.</p>
      </div>
    </footer>
  )
}