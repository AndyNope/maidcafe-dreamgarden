import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Loader, Calendar } from 'lucide-react'
import BowDivider from '../components/BowDivider'
import api from '../api/client'
import { useLang } from '../context/LangContext'

export default function BlogPost() {
  const { slug }          = useParams()
  const [post, setPost]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)
  const { t, lang }       = useLang()

  useEffect(() => {
    setLoading(true)
    setError(false)
    api.get(`/api/posts/${slug}`)
      .then(({ data }) => {
        setPost(data)
        document.title = `${data.title} — Maid Café DreamGarden`
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader className="w-10 h-10 text-maid animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
        <Heart className="w-16 h-16 text-maid/20 fill-maid/10" />
        <p className="text-dusk/50 text-lg text-center">{t('blogPost', 'notFound')}</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-maid text-white font-bold rounded-full shadow-kawaii"
        >
          <ArrowLeft className="w-4 h-4" /> {t('blogPost', 'back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Cover */}
      {post.cover_image && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <motion.img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-maid/60 hover:text-maid text-sm font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('blogPost', 'back')}
        </Link>

        <BowDivider />

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          {/* Meta */}
          <div className="flex items-center gap-2 text-maid/50 text-sm mb-4">
            <Calendar className="w-4 h-4" />
            <time>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-CH', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })
                : (lang === 'en' ? 'Draft' : 'Entwurf')}
            </time>
          </div>

          {/* Title */}
          <h1 className="font-display italic text-3xl md:text-5xl font-bold text-dusk mb-6 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-dusk/60 mb-8 leading-relaxed border-l-4 border-sakura pl-4 italic">
              {post.excerpt}
            </p>
          )}

          {/* Content — rendered as HTML (from a trusted CMS admin) */}
          {post.content && (
            <div
              className="prose-kawaii"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          <div className="mt-12 flex justify-center">
            <BowDivider color="#93C5FD" />
          </div>

          <div className="mt-8 flex justify-center gap-3">
            {['#FF6B9D', '#FFB7D5', '#93C5FD'].map((c, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              >
                <Heart className="w-5 h-5 fill-current" style={{ color: c }} />
              </motion.div>
            ))}
          </div>
        </motion.article>
      </div>
    </div>
  )
}
