import { Camera, AlignJustify, ShoppingBag, User, Arcade, Heart, Star, Lock, LogOut } from "iconoir-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { logout as logoutApi } from "../../../../api/auth.api";

export const Sidebar = () => {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await logoutApi();
        } catch (error) {
            console.error(error);
        } finally {
            logout();
            navigate("/auth/login");
        }
    };

    if (!user) return null; // Should be handled by AuthGuard

    return (
        <div className="w-full h-full">
            <div className="rounded-[10px] relative shadow-[0px_8px_24px_#959da533] z-[3] h-full bg-white min-h-[600px]">
                <div className="top-[-70px] relative rounded-t-[10px] overflow-hidden">
                    <div className="px-[40px] pt-[40px] pb-[30px] bg-white text-center">
                        <div className="mx-auto w-[150px] h-[150px] shadow-[0px_7px_29px_0px_#64646f33] border-[3px] border-white rounded-full relative">
                            <img src={user.avatarUrl || "https://i.imgur.com/L8j8x7x.png"} alt="" className="w-full h-full object-cover rounded-full" />
                            <label htmlFor="profile_photo" className="hover:bg-client-primary hover:text-white cursor-pointer transition-default w-[30px] h-[30px] text-[1.2rem] bg-white flex justify-center items-center absolute bottom-[5px] right-[5px] text-[#333] border-[#dddddd] rounded-full">
                                <Camera />
                            </label>
                            <input type="file" id="profile_photo" hidden />
                        </div>
                        <h3 className="text-[2.2rem] mt-[22px] mb-[5px] font-[600] text-client-secondary uppercase leading-tight">{user.lastName} {user.firstName}</h3>
                        <p className="text-[#7d7b7b] font-[500]">{user.email}</p>
                    </div>
                    <ul className="">
                        <li className="bg-[#FFF0F0] text-[1.4rem] my-[10px] font-[500] py-[12px] px-[25px] uppercase text-client-primary border-y border-dashed border-[#dddddd]">Tổng quan</li>
                        <li>
                            <Link to={"/dashboard/overview"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname === "/dashboard/overview" ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <AlignJustify className="w-[2rem] h-[2rem]" />
                                Tổng quan
                            </Link>
                        </li>
                        <li>
                            <Link to={"/dashboard/orders"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname.startsWith("/dashboard/order") ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <ShoppingBag className="w-[2rem] h-[2rem]" />
                                Đơn hàng
                            </Link>
                        </li>
                        <li className="bg-[#FFF0F0] text-[1.4rem] my-[10px] font-[500] py-[12px] px-[25px] uppercase text-client-primary border-y border-dashed border-[#dddddd]">Cài đặt tài khoản</li>
                        <li>
                            <Link to={"/dashboard/profile"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname === "/dashboard/profile" || pathname === "/dashboard/profile/edit" ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <User className="w-[2rem] h-[2rem]" />
                                Thông tin cá nhân
                            </Link>
                        </li>
                        <li>
                            <Link to={"/dashboard/address"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname.startsWith("/dashboard/address") ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <Arcade className="w-[2rem] h-[2rem]" />
                                Địa chỉ
                            </Link>
                        </li>
                        <li>
                            <Link to={"/dashboard/wishlist"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname === "/dashboard/wishlist" ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <Heart className="w-[2rem] h-[2rem]" />
                                Yêu thích
                            </Link>
                        </li>
                        <li>
                            <Link to={"/dashboard/review"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname === "/dashboard/review" ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <Star className="w-[2rem] h-[2rem]" />
                                Đánh giá
                            </Link>
                        </li>
                        <li>
                            <Link to={"/dashboard/change-password"} className={`inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] transition-default w-full ${pathname === "/dashboard/change-password" ? "text-client-primary" : "text-[#7d7b7b] hover:text-client-primary"}`}>
                                <Lock className="w-[2rem] h-[2rem]" />
                                Đổi mật khẩu
                            </Link>
                        </li>
                        <li>
                            <Link to={"#"} onClick={handleLogout} className="inline-flex items-center gap-[10px] text-[1.5rem] py-[10px] px-[25px] text-[#7d7b7b] hover:text-client-primary transition-default w-full">
                                <LogOut className="w-[2rem] h-[2rem]" />
                                Đăng xuất
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
