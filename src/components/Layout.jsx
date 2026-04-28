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
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-brand-700 to-brand-900 text-white shadow-lg">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 max-w-7xl mx-auto">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap">
              <span className="inline sm:hidden">📋 วางบิล</span>
              <span className="hidden sm:inline">📋 ระบบวางบิล</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-sm opacity-90 bg-white/15 px-2.5 sm:px-3 py-1 rounded-full hidden xs:block">{userName}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 pt-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {!(location.pathname.includes('/invoices/new') || (location.pathname.includes('/invoices/') && location.pathname.includes('/edit'))) && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
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
