import { useState, useEffect } from 'react'
import { Search, Tag, Check, Filter } from 'lucide-react'
import { getProducts } from '../../lib/db'

export default function PortalPricing() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

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

  const categories = [...new Set(products.map(p => p.animal_type).filter(Boolean))].sort()

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCategory && p.animal_type !== selectedCategory) return false
    return true
  })

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">รายการตารางราคา (Pricing Sheet)</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">ตารางค้นหาข้อมูลและเรตราคาส่งจำแนกตามจำนวนสั่งซื้อสำหรับร้านค้า</p>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="พิมพ์ชื่อสินค้าเพื่อค้นหาความเร็วสูง..."
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl transition-all focus:outline-none placeholder:text-slate-400 font-bold"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Sheet Table */}
      {loading ? (
        <div className="h-96 flex items-center justify-center flex-col gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">กำลังดาวน์โหลดรายการราคาส่ง...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-[2rem]">
          <p className="text-slate-400 font-bold">ไม่พบข้อมูลราคาสินค้าตามตัวกรองนี้</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4.5">ชื่อสินค้า</th>
                  <th className="px-6 py-4.5">หมวดหมู่</th>
                  <th className="px-6 py-4.5">ขนาดแพ็คเกจ</th>
                  <th className="px-6 py-4.5 text-right">ส่ง 1 ชิ้น</th>
                  <th className="px-6 py-4.5 text-right">ส่ง 6 ชิ้น</th>
                  <th className="px-6 py-4.5 text-right">ส่ง 12 ชิ้น</th>
                  <th className="px-6 py-4.5 text-right bg-blue-50/40 text-blue-600">ส่ง 20 ชิ้น+</th>
                  <th className="px-6 py-4.5 text-right text-emerald-600">ขายปลีก (Vat)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors font-medium">
                    {/* Name */}
                    <td className="px-6 py-4 text-slate-800 font-bold max-w-[280px]">
                      <span className="block truncate" title={product.name}>{product.name}</span>
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {product.animal_type || 'ทั่วไป'}
                      </span>
                    </td>
                    {/* Size */}
                    <td className="px-6 py-4 text-slate-500">
                      <span>{product.size || '-'}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{product.weight_g ? `${product.weight_g}g` : ''}</span>
                    </td>
                    {/* Tier 1 */}
                    <td className="px-6 py-4 text-right text-slate-700 font-bold tabular-nums">
                      ฿{Number(product.price || 0).toLocaleString()}
                    </td>
                    {/* Tier 6 */}
                    <td className="px-6 py-4 text-right text-slate-600 tabular-nums">
                      ฿{Number(product.price_6 || product.price).toLocaleString()}
                    </td>
                    {/* Tier 12 */}
                    <td className="px-6 py-4 text-right text-slate-600 tabular-nums">
                      ฿{Number(product.price_12 || product.price).toLocaleString()}
                    </td>
                    {/* Tier 20 */}
                    <td className="px-6 py-4 text-right bg-blue-50/30 text-blue-600 font-black tabular-nums">
                      ฿{Number(product.price_20 || product.price).toLocaleString()}
                    </td>
                    {/* Retail Price */}
                    <td className="px-6 py-4 text-right text-emerald-600 font-black tabular-nums">
                      ฿{Number(product.retail_price || product.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
