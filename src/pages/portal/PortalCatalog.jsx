import { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronRight, Check, Sparkles, Tag, Eye } from 'lucide-react'
import { getProducts } from '../../lib/db'

export default function PortalCatalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSize, setFilterSize] = useState('')
  
  // Selected product modal
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getProducts()
        setProducts(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Unique types and sizes for filters
  const uniqueTypes = [...new Set(products.map(p => p.animal_type))].filter(Boolean).sort()
  const uniqueSizes = [...new Set(products.map(p => p.size))].filter(Boolean).sort()

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType && p.animal_type !== filterType) return false
    if (filterSize && p.size !== filterSize) return false
    return true
  })

  // Stock Status Indicator Helper
  function getStockIndicator(qty) {
    if (qty === 0) {
      return { label: 'สินค้าหมด', color: 'bg-red-50 text-red-600 border-red-100' }
    } else if (qty <= 10) {
      return { label: `ใกล้หมด (เหลือ ${qty})`, color: 'bg-amber-50 text-amber-600 border-amber-100' }
    } else {
      return { label: 'มีสินค้าในสต๊อก', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">แคตตาล็อกสินค้า</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">สำรวจรายการสินค้าพูรดาและตรวจสอบเรตราคาส่ง</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า..."
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl transition-all focus:outline-none placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category/Animal Select */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl font-bold text-slate-600 text-sm focus:outline-none cursor-pointer"
          >
            <option value="">หมวดหมู่ทั้งหมด</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Size Select */}
          <select
            value={filterSize}
            onChange={e => setFilterSize(e.target.value)}
            className="px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl font-bold text-slate-600 text-sm focus:outline-none cursor-pointer"
          >
            <option value="">ขนาดทั้งหมด</option>
            {uniqueSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          {/* Reset Filters */}
          {(filterType || filterSize || search) && (
            <button
              onClick={() => { setFilterType(''); setFilterSize(''); setSearch('') }}
              className="px-4 py-3.5 text-red-500 hover:bg-red-50 rounded-2xl font-bold text-sm transition-all"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="h-96 flex items-center justify-center flex-col gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">กำลังโหลดรายการสินค้า...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
          <p className="text-slate-400 font-bold text-lg">ไม่พบข้อมูลสินค้าที่ค้นหา</p>
          <p className="text-slate-300 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือเคลียร์ตัวกรองด้านบน</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map(product => {
            const stock = getStockIndicator(product.stock_qty)
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Image Frame */}
                  <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden relative mb-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">📦</div>
                    )}
                    <span className="absolute top-2 left-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                      {product.animal_type || 'ทั่วไป'}
                    </span>
                  </div>

                  {/* Stock Status Badge */}
                  <span className={`inline-block border px-2 py-0.5 rounded-full text-[9px] font-black leading-none mb-2.5 ${stock.color}`}>
                    {stock.label}
                  </span>

                  {/* Info */}
                  <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 h-10 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{product.size || '-'}</span>
                    <span>{product.weight_g ? `• ${product.weight_g} กรัม` : ''}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Starting at</p>
                    <p className="text-base font-black text-blue-600 tracking-tight mt-1">
                      ฿{Number(product.price_20 || product.price).toLocaleString()}
                    </p>
                  </div>
                  <span className="p-2 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 rounded-xl transition-all">
                    <Eye size={16} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ================= DETAILED MODAL ================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setSelectedProduct(null)}>
          <div 
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-popIn flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500" />
                รายละเอียดสินค้า
              </h2>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="w-full md:w-1/2 aspect-square bg-slate-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center text-slate-300">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>

                {/* Main Information */}
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                      {selectedProduct.animal_type || 'ทั่วไป'}
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mt-2 leading-snug">{selectedProduct.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">ขนาดแพ็คเกจ</p>
                      <p className="text-sm font-black text-slate-700 mt-1">{selectedProduct.size || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">น้ำหนักต่อหน่วย</p>
                      <p className="text-sm font-black text-slate-700 mt-1">{selectedProduct.weight_g ? `${selectedProduct.weight_g} กรัม` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">หน่วยนับ</p>
                      <p className="text-sm font-black text-slate-700 mt-1">{selectedProduct.unit || 'ชิ้น'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">สถานะคลังสินค้า</p>
                      <p className="text-sm font-black text-slate-700 mt-1">
                        {selectedProduct.stock_qty > 0 ? `พร้อมส่ง (${selectedProduct.stock_qty} ${selectedProduct.unit})` : 'สินค้าหมด'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wholesale Pricing Tiers */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Tag size={16} className="text-blue-500" />
                  โครงสร้างตารางราคาส่งคู่ค้า (ยังไม่รวม Vat 7%)
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Tier 1 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">1 - 5 {selectedProduct.unit}</p>
                    <p className="text-lg font-black text-slate-800 mt-2">฿{Number(selectedProduct.price).toLocaleString()}</p>
                  </div>
                  {/* Tier 6 */}
                  <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase leading-none">6 - 11 {selectedProduct.unit}</p>
                    <p className="text-lg font-black text-blue-600 mt-2">฿{Number(selectedProduct.price_6 || selectedProduct.price).toLocaleString()}</p>
                  </div>
                  {/* Tier 12 */}
                  <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase leading-none">12 - 19 {selectedProduct.unit}</p>
                    <p className="text-lg font-black text-blue-600 mt-2">฿{Number(selectedProduct.price_12 || selectedProduct.price).toLocaleString()}</p>
                  </div>
                  {/* Tier 20 */}
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-center text-white shadow-lg shadow-blue-500/20">
                    <p className="text-[10px] font-black text-blue-100 uppercase leading-none">20+ {selectedProduct.unit}</p>
                    <p className="text-lg font-black mt-2">฿{Number(selectedProduct.price_20 || selectedProduct.price).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-500">ราคาขายปลีกแนะนำหน้าร้าน (รวม Vat)</span>
                  <span className="font-black text-emerald-600 text-base">฿{Number(selectedProduct.retail_price || selectedProduct.price).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
