import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Plus, Trash2, Edit3, Image as ImageIcon, Camera, Upload, X } from 'lucide-react'
import Cropper from 'react-easy-crop'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getCustomer, createCustomer, updateCustomer, createBranch, updateBranch, deleteBranch, logActivity, uploadProductImage } from '../../lib/db'
import { getCookie } from '../../lib/utils'

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image()
  image.src = imageSrc
  await new Promise((resolve) => (image.onload = resolve))

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg')
  })
}

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
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() })
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

export default function CustomerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({ 
    name: '', phone: '', phone_backup: '', email: '', tax_id: '',
    branch_type: 'สำนักงานใหญ่', branch_code: '',
    address_line: '', subdistrict: '', district: '', province: '', zipcode: '',
    image_url: ''
  })
  
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [compressing, setCompressing] = useState(false)

  // Cropping State
  const [cropModal, setCropModal] = useState(false)
  const [tempImage, setTempImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [branches, setBranches] = useState([])
  const [branchModal, setBranchModal] = useState(false)
  const [editBranchData, setEditBranchData] = useState(null)
  const [branchForm, setBranchForm] = useState({ 
    branch_name: '', phone: '', phone_backup: '', email: '', 
    address_line: '', subdistrict: '', district: '', province: '', zipcode: '',
    address: '' 
  })

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [selectorModal, setSelectorModal] = useState(false)

  useEffect(() => { if (isEdit) loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const data = await getCustomer(id)
    if (data) {
      setForm({ 
        name: data.name||'', phone: data.phone||'', phone_backup: data.phone_backup||'', email: data.email||'', tax_id: data.tax_id||'', 
        branch_type: data.branch_type || 'สำนักงานใหญ่',
        branch_code: data.branch_code || '',
        address_line: data.address_line || data.address || '',
        subdistrict: data.subdistrict||'', district: data.district||'', province: data.province||'', zipcode: data.zipcode||'',
        image_url: data.image_url||''
      })
      setPreview(data.image_url||'')
      setBranches(data.customer_branches || [])
    }
    setLoading(false)
  }

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setTempImage(reader.result)
      setCropModal(true)
      setSelectorModal(false)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  async function handleCropSave() {
    setCompressing(true)
    try {
      const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels)
      setImageFile(croppedFile)
      setPreview(URL.createObjectURL(croppedFile))
      setCropModal(false)
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการตัดรูป')
    }
    setCompressing(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('กรุณากรอกชื่อลูกค้า')
    setSaving(true)
    const uid = getCookie('userId')
    
    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/
    if (form.phone && !phoneRegex.test(form.phone)) {
      toast.error('เบอร์โทรศัพท์ต้องมี 10 หลัก')
      setSaving(false)
      return
    }
    if (form.phone_backup && !phoneRegex.test(form.phone_backup)) {
      toast.error('เบอร์โทรศัพท์สำรองต้องมี 10 หลัก')
      setSaving(false)
      return
    }
    
    try {
      let finalImageUrl = form.image_url
      if (imageFile) {
        finalImageUrl = await uploadProductImage(imageFile)
      }
      
      const payload = { 
        name: form.name,
        phone: form.phone,
        phone_backup: form.phone_backup,
        email: form.email,
        tax_id: form.tax_id,
        branch_type: form.branch_type,
        branch_code: form.branch_code,
        image_url: finalImageUrl,
        address: `${form.address_line} ${form.subdistrict} ${form.district} ${form.province} ${form.zipcode}`.trim(),
        address_line: form.address_line,
        subdistrict: form.subdistrict,
        district: form.district,
        province: form.province,
        zipcode: form.zipcode
      }
      
      if (isEdit) {
        await updateCustomer(id, payload)
        await logActivity(uid, 'แก้ไขลูกค้า', form.name)
        toast.success('บันทึกเรียบร้อย')
      } else {
        const r = await createCustomer(payload)
        if (r) { 
          await logActivity(uid, 'เพิ่มลูกค้า', form.name)
          toast.success('เพิ่มลูกค้าสำเร็จ')
          navigate(`/customers/${r.id}`, { replace: true }) 
        }
      }
    } catch (err) {
      toast.error('บันทึกไม่สำเร็จ')
    }
    setSaving(false)
  }

  async function handleSaveBranch(customData) {
    const data = customData || branchForm
    if (!data.branch_name.trim()) return toast.error('กรุณากรอกชื่อสาขา')
    const uid = getCookie('userId')
    if (editBranchData) {
      const r = await updateBranch(editBranchData.id, data)
      if (r) { setBranches(p => p.map(b => b.id === editBranchData.id ? r : b)); toast.success('แก้ไขสาขาเรียบร้อย') }
    } else {
      const r = await createBranch({ ...data, customer_id: id })
      if (r) { setBranches(p => [...p, r]); await logActivity(uid, 'เพิ่มสาขา', data.branch_name); toast.success('เพิ่มสาขาสำเร็จ') }
    }
    setBranchModal(false)
  }

  async function handleDeleteBranch(b) {
    if (!confirm(`ลบสาขา "${b.branch_name}" ?`)) return
    if (await deleteBranch(b.id)) { setBranches(p => p.filter(x => x.id !== b.id)); toast.success('ลบแล้ว') }
  }

  const inputCls = "w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/customers')} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={22} /></button>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{isEdit ? '✏️ แก้ไขข้อมูลลูกค้า' : '➕ เพิ่มลูกค้าใหม่'}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Profile Image */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col items-center sticky top-24">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageChange} />
              
              <div onClick={() => setSelectorModal(true)} className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-lg ${preview ? 'border-brand-500' : 'border-gray-100 bg-gray-50 hover:border-brand-200'}`}>
                {compressing ? (
                  <LoadingSpinner />
                ) : preview ? (
                  <img src={preview} alt="Profile" className="w-full h-full object-cover transition-transform hover:scale-110" />
                ) : (
                  <div className="text-gray-300 flex flex-col items-center">
                    <Camera size={40} strokeWidth={1.5} />
                    <span className="text-[10px] font-black uppercase mt-1">Add Photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                  <Upload size={24} className="text-white" />
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm font-black text-gray-800">รูปภาพลูกค้า</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Profile Photo</p>
              </div>
            </div>
          </div>

          {/* Right Column: General Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
                <h3 className="font-black text-lg text-gray-800">ข้อมูลทั่วไป</h3>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">ชื่อลูกค้า/ร้านค้า *</label>
                <input type="text" value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="เช่น ร้านสมชาย" className={inputCls}/>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">ประเภทสำนักงาน</label>
                  <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                    <button 
                      type="button"
                      onClick={() => upd('branch_type', 'สำนักงานใหญ่')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${form.branch_type === 'สำนักงานใหญ่' ? 'bg-white shadow-md text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      🏢 สนญ.
                    </button>
                    <button 
                      type="button"
                      onClick={() => upd('branch_type', 'สาขา')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${form.branch_type === 'สาขา' ? 'bg-white shadow-md text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      🏬 สาขา
                    </button>
                  </div>
                </div>

                {form.branch_type === 'สาขา' && (
                  <div className="animate-scaleIn">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">รหัส/ชื่อสาขา</label>
                    <input type="text" value={form.branch_code} onChange={e=>upd('branch_code',e.target.value)} placeholder="0001 หรือ บางนา" className={inputCls}/>
                  </div>
                )}
              </div>
            </div>

            {/* ติดต่อ */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
                <h3 className="font-black text-lg text-gray-800">การติดต่อ & ภาษี</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">เบอร์โทรศัพท์หลัก</label>
                  <input type="text" value={form.phone} maxLength={10} onChange={e=>upd('phone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="08XXXXXXXX" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">เบอร์โทรสำรอง</label>
                  <input type="text" value={form.phone_backup} maxLength={10} onChange={e=>upd('phone_backup', e.target.value.replace(/[^0-9]/g, ''))} placeholder="08XXXXXXXX" className={inputCls}/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center justify-between">
                    อีเมล <span className="text-[8px] bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded-md">REQUIRED FOR E-BILL</span>
                  </label>
                  <input type="email" value={form.email} onChange={e=>upd('email',e.target.value)} placeholder="example@email.com" className="w-full px-4 py-3.5 border-2 border-warning-100 bg-warning-50/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">เลขประจำตัวผู้เสียภาษี</label>
                  <input type="text" value={form.tax_id} onChange={e=>upd('tax_id',e.target.value)} placeholder="13 หลัก" className={inputCls}/>
                </div>
              </div>
            </div>

            {/* ที่อยู่ */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
                <h3 className="font-black text-lg text-gray-800">ที่อยู่จัดส่ง / ที่อยู่หลัก</h3>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">ที่อยู่ (บ้านเลขที่ / ซอย / ถนน)</label>
                <input type="text" value={form.address_line} onChange={e=>upd('address_line',e.target.value)} placeholder="ระบุเลขที่บ้านและถนน" className={inputCls}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">แขวง / ตำบล</label>
                  <input type="text" value={form.subdistrict} onChange={e=>upd('subdistrict',e.target.value)} className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">เขต / อำเภอ</label>
                  <input type="text" value={form.district} onChange={e=>upd('district',e.target.value)} className={inputCls}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">จังหวัด</label>
                  <input type="text" value={form.province} onChange={e=>upd('province',e.target.value)} className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">รหัสไปรษณีย์</label>
                  <input type="text" value={form.zipcode} onChange={e=>upd('zipcode',e.target.value)} className={inputCls}/>
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving || compressing} className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white text-xl font-black rounded-3xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
              {saving ? <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save size={24}/>บันทึกข้อมูลลูกค้า</>}
            </button>
          </div>
        </div>
      </form>

      {isEdit && (
        <div className="mt-8 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">🏪 สาขา ({branches.length})</h3>
            <button onClick={()=>{
              setEditBranchData(null);
              setBranchForm({
                branch_name:'', phone:'', phone_backup:'', email:'', 
                address_line:'', subdistrict:'', district:'', province:'', zipcode:'', address:''
              });
              setBranchModal(true)
            }} className="flex items-center gap-1 px-4 py-2 bg-success-500 hover:bg-success-600 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all shadow-sm">
              <Plus size={16}/>เพิ่มสาขา
            </button>
          </div>
          {branches.length === 0 ? <p className="text-gray-400 text-center py-6">ยังไม่มีสาขา</p> : (
            <div className="space-y-3">{branches.map(b=>(
              <div key={b.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between hover:bg-brand-50 transition-colors">
                <div>
                  <p className="font-semibold">{b.branch_name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {b.phone && <p className="text-xs text-gray-500 flex items-center gap-1">📞 {b.phone}</p>}
                    {b.email && <p className="text-xs text-gray-500 flex items-center gap-1">📧 {b.email}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{
                    setEditBranchData(b);
                    setBranchForm({
                      branch_name: b.branch_name||'',
                      phone: b.phone||'',
                      phone_backup: b.phone_backup||'',
                      email: b.email||'',
                      address_line: b.address_line||'',
                      subdistrict: b.subdistrict||'',
                      district: b.district||'',
                      province: b.province||'',
                      zipcode: b.zipcode||'',
                      address: b.address||''
                    });
                    setBranchModal(true)
                  }} className="p-2 rounded-xl bg-white hover:bg-brand-100 shadow-sm transition-all"><Edit3 size={18} className="text-brand-600"/></button>
                  <button onClick={()=>handleDeleteBranch(b)} className="p-2 rounded-xl bg-white hover:bg-danger-100 shadow-sm transition-all"><Trash2 size={18} className="text-danger-500"/></button>
                </div>
              </div>
            ))}</div>
          )}
        </div>
      )}

      <Modal isOpen={branchModal} onClose={()=>setBranchModal(false)} title={editBranchData?'✏️ แก้ไขสาขา':'➕ เพิ่มสาขาใหม่'}>
        <div className="space-y-6 max-h-[70dvh] overflow-y-auto no-scrollbar p-1">
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-brand-600 uppercase tracking-wider">ข้อมูลทั่วไป</h4>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">ชื่อสาขา *</label>
              <input type="text" value={branchForm.branch_name} onChange={e=>setBranchForm(p=>({...p,branch_name:e.target.value}))} placeholder="เช่น สาขาบางนา" className={inputCls}/>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">เบอร์โทร</label>
                <input type="tel" value={branchForm.phone} maxLength={10} onChange={e=>setBranchForm(p=>({...p,phone:e.target.value.replace(/[^0-9]/g, '')}))} placeholder="08XXXXXXXX" className={inputCls}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">เบอร์โทรสำรอง</label>
                <input type="tel" value={branchForm.phone_backup} maxLength={10} onChange={e=>setBranchForm(p=>({...p,phone_backup:e.target.value.replace(/[^0-9]/g, '')}))} placeholder="08XXXXXXXX" className={inputCls}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">อีเมล</label>
              <input type="email" value={branchForm.email} onChange={e=>setBranchForm(p=>({...p,email:e.target.value}))} placeholder="branch@email.com" className={inputCls}/>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm text-brand-600 uppercase tracking-wider">ที่อยู่สาขา</h4>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">บ้านเลขที่ / ซอย / ถนน / หมู่</label>
              <input type="text" value={branchForm.address_line} onChange={e=>setBranchForm(p=>({...p,address_line:e.target.value}))} className={inputCls}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">แขวง / ตำบล</label><input type="text" value={branchForm.subdistrict} onChange={e=>setBranchForm(p=>({...p,subdistrict:e.target.value}))} className={inputCls}/></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">เขต / อำเภอ</label><input type="text" value={branchForm.district} onChange={e=>setBranchForm(p=>({...p,district:e.target.value}))} className={inputCls}/></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">จังหวัด</label><input type="text" value={branchForm.province} onChange={e=>setBranchForm(p=>({...p,province:e.target.value}))} className={inputCls}/></div>
              <div><label className="block text-sm font-semibold text-gray-600 mb-1">รหัสไปรษณีย์</label><input type="text" value={branchForm.zipcode} onChange={e=>setBranchForm(p=>({...p,zipcode:e.target.value}))} className={inputCls}/></div>
            </div>
          </div>

          <button onClick={() => {
            const fullAddress = `${branchForm.address_line} ${branchForm.subdistrict} ${branchForm.district} ${branchForm.province} ${branchForm.zipcode}`.trim();
            handleSaveBranch({ ...branchForm, address: fullAddress });
          }} className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white text-lg font-bold rounded-2xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
            <Save size={20}/> บันทึกสาขา
          </button>
        </div>
      </Modal>

      {/* Image Source Selector */}
      <Modal isOpen={selectorModal} onClose={() => setSelectorModal(false)} title="เลือกแหล่งที่มาของรูป">
        <div className="grid grid-cols-2 gap-4 pb-4">
          <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-brand-50 text-brand-700 rounded-3xl border-2 border-brand-100 hover:bg-brand-100 transition-all active:scale-95">
            <Camera size={32} className="mb-2" />
            <span className="font-bold">ถ่ายรูป</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-700 rounded-3xl border-2 border-gray-100 hover:bg-gray-100 transition-all active:scale-95">
            <Upload size={32} className="mb-2" />
            <span className="font-bold">แกลเลอรี</span>
          </button>
        </div>
      </Modal>

      {/* Crop Modal */}
      {cropModal && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="p-4 flex items-center justify-between text-white bg-black/50 backdrop-blur-md">
            <button onClick={() => setCropModal(false)} className="p-2"><X size={24} /></button>
            <h3 className="font-bold">จัดตำแหน่งรูป</h3>
            <button onClick={handleCropSave} className="px-5 py-2 bg-brand-600 rounded-full font-bold">บันทึก</button>
          </div>
          <div className="flex-1 relative">
            <Cropper
              image={tempImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="p-8 bg-black/50 backdrop-blur-md">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <p className="text-center text-white text-xs mt-3">ลากเพื่อขยับ | เลื่อนแถบเพื่อซูม</p>
          </div>
        </div>
      )}
    </div>
  )
}
