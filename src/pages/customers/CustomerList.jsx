import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, Search, X, Trophy, Zap, Trash2, Check, History, TrendingUp, AlertCircle, CheckSquare } from 'lucide-react'
import SearchBar from '../../components/SearchBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { getCustomers, getCustomerSpendingStats, deleteCustomer, logActivity } from '../../lib/db'
import { getCookie } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [spendingStats, setSpendingStats] = useState({})
  const [recentSearches, setRecentSearches] = useState([])
  const [winners, setWinners] = useState({ month: null, year: null, ever: null, mostCount: null, mostTotal: null })
  const [showIdleAlert, setShowIdleAlert] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('recent_customer_searches')
    if (saved) setRecentSearches(JSON.parse(saved))
    loadCustomers()
  }, [])

  // Exit selection mode when nothing is selected
  useEffect(() => {
    if (selectionMode && selected.size === 0) {
      // Small delay so user can see deselection animation
      const t = setTimeout(() => setSelectionMode(false), 300)
      return () => clearTimeout(t)
    }
  }, [selected, selectionMode])

  async function loadCustomers() {
    setLoading(true)
    try {
      const [data, stats] = await Promise.all([getCustomers(), getCustomerSpendingStats()])
      setCustomers(data || [])
      setSpendingStats(stats || {})

      let topM = { id: null, val: 0 }, topY = { id: null, val: 0 }, topE = { id: null, val: 0 }
      let topC = { id: null, val: 0 }, topT = { id: null, val: 0 }
      
      Object.entries(stats || {}).forEach(([id, s]) => {
        if (s.month > topM.val) { topM.id = id; topM.val = s.month }
        if (s.year > topY.val) { topY.id = id; topY.val = s.year }
        if (s.total > topE.val) { topE.id = id; topE.val = s.total }
        if (s.count > topC.val) { topC.id = id; topC.val = s.count }
        if (s.total > topT.val) { topT.id = id; topT.val = s.total }
      })
      setWinners({ month: topM.id, year: topY.id, ever: topE.id, mostCount: topC.id, mostTotal: topT.id })
    } catch (err) {
      console.error(err)
      toast.error('โหลดข้อมูลล้มเหลว')
    }
    setLoading(false)
  }

  // Enter selection mode and select a card
  function enterSelectionMode(id, index) {
    setSelectionMode(true)
    setSelected(new Set([id]))
    setLastSelectedIndex(index)
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(60)
  }

  function toggleSelect(id, index, shiftKey = false) {
    if (!selectionMode) return

    if (shiftKey && lastSelectedIndex !== null) {
      // Range select with Shift
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = filtered.slice(start, end + 1).map(c => c.id)
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
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  function exitSelectionMode() {
    setSelected(new Set())
    setSelectionMode(false)
    setLastSelectedIndex(null)
  }

  // Long press handlers for mobile
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

  // Card click handler
  function handleCardClick(e, customer, index) {
    if (isDeleting) return

    // Ctrl / Cmd + Click → toggle selection mode
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (!selectionMode) {
        enterSelectionMode(customer.id, index)
      } else {
        toggleSelect(customer.id, index, false)
      }
      return
    }

    // Shift+Click while in selection mode → range select
    if (e.shiftKey && selectionMode) {
      e.preventDefault()
      toggleSelect(customer.id, index, true)
      return
    }

    // In selection mode → toggle this item
    if (selectionMode) {
      toggleSelect(customer.id, index, false)
      return
    }

    // If long press was triggered, don't navigate
    if (longPressTriggered.current) return

    navigate(`/customers/${customer.id}`)
  }

  async function handleDeleteSelected() {
    const count = selected.size
    const uid = getCookie('userId')
    
    setIsDeleting(true)
    const loadId = toast.loading(`กำลังย้าย ${count} รายการลงถังขยะ...`)
    
    try {
      await Promise.all(Array.from(selected).map(async (id) => {
        const c = customers.find(x => x.id === id)
        await deleteCustomer(id)
        if (c) await logActivity(uid, 'ลบลูกค้า (ลงถังขยะ)', c.name)
      }))
      
      toast.success(`ย้ายลงถังขยะ ${count} รายการแล้ว`, { id: loadId })
      exitSelectionMode()
      await loadCustomers()
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาดในการลบ', { id: loadId })
    } finally {
      setIsDeleting(false)
    }
  }

  const addToRecent = (term) => {
    if (!term || term.trim().length < 2) return
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('recent_customer_searches', JSON.stringify(newRecent))
  }

  const filtered = customers.filter(c => {
    const s = search.toLowerCase().trim()
    if (!s) return true
    return (c.name || '').toLowerCase().includes(s) || 
           (c.phone || '').includes(s) || 
           (c.address || '').toLowerCase().includes(s)
  })

  return (
    <div className="space-y-4 animate-fadeIn pb-32">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>👥 ลูกค้า</span>
          {customers.length > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{customers.length} คน</span>}
        </h2>
        <div className="flex gap-2">
          {selectionMode ? (
            <>
              <button
                onClick={selectAll}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition-all flex items-center gap-1.5"
              >
                <CheckSquare size={16} />
                {selected.size === filtered.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
              <button
                onClick={exitSelectionMode}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-2xl transition-all"
              >
                ยกเลิก
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/customers/recycle-bin')} className="p-3 bg-white border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group">
              <Trash2 size={20} className="group-hover:text-danger-500 transition-colors" />
            </button>
          )}
          <button onClick={() => navigate('/customers/new')} className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-md active:scale-95 transition-all">
            <Plus size={20} /> เพิ่มลูกค้า
          </button>
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

      {/* Search & Stats */}
      <div className="space-y-3">
        <div className="relative">
          <SearchBar value={search} onChange={setSearch} onBlur={() => search && addToRecent(search)} placeholder="ค้นหาลูกค้า..." />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-2"><X size={18} /></button>}
        </div>
        
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <History size={14} className="text-gray-400 shrink-0" />
            {recentSearches.map((s, i) => (
              <button key={i} onClick={() => setSearch(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${search === s ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-gray-500 border-gray-100 hover:border-brand-200'}`}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="ไม่พบลูกค้า" description={search ? 'ลองเปลี่ยนคำค้นหา' : 'คุณยังไม่มีลูกค้าในระบบ'} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((customer, index) => {
            const stats = spendingStats[customer.id] || { month: 0, year: 0, total: 0, lastDate: null, count: 0 }
            const daysIdle = stats.lastDate ? Math.floor((new Date() - new Date(stats.lastDate)) / (1000 * 60 * 60 * 24)) : 999
            const isWinner = winners.month === customer.id || winners.year === customer.id || winners.ever === customer.id
            const isTopFlame = winners.mostCount === customer.id || winners.mostTotal === customer.id
            const isSel = selected.has(customer.id)

            // Inactivity visual effects
            const idleEffect = daysIdle > 180 ? 'effect-broken'
              : daysIdle > 90 ? 'effect-rust'
              : daysIdle > 30 ? 'effect-dust'
              : ''

            return (
              <div key={customer.id} className={`relative group ${isTopFlame || isWinner ? 'z-30' : 'z-10'}`}>
                <button
                  disabled={isDeleting}
                  onClick={(e) => handleCardClick(e, customer, index)}
                  onPointerDown={() => handlePointerDown(customer.id, index)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  className={`customer-card w-full text-left rounded-[2rem] p-5 shadow-sm border active:scale-[0.98] min-h-[104px] flex items-center group/card transition-all relative overflow-visible
                    ${idleEffect}
                    ${isWinner ? 'champion-shake' : ''}
                    ${isSel
                      ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-100 shadow-md'
                      : isWinner
                        ? 'glow-card bg-white'
                        : 'bg-white border-gray-100 hover:shadow-md hover:border-brand-200'
                    } 
                    ${isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                >
                  <div className="flex items-center gap-4 w-full relative z-10">

                    {/* Checkbox — only visible in selection mode */}
                    <div className={`shrink-0 transition-all duration-200 overflow-hidden ${selectionMode ? 'w-8 opacity-100' : 'w-0 opacity-0'}`}>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all
                        ${isSel
                          ? 'bg-brand-600 border-brand-600 text-white scale-110 shadow-sm'
                          : 'bg-white border-gray-300'
                        }`}
                      >
                        {isSel && <Check size={18} strokeWidth={4} />}
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      {/* 🔥 Flame Effect - Positioned around profile */}
                      {(isTopFlame || isWinner) && !isSel && (
                        <div className={`fire-wrapper ${isWinner ? 'flame-purple' : isTopFlame ? 'flame-red' : 'flame-blue'}`}>
                          <div className="fire-particle" />
                          <div className="fire-particle" />
                          <div className="fire-particle" />
                          <div className="fire-particle" />
                        </div>
                      )}
                      <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden border border-brand-100 relative z-10 shadow-sm">
                        {customer.image_url 
                          ? <img src={customer.image_url} alt="" className="w-full h-full object-cover" /> 
                          : <span className="text-xl font-black text-brand-500">{customer.name[0]}</span>}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-gray-800 truncate">{customer.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${customer.branch_type === 'สำนักงานใหญ่' ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                          {customer.branch_type === 'สำนักงานใหญ่' ? '🏢 สนง.ใหญ่' : `🏬 สาขา ${customer.branch_code || ''}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 overflow-hidden">
                        {stats.count > 0 && <p className="text-[11px] sm:text-xs text-brand-500 font-bold truncate">สั่งแล้ว {stats.count} ครั้ง</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-end shrink-0 ml-1 sm:ml-2 min-w-0 max-w-[100px] sm:max-w-none">
                      {winners.month === customer.id && (
                        <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-danger-500 text-white rounded-lg text-[8px] sm:text-[10px] font-black flex items-center gap-1 shadow-sm animate-bounce whitespace-nowrap">
                          <Trophy size={9} className="sm:w-3 sm:h-3" /> แชมป์เดือนนี้
                        </div>
                      )}
                      {isTopFlame && (
                        <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-brand-600 text-white rounded-lg text-[8px] sm:text-[10px] font-black flex items-center gap-1 shadow-sm whitespace-nowrap">
                          <Zap size={9} className="sm:w-3 sm:h-3" /> {winners.mostTotal === customer.id ? 'ซื้อสูงสุด' : 'สั่งบ่อยสุด'}
                        </div>
                      )}
                      {daysIdle > 30 && (
                        <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-800 text-gray-200 rounded-lg text-[9px] sm:text-[10px] font-black border border-gray-600">
                          👻 {daysIdle} วัน
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
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
                <span className="text-sm font-black">รายการที่เลือก</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ย้ายลงถังขยะ</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={exitSelectionMode} 
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleDeleteSelected} 
                disabled={isDeleting}
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
