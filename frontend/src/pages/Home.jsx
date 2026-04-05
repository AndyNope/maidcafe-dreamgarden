import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Star, Users, BookOpen, Coffee, Instagram, ChevronRight } from 'lucide-react'
import BowDivider from '../components/BowDivider'
import SakuraPetals from '../components/SakuraPetals'
import api from '../api/client'

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <motion.div
      variants={fadeUp}
      className="card-kawaii p-6 text-center flex flex-col items-center gap-3"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center`} style={{ background: color + '22' }}>
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <p className="font-display text-3xl font-bold text-dusk">{value}</p>
      <p className="text-sm text-dusk/60 font-medium">{label}</p>
    </motion.div>
  )
}

function BlogCard({ post }) {
  return (
    <motion.article variants={fadeUp} className="card-kawaii overflow-hidden group">
      {post.cover_image ? (
        <div className="h-44 overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-44 bg-sakura-gradient flex items-center justify-center">
          <Heart className="w-12 h-12 text-maid/30 fill-maid/20" />
        </div>
      )}
      <div className="p-5">
        <p className="text-xs text-maid/60 font-medium mb-1">
          {post.published_at ? new Date(post.published_at).toLocaleDateString('de-CH') : ''}
        </p>
        <h3 className="font-display text-lg font-bold text-dusk mb-2 line-clamp-2 group-hover:text-maid transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-dusk/60 line-clamp-2 mb-4">{post.excerpt}</p>
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-maid hover:gap-2 transition-all duration-200"
        >
          Weiterlesen <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    document.title = 'Maid Café DreamGarden — Home'
    api.get('/api/posts').then(({ data }) => setPosts(Array.isArray(data) ? data.slice(0, 3) : [])).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient pt-20">
        <SakuraPetals count={14} />

        {/* Stitch border bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ background: 'repeating-linear-gradient(90deg, #FFB7D5 0, #FFB7D5 8px, transparent 8px, transparent 16px)' }}
        />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.p
            className="text-maid font-japanese text-sm mb-3 tracking-widest"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            ✦ メイドカフェ・ドリームガーデン ✦
          </motion.p>

          <motion.h1
            className="font-display italic text-5xl md:text-7xl font-bold text-maid mb-6 leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
          >
            Maid Café<br />
            <span className="text-sky-dark">Dream Garden</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-dusk/70 mb-8 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Euer #swissmaidcafe — Welcome to the dream garden.
            <br className="hidden md:block" />
            14 Maids, 3 Butlers — serving you since 2018.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Link
              to="/menu"
              className="px-8 py-3.5 bg-maid text-white font-bold rounded-full shadow-kawaii hover:shadow-kawaii-lg hover:bg-maid-dark transition-all duration-200"
            >
              Unser Menü
            </Link>
            <Link
              to="/members"
              className="px-8 py-3.5 bg-white text-maid font-bold rounded-full shadow-kawaii hover:shadow-kawaii-lg hover:bg-petal transition-all duration-200 border border-sakura"
            >
              Unser Team
            </Link>
          </motion.div>

          {/* Floating bow */}
          <motion.div
            className="mt-12 flex justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BowDecoration />
          </motion.div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <BowDivider />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          <StatCard icon={Users}    value="17"   label="Maids & Butlers" color="#FF6B9D" />
          <StatCard icon={Star}     value="2018" label="Gegründet"       color="#93C5FD" />
          <StatCard icon={Coffee}   value="100+" label="Events"          color="#C4B5FD" />
          <StatCard icon={Heart}    value="968"  label="Follower"        color="#FFB7D5" />
        </motion.div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-sakura-gradient relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M12 2C9 2 7 5 7 8c0 2 .7 3.7 2 5-2-1-5-1-7 1 2 2 5 2 7 1-1 1.5-1 4 0 6 1-2 1-4.5 0-6 2 1 5 1 7-1-2-2-5-2-7-1 1.3-1.3 2-3 2-5 0-3-2-6-1-6z\' fill=\'%23FF6B9D\' opacity=\'0.15\'/%3E%3C/svg%3E")',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="section-title mb-6">
              Willkommen im Dream Garden
            </motion.h2>
            <motion.p variants={fadeUp} className="text-dusk/80 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              Wir sind ein Schweizer Maid Café und bringen den Charme der japanischen Pop-Kultur mit
              liebevollen Performances, köstlichen Spezialitäten und unvergesslichen Erlebnissen zu euch.
            </motion.p>
            <motion.p variants={fadeUp} className="text-dusk/60 text-base max-w-xl mx-auto">
              Jedes Event ist einzigartig — mit Spielen, Maid-Performances, Fotosessions und kleinen
              kulinarischen Überraschungen. Moe Moe Kyun~!
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex justify-center gap-4 flex-wrap">
              <a
                href="https://www.instagram.com/maidcafe_dreamgarden/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-maid text-maid font-bold rounded-full hover:bg-maid hover:text-white transition-all duration-200"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a
                href="https://ko-fi.com/maidcafedreamgarden"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-all duration-200"
              >
                <Coffee className="w-4 h-4" /> Ko-fi Support
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <BowDivider color="#93C5FD" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { to: '/menu',    icon: Coffee,    title: 'Unser Menü',         desc: 'Entdeckt unsere kawaii Speisen und Getränke.',     color: '#FFB7D5' },
            { to: '/members', icon: Users,     title: 'Maids & Butlers',    desc: 'Lernt unser charmantes Team kennen.',             color: '#93C5FD' },
            { to: '/blog',    icon: BookOpen,  title: 'Blog',               desc: 'Neuigkeiten, Behind-the-Scenes und mehr.',        color: '#DDD6FE' },
          ].map(({ to, icon: Icon, title, desc, color }) => (
            <Link key={to} to={to}>
              <motion.div
                className="card-kawaii p-6 text-center group h-full"
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: color + '33' }}
                >
                  <Icon className="w-8 h-8" style={{ color }} />
                </div>
                <h3 className="font-display text-xl font-bold text-dusk mb-2 group-hover:text-maid transition-colors">
                  {title}
                </h3>
                <p className="text-dusk/60 text-sm">{desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Latest blog posts ─────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="py-16 px-4 bg-dream">
          <div className="max-w-5xl mx-auto">
            <h2 className="section-title mb-10">Neueste Posts</h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </motion.div>
            <div className="text-center mt-8">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-8 py-3 bg-maid text-white font-bold rounded-full shadow-kawaii hover:bg-maid-dark transition-all duration-200"
              >
                Alle Posts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function BowDecoration() {
  return (
    <svg viewBox="0 0 120 40" width="80" fill="none">
      <ellipse cx="35" cy="20" rx="30" ry="12" fill="#FFB7D5" opacity="0.8" transform="rotate(-10 35 20)" />
      <ellipse cx="85" cy="20" rx="30" ry="12" fill="#FFB7D5" opacity="0.8" transform="rotate(10 85 20)" />
      <ellipse cx="60" cy="20" rx="9" ry="9" fill="#FF6B9D" />
      <ellipse cx="60" cy="20" rx="5" ry="5" fill="#FFEEF5" />
    </svg>
  )
}
