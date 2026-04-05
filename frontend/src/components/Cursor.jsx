import { useEffect, useRef, useState } from 'react'

/**
 * Custom animated cursor with sparkle trail.
 * Hidden on touch devices (no CSS cursor:none interference there).
 */
export default function CustomCursor() {
  const dotRef   = useRef(null)
  const ringRef  = useRef(null)
  const [sparks, setSparks]   = useState([])
  const [isTouch, setIsTouch] = useState(false)
  const pos = useRef({ x: -100, y: -100 })
  const raf = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) {
      setIsTouch(true)
      return
    }

    let ringPos = { x: -100, y: -100 }

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`
      }

      // Lazy ring follows with lerp
      cancelAnimationFrame(raf.current)
      const lerp = () => {
        ringPos.x += (pos.current.x - ringPos.x) * 0.18
        ringPos.y += (pos.current.y - ringPos.y) * 0.18
        if (ringRef.current) {
          ringRef.current.style.transform = `translate(${ringPos.x - 16}px, ${ringPos.y - 16}px)`
        }
        raf.current = requestAnimationFrame(lerp)
      }
      raf.current = requestAnimationFrame(lerp)
    }

    const onClick = (e) => {
      const id = Date.now()
      setSparks((s) => [...s, { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => setSparks((s) => s.filter((sp) => sp.id !== id)), 600)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  if (isTouch) return null

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-3 h-3 rounded-full bg-maid"
        style={{ willChange: 'transform' }}
      />

      {/* Outer ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none w-8 h-8 rounded-full border-2 border-maid/60"
        style={{ willChange: 'transform' }}
      />

      {/* Click sparkles */}
      {sparks.map(({ id, x, y }) => (
        <div
          key={id}
          className="fixed pointer-events-none z-[9997]"
          style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute w-1.5 h-1.5 rounded-full bg-maid"
              style={{
                animation: `sparkleOut 0.5s ease-out forwards`,
                '--deg': `${deg}deg`,
              }}
            />
          ))}
          <svg
            className="absolute -inset-3 w-6 h-6 text-sakura animate-heart-pop"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}

      <style>{`
        @keyframes sparkleOut {
          0%   { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--deg)) translateX(20px) scale(0); opacity: 0; }
        }
      `}</style>
    </>
  )
}
