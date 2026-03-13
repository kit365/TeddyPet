import React from 'react';
import { ProductBanner } from "../../product/sections/ProductBanner";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
    pageTitle: string;
    breadcrumbs: { label: string; to: string }[];
    children: React.ReactNode;
}

export const DashboardLayout = ({ pageTitle, breadcrumbs, children }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
            <ProductBanner
                pageTitle={pageTitle}
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top !mb-0 shadow-sm"
            />

            <div className="mb-[100px] max-w-[1440px] w-full mx-auto flex gap-8 items-start relative z-10 px-4 mt-8">
                <div className="w-[25%] mt-[-120px]">
                    <Sidebar />
                </div>
                <div className="w-[75%]">
                    <div className="bg-white min-h-[450px] rounded-[1.875rem] shadow-xl shadow-slate-200/50 border border-white p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </div>

            {/* FOOTER MINI */}
            <div className="max-w-[1440px] w-full mx-auto px-8 mt-12 flex justify-between items-center text-[0.625rem] font-black text-slate-300 uppercase tracking-widest pb-10">
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
