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
    <div className="space-y-4 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📦 สินค้า</h2>
        {!isSelectMode ? (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/products/recycle-bin')} className="p-3 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-2xl transition-all active:scale-95">
              <Trash2 size={22} />
            </button>
            <button onClick={() => navigate('/products/new')} className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-md active:scale-95 transition-all">
              <Plus size={20} />เพิ่มสินค้า
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition-all">
              {selected.size === filtered.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
            </button>
            <button onClick={() => { setSelected(new Set()); setSelectionMode(false) }} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter Row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาชื่อสินค้า..." />
        </div>
        <button onClick={() => setIsFilterModalOpen(true)} className="px-4 py-2 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all">
          <Filter size={18} />
          <span className="text-sm font-semibold hidden sm:inline">คัดกรอง</span>
        </button>
      </div>

      {/* Selection Mode Hint */}
      {!selectionMode && !loading && filtered.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-gray-400 px-1 select-none font-bold uppercase tracking-widest animate-fadeIn">
          <span className="hidden sm:inline">💡 Ctrl+คลิก หรือ กดค้าง เพื่อเลือกหลายรายการ</span>
          <span className="sm:hidden">💡 กดค้างที่รูป เพื่อเลือกหลายรายการ</span>
        </div>
      )}

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Package} title="ไม่พบสินค้า" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {filtered.map((p, index) => {
            const isSel = selected.has(p.id)
            const stat = salesStats[p.id]
            return (
              <div key={p.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all relative ${isSel ? 'border-brand-500 shadow-md shadow-brand-100' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                
                {/* Sales Badge */}
                {stat && (
                  <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm flex items-center gap-1 ${stat.type === 'increase' ? 'bg-danger-500' : 'bg-brand-500'}`}>
                    <Flame size={12} /> {stat.text}
                  </div>
                )}

                {/* Square Image Area */}
                <div 
                  className={`relative w-full aspect-square bg-gray-50 cursor-pointer select-none transition-transform duration-200 active:scale-95 ${isSel ? 'scale-90' : ''}`}
                  onClick={(e) => handleItemClick(e, p, index)}
                  onPointerDown={() => handlePointerDown(p.id, index)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isSel ? 'opacity-40 scale-110 blur-[1px]' : 'opacity-100'}`} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  {/* Select checkbox - Only show in selection mode or if selected */}
                  {(selectionMode || isSel) && (
                    <div className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-lg animate-popIn ${isSel ? 'bg-brand-600 text-white' : 'bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-transparent'}`}>
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                  {isSel && (
                    <div className="absolute inset-0 border-4 border-brand-500 rounded-xl pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]" />
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col justify-between h-[110px]">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-bold text-sm leading-tight line-clamp-2">{p.name}</h3>
                      <button onClick={() => navigate(`/products/${p.id}`)} className="shrink-0 text-gray-400 hover:text-brand-600 p-1 -mr-1 -mt-1 rounded-md hover:bg-gray-100 transition-colors">
                        <Pencil size={14} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{p.animal_type} · {p.size} · {p.weight_g}g</p>
                  </div>

                  <div>
                    {/* Price - tap to edit */}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] text-gray-400">ราคา</span>
                      {editingPrice === p.id ? (
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs text-gray-400">฿</span>
                          <input ref={priceRef} type="number" step="0.01" value={tempPrice} onChange={e => setTempPrice(e.target.value)} onBlur={() => savePrice(p)} onKeyDown={e => handlePriceKeyDown(e, p)} className="w-14 sm:w-16 px-1 py-0.5 text-right text-xs sm:text-sm font-bold border-2 border-brand-400 rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                      ) : (
                        <button onClick={() => startEditPrice(p)} className="text-sm font-bold text-brand-600 hover:bg-brand-50 px-1 py-0.5 rounded-lg transition-all cursor-text tabular-nums">
                          {formatCurrency(p.price)}
                        </button>
                      )}
                    </div>

                    {/* Stock - tap to edit */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] text-gray-400">สต๊อก</span>
                      {editingStock === p.id ? (
                        <input ref={stockRef} type="number" value={tempStock} onChange={e => setTempStock(e.target.value)} onBlur={() => saveStock(p)} onKeyDown={e => handleStockKeyDown(e, p)} className="w-14 sm:w-16 px-1 py-0.5 text-right text-xs sm:text-sm font-bold border-2 border-brand-400 rounded-lg focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ) : (
                        <button onClick={() => startEditStock(p)} className={`text-xs sm:text-base font-bold px-1 py-0.5 rounded-lg transition-all cursor-text hover:bg-gray-50 tabular-nums ${p.stock_qty < 10 ? 'text-danger-600' : 'text-success-600'}`}>
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

      {/* Floating Delete Bar */}
      {isSelectMode && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4 animate-slideUp">
          <div className="bg-danger-600 text-white rounded-2xl shadow-xl px-5 py-3.5 flex items-center justify-between">
            <span className="font-semibold">เลือก {selected.size} รายการ</span>
            <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 bg-white text-danger-600 font-bold rounded-xl hover:bg-danger-50 active:scale-95 transition-all">
              <Trash2 size={18} />ลบ
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="จัดเรียง & คัดกรอง" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">จัดเรียงตาม</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSortBy('name_asc')} className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${sortBy === 'name_asc' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>ตัวอักษร (ก-ฮ)</button>
              <button onClick={() => setSortBy('sales_desc')} className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${sortBy === 'sales_desc' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>ยอดขายสูงสุด</button>
              <button onClick={() => setSortBy('price_desc')} className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${sortBy === 'price_desc' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>ราคาสูง-ต่ำ</button>
              <button onClick={() => setSortBy('stock_asc')} className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${sortBy === 'stock_asc' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>สต๊อกเหลือน้อย</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">ประเภท</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterType('')} className={`py-1.5 px-3 rounded-full text-sm font-medium border transition-colors ${filterType === '' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>ทั้งหมด</button>
              {uniqueTypes.map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`py-1.5 px-3 rounded-full text-sm font-medium border transition-colors ${filterType === t ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">ขนาด</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterSize('')} className={`py-1.5 px-3 rounded-full text-sm font-medium border transition-colors ${filterSize === '' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>ทั้งหมด</button>
              {uniqueSizes.map(s => (
                <button key={s} onClick={() => setFilterSize(s)} className={`py-1.5 px-3 rounded-full text-sm font-medium border transition-colors ${filterSize === s ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600'}`}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setIsFilterModalOpen(false)} className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl active:scale-95 transition-all">ดูผลลัพธ์</button>
        </div>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fadeIn" onClick={() => setViewImage(null)}>
          <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors">
            <X size={28} />
          </button>
          <img src={viewImage} alt="Full Size" className="max-w-full max-h-full object-contain select-none" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
