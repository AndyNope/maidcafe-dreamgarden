import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Save, X, Loader, Upload } from 'lucide-react'
import api from '../api/client'

const ROLES  = ['maid', 'butler', 'manager']
const ROLE_DE = { maid: 'Maid', butler: 'Butler', manager: 'Manager' }
const EMPTY   = { name: '', name_jp: '', role: 'maid', description: '', image: '', theme_color: '#FF6B9D', active: true, sort_order: 0 }

function MemberForm({ initial, onSave, onCancel }) {
  const [form, setForm]       = useState({ ...EMPTY, ...initial })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm((f) => ({ ...f, image: data.url }))
    } catch {
      setError('Bild-Upload fehlgeschlagen.')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 mb-6"
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-dusk">{initial?.id ? 'Mitglied bearbeiten' : 'Neues Mitglied'}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className="input-kawaii" placeholder="Name *" value={form.name} onChange={set('name')} required />
          <input className="input-kawaii" placeholder="Japanischer Name (optional)" value={form.name_jp} onChange={set('name_jp')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select className="input-kawaii" value={form.role} onChange={set('role')}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_DE[r]}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-dusk flex-shrink-0">Farbe:</label>
            <input
              type="color"
              value={form.theme_color}
              onChange={set('theme_color')}
              className="w-12 h-10 rounded-xl border-2 border-sakura cursor-pointer bg-transparent"
            />
            <input
              className="input-kawaii flex-1"
              placeholder="#FF6B9D"
              value={form.theme_color}
              onChange={set('theme_color')}
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        <textarea
          className="input-kawaii resize-none"
          rows={3}
          placeholder="Beschreibung"
          value={form.description}
          onChange={set('description')}
        />

        <div className="flex gap-3 items-center">
          <input className="input-kawaii flex-1" placeholder="Bild URL" value={form.image} onChange={set('image')} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 px-4 py-2.5 rounded-2xl bg-sakura/30 text-maid font-bold text-sm hover:bg-sakura/50 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {form.image && (
          <img src={form.image} alt="Preview" className="h-32 w-32 rounded-2xl object-cover" />
        )}

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            className="input-kawaii"
            placeholder="Reihenfolge"
            value={form.sort_order}
            onChange={set('sort_order')}
            min={0}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${form.active ? 'bg-maid' : 'bg-gray-200'}`}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-dusk">{form.active ? 'Aktiv' : 'Inaktiv'}</span>
          </label>
        </div>

        {error && <p className="text-rose-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Speichern
          </button>
          <button type="button" onClick={onCancel}
            className="px-6 py-2.5 bg-gray-100 text-dusk font-bold rounded-full hover:bg-gray-200 transition-colors">
            Abbrechen
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default function MembersManager() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    document.title = 'Mitglieder — DreamGarden CMS'
    load()
  }, [])

  const load = () => {
    setLoading(true)
    api.get('/api/members').then(({ data }) => setMembers(data)).finally(() => setLoading(false))
  }

  const save = async (form) => {
    if (form.id) await api.put(`/api/members/${form.id}`, form)
    else         await api.post('/api/members', form)
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    await api.delete(`/api/members/${id}`)
    setDeleting(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-dusk">Mitglieder</h1>
        {!editing && (
          <button onClick={() => setEditing({})}
            className="flex items-center gap-2 px-5 py-2.5 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-colors text-sm">
            <Plus className="w-4 h-4" /> Neues Mitglied
          </button>
        )}
      </div>

      {editing !== null && (
        <MemberForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader className="w-7 h-7 text-maid animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.length === 0 && (
            <div className="col-span-full text-center py-16 text-dusk/40">Noch keine Mitglieder vorhanden.</div>
          )}
          {members.map((m) => (
            <motion.div key={m.id} className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-4 flex gap-4" layout>
              <div
                className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white shadow"
                style={{ background: m.theme_color }}
              >
                {m.image
                  ? <img src={m.image} alt={m.name} className="w-14 h-14 rounded-full object-cover" />
                  : m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dusk truncate">{m.name}</p>
                <p className="text-xs text-dusk/40">{ROLE_DE[m.role]} · {m.active ? 'Aktiv' : 'Inaktiv'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(m)} className="p-1.5 rounded-lg text-dusk/40 hover:text-maid hover:bg-maid/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleting(m.id)} className="p-1.5 rounded-lg text-dusk/40 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {deleting && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-kawaii p-8 max-w-sm w-full shadow-kawaii-lg text-center"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <Trash2 className="w-10 h-10 text-rose-400 mx-auto mb-4" />
              <p className="font-bold text-dusk mb-2">Mitglied löschen?</p>
              <p className="text-dusk/50 text-sm mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => remove(deleting)} className="px-6 py-2.5 bg-rose-500 text-white font-bold rounded-full hover:bg-rose-600 transition-colors">Löschen</button>
                <button onClick={() => setDeleting(null)} className="px-6 py-2.5 bg-gray-100 text-dusk font-bold rounded-full hover:bg-gray-200 transition-colors">Abbrechen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
