import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password)
      navigate('/admin')
    } catch {
      setError('Ungültige Zugangsdaten. Bitte nochmals versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-gradient p-4">
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #FFB7D5 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-maid mx-auto flex items-center justify-center shadow-kawaii-lg mb-4">
            <Heart className="w-8 h-8 fill-white text-white" />
          </div>
          <h1 className="font-display italic text-2xl font-bold text-white">DreamGarden</h1>
          <p className="text-white/50 text-sm mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-kawaii border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-white/70 text-sm font-semibold mb-1.5">
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-maid focus:bg-white/20 transition-all"
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm font-semibold mb-1.5">
                Passwort
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-2xl bg-white/15 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-maid focus:bg-white/20 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-300 text-sm text-center bg-rose-500/10 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="mt-2 py-3.5 bg-maid hover:bg-maid-dark text-white font-bold rounded-full shadow-kawaii transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Einloggen...</>
              ) : (
                'Einloggen'
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Maid Café DreamGarden CMS
        </p>
      </motion.div>
    </div>
  )
}
