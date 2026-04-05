import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useLang } from '../context/LangContext'

export default function VerifyEmail() {
  const { t }   = useLang()
  const [params] = useSearchParams()
  const token    = params.get('token')
  const [status, setStatus] = useState('loading') // 'loading'|'ok'|'error'
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('Kein Token'); return }
    api.get(`/api/customer/verify?token=${encodeURIComponent(token)}`)
      .then(r => { setStatus('ok'); setMsg(r.data.message) })
      .catch(e => { setStatus('error'); setMsg(e.response?.data?.error || 'Fehler') })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24 }}>
      {status === 'loading' && <><div style={{ fontSize: 48 }}>🌸</div><p>Verifiziere…</p></>}
      {status === 'ok'      && (
        <>
          <div style={{ fontSize: 64 }}>✅</div>
          <h2 style={{ color: '#b5838d' }}>{msg}</h2>
          <Link to="/account/login" style={{ background: 'var(--pink,#b5838d)', color: '#fff', padding: '12px 28px', borderRadius: 24, textDecoration: 'none', fontWeight: 700 }}>
            {t('account', 'login')}
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 64 }}>⚠️</div>
          <h2 style={{ color: '#c00' }}>{msg}</h2>
          <Link to="/account/login" style={{ color: '#b5838d' }}>← Zurück zum Login</Link>
        </>
      )}
    </div>
  )
}
