import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import ProductsPage from './pages/ProductsPage'
import TicketsPage from './pages/TicketsPage'
import Layout from './components/Layout'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_, s) => setSession(s))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  if (!session) return <LoginPage onLogin={setSession} />

  return (
    <Layout session={session}>
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events"    element={<EventsPage />} />
        <Route path="/products"  element={<ProductsPage />} />
        <Route path="/tickets"   element={<TicketsPage />} />
      </Routes>
    </Layout>
  )
}
