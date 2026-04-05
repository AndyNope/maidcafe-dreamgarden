import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Heart, LayoutDashboard, BookOpen, Users, UtensilsCrossed, LogOut, Menu, X, ShoppingBag, BarChart2, UserCog, Table2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { to: '/admin',          label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/admin/posts',    label: 'Blog Posts',  icon: BookOpen },
  { to: '/admin/members',  label: 'Members',     icon: Users },
  { to: '/admin/menu',     label: 'Menü',        icon: UtensilsCrossed },
  { to: '/admin/products', label: 'Shop',        icon: ShoppingBag },
  { to: '/admin/tables',   label: 'Tische',      icon: Table2 },
  { to: '/admin/users',    label: 'Benutzer',    icon: UserCog },
  { to: '/admin/revenue',  label: 'Umsatz',      icon: BarChart2 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`${
        mobile
          ? 'w-full'
          : 'hidden md:flex w-64 flex-shrink-0'
      } flex flex-col bg-admin-gradient min-h-screen`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-maid/80 flex items-center justify-center">
          <Heart className="w-4 h-4 fill-white text-white" />
        </div>
        <div>
          <p className="font-display italic text-white font-bold leading-none">DreamGarden</p>
          <p className="text-white/40 text-xs">CMS Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold text-sm">
            {user?.username?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <p className="text-white/70 text-sm font-medium truncate">{user?.username ?? 'Admin'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="admin-nav-link w-full text-rose-300 hover:bg-rose-500/20"
        >
          <LogOut className="w-4 h-4" /> Ausloggen
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <motion.div
              className="relative z-50 w-72"
              initial={{ x: -72 * 4 }}
              animate={{ x: 0 }}
              exit={{ x: -72 * 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Sidebar mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-dusk hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display italic font-bold text-maid">DreamGarden CMS</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
