import { Link } from 'react-router-dom'
import { Heart, Instagram, Facebook, Youtube, Coffee } from 'lucide-react'

const socialLinks = [
  { href: 'https://www.instagram.com/maidcafe_dreamgarden/', icon: Instagram,  label: 'Instagram' },
  { href: 'https://www.facebook.com/DreamGardenMaidCafe',   icon: Facebook,   label: 'Facebook' },
  { href: 'https://www.youtube.com/channel/UClmqebIVpN9tXD7RoTbZoBA', icon: Youtube, label: 'YouTube' },
  { href: 'https://ko-fi.com/maidcafedreamgarden',          icon: Coffee,     label: 'Ko-fi' },
]

const navLinks = [
  { to: '/',        label: 'Home' },
  { to: '/menu',    label: 'Menü' },
  { to: '/members', label: 'Team' },
  { to: '/blog',    label: 'Blog' },
]

// Simple TikTok icon as SVG since Lucide doesn't include it
function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-4.77-4.32V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.53V6.77a4.87 4.87 0 0 1-1-.08z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="relative bg-dusk text-white/80 overflow-hidden">
      {/* Lace top */}
      <div
        className="w-full h-8 -mt-1"
        style={{
          background: 'white',
          clipPath: 'ellipse(52% 100% at 50% 0%)',
          marginBottom: '-1px',
        }}
      />
      <div
        className="w-full"
        style={{ background: 'linear-gradient(160deg, #4A1942 0%, #7B2F7A 100%)' }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #FFB7D5 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-maid/80 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="font-display italic text-xl font-bold text-sakura">DreamGarden</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Ihr #swissmaidcafe — welcome to the dream garden.<br />
              14 Maids, 3 Butlers · Since 2018
            </p>
            <div className="flex gap-3 flex-wrap">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-maid/60 flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              <a
                href="https://www.tiktok.com/@maidcafe_dreamgarden"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-maid/60 flex items-center justify-center transition-colors duration-200"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav */}
          <div>
            <h3 className="font-bold text-sakura mb-4 text-sm uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-2">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-white/60 hover:text-sakura transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-sakura mb-4 text-sm uppercase tracking-wider">Support uns</h3>
            <p className="text-white/60 text-sm mb-4">
              Magst du unsere Arbeit? Unterstütze das DreamGarden auf Ko-fi!
            </p>
            <a
              href="https://ko-fi.com/maidcafedreamgarden"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-maid hover:bg-maid-dark text-white font-bold rounded-full transition-colors duration-200 text-sm"
            >
              <Coffee className="w-4 h-4" />
              Ko-fi Support
            </a>
          </div>
        </div>

        <div className="relative border-t border-white/10 py-4 text-center text-white/40 text-xs">
          <span>
            Made with{' '}
            <Heart className="inline w-3 h-3 fill-maid text-maid mx-0.5" />
            {' '}for Maid Café DreamGarden · {new Date().getFullYear()}
          </span>
          <span className="mx-3">·</span>
          <Link to="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
