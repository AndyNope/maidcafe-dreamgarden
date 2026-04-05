import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, UtensilsCrossed, Heart, ArrowRight, Loader } from 'lucide-react'
import api from '../api/client'

function StatTile({ icon: Icon, label, value, to, color }) {
  return (
    <Link to={to}>
      <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6 flex items-center gap-4 group hover:-translate-y-1 transition-transform duration-200">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: color + '22' }}>
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-dusk">{value ?? '—'}</p>
          <p className="text-sm text-dusk/50">{label}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-maid group-hover:translate-x-1 transition-all duration-200" />
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    document.title = 'Dashboard — DreamGarden CMS'
    Promise.all([
      api.get('/api/posts'),
      api.get('/api/members'),
      api.get('/api/menu'),
    ]).then(([posts, members, menu]) => {
      const totalItems = menu.data.reduce((acc, c) => acc + c.items.length, 0)
      setStats({
        posts:   posts.data.length,
        members: members.data.length,
        menu:    totalItems,
      })
    }).catch(() => {})
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Heart className="w-6 h-6 text-maid fill-maid" />
          <h1 className="font-display text-2xl font-bold text-dusk">Dashboard</h1>
        </div>
        <p className="text-dusk/50 text-sm">Willkommen zurück im DreamGarden CMS!</p>
      </div>

      {/* Stats */}
      {!stats ? (
        <div className="flex justify-center py-12">
          <Loader className="w-7 h-7 text-maid animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatTile icon={BookOpen}       label="Blog Posts"   value={stats.posts}   to="/admin/posts"   color="#FF6B9D" />
          <StatTile icon={Users}          label="Mitglieder"   value={stats.members} to="/admin/members" color="#93C5FD" />
          <StatTile icon={UtensilsCrossed} label="Menü Items"  value={stats.menu}    to="/admin/menu"    color="#C4B5FD" />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-kawaii shadow-kawaii border border-gray-100 p-6">
        <h2 className="font-bold text-dusk mb-4">Schnellaktionen</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/posts"
            className="px-5 py-2.5 bg-maid text-white font-bold rounded-full text-sm hover:bg-maid-dark transition-colors shadow-kawaii"
          >
            Neuer Post
          </Link>
          <Link
            to="/admin/members"
            className="px-5 py-2.5 bg-sky/30 text-sky-dark font-bold rounded-full text-sm hover:bg-sky/50 transition-colors"
          >
            Mitglied hinzufügen
          </Link>
          <Link
            to="/admin/menu"
            className="px-5 py-2.5 bg-lavender/40 text-lavender-dark font-bold rounded-full text-sm hover:bg-lavender/60 transition-colors"
          >
            Menü Item hinzufügen
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gray-100 text-dusk font-bold rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            Website anzeigen
          </a>
        </div>
      </div>
    </div>
  )
}
