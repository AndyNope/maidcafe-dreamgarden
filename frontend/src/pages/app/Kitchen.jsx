import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useStaffAuth } from '../../context/StaffAuthContext'

const STATUS_COLOR = { pending: '#f0a500', preparing: '#2196f3', ready: '#4caf50', served: '#aaa', cancelled: '#f44336' }
const STATUS_LABEL = { pending: 'Ausstehend', preparing: 'Zubereitung', ready: '✅ Bereit', served: 'Serviert', cancelled: 'Storniert' }

// Returns elapsed minutes since a timestamp string
const ageMinutes = (createdAt) => {
  if (!createdAt) return 0
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)
}

const NEXT_STATUS = {
  pending:   ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['served'],
  served:    [],
  cancelled: [],
}

export default function Kitchen() {
  const { token } = useStaffAuth()
  const navigate  = useNavigate()
  const headers   = { Authorization: `Bearer ${token}` }
  const [items, setItems]     = useState([])
  const [filter, setFilter]   = useState('all') // 'all'|'food'|'drink'
  const [loading, setLoading] = useState(true)
  const [cancelNote, setCancelNote] = useState('')
  const [cancelId, setCancelId]     = useState(null)

  const load = useCallback(() => {
    const params = filter !== 'all' ? `?category=${filter}` : ''
    api.get(`/api/kitchen/items${params}`, { headers })
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [filter, token])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [load])

  const updateStatus = async (id, status, note = '') => {
    await api.put(`/api/kitchen/items/${id}/status`, { status, cancel_note: note }, { headers })
    load()
  }

  const toggleSoldOut = async (menuItemId, currentlyAvailable) => {
    await api.put(`/api/kitchen/menu-items/${menuItemId}/sold-out`, { available: currentlyAvailable ? 0 : 1 }, { headers })
    load()
  }

  const pending   = items.filter(i => i.status === 'pending')
  const preparing = items.filter(i => i.status === 'preparing')
  const ready     = items.filter(i => i.status === 'ready')

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: '#fff', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#b5838d', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>←</button>
          <strong style={{ fontSize: 18 }}>🍳 Küchen-Dashboard</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 20, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>🔄</button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#16213e', padding: '10px 16px', display: 'flex', gap: 8 }}>
        {[['all','Alle'],['food','🍜 Essen'],['drink','🥤 Getränke']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ background: filter === val ? '#b5838d' : 'rgba(255,255,255,.1)', border: 'none', borderRadius: 20, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontWeight: filter === val ? 700 : 400, fontSize: 14 }}>
            {lbl}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', paddingTop: 60, fontSize: 32 }}>🌸</div>}

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, padding: 16 }}>
        {/* Pending */}
        <KitchenColumn title="⏳ Ausstehend" items={pending} color="#f0a500" onUpdate={updateStatus} onCancelClick={(id) => { setCancelId(id); setCancelNote('') }} toggleSoldOut={toggleSoldOut} />
        {/* Preparing */}
        <KitchenColumn title="👨‍🍳 Zubereitung" items={preparing} color="#2196f3" onUpdate={updateStatus} onCancelClick={(id) => { setCancelId(id); setCancelNote('') }} toggleSoldOut={toggleSoldOut} />
        {/* Ready */}
        <KitchenColumn title="✅ Bereit" items={ready} color="#4caf50" onUpdate={updateStatus} onCancelClick={(id) => { setCancelId(id); setCancelNote('') }} toggleSoldOut={toggleSoldOut} />
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 360, color: '#333' }}>
            <h3 style={{ margin: '0 0 16px', color: '#b5838d' }}>Artikel stornieren</h3>
            <textarea
              value={cancelNote}
              onChange={e => setCancelNote(e.target.value)}
              placeholder="Grund (z.B. ausverkauft)…"
              style={{ width: '100%', border: '1px solid #e0c8cc', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { updateStatus(cancelId, 'cancelled', cancelNote); setCancelId(null) }} style={{ flex: 1, background: '#f44336', color: '#fff', border: 'none', borderRadius: 20, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Stornieren</button>
              <button onClick={() => setCancelId(null)} style={{ flex: 1, background: '#eee', border: 'none', borderRadius: 20, padding: '10px', cursor: 'pointer' }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KitchenColumn({ title, items, color, onUpdate, onCancelClick, toggleSoldOut }) {
  const NEXT = { pending: 'preparing', preparing: 'ready', ready: 'served' }

  return (
    <div style={{ background: '#16213e', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ background: color, padding: '10px 16px', fontWeight: 700, fontSize: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span style={{ background: 'rgba(0,0,0,.2)', borderRadius: 12, padding: '2px 10px', fontSize: 14 }}>{items.length}</span>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '70vh', overflowY: 'auto' }}>
        {items.length === 0 && <p style={{ color: '#555', textAlign: 'center', padding: 16, fontSize: 14 }}>Nichts hier</p>}
        {items.map(item => {
          const age    = ageMinutes(item.created_at)
          const urgent = age >= 15
          const warn   = age >= 8 && age < 15
          const cardBg = urgent ? '#3b0a0a' : warn ? '#2a1e00' : '#0f3460'
          const border = urgent ? '2px solid #f44336' : warn ? '2px solid #f0a500' : '2px solid transparent'
          return (
          <div key={item.id} style={{ background: cardBg, borderRadius: 12, padding: 14, border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{item.item_name} × {item.quantity}</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{
                  background: urgent ? '#f44336' : warn ? '#f0a500' : 'rgba(255,255,255,.15)',
                  color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 700,
                  animation: urgent ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }}>
                  {age}min
                </span>
                <span style={{ background: item.item_category === 'drink' ? '#1565c0' : '#4a148c', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
                  {item.item_category === 'drink' ? '🥤' : '🍜'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>
              🪑 Tisch {item.table_number}
              {item.assigned_guest && <span> · 👤 {item.assigned_guest}</span>}
            </div>
            {item.notes && <div style={{ fontSize: 12, color: '#ffd700', marginBottom: 6 }}>📝 {item.notes}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NEXT[item.status] && (
                <button onClick={() => onUpdate(item.id, NEXT[item.status])} style={{ flex: 1, background: color, color: '#fff', border: 'none', borderRadius: 20, padding: '8px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  → {NEXT[item.status] === 'preparing' ? 'Zubereitung' : NEXT[item.status] === 'ready' ? '✅ Bereit' : '✓ Serviert'}
                </button>
              )}
              <button onClick={() => onCancelClick(item.id)} style={{ background: 'rgba(244,67,54,.3)', color: '#f44336', border: 'none', borderRadius: 20, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
            {item.menu_item_id && (
              <button onClick={() => toggleSoldOut(item.menu_item_id, true)} style={{ marginTop: 6, width: '100%', background: 'rgba(255,255,255,.05)', color: '#f0a500', border: 'none', borderRadius: 10, padding: '6px', cursor: 'pointer', fontSize: 12 }}>
                ❌ Ausverkauft markieren
              </button>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}
