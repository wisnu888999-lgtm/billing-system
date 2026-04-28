import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, AlertTriangle, FileText, Filter, Calendar, Users, ChevronDown, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getDashboardData, getCustomers } from '../lib/db'
import { formatCurrency, formatDate, daysUntilDue } from '../lib/utils'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    load()
    loadCustomers()
  }, [])

  async function load() {
    setLoading(true)
    setData(await getDashboardData(filters))
    setLoading(false)
  }

  async function loadCustomers() {
    setCustomers(await getCustomers())
  }

  const applyFilters = () => {
    load()
    setShowFilters(false)
  }

  const resetFilters = () => {
    const defaultFilters = { customerId: '', startDate: '', endDate: '' }
    setFilters(defaultFilters)
    setLoading(true)
    getDashboardData(defaultFilters).then(setData).finally(() => setLoading(false))
  }

  if (loading && !data) return <LoadingSpinner text="กำลังประมวลผลข้อมูล..." />
  if (!data) return null

  const summaryCards = [
    { label: 'ยอดรวมทั้งหมด', value: formatCurrency(data.totalAmount), icon: TrendingUp, color: 'from-brand-500 to-brand-700', onClick: () => navigate('/invoices') },
    { label: 'กำไรสุทธิ', value: formatCurrency(data.totalProfit), icon: TrendingUp, color: 'from-success-600 to-success-800' },
    { label: 'อัตรากำไร', value: data.totalAmount > 0 ? ((data.totalProfit / data.totalAmount) * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: 'from-indigo-500 to-indigo-700' },
    { label: 'รอชำระ', value: formatCurrency(data.totalPending), icon: Clock, color: 'from-warning-500 to-warning-600', onClick: () => navigate('/invoices?status=pending') },
    { label: 'เกินกำหนด', value: formatCurrency(data.totalOverdue), icon: AlertTriangle, color: 'from-danger-500 to-danger-700', onClick: () => navigate('/invoices?status=overdue') },
    { label: 'จำนวนบิล', value: data.invoiceCount, icon: FileText, color: 'from-gray-500 to-gray-700', onClick: () => navigate('/invoices') },
  ]

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-3 sm:mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tighter flex items-center gap-2">
            <span className="text-brand-600">📊</span> ภาพรวมระบบ
          </h2>
          <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5 ml-1">Live Analytics Dashboard</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition-all border shadow-sm ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          <Filter size={16} />
          <span className="text-xs">ตัวกรอง</span>
          {activeFiltersCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-brand-500 text-white text-[9px] rounded-full">{activeFiltersCount}</span>}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-3xl p-5 mb-6 border border-gray-100 shadow-xl animate-fadeIn relative z-30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">ลูกค้า</label>
              <select 
                value={filters.customerId}
                onChange={e => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
              >
                <option value="">ทั้งหมด</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">ตั้งแต่วันที่</label>
              <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">จนถึงวันที่</label>
              <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={resetFilters} className="text-xs font-bold text-gray-400 hover:text-danger-500 transition-colors">ล้างค่า</button>
            <button onClick={applyFilters} className="px-6 py-2 bg-brand-600 text-white text-xs font-black rounded-lg hover:bg-brand-700 transition-all shadow-lg active:scale-95">ค้นหา</button>
          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {summaryCards.map((card, i) => (
          <div 
            key={i} 
            onClick={card.onClick}
            className={`bg-gradient-to-br ${card.color} rounded-[1.2rem] sm:rounded-[1.5rem] p-3 sm:p-4 text-white shadow-md relative overflow-hidden group transition-all active:scale-95 ${card.onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
          >
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <card.icon size={40} className="sm:w-14 sm:h-14" />
            </div>
            <div className="flex items-center gap-1 mb-0 opacity-70 relative z-10">
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] truncate">{card.label}</span>
            </div>
            <p className="text-sm sm:text-xl font-black relative z-10 truncate tabular-nums tracking-tighter" title={card.value}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Sales Trend Line Chart */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col h-[300px] lg:h-[320px]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-black text-gray-800 flex items-center gap-2 tracking-tight">
              <TrendingUp className="text-brand-500" size={18} />
              แนวโน้มยอดขาย
            </h3>
            <span className="text-[8px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Analytics</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            {data.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={d => d.split('-').slice(2).join('/')} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 15px 20px -5px rgb(0 0 0 / 0.1)', padding: '10px 14px' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px', color: '#1e293b' }}
                    labelStyle={{ fontWeight: 800, fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}
                    formatter={(val) => [formatCurrency(val), 'ยอดขาย']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold">ไม่มีข้อมูลยอดขาย</div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col h-[300px] lg:h-[320px]">
          <h3 className="text-sm sm:text-base font-black text-gray-800 mb-4 flex items-center gap-2 tracking-tight">
            <Clock className="text-warning-500" size={18} />
            สัดส่วนบิล
          </h3>
          <div className="flex-1 relative flex items-center justify-center min-h-0">
            {data.statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusDistribution} innerRadius="65%" outerRadius="88%" paddingAngle={6} dataKey="value" stroke="none">
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.8rem', border: 'none', boxShadow: '0 8px 12px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Total</span>
                  <span className="text-2xl font-black text-gray-800 leading-none tracking-tighter">{data.invoiceCount}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-xs font-bold">ไม่มีข้อมูลบิล</div>
            )}
          </div>
          <div className="mt-3 space-y-1">
            {data.statusDistribution.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.1em]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-400">{s.name}</span>
                </div>
                <span className="text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-3">
        {/* Top Customers Bar Chart */}
        <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col h-[260px]">
          <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-success-500" size={18} />
            ลูกค้าที่ยอดสั่งสูงสุด
          </h3>
          <div className="flex-1 w-full min-h-0">
            {data.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCustomers} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '0.8rem', border: 'none', boxShadow: '0 8px 12px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#22c55e" radius={[0, 8, 8, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold">ไม่มีข้อมูลลูกค้า</div>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col h-[260px]">
          <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="text-brand-500" size={18} />
            สินค้าขายดี
          </h3>
          <div className="flex-1 w-full min-h-0">
            {data.topProducts && data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '0.8rem', border: 'none', boxShadow: '0 8px 12px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold">ไม่มีข้อมูลสินค้า</div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Invoices / Urgency List */}
      <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col mt-3">
        <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-danger-500" size={18} />
            บิลที่ต้องรีบตาม
          </div>
          {data.pendingInvoices.length > 0 && <span className="text-[9px] font-black bg-danger-50 text-danger-600 px-2 py-0.5 rounded-md">ด่วน {data.pendingInvoices.length}</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {data.pendingInvoices.length > 0 ? (
            data.pendingInvoices.slice(0, 4).map(inv => {
              const days = daysUntilDue(inv.due_date)
              const isOD = days < 0
              return (
                <button key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full text-left p-3 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-brand-100 transition-all flex justify-between items-center group">
                  <div className="min-w-0">
                    <p className="font-black text-xs text-gray-800 truncate">{inv.customers?.name || '-'}</p>
                    <p className="text-[9px] font-bold text-gray-400">{inv.invoice_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-xs text-gray-900">{formatCurrency(inv.total)}</p>
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${isOD ? 'text-danger-600' : 'text-warning-600'}`}>
                      {isOD ? `เกิน ${Math.abs(days)} ว.` : `${days} ว.`}
                    </span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="col-span-full py-4 flex flex-col items-center justify-center text-gray-400 gap-1">
              <p className="text-[10px] font-bold">ไม่มีบิลค้างชำระ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
