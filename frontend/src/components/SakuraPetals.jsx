import { useEffect, useRef } from 'react'

const COLORS = ['#FFB7D5', '#FF6B9D', '#BAE6FD', '#DDD6FE', '#FFD6E7']

export default function SakuraPetals({ count = 12 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const petals = Array.from({ length: count }, (_, i) => {
      const el = document.createElement('div')
      el.style.cssText = `
        position: absolute;
        top: ${-10 - Math.random() * 5}%;
        left: ${Math.random() * 100}%;
        width: ${10 + Math.random() * 14}px;
        height: ${10 + Math.random() * 14}px;
        animation: petalFall ${5 + Math.random() * 7}s ${Math.random() * 5}s linear infinite;
        pointer-events: none;
      `
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 24 24')
      svg.style.cssText = 'width:100%;height:100%;'
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('fill', COLORS[Math.floor(Math.random() * COLORS.length)])
      path.setAttribute('d', 'M12 2C9 2 7 5 7 8c0 2 .7 3.7 2 5-2-1-5-1-7 1 2 2 5 2 7 1-1 1.5-1 4 0 6 1-2 1-4.5 0-6 2 1 5 1 7-1-2-2-5-2-7-1 1.3-1.3 2-3 2-5 0-3-2-6-1-6z')
      svg.appendChild(path)
      el.appendChild(svg)
      container.appendChild(el)
      return el
    })

    return () => petals.forEach((p) => p.remove())
  }, [count])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  )
}
