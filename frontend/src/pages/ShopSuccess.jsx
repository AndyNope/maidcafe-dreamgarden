import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function ShopSuccess() {
  const { t }         = useLang()
  const [params]      = useSearchParams()
  const { clearCart } = useCart()
  const orderId       = params.get('order_id')
  const isDev         = params.get('dev') === '1'

  useEffect(() => { clearCart() }, [clearCart])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 64 }}>🎉</div>
      <h1 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', fontSize: 32 }}>{t('shop', 'successTitle')}</h1>
      <p style={{ color: '#666', maxWidth: 480 }}>
        {t('shop', 'successBody')} {orderId && <strong>#{orderId}</strong>}
      </p>
      {isDev && (
        <p style={{ color: '#aaa', fontSize: 13, background: '#f5f5f5', borderRadius: 8, padding: '8px 16px' }}>
          Dev mode — Stripe nicht aktiv. Bestellung als bezahlt markiert.
        </p>
      )}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/shop" style={{ background: 'var(--pink,#b5838d)', color: '#fff', padding: '12px 28px', borderRadius: 24, textDecoration: 'none', fontWeight: 700 }}>
          {t('shop', 'continueShopping')}
        </Link>
        <Link to="/account/orders" style={{ background: '#f9e8ec', color: '#b5838d', padding: '12px 28px', borderRadius: 24, textDecoration: 'none', fontWeight: 700 }}>
          {t('shop', 'myOrders')}
        </Link>
      </div>
    </div>
  )
}
