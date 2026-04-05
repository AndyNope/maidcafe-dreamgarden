import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ROLES = ['maid','butler','manager','helfer','admin']

export default function UserManager() {
  const { token } = useAuth()
  const headers   = { Authorization: `Bearer ${token}` }

  const [tab, setTab]               = useState('customers')
  const [customers, setCustomers]   = useState([])
  const [staff, setStaff]           = useState([])
  const [credModal, setCredModal]   = useState(null) // {memberId, memberName}
  const [credForm, setCredForm]     = useState({ email: '', password: '' })
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState('')

  useEffect(() => { document.title = 'Benutzerverwaltung — DreamGarden' }, [])
  useEffect(() => { if (tab === 'customers') loadCustomers(); else loadStaff() }, [tab])

  const loadCustomers = () => api.get('/api/admin/customers', { headers }).then(r => setCustomers(r.data))
  const loadStaff     = () => api.get('/api/admin/staff', { headers }).then(r => setStaff(r.data))

  const deleteCustomer = async (id, email) => {
    if (!confirm(`Kunden "${email}" wirklich löschen?`)) return
    await api.delete(`/api/admin/customers/${id}`, { headers })
    loadCustomers()
  }

  const openCredModal = (m) => {
    setCredModal({ memberId: m.id, memberName: m.name })
    setCredForm({ email: m.staff_email || '', password: '' })
    setMsg('')
  }

  const saveCredentials = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      await api.post(`/api/admin/staff/${credModal.memberId}/credentials`, credForm, { headers })
      setMsg('✓ Zugangsdaten gesetzt')
      loadStaff()
    } catch (err) {
      setMsg('Fehler: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const revokeCredentials = async (id, name) => {
    if (!confirm(`Staff-Zugang von "${name}" widerrufen?`)) return
    try {
      await api.delete(`/api/admin/staff/${id}/credentials`, { headers })
      loadStaff()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  const updateRole = async (id, role) => {
    try {
      await api.put(`/api/admin/members/${id}/role`, { role }, { headers })
      loadStaff()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maid/30 w-full"

  return (
    <div>
      <h1 className="text-2xl font-bold text-dusk mb-6">👤 Benutzerverwaltung</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['customers','🛍️ Kunden'],['staff','🎀 Staff / Mitglieder']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: tab === key ? '#b5838d' : '#f9e8ec',
              color: tab === key ? '#fff' : '#b5838d',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Customers Tab */}
      {tab === 'customers' && (
        <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fdf4f5', borderBottom: '1px solid #f0e0e4' }}>
                {['E-Mail','Name','Verifiziert','Registriert',''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>Keine Kunden vorhanden.</td></tr>
              )}
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f9f0f2' }}>
                  <td style={{ padding: '8px 14px', fontSize: 14 }}>{c.email}</td>
                  <td style={{ padding: '8px 14px', fontSize: 14 }}>{c.first_name} {c.last_name}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ background: c.email_verified ? '#e8f5e9' : '#fff8e1', color: c.email_verified ? '#2e7d32' : '#e65100', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                      {c.email_verified ? '✓ Ja' : '⏳ Ausstehend'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 13, color: '#aaa' }}>{c.created_at?.slice(0,10)}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <button onClick={() => deleteCustomer(c.id, c.email)} style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Tab */}
      {tab === 'staff' && (
        <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fdf4f5', borderBottom: '1px solid #f0e0e4' }}>
                {['Name','Rolle','Staff-Login','Letzter Login','Aktionen'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>Keine Mitglieder vorhanden.</td></tr>
              )}
              {staff.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f9f0f2' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, fontSize: 14 }}>{m.name}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <select
                      value={m.role}
                      onChange={e => updateRole(m.id, e.target.value)}
                      style={{ border: '1px solid #f0e0e4', borderRadius: 8, padding: '4px 8px', fontSize: 13, background: '#fdf4f5', cursor: 'pointer' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 13 }}>
                    {m.staff_email
                      ? <span style={{ color: '#2e7d32' }}>✓ {m.staff_email}</span>
                      : <span style={{ color: '#aaa' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 13, color: '#aaa' }}>{m.staff_last_login?.slice(0,10) || '—'}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openCredModal(m)} style={{ background: '#f0e8ea', color: '#b5838d', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>🔑 Zugang</button>
                      {m.staff_email && (
                        <button onClick={() => revokeCredentials(m.id, m.name)} style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credentials Modal */}
      {credModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#6b3f4a', marginBottom: 16 }}>🔑 Zugangsdaten für {credModal.memberName}</h3>
            <form onSubmit={saveCredentials}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9b7d84', marginBottom: 4 }}>Staff-E-Mail</label>
                <input type="email" className={inputClass} value={credForm.email} onChange={e => setCredForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9b7d84', marginBottom: 4 }}>Neues Passwort</label>
                <input type="password" className={inputClass} value={credForm.password} onChange={e => setCredForm(f => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="mind. 8 Zeichen" />
              </div>
              {msg && <p style={{ color: msg.startsWith('✓') ? '#2e7d32' : '#c62828', fontSize: 14, marginBottom: 12 }}>{msg}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#b5838d', color: '#fff', border: 'none', borderRadius: 20, padding: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? '…' : 'Speichern'}
                </button>
                <button type="button" onClick={() => setCredModal(null)} style={{ flex: 1, background: '#eee', border: 'none', borderRadius: 20, padding: '10px', cursor: 'pointer' }}>Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
