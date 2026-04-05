import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Star, Loader } from 'lucide-react'
import BowDivider from '../components/BowDivider'
import api from '../api/client'
import { useLang } from '../context/LangContext'

const ROLE_LABEL = { maid: 'Maid', butler: 'Butler', manager: 'Manager' }
const ROLE_COLOR = {
  maid:    'bg-maid/10 text-maid',
  butler:  'bg-sky/30 text-sky-dark',
  manager: 'bg-lavender/50 text-lavender-dark',
}

function MemberCard({ member, index }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className="card-kawaii overflow-hidden group text-center"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div
        className="relative h-56 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${member.theme_color}33, ${member.theme_color}11)` }}
      >
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-kawaii flex items-center justify-center"
               style={{ background: member.theme_color + '33' }}>
            <span className="font-display italic text-4xl font-bold" style={{ color: member.theme_color }}>
              {member.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Role badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[member.role]} bg-white/80`}>
            {ROLE_LABEL[member.role]}
          </span>
        </div>

        {/* Hover heart */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-white/20"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ scale: hovered ? 1 : 0, rotate: hovered ? 0 : -30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Heart className="w-10 h-10 fill-maid text-maid drop-shadow-lg" />
          </motion.div>
        </motion.div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-dusk group-hover:text-maid transition-colors">
          {member.name}
        </h3>
        {member.name_jp && (
          <p className="text-xs font-japanese text-maid/50 mb-2">{member.name_jp}</p>
        )}
        {member.description && (
          <p className="text-sm text-dusk/60 leading-relaxed line-clamp-3">{member.description}</p>
        )}

        {/* Theme color dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {[0.9, 0.6, 0.35].map((o, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ background: member.theme_color, opacity: o }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const { t, lang }           = useLang()

  useEffect(() => {
    document.title = t('members', 'title') + ' — Maid Café DreamGarden'
    api.get('/api/members')
      .then(({ data }) => setMembers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [lang])

  const filtered = filter === 'all'
    ? members
    : members.filter((m) => m.role === filter)

  const counts = {
    all:     members.length,
    maid:    members.filter((m) => m.role === 'maid').length,
    butler:  members.filter((m) => m.role === 'butler').length,
    manager: members.filter((m) => m.role === 'manager').length,
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="relative bg-hero-gradient py-16 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 2C13 2 11 5 11 8c0 2 .7 3.7 2 5-2-1-5-1-7 1 2 2 5 2 7 1-1 1.5-1 4 0 6 1-2 1-4.5 0-6 2 1 5 1 7-1-2-2-5-2-7-1 1.3-1.3 2-3 2-5 0-3-2-6-1-6z' fill='%23FF6B9D' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '48px 48px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <p className="text-maid/60 font-japanese text-sm mb-2 tracking-widest">チーム</p>
          <h1 className="section-title">{t('members', 'title')}</h1>
          <p className="text-dusk/60 mt-6 max-w-md mx-auto">
            {t('members', 'subtitle')}
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <BowDivider />

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 mb-10">
          {[
            { key: 'all',     label: `${t('members', 'filterAll')} (${counts.all})` },
            { key: 'maid',    label: `${t('members', 'maid')} (${counts.maid})` },
            { key: 'butler',  label: `${t('members', 'butler')} (${counts.butler})` },
            ...(counts.manager > 0 ? [{ key: 'manager', label: `${t('members', 'manager')} (${counts.manager})` }] : []),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                filter === key
                  ? 'bg-maid text-white shadow-kawaii'
                  : 'bg-white text-dusk/60 hover:text-maid border border-sakura/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-maid animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-dusk/50">
            {t('members', 'empty')}
          </div>
        )}

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          layout
        >
          {filtered.map((member, i) => (
            <MemberCard key={member.id} member={member} index={i} />
          ))}
        </motion.div>

        {/* Moe moe kyun note */}
        <div className="mt-12 text-center">
          <p className="font-display italic text-2xl text-maid animate-pulse-soft">
            Moe Moe Kyun~!
          </p>
          <div className="flex justify-center gap-2 mt-2">
            {['#FF6B9D','#FFB7D5','#93C5FD'].map((c, i) => (
              <Star key={i} className="w-4 h-4 fill-current animate-sparkle" style={{ color: c, animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
