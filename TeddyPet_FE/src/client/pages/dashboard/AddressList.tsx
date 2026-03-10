import { MapPin, Phone, User as UserIcon } from "iconoir-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllAddresses, deleteAddress, setDefaultAddress } from "../../../api/address.api";
import { UserAddressResponse } from "../../../types/address.type";
import { toast } from "react-toastify";
import { useAuthStore } from "../../../stores/useAuthStore";
import { DashboardLayout } from "./sections/DashboardLayout";
import { Plus } from "lucide-react";

export const AddressListPage = () => {
    const { user } = useAuthStore();
    const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Danh sách địa chỉ", to: `/dashboard/address` },
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
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-client-primary animate-pulse">
                        <UserIcon width={48} height={48} />
                    </div>
                    <div className="text-center">
                        <p className="text-[2rem] font-black text-slate-800 tracking-tight">Vui lòng đăng nhập</p>
                        <p className="text-slate-400 mt-2 font-medium">Bạn cần đăng nhập để xem thông tin tài khoản.</p>
                    </div>
                    <Link to="/auth/login" className="bg-client-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-red-100">
                        Đăng nhập ngay
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout pageTitle="Danh sách địa chỉ" breadcrumbs={breadcrumbs}>
            <div className="flex justify-between items-end border-b border-slate-100 pb-8 mb-10">
                <div>
                    <h3 className="text-[2.8rem] font-black text-slate-800 tracking-tight italic flex items-center gap-3">
                        Sổ địa chỉ
                    </h3>
                    <p className="text-[1.2rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">Nơi nhận yêu thương từ TeddyPet</p>
                </div>
                <Link to="/dashboard/address/create" className="flex items-center gap-2 bg-client-primary text-white px-8 py-3.5 rounded-2xl font-black text-[1.1rem] uppercase tracking-widest hover:bg-client-secondary transition-all shadow-xl shadow-client-primary/20">
                    <Plus size={18} /> Thêm địa chỉ mới
                </Link>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-100 border-t-client-primary rounded-full animate-spin"></div>
                    <p className="text-[1.6rem] font-bold text-slate-300">Đang tải danh sách...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-8">
                    {addresses.map((item) => (
                        <div key={item.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-client-primary/5 hover:-translate-y-1">
                            {item.isDefault && (
                                <div className="absolute top-6 right-6 bg-emerald-50 text-emerald-600 text-[1.1rem] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100">
                                    Mặc định
                                </div>
                            )}
                            <div className="flex gap-6">
                                <div className="mt-1">
                                    <input
                                        type="radio"
                                        name="address_selection"
                                        className="appearance-none w-6 h-6 border-2 border-slate-200 rounded-full checked:border-client-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                                        checked={item.isDefault}
                                        onChange={() => handleSetDefault(item.id)}
                                    />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-3 text-[1.8rem] text-slate-800 font-bold">
                                            <UserIcon className="w-6 h-6 text-client-primary" />
                                            {item.fullName}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-[1.5rem] text-slate-500 font-medium font-sans">
                                        <Phone className="w-6 h-6 text-slate-300" />
                                        {item.phone}
                                    </div>
                                    <div className="flex items-start gap-3 text-[1.5rem] text-slate-500 font-medium leading-relaxed font-sans">
                                        <MapPin className="w-6 h-6 text-slate-300 mt-1 shrink-0" />
                                        <span>{item.address}</span>
                                    </div>

                                    <div className="pt-4 flex items-center gap-6 border-t border-slate-50">
                                        <Link to={`/dashboard/address/edit/${item.id}`} className="text-[1.2rem] font-black text-client-primary uppercase tracking-widest hover:text-client-secondary transition-colors">Chỉnh sửa</Link>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-[1.2rem] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
                                        >
                                            Xóa bỏ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {addresses.length === 0 && !loading && (
                        <div className="col-span-2 py-20 flex flex-col items-center gap-6 opacity-40">
                            <MapPin className="w-24 h-24 text-slate-300" />
                            <p className="text-[1.8rem] font-bold text-slate-400">Bạn chưa có địa chỉ nào lưu lại.</p>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
};
