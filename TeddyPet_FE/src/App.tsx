import './App.css'
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Layout } from './client/layouts/Layout';
import { LayoutAdmin } from './admin/layouts/LayoutAdmin';
import { AdminGuard } from './admin/components/guards/AdminGuard';
import { ClientAuthRoutes, ClientRoutes } from './client/routes/index';
import { AdminRoutes, AdminAuthRoutes } from './admin/routes/index';
import { useScrollToTop } from './client/hooks/useScrollToTop';
import { useAdminNotification } from './admin/hooks/useAdminNotification';
import { setNavigateToLogin, clearNavigateToLogin } from './navigationHelper';

const NotificationManager = () => {
  useAdminNotification();
  return null;
};

const NavigateToLoginInject = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigateToLogin((path: string) => navigate(path));
    return () => clearNavigateToLogin();
  }, [navigate]);
  return null;
};

const ScrollToTopWrapper = ({ children }: { children: React.ReactNode }) => {
  useScrollToTop();
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <NavigateToLoginInject />
      <ScrollToTopWrapper>
        <NotificationManager />
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
          style={{ zIndex: 10000 }}
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

          {/* Admin: auth (login) không guard; còn lại qua AdminGuard + LayoutAdmin */}
          <Route path='/admin'>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            {AdminAuthRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path='*' element={<AdminGuard />}>
              <Route element={<LayoutAdmin />}>
                {AdminRoutes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>
            </Route>
          </Route>
        </Routes>
      </ScrollToTopWrapper>
    </BrowserRouter>
  )
}

export default App