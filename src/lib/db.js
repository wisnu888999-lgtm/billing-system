import { supabase } from './supabase'
import toast from 'react-hot-toast'

// ===== Helper: handle supabase errors =====
function handleError(error, fallbackMsg = 'เกิดข้อผิดพลาด') {
  console.error(error)
  // If it's an RLS error, show a more helpful message
  let msg = fallbackMsg
  if (error?.message?.includes('row-level security')) {
    msg = `${fallbackMsg} (ติดปัญหาด้านสิทธิ์การเข้าถึง RLS)`
  } else if (error?.message) {
    msg = error.message
  }
  toast.error(msg)
  return null
}

// ===== USERS =====
export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*').order('name')
  if (error) return handleError(error) || []
  return data
}

export async function getUserByName(name) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .maybeSingle()
  if (error) return handleError(error)
  return data
}

export async function createUser(name, role = 'staff') {
  const { data, error } = await supabase
    .from('users')
    .insert({ name, role })
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function updateUserRole(id, role) {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

// ===== ACTIVITY LOGS =====
export async function logActivity(userId, action, detail = '') {
  const { error } = await supabase
    .from('activity_logs')
    .insert({ user_id: userId, action, detail })
  if (error) handleError(error, 'ไม่สามารถบันทึกประวัติการทำงานได้')
}

export async function getActivityLogs(limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, users(name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return handleError(error) || []
  return data
}

// ===== CUSTOMERS =====
export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_branches(*)')
    .is('deleted_at', null) // Only get active customers
    .order('name')
  if (error) return handleError(error) || []
  return data.map(c => ({ 
    ...c, 
    branches: c.customer_branches || [],
    branch_count: c.customer_branches?.length || 0 
  }))
}

export async function getDeletedCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_branches(*)')
    .not('deleted_at', 'is', null) // Get only deleted ones
    .order('deleted_at', { ascending: false })
  if (error) return handleError(error) || []
  return data
}

export async function getCustomer(id) {
  const { data, error } = await supabase
    .from('customers')
    .select('*, customer_branches(*)')
    .eq('id', id)
    .single()
  if (error) return handleError(error)
  return data
}

export async function createCustomer(customer) {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function updateCustomer(id, updates) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function deleteCustomer(id) {
  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function restoreCustomer(id) {
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function permanentlyDeleteCustomer(id) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function getCustomerSpendingStats() {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('customer_id, total, invoice_date')
    .neq('status', 'cancelled')

  if (error) return {}

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const stats = {} // { customerId: { month: 0, year: 0, total: 0, lastDate: null, count: 0 } }

  invoices.forEach(inv => {
    const cid = inv.customer_id
    if (!cid) return
    if (!stats[cid]) stats[cid] = { month: 0, year: 0, total: 0, lastDate: null, count: 0 }

    const d = new Date(inv.invoice_date)
    const invTotal = Number(inv.total)

    stats[cid].total += invTotal
    stats[cid].count += 1
    
    // Track latest date
    if (!stats[cid].lastDate || d > new Date(stats[cid].lastDate)) {
      stats[cid].lastDate = inv.invoice_date
    }

    if (d.getFullYear() === thisYear) {
      stats[cid].year += invTotal
      if (d.getMonth() === thisMonth) {
        stats[cid].month += invTotal
      }
    }
  })

  return stats
}

export async function getCustomerInsight(customerId) {
  // 1. Get customer basic info
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('*, customer_branches(*)')
    .eq('id', customerId)
    .single()
  
  if (custErr) return handleError(custErr)

  // 2. Get all invoices for this customer
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('*, users(name)')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('invoice_date', { ascending: false })

  if (invErr) return handleError(invErr)

  // 3. Get all invoice items to find top products
  const invoiceIds = invoices.map(i => i.id)
  let topProducts = []
  if (invoiceIds.length > 0) {
    const { data: items, error: itemsErr } = await supabase
      .from('invoice_items')
      .select('product_name, qty, total_price')
      .in('invoice_id', invoiceIds)
    
    if (!itemsErr) {
      const productMap = {}
      items.forEach(item => {
        if (!productMap[item.product_name]) {
          productMap[item.product_name] = { qty: 0, total: 0 }
        }
        productMap[item.product_name].qty += item.qty
        productMap[item.product_name].total += Number(item.total_price)
      })
      topProducts = Object.entries(productMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
    }
  }

  // 4. Summarize stats
  const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
  const pendingAmount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total), 0)
  const lastOrderDate = invoices.length > 0 ? invoices[0].invoice_date : null

  return {
    customer,
    stats: {
      totalInvoices: invoices.length,
      totalSpent,
      pendingAmount,
      lastOrderDate
    },
    topProducts,
    recentInvoices: invoices.slice(0, 10)
  }
}

// ===== CUSTOMER BRANCHES =====
export async function createBranch(branch) {
  const { data, error } = await supabase
    .from('customer_branches')
    .insert(branch)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function updateBranch(id, updates) {
  const { data, error } = await supabase
    .from('customer_branches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function deleteBranch(id) {
  const { error } = await supabase.from('customer_branches').delete().eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function getBranchesByCustomer(customerId) {
  const { data, error } = await supabase
    .from('customer_branches')
    .select('*')
    .eq('customer_id', customerId)
    .order('branch_name')
  if (error) return handleError(error) || []
  return data
}

// ===== PRODUCTS =====
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  if (error) return handleError(error) || []
  return data
}

export async function getDeletedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) return handleError(error) || []
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function restoreProduct(id) {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function permanentlyDeleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function getDistinctProductValues() {
  const { data, error } = await supabase
    .from('products')
    .select('animal_type, size, weight_g, unit')
    .is('deleted_at', null)
  
  if (error) return { categories: [], sizes: [], weights: [], units: [] }

  const categories = [...new Set(data.map(i => i.animal_type).filter(Boolean))].sort()
  const sizes = [...new Set(data.map(i => i.size).filter(Boolean))].sort()
  const weights = [...new Set(data.map(i => i.weight_g).filter(Boolean))].sort((a,b) => a-b)
  const units = [...new Set(data.map(i => i.unit).filter(Boolean))].sort()

  return { categories, sizes, weights, units }
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return handleError(error)
  return data
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function getProductSalesStats() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const lastYear = currentYear - 1
  
  // Fetch invoice items with invoice date
  const { data, error } = await supabase
    .from('invoice_items')
    .select('product_id, qty, invoices!inner(invoice_date, status)')
    .neq('invoices.status', 'cancelled')

  if (error) {
    console.error('Error fetching sales stats:', error)
    return {}
  }

  const stats = {}
  data.forEach(item => {
    if (!item.invoices) return
    const year = new Date(item.invoices.invoice_date).getFullYear()
    const pid = item.product_id
    
    if (!stats[pid]) stats[pid] = { thisYear: 0, lastYear: 0 }
    
    if (year === currentYear) stats[pid].thisYear += item.qty
    else if (year === lastYear) stats[pid].lastYear += item.qty
  })

  // Calculate percentage change and return
  const result = {}
  Object.keys(stats).forEach(pid => {
    const s = stats[pid]
    const diff = s.thisYear - s.lastYear
    if (s.lastYear === 0 && s.thisYear > 0) {
      result[pid] = { type: 'new', text: `ขายไปแล้ว ${s.thisYear} ชิ้นปีนี้` }
    } else if (diff > 0) {
      const pct = Math.round((diff / s.lastYear) * 100)
      result[pid] = { type: 'increase', text: `ขายเพิ่ม ${pct}% (ปีต่อปี)` }
    } else if (diff < 0) {
      // maybe don't show negative badge
    }
  })
  
  return result
}

export async function addStock(productId, qty, note = '') {
  // Update stock quantity
  const { data: product, error: getErr } = await supabase
    .from('products')
    .select('stock_qty')
    .eq('id', productId)
    .single()
  if (getErr) return handleError(getErr)

  const newQty = (product.stock_qty || 0) + qty
  const { error: updateErr } = await supabase
    .from('products')
    .update({ stock_qty: newQty })
    .eq('id', productId)
  if (updateErr) return handleError(updateErr)

  // Record stock movement
  await supabase.from('stock_movements').insert({
    product_id: productId,
    type: 'in',
    qty,
    note,
  })

  return newQty
}

// ===== INVOICES =====
export async function getInvoices(filters = {}) {
  let query = supabase
    .from('invoices')
    .select('*, customers(name), customer_branches(branch_name), users(name)')
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.from) query = query.gte('invoice_date', filters.from)
  if (filters.to) query = query.lte('invoice_date', filters.to)
  if (filters.search) {
    query = query.or(`invoice_number.ilike.%${filters.search}%,customers.name.ilike.%${filters.search}%,po_number.ilike.%${filters.search}%`)
  }

  // Hide deleted unless explicitly asked (but we'll use a separate function for trash)
  query = query.is('deleted_at', null)

  const { data, error } = await query
  if (error) return handleError(error) || []
  return data
}

export async function getInvoice(id) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(name, phone, address, tax_id), customer_branches(branch_name, address), users(name), invoice_items(*, products(name, image_url))')
    .eq('id', id)
    .single()
  if (error) return handleError(error)
  return data
}

export async function createInvoice(invoice, items) {
  // Insert invoice
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  if (invErr) return handleError(invErr)

  // Insert items
  const itemsWithInvoice = items.map(item => ({
    ...item,
    invoice_id: inv.id,
    cost_per_unit: item.cost_per_unit || 0, // Ensure cost is saved
  }))
  const { error: itemsErr } = await supabase
    .from('invoice_items')
    .insert(itemsWithInvoice)
  if (itemsErr) return handleError(itemsErr)

  // Deduct stock for each item
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_qty')
      .eq('id', item.product_id)
      .single()
    if (product) {
      const { error: updErr } = await supabase
        .from('products')
        .update({ stock_qty: Math.max(0, product.stock_qty - item.qty) })
        .eq('id', item.product_id)
      if (updErr) handleError(updErr, 'ไม่สามารถตัดสต๊อกสินค้าได้')

      const { error: moveErr } = await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        type: 'out',
        qty: item.qty,
        ref_invoice_id: inv.id,
        note: `บิล ${invoice.invoice_number}`,
      })
      if (moveErr) handleError(moveErr, 'ไม่สามารถบันทึกประวัติสต๊อกได้')
    }
  }

  return inv
}

export async function getDeletedInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(name)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) return handleError(error)
  return data || []
}

export async function deleteInvoice(id) {
  const { error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function restoreInvoice(id) {
  const { error } = await supabase
    .from('invoices')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function permanentlyDeleteInvoice(id) {
  // invoice_items usually have ON DELETE CASCADE
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) return handleError(error)
  return true
}

export async function updateInvoiceStatus(id, status) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) return handleError(error)
  return data
}

export async function getInvoiceHistory(invoiceId) {
  const { data, error } = await supabase
    .from('invoice_history')
    .select('*, users(name)')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
  if (error) return handleError(error)
  return data || []
}

export async function updateInvoice(invoiceId, newInvoiceData, newItems) {
  // 1. Get original invoice and items
  const { data: oldInvoice, error: oldInvErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()
  if (oldInvErr) return handleError(oldInvErr)

  const { data: oldItems, error: oldItemsErr } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
  if (oldItemsErr) return handleError(oldItemsErr)

  // 2. Revert stock for old items
  for (const item of oldItems) {
    const { data: product } = await supabase.from('products').select('stock_qty').eq('id', item.product_id).single()
    if (product) {
      const { error: updErr } = await supabase.from('products').update({ stock_qty: product.stock_qty + item.qty }).eq('id', item.product_id)
      if (updErr) handleError(updErr, 'ไม่สามารถคืนสต๊อกได้')

      const { error: moveErr } = await supabase.from('stock_movements').insert({
        product_id: item.product_id, type: 'in', qty: item.qty, ref_invoice_id: invoiceId, note: `คืนสต๊อกเพื่อแก้ไขบิล ${oldInvoice.invoice_number}`
      })
      if (moveErr) handleError(moveErr, 'ไม่สามารถบันทึกประวัติคืนสต๊อกได้')
    }
  }

  // 3. Delete old items
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

  // 4. Update invoice data
  const { data: updatedInvoice, error: updateErr } = await supabase
    .from('invoices')
    .update(newInvoiceData)
    .eq('id', invoiceId)
    .select()
    .single()
  if (updateErr) return handleError(updateErr)

  // 5. Insert new items and deduct stock
  const itemsWithInvoice = newItems.map(item => ({ 
    ...item, 
    invoice_id: invoiceId,
    cost_per_unit: item.cost_per_unit || 0
  }))
  await supabase.from('invoice_items').insert(itemsWithInvoice)

  for (const item of newItems) {
    const { data: product } = await supabase.from('products').select('stock_qty').eq('id', item.product_id).single()
    if (product) {
      await supabase.from('products').update({ stock_qty: Math.max(0, product.stock_qty - item.qty) }).eq('id', item.product_id)
      await supabase.from('stock_movements').insert({
        product_id: item.product_id, type: 'out', qty: item.qty, ref_invoice_id: invoiceId, note: `หักสต๊อกแก้ไขบิล ${oldInvoice.invoice_number}`
      })
    }
  }

  // 6. Record history
  const userId = newInvoiceData.user_id
  await supabase.from('invoice_history').insert({
    invoice_id: invoiceId,
    user_id: userId,
    action: 'แก้ไขบิล',
    previous_data: { invoice: oldInvoice, items: oldItems },
    new_data: { invoice: updatedInvoice, items: newItems }
  })

  return updatedInvoice
}

// ===== GENERATE INVOICE NUMBER =====
export async function generateInvoiceNumber() {
  const now = new Date()
  const buddhistYear = now.getFullYear() + 543
  const yearStr = String(buddhistYear).slice(-4)
  const prefix = `INV-${yearStr}-`

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (data && data.length > 0) {
    const lastNum = parseInt(data[0].invoice_number.split('-').pop(), 10)
    nextNum = lastNum + 1
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`
}

// ===== DASHBOARD DATA =====
export async function getDashboardData(filters = {}) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  let query = supabase
    .from('invoices')
    .select('*, customers(name)')
    .is('deleted_at', null)

  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.startDate) query = query.gte('invoice_date', filters.startDate)
  if (filters.endDate) query = query.lte('invoice_date', filters.endDate)

  const { data: invoices, error } = await query
  if (error) return handleError(error)

  // 1. Calculations
  const totalAmount = (invoices || []).reduce((sum, i) => sum + Number(i.total), 0)
  const totalPending = (invoices || []).filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.total), 0)
  const totalOverdue = (invoices || []).filter(i => i.status === 'overdue' || (i.status === 'pending' && i.due_date < today)).reduce((sum, i) => sum + Number(i.total), 0)
  const invoiceCount = (invoices || []).length

  // 1.1 Profit Calculation
  let totalProfit = 0
  let totalCost = 0
  const invoiceIds = (invoices || []).map(i => i.id)
  if (invoiceIds.length > 0) {
    const { data: items } = await supabase
      .from('invoice_items')
      .select('qty, price_per_unit, cost_per_unit')
      .in('invoice_id', invoiceIds)
    
    ;(items || []).forEach(item => {
      const revenue = Number(item.price_per_unit) * item.qty
      const cost = Number(item.cost_per_unit) * item.qty
      totalCost += cost
      totalProfit += (revenue - cost)
    })

    // Subtract discounts from total profit to get Net Profit
    const totalDiscounts = (invoices || []).reduce((sum, i) => sum + Number(i.discount_amount), 0)
    totalProfit -= totalDiscounts
  }

  // 2. Sales Trend (by Date)
  const trendMap = {}
  ;(invoices || []).forEach(inv => {
    const d = inv.invoice_date
    trendMap[d] = (trendMap[d] || 0) + Number(inv.total)
  })
  const salesTrend = Object.entries(trendMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // 3. Status Distribution
  const statusMap = { pending: 0, paid: 0, overdue: 0 }
  ;(invoices || []).forEach(inv => {
    let s = inv.status
    if (s === 'pending' && inv.due_date < today) s = 'overdue'
    statusMap[s] = (statusMap[s] || 0) + 1
  })
  const statusDistribution = [
    { name: 'รอชำระ', value: statusMap.pending, color: '#f59e0b' },
    { name: 'ชำระแล้ว', value: statusMap.paid, color: '#22c55e' },
    { name: 'เกินกำหนด', value: statusMap.overdue, color: '#ef4444' },
  ].filter(x => x.value > 0)

  // 4. Top Customers
  const customerMap = {}
  ;(invoices || []).forEach(inv => {
    const name = inv.customers?.name || 'ไม่ระบุ'
    customerMap[name] = (customerMap[name] || 0) + Number(inv.total)
  })
  const topCustomers = Object.entries(customerMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // 5. Top Selling Products
  const invoiceIds = (invoices || []).map(i => i.id)
  let topProducts = []
  if (invoiceIds.length > 0) {
    const { data: items } = await supabase
      .from('invoice_items')
      .select('product_name, qty')
      .in('invoice_id', invoiceIds)
    
    const productMap = {}
    ;(items || []).forEach(item => {
      productMap[item.product_name] = (productMap[item.product_name] || 0) + item.qty
    })
    topProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
  }

  // 6. Pending Invoices
  const pendingList = (invoices || [])
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 10)

  return {
    totalAmount,
    totalPending,
    totalOverdue,
    totalProfit,
    totalCost,
    invoiceCount,
    salesTrend,
    statusDistribution,
    topCustomers,
    topProducts,
    pendingInvoices: pendingList,
  }
}

// ===== UPLOAD IMAGE =====
export async function uploadProductImage(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)
  if (error) return handleError(error)
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path)
  return urlData.publicUrl
}

// ===== UPLOAD INVOICE ATTACHMENT =====
export async function uploadInvoiceAttachment(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const { data, error } = await supabase.storage
    .from('invoice-attachments')
    .upload(fileName, file)
  if (error) {
    // If bucket doesn't exist, try to upload to product-images/invoices as fallback or error
    console.error('Upload error:', error)
    return handleError(error, 'กรุณาติดต่อแอดมินเพื่อสร้าง Bucket "invoice-attachments"')
  }
  const { data: urlData } = supabase.storage
    .from('invoice-attachments')
    .getPublicUrl(data.path)
  return urlData.publicUrl
}
