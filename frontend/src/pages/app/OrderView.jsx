import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Users, Receipt, Plus, Minus, X, Check, Loader } from 'lucide-react'
import api from '../../api/client'
import { useStaffAuth } from '../../context/StaffAuthContext'

const STATUS_COLOR = {
  pending:   'bg-amber-400',
  preparing: 'bg-blue-400',
  ready:     'bg-green-500',
  served:    'bg-gray-400',
  cancelled: 'bg-red-400',
}
const STATUS_LABEL = {
  pending:   'Ausstehend',
  preparing: 'In Zubereitung',
  ready:     '✓ Bereit',
  served:    'Serviert',
  cancelled: 'Storniert',
}

export default function OrderView() {
  const { id }       = useParams()
  const { token }    = useStaffAuth()
  const navigate     = useNavigate()
  const headers      = { Authorization: `Bearer ${token}` }

  const [order, setOrder]     = useState(null)
  const [menu, setMenu]       = useState([])
  const [cats, setCats]       = useState([])
  const [selCat, setSelCat]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('order')
  const [guest, setGuest]     = useState('')

  // Qty picker modal
  const [qtyItem, setQtyItem] = useState(null)
  const [qty, setQty]         = useState(1)
  const [adding, setAdding]   = useState(false)

  const load = () =>
    api.get(`/api/app/orders/${id}`, { headers }).then(r => setOrder(r.data))

  // Live refresh every 20s — kitchen status changes appear without manual reload
  useEffect(() => {
    const interval = setInterval(load, 20_000)
    return () => clearInterval(interval)
  }, [id, token])

  useEffect(() => {
    Promise.all([
      load(),
      api.get('/api/menu', { headers }).then(r => {
        const flat = r.data.flatMap(cat =>
          (cat.items || []).map(item => ({ ...item, category_id: cat.id }))
        )
        setMenu(flat)
      }),
      api.get('/api/menu/categories', { headers }).then(r => {
        setCats(r.data)
        setSelCat(r.data[0]?.id || null)
      }),
    ]).finally(() => setLoading(false))
  }, [id])

  const openQtyModal = (menuItem) => { setQtyItem(menuItem); setQty(1) }

  const confirmAdd = async () => {
    setAdding(true)
    try {
      await api.post(`/api/app/orders/${id}/items`, {
        items: [{ menu_item_id: qtyItem.id, quantity: qty, assigned_guest: guest || null }]
      }, { headers })
      setQtyItem(null)
      await load()
    } finally {
      setAdding(false)
    }
  }

  const removeItem = async (itemId) => {
    await api.delete(`/api/app/orders/${id}/items/${itemId}`, { headers })
    await load()
  }

  const closeOrder = async () => {
    if (!confirm('Tisch wirklich abschliessen?\nDie Bestellung wird archiviert und du kommst zur Tischübersicht zurück.')) return
    await api.put(`/api/app/orders/${id}/close`, {}, { headers })
    navigate('/app')
  }

  if (loading) return (
    <div className="min-h-screen bg-dream flex items-center justify-center">
      <div className="text-5xl animate-float">🌸</div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-dream flex items-center justify-center">
      <p className="text-dusk/50">Bestellung nicht gefunden.</p>
    </div>
  )

  const activeItems  = order.items.filter(i => i.status !== 'cancelled')
  const tableTotal   = activeItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const filteredMenu = menu.filter(m => m.available && (!selCat || m.category_id == selCat))

  return (
    <div className="min-h-screen bg-dream pb-24">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-kawaii"
        style={{ background: 'linear-gradient(135deg, #4A1942 0%, #7B2F7A 100%)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app')}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-white font-bold text-lg leading-tight">
              Tisch {order.table_number}
              {order.table_name && <span className="font-normal opacity-60 ml-2 text-sm">{order.table_name}</span>}
            </h1>
            <p className="text-white/50 text-xs">
              {order.staff_name && `${order.staff_name} · `}Bestellung #{order.id}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-xl">CHF {tableTotal.toFixed(2)}</div>
          <div className="text-white/40 text-xs">{activeItems.length} Artikel</div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-sakura/30 px-4 flex sticky top-[62px] z-10">
        {[['order', '📝', 'Bestellen'], ['bill', '💳', 'Rechnung']].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 py-3 px-5 text-sm font-bold border-b-2 transition-colors ${
              tab === key
                ? 'border-maid text-maid'
                : 'border-transparent text-dusk/40 hover:text-dusk'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Order Tab ────────────────────────────────────────────────────── */}
      {tab === 'order' && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Current order items */}
          <div className="space-y-3">
            <h2 className="font-display font-bold text-dusk text-lg">Aktuelle Bestellung</h2>

            {/* Guest label */}
            <div className="bg-white rounded-kawaii shadow-kawaii border border-sakura/30 p-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-maid flex-shrink-0" />
              <input
                value={guest}
                onChange={e => setGuest(e.target.value)}
                placeholder="Items für Gast (optional)…"
                className="flex-1 bg-transparent text-sm text-dusk placeholder-dusk/30 outline-none"
              />
            </div>

            {activeItems.length === 0 && (
              <div className="text-center py-10 text-dusk/30 text-sm">
                <div className="text-3xl mb-2">🍽️</div>
                Noch keine Artikel bestellt.
              </div>
            )}

            <div className="space-y-2">
              {activeItems.map(item => (
                <div key={item.id}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-kawaii border border-sakura/20">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dusk text-sm">
                      {item.item_name}
                      <span className="text-dusk/40 font-normal"> × {item.quantity}</span>
                    </p>
                    {item.assigned_guest && (
                      <p className="text-xs text-dusk/40">👤 {item.assigned_guest}</p>
                    )}
                  </div>
                  <span className={`text-white text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                  <span className="text-maid font-bold text-sm whitespace-nowrap flex-shrink-0">
                    CHF {(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                  {item.status === 'pending' && (
                    <button onClick={() => removeItem(item.id)}
                      className="p-1 rounded-full text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {order.status === 'open' && activeItems.length > 0 && (
              <button onClick={closeOrder}
                className="w-full mt-2 py-3 rounded-kawaii border-2 border-dusk/20 text-dusk/50 font-bold hover:bg-dusk/5 hover:border-dusk/30 transition-colors text-sm">
                🔒 Tisch abschliessen
              </button>
            )}
          </div>

          {/* Menu picker */}
          {order.status === 'open' && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-dusk text-lg">Menü hinzufügen</h2>

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {cats.map(c => (
                  <button key={c.id} onClick={() => setSelCat(c.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold border transition-colors flex-shrink-0 ${
                      selCat === c.id
                        ? 'bg-maid text-white border-maid shadow-kawaii'
                        : 'bg-white text-dusk/60 border-sakura/40 hover:border-maid/40'
                    }`}>
                    {c.name}
                    {c.name_jp && <span className="ml-1 opacity-50 font-japanese text-xs">{c.name_jp}</span>}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredMenu.map(m => (
                  <button key={m.id} onClick={() => openQtyModal(m)}
                    className="w-full bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-kawaii border border-sakura/20 hover:border-maid/40 hover:shadow-kawaii-lg transition-all text-left group">
                    {m.image
                      ? <img src={`/uploads/${m.image}`} alt={m.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-xl bg-sakura/30 flex items-center justify-center text-xl flex-shrink-0">🌸</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-dusk text-sm">{m.name}</p>
                      {m.name_jp && <p className="text-xs text-dusk/40 font-japanese">{m.name_jp}</p>}
                      {m.description && <p className="text-xs text-dusk/40 truncate">{m.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-maid text-sm">CHF {parseFloat(m.price).toFixed(2)}</p>
                      <span className="text-xs text-maid/40 group-hover:text-maid transition-colors">+ hinzufügen</span>
                    </div>
                  </button>
                ))}
                {filteredMenu.length === 0 && (
                  <p className="text-center py-8 text-dusk/30 text-sm">Keine Artikel verfügbar.</p>
                )}
              </div>
            </div>
          )}

          {order.status !== 'open' && (
            <div className="text-center py-8 text-dusk/40 text-sm col-span-full">Tisch ist geschlossen.</div>
          )}
        </div>
      )}

      {/* ── Bill Tab ──────────────────────────────────────────────────────── */}
      {tab === 'bill' && (
        <SplitBill order={order} token={token} onReload={load} />
      )}

      {/* ── Qty Picker Modal ──────────────────────────────────────────────── */}
      {qtyItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setQtyItem(null) }}>
          <div className="bg-white rounded-kawaii shadow-kawaii-lg p-6 w-full max-w-sm">
            {/* Item preview */}
            <div className="flex items-center gap-4 mb-5">
              {qtyItem.image
                ? <img src={`/uploads/${qtyItem.image}`} alt={qtyItem.name}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                : <div className="w-16 h-16 rounded-2xl bg-sakura/30 flex items-center justify-center text-3xl flex-shrink-0">🌸</div>
              }
              <div>
                <p className="font-display font-bold text-dusk text-lg leading-tight">{qtyItem.name}</p>
                {qtyItem.name_jp && <p className="text-xs text-dusk/40 font-japanese">{qtyItem.name_jp}</p>}
                <p className="text-maid font-bold mt-1">CHF {parseFloat(qtyItem.price).toFixed(2)} / Stk.</p>
              </div>
            </div>

            {guest && (
              <p className="text-xs text-dusk/50 bg-sakura/20 rounded-xl px-3 py-2 mb-4 font-medium">
                👤 Für: {guest}
              </p>
            )}

            {/* Qty stepper */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-full bg-sakura/40 text-dusk font-bold hover:bg-sakura transition-colors flex items-center justify-center">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-4xl font-display font-bold text-dusk w-12 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-11 h-11 rounded-full bg-maid text-white font-bold hover:bg-maid-dark transition-colors flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-dusk/50 text-sm mb-5">
              Gesamt: <strong className="text-dusk text-base">CHF {(parseFloat(qtyItem.price) * qty).toFixed(2)}</strong>
            </p>

            <div className="flex gap-3">
              <button onClick={() => setQtyItem(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-100 text-dusk/60 font-bold hover:bg-gray-50 transition-colors">
                Abbrechen
              </button>
              <button onClick={confirmAdd} disabled={adding}
                className="flex-1 py-3 rounded-2xl bg-maid text-white font-bold shadow-kawaii hover:bg-maid-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {adding ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Zur Küche →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SplitBill Component ───────────────────────────────────────────────────────
function SplitBill({ order, token, onReload }) {
  const headers = { Authorization: `Bearer ${token}` }

  const [bills, setBills]        = useState([])
  const [mode, setMode]          = useState('even')   // 'even' | 'manual'
  const [guestCount, setGuestCount] = useState(2)     // for equal split
  const [guests, setGuests]      = useState([])       // for manual mode
  const [assignments, setAssign] = useState({})       // itemId → guestLabel
  const [newGuest, setNewGuest]  = useState('')
  const [loading, setLoading]    = useState(false)
  const [submitted, setSubmitted] = useState(false)   // prevent double-submit
  const [error, setError]        = useState('')

  const activeItems = order.items.filter(i => i.status !== 'cancelled')
  const tableTotal  = activeItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const perPerson   = guestCount > 0 ? tableTotal / guestCount : tableTotal

  const reloadBills = () =>
    api.get(`/api/app/orders/${order.id}/bills`, { headers }).then(r => setBills(r.data))

  useEffect(() => {
    reloadBills()
    // Pre-fill manual assignments from assigned_guest stored on items
    const init = {}
    activeItems.forEach(i => { if (i.assigned_guest) init[i.id] = i.assigned_guest })
    setAssign(init)
  }, [order.id])

  const addGuest = () => {
    const label = newGuest.trim() || `Gast ${guests.length + 1}`
    setGuests(g => [...g, label])
    setNewGuest('')
  }

  const removeGuest = (label) =>
    setGuests(g => g.filter(x => x !== label))

  const createEvenBills = async () => {
    if (submitted || loading) return
    setLoading(true); setSubmitted(true); setError('')
    try {
      const share = Math.round((tableTotal / guestCount) * 100) / 100
      const bills = Array.from({ length: guestCount }, (_, i) => ({
        guest_name: `Gast ${i + 1}`,
        item_ids: [],
        custom_total: i === guestCount - 1
          ? Math.round((tableTotal - share * (guestCount - 1)) * 100) / 100  // last gets rounding diff
          : share,
      }))
      await api.post(`/api/app/orders/${order.id}/bills`, { bills }, { headers })
      await reloadBills()
      onReload()
    } catch {
      setError('Fehler beim Erstellen der Rechnungen.')
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  const createManualBills = async () => {
    if (submitted || loading) return
    if (guests.length === 0) { setError('Bitte mindestens einen Gast hinzufügen.'); return }
    setLoading(true); setSubmitted(true); setError('')
    try {
      const billMap = {}
      // Build per-guest item list
      activeItems.forEach(item => {
        const g = assignments[item.id]
        if (g) {
          if (!billMap[g]) billMap[g] = []
          billMap[g].push(item.id)
        }
      })
      // Collect unassigned items into a "Tisch"-bill if any
      const unassigned = activeItems.filter(i => !assignments[i.id]).map(i => i.id)
      if (unassigned.length > 0) billMap['Tisch'] = unassigned

      const payload = Object.entries(billMap).map(([guest_name, item_ids]) => ({ guest_name, item_ids }))
      await api.post(`/api/app/orders/${order.id}/bills`, { bills: payload }, { headers })
      await reloadBills()
      onReload()
    } catch {
      setError('Fehler beim Erstellen der Rechnungen.')
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  const markPaid = async (billId, method) => {
    await api.put(`/api/app/bills/${billId}/pay`, { payment_method: method }, { headers })
    await reloadBills()
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">

      {/* Summary */}
      <div className="bg-white rounded-kawaii shadow-kawaii border border-sakura/20 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-dusk/50">Tischrechnung gesamt</p>
          <p className="font-display font-bold text-3xl text-dusk">CHF {tableTotal.toFixed(2)}</p>
          <p className="text-xs text-dusk/40 mt-1">{activeItems.length} Artikel</p>
        </div>
        <Receipt className="w-10 h-10 text-maid/30" />
      </div>

      {/* Existing bills */}
      {bills.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-bold text-dusk">Rechnungen</h3>
          {bills.map(b => (
            <div key={b.id}
              className="bg-white rounded-kawaii shadow-kawaii border border-sakura/20 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-dusk">{b.guest_name}</p>
                  <p className="font-display font-bold text-2xl text-maid">
                    CHF {parseFloat(b.total).toFixed(2)}
                  </p>
                </div>
                {b.payment_status === 'paid'
                  ? <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Bezahlt</span>
                  : <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">Offen</span>
                }
              </div>
              {b.payment_status !== 'paid' && (
                <>
                  <div className="flex gap-2">
                    <button onClick={() => markPaid(b.id, 'cash')}
                      className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors">
                      💵 Bar
                    </button>
                    <button onClick={() => markPaid(b.id, 'twint')}
                      className="flex-1 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors">
                      📱 TWINT
                    </button>
                    <button onClick={() => markPaid(b.id, 'stripe')}
                      className="flex-1 py-2.5 bg-maid text-white rounded-xl text-sm font-bold hover:bg-maid-dark transition-colors">
                      💳 Karte
                    </button>
                  </div>
                  {b.stripe_checkout_url && (
                    <a href={b.stripe_checkout_url} target="_blank" rel="noreferrer"
                      className="block text-center text-sm text-maid border border-maid/30 rounded-xl py-2 hover:bg-maid/5 transition-colors">
                      🔗 Online-Zahlungslink öffnen
                    </a>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create bills — only when none exist yet */}
      {bills.length === 0 && (
        activeItems.length === 0
          ? <p className="text-center py-8 text-dusk/40 text-sm">Keine Artikel zum Abrechnen.</p>
          : <>
              {/* Mode toggle */}
              <div className="flex rounded-kawaii border border-sakura/40 overflow-hidden bg-white shadow-kawaii">
                {[['even', '⚖️ Gleichmässig'], ['manual', '🏷️ Nach Artikel']].map(([key, label]) => (
                  <button key={key} onClick={() => setMode(key)}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${
                      mode === key ? 'bg-maid text-white' : 'text-dusk/60 hover:bg-sakura/10'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Equal split ── */}
              {mode === 'even' && (
                <div className="space-y-4">
                  <p className="text-sm text-dusk/50 text-center">Rechnung gleichmässig aufteilen — Gäste bleiben anonym.</p>

                  {/* Guest count stepper */}
                  <div className="bg-white rounded-kawaii shadow-kawaii border border-sakura/20 p-5">
                    <p className="text-xs text-dusk/50 mb-3 font-medium">Anzahl Personen</p>
                    <div className="flex items-center justify-center gap-6">
                      <button onClick={() => setGuestCount(n => Math.max(1, n - 1))}
                        className="w-11 h-11 rounded-full bg-sakura/40 text-dusk font-bold hover:bg-sakura transition-colors flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-5xl font-display font-bold text-dusk w-16 text-center">{guestCount}</span>
                      <button onClick={() => setGuestCount(n => Math.min(20, n + 1))}
                        className="w-11 h-11 rounded-full bg-maid text-white font-bold hover:bg-maid-dark transition-colors flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-center text-dusk/50 text-sm mt-4">
                      = <strong className="text-dusk text-lg">CHF {perPerson.toFixed(2)}</strong> pro Person
                    </p>
                  </div>

                  {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
                  <button onClick={createEvenBills} disabled={loading || submitted}
                    className="w-full py-4 rounded-kawaii bg-maid text-white font-bold shadow-kawaii hover:bg-maid-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                    {guestCount}× CHF {perPerson.toFixed(2)} erstellen
                  </button>
                </div>
              )}

              {/* ── Manual per-item ── */}
              {mode === 'manual' && (
                <div className="space-y-4">
                  <p className="text-sm text-dusk/50 text-center">Artikel Personen zuordnen — Gäste bleiben anonym.</p>

                  {/* Add guest */}
                  <div className="flex gap-2">
                    <input value={newGuest} onChange={e => setNewGuest(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addGuest()}
                      placeholder={`Gast ${guests.length + 1} hinzufügen…`}
                      className="flex-1 input-kawaii text-sm" />
                    <button onClick={addGuest}
                      className="px-4 py-2 rounded-2xl bg-maid text-white font-bold hover:bg-maid-dark transition-colors flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Guest chips */}
                  {guests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {guests.map(g => (
                        <span key={g}
                          className="bg-sakura/40 text-dusk text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                          {g}
                          <button onClick={() => removeGuest(g)}
                            className="text-dusk/40 hover:text-rose-500 transition-colors leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {guests.length === 0 && (
                    <p className="text-center text-xs text-dusk/30 py-2">
                      Gäste hinzufügen, dann Artikel zuordnen.
                    </p>
                  )}

                  {/* Item → guest assignment */}
                  {guests.length > 0 && (
                    <div className="space-y-2">
                      {activeItems.map(item => (
                        <div key={item.id}
                          className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-kawaii border border-sakura/20">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-dusk text-sm">
                              {item.item_name} <span className="text-dusk/40">× {item.quantity}</span>
                            </p>
                            <p className="text-maid text-xs font-bold">
                              CHF {(item.unit_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <select value={assignments[item.id] || ''}
                            onChange={e => setAssign(a => ({ ...a, [item.id]: e.target.value }))}
                            className="border border-sakura/40 rounded-xl px-3 py-2 text-sm text-dusk bg-white focus:border-maid outline-none flex-shrink-0">
                            <option value="">Nicht zugeordnet</option>
                            {guests.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      ))}

                      {/* Preview per-guest subtotals */}
                      <div className="bg-sakura/10 rounded-2xl p-3 space-y-1">
                        {guests.map(g => {
                          const gItems = activeItems.filter(i => assignments[i.id] === g)
                          const sub = gItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
                          return (
                            <div key={g} className="flex justify-between text-sm">
                              <span className="text-dusk font-medium">{g}</span>
                              <span className="text-maid font-bold">CHF {sub.toFixed(2)}</span>
                            </div>
                          )
                        })}
                        {(() => {
                          const unSub = activeItems
                            .filter(i => !assignments[i.id])
                            .reduce((s, i) => s + i.unit_price * i.quantity, 0)
                          return unSub > 0
                            ? <div className="flex justify-between text-sm">
                                <span className="text-dusk/50">Nicht zugeordnet</span>
                                <span className="text-dusk/50">CHF {unSub.toFixed(2)}</span>
                              </div>
                            : null
                        })()}
                      </div>
                    </div>
                  )}

                  {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
                  <button onClick={createManualBills} disabled={loading || submitted || guests.length === 0}
                    className="w-full py-4 rounded-kawaii bg-maid text-white font-bold shadow-kawaii hover:bg-maid-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                    Rechnungen erstellen
                  </button>
                </div>
              )}
            </>
      )}
    </div>
  )
}

