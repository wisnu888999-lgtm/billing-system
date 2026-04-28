import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getProduct, createProduct, updateProduct, uploadProductImage, logActivity, getDistinctProductValues } from '../../lib/db'
import SearchableSelect from '../../components/SearchableSelect'
import { getCookie } from '../../lib/utils'

// === Image compression: crop to square + resize to 400x400 + compress to JPEG ===
function compressImage(file, maxSize = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize

        // Crop to center square
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize)

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'))
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', animal_type: 'ปู', size: 'เล็ก', unit: 'ซอง', weight_g: 60, price: '', cost: '', stock_qty: 0, image_url: '', original_image_url: '' })
  const [imageFile, setImageFile] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [suggestions, setSuggestions] = useState({ categories: [], sizes: [], weights: [], units: [] })

  useEffect(() => { 
    loadSuggestions()
    if (isEdit) loadData() 
  }, [id])

  async function loadSuggestions() {
    const data = await getDistinctProductValues()
    setSuggestions(data)
  }

  async function loadData() {
    setLoading(true)
    const data = await getProduct(id)
    if (data) {
      setForm({ 
        name: data.name||'', 
        animal_type: data.animal_type||'ปู', 
        size: data.size||'เล็ก', 
        unit: data.unit||'ซอง',
        weight_g: data.weight_g||60, 
        price: data.price||'', 
        cost: data.cost||'', 
        stock_qty: data.stock_qty||0, 
        image_url: data.image_url||'', 
        original_image_url: data.original_image_url||'' 
      })
      setPreview(data.image_url||'')
    }
    setLoading(false)
  }

  const upd = (k, v) => {
    // Prevent leading zeros for numeric fields (price, cost, stock, weight)
    if (['price', 'cost', 'stock_qty', 'weight_g'].includes(k)) {
      if (typeof v === 'string') {
        v = v.replace(/^0+(?=\d)/, '') // Remove leading zeros unless it's just '0'
      }
    }
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressing(true)
    setOriginalFile(file)
    try {
      // Compress: crop to square 400x400 + JPEG quality 80%
      const compressed = await compressImage(file, 400, 0.8)
      const originalKB = (file.size / 1024).toFixed(0)
      const compressedKB = (compressed.size / 1024).toFixed(0)

      setImageFile(compressed)
      setPreview(URL.createObjectURL(compressed))
      toast.success(`รูปถูกปรับเป็น 400×400 (${originalKB}KB → ${compressedKB}KB)`)
    } catch (err) {
      console.error(err)
      toast.error('ไม่สามารถประมวลผลรูปได้')
    }
    setCompressing(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('กรุณากรอกชื่อสินค้า')
    if (!form.price) return toast.error('กรุณากรอกราคา')
    setSaving(true)
    try {
      let imageUrl = form.image_url
      let originalUrl = form.original_image_url
      
      if (imageFile) {
        const url = await uploadProductImage(imageFile)
        if (url) imageUrl = url
      }
      if (originalFile) {
        const urlOrig = await uploadProductImage(originalFile)
        if (urlOrig) originalUrl = urlOrig
      }
      
      const payload = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost)||0, stock_qty: parseInt(form.stock_qty)||0, image_url: imageUrl, original_image_url: originalUrl }
      const uid = getCookie('userId')
      if (isEdit) {
        await updateProduct(id, payload)
        await logActivity(uid, 'แก้ไขสินค้า', form.name)
        toast.success('บันทึกเรียบร้อย')
        navigate('/products', { replace: true })
      } else {
        const r = await createProduct(payload)
        if (r) { await logActivity(uid, 'เพิ่มสินค้า', form.name); toast.success('เพิ่มสินค้าสำเร็จ'); navigate('/products', { replace: true }) }
      }
    } catch { toast.error('เกิดข้อผิดพลาด') }
    setSaving(false)
  }

  const inputCls = "w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/products')} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={22} /></button>
        <h2 className="text-xl font-bold">{isEdit ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h2>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Image Upload - Square Preview */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">รูปสินค้า <span className="text-gray-400 font-normal">(จัตุรัส 400×400, บีบอัดอัตโนมัติ)</span></label>
          <div className="flex items-start gap-4">
            {/* Square preview */}
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all ${compressing ? 'bg-gray-100 text-gray-400' : 'bg-brand-50 hover:bg-brand-100 text-brand-700'}`}>
                {compressing ? (
                  <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                <span className="text-sm font-medium">{compressing ? 'กำลังประมวลผล...' : preview ? 'เปลี่ยนรูป' : 'เลือกรูป'}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={compressing} />
              </label>
              <p className="text-[11px] text-gray-400 leading-tight">
                รูปจะถูก crop เป็นจัตุรัส<br/>และบีบอัดอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        <div><label className="block text-sm font-semibold text-gray-600 mb-1">ชื่อสินค้า *</label><input type="text" value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="เช่น ปูอัดซอง เล็ก 60g" className={inputCls}/></div>
        <div className="grid grid-cols-2 gap-3">
          <SearchableSelect 
            label="ประเภท"
            value={form.animal_type}
            onChange={v => upd('animal_type', v)}
            options={suggestions.categories}
            placeholder="เช่น ปู, กุ้ง"
          />
          <SearchableSelect 
            label="ขนาด"
            value={form.size}
            onChange={v => upd('size', v)}
            options={suggestions.sizes}
            placeholder="เช่น เล็ก, ใหญ่"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SearchableSelect 
            label="น้ำหนัก (กรัม)"
            value={form.weight_g}
            onChange={v => upd('weight_g', v)}
            options={suggestions.weights}
            placeholder="เช่น 60, 120"
          />
          <SearchableSelect 
            label="หน่วยนับ"
            value={form.unit}
            onChange={v => upd('unit', v)}
            options={suggestions.units}
            placeholder="เช่น ซอง, กระปุก"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-semibold text-gray-600 mb-1">ราคาขาย (บาท) *</label><input type="number" step="0.01" value={form.price} onChange={e=>upd('price',e.target.value)} className={inputCls}/></div>
          <div><label className="block text-sm font-semibold text-gray-600 mb-1">ต้นทุน (บาท)</label><input type="number" step="0.01" value={form.cost} onChange={e=>upd('cost',e.target.value)} className={inputCls}/></div>
        </div>
        {!isEdit && <div><label className="block text-sm font-semibold text-gray-600 mb-1">จำนวนสต๊อกเริ่มต้น</label><input type="number" value={form.stock_qty} onChange={e=>upd('stock_qty',e.target.value)} className={inputCls}/></div>}
        <button type="submit" disabled={saving} className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save size={20}/>บันทึก</>}
        </button>
      </form>
    </div>
  )
}
