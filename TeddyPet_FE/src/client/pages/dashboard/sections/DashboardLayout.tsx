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

            <div className="mb-[100px] w-[1600px] mx-auto flex gap-8 items-start relative z-10 px-4">
                <div className="w-[25%] px-[12px] mt-[-80px]">
                    <Sidebar />
                </div>
                <div className="w-[75%] px-[12px]">
                    <div className="bg-white min-h-[600px] rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </div>

            {/* FOOTER MINI */}
            <div className="w-[1600px] mx-auto px-[12px] mt-12 flex justify-between items-center text-[1rem] font-black text-slate-300 uppercase tracking-widest">
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
