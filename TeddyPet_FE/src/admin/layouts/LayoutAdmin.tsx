import { Outlet, useMatch, useSearchParams } from "react-router-dom";
import { BlogTagDialog } from "../pages/blog/components/BlogTagDialog";
import { ProductTagDialog } from "../pages/product/components/ProductTagDialog";
import { AgeRangeListDialog } from "../pages/product/components/AgeRangeListDialog";
import { ThemeProvider } from "@mui/material/styles";
import { SideBar } from "../components/layouts/sidebar/SideBar";
import { Header } from "../components/layouts/Header";
import { adminTheme } from "../config/theme";
import '../styles/index.css';
import { useSidebar } from "../context/sidebar/useSidebar";
import { SidebarProvider } from "../context/sidebar/SidebarProvider";

const LayoutAdminContent = () => {
    const isBlogDetail = useMatch("/admin/blog/detail/:id");
    const { isOpen } = useSidebar();
    const [searchParams, setSearchParams] = useSearchParams();

    const isTagsModalOpen = searchParams.get('modal') === 'tags';
    const isProductTagsModalOpen = searchParams.get('modal') === 'product-tags';
    const isAgeRangesModalOpen = searchParams.get('modal') === 'product-age-ranges';

    const handleCloseTags = () => {
        searchParams.delete('modal');
        setSearchParams(searchParams);
    };

    return (
        <div className="flex min-h-screen bg-[#F9FAFB]">
            {/* Sidebar occupies its own space in the flex flow */}
            <SideBar />

            {/* Main content takes the remaining space */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <div className="w-full bg-[#F9FAFB]/80 backdrop-blur-md border-b border-[#919eab1f]">
                    <ThemeProvider theme={adminTheme}><Header /></ThemeProvider>
                </div>

                <ThemeProvider theme={adminTheme}>
                    <main
                        className={
                            isBlogDetail
                                ? "flex-1"
                                : "flex-1 w-full mx-auto px-[40px] pt-[8px] pb-[64px]"
                        }
                    >
                        <Outlet />
                    </main>
                </ThemeProvider>
            </div>
            <ThemeProvider theme={adminTheme}>
                {isTagsModalOpen && <BlogTagDialog open={true} onClose={handleCloseTags} />}
                {isProductTagsModalOpen && <ProductTagDialog open={true} onClose={handleCloseTags} />}
                {isAgeRangesModalOpen && <AgeRangeListDialog open={true} onClose={handleCloseTags} />}
            </ThemeProvider>
        </div>
    );
};

export const LayoutAdmin = () => {
    return (
        <SidebarProvider>
            <LayoutAdminContent />
        </SidebarProvider>
    );
};
