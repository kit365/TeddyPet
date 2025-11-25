import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './client/layouts/Layout';
import { ClientRoutes } from './client/routes/index';
import { useScrollToTop } from './client/hooks/useScrollToTop';
import { LoginPage } from './client/pages/register-login/Login';
import { AdminProviders } from './admin/mainAdmin';
import { AdminRoutes } from './admin/routes/AdminRoutes';
import { SignIn } from './admin/features/auth/sign-in';
import { AuthenticatedLayout } from './admin/components/layout/authenticated-layout';

const ScrollToTopWrapper = ({ children }: { children: React.ReactNode }) => {
  useScrollToTop();
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTopWrapper>
        <Routes>
          {/* Client Routes */}
          <Route element={<Layout />}>
            {ClientRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
          <Route path="/dang-nhap" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <div className="admin-app">
              <AdminProviders>
                <Routes>
                  <Route path="sign-in" element={<SignIn />} />
                  <Route element={<AuthenticatedLayout />}>
                    {AdminRoutes.map(({ path, element }) => (
                      <Route key={path} path={path} element={element} />
                    ))}
                  </Route>
                </Routes>
              </AdminProviders>
            </div>
          } />
        </Routes>
      </ScrollToTopWrapper>
    </BrowserRouter>
  )
}

export default App