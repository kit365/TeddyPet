import React from 'react';
import { ProductBanner } from "../../product/sections/ProductBanner";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
    pageTitle: string;
    breadcrumbs: { label: string; to: string }[];
    children: React.ReactNode;
    isEditingProfile?: boolean;
}

export const DashboardLayout = ({ pageTitle, breadcrumbs, children, isEditingProfile }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] font-['Be_Vietnam_Pro',sans-serif] text-slate-800 pb-20">
            <ProductBanner
                pageTitle={pageTitle}
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top !mb-0 shadow-sm"
            />

            <div className="mb-[60px] max-w-[1400px] w-full mx-auto flex gap-8 items-start relative z-10 px-6 mt-[-110px]">
                <div className="w-[280px] shrink-0">
                    <Sidebar isEditingProfile={isEditingProfile} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="bg-white min-h-[500px] rounded-[1.5rem] shadow-xl shadow-slate-300/10 border border-white p-6 sm:p-7 md:p-9 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </div>

            {/* FOOTER MINI */}
            <div className="max-w-[1240px] w-full mx-auto px-6 mt-12 flex justify-between items-center text-[0.625rem] font-black text-slate-300 uppercase tracking-widest pb-10">
                <p>© 2026 TeddyPet - Chăm sóc bằng cả trái tim</p>
                <div className="flex gap-8">
                    <a href="#" className="hover:text-indigo-600 transition-colors">Điều khoản</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Bảo mật</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Hotline: 1900 1234</a>
                </div>
            </div>
        </div>
    );
};
