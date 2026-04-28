import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Search, Users, UserPlus, Filter, X, Plus, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'
import SearchBar from '../../components/SearchBar'
import QuantityInput from '../../components/QuantityInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import { useParams, useLocation } from 'react-router-dom'
import { getCustomers, getBranchesByCustomer, getProducts, createInvoice, updateInvoice, generateInvoiceNumber, logActivity, getInvoice, uploadInvoiceAttachment } from '../../lib/db'
import { formatCurrency, addDays, toInputDate, getCookie, formatDate } from '../../lib/utils'

const STEPS = ['เลือกลูกค้า', 'เลือกสินค้า', 'รายละเอียด & สรุปบิล']

export default function InvoiceWizard() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [customers, setCustomers] = useState([])
  const [custSearch, setCustSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)

  // Step 2
  const [products, setProducts] = useState([])
  const [prodSearch, setProdSearch] = useState('')
  const [cart, setCart] = useState({}) // { productId: qty }

  // Step 3
  const [invoiceDate, setInvoiceDate] = useState(toInputDate())
  const [creditDays, setCreditDays] = useState(30)
  const [discountType, setDiscountType] = useState('baht') // 'baht' or 'percent'
  const [discountValue, setDiscountValue] = useState('')
  const [vatEnabled, setVatEnabled] = useState(false)
  const [note, setNote] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [attachments, setAttachments] = useState([]) // Array of { file: File, url: string, isNew: boolean }
  const [editInvoiceData, setEditInvoiceData] = useState(null)

  // Filtering & UI State
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    sortBy: 'name-asc',
    minPrice: '',
    maxPrice: ''
  })
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [pendingNavigateTo, setPendingNavigateTo] = useState(null)

  useEffect(() => { loadInitial() }, [id])

  async function loadInitial() {
    setLoading(true)
    const [c, p] = await Promise.all([getCustomers(), getProducts()])
    setCustomers(c); setProducts(p)

    if (isEdit) {
      const inv = await getInvoice(id)
      if (inv) {
        setEditInvoiceData(inv)
        
        // Find customer and branch
        const cust = c.find(x => x.id === inv.customer_id)
        if (cust) {
          setSelectedCustomer(cust)
          const b = await getBranchesByCustomer(cust.id)
          setBranches(b)
          if (inv.branch_id) setSelectedBranch(b.find(x => x.id === inv.branch_id) || null)
        }
        
        // Populate cart
        const newCart = {}
        ;(inv.invoice_items || []).forEach(item => {
          newCart[item.product_id] = item.qty
        })
        setCart(newCart)

        // Populate details
        setInvoiceDate(toInputDate(new Date(inv.invoice_date)))
        setCreditDays(inv.credit_days || 30)
        setDiscountType(inv.discount_percent > 0 ? 'percent' : 'baht')
        setDiscountValue(inv.discount_percent > 0 ? inv.discount_percent : (inv.discount_amount || ''))
        setVatEnabled(inv.vat_enabled)
        setNote(inv.note || '')
        setPoNumber(inv.po_number || '')
        setAttachments((inv.attachment_urls || []).map(url => ({ url, isNew: false })))

        // Skip to step 3? Let's just stay on step 1 or go to step 3. 
        setStep(2) // Jump to summary for edits
      }
    }
    setLoading(false)
  }

  async function selectCustomer(c) {
    setSelectedCustomer(c)
    setCreditDays(c.credit_days || 30)
    const b = await getBranchesByCustomer(c.id)
    setBranches(b)
    // Don't auto-select branch anymore, let the user choose between HQ and Branches
    setSelectedBranch(null) 
  }

  function updateCart(productId, qty) {
    setCart(prev => {
      const next = { ...prev }
      if (qty <= 0) delete next[productId]
      else next[productId] = qty
      return next
    })
  }

  function getCartItems() {
    return Object.entries(cart).map(([pid, qty]) => {
      const p = products.find(x => x.id === pid)
      return p ? { product: p, qty, total: p.price * qty } : null
    }).filter(Boolean)
  }

  const cartItems = getCartItems()
  const subtotal = cartItems.reduce((s, i) => s + i.total, 0)
  const discountAmt = discountType === 'percent' ? subtotal * (parseFloat(discountValue) || 0) / 100 : parseFloat(discountValue) || 0
  const afterDiscount = subtotal - discountAmt
  const vatAmt = vatEnabled ? afterDiscount * 0.07 : 0
  const grandTotal = afterDiscount + vatAmt
  const dueDate = addDays(invoiceDate, creditDays)

  // Update global dirty flag for Layout to see
  useEffect(() => {
    window.isInvoiceDirty = cartItems.length > 0
    return () => { window.isInvoiceDirty = false }
  }, [cartItems.length])

  // Listen for navigation attempts from Layout
  useEffect(() => {
    const handleLayoutNav = (e) => {
      setPendingNavigateTo(e.detail.to)
      setShowExitWarning(true)
    }
    window.addEventListener('invoice-exit-request', handleLayoutNav)
    return () => window.removeEventListener('invoice-exit-request', handleLayoutNav)
  }, [])

  // Browser level protection (refresh/close tab)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cartItems.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [cartItems.length])

  // Navigation Guard logic
  const handleExitAttempt = (to = '/invoices') => {
    if (cartItems.length > 0) {
      setPendingNavigateTo(to)
      setShowExitWarning(true)
    } else {
      navigate(to)
    }
  }

  const confirmExit = async (saveAsDraft = false) => {
    if (saveAsDraft) {
      await handleSaveDraft()
    }
    setShowExitWarning(false)
    navigate(pendingNavigateTo || '/invoices')
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const uid = getCookie('userId')
      const invNumber = await generateInvoiceNumber()
      const invoiceData = {
        invoice_number: invNumber,
        customer_id: selectedCustomer?.id || null,
        branch_id: selectedBranch?.id || null,
        user_id: uid,
        invoice_date: invoiceDate,
        due_date: dueDate,
        credit_days: creditDays,
        subtotal,
        discount_amount: discountAmt,
        discount_percent: discountType === 'percent' ? parseFloat(discountValue) || 0 : 0,
        vat_enabled: vatEnabled,
        vat_amount: vatAmt,
        total: grandTotal,
        note: note + ' (Draft)',
        status: 'draft'
      }

      const items = cartItems.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        qty: i.qty,
        price_per_unit: i.product.price,
        total_price: i.total,
      }))

      const result = await createInvoice(invoiceData, items)
      if (result) {
        toast.success('บันทึกเป็นฉบับร่างเรียบร้อย')
      }
    } catch (e) {
      toast.error('บันทึกฉบับร่างไม่สำเร็จ')
    }
    setSaving(false)
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase())
    const matchCat = !filters.category || p.animal_type === filters.category
    const matchSize = !filters.size || p.size === filters.size
    const matchMinPrice = !filters.minPrice || p.price >= Number(filters.minPrice)
    const matchMaxPrice = !filters.maxPrice || p.price <= Number(filters.maxPrice)
    return matchSearch && matchCat && matchSize && matchMinPrice && matchMaxPrice
  }).sort((a, b) => {
    if (filters.sortBy === 'name-asc') return a.name.localeCompare(b.name)
    if (filters.sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (filters.sortBy === 'price-asc') return a.price - b.price
    if (filters.sortBy === 'price-desc') return b.price - a.price
    return 0
  })

  function canNext() {
    if (step === 0) return selectedCustomer
    if (step === 1) return cartItems.length > 0
    return true
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const uid = getCookie('userId')
      
      const invoiceData = {
        customer_id: selectedCustomer.id,
        branch_id: selectedBranch?.id || null,
        user_id: uid, // Track who last edited/created
        invoice_date: invoiceDate,
        due_date: dueDate,
        credit_days: creditDays,
        subtotal,
        discount_amount: discountAmt,
        discount_percent: discountType === 'percent' ? parseFloat(discountValue) || 0 : 0,
        vat_amount: vatAmt,
        total: grandTotal,
        note,
        po_number: poNumber,
        attachment_urls: attachments.filter(a => !a.isNew).map(a => a.url)
      }

      const items = cartItems.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        qty: i.qty,
        price_per_unit: i.product.price,
        cost_per_unit: i.product.cost || 0,
        total_price: i.total,
      }))

      if (isEdit) {
        // Upload new attachments first
        const newUrls = []
        for (const a of attachments.filter(x => x.isNew)) {
          const url = await uploadInvoiceAttachment(a.file)
          if (url) newUrls.push(url)
        }
        invoiceData.attachment_urls = [...invoiceData.attachment_urls, ...newUrls]

        const result = await updateInvoice(id, invoiceData, items)
        if (result) {
          toast.success(`แก้ไขบิล ${editInvoiceData?.invoice_number} สำเร็จ!`)
          navigate(`/invoices/${id}`, { replace: true })
        }
      } else {
        const invNumber = await generateInvoiceNumber()
        
        // Upload attachments
        const uploadedUrls = []
        for (const a of attachments) {
          if (a.isNew) {
            const url = await uploadInvoiceAttachment(a.file)
            if (url) uploadedUrls.push(url)
          }
        }

        const newInvoice = { ...invoiceData, invoice_number: invNumber, status: 'pending', attachment_urls: uploadedUrls }
        const result = await createInvoice(newInvoice, items)
        if (result) {
          await logActivity(uid, 'สร้างบิล', `${invNumber} - ${selectedCustomer.name} - ${formatCurrency(grandTotal)}`)
          toast.success(`สร้างบิล ${invNumber} สำเร็จ!`)
          navigate(`/invoices/${result.id}`, { replace: true })
        }
      }
    } catch (err) { 
      console.error(err)
      toast.error('เกิดข้อผิดพลาด') 
    }
    setSaving(false)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => step > 0 ? setStep(step - 1) : handleExitAttempt(isEdit ? `/invoices/${id}` : '/invoices')} className="p-2 rounded-xl hover:bg-gray-100"><ArrowLeft size={22} /></button>
        <h2 className="text-xl font-bold">{isEdit ? `✏️ แก้ไขบิล ${editInvoiceData?.invoice_number || ''}` : '🧾 สร้างบิล'}</h2>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? <Check size={14} /> : <span>{i + 1}</span>}
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button 
              className="flex flex-col items-center justify-center p-5 bg-brand-50 border-2 border-brand-500 text-brand-700 rounded-2xl active:scale-95 transition-all shadow-sm"
            >
              <Users size={32} strokeWidth={2} className="mb-2" />
              <span className="font-bold text-sm">ลูกค้าในระบบ</span>
            </button>
            <button 
              onClick={() => navigate('/customers/new')}
              className="flex flex-col items-center justify-center p-5 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl hover:border-brand-200 hover:text-brand-600 active:scale-95 transition-all shadow-sm"
            >
              <UserPlus size={32} strokeWidth={2} className="mb-2" />
              <span className="font-bold text-sm">เพิ่มลูกค้าใหม่</span>
            </button>
          </div>

          <div className="space-y-3">
            <SearchBar value={custSearch} onChange={setCustSearch} placeholder="ค้นหาร้านค้า หรือ สาขา..." />
          {customers.filter(c => 
            c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
            (c.branches || []).some(b => b.branch_name.toLowerCase().includes(custSearch.toLowerCase()))
          ).map(c => (
            <div key={c.id} className="space-y-2">
              <button onClick={() => selectCustomer(c)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedCustomer?.id === c.id ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white hover:border-brand-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-base">{c.name}</p>
                    {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                  </div>
                  {c.branch_count > 0 && (
                    <span className="px-2 py-1 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-lg uppercase">
                      {c.branch_count} สาขา
                    </span>
                  )}
                </div>
              </button>

              {/* Branch Selection UI - Shows when customer is selected */}
              {selectedCustomer?.id === c.id && (
                <div className="ml-4 pl-4 border-l-2 border-brand-200 space-y-2 py-2 animate-fadeIn">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">เลือกที่อยู่จัดส่ง / สาขา</p>
                  
                  {/* Head Office Option */}
                  <button 
                    onClick={() => setSelectedBranch(null)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${!selectedBranch ? 'border-brand-400 bg-white shadow-sm font-bold' : 'border-transparent bg-gray-50 text-gray-500'}`}
                  >
                    🏢 สำนักงานใหญ่ (ตามที่อยู่หลัก)
                  </button>

                  {/* Branches Options */}
                  {branches.map(b => (
                    <button key={b.id} onClick={() => setSelectedBranch(b)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${selectedBranch?.id === b.id ? 'border-brand-400 bg-white shadow-sm font-bold' : 'border-transparent bg-gray-50 text-gray-500'}`}>
                      📍 {b.branch_name}
                    </button>
                  ))}
                  
                  {branches.length === 0 && !loading && (
                    <p className="text-xs text-gray-400 italic py-1">ไม่มีข้อมูลสาขาสำหรับลูกค้ารายนี้</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Step 2: Select Products */}
      {step === 1 && (
        <div className="space-y-3 pb-32">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar value={prodSearch} onChange={setProdSearch} placeholder="ค้นหาสินค้า..." />
            </div>
            <button 
              onClick={() => setShowFilter(true)}
              className={`p-3.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${Object.values(filters).some(v => v && v !== 'name-asc') ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Quick Filter Info */}
          {(filters.category || filters.size) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {filters.category && <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold flex items-center gap-1">{filters.category} <X size={12} className="cursor-pointer" onClick={() => setFilters(p=>({...p,category:''}))}/></span>}
              {filters.size && <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold flex items-center gap-1">{filters.size} <X size={12} className="cursor-pointer" onClick={() => setFilters(p=>({...p,size:''}))}/></span>}
              <button onClick={() => setFilters({category:'',size:'',sortBy:'name-asc',minPrice:'',maxPrice:''})} className="text-xs text-brand-600 font-bold ml-1">ล้างทั้งหมด</button>
            </div>
          )}

          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">ไม่พบสินค้าที่ค้นหา</div>
            ) : filteredProducts.map(p => (
              <div key={p.id} className={`bg-white rounded-2xl p-4 border ${cart[p.id] ? 'border-brand-300 bg-brand-50/30 shadow-sm' : 'border-gray-100'} transition-all`}>
                <div className="flex items-start gap-3">
                  {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-tight mb-1">{p.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{p.animal_type} | {p.size} | {p.weight_g}g</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-brand-700 font-black text-lg">{formatCurrency(p.price)}</p>
                      <p className="text-xs text-gray-400">คงเหลือ: <span className={p.stock_qty < 10 ? 'text-danger-500 font-bold' : ''}>{p.stock_qty}</span></p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <QuantityInput value={cart[p.id] || 0} onChange={v => updateCart(p.id, v)} max={p.stock_qty} />
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary Bar */}
          {cartItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-15px_30px_rgba(0,0,0,0.1)] px-4 py-4 z-40 animate-slideUp">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{cartItems.length} รายการ</span>
                  <p className="text-2xl font-black text-brand-600 leading-none mt-1">{formatCurrency(subtotal)}</p>
                </div>
                <button onClick={() => setStep(step + 1)} className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center gap-2 text-lg">
                  ถัดไป <ArrowRight size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Invoice Details & Summary */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">📝 รายละเอียดบิล</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">วันที่วางบิล</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">เครดิตเทอม</label>
                <select value={creditDays} onChange={e => setCreditDays(+e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base bg-white focus:ring-2 focus:ring-brand-500">
                  <option value={0}>0 วัน (จ่ายทันที)</option><option value={30}>30 วัน</option><option value={60}>60 วัน</option><option value={90}>90 วัน</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">📅 ครบกำหนด: <strong>{formatDate(dueDate)}</strong></p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">ส่วนลด</label>
                <div className="flex gap-2">
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="px-3 py-3 border border-gray-200 rounded-xl bg-white text-sm">
                    <option value="baht">บาท</option><option value="percent">%</option>
                  </select>
                  <input type="number" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="0" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
                <span className="font-semibold text-gray-700">คำนวณภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                <button type="button" onClick={() => setVatEnabled(!vatEnabled)}
                  className={`relative w-14 h-8 rounded-full transition-all ${vatEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${vatEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">เลขที่ PO</label>
                <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="เช่น PO-12345" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">หมายเหตุ</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={1} placeholder="หมายเหตุเพิ่มเติม..." className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>


          {/* Summary Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">📋 สรุปรายการ</h3>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-base mb-2 flex items-center gap-2">📍 ข้อมูลลูกค้า</h4>
              <p className="text-lg font-bold text-gray-800">{selectedCustomer?.name}</p>
              {selectedCustomer?.address && <p className="text-sm text-gray-600 mt-1">{selectedCustomer.address}</p>}
              {selectedBranch && (
                <div className="mt-2 pt-2 border-t border-gray-50">
                  <p className="text-sm font-medium text-gray-700">สาขา: {selectedBranch.branch_name}</p>
                  {selectedBranch.address && <p className="text-sm text-gray-500">{selectedBranch.address}</p>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-base mb-3 flex items-center gap-2">📦 รายการสินค้า</h4>
              {cartItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">x{item.qty} · {formatCurrency(item.product.price)} / หน่วย</p>
                  </div>
                  <p className="font-bold text-sm">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="bg-brand-50 rounded-2xl p-5 border border-brand-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">ราคาก่อนลด</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-sm"><span className="text-danger-600">ส่วนลด</span><span className="text-danger-600 font-medium">-{formatCurrency(discountAmt)}</span></div>}
              {vatEnabled && <div className="flex justify-between text-sm"><span className="text-gray-600">VAT 7%</span><span className="font-medium">+{formatCurrency(vatAmt)}</span></div>}
              <div className="flex justify-between pt-3 mt-3 border-t border-brand-200">
                <span className="text-lg font-bold text-brand-900">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-bold text-brand-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-400 text-center mt-2">
              ออกบิลโดย: {getCookie('userName') || 'ผู้ใช้'}
            </div>

            {/* Attachments Section moved to bottom */}
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-600">📸 รูปภาพหลักฐาน / แนบไฟล์</label>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{attachments.length} รูป</span>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {attachments.map((a, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                    <img src={a.url} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-danger-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    {a.isNew && (
                      <div className="absolute bottom-0 left-0 right-0 bg-brand-500/80 text-white text-[8px] font-bold text-center py-0.5">NEW</div>
                    )}
                  </div>
                ))}
                
                <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-500 hover:text-brand-500 cursor-pointer transition-all active:scale-95">
                  <Plus size={24} />
                  <span className="text-[10px] font-bold mt-1 uppercase">เพิ่มรูป</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      const newAttachments = files.map(file => ({
                        file,
                        url: URL.createObjectURL(file),
                        isNew: true
                      }))
                      setAttachments(prev => [...prev, ...newAttachments])
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl active:scale-95 transition-all">← ย้อนกลับ</button>
        )}
        {step < 2 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
            className={`flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${!canNext() ? 'opacity-40 cursor-not-allowed' : ''}`}>
            ถัดไป <ArrowRight size={20} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-4 bg-success-600 hover:bg-success-700 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"/> : <>✅ บันทึกบิล</>}
          </button>
        )}
      </div>

      {/* Product Filter Modal */}
      <Modal isOpen={showFilter} onClose={() => setShowFilter(false)} title="ตัวกรองสินค้า">
        <div className="space-y-5 py-2">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2 flex items-center gap-2"><Filter size={16}/> ประเภทสินค้า</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilters(p => ({ ...p, category: '' }))} 
                className={`py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all ${filters.category === '' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-500'}`}>
                ทั้งหมด
              </button>
              {[...new Set(products.map(p => p.animal_type))].filter(Boolean).sort().map(c => (
                <button key={c} onClick={() => setFilters(p => ({ ...p, category: c }))} 
                  className={`py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all ${filters.category === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-500'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2 flex items-center gap-2"><SlidersHorizontal size={16}/> ขนาด</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilters(p => ({ ...p, size: '' }))} 
                className={`py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all ${filters.size === '' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-500'}`}>
                ทั้งหมด
              </button>
              {[...new Set(products.map(p => p.size))].filter(Boolean).sort().map(s => (
                <button key={s} onClick={() => setFilters(p => ({ ...p, size: s }))} 
                  className={`py-2 px-3 rounded-xl border-2 font-bold text-sm transition-all ${filters.size === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2 flex items-center gap-2"><ArrowUpDown size={16}/> การเรียงลำดับ</label>
            <select value={filters.sortBy} onChange={e => setFilters(p => ({ ...p, sortBy: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white focus:ring-2 focus:ring-brand-500">
              <option value="name-asc">ชื่อสินค้า (ก-ฮ)</option>
              <option value="name-desc">ชื่อสินค้า (ฮ-ก)</option>
              <option value="price-asc">ราคาน้อยไปมาก</option>
              <option value="price-desc">ราคามากไปน้อย</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">💰 ช่วงราคา</label>
            <div className="flex items-center gap-2">
              <input type="number" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} placeholder="ขั้นต่ำ" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm" />
              <div className="w-4 h-0.5 bg-gray-300" />
              <input type="number" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} placeholder="สูงสุด" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm" />
            </div>
          </div>

          <button onClick={() => setShowFilter(false)} className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg mt-4">ตกลง</button>
          <button onClick={() => {setFilters({category:'',size:'',sortBy:'name-asc',minPrice:'',maxPrice:''}); setShowFilter(false)}} className="w-full py-2 text-gray-400 font-medium text-sm">ล้างตัวกรองทั้งหมด</button>
        </div>
      </Modal>

      {/* Exit Warning Modal */}
      <Modal isOpen={showExitWarning} onClose={() => setShowExitWarning(false)} title="⚠️ ยังไม่ได้บันทึกบิล">
        <div className="text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-warning-50 text-warning-500 rounded-full flex items-center justify-center mx-auto">
            <X size={40} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-800">ยืนยันการออกจากหน้าจอนี้?</h4>
            <p className="text-gray-500 mt-2">คุณมีรายการสินค้าในตะกร้า หากออกตอนนี้ข้อมูลที่ทำไว้จะหายไป</p>
          </div>
          <div className="space-y-3 pt-2">
            <button onClick={() => confirmExit(true)} className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">💾 บันทึกเป็นฉบับร่างแล้วออก</button>
            <button onClick={() => confirmExit(false)} className="w-full py-4 bg-danger-50 text-danger-600 font-bold rounded-2xl active:scale-95 transition-all">🗑️ ลบรายการและออกเลย</button>
            <button onClick={() => setShowExitWarning(false)} className="w-full py-3 text-gray-400 font-medium">ยกเลิก</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
