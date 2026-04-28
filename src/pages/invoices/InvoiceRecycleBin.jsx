import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Trash2, FileX, Search, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { getDeletedInvoices, restoreInvoice, permanentlyDeleteInvoice, logActivity } from '../../lib/db'
import { getCookie, formatCurrency } from '../../lib/utils'

// === Confirmation Modal ===
function ConfirmModal({ mode, invoice, onConfirm, onCancel }) {
  if (!invoice) return null
  const isDelete = mode === 'delete'

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 animate-slideUp z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDelete ? 'bg-danger-50' : 'bg-brand-50'}`}>
          {isDelete ? <Trash2 size={28} className="text-danger-500" /> : <RotateCcw size={28} className="text-brand-500" />}
        </div>

        <h3 className="text-lg font-black text-center text-gray-800 mb-1">
          {isDelete ? 'ลบบิลถาวร?' : 'กู้คืนบิล?'}
        </h3>
        <p className="text-sm text-center text-gray-500 mb-6 leading-relaxed">
          {isDelete
            ? <><span className="font-bold text-gray-700">"{invoice.invoice_number}"</span><br />จะถูกลบออกจากระบบถาวร ไม่สามารถกู้คืนได้อีก</>
            : <><span className="font-bold text-gray-700">"{invoice.invoice_number}"</span><br />จะถูกย้ายกลับมาในรายการบิลปกติ</>
          }
        </p>

        {isDelete && (
          <div className="flex items-center gap-2 bg-danger-50 text-danger-700 text-xs font-bold p-3 rounded-2xl mb-5 border border-danger-100">
            <AlertTriangle size={14} className="shrink-0" />
            ข้อมูลนี้ไม่สามารถกู้คืนได้อีก
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all active:scale-95">
            ยกเลิก
          </button>
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

export default function InvoiceRecycleBin() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await getDeletedInvoices()
    setInvoices(data || [])
    setLoading(false)
  }

  async function handleConfirm() {
    const { mode, invoice } = modal
    setModal(null)

    if (mode === 'restore') {
      const toastId = toast.loading('กำลังกู้คืน...')
      try {
        await restoreInvoice(invoice.id)
        await logActivity(getCookie('userId'), 'กู้คืนบิล', invoice.invoice_number)
        toast.success(`กู้คืน "${invoice.invoice_number}" เรียบร้อยแล้ว`, { id: toastId })
        await load()
      } catch (err) {
        console.error(err)
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่', { id: toastId })
      }
    } else {
      const toastId = toast.loading('กำลังลบถาวร...')
      try {
        await permanentlyDeleteInvoice(invoice.id)
        await logActivity(getCookie('userId'), 'ลบบิลถาวร', invoice.invoice_number)
        toast.success('ลบข้อมูลถาวรแล้ว', { id: toastId })
        await load()
      } catch (err) {
        console.error(err)
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่', { id: toastId })
      }
    }
  }

  const filtered = invoices.filter(inv =>
    (inv.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.customers?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {modal && (
        <ConfirmModal
          mode={modal.mode}
          invoice={modal.invoice}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="space-y-4 animate-fadeIn pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">🗑️ ถังขยะบิล</h2>
            {invoices.length > 0 && <p className="text-xs text-gray-400">{invoices.length} รายการรอดำเนินการ</p>}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาบิลในถังขยะ..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              <X size={16} />
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileX}
            title="ถังขยะว่างเปล่า"
            description={search ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ไม่มีบิลที่ถูกลบ'}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map(inv => (
              <div key={inv.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-600 truncate">{inv.invoice_number}</h4>
                  <p className="text-sm font-bold text-gray-800">{inv.customers?.name || 'ไม่ระบุลูกค้า'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    💰 {formatCurrency(inv.total)} · 🗑️ {new Date(inv.deleted_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setModal({ mode: 'restore', invoice: inv })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-600 rounded-2xl hover:bg-brand-600 hover:text-white transition-all font-bold text-sm shadow-sm active:scale-95"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">กู้คืน</span>
                  </button>
                  <button
                    onClick={() => setModal({ mode: 'delete', invoice: inv })}
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
