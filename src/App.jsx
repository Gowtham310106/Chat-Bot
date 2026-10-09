import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import StoreLayout from './components/StoreLayout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import About from './pages/About'
import NotFound from './pages/NotFound'

// Admin code is split into its own chunks, so shoppers never download it.
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Login = lazy(() => import('./admin/Login'))
const Dashboard = lazy(() => import('./admin/Dashboard'))
const Products = lazy(() => import('./admin/Products'))
const ProductForm = lazy(() => import('./admin/ProductForm'))
const Orders = lazy(() => import('./admin/Orders'))
const OrderDetail = lazy(() => import('./admin/OrderDetail'))
const Content = lazy(() => import('./admin/Content'))
const Settings = lazy(() => import('./admin/Settings'))

function App() {
  return (
    <Suspense fallback={<div className="fullscreen-msg"><span className="loader" /></div>}>
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:id" element={<OrderConfirmation />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="content" element={<Content />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
    </Suspense>
  )
}

export default App
