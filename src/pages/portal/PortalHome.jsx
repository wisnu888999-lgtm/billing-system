import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ShoppingBag, ArrowRight, Star, Shield, Truck, Award } from 'lucide-react'
import { getProducts } from '../../lib/db'

export default function PortalHome() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadFeatured() {
      try {
        const allProducts = await getProducts()
        // Take up to 4 products that have images as featured
        const withImages = allProducts.filter(p => p.image_url)
        const selected = withImages.length > 0 ? withImages.slice(0, 4) : allProducts.slice(0, 4)
        setFeaturedProducts(selected)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadFeatured()
  }, [])

  const promotions = [
    {
      id: 1,
      title: 'โปรโมชั่นราคาส่งสุดคุ้ม',
      desc: 'สั่งซื้อสินค้าประเภทเดียวกันครบ 20 ชิ้นขึ้นไป รับเรตราคาส่ง Tier สูงสุดทันที ประหยัดต้นทุนสำหรับร้านค้าปลีก',
      badge: 'Wholesale Tier 20',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 2,
      title: 'สะสมยอดบิลเพื่อแลกของรางวัล',
      desc: 'ลูกค้าพันธมิตรที่มียอดสั่งซื้อสะสมเกิน 50,000 บาทต่อเดือน รับสิทธิ์อัปเกรดระดับบัญชีร้านค้าและของพรีเมี่ยมฟรี',
      badge: 'Loyalty Program',
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 3,
      title: 'จัดส่งด่วนพิเศษฟรีทั่วไทย',
      desc: 'สำหรับบิลสั่งซื้อราคาส่งมูลค่ารวม 15,000 บาทขึ้นไป จัดส่งโดยรถควบคุมอุณหภูมิของบริษัทโดยตรง การันตีความสดใหม่',
      badge: 'Free Delivery',
      color: 'from-emerald-600 to-teal-600',
    }
  ]

  const stats = [
    { label: 'ประสบการณ์ในธุรกิจ', value: '10+ ปี' },
    { label: 'ร้านค้าส่ง/ปลีกพันธมิตร', value: '500+ แห่ง' },
    { label: 'สินค้าหลากหลายรายการ', value: '50+ ชนิด' },
    { label: 'ส่งมอบสินค้ารวดเร็ว', value: '100% ตรงเวลา' }
  ]

  const coreValues = [
    { icon: Shield, title: 'รับประกันคุณภาพ', desc: 'คัดสรรสินค้าอุปโภคบริโภคที่มีมาตรฐานความปลอดภัยระดับสากล' },
    { icon: Truck, title: 'บริการขนส่งที่รวดเร็ว', desc: 'ระบบขนส่งภายในประเทศที่ครอบคลุม จัดส่งถึงหน้าร้านอย่างปลอดภัย' },
    { icon: Award, title: 'ราคาที่เป็นธรรม', desc: 'ระบบแบ่งราคาตามระดับจำนวน (Tier) เพื่อเพิ่มผลกำไรให้ผู้ค้าปลีก' }
  ]

  return (
    <div className="space-y-12 animate-fadeIn">
      
      {/* 1. Hero Section */}
      <section className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black tracking-wider uppercase">
            <Sparkles size={14} /> พูรดา คอร์ปอเรชัน ยินดีต้อนรับ
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            สินค้าอุปโภคบริโภค <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              เกรดพรีเมี่ยมสำหรับธุรกิจคุณ
            </span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            เราเป็นผู้นำเข้าและจัดจำหน่ายอาหารสัตว์และผลิตภัณฑ์อุปโภคบริโภคคุณภาพสูง มุ่งเน้นการสนับสนุนผู้ประกอบการและร้านค้าปลีกด้วยระบบราคาที่คุ้มค่า
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => navigate('/catalog')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/35 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-95 transition-all text-base"
            >
              <ShoppingBag size={20} />
              เลือกดูสินค้าของเรา
            </button>
            <button
              onClick={() => navigate('/portal-pricing')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-black rounded-2xl border border-slate-700 hover:scale-[1.02] active:scale-95 transition-all text-base"
            >
              เช็คตารางราคาส่ง
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl md:text-4xl font-black text-blue-600 tracking-tight">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 mt-2">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* 3. Promotions Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">ข้อเสนอพิเศษ & โปรโมชั่น</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">อัปเดตสิทธิประโยชน์ของร้านค้าคู่ค้าพูรดา</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promotions.map(promo => (
            <div 
              key={promo.id} 
              className={`bg-gradient-to-br ${promo.color} text-white rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
            >
              {/* Overlay graphics */}
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              
              <div className="space-y-4">
                <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                  {promo.badge}
                </span>
                <h3 className="text-xl font-black leading-snug">{promo.title}</h3>
                <p className="text-white/80 text-sm font-medium leading-relaxed">{promo.desc}</p>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => navigate('/catalog')}
                  className="bg-white text-slate-900 p-3 rounded-full hover:bg-slate-50 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Highlighted Products */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">สินค้าแนะนำ</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">สินค้าคุณภาพยอดนิยมที่ร้านค้าแนะนำ</p>
          </div>
          <button 
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors"
          >
            ดูทั้งหมด
            <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-3xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-100 rounded-3xl">
            <p className="text-slate-400 font-bold">ไม่พบข้อมูลสินค้าแนะนำ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map(p => (
              <div 
                key={p.id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden relative mb-4">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">📦</div>
                    )}
                    <span className="absolute top-2 left-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                      {p.animal_type || 'ทั่วไป'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 h-10 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">ขนาด: {p.size || '-'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Retail Price</span>
                  <span className="text-sm font-black text-slate-800">฿{Number(p.retail_price || p.price).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Core Values */}
      <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
        {coreValues.map((val, idx) => (
          <div key={idx} className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <val.icon size={22} />
            </div>
            <h3 className="text-lg font-black text-slate-800">{val.title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">{val.desc}</p>
          </div>
        ))}
      </section>

    </div>
  )
}
