import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { useLang } from '../context/LangContext'
import api from '../api/client'

export default function CustomerLogin() {
  const { t }      = useLang()
  const { login }  = useCustomerAuth()
  const navigate   = useNavigate()
  const [tab, setTab]       = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Login form
  const [loginEmail, setLoginEmail]   = useState('')
  const [loginPass,  setLoginPass]    = useState('')

  // Register form
  const [regEmail,   setRegEmail]   = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [regFirst,   setRegFirst]   = useState('')
  const [regLast,    setRegLast]    = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(loginEmail, loginPass)
      navigate('/account')
    } catch (err) {
      const msg = err.response?.data?.error || t('shared', 'error')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      await api.post('/api/customer/register', {
        email: regEmail, password: regPass,
        first_name: regFirst, last_name: regLast,
      })
      setSuccess(t('account', 'registerSuccess'))
      setTab('login')
    } catch (err) {
      setError(err.response?.data?.error || t('shared', 'error'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', border: '1px solid #e0c8cc', borderRadius: 10, padding: '10px 14px', fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 4px 32px rgba(181,131,141,.12)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', textAlign: 'center', margin: '0 0 24px', fontSize: 28 }}>
          {tab === 'login' ? t('account', 'login') : t('account', 'register')}
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid #e0c8cc' }}>
          {['login','register'].map(t2 => (
            <button key={t2} onClick={() => setTab(t2)} style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: tab === t2 ? 'var(--pink,#b5838d)' : 'transparent', color: tab === t2 ? '#fff' : '#999', transition: 'all .2s' }}>
              {t2 === 'login' ? t('account', 'login') : t('account', 'register')}
            </button>
          ))}
        </div>

        {error   && <div style={{ background: '#fef0f0', color: '#c00', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{error}</div>}
        {success && <div style={{ background: '#f0fef0', color: '#080', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" placeholder="E-Mail" required style={inputStyle} />
            <input value={loginPass}  onChange={e => setLoginPass(e.target.value)}  type="password" placeholder={t('account', 'password')} required style={inputStyle} />
            <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--pink,#b5838d)', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '…' : t('account', 'login')}
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Link to="/account/forgot-password" style={{ color: '#b5838d', fontSize: 13 }}>{t('account', 'forgotPassword')}</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <input value={regFirst} onChange={e => setRegFirst(e.target.value)} placeholder={t('shop', 'firstName')} style={inputStyle} />
              <input value={regLast}  onChange={e => setRegLast(e.target.value)}  placeholder={t('shop', 'lastName')}  style={inputStyle} />
            </div>
            <input value={regEmail} onChange={e => setRegEmail(e.target.value)} type="email" placeholder="E-Mail" required style={inputStyle} />
            <input value={regPass}  onChange={e => setRegPass(e.target.value)}  type="password" placeholder={`${t('account', 'password')} (min. 8)`} required minLength={8} style={inputStyle} />
            <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--pink,#b5838d)', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '…' : t('account', 'register')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
