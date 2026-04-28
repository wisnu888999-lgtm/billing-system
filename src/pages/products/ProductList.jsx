import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Trash2, Check, X, Pencil, Filter, ChevronDown, Image as ImageIcon, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import SearchBar from '../../components/SearchBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { getProducts, updateProduct, logActivity, getProductSalesStats, deleteProduct } from '../../lib/db'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber, getCookie } from '../../lib/utils'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [salesStats, setSalesStats] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [editingStock, setEditingStock] = useState(null)
  const [editingPrice, setEditingPrice] = useState(null)
  const [tempStock, setTempStock] = useState('')
  const [tempPrice, setTempPrice] = useState('')
  const stockRef = useRef(null)
  const priceRef = useRef(null)
  const navigate = useNavigate()
  
  // Advanced Selection
  const [selectionMode, setSelectionMode] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  // Advanced Filter & Sort State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('name_asc') // name_asc, price_desc, stock_asc, sales_desc
  const [filterType, setFilterType] = useState('')
  const [filterSize, setFilterSize] = useState('')

  // Fullscreen Image State
  const [viewImage, setViewImage] = useState(null) // url

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [p, stats] = await Promise.all([getProducts(), getProductSalesStats()])
    setProducts(p)
    setSalesStats(stats || {})
    setLoading(false)
  }

  // Get unique types and sizes for filters
  const uniqueTypes = [...new Set(products.map(p => p.animal_type))].filter(Boolean)
  const uniqueSizes = [...new Set(products.map(p => p.size))].filter(Boolean)

  let filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType && p.animal_type !== filterType) return false
    if (filterSize && p.size !== filterSize) return false
    return true
  })

  // Apply sorting
  filtered.sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
    if (sortBy === 'price_desc') return b.price - a.price
    if (sortBy === 'stock_asc') return a.stock_qty - b.stock_qty
    if (sortBy === 'sales_desc') {
      const sa = salesStats[a.id]?.thisYear || 0
      const sb = salesStats[b.id]?.thisYear || 0
      return sb - sa
    }
    return 0
  })

  // === Selection ===
  const isSelectMode = selected.size > 0 || selectionMode

  function toggleSelect(id, index = null, isLongPress = false) {
    if (isLongPress) longPressTriggered.current = true
    
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      
      if (next.size === 0) setSelectionMode(false)
      else setSelectionMode(true)
      
      return next
    })
    if (index !== null) setLastSelectedIndex(index)
  }

  function handleItemClick(e, product, index) {
    // If Ctrl/Meta key is held, toggle selection immediately
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      toggleSelect(product.id, index, false)
      return
    }

    // In selection mode → toggle this item
    if (selectionMode) {
      toggleSelect(product.id, index, false)
      return
    }

    // If Shift is held for range
    if (e.shiftKey && lastSelectedIndex !== null) {
      e.preventDefault()
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const newSelected = new Set(selected)
      for (let i = start; i <= end; i++) {
        newSelected.add(filtered[i].id)
      }
      setSelected(newSelected)
      setSelectionMode(true)
      return
    }

    // If long press was triggered, don't view image
    if (longPressTriggered.current) return

    // Normal click: view image
    setViewImage(product.original_image_url || product.image_url)
  }

  function handlePointerDown(id, index) {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      toggleSelect(id, index, true)
      if (window.navigator.vibrate) window.navigator.vibrate(50)
    }, 600)
  }

  function handlePointerUp() {
    clearTimeout(longPressTimer.current)
    // Wait a tiny bit before resetting triggered to let the click event pass
    setTimeout(() => { longPressTriggered.current = false }, 100)
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
      setSelectionMode(false)
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
      setSelectionMode(true)
    }
  }

  async function handleDeleteSelected() {
    const count = selected.size
    if (!confirm(`ย้ายสินค้า ${count} รายการไปที่ถังขยะ?`)) return
    const uid = getCookie('userId')
    const toastId = toast.loading(`กำลังย้าย ${count} รายการ...`)
    try {
      for (const id of selected) {
        const p = products.find(x => x.id === id)
        await deleteProduct(id)
        if (p) await logActivity(uid, 'ลบสินค้า (Soft Delete)', p.name)
      }
      toast.success(`ย้ายไปถังขยะ ${count} รายการแล้ว`, { id: toastId })
      setSelected(new Set())
      setSelectionMode(false)
      load()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด', { id: toastId })
    }
  }

  // === Inline Edit ===
  function startEditStock(product) { setEditingStock(product.id); setTempStock(String(product.stock_qty)); setTimeout(() => stockRef.current?.select(), 50) }
  async function saveStock(product) {
    const newQty = parseInt(tempStock)
    if (isNaN(newQty) || newQty < 0) { toast.error('จำนวนไม่ถูกต้อง'); setEditingStock(null); return }
    const diff = newQty - product.stock_qty
    
    setEditingStock(null) // ปิดช่องกรอกทันที (ไม่ค้าง)
    
    if (diff !== 0) {
      // Optimistic Update (อัพเดตตัวเลขบนหน้าเว็บก่อนเลย ให้ดูรวดเร็ว)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_qty: newQty } : p))
      
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`
      try {
        // ยิง API แบบเบื้องหลังพร้อมกัน
        await Promise.all([
          updateProduct(product.id, { stock_qty: newQty }),
          logActivity(getCookie('userId'), 'แก้ไขสต๊อก', `${product.name}: ${product.stock_qty} → ${newQty} (${diffStr})`),
          supabase.from('stock_movements').insert({ product_id: product.id, type: diff > 0 ? 'in' : 'out', qty: Math.abs(diff), note: `แก้ไขสต๊อก ${product.stock_qty} → ${newQty}` })
        ])
        toast.success(`อัพเดตสต๊อก: ${newQty} (${diffStr})`)
      } catch (e) {
        toast.error('อัพเดตสต๊อกไม่สำเร็จ')
        load() // ดึงข้อมูลใหม่เพื่อ revert กลับถ้า error
      }
    }
  }

  function startEditPrice(product) { setEditingPrice(product.id); setTempPrice(String(product.price)); setTimeout(() => priceRef.current?.select(), 50) }
  async function savePrice(product) {
    const newPrice = parseFloat(tempPrice)
    if (isNaN(newPrice) || newPrice < 0) { toast.error('ราคาไม่ถูกต้อง'); setEditingPrice(null); return }
    
    setEditingPrice(null) // ปิดช่องกรอกทันที
    
    if (newPrice !== Number(product.price)) {
      // Optimistic Update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: newPrice } : p))
      
      try {
        await Promise.all([
          updateProduct(product.id, { price: newPrice }),
          logActivity(getCookie('userId'), 'แก้ไขราคา', `${product.name}: ฿${product.price} → ฿${newPrice}`)
        ])
        toast.success(`อัพเดตราคา: ฿${newPrice}`)
      } catch (e) {
        toast.error('อัพเดตราคาไม่สำเร็จ')
        load() // ดึงข้อมูลใหม่ถ้า error
      }
    }
  }

  function handleStockKeyDown(e, p) { if (e.key === 'Enter') saveStock(p); if (e.key === 'Escape') setEditingStock(null) }
  function handlePriceKeyDown(e, p) { if (e.key === 'Enter') savePrice(p); if (e.key === 'Escape') setEditingPrice(null) }

  return (
    <div className="animate-fadeIn min-h-screen bg-[var(--color-surface)]">
      {/* Search & Top Actions (Sticky) */}
      <div className="sticky top-16 md:top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-gray-800 tracking-tight hidden lg:block">📦 สินค้า</h2>
            <div className="w-full md:w-80 lg:w-96">
              <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาชื่อสินค้า..." />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSelectMode ? (
              <>
                <div className="hidden sm:flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button onClick={() => setSortBy('name_asc')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === 'name_asc' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>ชื่อ</button>
                  <button onClick={() => setSortBy('sales_desc')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === 'sales_desc' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>ขายดี</button>
                  <button onClick={() => setSortBy('price_desc')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === 'price_desc' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>ราคา</button>
                </div>
                {/* Mobile Filter Button */}
                <button 
                  onClick={() => setIsFilterModalOpen(true)}
                  className="md:hidden p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 relative"
                >
                  <Filter size={20} />
                  {(filterType || filterSize) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-600 border-2 border-white rounded-full"></span>
                  )}
                </button>
                <button onClick={() => navigate('/products/recycle-bin')} className="p-2.5 text-gray-400 hover:text-danger-500 transition-all">
                  <Trash2 size={20} />
                </button>
                <button onClick={() => navigate('/products/new')} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all text-sm">
                  <Plus size={18} />เพิ่มสินค้า
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-brand-600 mr-2">เลือก {selected.size} รายการ</span>
                <button onClick={selectAll} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all">
                  {selected.size === filtered.length ? 'ยกเลิก' : 'ทั้งหมด'}
                </button>
                <button onClick={() => { setSelected(new Set()); setSelectionMode(false) }} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all">
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row min-h-[calc(100vh-120px)]">
        {/* Category Sidebar (Left) - Hidden on Mobile */}
        <aside className="hidden md:block w-56 lg:w-64 border-r border-gray-100 bg-white/50 p-4 sm:p-6 shrink-0">
          <div className="sticky top-32">
            <div className="mb-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Filter size={12} /> หมวดหมู่
              </h3>
              <nav className="space-y-1">
                <button 
                  onClick={() => setFilterType('')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${filterType === '' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                >
                  <Package size={16} /> สินค้าทั้งหมด
                </button>
                {uniqueTypes.map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${filterType === t ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center opacity-70">🐾</span> {t}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">กรองตามขนาด</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFilterSize('')} className={`px-2 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${filterSize === '' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>All</button>
                {uniqueSizes.map(s => (
                  <button key={s} onClick={() => setFilterSize(s)} className={`px-2 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${filterSize === s ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid (Main) */}
        <section className="flex-1 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} title="ไม่พบสินค้าในหมวดหมู่นี้" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
              {filtered.map((p, index) => {
                const isSel = selected.has(p.id)
                const stat = salesStats[p.id]
                return (
                  <div key={p.id} className={`group bg-white rounded-2xl border-2 transition-all duration-300 relative flex flex-col ${isSel ? 'border-brand-500 shadow-xl shadow-brand-100 ring-4 ring-brand-50' : 'border-gray-50 shadow-sm hover:shadow-xl hover:border-white hover:-translate-y-1'}`}>
                    
                    {/* Sales Badge */}
                    {stat && (
                      <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-sm flex items-center gap-1 ${stat.type === 'increase' ? 'bg-danger-500' : 'bg-brand-500'}`}>
                        <Flame size={10} /> {stat.text}
                      </div>
                    )}

                    {/* Product Image */}
                    <div 
                      className="relative w-full aspect-square bg-gray-50 rounded-xl m-1.5 overflow-hidden cursor-pointer select-none"
                      onClick={(e) => handleItemClick(e, p, index)}
                      onPointerDown={() => handlePointerDown(p.id, index)}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSel ? 'opacity-40 blur-[1px]' : ''}`} />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200"><ImageIcon size={40} strokeWidth={1} /></div>
                      )}
                      {/* Selection UI */}
                      {(selectionMode || isSel) && (
                        <div className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-lg animate-popIn ${isSel ? 'bg-brand-600 text-white' : 'bg-white/90 border-2 border-gray-200'}`}>
                          {isSel && <Check size={14} strokeWidth={4} />}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 pt-2 flex flex-col flex-1">
                      <div className="mb-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-sm text-gray-800 leading-snug line-clamp-2 h-10 group-hover:text-brand-600 transition-colors">{p.name}</h3>
                          <button onClick={() => navigate(`/products/${p.id}`)} className="shrink-0 text-gray-300 hover:text-brand-600 p-1 rounded-lg hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Pencil size={12} />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{p.animal_type} · {p.size}</p>
                      </div>

                      <div className="mt-auto space-y-2 pt-2 border-t border-gray-50">
                        {/* Price Area */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Price</span>
                          {editingPrice === p.id ? (
                            <input ref={priceRef} type="number" step="0.01" value={tempPrice} onChange={e => setTempPrice(e.target.value)} onBlur={() => savePrice(p)} onKeyDown={e => handlePriceKeyDown(e, p)} className="w-16 px-2 py-1 text-right text-xs font-black border-2 border-brand-400 rounded-xl focus:outline-none" />
                          ) : (
                            <button onClick={() => startEditPrice(p)} className="text-sm font-black text-brand-600 hover:bg-brand-50 px-2 py-0.5 rounded-lg transition-all tabular-nums">
                              {formatCurrency(p.price)}
                            </button>
                          )}
                        </div>

                        {/* Stock Area */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Stock</span>
                          {editingStock === p.id ? (
                            <input ref={stockRef} type="number" value={tempStock} onChange={e => setTempStock(e.target.value)} onBlur={() => saveStock(p)} onKeyDown={e => handleStockKeyDown(e, p)} className="w-16 px-2 py-1 text-right text-xs font-black border-2 border-brand-400 rounded-xl focus:outline-none" />
                          ) : (
                            <button onClick={() => startEditStock(p)} className={`text-xs font-black px-2 py-0.5 rounded-lg transition-all tabular-nums hover:bg-gray-50 ${p.stock_qty < 10 ? 'text-danger-600 bg-danger-50' : 'text-gray-700 bg-gray-50'}`}>
                              {formatNumber(p.stock_qty)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Floating Delete Bar */}
      {isSelectMode && (
        <div className="fixed bottom-24 left-1/2 md:left-[calc(50%+128px)] -translate-x-1/2 w-full max-w-[480px] z-50 px-4 animate-slideUp">
          <div className="bg-danger-600 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">Selected</span>
              <span className="text-lg font-black leading-none">{selected.size} รายการ</span>
            </div>
            <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-6 py-2.5 bg-white text-danger-600 font-black rounded-lg hover:bg-danger-50 active:scale-95 transition-all text-sm shadow-lg">
              <Trash2 size={18} /> ย้ายไปถังขยะ
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal for Mobile */}
      <Modal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        title="ตัวกรองสินค้า"
      >
        <div className="space-y-8 py-2">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} /> หมวดหมู่
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => { setFilterType(''); setIsFilterModalOpen(false); }}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${filterType === '' ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-600'}`}
              >
                <Package size={18} /> สินค้าทั้งหมด
              </button>
              {uniqueTypes.map(t => (
                <button 
                  key={t}
                  onClick={() => { setFilterType(t); setIsFilterModalOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${filterType === t ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-600'}`}
                >
                  <span>🐾</span> {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ขนาด</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setFilterSize(''); setIsFilterModalOpen(false); }} 
                className={`py-3 rounded-2xl text-xs font-black uppercase border-2 transition-all ${filterSize === '' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-100 text-gray-500'}`}
              >
                All
              </button>
              {uniqueSizes.map(s => (
                <button 
                  key={s} 
                  onClick={() => { setFilterSize(s); setIsFilterModalOpen(false); }} 
                  className={`py-3 rounded-2xl text-xs font-black uppercase border-2 transition-all ${filterSize === s ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-100 text-gray-500'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => { setFilterType(''); setFilterSize(''); setIsFilterModalOpen(false); }}
            className="w-full py-4 text-gray-400 font-bold text-sm"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fadeIn p-4" onClick={() => setViewImage(null)}>
          <button onClick={() => setViewImage(null)} className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 rounded-full transition-all hover:rotate-90">
            <X size={32} />
          </button>
          <img src={viewImage} alt="Full Size" className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
