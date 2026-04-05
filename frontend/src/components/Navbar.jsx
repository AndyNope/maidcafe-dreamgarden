import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Heart } from 'lucide-react'
import { useLang } from '../context/LangContext'

function LangToggle({ compact = false }) {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
      className={`flex items-center gap-1 font-bold text-xs rounded-full border transition-all duration-200
        ${compact
          ? 'px-3 py-1.5 border-sakura/40 text-dusk/70 hover:border-maid hover:text-maid'
          : 'px-3 py-1.5 border-sakura/40 text-dusk/70 hover:border-maid hover:text-maid'
        }`}
      title={lang === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
    >
      <span className={lang === 'de' ? 'text-maid font-extrabold' : 'opacity-40'}>DE</span>
      <span className="opacity-30">|</span>
      <span className={lang === 'en' ? 'text-maid font-extrabold' : 'opacity-40'}>EN</span>
    </button>
  )
}

export default function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location              = useLocation()
  const { t }                 = useLang()

  const links = [
    { to: '/',        label: t('nav', 'home'),    exact: true },
    { to: '/menu',    label: t('nav', 'menu') },
    { to: '/members', label: t('nav', 'members') },
    { to: '/blog',    label: t('nav', 'blog') },
  ]

  useEffect(() => {
    setOpen(false)
  }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-kawaii py-2'
          : 'bg-transparent py-4'
      }`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Lace strip top */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #FF6B9D, #FFB7D5, #93C5FD, #FFB7D5, #FF6B9D)' }}
      />

      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            className="w-10 h-10 rounded-full bg-maid flex items-center justify-center shadow-kawaii"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Heart className="w-5 h-5 text-white fill-white" />
          </motion.div>
          <span className="font-display italic font-bold text-xl md:text-2xl text-maid group-hover:text-maid-dark transition-colors">
            DreamGarden
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-maid bg-maid/10'
                    : 'text-dusk/70 hover:text-maid hover:bg-maid/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-maid/10 rounded-full"
                      style={{ zIndex: -1 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <LangToggle />

          <a
            href="https://ko-fi.com/maidcafedreamgarden"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-5 py-2 bg-maid text-white text-sm font-bold rounded-full shadow-kawaii hover:bg-maid-dark hover:shadow-kawaii-lg transition-all duration-200"
          >
            Support
          </a>
        </nav>

        {/* Mobile burger */}
        <div className="md:hidden flex items-center gap-2">
          <LangToggle compact />
          <button
            className="p-2 rounded-full text-maid hover:bg-maid/10 transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            className="md:hidden absolute top-full left-0 right-0 glass border-t border-sakura/30 px-4 py-4 flex flex-col gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {links.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-2xl font-semibold transition-colors ${
                    isActive ? 'bg-maid text-white' : 'text-dusk hover:bg-maid/10 hover:text-maid'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <a
              href="https://ko-fi.com/maidcafedreamgarden"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-2 px-8 py-3 bg-maid text-white font-bold rounded-full shadow-kawaii"
            >
              Support on Ko-fi
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
