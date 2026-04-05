import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Coffee, UtensilsCrossed, Cake, Star, Loader } from 'lucide-react'
import BowDivider from '../components/BowDivider'
import api from '../api/client'
import { useLang } from '../context/LangContext'

const iconMap = {
  Cup:             (p) => <Coffee {...p} />,
  Coffee:          (p) => <Coffee {...p} />,
  UtensilsCrossed:   (p) => <UtensilsCrossed {...p} />,
  Cake:              (p) => <Cake {...p} />,
  Star:              (p) => <Star {...p} />,
}

const COLORS = ['#FFB7D5', '#93C5FD', '#DDD6FE', '#FFD6E7', '#BAE6FD']

function CategoryIcon({ name, className }) {
  const Comp = iconMap[name] || Star
  return <Comp className={className} />
}

function MenuItem({ item, index }) {
  return (
    <motion.div
      className="card-kawaii p-5 flex gap-4 group hover:border-maid/40"
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      {item.image ? (
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400"
          />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-sakura-gradient flex-shrink-0 flex items-center justify-center">
          <Star className="w-6 h-6 text-maid/40" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="font-bold text-dusk group-hover:text-maid transition-colors leading-tight">
              {item.name}
            </h3>
            {item.name_jp && (
              <p className="text-xs text-maid/50 font-japanese">{item.name_jp}</p>
            )}
          </div>
          <span className="price-tag flex-shrink-0 whitespace-nowrap">
            <span className="text-xs opacity-70 mr-0.5">CHF</span>{Number(item.price).toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-dusk/60 leading-relaxed line-clamp-2">{item.description}</p>
        )}
      </div>
    </motion.div>
  )
}

function CategorySection({ category, colorIndex }) {
  const color = COLORS[colorIndex % COLORS.length]

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: color + '44' }}
        >
          <CategoryIcon name={category.icon} className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-dusk">{category.name}</h2>
          {category.name_jp && (
            <p className="text-sm text-maid/50 font-japanese">{category.name_jp}</p>
          )}
        </div>
        <div className="flex-1 h-px" style={{ background: color + '66' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {category.items.map((item, i) => (
          <MenuItem key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const { t, lang }                 = useLang()

  useEffect(() => {
    document.title = t('menu', 'title') + ' — Maid Café DreamGarden'
    api.get('/api/menu')
      .then(({ data }) => setCategories(data))
      .catch(() => setError(t('menu', 'empty')))
      .finally(() => setLoading(false))
  }, [lang])

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="relative bg-sakura-gradient py-16 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='%23FF6B9D' opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <p className="text-maid/60 font-japanese text-sm mb-2 tracking-widest">メニュー</p>
          <h1 className="section-title text-4xl md:text-5xl font-bold">{t('menu', 'title')}</h1>
          <p className="text-dusk/60 mt-6 max-w-md mx-auto">
            {t('menu', 'subtitle')}
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <BowDivider />

        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-maid animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-dusk/50">{error}</div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20 text-dusk/50">
            {t('menu', 'empty')}
          </div>
        )}

        {!loading && categories.map((cat, i) => (
          <CategorySection key={cat.id} category={cat} colorIndex={i} />
        ))}

        {/* Note */}
        <div className="mt-8 p-6 rounded-kawaii bg-petal/50 border border-sakura/30 text-center">
          <p className="text-dusk/60 text-sm">
            {t('menu', 'subtitle')} inkl. MwSt. Das Menü kann je nach Event variieren.
          </p>
        </div>
      </div>
    </div>
  )
}
