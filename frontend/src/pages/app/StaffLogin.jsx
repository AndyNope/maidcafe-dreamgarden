import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../../context/StaffAuthContext'

export default function StaffLogin() {
  const { login } = useStaffAuth()
  const navigate  = useNavigate()
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, pass)
      navigate('/app')
    } catch (err) {
      setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff9f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 4px 32px rgba(181,131,141,.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>🌸</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '8px 0 4px', fontSize: 24 }}>Staff Login</h2>
          <p style={{ color: '#aaa', fontSize: 14 }}>Dream Garden Maid Café</p>
        </div>

        {error && <div style={{ background: '#fef0f0', color: '#c00', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-Mail"
            required
            style={{ border: '1px solid #e0c8cc', borderRadius: 12, padding: '12px 16px', fontSize: 15 }}
          />
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Passwort"
            required
            style={{ border: '1px solid #e0c8cc', borderRadius: 12, padding: '12px 16px', fontSize: 15 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#b5838d', color: '#fff', border: 'none', borderRadius: 24, padding: '14px', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '…' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
