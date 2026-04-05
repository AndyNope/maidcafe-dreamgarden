import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

const fmtCHF = (v) => 'CHF ' + parseFloat(v ?? 0).toFixed(2)

export default function Revenue() {
  const { token } = useAuth()
  const headers   = { Authorization: `Bearer ${token}` }

  const [from, setFrom]     = useState(monthStart())
  const [to, setTo]         = useState(today())
  const [type, setType]     = useState('all')
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.title = 'Umsatz — DreamGarden'; load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data: d } = await api.get(`/api/admin/revenue?from=${from}&to=${to}&type=${type}`, { headers })
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  const statCard = (label, value, sub) => (
    <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-5">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-dusk">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )

  const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maid/30"

  return (
    <div>
      <h1 className="text-2xl font-bold text-dusk mb-6">📊 Umsatz</h1>

      {/* Filters */}
      <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-5 mb-8 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Von</label>
          <input type="date" className={inputClass} value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bis</label>
          <input type="date" className={inputClass} value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bereich</label>
          <select className={inputClass} value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Alle</option>
            <option value="shop">Shop</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>
        <button
          onClick={load}
          style={{ background: '#b5838d', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 22px', fontWeight: 700, cursor: 'pointer' }}
        >
          Anzeigen
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">Lädt…</p>}

      {data && !loading && (
        <>
          {/* Overview cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
            {statCard('Gesamtumsatz', fmtCHF(data.total))}
            {data.shop && statCard('Shop', fmtCHF(data.shop.total), `${data.shop.order_count} Bestellungen`)}
            {data.restaurant && statCard('Restaurant', fmtCHF(data.restaurant.total), `${data.restaurant.bill_count} Rechnungen`)}
            {data.shop && statCard('Lieferkosten', fmtCHF(data.shop.delivery_total))}
          </div>

          {/* Shop breakdown */}
          {data.shop && (type === 'all' || type === 'shop') && (
            <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-dusk mb-4">🛍️ Shop — Top Produkte</h2>
              {data.shop.by_product?.length === 0 ? (
                <p className="text-gray-400 text-sm">Keine Shop-Bestellungen im Zeitraum.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0e0e4' }}>
                      {['Produkt','Menge','Umsatz'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.shop.by_product?.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #fdf0f2' }}>
                        <td style={{ padding: '8px 12px', fontSize: 14 }}>{r.product_name}</td>
                        <td style={{ padding: '8px 12px', fontSize: 14 }}>{r.quantity}×</td>
                        <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600 }}>{fmtCHF(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Restaurant breakdown */}
          {data.restaurant && (type === 'all' || type === 'restaurant') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-dusk mb-4">🍽️ Restaurant — Zahlungsarten</h2>
                {data.restaurant.by_payment?.length === 0 ? (
                  <p className="text-gray-400 text-sm">Keine Daten.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0e0e4' }}>
                        {['Methode','Anzahl','Total'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.restaurant.by_payment?.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #fdf0f2' }}>
                          <td style={{ padding: '8px 12px', fontSize: 14, textTransform: 'capitalize' }}>{r.payment_method}</td>
                          <td style={{ padding: '8px 12px', fontSize: 14 }}>{r.count}</td>
                          <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600 }}>{fmtCHF(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-dusk mb-4">🍽️ Restaurant — Top Speisen</h2>
                {data.restaurant.top_items?.length === 0 ? (
                  <p className="text-gray-400 text-sm">Keine Daten.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0e0e4' }}>
                        {['Artikel','Menge','Umsatz'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.restaurant.top_items?.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #fdf0f2' }}>
                          <td style={{ padding: '8px 12px', fontSize: 14 }}>{r.item_name}</td>
                          <td style={{ padding: '8px 12px', fontSize: 14 }}>{r.quantity}×</td>
                          <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600 }}>{fmtCHF(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Daily breakdown */}
          {((data.shop?.by_day?.length > 0) || (data.restaurant?.by_day?.length > 0)) && (
            <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-dusk mb-4">📅 Tagesumsatz</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0e0e4' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>Datum</th>
                    {data.shop?.by_day?.length > 0 && <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>Shop</th>}
                    {data.restaurant?.by_day?.length > 0 && <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#9b7d84', fontWeight: 600 }}>Restaurant</th>}
                  </tr>
                </thead>
                <tbody>
                  {/* Merge shop and restaurant by_day by date */}
                  {(() => {
                    const map = {}
                    data.shop?.by_day?.forEach(r => { map[r.date] = { ...map[r.date], shop: r.total } })
                    data.restaurant?.by_day?.forEach(r => { map[r.date] = { ...map[r.date], restaurant: r.total } })
                    return Object.entries(map).sort(([a],[b]) => b.localeCompare(a)).map(([date, vals]) => (
                      <tr key={date} style={{ borderBottom: '1px solid #fdf0f2' }}>
                        <td style={{ padding: '8px 12px', fontSize: 14 }}>{date}</td>
                        {data.shop?.by_day?.length > 0 && <td style={{ padding: '8px 12px', fontSize: 14 }}>{vals.shop ? fmtCHF(vals.shop) : '—'}</td>}
                        {data.restaurant?.by_day?.length > 0 && <td style={{ padding: '8px 12px', fontSize: 14 }}>{vals.restaurant ? fmtCHF(vals.restaurant) : '—'}</td>}
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
