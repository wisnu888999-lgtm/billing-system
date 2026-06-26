import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Package, Tag, Info, LogOut, Menu, X, User, ArrowLeft } from 'lucide-react'
import { getCookie, deleteCookie } from '../lib/utils'

export default function PortalLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const userName = getCookie('userName') || 'ผู้ใช้ทั่วไป'
  const userRole = getCookie('userRole') || 'staff'
  const isAdmin = userRole === 'admin' || userRole === 'ceo'

  function handleLogout() {
    deleteCookie('userName')
    deleteCookie('userId')
    deleteCookie('userRole')
    navigate('/login')
  }

  const navItems = [
    { to: '/home', icon: Home, label: 'หน้าหลัก & โปรโมชั่น' },
    { to: '/catalog', icon: Package, label: 'แคตตาล็อกสินค้า' },
    { to: '/portal-pricing', icon: Tag, label: 'ค้นหาราคา' },
    { to: '/about', icon: Info, label: 'เกี่ยวกับเรา' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Admin Switcher Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-3 shadow-md animate-fadeIn shrink-0">
          <span>👑 คุณกำลังเข้าชมเว็บไซต์บริษัทในฐานะ Admin / CEO</span>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-[11px] font-black transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={12} />
            กลับเข้าระบบหลังบ้าน
          </button>
        </div>
      )}

      {/* 2. Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <img src="/logo.png" alt="Phurada Logo" className="h-8 rounded-full" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-800">Phurada</span>
              <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Corporate</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop User Info & Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div 
              onClick={() => isAdmin && navigate('/dashboard')}
              className={`flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-1.5 ${
                isAdmin 
                  ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all' 
                  : ''
              }`}
              title={isAdmin ? "คลิกเพื่อสลับไประบบหลังบ้าน (Dashboard)" : undefined}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 font-sans">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left font-sans">
                <p className="text-xs font-black text-slate-700 leading-none">{userName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[9px] font-bold text-slate-400 capitalize">{userRole}</p>
                  {isAdmin && (
                    <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded font-black">
                      สลับไปหลังบ้าน ➜
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-xl transition-all"
              title="ออกจากระบบ"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden animate-fadeIn" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white border-b border-slate-100 p-6 space-y-4 shadow-2xl animate-slideDown" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-1 gap-2">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Profile & Logout Mobile */}
            <div className="flex flex-col gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-700 text-sm leading-tight">{userName}</p>
                    <p className="text-xs font-bold text-slate-400 capitalize mt-0.5">{userRole}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 rounded-xl transition-all text-xs font-black"
                >
                  <LogOut size={14} /> ออกจากระบบ
                </button>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/dashboard')
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <span>👑</span> สลับไประบบหลังบ้าน (Dashboard)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-slate-400">© 2026 Phurada Corporate. All rights reserved.</p>
          <p className="text-[10px] font-bold text-slate-300 mt-1">ระบบสำหรับผู้ใช้ทั่วไปและลูกค้าพูรดา</p>
        </div>
      </footer>
    </div>
  )
}
