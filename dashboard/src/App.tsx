import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Products from './pages/Products.tsx'
import ProductForm from './pages/ProductForm.tsx'
import Orders from './pages/Orders.tsx'
import OrderDetail from './pages/OrderDetail.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true,           element: <Dashboard /> },
      { path: 'products',      element: <Products /> },
      { path: 'products/new',  element: <ProductForm /> },
      { path: 'products/:id',  element: <ProductForm /> },
      { path: 'orders',        element: <Orders /> },
      { path: 'orders/:id',    element: <OrderDetail /> },
      { path: 'customers',     element: <Dashboard /> },
      { path: 'customers/:id', element: <Dashboard /> },
      { path: 'settings',      element: <Dashboard /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
