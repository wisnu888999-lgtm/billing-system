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
    { label: 'ยอดรวมทั้งหมด', value: formatCurrency(data.totalAmount), icon: TrendingUp, color: 'from-brand-500 to-brand-700' },
    { label: 'กำไรสุทธิ', value: formatCurrency(data.totalProfit), icon: TrendingUp, color: 'from-success-600 to-success-800' },
    { label: 'อัตรากำไร', value: data.totalAmount > 0 ? ((data.totalProfit / data.totalAmount) * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: 'from-indigo-500 to-indigo-700' },
    { label: 'รอชำระ', value: formatCurrency(data.totalPending), icon: Clock, color: 'from-warning-500 to-warning-600' },
    { label: 'เกินกำหนด', value: formatCurrency(data.totalOverdue), icon: AlertTriangle, color: 'from-danger-500 to-danger-700' },
    { label: 'จำนวนบิล', value: data.invoiceCount, icon: FileText, color: 'from-gray-500 to-gray-700' },
  ]

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">📊 ภาพรวมระบบ</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all border shadow-sm ${showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          <Filter size={18} />
          <span>กรองข้อมูล</span>
          {activeFiltersCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-brand-500 text-white text-[10px] rounded-full">{activeFiltersCount}</span>}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl animate-slideDown space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} /> ลูกค้า</label>
              <select 
                value={filters.customerId}
                onChange={e => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">ทั้งหมด</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> ตั้งแต่วันที่</label>
              <input 
                type="date"
                value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> จนถึงวันที่</label>
              <input 
                type="date"
                value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetFilters} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">ล้างค่า</button>
            <button onClick={applyFilters} className="px-8 py-2.5 bg-brand-600 text-white text-sm font-black rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95">นำไปใช้</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 text-white shadow-lg relative overflow-hidden group`}>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <card.icon size={60} className="sm:w-20 sm:h-20" />
            </div>
            <div className="flex items-center gap-1.5 mb-1 sm:mb-2 opacity-80 relative z-10">
              <card.icon size={12} className="sm:w-4 sm:h-4" />
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest truncate">{card.label}</span>
            </div>
            <p className="text-base sm:text-2xl font-black relative z-10 truncate tabular-nums" title={card.value}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Sales Trend Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-brand-500" size={20} />
              แนวโน้มยอดขาย
            </h3>
            {data.salesTrend.length > 0 && (
              <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-tighter">Daily Trend</span>
            )}
          </div>
          <div className="flex-1 w-full">
            {data.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.salesTrend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={d => d.split('-').slice(1).join('/')} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={v => (v/1000).toFixed(0) + 'k'} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                    itemStyle={{ fontWeight: 800, fontSize: '14px', color: '#1e293b' }}
                    labelStyle={{ fontWeight: 800, fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}
                    formatter={(val) => [formatCurrency(val), 'ยอดขาย']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">ไม่มีข้อมูลยอดขายในช่วงนี้</div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="text-warning-500" size={20} />
            สัดส่วนบิล
          </h3>
          <div className="flex-1 relative flex items-center justify-center">
            {data.statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(v) => [`${v} ใบ`, 'จำนวน']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">ทั้งหมด</span>
                  <span className="text-3xl font-black text-gray-800 leading-none">{data.invoiceCount}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm font-bold">ไม่มีข้อมูลบิล</div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            {data.statusDistribution.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-500">{s.name}</span>
                </div>
                <span className="text-gray-800">{s.value} ใบ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Customers Bar Chart */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
            <Users className="text-success-500" size={20} />
            ลูกค้าที่ยอดสั่งสูงสุด
          </h3>
          <div className="flex-1 w-full">
            {data.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCustomers} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [formatCurrency(val), 'ยอดสั่งรวม']}
                  />
                  <Bar dataKey="total" fill="#22c55e" radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">ไม่มีข้อมูลลูกค้า</div>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="text-brand-500" size={20} />
            สินค้าที่ขายดีที่สุด
          </h3>
          <div className="flex-1 w-full">
            {data.topProducts && data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [`${val} ชิ้น`, 'จำนวนที่ขาย']}
                  />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">ไม่มีข้อมูลสินค้า</div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Invoices / Urgency List */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col min-h-[300px]">
        <h3 className="font-black text-gray-800 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-danger-500" size={20} />
            บิลที่ต้องรีบตาม
          </div>
          {data.pendingInvoices.length > 0 && <span className="text-[10px] font-black bg-danger-50 text-danger-600 px-2 py-1 rounded-lg">ด่วน {data.pendingInvoices.length} รายการ</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.pendingInvoices.length > 0 ? (
            data.pendingInvoices.map(inv => {
              const days = daysUntilDue(inv.due_date)
              const isOD = days < 0
              return (
                <button key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full text-left p-4 rounded-3xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-brand-100 hover:shadow-md transition-all flex justify-between items-center group">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-gray-800 truncate">{inv.customers?.name || '-'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400">{inv.invoice_number}</span>
                      <span className="text-[10px] font-bold text-brand-500">ครบ {formatDate(inv.due_date)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-gray-900">{formatCurrency(inv.total)}</p>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isOD ? 'text-danger-600' : days <= 7 ? 'text-warning-600' : 'text-gray-500'}`}>
                      {isOD ? `เกิน ${Math.abs(days)} วัน` : `อีก ${days} วัน`}
                    </span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="col-span-full h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
              <FileText size={40} className="opacity-20" />
              <p className="text-sm font-bold">ไม่มีบิลค้างชำระ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
