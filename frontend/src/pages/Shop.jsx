import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function Shop() {
  const { t, lang } = useLang()
  const { addItem, itemCount } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [added, setAdded]       = useState({})

  useEffect(() => {
    api.get('/api/products')
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = (product) => {
    addItem(product)
    setAdded(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1500)
  }

  const name = (p) => (lang === 'en' && p.name_en) ? p.name_en : p.name

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #fff9f5)', paddingTop: '80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,5vw,42px)', color: 'var(--pink, #b5838d)', margin: 0 }}>
              {t('shop', 'title')}
            </h1>
            <p style={{ color: '#888', marginTop: 6 }}>{t('shop', 'subtitle')}</p>
          </div>
          <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--pink,#b5838d)', color: '#fff', padding: '10px 20px', borderRadius: 24, textDecoration: 'none', fontWeight: 600 }}>
            🛒 {t('shop', 'cart')} {itemCount > 0 && <span style={{ background: '#fff', color: 'var(--pink,#b5838d)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{itemCount}</span>}
          </Link>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#b5838d' }}>
            <div style={{ fontSize: 36 }}>🌸</div>
            <p>Laden…</p>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <p style={{ marginTop: 12 }}>{t('shop', 'empty')}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {products.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(181,131,141,.12)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Stock badge */}
              {p.stock > 0 && p.stock <= 5 && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#e07070', color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 12, zIndex: 1 }}>
                  {t('shop', 'lastUnits')} ({p.stock})
                </div>
              )}
              {p.stock === 0 && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#999', color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 12, zIndex: 1 }}>
                  {t('shop', 'soldOut')}
                </div>
              )}

              <Link to={`/shop/${p.id}`}>
                {p.image ? (
                  <img src={`/uploads/${p.image}`} alt={name(p)}
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '4/3', background: '#f9e8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🌸</div>
                )}
              </Link>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to={`/shop/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#333' }}>{name(p)}</h3>
                </Link>

                <div style={{ color: '#b5838d', fontWeight: 700, fontSize: 18 }}>CHF {parseFloat(p.price).toFixed(2)}</div>

                <div style={{ color: '#aaa', fontSize: 12 }}>
                  {parseFloat(p.delivery_cost) > 0
                    ? `+ CHF ${parseFloat(p.delivery_cost).toFixed(2)} ${t('shop', 'delivery')}`
                    : t('shop', 'freeDelivery')}
                  {' · '}{p.delivery_days} {t('shop', 'deliveryDays')}
                </div>

                <button
                  onClick={() => handleAdd(p)}
                  disabled={p.stock === 0}
                  style={{
                    marginTop: 'auto',
                    background: p.stock === 0 ? '#ddd' : added[p.id] ? '#7ec87e' : 'var(--pink,#b5838d)',
                    color: p.stock === 0 ? '#999' : '#fff',
                    border: 'none',
                    borderRadius: 24,
                    padding: '10px 20px',
                    cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'background .3s',
                  }}
                >
                  {p.stock === 0 ? t('shop', 'soldOut') : added[p.id] ? '✓ ' + t('shop', 'added') : t('shop', 'addToCart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
