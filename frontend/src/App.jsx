import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { useLang } from './context/LangContext'
import { CartProvider } from './context/CartContext'
import { CustomerAuthProvider } from './context/CustomerAuthContext'
import { StaffAuthProvider } from './context/StaffAuthContext'
import CustomCursor from './components/Cursor'
import Intro from './components/Intro'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Members from './pages/Members'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Shop from './pages/Shop'
import ShopProduct from './pages/ShopProduct'
import Cart from './pages/Cart'
import ShopSuccess from './pages/ShopSuccess'
import CustomerLogin from './pages/CustomerLogin'
import VerifyEmail from './pages/VerifyEmail'
import Account from './pages/Account'
import StaffLogin from './pages/app/StaffLogin'
import TableList from './pages/app/TableList'
import OrderView from './pages/app/OrderView'
import Kitchen from './pages/app/Kitchen'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import PostsManager from './admin/PostsManager'
import MembersManager from './admin/MembersManager'
import MenuManager from './admin/MenuManager'
import ProductsManager from './admin/ProductsManager'
import Revenue from './admin/Revenue'
import UserManager from './admin/UserManager'
import TablesManager from './admin/TablesManager'
import StripeSettings from './admin/StripeSettings'

import { useStaffAuth } from './context/StaffAuthContext'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/admin/login" replace />
}

function StaffRoute({ children }) {
  const { isLoggedIn } = useStaffAuth()
  return isLoggedIn ? children : <Navigate to="/app/login" replace />
}

/** Soft frosted overlay that flashes when the language is switched */
function LangTransitionOverlay() {
  const { lang }           = useLang()
  const [active, setActive] = useState(false)
  const firstRender         = useRef(true)

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    setActive(true)
    const id = setTimeout(() => setActive(false), 350)
    return () => clearTimeout(id)
  }, [lang])

  if (!active) return null
  return (
    <div
      aria-hidden
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     9999,
        pointerEvents: 'none',
        background: 'rgba(255,238,245,0.55)',
        backdropFilter: 'blur(4px)',
        animation:  'langFlash 0.35s ease forwards',
      }}
    />
  )
}

export default function App() {
  return (
    <CustomerAuthProvider>
      <StaffAuthProvider>
        <CartProvider>
          <LangTransitionOverlay />
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
                      <Route path="shop" element={<Shop />} />
                      <Route path="shop/success" element={<ShopSuccess />} />
                      <Route path="shop/:id" element={<ShopProduct />} />
                      <Route path="cart" element={<Cart />} />
                      <Route path="account/login" element={<CustomerLogin />} />
                      <Route path="account/*" element={<Account />} />
                      <Route path="verify-email" element={<VerifyEmail />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              }
            />

            {/* Staff app (no public navbar) */}
            <Route path="/app/login" element={<StaffLogin />} />
            <Route path="/app" element={<StaffRoute><TableList /></StaffRoute>} />
            <Route path="/app/orders/:id" element={<StaffRoute><OrderView /></StaffRoute>} />
            <Route path="/app/kitchen" element={<StaffRoute><Kitchen /></StaffRoute>} />

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
              <Route path="products" element={<ProductsManager />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="users" element={<UserManager />} />
              <Route path="tables" element={<TablesManager />} />
              <Route path="stripe" element={<StripeSettings />} />
            </Route>
          </Routes>
        </CartProvider>
      </StaffAuthProvider>
    </CustomerAuthProvider>
  )
}
