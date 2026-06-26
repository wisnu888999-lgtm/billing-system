import { Routes, Route, Navigate } from 'react-router-dom'
import { getCookie } from './lib/utils'
import Layout from './components/Layout'
import PortalLayout from './components/PortalLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/customers/CustomerList'
import CustomerDetail from './pages/customers/CustomerDetail'
import CustomerForm from './pages/customers/CustomerForm'
import CustomerRecycleBin from './pages/customers/CustomerRecycleBin'
import ProductList from './pages/products/ProductList'
import ProductForm from './pages/products/ProductForm'
import InvoiceWizard from './pages/invoices/InvoiceWizard'
import InvoiceList from './pages/invoices/InvoiceList'
import InvoiceDetail from './pages/invoices/InvoiceDetail'
import InvoiceRecycleBin from './pages/invoices/InvoiceRecycleBin'
import ProductRecycleBin from './pages/products/ProductRecycleBin'
import Pricing from './pages/products/Pricing'

// Portal pages
import PortalHome from './pages/portal/PortalHome'
import PortalCatalog from './pages/portal/PortalCatalog'
import PortalPricing from './pages/portal/PortalPricing'
import PortalAbout from './pages/portal/PortalAbout'

function ProtectedRoute({ children, allowedRoles }) {
  const user = getCookie('userName')
  const role = getCookie('userRole')
  
  if (!user) return <Navigate to="/login" replace />
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />
  }
  
  return children
}

function HomeRedirect() {
  const role = getCookie('userRole')
  if (role === 'admin' || role === 'ceo') {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/home" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Root redirect route */}
      <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />

      {/* 1. Admin/CEO Protected Routes */}
      <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'ceo']}><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/recycle-bin" element={<CustomerRecycleBin />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="products" element={<ProductList />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/recycle-bin" element={<ProductRecycleBin />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceWizard />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/recycle-bin" element={<InvoiceRecycleBin />} />
        <Route path="invoices/:id/edit" element={<InvoiceWizard />} />
      </Route>

      {/* 2. General Portal Routes (accessible by everyone) */}
      <Route path="/" element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
        <Route path="home" element={<PortalHome />} />
        <Route path="catalog" element={<PortalCatalog />} />
        <Route path="portal-pricing" element={<PortalPricing />} />
        <Route path="about" element={<PortalAbout />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

