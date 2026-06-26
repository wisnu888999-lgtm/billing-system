import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Package, FilePlus, FileText, LogOut, Plus, PanelLeft, Tag } from 'lucide-react'
import { getCookie, deleteCookie } from '../lib/utils'
import DueBillsAlert from './DueBillsAlert'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'หน้าหลัก' },
  { to: '/customers', icon: Users, label: 'ลูกค้า' },
  { to: '/invoices/new', icon: Plus, label: 'สร้างบิล', isCenter: true },
  { to: '/products', icon: Package, label: 'สินค้า' },
  { to: '/pricing', icon: Tag, label: 'แคตตาล็อกราคา' },
  { to: '/invoices', icon: FileText, label: 'บิล' },
]

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userName = getCookie('userName') || 'ผู้ใช้'

  function handleLogout() {
    deleteCookie('userName')
    deleteCookie('userId')
    sessionStorage.removeItem('due_bills_alert_dismissed')
    navigate('/login')
  }

  const handleNavClick = (e, to) => {
    // If we are on invoice wizard and it's dirty, intercept
    if (window.isInvoiceDirty && location.pathname.includes('/invoices') && !to.includes('/invoices/new')) {
      e.preventDefault()
      // Dispatch event to InvoiceWizard to show its modal
      window.dispatchEvent(new CustomEvent('invoice-exit-request', { detail: { to } }))
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-0 md:p-4 flex md:gap-4">
      {/* 1. Sidebar Card (Desktop) */}
      {!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) && (
        <aside className={`hidden md:flex flex-col shrink-0 bg-white rounded-3xl shadow-sm border border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-20' : 'w-72'}`}>
          <div className={`p-6 pb-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Phurada Logo" className="h-8 rounded-full" />
                <span className="text-xl font-medium tracking-tight text-gray-900">Phurada</span>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors bg-transparent text-gray-500 hover:text-gray-800">
              <PanelLeft size={20} />
            </button>
          </div>

          <div className={`mb-6 transition-all duration-300 ${isCollapsed ? 'px-4' : 'px-6'}`}>
            <button 
              onClick={() => navigate('/invoices/new')}
              className={`flex items-center justify-center gap-3 py-3.5 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all font-black text-sm ${isCollapsed ? 'w-12 h-12 p-0 mx-auto rounded-[1rem]' : 'w-full'}`}
            >
              <Plus size={20} />
              {!isCollapsed && <span>สร้างบิลใหม่</span>}
            </button>
          </div>

          <nav className={`flex-1 space-y-1.5 overflow-y-auto custom-scrollbar ${isCollapsed ? 'px-4' : 'px-6'}`}>
            {!isCollapsed && <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 mt-2 ml-4">เมนูหลัก</div>}
            {navItems.filter(i => !i.isCenter).map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item.to)}
                end={item.to === '/invoices'}
                className={({ isActive }) =>
                  `flex items-center py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-black'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-bold'
                  } ${isCollapsed ? 'justify-center px-0 w-12 mx-auto' : 'px-4 gap-3'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`${isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform text-gray-400'}`} />
                    {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className={`mt-auto transition-all duration-300 ${isCollapsed ? 'p-4' : 'p-6'}`}>
            <button
              onClick={() => navigate('/home')}
              className={`w-full flex items-center text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition-all font-bold text-xs mb-3 ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2.5'}`}
            >
              <span className="text-sm">🌐</span>
              {!isCollapsed && <span>ดูหน้าเว็บทั่วไป</span>}
            </button>
            <div className={`flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl mb-2 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 font-black text-sm shrink-0 border border-gray-100">
                {userName.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-800 truncate">{userName}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Active Now</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center text-gray-400 hover:text-danger-500 transition-all font-bold text-xs ${isCollapsed ? 'justify-center w-full p-2' : 'gap-3 px-4 py-2'}`}
            >
              <LogOut size={16} />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* 2. Main Content Card */}
      <div className="flex-1 flex flex-col min-w-0 h-screen md:h-[calc(100vh-2rem)]">
        {/* Mobile Top Header (inside content area on mobile) */}
        <header className="md:hidden flex items-center justify-between px-2 py-2 mb-2">
          <img src="/logo.png" alt="Phurada" className="h-7 ml-2 rounded-full" />
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('/home')} className="p-2 text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-black bg-blue-50 rounded-xl transition-all">
               <span>🌐</span> หน้าเว็บ
             </button>
             <button onClick={handleLogout} className="p-2 text-gray-400"><LogOut size={20} /></button>
          </div>
        </header>

        <main className={`flex-1 bg-white rounded-none md:rounded-[2rem] shadow-sm overflow-hidden flex flex-col`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-8">
            <div className={`w-full ${
              (location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit')))
                ? 'max-w-5xl mx-auto'
                : ''
            }`}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Due Bills Alert Popup */}
      <DueBillsAlert />

      {!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] rounded-t-[1.5rem]">
          <div className="flex justify-around items-center max-w-5xl mx-auto h-16 px-4">
          {navItems.map(item => {
            if (item.isCenter) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(e) => handleNavClick(e, item.to)}
                  className="flex flex-col items-center relative -top-5"
                >
                  <div className="bg-gradient-to-br from-brand-600 to-brand-500 text-white p-4 rounded-full shadow-lg hover:shadow-brand-500/30 active:scale-95 transition-all">
                    <item.icon size={28} strokeWidth={2.5} />
                  </div>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item.to)}
                end={item.to === '/invoices'}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 min-w-[64px] transition-all duration-200 ${
                    isActive
                      ? 'text-brand-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-brand-50 scale-110' : ''}`}>
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
        </nav>
      )}
    </div>
  )
}
