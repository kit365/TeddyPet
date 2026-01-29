import './App.css'
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Layout } from './client/layouts/Layout';
import { LayoutAdmin } from './admin/layouts/LayoutAdmin';
import { ClientAuthRoutes, ClientRoutes } from './client/routes/index';
import { AdminRoutes, AdminAuthRoutes } from './admin/routes/index';
import { useScrollToTop } from './client/hooks/useScrollToTop';

const ScrollToTopWrapper = ({ children }: { children: React.ReactNode }) => {
  useScrollToTop();
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTopWrapper>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          {/* Client Routes */}
          <Route element={<Layout />}>
            {ClientRoutes.map((route) => (
              <Route key={route.path || 'dashboard'} path={route.path} element={route.element}>
                {route.children && route.children.map((child) => (
                  <Route key={child.path} path={child.path} element={child.element} />
                ))}
              </Route>
            ))}
          </Route>
          {ClientAuthRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {/* Admin Routes */}
          <Route path='/admin'>
            {AdminAuthRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
          <Route path='/admin' element={<LayoutAdmin />}>
            {AdminRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Routes>
      </ScrollToTopWrapper>
    </BrowserRouter>
  )
}

export default App