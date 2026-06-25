import { createBrowserRouter, RouterProvider } from 'react-router'
import AuthLayout from '@/components/AuthLayout.tsx'
import Layout from '@/components/Layout.tsx'
import ProtectedRoute from '@/components/ProtectedRoute.tsx'
import LoginPage from '@/pages/LoginPage.tsx'
import SignUpPage from '@/pages/SignUpPage.tsx'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.tsx'
import Dashboard from '@/pages/Dashboard.tsx'
import Products from '@/pages/Products.tsx'
import ProductForm from '@/pages/ProductForm.tsx'
import Orders from '@/pages/Orders.tsx'
import OrderDetail from '@/pages/OrderDetail.tsx'
import Customers from '@/pages/Customers.tsx'
import Settings from '@/pages/Settings.tsx'
import Website from '@/pages/Website.tsx'

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',           element: <LoginPage /> },
      { path: '/signup',          element: <SignUpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true,           element: <Dashboard /> },
      { path: 'products',      element: <Products /> },
      { path: 'products/new',  element: <ProductForm /> },
      { path: 'products/:id',  element: <ProductForm /> },
      { path: 'orders',        element: <Orders /> },
      { path: 'orders/:id',    element: <OrderDetail /> },
      { path: 'customers',     element: <Customers /> },
      { path: 'customers/:id', element: <Customers /> },
      { path: 'website',       element: <Website /> },
      { path: 'settings',      element: <Settings /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
