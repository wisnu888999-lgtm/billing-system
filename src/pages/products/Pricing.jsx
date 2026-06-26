import { useState, useEffect } from 'react'
import { getProducts, updateProduct, getProductPriceHistory } from '../../lib/db'
import { Tag, History, Edit3, X, Save, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Pricing() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modals state
  const [editingProduct, setEditingProduct] = useState(null)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [historyLogs, setHistoryLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Edit Form State
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts()
      setProducts(data || [])  // guard against null
    } catch (err) {
      console.error(err)
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  function handleEditClick(product) {
    setFormData({
      price: product.price || 0,
      price_6: product.price_6 || 0,
      price_12: product.price_12 || 0,
      price_20: product.price_20 || 0,
      retail_price: product.retail_price || 0
    })
    setEditingProduct(product)
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    const updates = {
      price: Number(formData.price),
      price_6: Number(formData.price_6),
      price_12: Number(formData.price_12),
      price_20: Number(formData.price_20),
      retail_price: Number(formData.retail_price)
    }

    const updated = await updateProduct(editingProduct.id, updates)
    if (updated) {
      toast.success('อัปเดตราคาสำเร็จ')
      setEditingProduct(null)
      loadProducts()
    }
  }

  async function handleViewHistory(product) {
    setHistoryProduct(product)
    setHistoryLoading(true)
    const logs = await getProductPriceHistory(product.id)
    setHistoryLogs(logs)
    setHistoryLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="font-bold text-sm">กำลังโหลดข้อมูลราคา...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-8">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <Tag size={28} className="text-red-300" />
        </div>
        <div className="text-center">
          <p className="font-black text-gray-700 text-lg mb-1">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
        <button onClick={loadProducts} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
          ลองอีกครั้ง
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-brand-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
          <Tag size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">แคตตาล็อกราคาสินค้า</h1>
          <p className="text-sm font-bold text-gray-400 mt-1">ดูและจัดการราคาขายส่ง / ขายปลีก</p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-800 leading-tight">{product.name}</h3>
                    <div className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md">{product.size || '-'}</span>
                      <span>{product.weight_g ? `${product.weight_g}g` : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => handleEditClick(product)} className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <Edit3 size={18} />
                  </button>
                </div>

                <div className="space-y-2 mt-4 bg-gray-50 p-3 rounded-2xl">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">1 {product.unit || 'ชิ้น'} (+Vat 7%)</span>
                    <span className="font-black text-gray-800">{Number(product.price || 0).toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">6 {product.unit || 'ชิ้น'} (+Vat 7%)</span>
                    <span className="font-black text-blue-600">{Number(product.price_6 || 0).toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">12 {product.unit || 'ชิ้น'} (+Vat 7%)</span>
                    <span className="font-black text-blue-600">{Number(product.price_12 || 0).toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500">20 {product.unit || 'ชิ้น'} (+Vat 7%)</span>
                    <span className="font-black text-blue-600">{Number(product.price_20 || 0).toLocaleString()} ฿</span>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-gray-400">ราคาขายปลีกโดยประมาณ</span>
                  <span className="text-sm font-black text-green-600">{Number(product.retail_price || 0).toLocaleString()} ฿</span>
                </div>
              </div>

              <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                <button 
                  onClick={() => handleViewHistory(product)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 rounded-xl transition-all shadow-sm group-hover:shadow"
                >
                  <History size={16} />
                  ประวัติการปรับราคา
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL: EDIT PRICE ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Edit3 size={20} className="text-blue-500" />
                แก้ไขราคาสินค้า
              </h2>
              <button onClick={() => setEditingProduct(null)} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{editingProduct.name}</p>
                <p className="text-xs font-bold text-gray-400">{editingProduct.size} • {editingProduct.weight_g}g</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ราคาปลีก (1 {editingProduct.unit})</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ราคาส่ง (6 {editingProduct.unit})</label>
                    <input type="number" step="0.01" value={formData.price_6} onChange={e => setFormData({...formData, price_6: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ราคาส่ง (12 {editingProduct.unit})</label>
                    <input type="number" step="0.01" value={formData.price_12} onChange={e => setFormData({...formData, price_12: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ราคาส่ง (20 {editingProduct.unit})</label>
                    <input type="number" step="0.01" value={formData.price_20} onChange={e => setFormData({...formData, price_20: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ราคาปลีกแนะนำ (หน้าร้าน)</label>
                    <input type="number" step="0.01" value={formData.retail_price} onChange={e => setFormData({...formData, retail_price: e.target.value})} className="w-full bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 font-black" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                  <Save size={18} />
                  บันทึกราคา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: HISTORY ================= */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <History size={20} className="text-brand-500" />
                  ประวัติการปรับราคา
                </h2>
                <p className="text-xs font-bold text-gray-400 mt-0.5">{historyProduct.name} ({historyProduct.size})</p>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              {historyLoading ? (
                <div className="text-center py-10 text-gray-400 font-bold text-sm">กำลังดึงข้อมูล...</div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <History size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-bold">ยังไม่เคยมีการปรับราคาสินค้านี้</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {historyLogs.map((log, index) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline Dot */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Tag size={14} />
                      </div>
                      
                      {/* Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(log.changed_at).toLocaleDateString('th-TH')}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">{log.users?.name || 'System'}</span>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          {/* Compare Price 1 */}
                          {Number(log.old_price) !== Number(log.new_price) && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-12 font-bold text-gray-400">1 ชิ้น</span>
                              <span className="line-through text-gray-400">{Number(log.old_price)}</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-black text-blue-600">{Number(log.new_price)}</span>
                            </div>
                          )}
                          {/* Compare Price 6 */}
                          {Number(log.old_price_6) !== Number(log.new_price_6) && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-12 font-bold text-gray-400">6 ชิ้น</span>
                              <span className="line-through text-gray-400">{Number(log.old_price_6)}</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-black text-blue-600">{Number(log.new_price_6)}</span>
                            </div>
                          )}
                           {/* Compare Price 12 */}
                           {Number(log.old_price_12) !== Number(log.new_price_12) && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-12 font-bold text-gray-400">12 ชิ้น</span>
                              <span className="line-through text-gray-400">{Number(log.old_price_12)}</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-black text-blue-600">{Number(log.new_price_12)}</span>
                            </div>
                          )}
                          {/* Compare Price 20 */}
                          {Number(log.old_price_20) !== Number(log.new_price_20) && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-12 font-bold text-gray-400">20 ชิ้น</span>
                              <span className="line-through text-gray-400">{Number(log.old_price_20)}</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-black text-blue-600">{Number(log.new_price_20)}</span>
                            </div>
                          )}
                          {/* Compare Retail Price */}
                          {Number(log.old_retail_price) !== Number(log.new_retail_price) && (
                            <div className="flex items-center gap-2 text-xs pt-1 border-t border-gray-50">
                              <span className="w-12 font-bold text-gray-400">ขายปลีก</span>
                              <span className="line-through text-gray-400">{Number(log.old_retail_price)}</span>
                              <ArrowRight size={12} className="text-gray-300" />
                              <span className="font-black text-green-600">{Number(log.new_retail_price)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
