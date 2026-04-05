import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ChevronRight, Loader, BookOpen } from 'lucide-react'
import BowDivider from '../components/BowDivider'
import api from '../api/client'

function PostCard({ post, index }) {
  return (
    <motion.article
      className="card-kawaii overflow-hidden group"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      <Link to={`/blog/${post.slug}`}>
        {post.cover_image ? (
          <div className="h-52 overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="h-52 bg-sakura-gradient flex items-center justify-center">
            <Heart className="w-14 h-14 text-maid/25 fill-maid/15" />
          </div>
        )}
        <div className="p-6">
          <p className="text-xs text-maid/50 font-medium mb-2 tracking-wide uppercase">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('de-CH', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })
              : 'Entwurf'}
          </p>
          <h2 className="font-display text-xl font-bold text-dusk mb-3 group-hover:text-maid transition-colors leading-snug">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-dusk/60 line-clamp-3 mb-4 leading-relaxed">{post.excerpt}</p>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-bold text-maid group-hover:gap-2 transition-all duration-200">
            Weiterlesen <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

export default function Blog() {
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Blog — Maid Café DreamGarden'
    api.get('/api/posts')
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="relative bg-hero-gradient py-16 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <p className="text-maid/60 font-japanese text-sm mb-2 tracking-widest">ブログ</p>
          <h1 className="section-title">Blog</h1>
          <p className="text-dusk/60 mt-6 max-w-md mx-auto">
            Neuigkeiten, Behind-the-Scenes-Geschichten und Updates rund ums DreamGarden.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <BowDivider color="#DDD6FE" />

        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-maid animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="w-16 h-16 text-maid/20 mx-auto mb-4" />
            <p className="text-dusk/50 text-lg">Noch keine Posts — bald mehr!</p>
          </div>
        )}

        {!loading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
