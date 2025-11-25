import { Outlet } from "react-router-dom";
import { Header } from "../components/layouts/Header";
import { ScrollToTopButton } from "../components/layouts/ScrollToTopButton";
import { useEffect } from "react";

export const Layout = () => {
    useEffect(() => {
        document.documentElement.classList.add('client-mode');
        return () => {
            document.documentElement.classList.remove('client-mode');
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <Outlet />
            <ScrollToTopButton />
        </div>
    );
};
