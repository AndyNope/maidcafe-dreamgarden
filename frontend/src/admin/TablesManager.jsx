import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const initialTable = { number: '', name: '', seats: '4', active: true, sort_order: '0' }

export default function TablesManager() {
  const { token } = useAuth()
  const headers   = { Authorization: `Bearer ${token}` }

  const [tables, setTables]   = useState([])
  const [form, setForm]       = useState(initialTable)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const formRef               = useRef(null)

  useEffect(() => { document.title = 'Tische — DreamGarden'; load() }, [])

  const load = () => api.get('/api/admin/tables', { headers }).then(r => setTables(r.data))

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      if (editing) {
        await api.put(`/api/admin/tables/${editing}`, { ...form, active: form.active ? 1 : 0 }, { headers })
        setMsg('✓ Gespeichert')
      } else {
        await api.post('/api/admin/tables', { ...form, active: form.active ? 1 : 0 }, { headers })
        setMsg('✓ Tisch erstellt')
      }
      setForm(initialTable); setEditing(null); load()
    } catch (err) {
      setMsg('Fehler: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const edit = (t) => {
    setEditing(t.id)
    setForm({ ...t, active: !!t.active })
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const del = async (id, num) => {
    if (!confirm(`Tisch ${num} löschen?`)) return
    await api.delete(`/api/admin/tables/${id}`, { headers })
    load()
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maid/30"

  return (
    <div>
      <h1 className="text-2xl font-bold text-dusk mb-6">🪑 Tischverwaltung</h1>

      {/* Table list */}
      <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 overflow-x-auto mb-8">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fdf4f5', borderBottom: '1px solid #f0e0e4' }}>
              {['Nr.','Name','Plätze','Aktiv','Reihenfolge',''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tables.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>Noch keine Tische. Füge den ersten hinzu!</td></tr>
            )}
            {tables.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f9f0f2' }}>
                <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 16 }}>{t.number}</td>
                <td style={{ padding: '8px 14px', fontSize: 14 }}>{t.name || <span style={{ color: '#ccc' }}>—</span>}</td>
                <td style={{ padding: '8px 14px', fontSize: 14 }}>👤 {t.seats}</td>
                <td style={{ padding: '8px 14px' }}>
                  <span style={{ background: t.active ? '#e8f5e9' : '#fce4ec', color: t.active ? '#2e7d32' : '#c62828', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                    {t.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td style={{ padding: '8px 14px', fontSize: 14 }}>{t.sort_order}</td>
                <td style={{ padding: '8px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => edit(t)} style={{ background: '#f0e8ea', color: '#b5838d', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>✏️</button>
                    <button onClick={() => del(t.id, t.number)} style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form */}
      <div ref={formRef} className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-dusk mb-4">{editing ? '✏️ Tisch bearbeiten' : '+ Neuer Tisch'}</h2>
        <form onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tischnummer*</label>
              <input name="number" value={form.number} onChange={handleChange} type="number" min="1" required className={inputClass} placeholder="z.B. 1" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name (optional)</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="z.B. Fenster-Tisch" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plätze</label>
              <input name="seats" value={form.seats} onChange={handleChange} type="number" min="1" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reihenfolge</label>
              <input name="sort_order" value={form.sort_order} onChange={handleChange} type="number" className={inputClass} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="active" id="tactive" checked={form.active} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <label htmlFor="tactive" className="text-sm text-gray-700 cursor-pointer">Tisch aktiv</label>
            </div>
          </div>

          {msg && <p style={{ color: msg.startsWith('✓') ? '#2e7d32' : '#c62828', marginBottom: 12, fontSize: 14 }}>{msg}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} style={{ background: '#b5838d', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 28px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '…' : editing ? 'Speichern' : 'Erstellen'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(initialTable) }} style={{ background: '#eee', border: 'none', borderRadius: 20, padding: '10px 20px', cursor: 'pointer' }}>Abbrechen</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
