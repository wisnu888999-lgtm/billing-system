import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { setCookie, getCookie } from '../lib/utils'
import { getUserByName, createUser, logActivity } from '../lib/db'

export default function Login() {
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [houseNo, setHouseNo] = useState('')
  const [subdistrict, setSubdistrict] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')
  const [zipcode, setZipcode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const role = getCookie('userRole')
    if (getCookie('userName') && getCookie('userId')) {
      if (role === 'admin' || role === 'ceo') {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }
  }, [navigate])

  function redirectByRole(role) {
    if (role === 'admin' || role === 'ceo') {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/home', { replace: true })
    }
  }

  const resetForm = () => {
    setName('')
    setGender('')
    setBirthDate('')
    setHouseNo('')
    setSubdistrict('')
    setDistrict('')
    setProvince('')
    setZipcode('')
    setShowPasscode(false)
    setPasscode('')
  }

  const handleNameChange = (val) => {
    setName(val)
    if (showPasscode) {
      setShowPasscode(false)
      setPasscode('')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { toast.error('กรุณากรอกชื่อ'); return }
    setLoading(true)
    try {
      const user = await getUserByName(trimmed)
      if (!user) {
        toast.error('ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาสมัครสมาชิกก่อน')
        setLoading(false)
        return
      }

      // If user is admin or ceo, check passcode
      if (user.role === 'admin' || user.role === 'ceo') {
        if (!showPasscode) {
          setShowPasscode(true)
          toast.success('กรุณากรอกรหัสผ่านผู้ดูแลระบบ')
          setLoading(false)
          return
        }
        if (passcode !== '8899') {
          toast.error('รหัสผ่านไม่ถูกต้อง')
          setLoading(false)
          return
        }
      }

      setCookie('userName', user.name)
      setCookie('userId', user.id)
      setCookie('userRole', user.role)
      await logActivity(user.id, 'login', `${user.name} เข้าสู่ระบบ`)
      toast.success(`ยินดีต้อนรับ ${user.name}! 👋`)
      redirectByRole(user.role)
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { toast.error('กรุณากรอกชื่อ'); return }
    if (!gender) { toast.error('กรุณาเลือกเพศ'); return }
    if (!birthDate) { toast.error('กรุณากรอกวันเดือนปีเกิด'); return }
    if (!houseNo) { toast.error('กรุณากรอกเลขที่บ้าน'); return }
    if (!subdistrict) { toast.error('กรุณากรอกตำบล'); return }
    if (!district) { toast.error('กรุณากรอกอำเภอ'); return }
    if (!province) { toast.error('กรุณากรอกจังหวัด'); return }
    if (!zipcode) { toast.error('กรุณากรอกรหัสไปรษณีย์'); return }
    setLoading(true)
    try {
      const existing = await getUserByName(trimmed)
      if (existing) {
        toast.error('มีบัญชีชื่อนี้อยู่แล้ว กรุณาเข้าสู่ระบบแทน')
        setLoading(false)
        return
      }
      const user = await createUser(trimmed, 'staff', {
        gender,
        birth_date: birthDate,
        address_house_no: houseNo,
        address_subdistrict: subdistrict,
        address_district: district,
        address_province: province,
        address_zipcode: zipcode,
      })
      if (!user) { toast.error('ไม่สามารถสร้างบัญชีได้'); return }
      setCookie('userName', user.name)
      setCookie('userId', user.id)
      setCookie('userRole', user.role)
      await logActivity(user.id, 'register', `${user.name} สมัครสมาชิกใหม่`)
      toast.success(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับ ${user.name}! 🎉`)
      redirectByRole(user.role)
    } catch (err) {
      console.error(err)
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">

      {/* ===== LEFT PANEL ===== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] relative flex-col overflow-hidden bg-slate-900">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-transparent to-transparent z-10 pointer-events-none" />

        {/* Hero image */}
        <img
          src="/hero-boss.png"
          alt="Phurada"
          className="absolute inset-0 w-full h-full object-cover select-none"
          style={{ objectPosition: 'center top' }}
        />

        {/* Logo top-left */}
        <div className="relative z-20 p-10 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Phurada Logo"
            className="h-11 drop-shadow-lg rounded-full"
          />
          <div>
            <span className="text-white font-black text-xl tracking-tight drop-shadow">Phurada</span>
            <span className="block text-white/50 text-[10px] font-black uppercase tracking-widest leading-none">
              Corporate System
            </span>
          </div>
        </div>

        {/* Bottom branding text */}
        <div className="relative z-20 mt-auto p-10 space-y-2">
          <h2 className="text-white text-4xl xl:text-5xl font-black leading-tight tracking-tight drop-shadow-xl">
            บริษัท พูรดา คอร์ปอเรชัน จำกัด
          </h2>
          <p className="text-amber-300 text-lg xl:text-xl font-bold">
            จำหน่ายอาหารทะเล
          </p>
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-20 bg-white">

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-6 flex items-center gap-2">
          <img src="/logo.png" alt="Phurada Logo" className="h-8 rounded-full" />
          <span className="font-black text-slate-800 tracking-tight text-lg">Phurada</span>
        </div>

        <div className="w-full max-w-sm animate-scaleIn">

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                ชื่อผู้ใช้งาน
              </label>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder={tab === 'login' ? 'กรอกชื่อที่ลงทะเบียนไว้' : 'กรอกชื่อ-นามสกุลหรือชื่อเล่น'}
                autoFocus
                className="w-full px-4 py-4 text-base border-2 border-slate-100 bg-slate-50 rounded-2xl
                           focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                           transition-all placeholder:text-slate-300 font-semibold text-slate-800"
              />
            </div>

            {tab === 'login' && showPasscode && (
              <div className="space-y-1.5 animate-slideDown">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider text-blue-600">
                  รหัสผ่านผู้ดูแลระบบ
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่าน 4 หลัก"
                  autoFocus
                  className="w-full px-4 py-4 text-base border-2 border-slate-100 bg-slate-50 rounded-2xl
                             focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                             transition-all placeholder:text-slate-300 font-semibold text-slate-800"
                />
              </div>
            )}

            {tab === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    เพศ
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-4 py-4 text-base border-2 border-slate-100 bg-slate-50 rounded-2xl
                               focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                               transition-all font-semibold text-slate-800"
                  >
                    <option value="">เลือกเพศ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่น ๆ">อื่น ๆ / ไม่ระบุ</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    วันเดือนปีเกิด
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full px-4 py-4 text-base border-2 border-slate-100 bg-slate-50 rounded-2xl
                               focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                               transition-all font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="block text-xs font-black text-slate-500 uppercase tracking-wider">ที่อยู่โดยละเอียด</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">เลขที่บ้าน / อาคาร</label>
                      <input
                        type="text"
                        value={houseNo}
                        onChange={e => setHouseNo(e.target.value)}
                        placeholder="เช่น 123/45"
                        className="w-full px-3 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ตำบล / แขวง</label>
                      <input
                        type="text"
                        value={subdistrict}
                        onChange={e => setSubdistrict(e.target.value)}
                        placeholder="ตำบล"
                        className="w-full px-3 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">อำเภอ / เขต</label>
                      <input
                        type="text"
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                        placeholder="อำเภอ"
                        className="w-full px-3 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">จังหวัด</label>
                      <input
                        type="text"
                        value={province}
                        onChange={e => setProvince(e.target.value)}
                        placeholder="จังหวัด"
                        className="w-full px-3 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      value={zipcode}
                      onChange={e => setZipcode(e.target.value)}
                      placeholder="รหัสไปรษณีย์"
                      className="w-full px-3 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-black
                         rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40
                         hover:scale-[1.01] active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:transform-none
                         flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : tab === 'login' ? (
                <>
                  <LogIn size={18} />
                  เข้าสู่ระบบ
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  สมัครสมาชิก
                </>
              )}
            </button>
          </form>

          {/* Switch hint */}
          <p className="text-center text-slate-400 text-xs font-medium mt-6">
            {tab === 'login' ? (
              <>ยังไม่มีบัญชี?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); resetForm() }}
                  className="text-blue-600 font-black hover:underline"
                >
                  สมัครสมาชิก
                </button>
              </>
            ) : (
              <>มีบัญชีแล้ว?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); resetForm() }}
                  className="text-blue-600 font-black hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
