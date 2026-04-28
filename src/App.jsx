import { Routes, Route, Navigate } from 'react-router-dom'
import { getCookie } from './lib/utils'
import Layout from './components/Layout'
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

function ProtectedRoute({ children }) {
  const user = getCookie('userName')
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/recycle-bin" element={<CustomerRecycleBin />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/recycle-bin" element={<ProductRecycleBin />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceWizard />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/recycle-bin" element={<InvoiceRecycleBin />} />
        <Route path="invoices/:id/edit" element={<InvoiceWizard />} />
      </Route>
    </Routes>
  )
}
