import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { setCookie, getCookie } from '../lib/utils'
import { getUserByName, createUser, updateUserRole, logActivity } from '../lib/db'
import { useEffect } from 'react'

export default function Login() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Auto-skip if already logged in
  useEffect(() => {
    if (getCookie('userName') && getCookie('userId')) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  async function handleLogin(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('กรุณากรอกชื่อ')
      return
    }
    setLoading(true)
    try {
      // Find or create user
      let user = await getUserByName(trimmed)
      if (!user) {
        user = await createUser(trimmed, 'staff')
      }
      if (!user) {
        toast.error('ไม่สามารถเข้าสู่ระบบได้')
        return
      }
      // Save to cookies
      setCookie('userName', user.name)
      setCookie('userId', user.id)
      setCookie('userRole', user.role)
      // Log activity
      await logActivity(user.id, 'login', `${user.name} เข้าสู่ระบบ (Role: ${user.role})`)
      toast.success(`สวัสดี ${user.name}! 👋`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-4">
      <div className="w-full max-w-sm animate-scaleIn">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-4 shadow-lg">
            <span className="text-4xl">📋</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ระบบวางบิล</h1>
          <p className="text-brand-200 mt-2 text-base">สินค้าอุปโภคบริโภค</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl"
        >
          <div className="mb-4">
            <label className="block text-base font-semibold text-gray-700 mb-2">
              ชื่อผู้ใช้งาน
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              autoFocus
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl
                         focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200
                         transition-all placeholder:text-gray-400"
            />
          </div>



          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-gradient-to-r from-brand-600 to-brand-700
                       hover:from-brand-700 hover:to-brand-800 text-white text-lg font-bold
                       rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                       active:scale-95 transition-all disabled:opacity-50 disabled:transform-none
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={22} />
                เข้าใช้งาน
              </>
            )}
          </button>
        </form>

        <p className="text-center text-brand-200 text-sm mt-6">
          v1.0 — จัดการบิล ลูกค้า สินค้า สต๊อก
        </p>
      </div>
    </div>
  )
}
