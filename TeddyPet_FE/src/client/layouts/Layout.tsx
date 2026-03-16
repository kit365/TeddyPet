import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { Header } from "../components/layouts/Header";
import { ScrollToTopButton } from "../components/layouts/ScrollToTopButton";
import { clientTheme } from "../config/theme";
import "../styles/index.css";

export const Layout = () => {
    return (
        <ThemeProvider theme={clientTheme}>
            <div className="min-h-screen flex flex-col">
                <Header />
                <Outlet />
                <ScrollToTopButton />
            </div>
        </ThemeProvider>
    );
};
