import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AdminProduct { id: string; name: string; category: string; price_idr: number; in_stock: boolean; sold_count?: number; review_count?: number; rating?: number }

const CATEGORIES = ['oil', 'chain_lube', 'accessories', 'apparel', 'parts', 'tires', 'gear']

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]   = useState(false)

  const [name, setName]           = useState('')
  const [category, setCategory]   = useState('oil')
  const [description, setDesc]    = useState('')
  const [price, setPrice]         = useState('')
  const [origPrice, setOrigPrice] = useState('')
  const [buyUrl, setBuyUrl]       = useState('')
  const [whatsapp, setWhatsapp]   = useState('')
  const [inStock, setInStock]     = useState(true)
  const [isOfficial, setIsOfficial] = useState(true)

  const load = async () => {
    if (!supabase) return
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data ?? [])
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('name, avatar, badges').eq('id', user!.id).single()

    await supabase.from('products').insert({
      seller_id: user!.id,
      seller_name: profile?.name ?? 'Unknown',
      seller_avatar: profile?.avatar ?? '🛒',
      seller_badges: profile?.badges ?? [],
      is_official_store: isOfficial,
      category, name, description,
      price_idr: parseInt(price),
      original_price_idr: origPrice ? parseInt(origPrice) : null,
      buy_url: buyUrl || null,
      whatsapp_number: whatsapp || null,
      in_stock: inStock,
    })
    setLoading(false)
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await supabase?.from('products').delete().eq('id', id)
    load()
  }

  const toggleStock = async (id: string, current: boolean) => {
    await supabase?.from('products').update({ in_stock: !current }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-2xl">Products</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-900 rounded-2xl p-6 border border-white/5 mb-6 space-y-4">
          <h2 className="text-white font-semibold">Add Product</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Product Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Price (IDR) *</label>
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="65000" className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Original Price (IDR) — if on sale</label>
              <input type="number" value={origPrice} onChange={e => setOrigPrice(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Buy URL (Tokopedia / Shopee)</label>
              <input type="url" value={buyUrl} onChange={e => setBuyUrl(e.target.value)} placeholder="https://tokopedia.com/…" className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">WhatsApp (fallback order)</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="628123456789" className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="w-4 h-4 accent-orange-500" />
              In Stock
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={isOfficial} onChange={e => setIsOfficial(e.target.checked)} className="w-4 h-4 accent-orange-500" />
              Mark as Official Store
            </label>
          </div>
          <button type="submit" disabled={loading} className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Product'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {products.length === 0 && <p className="text-gray-500 text-sm">No products yet.</p>}
        {products.map(p => (
          <div key={p.id} className="bg-gray-900 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{p.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">{p.category} · Rp {p.price_idr?.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggleStock(p.id, p.in_stock)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${p.in_stock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {p.in_stock ? 'In Stock' : 'Out of Stock'}
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
