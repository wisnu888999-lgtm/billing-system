import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageSquare, Compass, Send, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortalAbout() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'wholesale',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.message) {
      toast.error('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน')
      return
    }
    setSubmitting(true)
    
    // Simulate API request
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      toast.success('ส่งข้อความติดต่อกลับของคุณเรียบร้อยแล้ว! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด')
    }, 1200)
  }

  const contactInfos = [
    { icon: Phone, title: 'เบอร์โทรศัพท์ติดต่อ', detail: '02-123-4567, 081-987-6543', sub: 'ฝ่ายบริการลูกค้าและตัวแทนจำหน่าย' },
    { icon: Mail, title: 'อีเมลสอบถามข้อมูล', detail: 'sales@phurada.com, contact@phurada.com', sub: 'ส่งใบเสนอราคาหรือสอบถามข้อมูลคู่ค้า' },
    { icon: Clock, title: 'เวลาทำการออฟฟิศ', detail: 'จันทร์ - เสาร์ (08:30 น. - 17:30 น.)', sub: 'ปิดทำการในวันอาทิตย์และวันหยุดนักขัตฤกษ์' },
    { icon: MapPin, title: 'ที่ตั้งสำนักงานใหญ่', detail: '123/45 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250', sub: 'ใกล้สถานี Airport Rail Link หัวหมาก' }
  ]

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">เกี่ยวกับเรา & ติดต่อบริษัท</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">ทำความรู้จักกับ พูรดา คอร์ปอเรชัน และส่งข้อความหาฝ่ายขายของเรา</p>
      </div>

      {/* About Company Bio */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-black text-slate-800 leading-tight">
            พูรดา คอร์ปอเรชัน <br />
            <span className="text-blue-600 font-extrabold text-lg">Phurada Corporation Co., Ltd.</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            เราก่อตั้งขึ้นจากความมุ่งมั่นที่จะนำส่งสินค้าอุปโภคบริโภค โดยเฉพาะกลุ่มอาหารสัตว์เลี้ยงและอุปกรณ์ดูแลสัตว์เลี้ยงเกรดพรีเมี่ยมเข้าสู่ตลาดประเทศไทย ตลอดระยะเวลาที่ผ่านมาเรายึดมั่นในนโยบายการกระจายสินค้าที่มีคุณภาพ รวดเร็ว และให้บริการคู่ค้าด้วยความซื่อสัตย์เป็นธรรม
          </p>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            ด้วยความไว้วางใจจากร้านค้าปลีก (Pet Shop) และตัวแทนจำหน่ายทั่วประเทศไทยกว่า 500 แห่ง ทำให้เราพร้อมที่จะพัฒนาขยายห่วงโซ่อุปทานการบริการให้สะดวก รวดเร็ว และมีความเป็นมืออาชีพยิ่งขึ้นในอนาคต
          </p>
        </div>
        <div className="w-full md:w-1/3 aspect-video md:aspect-[4/3] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white relative overflow-hidden shadow-lg shadow-blue-500/20 shrink-0">
          <div className="absolute inset-0 bg-black/10" />
          <Compass className="w-16 h-16 animate-spin" style={{ animationDuration: '30s' }} />
        </div>
      </section>

      {/* Grid: Contact Cards & Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">ช่องทางการสื่อสารหลัก</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contactInfos.map((info, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl h-fit shadow-inner">
                  <info.icon size={20} />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h4 className="font-bold text-slate-700 text-xs leading-none">{info.title}</h4>
                  <p className="text-slate-800 font-black text-sm break-words leading-snug">{info.detail}</p>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight">{info.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Map Mockup */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-500" /> แผนที่ตั้งบริษัทสำนักงานใหญ่
            </h4>
            <div className="w-full aspect-video bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-slate-300">
              {/* Fake Map Elements */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              {/* Stylized map routes */}
              <svg className="absolute inset-0 w-full h-full text-slate-200 stroke-current opacity-30" fill="none">
                <path d="M 0 50 L 400 50 L 600 200" strokeWidth="12" />
                <path d="M 100 0 L 100 300" strokeWidth="8" />
                <path d="M 250 0 L 250 300" strokeWidth="8" />
              </svg>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 animate-bounce">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/35 border-2 border-white">
                  📍
                </div>
              </div>
              <span className="text-xs font-black text-slate-500 z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm border border-slate-100">
                123/45 Phatthanakan Road, Bangkok
              </span>
            </div>
          </div>
        </div>

        {/* Contact Inquiry Form */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">ส่งข้อความถึงเรา</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">ฝากข้อความไว้เพื่อให้ฝ่ายสนับสนุนติดต่อกลับคุณทางอีเมลหรือโทรศัพท์</p>
            </div>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-4 animate-scaleIn">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-800">ขอบคุณสำหรับข้อความของคุณ!</p>
                <p className="text-sm font-bold text-slate-400">เจ้าหน้าที่ของเรากำลังประมวลผลคำขอและจะตอบกลับภายใน 24 ชม.</p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
              >
                ส่งข้อความใหม่
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ชื่อผู้ติดต่อ *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">อีเมลแอดเดรส (ไม่บังคับ)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">หัวข้อการติดต่อ</label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-bold cursor-pointer"
                >
                  <option value="wholesale">สอบถามระบบราคาส่งคู่ค้า (Wholesale)</option>
                  <option value="partner">สมัครเป็นตัวแทนจำหน่าย (Partner)</option>
                  <option value="order">ติดตามคำสั่งซื้อ / วางบิล</option>
                  <option value="general">สอบถามข้อมูลทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ข้อความรายละเอียด *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="พิมพ์รายละเอียดของสารติดต่อที่คุณต้องการสอบถามข้อมูล..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    ส่งข้อความติดต่อกลับ
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  )
}
