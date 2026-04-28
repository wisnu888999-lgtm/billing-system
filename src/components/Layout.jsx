import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Package, FilePlus, FileText, LogOut, Plus } from 'lucide-react'
import { getCookie, deleteCookie } from '../lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'หน้าหลัก' },
  { to: '/customers', icon: Users, label: 'ลูกค้า' },
  { to: '/invoices/new', icon: Plus, label: 'สร้างบิล', isCenter: true },
  { to: '/products', icon: Package, label: 'สินค้า' },
  { to: '/invoices', icon: FileText, label: 'บิล' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const userName = getCookie('userName') || 'ผู้ใช้'

  function handleLogout() {
    deleteCookie('userName')
    deleteCookie('userId')
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
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Top Header (Mobile Only or Header Content) */}
      <header className={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-brand-700 to-brand-900 text-white shadow-lg transition-all duration-300 ${!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) ? 'md:left-64' : ''}`}>
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 w-full">
          <div className="md:hidden">
            <h1 className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap">
              📋 ระบบวางบิล
            </h1>
          </div>
          <div className="hidden md:block">
            {/* Breadcrumb or Page Title can go here in the future */}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-sm opacity-90 bg-white/15 px-2.5 sm:px-3 py-1 rounded-full hidden xs:block md:hidden">{userName}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors md:hidden"
              title="ออกจากระบบ"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar for Desktop */}
      {!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) && (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] sidebar-glass">
          <div className="p-6">
            <h1 className="text-2xl font-black text-brand-700 tracking-tight flex items-center gap-2">
              <span className="text-3xl">📋</span> วางบิล
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 ml-11">Management System</p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item.to)}
                end={item.to === '/invoices'}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group nav-active-glow ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className={`${isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className={`text-sm font-bold ${isActive ? 'tracking-wide' : ''}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-gray-50 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                {userName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{userName}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Active User</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-danger-500 hover:bg-danger-50 rounded-2xl transition-all font-bold text-sm"
            >
              <LogOut size={18} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`min-h-[calc(100vh-80px)] px-4 sm:px-8 py-6 pt-24 transition-all duration-300 ${!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) ? 'md:pl-64' : ''}`}>
        <div className={`w-full ${
          (location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit')))
            ? 'max-w-5xl mx-auto'
            : ''
        }`}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex justify-around items-end max-w-5xl mx-auto h-16 pb-2 px-2">
          {navItems.map(item => {
            if (item.isCenter) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(e) => handleNavClick(e, item.to)}
                  className="flex flex-col items-center relative -top-5"
                >
                  <div className="bg-brand-600 text-white p-3.5 rounded-full shadow-lg hover:bg-brand-700 hover:shadow-brand-500/30 active:scale-95 transition-all">
                    <item.icon size={28} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] mt-1 font-bold text-brand-700">
                    {item.label}
                  </span>
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
                    <span className={`text-[11px] mt-0.5 font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
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
