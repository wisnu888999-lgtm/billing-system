import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Edit3, Clock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getInvoice, updateInvoiceStatus, deleteInvoice, logActivity, getInvoiceHistory } from '../../lib/db'
import { formatCurrency, formatDate, getCookie } from '../../lib/utils'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [viewImage, setViewImage] = useState(null) // url
  
  const userRole = getCookie('userRole') || 'staff'
  const isAdmin = userRole === 'admin' || userRole === 'ceo'

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const data = await getInvoice(id)
    setInvoice(data)
    
    if (isAdmin) {
      const hist = await getInvoiceHistory(id)
      setHistory(hist)
    }
    setLoading(false)
  }

  async function markAsPaid() {
    if (!confirm('ยืนยันเปลี่ยนสถานะเป็น "ชำระแล้ว" ?')) return
    setUpdating(true)
    const result = await updateInvoiceStatus(id, 'paid')
    if (result) {
      await logActivity(getCookie('userId'), 'ชำระบิล', `${invoice.invoice_number} - ${formatCurrency(invoice.total)}`)
      toast.success('เปลี่ยนสถานะเรียบร้อย')
      setInvoice(prev => ({ ...prev, status: 'paid' }))
    }
    setUpdating(false)
  }

  async function handleDelete() {
    if (!confirm(`คุณต้องการย้ายบิล ${invoice.invoice_number} ไปที่ถังขยะใช่หรือไม่?`)) return
    const toastId = toast.loading('กำลังย้ายไปถังขยะ...')
    try {
      await deleteInvoice(id)
      await logActivity(getCookie('userId'), 'ลบบิล (ลงถังขยะ)', invoice.invoice_number)
      toast.success('ย้ายบิลไปที่ถังขยะแล้ว', { id: toastId })
      navigate('/invoices', { replace: true })
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาดในการลบ', { id: toastId })
    }
  }

  if (loading) return <LoadingSpinner />
  if (!invoice) return <div className="text-center py-16 text-gray-500">ไม่พบบิล</div>

  return (
    <div className="animate-fadeIn space-y-4 pb-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={22} /></button>
          <h2 className="text-xl font-bold text-brand-700">{invoice.invoice_number}</h2>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' && (
            <button onClick={() => navigate(`/invoices/${id}/edit`)} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-gray-600">
              <Edit3 size={18} />
            </button>
          )}
          <button onClick={handleDelete} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-danger-50 hover:text-danger-500 shadow-sm text-gray-600 transition-colors">
            <Trash2 size={18} />
          </button>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800">📍 ลูกค้า</h3>
          {invoice.po_number && <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-lg font-bold">PO: {invoice.po_number}</span>}
        </div>
        <p className="text-lg font-bold">{invoice.customers?.name || '-'}</p>
        {invoice.customer_branches && <p className="text-sm text-gray-500">สาขา: {invoice.customer_branches.branch_name}</p>}
        {invoice.customers?.phone && <p className="text-sm text-gray-500 mt-1">📞 {invoice.customers.phone}</p>}
        {invoice.customers?.address && <p className="text-sm text-gray-400 mt-1">{invoice.customers.address}</p>}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-bold mb-3 text-gray-800">📦 รายการสินค้า</h3>
        {(invoice.invoice_items || []).map((item, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
            <div><p className="font-medium text-sm text-gray-800">{item.product_name}</p><p className="text-xs text-gray-500 mt-0.5">x{item.qty} · {formatCurrency(item.price_per_unit)} / หน่วย</p></div>
            <p className="font-bold text-sm text-gray-800">{formatCurrency(item.total_price)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-500">ราคาก่อนลด</span><span>{formatCurrency(invoice.subtotal)}</span></div>
        {Number(invoice.discount_amount) > 0 && <div className="flex justify-between text-sm"><span className="text-danger-600">ส่วนลด</span><span className="text-danger-600">-{formatCurrency(invoice.discount_amount)}</span></div>}
        {invoice.vat_enabled && <div className="flex justify-between text-sm"><span className="text-gray-500">VAT 7%</span><span>+{formatCurrency(invoice.vat_amount)}</span></div>}
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-base sm:text-lg font-bold text-gray-800">ยอดรวมทั้งสิ้น</span>
          <span className="text-xl sm:text-2xl font-bold text-brand-700 tabular-nums">{formatCurrency(invoice.total)}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex justify-between text-sm"><span className="text-gray-500">วันวางบิล</span><span className="text-gray-800">{formatDate(invoice.invoice_date)}</span></div>
        <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">ครบกำหนด</span><span className="font-semibold text-gray-800">{formatDate(invoice.due_date)}</span></div>
        <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">ผู้สร้าง</span><span className="text-gray-800">{invoice.users?.name || '-'}</span></div>
        {invoice.note && <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">📝 {invoice.note}</div>}
      </div>

      {/* Attachments / Proof Images */}
      {invoice.attachment_urls && invoice.attachment_urls.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2">📸 รูปภาพหลักฐาน</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {invoice.attachment_urls.map((url, i) => (
              <button 
                key={i} 
                onClick={() => setViewImage(url)}
                className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 hover:opacity-80 transition-opacity active:scale-95"
              >
                <img src={url} alt={`Evidence ${i+1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mark as Paid */}
      {invoice.status !== 'paid' && (
        <button onClick={markAsPaid} disabled={updating}
          className="w-full py-4 mt-2 bg-success-600 hover:bg-success-700 text-white text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {updating ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"/> : <><CheckCircle size={22}/>เปลี่ยนเป็น "ชำระแล้ว"</>}
        </button>
      )}

      {/* Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewImage(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full backdrop-blur-md">
            <ArrowLeft size={24} className="rotate-90" />
          </button>
          <img src={viewImage} alt="Full view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Edit History (Admin only) */}
      {isAdmin && history.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-700">
            <Clock size={18} />
            <h3 className="font-bold">ประวัติการแก้ไขบิล (เฉพาะผู้ดูแล)</h3>
          </div>
          <div className="space-y-4">
            {history.map(h => (
              <div key={h.id} className="bg-white p-3 rounded-xl border border-gray-100 text-sm">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                  <span className="font-semibold text-brand-700">{h.users?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString('th-TH')}</span>
                </div>
                <div className="text-gray-600 flex justify-between">
                  <span className="text-xs">ยอดเดิม: {formatCurrency(h.previous_data?.invoice?.total || 0)}</span>
                  <span>{'->'}</span>
                  <span className="text-xs font-semibold">ยอดใหม่: {formatCurrency(h.new_data?.invoice?.total || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
