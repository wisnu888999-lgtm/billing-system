// Format number as Thai Baht
export function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

// Format number with commas
export function formatNumber(num) {
  return new Intl.NumberFormat('th-TH').format(num || 0)
}

// Format date to Thai locale
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format date for input
export function toInputDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  return new Date(dateStr).toISOString().split('T')[0]
}

// Add days to date
export function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Check if overdue
export function isOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toISOString().split('T')[0])
}

// Days until due
export function daysUntilDue(dueDate) {
  if (!dueDate) return 0
  const now = new Date(new Date().toISOString().split('T')[0])
  const due = new Date(dueDate)
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24))
}

// Status label in Thai
export function getStatusLabel(status) {
  const labels = {
    pending: 'รอชำระ',
    paid: 'ชำระแล้ว',
    overdue: 'เกินกำหนด',
  }
  return labels[status] || status
}

// Status color classes
export function getStatusColor(status) {
  const colors = {
    pending: 'bg-warning-50 text-warning-600 border-warning-500',
    paid: 'bg-success-50 text-success-700 border-success-500',
    overdue: 'bg-danger-50 text-danger-700 border-danger-500',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

// Cookie helpers
export function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Debounce utility
export function debounce(fn, ms = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// cn - join class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
