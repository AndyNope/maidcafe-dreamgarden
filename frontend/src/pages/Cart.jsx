import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { useLang } from '../context/LangContext'

export default function Cart() {
  const { t } = useLang()
  const { items, removeItem, updateQty, subtotal, deliveryCost, total, clearCart } = useCart()
  const { customer, isLoggedIn, token } = useCustomerAuth()
  const navigate   = useNavigate()
  const [shipping, setShipping] = useState({
    first_name: customer?.first_name || '',
    last_name:  customer?.last_name  || '',
    street: '', city: '', postal_code: '', country: 'Schweiz',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleShipping = (e) => setShipping(s => ({ ...s, [e.target.name]: e.target.value }))

  const handleCheckout = async () => {
    if (!shipping.first_name || !shipping.last_name || !shipping.street || !shipping.city || !shipping.postal_code) {
      setError(t('shop', 'fillAllFields'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const headers = isLoggedIn ? { Authorization: `Bearer ${token}` } : {}
      const { data } = await api.post('/api/shop/checkout', {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping,
        customer_id: customer?.id || null,
      }, { headers })

      if (data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url
      } else if (data.dev_mode) {
        // Docker dev mode without Stripe
        clearCart()
        navigate(`/shop/success?order_id=${data.order_id}&dev=1`)
      }
    } catch (err) {
      setError(err.response?.data?.error || t('shared', 'error'))
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🛒</div>
        <p style={{ color: '#888', fontSize: 18 }}>{t('shop', 'cartEmpty')}</p>
        <Link to="/shop" style={{ color: '#b5838d', fontWeight: 700, textDecoration: 'none' }}>← {t('shop', 'continueShopping')}</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 32, alignItems: 'start' }}>

        {/* Cart items */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '0 0 20px' }}>{t('shop', 'cart')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.product_id} style={{ background: '#fff', borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                {item.image && <img src={`/uploads/${item.image}`} alt={item.product_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ color: '#b5838d', fontSize: 14 }}>CHF {item.unit_price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateQty(item.product_id, item.quantity - 1)} style={{ width: 28, height: 28, border: '1px solid #e0c8cc', borderRadius: '50%', cursor: 'pointer', background: 'none', color: '#b5838d', fontSize: 16 }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, item.quantity + 1)} style={{ width: 28, height: 28, border: '1px solid #e0c8cc', borderRadius: '50%', cursor: 'pointer', background: 'none', color: '#b5838d', fontSize: 16 }}>+</button>
                </div>
                <button onClick={() => removeItem(item.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18 }}>✕</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: 4 }}>
              <span>{t('shop', 'subtotal')}</span><span>CHF {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: 8 }}>
              <span>{t('shop', 'delivery')}</span>
              <span>{deliveryCost > 0 ? `CHF ${deliveryCost.toFixed(2)}` : t('shop', 'freeDelivery')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: '#b5838d' }}>
              <span>Total</span><span>CHF {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping + checkout */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '0 0 20px' }}>{t('shop', 'shipping')}</h2>

          {!isLoggedIn && (
            <div style={{ background: '#f9f0f2', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, color: '#666' }}>
              <Link to="/account/login" style={{ color: '#b5838d', fontWeight: 700 }}>{t('shop', 'loginForHistory')}</Link> {t('shop', 'orGuest')}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['first_name', t('shop', 'firstName')],
              ['last_name',  t('shop', 'lastName')],
              ['street',     t('shop', 'street')],
              ['city',       t('shop', 'city')],
              ['postal_code',t('shop', 'postalCode')],
              ['country',    t('shop', 'country')],
            ].map(([field, label]) => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: 13, color: '#888', marginBottom: 4 }}>{label}</label>
                <input
                  name={field}
                  value={shipping[field]}
                  onChange={handleShipping}
                  style={{ width: '100%', border: '1px solid #e0c8cc', borderRadius: 10, padding: '10px 14px', fontSize: 14, background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          {error && <p style={{ color: '#e07070', marginTop: 12, fontSize: 14 }}>{error}</p>}

          <div style={{ marginTop: 16, fontSize: 13, color: '#aaa', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔒</span> {t('shop', 'secureStripe')}
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{ width: '100%', marginTop: 16, background: loading ? '#ddd' : 'var(--pink,#b5838d)', color: '#fff', border: 'none', borderRadius: 24, padding: '14px', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '…' : `${t('shop', 'payNow')} CHF ${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
