import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/client'
import { useStaffAuth } from '../../context/StaffAuthContext'

const ITEM_STATUS_COLOR = { pending: '#f0a500', preparing: '#2196f3', ready: '#4caf50', served: '#aaa', cancelled: '#f44336' }
const ITEM_STATUS_LABEL = { pending: 'Ausstehend', preparing: 'Zubereitung', ready: 'Bereit', served: 'Serviert', cancelled: 'Storniert' }

export default function OrderView() {
  const { id }          = useParams()
  const { token }       = useStaffAuth()
  const navigate        = useNavigate()
  const headers         = { Authorization: `Bearer ${token}` }

  const [order, setOrder]     = useState(null)
  const [menu, setMenu]       = useState([])
  const [categories, setCats] = useState([])
  const [selCat, setSelCat]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [guest, setGuest]     = useState('')
  const [tab, setTab]         = useState('order') // 'order' | 'bill'

  const load = () => api.get(`/api/app/orders/${id}`, { headers }).then(r => setOrder(r.data))

  useEffect(() => {
    Promise.all([
      load(),
      api.get('/api/menu', { headers }).then(r => {
        // /api/menu returns [{id, name, items:[...]}, ...] — flatten to item list
        const flat = r.data.flatMap(cat =>
          (cat.items || []).map(item => ({ ...item, category_id: cat.id }))
        )
        setMenu(flat)
      }),
      api.get('/api/menu/categories', { headers }).then(r => { setCats(r.data); setSelCat(r.data[0]?.id || null) }),
    ]).finally(() => setLoading(false))
  }, [id])

  const addMenuItem = async (menuItem) => {
    await api.post(`/api/app/orders/${id}/items`, {
      items: [{ menu_item_id: menuItem.id, quantity: 1, assigned_guest: guest || null }]
    }, { headers })
    await load()
  }

  const removeItem = async (itemId) => {
    await api.delete(`/api/app/orders/${id}/items/${itemId}`, { headers })
    await load()
  }

  const closeOrder = async () => {
    if (!confirm('Bestellung abschliessen?')) return
    await api.put(`/api/app/orders/${id}/close`, {}, { headers })
    navigate('/app')
  }

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 100, fontSize: 32 }}>🌸</div>
  if (!order) return <p style={{ padding: 24 }}>Bestellung nicht gefunden.</p>

  const activeItems = order.items.filter(i => i.status !== 'cancelled')
  const tableTotal = activeItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  const filteredMenu = menu.filter(m => m.available && (!selCat || m.category_id == selCat))

  return (
    <div style={{ minHeight: '100vh', background: '#fff9f5', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#b5838d', color: '#fff', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', marginRight: 8 }}>←</button>
          <strong>Tisch {order.table_number}</strong>
          {order.table_name && <span style={{ opacity: .8, marginLeft: 6, fontSize: 14 }}>{order.table_name}</span>}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>CHF {tableTotal.toFixed(2)}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #eee' }}>
        {[['order','📝 Bestellen'],['bill','💳 Rechnung']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === key ? 700 : 500, color: tab === key ? '#b5838d' : '#888', borderBottom: tab === key ? '2px solid #b5838d' : '2px solid transparent', fontSize: 15 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'order' && (
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
          {/* Left: current order items */}
          <div>
            <h3 style={{ margin: '0 0 12px', color: '#333' }}>Aktuelle Bestellung</h3>

            {/* Guest label input */}
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#666', whiteSpace: 'nowrap' }}>👤 Für:</span>
              <input
                value={guest}
                onChange={e => setGuest(e.target.value)}
                placeholder="Gast (optional)"
                style={{ flex: 1, border: '1px solid #e0c8cc', borderRadius: 10, padding: '8px 12px', fontSize: 14 }}
              />
            </div>

            {activeItems.length === 0 && <p style={{ color: '#aaa', fontSize: 14 }}>Noch keine Artikel.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeItems.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.item_name} × {item.quantity}</div>
                    {item.assigned_guest && <div style={{ fontSize: 12, color: '#aaa' }}>👤 {item.assigned_guest}</div>}
                  </div>
                  <span style={{ background: ITEM_STATUS_COLOR[item.status], color: '#fff', fontSize: 11, borderRadius: 6, padding: '2px 8px' }}>{ITEM_STATUS_LABEL[item.status]}</span>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#b5838d', whiteSpace: 'nowrap' }}>
                    CHF {(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  {item.status === 'pending' && (
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {order.status === 'open' && (
              <button onClick={closeOrder} style={{ marginTop: 16, width: '100%', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 24, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                ✅ Bestellung abschliessen
              </button>
            )}
          </div>

          {/* Right: menu picker */}
          {order.status === 'open' && (
            <div>
              <h3 style={{ margin: '0 0 12px', color: '#333' }}>Menü hinzufügen</h3>

              {/* Category filter */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelCat(c.id)} style={{ whiteSpace: 'nowrap', background: selCat === c.id ? '#b5838d' : '#f0e8ea', color: selCat === c.id ? '#fff' : '#b5838d', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    {c.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredMenu.map(m => (
                  <div key={m.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)', cursor: 'pointer' }} onClick={() => addMenuItem(m)}>
                    {m.image && <img src={`/uploads/${m.image}`} alt={m.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      {m.description && <div style={{ fontSize: 12, color: '#aaa' }}>{m.description.slice(0, 60)}</div>}
                    </div>
                    <div style={{ fontWeight: 700, color: '#b5838d', whiteSpace: 'nowrap' }}>CHF {parseFloat(m.price).toFixed(2)}</div>
                    <span style={{ fontSize: 22, color: '#b5838d' }}>+</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'bill' && (
        <SplitBill order={order} token={token} onReload={load} />
      )}
    </div>
  )
}

// ── SplitBill embedded component ─────────────────────────────────────────────

function SplitBill({ order, token, onReload }) {
  const headers = { Authorization: `Bearer ${token}` }
  const [bills, setBills]       = useState([])
  const [guests, setGuests]     = useState(['Gast 1', 'Gast 2'])
  const [assignments, setAssign] = useState({}) // itemId → guestName
  const [newGuest, setNewGuest] = useState('')
  const [loading, setLoading]   = useState(false)
  const [createdBills, setCreatedBills] = useState(null)

  useEffect(() => {
    api.get(`/api/app/orders/${order.id}/bills`, { headers }).then(r => setBills(r.data))
    // Pre-assign items by their already assigned_guest
    const init = {}
    order.items.filter(i => i.status !== 'cancelled').forEach(i => {
      if (i.assigned_guest) init[i.id] = i.assigned_guest
    })
    setAssign(init)
  }, [order.id])

  const addGuest = () => {
    if (newGuest.trim()) { setGuests(g => [...g, newGuest.trim()]); setNewGuest('') }
  }

  const assign = (itemId, guestName) => setAssign(a => ({ ...a, [itemId]: guestName }))

  const createBills = async () => {
    setLoading(true)
    const billMap = {}
    const activeItems = order.items.filter(i => i.status !== 'cancelled')
    activeItems.forEach(item => {
      const g = assignments[item.id] || 'Unzugeordnet'
      if (!billMap[g]) billMap[g] = []
      billMap[g].push(item.id)
    })

    const billsPayload = Object.entries(billMap).map(([guest_name, item_ids]) => ({ guest_name, item_ids }))
    const { data } = await api.post(`/api/app/orders/${order.id}/bills`, { bills: billsPayload }, { headers })
    setCreatedBills(data.bills)
    setLoading(false)
    onReload()
  }

  const markPaid = async (billId, method = 'cash') => {
    await api.put(`/api/app/bills/${billId}/pay`, { payment_method: method }, { headers })
    api.get(`/api/app/orders/${order.id}/bills`, { headers }).then(r => setBills(r.data))
  }

  const activeItems = order.items.filter(i => i.status !== 'cancelled')
  const tableTotal  = activeItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', color: '#333' }}>💳 Rechnung aufteilen</h3>

      {/* Existing bills */}
      {bills.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#b5838d', margin: '0 0 10px' }}>Aktuelle Rechnungen</h4>
          {bills.map(b => (
            <div key={b.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{b.guest_name}</div>
                <div style={{ fontSize: 18, color: '#b5838d', fontWeight: 700 }}>CHF {parseFloat(b.total).toFixed(2)}</div>
                {b.payment_status === 'pending' && b.stripe_checkout_url && (
                  <div style={{ marginTop: 6 }}>
                    <a href={b.stripe_checkout_url} target="_blank" rel="noreferrer"
                      style={{ color: '#b5838d', fontSize: 13, textDecoration: 'none', border: '1px solid #b5838d', borderRadius: 8, padding: '3px 10px' }}>
                      🔗 Zahlungslink
                    </a>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#aaa' }}>QR scannen lassen</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {b.payment_status === 'paid' ? (
                  <span style={{ background: '#4caf50', color: '#fff', borderRadius: 8, padding: '3px 12px', fontSize: 13 }}>Bezahlt ✓</span>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => markPaid(b.id, 'cash')} style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>Bar</button>
                    <button onClick={() => markPaid(b.id, 'twint')} style={{ background: '#1a9ed4', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>TWINT</button>
                    <button onClick={() => markPaid(b.id, 'stripe')} style={{ background: '#b5838d', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>Karte</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign items to guests */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={newGuest} onChange={e => setNewGuest(e.target.value)} placeholder="Gast hinzufügen…" style={{ flex: 1, border: '1px solid #e0c8cc', borderRadius: 10, padding: '8px 12px', fontSize: 14 }} onKeyDown={e => e.key === 'Enter' && addGuest()} />
          <button onClick={addGuest} style={{ background: '#b5838d', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer' }}>+</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {guests.map(g => <span key={g} style={{ background: '#f0e8ea', color: '#b5838d', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>{g}</span>)}
        </div>

        {activeItems.map(item => (
          <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.item_name}</div>
              <div style={{ fontSize: 13, color: '#b5838d' }}>CHF {(item.unit_price * item.quantity).toFixed(2)}</div>
            </div>
            <select
              value={assignments[item.id] || ''}
              onChange={e => assign(item.id, e.target.value)}
              style={{ border: '1px solid #e0c8cc', borderRadius: 8, padding: '6px 10px', fontSize: 14, background: '#fff' }}
            >
              <option value="">Nicht zugeordnet</option>
              {guests.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
        <span>Total Tisch:</span><span style={{ color: '#b5838d' }}>CHF {tableTotal.toFixed(2)}</span>
      </div>

      <button onClick={createBills} disabled={loading || activeItems.length === 0} style={{ width: '100%', background: '#b5838d', color: '#fff', border: 'none', borderRadius: 24, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        {loading ? '…' : '💳 Rechnungen erstellen'}
      </button>
    </div>
  )
}
