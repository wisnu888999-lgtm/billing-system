import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Bell, ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import { getDueSoonInvoices } from '../lib/db'
import { formatCurrency, daysUntilDue, formatDaysUntilDue } from '../lib/utils'

const SESSION_KEY = 'due_bills_alert_dismissed'

export default function DueBillsAlert() {
  const [invoices, setInvoices] = useState([])
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // ถ้าปิดไปแล้วใน session นี้ ไม่ต้องแสดงอีก
    if (sessionStorage.getItem(SESSION_KEY)) return

    async function load() {
      const data = await getDueSoonInvoices()
      if (data && data.length > 0) {
        setInvoices(data)
        // หน่วงนิดนึงให้ animation สวย
        setTimeout(() => setVisible(true), 100)
      }
      setLoading(false)
    }
    load()
  }, [])

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  function goToInvoice(id) {
    dismiss()
    navigate(`/invoices/${id}`)
  }

  function goToAllPending() {
    dismiss()
    navigate('/invoices?status=pending')
  }

  if (!visible || loading || invoices.length === 0) return null

  // แบ่งกลุ่มตามความเร่งด่วน
  const critical = invoices.filter(inv => daysUntilDue(inv.due_date) <= 2)
  const warning  = invoices.filter(inv => daysUntilDue(inv.due_date) > 2)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-[2px] animate-fadeIn"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="fixed z-[1000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 animate-slideUp">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 px-6 pt-6 pb-8">
            {/* decorative circles */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell size={22} className="text-white" fill="white" />
              </div>
              <div>
                <p className="text-white/80 text-[11px] font-black uppercase tracking-widest">แจ้งเตือน</p>
                <h2 className="text-white text-xl font-black leading-tight">
                  มี {invoices.length} บิล<br/>ใกล้ครบกำหนดแล้ว!
                </h2>
              </div>
            </div>
          </div>

          {/* Bill List */}
          <div className="px-4 pt-3 pb-2 max-h-72 overflow-y-auto custom-scrollbar -mt-4">
            {/* Pull up card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

              {/* Critical (≤ 2 วัน) */}
              {critical.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border-b border-red-100">
                    <AlertTriangle size={11} className="text-red-500" />
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">เร่งด่วน — ≤ 2 วัน</span>
                  </div>
                  {critical.map(inv => (
                    <BillRow key={inv.id} inv={inv} urgent onClick={() => goToInvoice(inv.id)} />
                  ))}
                </div>
              )}

              {/* Warning (3–7 วัน) */}
              {warning.length > 0 && (
                <div>
                  {critical.length > 0 && (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border-b border-amber-100">
                      <Clock size={11} className="text-amber-500" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">ใกล้ครบกำหนด — 3–7 วัน</span>
                    </div>
                  )}
                  {warning.map(inv => (
                    <BillRow key={inv.id} inv={inv} onClick={() => goToInvoice(inv.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 pt-3 flex gap-2">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 bg-slate-100 text-slate-500 text-[12px] font-black rounded-xl hover:bg-slate-200 transition-all"
            >
              รับทราบ
            </button>
            <button
              onClick={goToAllPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[12px] font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200"
            >
              ดูบิลทั้งหมด <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function BillRow({ inv, urgent, onClick }) {
  const days = daysUntilDue(inv.due_date)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 text-left group"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-orange-600 transition-colors">
          {inv.customers?.name || 'ไม่ระบุลูกค้า'}
        </p>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{inv.invoice_number}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <div className="text-right">
          <p className="text-[12px] font-black text-slate-900">{formatCurrency(inv.total)}</p>
          <span className={`text-[10px] font-black ${urgent ? 'text-red-500' : 'text-amber-500'}`}>
            {formatDaysUntilDue(inv.due_date)}
          </span>
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-400 transition-all" />
      </div>
    </button>
  )
}
