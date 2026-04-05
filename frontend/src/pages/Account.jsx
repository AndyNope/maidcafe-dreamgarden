import { useEffect, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { useLang } from '../context/LangContext'
import api from '../api/client'

// ── Sub-pages ─────────────────────────────────────────────────────────────────

function AccountHome() {
  const { customer, refresh } = useCustomerAuth()
  const { t } = useLang()

  useEffect(() => { refresh() }, [])

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '0 0 16px' }}>{t('account', 'welcome')}, {customer?.first_name || ''}!</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {[
          { to: 'orders',    icon: '📦', label: t('account', 'myOrders') },
          { to: 'addresses', icon: '📍', label: t('account', 'myAddresses') },
          { to: 'settings',  icon: '⚙️', label: t('account', 'settings') },
        ].map(l => (
          <Link key={l.to} to={l.to} style={{ background: '#f9f0f2', borderRadius: 14, padding: 24, textAlign: 'center', textDecoration: 'none', color: '#b5838d', fontWeight: 600, fontSize: 15 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{l.icon}</div>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function MyOrders() {
  const { token } = useCustomerAuth()
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const statusColor = { pending: '#f0a500', paid: '#4caf50', processing: '#2196f3', shipped: '#9c27b0', delivered: '#4caf50', cancelled: '#f44336' }
  const statusLabel = { pending: 'Ausstehend', paid: 'Bezahlt', processing: 'In Bearbeitung', shipped: 'Verschickt', delivered: 'Geliefert', cancelled: 'Storniert' }

  useEffect(() => {
    api.get('/api/customer/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '0 0 16px' }}>{t('account', 'myOrders')}</h3>
      {loading && <p style={{ color: '#aaa' }}>Laden…</p>}
      {!loading && orders.length === 0 && <p style={{ color: '#888' }}>{t('account', 'noOrders')}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.map(o => (
          <div key={o.id} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong>#{o.id}</strong>
              <span style={{ background: statusColor[o.status] || '#aaa', color: '#fff', padding: '2px 10px', borderRadius: 8, fontSize: 12 }}>{statusLabel[o.status] || o.status}</span>
            </div>
            <p style={{ color: '#888', fontSize: 13, margin: '0 0 4px' }}>{o.items_summary}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#aaa' }}>{new Date(o.created_at).toLocaleDateString('de-CH')}</span>
              <strong style={{ color: '#b5838d' }}>CHF {parseFloat(o.total).toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MyAddresses() {
  const { token } = useCustomerAuth()
  const { t } = useLang()
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState({ label: 'Home', first_name: '', last_name: '', street: '', city: '', postal_code: '', country: 'Schweiz', is_default: false })
  const [editing, setEditing] = useState(null)

  const load = () => api.get('/api/customer/addresses', { headers: { Authorization: `Bearer ${token}` } }).then(r => setAddresses(r.data))
  useEffect(() => { load() }, [token])

  const save = async () => {
    const body = { ...form, is_default: form.is_default ? 1 : 0 }
    if (editing) {
      await api.put(`/api/customer/addresses/${editing}`, body, { headers: { Authorization: `Bearer ${token}` } })
    } else {
      await api.post('/api/customer/addresses', body, { headers: { Authorization: `Bearer ${token}` } })
    }
    setEditing(null); setForm({ label: 'Home', first_name: '', last_name: '', street: '', city: '', postal_code: '', country: 'Schweiz', is_default: false })
    load()
  }

  const del = async (id) => { await api.delete(`/api/customer/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } }); load() }

  const edit = (a) => { setEditing(a.id); setForm({ ...a, is_default: !!a.is_default }) }

  const inputStyle = { width: '100%', border: '1px solid #e0c8cc', borderRadius: 8, padding: '8px 12px', fontSize: 14, boxSizing: 'border-box', marginBottom: 8 }

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '0 0 16px' }}>{t('account', 'myAddresses')}</h3>

      {addresses.length === 0 && !editing && <p style={{ color: '#888' }}>{t('account', 'noAddresses')}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {addresses.map(a => (
          <div key={a.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <strong>{a.label}</strong> {a.is_default ? <span style={{ background: '#b5838d', color: '#fff', borderRadius: 6, padding: '1px 8px', fontSize: 11, marginLeft: 6 }}>Standard</span> : null}
              <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>{a.first_name} {a.last_name}, {a.street}, {a.postal_code} {a.city}, {a.country}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => edit(a)} style={{ background: 'none', border: '1px solid #e0c8cc', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', color: '#b5838d', fontSize: 13 }}>✏️</button>
              <button onClick={() => del(a.id)} style={{ background: 'none', border: '1px solid #ffcccc', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', color: '#c00', fontSize: 13 }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, background: '#f9f0f2', borderRadius: 14, padding: 20 }}>
        <h4 style={{ margin: '0 0 12px', color: '#b5838d' }}>{editing ? t('account', 'editAddress') : t('account', 'newAddress')}</h4>
        <input value={form.label}       onChange={e => setForm(f => ({ ...f, label:       e.target.value }))} placeholder="Label (z.B. Zuhause)" style={inputStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder={t('shop', 'firstName')} style={inputStyle} />
          <input value={form.last_name}  onChange={e => setForm(f => ({ ...f, last_name:  e.target.value }))} placeholder={t('shop', 'lastName')}  style={inputStyle} />
        </div>
        <input value={form.street}      onChange={e => setForm(f => ({ ...f, street:      e.target.value }))} placeholder={t('shop', 'street')} style={inputStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0 12px' }}>
          <input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="PLZ" style={inputStyle} />
          <input value={form.city}        onChange={e => setForm(f => ({ ...f, city:        e.target.value }))} placeholder={t('shop', 'city')} style={inputStyle} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 12 }}>
          <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} /> {t('account', 'setDefault')}
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} style={{ background: 'var(--pink,#b5838d)', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 22px', fontWeight: 600, cursor: 'pointer' }}>{t('shared', 'save')}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ label: 'Home', first_name: '', last_name: '', street: '', city: '', postal_code: '', country: 'Schweiz', is_default: false }) }} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 20, padding: '9px 22px', cursor: 'pointer' }}>Abbrechen</button>}
        </div>
      </div>
    </div>
  )
}

function AccountSettings() {
  const { customer, token, refresh } = useCustomerAuth()
  const { t } = useLang()
  const [firstName, setFirstName] = useState(customer?.first_name || '')
  const [lastName,  setLastName]  = useState(customer?.last_name  || '')
  const [oldPass, setOldPass] = useState(''); const [newPass, setNewPass] = useState('')
  const [nameMsg, setNameMsg]   = useState(''); const [passMsg, setPassMsg] = useState('')

  const saveName = async () => {
    await api.put('/api/customer/me', { first_name: firstName, last_name: lastName }, { headers: { Authorization: `Bearer ${token}` } })
    refresh(); setNameMsg('✓ Gespeichert')
    setTimeout(() => setNameMsg(''), 2000)
  }

  const changePass = async () => {
    try {
      await api.post('/api/customer/change-password', { old_password: oldPass, new_password: newPass }, { headers: { Authorization: `Bearer ${token}` } })
      setOldPass(''); setNewPass(''); setPassMsg('✓ Passwort geändert')
    } catch (e) { setPassMsg(e.response?.data?.error || 'Fehler') }
    setTimeout(() => setPassMsg(''), 3000)
  }

  const inputStyle = { width: '100%', border: '1px solid #e0c8cc', borderRadius: 8, padding: '8px 12px', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: '0 0 16px' }}>{t('account', 'settings')}</h3>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)', marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px' }}>{t('account', 'personalInfo')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Vorname" style={inputStyle} />
          <input value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Nachname" style={inputStyle} />
        </div>
        <button onClick={saveName} style={{ background: 'var(--pink,#b5838d)', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 22px', fontWeight: 600, cursor: 'pointer' }}>{t('shared', 'save')}</button>
        {nameMsg && <span style={{ marginLeft: 12, color: '#4caf50', fontSize: 14 }}>{nameMsg}</span>}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
        <h4 style={{ margin: '0 0 12px' }}>{t('account', 'changePassword')}</h4>
        <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Aktuelles Passwort" style={inputStyle} />
        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Neues Passwort (min. 8)" style={inputStyle} />
        <button onClick={changePass} style={{ background: 'var(--pink,#b5838d)', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 22px', fontWeight: 600, cursor: 'pointer' }}>{t('account', 'changePassword')}</button>
        {passMsg && <span style={{ marginLeft: 12, color: '#4caf50', fontSize: 14 }}>{passMsg}</span>}
      </div>
    </div>
  )
}

// ── Main Account shell ────────────────────────────────────────────────────────

export default function Account() {
  const { customer, isLoggedIn, logout } = useCustomerAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: 'none', color: isActive ? '#b5838d' : '#666',
    fontWeight: isActive ? 700 : 500, fontSize: 15,
    padding: '10px 0', borderBottom: isActive ? '2px solid #b5838d' : '2px solid transparent',
  })

  if (!isLoggedIn) {
    navigate('/account/login')
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg,#fff9f5)', paddingTop: '80px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#b5838d', margin: 0, fontSize: 28 }}>{t('account', 'myAccount')}</h1>
          <button onClick={() => { logout(); navigate('/') }} style={{ background: 'none', border: '1px solid #e0c8cc', borderRadius: 20, padding: '8px 18px', cursor: 'pointer', color: '#999', fontSize: 14 }}>
            {t('account', 'logout')}
          </button>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #eee', marginBottom: 28 }}>
          <NavLink to="/account"          end style={navLinkStyle}>{t('account', 'overview')}</NavLink>
          <NavLink to="/account/orders"   style={navLinkStyle}>{t('account', 'myOrders')}</NavLink>
          <NavLink to="/account/addresses"style={navLinkStyle}>{t('account', 'myAddresses')}</NavLink>
          <NavLink to="/account/settings" style={navLinkStyle}>{t('account', 'settings')}</NavLink>
        </div>

        <Routes>
          <Route index element={<AccountHome />} />
          <Route path="orders"    element={<MyOrders />} />
          <Route path="addresses" element={<MyAddresses />} />
          <Route path="settings"  element={<AccountSettings />} />
        </Routes>
      </div>
    </div>
  )
}
