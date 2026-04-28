import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Trash2, Check, CheckSquare, X, Plus } from 'lucide-react'
import SearchBar from '../../components/SearchBar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { getInvoices, deleteInvoice, logActivity } from '../../lib/db'
import { formatCurrency, formatDate, getCookie } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  // Exit selection mode when nothing is selected
  useEffect(() => {
    if (selectionMode && selected.size === 0) {
      const t = setTimeout(() => setSelectionMode(false), 300)
      return () => clearTimeout(t)
    }
  }, [selected, selectionMode])

  async function load() {
    setLoading(true)
    setInvoices(await getInvoices())
    setLoading(false)
  }

  function enterSelectionMode(id, index) {
    setSelectionMode(true)
    setSelected(new Set([id]))
    setLastSelectedIndex(index)
    if (navigator.vibrate) navigator.vibrate(60)
  }

  function toggleSelect(id, index, shiftKey = false) {
    if (!selectionMode) return

    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = filtered.slice(start, end + 1).map(inv => inv.id)
      setSelected(prev => {
        const next = new Set(prev)
        rangeIds.forEach(rid => next.add(rid))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      setLastSelectedIndex(index)
    }
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(inv => inv.id)))
    }
  }

  function exitSelectionMode() {
    setSelected(new Set())
    setSelectionMode(false)
    setLastSelectedIndex(null)
  }

  function handlePointerDown(id, index) {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      enterSelectionMode(id, index)
    }, 500)
  }

  function handlePointerUp() {
    clearTimeout(longPressTimer.current)
  }

  function handlePointerLeave() {
    clearTimeout(longPressTimer.current)
  }

  function handleCardClick(e, inv, index) {
    if (isDeleting) return

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (!selectionMode) enterSelectionMode(inv.id, index)
      else toggleSelect(inv.id, index, false)
      return
    }

    if (e.shiftKey && selectionMode) {
      e.preventDefault()
      toggleSelect(inv.id, index, true)
      return
    }

    if (selectionMode) {
      toggleSelect(inv.id, index, false)
      return
    }

    if (longPressTriggered.current) return
    navigate(`/invoices/${inv.id}`)
  }

  async function handleDeleteSelected() {
    const count = selected.size
    const uid = getCookie('userId')
    setIsDeleting(true)
    const loadId = toast.loading(`กำลังย้าย ${count} รายการลงถังขยะ...`)
    try {
      await Promise.all(Array.from(selected).map(async (id) => {
        const inv = invoices.find(x => x.id === id)
        await deleteInvoice(id)
        if (inv) await logActivity(uid, 'ลบบิล (ลงถังขยะ)', inv.invoice_number)
      }))
      toast.success(`ย้ายลงถังขยะ ${count} รายการแล้ว`, { id: loadId })
      exitSelectionMode()
      await load()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาดในการลบ', { id: loadId })
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = invoices.filter(inv => {
    if (filterStatus && inv.status !== filterStatus) return false
    if (search) {
      const s = search.toLowerCase()
      if (!inv.invoice_number?.toLowerCase().includes(s) && !inv.customers?.name?.toLowerCase().includes(s)) return false
    }
    return true
  })

  return (
    <div className="space-y-4 animate-fadeIn pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🧾 รายการบิล</span>
          {invoices.length > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{invoices.length}</span>}
        </h2>
        <div className="flex gap-2">
          {selectionMode ? (
            <>
              <button onClick={selectAll} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition-all flex items-center gap-1.5">
                <CheckSquare size={16} />
                {selected.size === filtered.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
              <button onClick={exitSelectionMode} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-2xl transition-all">ยกเลิก</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/invoices/recycle-bin')} className="p-3 bg-white border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group">
                <Trash2 size={20} className="group-hover:text-danger-500 transition-colors" />
              </button>
              <button onClick={() => navigate('/invoices/new')} className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-md active:scale-95 transition-all">
                <Plus size={20} /> สร้างบิล
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selection Mode Hint */}
      {!selectionMode && !loading && filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 px-1 select-none">
          <span className="hidden sm:inline">💡 Ctrl+คลิก หรือ กดค้าง เพื่อเลือกหลายรายการ</span>
          <span className="sm:hidden">💡 กดค้างที่การ์ด เพื่อเลือกหลายรายการ</span>
        </div>
      )}

      {/* Selection Mode Banner */}
      {selectionMode && (
        <div className="flex items-center gap-2 text-xs text-brand-600 font-bold px-1 animate-fadeIn select-none">
          <Check size={13} strokeWidth={3} />
          <span>เลือกแล้ว {selected.size} รายการ · Shift+คลิก เพื่อเลือกช่วง</span>
        </div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาเลขบิลหรือชื่อร้าน..." />

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
        {['', 'pending', 'paid', 'overdue'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${filterStatus === s ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
            {s === '' ? 'ทั้งหมด' : s === 'pending' ? '⏳ รอชำระ' : s === 'paid' ? '✅ ชำระแล้ว' : '🔴 เกินกำหนด'}
          </button>
        ))}
        {/* Spacer to ensure the last item has right padding when scrolled */}
        <div className="shrink-0 w-2" />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="ไม่พบบิล" />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, index) => {
            const isSel = selected.has(inv.id)
            return (
              <button
                key={inv.id}
                disabled={isDeleting}
                onClick={(e) => handleCardClick(e, inv, index)}
                onPointerDown={() => handlePointerDown(inv.id, index)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                className={`w-full text-left rounded-[2rem] p-5 shadow-sm border transition-all active:scale-[0.98] flex items-center gap-4
                  ${isSel ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-100 shadow-md' : 'bg-white border-gray-100 hover:shadow-md hover:border-brand-200'}
                  ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
              >
                {/* Checkbox — only visible in selection mode */}
                <div className={`shrink-0 transition-all duration-200 overflow-hidden ${selectionMode ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}>
                  <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all
                    ${isSel ? 'bg-brand-600 border-brand-600 text-white scale-110 shadow-sm' : 'bg-white border-gray-300'}`}
                  >
                    {isSel && <Check size={18} strokeWidth={4} />}
                  </div>
                </div>

                <div className="flex-1 flex items-start justify-between min-w-0 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-700 text-sm sm:text-base">{inv.invoice_number}</p>
                      {inv.po_number && <span className="text-[9px] sm:text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold truncate max-w-[60px] sm:max-w-none">PO: {inv.po_number}</span>}
                    </div>
                    <p className="text-base sm:text-lg font-black text-gray-800 mt-0.5 truncate">{inv.customers?.name || '-'}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">ครบกำหนด: {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base sm:text-xl font-black text-gray-900 tabular-nums">{formatCurrency(inv.total)}</p>
                    <div className="mt-1 flex justify-end scale-90 sm:scale-100 origin-right"><StatusBadge status={inv.status} /></div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[9999] px-4 animate-slideUp">
          <div className="bg-gray-900/95 backdrop-blur-xl text-white rounded-[2.5rem] shadow-2xl px-7 py-5 flex items-center justify-between border border-white/10 ring-1 ring-black/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                {selected.size}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black">เลือกแล้ว</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ย้ายลงถังขยะ</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exitSelectionMode} disabled={isDeleting} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">ยกเลิก</button>
              <button onClick={handleDeleteSelected} disabled={isDeleting}
                className="flex items-center gap-2 px-6 py-2.5 bg-danger-600 text-white font-black rounded-2xl hover:bg-danger-500 active:scale-95 transition-all shadow-lg shadow-danger-600/30 disabled:opacity-50"
              >
                <Trash2 size={18} />
                {isDeleting ? 'กำลังลบ...' : 'ลบลงถังขยะ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
