import { useEffect, useState } from 'react'
import api from '../api/client'

const Badge = ({ ok, label }) => (
  <span style={{
    display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
    background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b'
  }}>{ok ? '✓' : '✗'} {label}</span>
)

export default function StripeSettings() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Stripe — DreamGarden CMS'
    api.get('/api/admin/settings/stripe/status')
      .then(r => setStatus(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-dusk mb-6">Stripe Zahlungssystem</h1>

      {loading && <p className="text-dusk/50">Lade Status…</p>}

      {status && (
        <>
          {/* Status overview */}
          <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-dusk mb-4">Aktueller Status</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge ok={status.configured} label={status.configured ? `Aktiv (${status.mode === 'live' ? 'Live' : 'Testmodus'})` : 'Nicht konfiguriert'} />
              <Badge ok={status.webhook_configured} label="Webhook" />
            </div>

            {!status.configured && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                <strong>Stripe ist noch nicht aktiv.</strong> Zahlung im Shop/Restaurant funktioniert im
                Fallback-Modus (Bestellungen werden als bezahlt markiert ohne echte Zahlung).
              </div>
            )}
            {status.mode === 'test' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 mt-3">
                <strong>Testmodus aktiv.</strong> Es werden keine echten Zahlungen verarbeitet.
                Für den Livebetrieb müssen Live-Keys gesetzt werden.
              </div>
            )}
            {status.mode === 'live' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900 mt-3">
                <strong>Live-Modus aktiv.</strong> Echte Zahlungen werden verarbeitet.
              </div>
            )}
          </div>

          {/* How to activate */}
          <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-dusk mb-3">Stripe aktivieren</h2>
            <p className="text-sm text-dusk/70 mb-4">
              API-Keys werden aus Sicherheitsgründen direkt auf dem Server gesetzt (nicht hier im UI).
              Folgende Schritte sind notwendig:
            </p>
            <ol className="space-y-4 text-sm text-dusk/80">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maid text-white flex items-center justify-center font-bold text-xs">1</span>
                <span>
                  Konto bei <a href="https://dashboard.stripe.com/register" target="_blank" rel="noreferrer" className="text-maid underline">stripe.com</a> erstellen
                  und in den <strong>API-Keys</strong> (Developers → API Keys) navigieren.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maid text-white flex items-center justify-center font-bold text-xs">2</span>
                <span>
                  In der <strong>.env</strong> bzw. Apache <strong>.htaccess</strong> auf dem Server eintragen:
                  <pre className="mt-2 bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre">{`STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX`}</pre>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maid text-white flex items-center justify-center font-bold text-xs">3</span>
                <span>
                  Webhook in Stripe anlegen: Dashboard → Developers → Webhooks → <strong>Add endpoint</strong>.<br/>
                  URL: <code className="bg-gray-100 px-1 rounded">https://maidcafe-dreamgarden.ch/api/shop/webhook</code><br/>
                  Events: <code className="bg-gray-100 px-1 rounded">checkout.session.completed</code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maid text-white flex items-center justify-center font-bold text-xs">4</span>
                <span>
                  Server neu starten und diese Seite neu laden — Status sollte auf <strong>Aktiv</strong> wechseln.
                </span>
              </li>
            </ol>
          </div>

          {/* Supported payments */}
          <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6">
            <h2 className="font-bold text-dusk mb-3">Unterstützte Zahlungsarten</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '💳', name: 'Kreditkarte', note: 'Visa, Mastercard' },
                { icon: '🔵', name: 'TWINT', note: 'Schweizer Standard' },
                { icon: 'G', name: 'Google Pay', note: 'via Stripe' },
                { icon: '🍎', name: 'Apple Pay', note: 'via Stripe' },
              ].map(p => (
                <div key={p.name} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{p.icon}</div>
                  <div className="font-semibold text-sm text-dusk">{p.name}</div>
                  <div className="text-xs text-dusk/50">{p.note}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
