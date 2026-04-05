import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function ShopProduct() {
  const { id }        = useParams()
  const { t, lang }   = useLang()
  const { addItem }   = useCart()
  const navigate      = useNavigate()
  const [product, setProduct] = useState(null)
  const [qty, setQty]         = useState(1)
  const [added, setAdded]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 120, color: '#b5838d' }}>🌸</div>
  if (!product) return null

  const name = (lang === 'en' && product.name_en) ? product.name_en : product.name
  const desc = (lang === 'en' && product.description_en) ? product.description_en : product.description

  const handleAdd = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <Link to="/shop" style={{ color: '#b5838d', textDecoration: 'none', fontSize: 14 }}>← {t('shop', 'backToShop')}</Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 40, marginTop: 24 }}>
          {/* Image */}
          <div>
            {product.image ? (
              <img src={`/uploads/${product.image}`} alt={name}
                style={{ width: '100%', borderRadius: 16, objectFit: 'cover', aspectRatio: '1/1', boxShadow: '0 4px 24px rgba(181,131,141,.15)' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1/1', background: '#f9e8ec', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🌸</div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#333', margin: 0 }}>{name}</h1>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#b5838d' }}>CHF {parseFloat(product.price).toFixed(2)}</div>

            {desc && <p style={{ color: '#555', lineHeight: 1.7 }}>{desc}</p>}

            <div style={{ background: '#f9f0f2', borderRadius: 12, padding: 16, fontSize: 14, color: '#666', lineHeight: 1.8 }}>
              <div>📦 {t('shop', 'deliveryTime')}: <strong>{product.delivery_days} {t('shop', 'days')}</strong></div>
              <div>🚚 {t('shop', 'deliveryCost')}: <strong>
                {parseFloat(product.delivery_cost) > 0
                  ? `CHF ${parseFloat(product.delivery_cost).toFixed(2)}`
                  : t('shop', 'freeDelivery')}
              </strong></div>
              {product.stock > 0 && (
                <div>📦 {t('shop', 'stock')}: <strong style={{ color: product.stock <= 5 ? '#e07070' : 'inherit' }}>
                  {product.stock <= 5 ? `${t('shop', 'lastUnits')} (${product.stock})` : t('shop', 'inStock')}
                </strong></div>
              )}
            </div>

            {/* Quantity */}
            {product.stock !== 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontWeight: 600 }}>{t('shop', 'qty')}:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0c8cc', borderRadius: 24, overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#b5838d' }}>−</button>
                  <span style={{ padding: '0 12px', fontWeight: 700 }}>{qty}</span>
                  <button onClick={() => setQty(q => product.stock > 0 ? Math.min(product.stock, q + 1) : q + 1)}
                    style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#b5838d' }}>+</button>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              style={{
                background: product.stock === 0 ? '#ddd' : added ? '#7ec87e' : 'var(--pink,#b5838d)',
                color: product.stock === 0 ? '#999' : '#fff',
                border: 'none',
                borderRadius: 24,
                padding: '14px 32px',
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: 16,
                transition: 'background .3s',
              }}
            >
              {product.stock === 0 ? t('shop', 'soldOut') : added ? '✓ ' + t('shop', 'added') : t('shop', 'addToCart')}
            </button>

            <Link to="/cart" style={{ textAlign: 'center', color: '#b5838d', textDecoration: 'none', fontWeight: 600 }}>
              🛒 {t('shop', 'viewCart')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
