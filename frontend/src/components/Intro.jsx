import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../context/LangContext'

const PETAL_COUNT = 18

function SakuraPetal({ delay, duration, startX, size, color }) {
  return (
    <motion.div
      className="absolute top-0"
      style={{ left: `${startX}%`, width: size, height: size }}
      initial={{ y: -40, rotate: 0, opacity: 0.9 }}
      animate={{ y: '105vh', rotate: 720, opacity: 0 }}
      transition={{ duration, delay, ease: 'linear', repeat: Infinity, repeatDelay: Math.random() * 3 }}
    >
      <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow">
        <path d="M12 2C9 2 7 5 7 8c0 2 .7 3.7 2 5-2-1-5-1-7 1 2 2 5 2 7 1-1 1.5-1 4 0 6 1-2 1-4.5 0-6 2 1 5 1 7-1-2-2-5-2-7-1 1.3-1.3 2-3 2-5 0-3-2-6-1-6z" />
      </svg>
    </motion.div>
  )
}

const FloatingHeart = ({ x, y, delay }) => (
  <motion.div
    className="absolute text-sakura"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0, y: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.8], y: -80 }}
    transition={{ delay, duration: 2, ease: 'easeOut' }}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </motion.div>
)

/** Letters appear one-by-one */
function TypewriterText({ text, className, delay = 0 }) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.06, duration: 0.2 }}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

export default function Intro() {
  const [show, setShow]     = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [showHearts, setShowHearts] = useState(false)
  const heartTimer = useRef(null)
  const { t }     = useLang()

  useEffect(() => {
    const seen = sessionStorage.getItem('dg_intro_seen')
    if (!seen) setShow(true)
  }, [])

  useEffect(() => {
    if (show) {
      heartTimer.current = setTimeout(() => setShowHearts(true), 2200)
    }
    return () => clearTimeout(heartTimer.current)
  }, [show])

  const enter = () => {
    setLeaving(true)
    setTimeout(() => {
      sessionStorage.setItem('dg_intro_seen', '1')
      setShow(false)
    }, 800)
  }

  // Auto-enter after 9 s for impatient visitors
  useEffect(() => {
    if (!show) return
    const t = setTimeout(enter, 9000)
    return () => clearTimeout(t)
  }, [show])

  const petals = Array.from({ length: PETAL_COUNT }, (_, i) => ({
    id: i,
    delay:    Math.random() * 4,
    duration: 5 + Math.random() * 6,
    startX:   Math.random() * 100,
    size:     12 + Math.random() * 16,
    color:    ['#FFB7D5', '#FF6B9D', '#BAE6FD', '#DDD6FE'][Math.floor(Math.random() * 4)],
  }))

  const hearts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 30 + Math.random() * 50,
    delay: 2.2 + i * 0.18,
  }))

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9990] flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #FFF0F5 0%, #FFD6E7 50%, #BAE6FD 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Falling petals */}
          {petals.map((p) => (
            <SakuraPetal key={p.id} {...p} />
          ))}

          {/* Floating hearts on reveal */}
          <AnimatePresence>
            {showHearts && hearts.map((h) => <FloatingHeart key={h.id} {...h} />)}
          </AnimatePresence>

          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, #FF6B9D 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />

          {/* Center content */}
          <div className="relative z-10 text-center px-8 max-w-lg">
            {/* Logo ring */}
            <motion.div
              className="mx-auto mb-6 w-28 h-28 rounded-full bg-white shadow-kawaii-lg border-4 border-maid flex items-center justify-center"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 14 }}
            >
              <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
                <circle cx="40" cy="40" r="36" fill="#FFEEF5" stroke="#FFB7D5" strokeWidth="3"/>
                <text x="40" y="28" textAnchor="middle" fontSize="9" fill="#FF6B9D" fontFamily="Playfair Display" fontStyle="italic">Maid Café</text>
                <text x="40" y="44" textAnchor="middle" fontSize="13" fill="#FF6B9D" fontFamily="Playfair Display" fontWeight="bold">Dream</text>
                <text x="40" y="57" textAnchor="middle" fontSize="13" fill="#93C5FD" fontFamily="Playfair Display" fontWeight="bold">Garden</text>
                <text x="40" y="67" textAnchor="middle" fontSize="6" fill="#FF6B9D" fontFamily="Noto Serif JP">メイドカフェ・ドリームガーデン</text>
              </svg>
            </motion.div>

            {/* Subtitle JP */}
            <motion.p
              className="text-maid/60 text-sm font-japanese mb-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              夢の庭へようこそ
            </motion.p>

            {/* MOE MOE KYUN headline */}
            <motion.div
              className="mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <TypewriterText
                text="Moe Moe Kyun~!"
                delay={1.0}
                className="font-display italic text-4xl md:text-5xl font-bold text-maid drop-shadow"
              />
            </motion.div>

            {/* Heart row */}
            <motion.div
              className="flex justify-center gap-2 my-3"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.9, type: 'spring', stiffness: 300 }}
            >
              {['#FF6B9D', '#FFB7D5', '#93C5FD', '#FFB7D5', '#FF6B9D'].map((c, i) => (
                <svg key={i} viewBox="0 0 24 24" fill={c} className="w-5 h-5 animate-float" style={{ animationDelay: `${i * 0.15}s` }}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="text-dusk/70 text-base mb-8 font-medium"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
            >
              {t('intro', 'line3')}
            </motion.p>

            {/* Enter button */}
            <motion.button
              onClick={enter}
              className="px-10 py-4 bg-maid text-white font-bold rounded-full text-lg shadow-kawaii-lg hover:bg-maid-dark transition-colors duration-200 relative overflow-hidden group animate-pulse-soft"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.3, type: 'spring' }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="relative z-10">{t('intro', 'welcome')}</span>
              {/* Shimmer */}
              <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700 skew-x-12" />
            </motion.button>

            {/* Bow decoration */}
            <motion.div
              className="mt-6 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              <BowSVG />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BowSVG() {
  return (
    <svg viewBox="0 0 120 40" className="w-20 animate-bow-bounce" fill="none">
      {/* Left wing */}
      <ellipse cx="35" cy="20" rx="30" ry="14" fill="#FFB7D5" stroke="#FF6B9D" strokeWidth="1.5" transform="rotate(-10 35 20)" />
      {/* Right wing */}
      <ellipse cx="85" cy="20" rx="30" ry="14" fill="#FFB7D5" stroke="#FF6B9D" strokeWidth="1.5" transform="rotate(10 85 20)" />
      {/* Center knot */}
      <ellipse cx="60" cy="20" rx="10" ry="10" fill="#FF6B9D" />
      <ellipse cx="60" cy="20" rx="6" ry="6" fill="#FFEEF5" />
    </svg>
  )
}
