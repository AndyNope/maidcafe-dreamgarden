import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/client'
import { useStaffAuth } from '../../context/StaffAuthContext'

const STATUS_COLOR = { open: '#4caf50', closed: '#aaa', cancelled: '#f44336' }
const STATUS_LABEL = { open: 'Offen', closed: 'Abgeschlossen', cancelled: 'Storniert' }

export default function TableList() {
  const { staff, token, logout } = useStaffAuth()
  const navigate = useNavigate()
  const [tables, setTables]   = useState([])
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  const load = () => {
    api.get('/api/tables', { headers })
      .then(r => setTables(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  const openOrder = async (tableId) => {
    const { data } = await api.post('/api/app/orders', { table_id: tableId }, { headers })
    navigate(`/app/orders/${data.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff9f5', paddingBottom: 80 }}>
      {/* Header bar */}
      <div style={{ background: '#b5838d', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>🌸 Dream Garden</div>
          <div style={{ fontSize: 13, opacity: .8 }}>{staff?.name} · {staff?.role}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/app/kitchen" style={{ color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,.2)', borderRadius: 20, padding: '6px 14px', fontSize: 14 }}>🍳 Küche</Link>
          <button onClick={() => { logout(); navigate('/app/login') }} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 20, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: 22 }}>Tische</h2>
          <button onClick={load} style={{ background: 'none', border: '1px solid #e0c8cc', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: '#b5838d', fontSize: 14 }}>🔄 Aktualisieren</button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, fontSize: 32 }}>🌸</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {tables.map(t => (
            <div
              key={t.id}
              onClick={() => t.open_order_id ? navigate(`/app/orders/${t.open_order_id}`) : openOrder(t.id)}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,.08)',
                textAlign: 'center',
                border: `2px solid ${t.open_order_id ? '#b5838d' : '#eee'}`,
                transition: 'transform .15s',
                userSelect: 'none',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 6 }}>
                {t.open_order_id ? '🪑' : '✅'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#333' }}>
                Tisch {t.number}
              </div>
              {t.name && <div style={{ color: '#aaa', fontSize: 13 }}>{t.name}</div>}
              <div style={{ marginTop: 8, fontSize: 13 }}>
                {t.open_order_id ? (
                  <>
                    <span style={{ background: STATUS_COLOR.open, color: '#fff', borderRadius: 6, padding: '2px 10px' }}>Offen</span>
                    {t.staff_name && <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>👤 {t.staff_name}</div>}
                  </>
                ) : (
                  <span style={{ color: '#aaa' }}>Frei</span>
                )}
              </div>
            </div>
          ))}
          {!loading && tables.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa' }}>
              Keine Tische konfiguriert. Admin → Tische hinzufügen.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
