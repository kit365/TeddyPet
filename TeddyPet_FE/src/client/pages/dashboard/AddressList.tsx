import { MapPin, Phone, User } from "iconoir-react";
import { ProductBanner } from "../product/sections/ProductBanner";
import { Link } from "react-router-dom";
import { Sidebar } from "./sections/Sidebar";
import { useEffect, useState } from "react";
import { getAllAddresses, deleteAddress, setDefaultAddress } from "../../../api/address.api";
import { UserAddressResponse } from "../../../types/address.type";
import { toast } from "react-toastify";

export const AddressListPage = () => {
    const user = { name: "Demo User" }; // Fixed data for portability
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
            fetchAddresses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể xóa địa chỉ");
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await setDefaultAddress(id);
            toast.success("Đặt địa chỉ mặc định thành công");
            fetchAddresses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể đặt địa chỉ mặc định");
        }
    };

    if (!user) {
        return (
            <>
                <ProductBanner
                    pageTitle="Tài khoản"
                    breadcrumbs={breadcrumbs}
                    url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                    className="bg-top"
                />
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 bg-[#f9f9f9]">
                    <p className="text-[1.8rem] text-client-secondary">Vui lòng đăng nhập để xem thông tin tài khoản.</p>
                    <a href="/auth/login" className="bg-client-secondary text-white px-8 py-3 rounded-full text-[1.6rem] hover:bg-client-primary transition-all">Đăng nhập ngay</a>
                </div>
            </>
        );
    }

    return (
        <>
            <ProductBanner
                pageTitle="Danh sách địa chỉ"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top"
            />

            <div className="mt-[-150px] mb-[100px] w-[1600px] mx-auto flex items-stretch">
                <div className="w-[25%] px-[12px] flex">
                    <Sidebar />
                </div>
                <div className="w-[75%] px-[12px]">
                    <div className="mt-[100px] p-[35px] bg-white shadow-[0px_8px_24px_#959da533] rounded-[12px]">
                        <h3 className="text-[2.4rem] font-[600] text-client-secondary flex items-center justify-between mb-[10px]">
                            Danh sách địa chỉ
                            <Link className="relative overflow-hidden group bg-client-primary rounded-[8px] px-[25px] py-[12px] font-[500] text-[1.4rem] text-white flex items-center gap-[8px]" to={"/dashboard/address/create"}>
                                <span className="relative z-10">Thêm địa chỉ</span>
                                <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                            </Link>
                        </h3>

                        {loading ? (
                            <div className="text-center py-[50px] text-client-text">Đang tải...</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-[30px] mt-[30px]">
                                {addresses.map((item) => (
                                    <div key={item.id} className="group cursor-pointer">
                                        <div className={`relative border rounded-[16px] p-[30px] transition-all duration-300 bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border-[#eee] group-hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] group-hover:border-client-primary/30 group-hover:-translate-y-1`}>
                                            {item.isDefault && (
                                                <div className="absolute top-[20px] right-[20px] bg-client-primary/10 text-client-primary text-[1.2rem] font-[600] px-[12px] py-[4px] rounded-full">
                                                    Mặc định
                                                </div>
                                            )}
                                            <div className="flex gap-[20px]">
                                                <div className="mt-[6px]">
                                                    <input
                                                        type="radio"
                                                        name="address_selection"
                                                        className="appearance-none w-[20px] h-[20px] border-[2px] border-[#ddd] rounded-full checked:border-client-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                                                        checked={item.isDefault}
                                                        onChange={() => handleSetDefault(item.id)}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-[15px]">
                                                    <div className="flex items-center gap-[12px] text-[1.6rem] text-client-secondary font-[700]">
                                                        <User className="w-[2rem] h-[2rem] text-client-primary" />
                                                        {item.fullName}
                                                    </div>
                                                    <div className="flex items-center gap-[12px] text-[1.5rem] text-[#555]">
                                                        <Phone className="w-[2rem] h-[2rem] text-gray-400" />
                                                        {item.phone}
                                                    </div>
                                                    <div className="flex items-start gap-[12px] text-[1.5rem] text-[#555] leading-relaxed">
                                                        <MapPin className="w-[2rem] h-[2rem] text-gray-400 mt-[2px]" />
                                                        <span className="flex-1">{item.address}</span>
                                                    </div>

                                                    <div className="pt-[10px] flex items-center gap-[15px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link to={`/dashboard/address/edit/${item.id}`} className="text-[1.4rem] font-[600] text-client-primary hover:underline">Chỉnh sửa</Link>
                                                        <div className="w-[1px] h-[12px] bg-gray-300"></div>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-[1.4rem] font-[600] text-red-500 hover:underline"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
