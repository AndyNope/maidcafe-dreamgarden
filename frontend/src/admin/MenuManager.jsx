import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Save, X, Loader, Upload, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../api/client'

const EMPTY_ITEM = { category_id: '', name: '', name_jp: '', description: '', price: '', image: '', available: true, sort_order: 0 }
const EMPTY_CAT  = { name: '', name_jp: '', icon: '', sort_order: 0 }

function ItemForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm]       = useState({ ...EMPTY_ITEM, ...initial })
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
    <motion.div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 mb-4"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-dusk">{initial?.id ? 'Item bearbeiten' : 'Neues Item'}</h4>
        <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <select className="input-kawaii" value={form.category_id} onChange={set('category_id')}>
          <option value="">Kategorie wählen...</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="input-kawaii" placeholder="Name *" value={form.name} onChange={set('name')} required />
          <input className="input-kawaii" placeholder="Japanischer Name" value={form.name_jp} onChange={set('name_jp')} />
        </div>

        <textarea className="input-kawaii resize-none" rows={2} placeholder="Beschreibung" value={form.description} onChange={set('description')} />

        <div className="flex gap-3 items-center">
          <input className="input-kawaii flex-1" placeholder="Bild URL" value={form.image} onChange={set('image')} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex-shrink-0 px-4 py-2.5 rounded-2xl bg-sakura/30 text-maid font-bold text-sm hover:bg-sakura/50 transition-colors flex items-center gap-2 disabled:opacity-60">
            {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dusk/50 text-xs font-bold pointer-events-none select-none bg-cream/80 pr-1">CHF</span>
            <input type="number" step="0.05" min="0" className="input-kawaii pl-14" placeholder="0.00"
              value={form.price} onChange={set('price')} required />
          </div>
          <input type="number" min={0} className="input-kawaii" placeholder="Reihenfolge" value={form.sort_order} onChange={set('sort_order')} />
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.available ? 'bg-maid' : 'bg-gray-200'}`}
              onClick={() => setForm((f) => ({ ...f, available: !f.available }))}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-dusk">Verfügbar</span>
          </label>
        </div>

        {error && <p className="text-rose-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-colors disabled:opacity-60 flex items-center gap-2 text-sm">
            {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Speichern
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-100 text-dusk font-bold rounded-full hover:bg-gray-200 transition-colors text-sm">Abbrechen</button>
        </div>
      </form>
    </motion.div>
  )
}

export default function MenuManager() {
  const [menu, setMenu]       = useState([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem]   = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [expanded, setExpanded]   = useState({})
  const [newCat, setNewCat]       = useState(false)
  const [catForm, setCatForm]     = useState({ ...EMPTY_CAT })
  const [savingCat, setSavingCat] = useState(false)

  useEffect(() => {
    document.title = 'Menü — DreamGarden CMS'
    load()
  }, [])

  const load = () => {
    setLoading(true)
    api.get('/api/menu').then(({ data }) => {
      setMenu(data)
      if (data.length > 0 && Object.keys(expanded).length === 0) {
        setExpanded({ [data[0].id]: true })
      }
    }).finally(() => setLoading(false))
  }

  const allCategories = menu.map((c) => ({ id: c.id, name: c.name }))

  const saveItem = async (form) => {
    if (form.id) await api.put(`/api/menu/${form.id}`, form)
    else         await api.post('/api/menu', form)
    setEditItem(null)
    load()
  }

  const removeItem = async (id) => {
    await api.delete(`/api/menu/${id}`)
    setDeleteItem(null)
    load()
  }

  const saveCategory = async (e) => {
    e.preventDefault()
    setSavingCat(true)
    try {
      await api.post('/api/menu/categories', catForm)
      setNewCat(false)
      setCatForm({ ...EMPTY_CAT })
      load()
    } finally {
      setSavingCat(false)
    }
  }

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-dusk">Menü</h1>
        <div className="flex gap-2">
          <button onClick={() => { setNewCat(true); setEditItem(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-lavender/50 text-lavender-dark font-bold rounded-full text-sm hover:bg-lavender/70 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Kategorie
          </button>
          <button onClick={() => { setEditItem({}); setNewCat(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-colors text-sm">
            <Plus className="w-3.5 h-3.5" /> Item
          </button>
        </div>
      </div>

      {/* New category form */}
      <AnimatePresence>
        {newCat && (
          <motion.div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-5 mb-5"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-dusk">Neue Kategorie</h4>
              <button onClick={() => setNewCat(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveCategory} className="flex flex-wrap gap-3">
              <input className="input-kawaii flex-1" placeholder="Name *" value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} required />
              <input className="input-kawaii flex-1" placeholder="Japanischer Name" value={catForm.name_jp}
                onChange={(e) => setCatForm((f) => ({ ...f, name_jp: e.target.value }))} />
              <input className="input-kawaii w-36" placeholder="Icon (z.B. Cup)" value={catForm.icon}
                onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))} />
              <button type="submit" disabled={savingCat}
                className="px-5 py-2.5 bg-lavender/60 text-lavender-dark font-bold rounded-full hover:bg-lavender/80 transition-colors flex items-center gap-2 text-sm disabled:opacity-60">
                {savingCat ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Hinzufügen
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New/edit item form */}
      {editItem !== null && (
        <ItemForm initial={editItem} categories={allCategories} onSave={saveItem} onCancel={() => setEditItem(null)} />
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader className="w-7 h-7 text-maid animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {menu.map((cat) => (
            <div key={cat.id} className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                {expanded[cat.id]
                  ? <ChevronDown className="w-4 h-4 text-maid flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-dusk/40 flex-shrink-0" />}
                <span className="font-bold text-dusk flex-1">{cat.name}</span>
                {cat.name_jp && <span className="text-xs text-dusk/40 font-japanese">{cat.name_jp}</span>}
                <span className="text-xs bg-gray-100 text-dusk/50 px-2 py-0.5 rounded-full">{cat.items.length} Items</span>
              </button>

              {/* Items */}
              <AnimatePresence>
                {expanded[cat.id] && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {cat.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-dusk text-sm truncate">{item.name}</p>
                            <p className="text-xs text-dusk/40">CHF {Number(item.price).toFixed(2)}</p>
                          </div>
                          {!item.available && (
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">n.v.</span>
                          )}
                          <button onClick={() => setEditItem(item)} className="p-1.5 rounded-lg text-dusk/40 hover:text-maid hover:bg-maid/10 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteItem(item.id)} className="p-1.5 rounded-lg text-dusk/40 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      {cat.items.length === 0 && (
                        <div className="px-5 py-4 text-sm text-dusk/30 text-center">Noch keine Items in dieser Kategorie.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {menu.length === 0 && (
            <div className="text-center py-16 text-dusk/40">Noch keine Menü-Kategorien vorhanden.</div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteItem && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-kawaii p-8 max-w-sm w-full shadow-kawaii-lg text-center"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <Trash2 className="w-10 h-10 text-rose-400 mx-auto mb-4" />
              <p className="font-bold text-dusk mb-2">Item löschen?</p>
              <p className="text-dusk/50 text-sm mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => removeItem(deleteItem)} className="px-6 py-2.5 bg-rose-500 text-white font-bold rounded-full hover:bg-rose-600 transition-colors">Löschen</button>
                <button onClick={() => setDeleteItem(null)} className="px-6 py-2.5 bg-gray-100 text-dusk font-bold rounded-full hover:bg-gray-200 transition-colors">Abbrechen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
