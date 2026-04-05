import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import CustomCursor from './components/Cursor'
import Intro from './components/Intro'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Members from './pages/Members'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import PostsManager from './admin/PostsManager'
import MembersManager from './admin/MembersManager'
import MenuManager from './admin/MenuManager'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <>
      <CustomCursor />
      <Routes>
        {/* Public site */}
        <Route
          path="/*"
          element={
            <>
              <Intro />
              <Navbar />
              <main>
                <Routes>
                  <Route index element={<Home />} />
                  <Route path="menu" element={<Menu />} />
                  <Route path="members" element={<Members />} />
                  <Route path="blog" element={<Blog />} />
                  <Route path="blog/:slug" element={<BlogPost />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="posts" element={<PostsManager />} />
          <Route path="members" element={<MembersManager />} />
          <Route path="menu" element={<MenuManager />} />
        </Route>
      </Routes>
    </>
  )
}
