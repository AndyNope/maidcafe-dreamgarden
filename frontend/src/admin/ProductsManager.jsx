import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const initialProduct = {
  name: '', name_en: '', description: '', description_en: '',
  price: '', stock: '0', delivery_days: '7', delivery_cost: '0',
  image: '', available: true, sort_order: '0',
}

export default function ProductsManager() {
  const { token } = useAuth()
  const headers   = { Authorization: `Bearer ${token}` }

  const [products, setProducts] = useState([])
  const [form, setForm]         = useState(initialProduct)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [imageFile, setImageFile] = useState(null)
  const formRef = useRef(null)

  useEffect(() => { document.title = 'Produkte — DreamGarden'; load() }, [])

  const load = () => api.get('/api/admin/products', { headers }).then(r => setProducts(r.data))

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const uploadImage = async () => {
    if (!imageFile) return form.image
    const fd = new FormData(); fd.append('file', imageFile)
    const { data } = await api.post('/api/upload', fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } })
    return data.filename
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      const imageName = await uploadImage()
      const payload = { ...form, image: imageName || form.image, available: form.available ? 1 : 0 }

      if (editing) {
        await api.put(`/api/admin/products/${editing}`, payload, { headers })
        setMsg('✓ Gespeichert')
      } else {
        await api.post('/api/admin/products', payload, { headers })
        setMsg('✓ Produkt erstellt')
      }
      setForm(initialProduct); setEditing(null); setImageFile(null); load()
    } catch (err) {
      setMsg('Fehler: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const edit = (p) => {
    setEditing(p.id)
    setForm({ ...p, available: !!p.available })
    setImageFile(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const del = async (id) => {
    if (!confirm('Produkt löschen?')) return
    await api.delete(`/api/admin/products/${id}`, { headers })
    load()
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maid/30"

  return (
    <div>
      <h1 className="text-2xl font-bold text-dusk mb-6">🛍️ Shop-Produkte</h1>

      {/* Product list */}
      <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 overflow-x-auto mb-8">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fdf4f5', borderBottom: '1px solid #f0e0e4' }}>
              {['Bild','Name','Preis','Lager','Liefertage','Lieferkosten','Verf.',''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>Noch keine Produkte. Füge das erste hinzu!</td></tr>
            )}
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f9f0f2' }}>
                <td style={{ padding: '8px 14px' }}>
                  {p.image ? <img src={`/uploads/${p.image}`} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 48, height: 48, background: '#f9e8ec', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌸</div>}
                </td>
                <td style={{ padding: '8px 14px', fontWeight: 600, fontSize: 14 }}>{p.name}{p.name_en && <div style={{ fontSize: 12, color: '#aaa' }}>{p.name_en}</div>}</td>
                <td style={{ padding: '8px 14px' }}>CHF {parseFloat(p.price).toFixed(2)}</td>
                <td style={{ padding: '8px 14px' }}>{p.stock === 0 ? <span style={{ color: '#f44336', fontWeight: 600 }}>0</span> : p.stock}</td>
                <td style={{ padding: '8px 14px' }}>{p.delivery_days}d</td>
                <td style={{ padding: '8px 14px' }}>CHF {parseFloat(p.delivery_cost).toFixed(2)}</td>
                <td style={{ padding: '8px 14px' }}>
                  <span style={{ background: p.available ? '#e8f5e9' : '#fce4ec', color: p.available ? '#2e7d32' : '#c62828', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                    {p.available ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => edit(p)} style={{ background: '#f0e8ea', color: '#b5838d', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>✏️</button>
                    <button onClick={() => del(p.id)} style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form */}
      <div ref={formRef} className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-dusk mb-4">{editing ? '✏️ Produkt bearbeiten' : '+ Neues Produkt'}</h2>

        <form onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name (DE)*</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name (EN)</label>
              <input name="name_en" value={form.name_en} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Preis (CHF)*</label>
              <input name="price" value={form.price} onChange={handleChange} type="number" step="0.01" min="0" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lagerbestand (0 = unbegrenzt)</label>
              <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lieferzeit (Tage)</label>
              <input name="delivery_days" value={form.delivery_days} onChange={handleChange} type="number" min="0" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lieferkosten (CHF, 0 = kostenlos)</label>
              <input name="delivery_cost" value={form.delivery_cost} onChange={handleChange} type="number" step="0.01" min="0" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reihenfolge</label>
              <input name="sort_order" value={form.sort_order} onChange={handleChange} type="number" className={inputClass} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="available" id="avail" checked={form.available} onChange={handleChange} style={{ width: 18, height: 18 }} />
              <label htmlFor="avail" className="text-sm text-gray-700 cursor-pointer">Im Shop sichtbar</label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Beschreibung (DE)</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Beschreibung (EN)</label>
              <textarea name="description_en" value={form.description_en} onChange={handleChange} rows={3} className={inputClass} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="block text-xs text-gray-500 mb-1">Bild hochladen</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className={inputClass} />
            {form.image && !imageFile && (
              <div style={{ marginTop: 6 }}>
                <img src={`/uploads/${form.image}`} alt="" style={{ height: 60, borderRadius: 8 }} />
              </div>
            )}
          </div>

          {msg && <p style={{ color: msg.startsWith('✓') ? '#2e7d32' : '#c62828', marginBottom: 12, fontSize: 14 }}>{msg}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} style={{ background: '#b5838d', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 28px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '…' : editing ? 'Speichern' : 'Erstellen'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(initialProduct); setImageFile(null) }} style={{ background: '#eee', border: 'none', borderRadius: 20, padding: '10px 20px', cursor: 'pointer' }}>Abbrechen</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
