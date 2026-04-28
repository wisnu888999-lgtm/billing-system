import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit3, ShoppingBag, Receipt, TrendingUp, Calendar, MapPin, Phone, Package, ChevronRight, Star, Search } from 'lucide-react'
import { getCustomerInsight } from '../../lib/db'
import { formatCurrency, formatDate } from '../../lib/utils'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const result = await getCustomerInsight(id)
    setData(result)
    setLoading(false)
  }

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="text-center py-20 text-gray-400 font-bold">ไม่พบข้อมูลลูกค้า</div>

  const { customer, stats, topProducts, recentInvoices } = data

  const filteredInvoices = recentInvoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4 animate-fadeIn pb-10 max-w-[850px] mx-auto text-gray-800">
      {/* 1. Header Card (Premium Square Profile) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 flex flex-row gap-4 sm:gap-6 relative shadow-sm border border-slate-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 opacity-40 blur-2xl" />
        
        <button 
          onClick={() => navigate(`/customers/${customer.id}/edit`)}
          className="absolute top-4 right-4 p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all border border-brand-100/50 shadow-sm z-20 active:scale-90"
        >
          <Edit3 size={18} />
        </button>

        <div className="w-20 h-20 sm:w-32 sm:h-32 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden rounded-xl border-2 sm:border-4 border-white shadow-md relative z-10">
          {customer.image_url ? (
            <img src={customer.image_url} alt={customer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-black tracking-tighter text-xs sm:text-xl">
              PROFILE
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0 pr-8 relative z-10">
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate">{customer.name || 'ชื่อลูกค้า'}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-wider whitespace-nowrap">
              {customer.branch_type === 'สำนักงานใหญ่' ? 'สนง.ใหญ่' : `สาขา ${customer.branch_code || '-'}`}
            </span>
            {customer.phone && <span className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1"><Phone size={10} className="text-brand-400" /> {customer.phone}</span>}
          </div>
          <p className="text-[11px] sm:text-sm text-slate-400 leading-snug mt-1.5 font-medium line-clamp-2 sm:line-clamp-none">{customer.address || 'ยังไม่มีข้อมูลที่อยู่ติดต่อ'}</p>
        </div>
      </div>

      {/* 2. Stats & Top Products Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Stats Column (Premium Bars) */}
        <div className="space-y-2.5">
          {[
            { label: 'ยอดซื้อรวม', value: formatCurrency(stats.totalSpent), color: 'bg-brand-500', icon: <ShoppingBag size={14}/> },
            { label: 'จำนวนบิล', value: `${stats.totalInvoices} ใบ`, color: 'bg-slate-400', icon: <Receipt size={14}/> },
            { label: 'ค้างชำระ', value: formatCurrency(stats.pendingAmount), color: 'bg-warning-500', icon: <TrendingUp size={14}/> },
            { label: 'สั่งล่าสุด', value: stats.lastOrderDate ? formatDate(stats.lastOrderDate) : '-', color: 'bg-slate-300', icon: <Calendar size={14}/> }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl px-5 py-4 flex justify-between items-center shadow-sm border border-slate-50 relative overflow-hidden group hover:border-brand-100 transition-all">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.color} opacity-80`} />
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${s.color.replace('bg-', 'bg-')}/10 text-slate-400 opacity-60`}>
                  {s.icon}
                </div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{s.label}</span>
              </div>
              <span className="text-base font-black text-slate-900 tabular-nums tracking-tight">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Right: Top Products Column (Elegant List) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50/30 rounded-full -mr-12 -mt-12 blur-xl" />
          
          <h3 className="text-[11px] font-black mb-4 text-slate-400 uppercase tracking-widest flex items-center gap-2 relative z-10">
            <Star size={12} className="text-brand-400" fill="currentColor" /> สินค้าที่ชอบสั่ง
          </h3>
          <div className="space-y-2.5 flex-1 relative z-10">
            {topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-transparent hover:border-brand-100 hover:bg-white transition-all group cursor-default">
                  <div className="w-12 h-12 bg-white rounded-lg shrink-0 overflow-hidden border border-slate-100 shadow-sm">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-slate-800 leading-tight truncate">{p.name}</p>
                    <p className="text-[10px] font-bold text-brand-500 mt-0.5">สั่งรวม {p.qty} ชิ้น</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-300 py-4 italic">ยังไม่มีข้อมูลสินค้า</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Invoice History Section (Functional Search & Filter) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Receipt size={14} className="text-brand-400" /> ประวัติบิลล่าสุด
          </h3>
          <div className="flex items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 text-slate-600 text-[11px] font-black rounded-lg border border-slate-200/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอชำระ</option>
              <option value="paid">จ่ายแล้ว</option>
              <option value="overdue">เกินกำหนด</option>
            </select>
            <div className="relative flex-1 sm:w-48">
              <input 
                type="text"
                placeholder="ค้นหาเลขที่บิล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-100 text-slate-600 text-[11px] font-black rounded-lg border border-slate-200/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-50 overflow-hidden">
          {filteredInvoices.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredInvoices.map(inv => (
                <div key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-1 h-8 rounded-full ${inv.status === 'paid' ? 'bg-success-500' : inv.status === 'pending' ? 'bg-warning-500' : 'bg-danger-500'} opacity-30 group-hover:opacity-100 transition-all`} />
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-slate-800 group-hover:text-brand-600 transition-colors">{inv.invoice_number}</span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-tight">{formatDate(inv.invoice_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(inv.total)}</p>
                      <div className="mt-0.5 scale-75 origin-right"><StatusBadge status={inv.status} /></div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-400 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-3 opacity-50">
              <Receipt size={40} strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">
                {recentInvoices.length === 0 ? 'No Order History' : 'No matching results'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        <button onClick={() => navigate('/customers')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
          <ArrowLeft size={14} /> กลับหน้ารายชื่อลูกค้า
        </button>
      </div>
    </div>
  )
}
