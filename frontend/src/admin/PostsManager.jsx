import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Save, X, Loader, Eye, EyeOff, Upload } from 'lucide-react'
import api from '../api/client'

const EMPTY = { title: '', slug: '', excerpt: '', content: '', cover_image: '', published: false }

function PostForm({ initial, onSave, onCancel }) {
  const [form, setForm]       = useState({ ...EMPTY, ...initial })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef               = useRef()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const togglePub = () => setForm((f) => ({ ...f, published: !f.published }))

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, cover_image: data.url }))
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
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-dusk">{initial?.id ? 'Post bearbeiten' : 'Neuer Post'}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="input-kawaii"
          placeholder="Titel *"
          value={form.title}
          onChange={set('title')}
          required
        />
        <input
          className="input-kawaii"
          placeholder="Slug (auto generiert wenn leer)"
          value={form.slug}
          onChange={set('slug')}
        />
        <textarea
          className="input-kawaii resize-none"
          rows={2}
          placeholder="Kurzbeschreibung (Excerpt)"
          value={form.excerpt}
          onChange={set('excerpt')}
        />
        <textarea
          className="input-kawaii resize-y font-mono text-sm"
          rows={12}
          placeholder="Inhalt (HTML erlaubt)"
          value={form.content}
          onChange={set('content')}
        />

        {/* Cover image */}
        <div className="flex gap-3 items-center">
          <input
            className="input-kawaii flex-1"
            placeholder="Cover-Bild URL"
            value={form.cover_image}
            onChange={set('cover_image')}
          />
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

        {form.cover_image && (
          <img src={form.cover_image} alt="Preview" className="h-32 rounded-2xl object-cover" />
        )}

        {/* Publish toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${form.published ? 'bg-maid' : 'bg-gray-200'}`}
            onClick={togglePub}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.published ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-medium text-dusk">
            {form.published ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        </label>

        {error && <p className="text-rose-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-gray-100 text-dusk font-bold rounded-full hover:bg-gray-200 transition-colors">
            Abbrechen
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default function PostsManager() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | {} | post
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    document.title = 'Blog Posts — DreamGarden CMS'
    load()
  }, [])

  const load = () => {
    setLoading(true)
    api.get('/api/posts')
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false))
  }

  const save = async (form) => {
    if (form.id) {
      await api.put(`/api/posts/${form.id}`, form)
    } else {
      await api.post('/api/posts', form)
    }
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    await api.delete(`/api/posts/${id}`)
    setDeleting(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-dusk">Blog Posts</h1>
        {!editing && (
          <button
            onClick={() => setEditing({})}
            className="flex items-center gap-2 px-5 py-2.5 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Neuer Post
          </button>
        )}
      </div>

      {editing !== null && (
        <PostForm
          initial={editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader className="w-7 h-7 text-maid animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {posts.length === 0 && (
            <div className="text-center py-16 text-dusk/40">Noch keine Posts vorhanden.</div>
          )}
          {posts.map((post) => (
            <motion.div
              key={post.id}
              className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-5 flex items-center gap-4"
              layout
            >
              {post.cover_image && (
                <img src={post.cover_image} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    post.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {post.published ? 'Veröffentlicht' : 'Entwurf'}
                  </span>
                </div>
                <p className="font-bold text-dusk truncate">{post.title}</p>
                <p className="text-xs text-dusk/40 mt-0.5">/{post.slug}</p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditing(post)}
                  className="p-2 rounded-xl text-dusk/50 hover:text-maid hover:bg-maid/10 transition-colors"
                  aria-label="Bearbeiten"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleting(post.id)}
                  className="p-2 rounded-xl text-dusk/50 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  aria-label="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-kawaii p-8 max-w-sm w-full shadow-kawaii-lg text-center"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            >
              <Trash2 className="w-10 h-10 text-rose-400 mx-auto mb-4" />
              <p className="font-bold text-dusk mb-2">Post löschen?</p>
              <p className="text-dusk/50 text-sm mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => remove(deleting)}
                  className="px-6 py-2.5 bg-rose-500 text-white font-bold rounded-full hover:bg-rose-600 transition-colors"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeleting(null)}
                  className="px-6 py-2.5 bg-gray-100 text-dusk font-bold rounded-full hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
