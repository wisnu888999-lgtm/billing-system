import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Trash2, PackageX, Search, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { getDeletedProducts, restoreProduct, permanentlyDeleteProduct, logActivity } from '../../lib/db'
import { getCookie } from '../../lib/utils'

// === Confirmation Modal ===
function ConfirmModal({ mode, product, onConfirm, onCancel }) {
  if (!product) return null
  const isDelete = mode === 'delete'

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 animate-slideUp z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDelete ? 'bg-danger-50' : 'bg-brand-50'}`}>
          {isDelete ? <Trash2 size={28} className="text-danger-500" /> : <RotateCcw size={28} className="text-brand-500" />}
        </div>

        <h3 className="text-lg font-black text-center text-gray-800 mb-1">
          {isDelete ? 'ลบสินค้าถาวร?' : 'กู้คืนสินค้า?'}
        </h3>
        <p className="text-sm text-center text-gray-500 mb-6 leading-relaxed">
          {isDelete
            ? <><span className="font-bold text-gray-700">"{product.name}"</span><br />จะถูกลบออกจากระบบถาวรและไม่สามารถกู้คืนได้</>
            : <><span className="font-bold text-gray-700">"{product.name}"</span><br />จะถูกย้ายกลับมาในรายการสินค้าปกติ</>
          }
        </p>

        {isDelete && (
          <div className="flex items-center gap-2 bg-danger-50 text-danger-700 text-xs font-bold p-3 rounded-2xl mb-5 border border-danger-100">
            <AlertTriangle size={14} className="shrink-0" />
            ข้อมูลสต๊อกและประวัติของสินค้านี้จะหายไป
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all active:scale-95">ยกเลิก</button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 font-bold rounded-2xl transition-all active:scale-95 text-white ${isDelete ? 'bg-danger-500 hover:bg-danger-600 shadow-lg shadow-danger-100' : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-100'}`}
          >
            {isDelete ? 'ลบถาวร' : 'กู้คืน'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductRecycleBin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await getDeletedProducts()
    setProducts(data || [])
    setLoading(false)
  }

  async function handleConfirm() {
    const { mode, product } = modal
    setModal(null)

    if (mode === 'restore') {
      const toastId = toast.loading('กำลังกู้คืน...')
      try {
        await restoreProduct(product.id)
        await logActivity(getCookie('userId'), 'กู้คืนสินค้า', product.name)
        toast.success(`กู้คืน "${product.name}" เรียบร้อยแล้ว`, { id: toastId })
        await load()
      } catch (err) {
        console.error(err)
        toast.error('เกิดข้อผิดพลาด', { id: toastId })
      }
    } else {
      const toastId = toast.loading('กำลังลบถาวร...')
      try {
        await permanentlyDeleteProduct(product.id)
        await logActivity(getCookie('userId'), 'ลบสินค้าถาวร', product.name)
        toast.success('ลบสินค้าถาวรแล้ว', { id: toastId })
        await load()
      } catch (err) {
        console.error(err)
        toast.error('เกิดข้อผิดพลาด', { id: toastId })
      }
    }
  }

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.animal_type || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {modal && (
        <ConfirmModal
          mode={modal.mode}
          product={modal.product}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="space-y-4 animate-fadeIn pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')} className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">🗑️ ถังขยะสินค้า</h2>
            {products.length > 0 && <p className="text-xs text-gray-400">{products.length} รายการที่ถูกลบ</p>}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้าในถังขยะ..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1"><X size={16} /></button>}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="ถังขยะว่างเปล่า"
            description={search ? 'ไม่พบสินค้าที่ตรงกับการค้นหา' : 'ไม่มีรายการสินค้าที่ถูกลบ'}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                    : <span className="text-gray-400 font-bold text-lg">{p.name[0]}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-600 truncate">{p.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    🗑️ ลบเมื่อ {new Date(p.deleted_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setModal({ mode: 'restore', product: p })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-600 rounded-2xl hover:bg-brand-600 hover:text-white transition-all font-bold text-sm shadow-sm active:scale-95"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">กู้คืน</span>
                  </button>
                  <button
                    onClick={() => setModal({ mode: 'delete', product: p })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-danger-50 text-danger-600 rounded-2xl hover:bg-danger-600 hover:text-white transition-all font-bold text-sm shadow-sm active:scale-95"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">ลบถาวร</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
