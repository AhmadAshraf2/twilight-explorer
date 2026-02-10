const socials = [
  { label: 'Discord', href: '#', icon: '/discord.svg' },
  { label: 'Twitter', href: '#', icon: '/twitter.svg' },
  { label: 'GitHub', href: '#', icon: '/github.svg' },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-black text-white w-full mt-auto">
      {/* Top gradient band (subtle) */}
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{
          background:
            'linear-gradient(90deg, rgba(250,67,64,0.3), rgba(52,47,187,0.25), rgba(252,122,255,0.25), rgba(52,47,187,0.25), rgba(250,67,64,0.3))',
        }}
      />

      {/* Left Technical Element - absolute positioned at screen edge */}
      <div 
        className="absolute left-20 hidden sm:block"
        style={{ 
          width: '15px', 
          height: '15px',
          top: 'calc(50% - 15px/2 - 0.5px)'
        }}
      >
        <img src="/technical_element.svg" alt="" className="w-full h-full" />
      </div>

      {/* Content - constrained to 1432px, padding matches main content */}
      <div className="relative max-w-[1432px] mx-auto px-4 sm:px-6 lg:px-[156px] py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
          <a
            href="https://twilight.org" 
            target="_blank" 
           rel="noopener noreferrer"
           className="hover:text-white"
          >
            Twilight.org
          </a>
          <span className="text-gray-300">
            © Twilight 2025. All Rights Reserved.
          </span>
        </div>
        {/* Right: socials + logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="hover:opacity-80 transition"
              >
                <img src={s.icon} alt={s.label} className="h-5 w-auto" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Right Technical Element - absolute positioned at screen edge */}
      <div 
        className="absolute right-20 hidden sm:block"
        style={{ 
          width: '15px', 
          height: '15px',
          top: 'calc(50% - 15px/2 - 0.5px)'
        }}
      >
        <img src="/technical_element.svg" alt="" className="w-full h-full" />
      </div>
    </footer>
  );
}
