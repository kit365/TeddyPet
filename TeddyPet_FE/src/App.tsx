import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './client/layouts/Layout';
import { LayoutAdmin } from './admin/layouts/LayoutAdmin';
import { ClientRoutes } from './client/routes/index';
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
        <Routes>
          {/* Client Routes */}
          <Route element={<Layout />}>
            {ClientRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>

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