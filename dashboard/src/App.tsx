import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
