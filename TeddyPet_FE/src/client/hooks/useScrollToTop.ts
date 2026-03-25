import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
    const { pathname } = useLocation();
    const prevPathname = useRef(pathname);

    useEffect(() => {
        // Kiểm tra xem có phải đang điều hướng giữa các trang trong Dashboard không
        const isDashboardNav = pathname.startsWith('/dashboard') && prevPathname.current.startsWith('/dashboard');

        if (isDashboardNav) {
            // Nếu đang ở Dashboard và chuyển sang trang Dashboard khác:
            // Chỉ cuộn lên đầu phần nội dung (bỏ qua banner) nếu đang cuộn quá sâu
            if (window.scrollY > 400) {
                window.scrollTo({
                    top: 400,
                    behavior: 'smooth'
                });
            }
        } else {
            // Nếu chuyển từ trang khác sang hoặc ngược lại, cuộn lên tận đầu trang
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }

        prevPathname.current = pathname;
    }, [pathname]);
};