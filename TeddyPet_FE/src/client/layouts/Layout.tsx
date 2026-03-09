import { Outlet } from "react-router-dom";
import { Header } from "../components/layouts/Header";
import { ScrollToTopButton } from "../components/layouts/ScrollToTopButton";
import "../styles/index.css";
import { useAdminNotification } from "../../admin/hooks/useAdminNotification";

export const Layout = () => {
    useAdminNotification();
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <Outlet />
            <ScrollToTopButton />
        </div>
    );
};
