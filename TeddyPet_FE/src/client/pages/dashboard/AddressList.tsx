import { User as UserIcon } from "iconoir-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllAddresses, deleteAddress, setDefaultAddress } from "../../../api/address.api";
import { UserAddressResponse } from "../../../types/address.type";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { DashboardLayout } from "./sections/DashboardLayout";
import { Plus, MapPin as MapPinIcon, BadgeCheck, Phone as PhoneIcon, User, MoreVertical } from "lucide-react";
import { useState as useStateImport } from "react";

// ListGroup Components
const ListGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        {children}
    </div>
);

interface ListGroupItemProps {
    children: React.ReactNode;
    border?: boolean;
}

const ListGroupItem = ({ children, border = false }: ListGroupItemProps) => (
    <div className={`px-4 py-3 ${border ? "border-b border-slate-100" : ""}`}>
        {children}
    </div>
);

export const AddressListPage = () => {
    const { user } = useAuthStore();
    const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Sổ địa chỉ", to: `/dashboard/address` },
    ];

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await getAllAddresses();
            setAddresses(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể tải danh sách địa chỉ");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;

        try {
            await deleteAddress(id);
            toast.success("Xóa địa chỉ thành công");

            const savedAddr = localStorage.getItem("delivery_address");
            const addrToDelete = addresses.find(a => a.id === id);
            if (addrToDelete && savedAddr === addrToDelete.address) {
                localStorage.removeItem("delivery_address");
                localStorage.removeItem("delivery_coords");
            }

            fetchAddresses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể xóa địa chỉ");
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await setDefaultAddress(id);
            toast.success("Đặt địa chỉ mặc định thành công");

            const newDefault = addresses.find(a => a.id === id);
            if (newDefault) {
                localStorage.setItem("delivery_address", newDefault.address);
                if (newDefault.latitude && newDefault.longitude) {
                    localStorage.setItem("delivery_coords", JSON.stringify({
                        lat: newDefault.latitude,
                        lon: newDefault.longitude
                    }));
                }
            }

            fetchAddresses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể đặt địa chỉ mặc định");
        }
    };

    if (!user) {
        return (
            <DashboardLayout pageTitle="Tài khoản" breadcrumbs={breadcrumbs}>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                    <div className="w-[7.5rem] h-[7.5rem] bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300">
                        <User size={52} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-[1.35rem] font-bold text-slate-800 tracking-tight leading-snug">Vui lòng đăng nhập</p>
                        <p className="text-[1rem] text-slate-500 mt-[0.5rem] font-medium">Bạn cần đăng nhập để xem và quản lý sổ địa chỉ giao hàng.</p>
                    </div>
                    <Link to="/auth/login" className="bg-client-primary text-white px-[2rem] py-[0.85rem] rounded-[1rem] font-semibold text-[0.95rem] uppercase tracking-[0.05em] hover:bg-client-secondary transition-all duration-300 shadow-md shadow-client-primary/25 active:scale-95">
                        Đăng nhập ngay
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout pageTitle="Sổ địa chỉ" breadcrumbs={breadcrumbs}>
            <div className="max-w-[56rem]">
                {/* HEADER */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <h1 className="text-[1.5rem] font-bold text-slate-800">Sổ địa chỉ</h1>
                    <Link 
                        to="/dashboard/address/create" 
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-client-primary text-white rounded-xl font-bold text-sm hover:bg-client-secondary hover:shadow-md transition-all shadow-sm"
                    >
                        <Plus size={14} />
                        Thêm mới
                    </Link>
                </div>

                {/* LOADING STATE */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="h-[5.5rem] rounded-[1.5rem] bg-slate-100 animate-pulse border border-slate-200" />
                        ))}
                    </div>
                ) : addresses.length === 0 ? (
                    <ListGroup>
                        <ListGroupItem>
                            <div className="flex flex-col items-center justify-center gap-4 py-10">
                                <MapPinIcon size={40} className="text-slate-300" />
                                <p className="text-slate-500 font-medium text-center">Bạn chưa lưu địa chỉ nào</p>
                            </div>
                        </ListGroupItem>
                    </ListGroup>
                ) : (
                    <div className="space-y-3 relative">
                        {addresses.map((item) => (
                            <ListGroup key={item.id}>
                                <ListGroupItem>
                                    <div className="flex items-start justify-between gap-4">
                                        {/* LEFT: Name + Phone + Address */}
                                        <div className="flex-1 min-w-0">
                                            {/* Name Row */}
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <UserIcon width={16} height={16} className="text-client-primary shrink-0" />
                                                <span className="font-bold text-slate-800 text-sm truncate">{item.fullName}</span>
                                                {item.isDefault && (
                                                    <div className="px-2 py-1 bg-emerald-100 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0">
                                                        <BadgeCheck size={12} className="text-emerald-600" />
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Mặc định</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Phone Row */}
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <PhoneIcon width={14} height={14} className="text-slate-400 shrink-0" />
                                                <span className="text-sm font-medium text-slate-700">{item.phone}</span>
                                            </div>

                                            {/* Address Row */}
                                            <div className="flex gap-2.5">
                                                <MapPinIcon width={14} height={14} className="text-slate-400 shrink-0 mt-0.5" />
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-2 flex-1">{item.address}</p>
                                            </div>
                                        </div>

                                        {/* RIGHT: Actions Menu */}
                                        <div className={`relative shrink-0 ${openMenuId === item.id ? 'z-[300]' : 'z-10'}`}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${openMenuId === item.id ? 'bg-white text-slate-700 shadow-md ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openMenuId === item.id && (
                                                <div className="absolute right-0 top-0 z-[310] min-w-[168px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                                    <div className="h-11 bg-white"></div>
                                                    {!item.isDefault && (
                                                        <button
                                                            onClick={() => {
                                                                handleSetDefault(item.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            Đặt mặc định
                                                        </button>
                                                    )}
                                                    <Link 
                                                        to={`/dashboard/address/edit/${item.id}`}
                                                        onClick={() => setOpenMenuId(null)}
                                                        className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Chỉnh sửa
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            handleDelete(item.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ListGroupItem>
                            </ListGroup>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
