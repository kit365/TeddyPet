import { Handbag, Heart, Search, User } from "iconoir-react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { useCartStore } from "../../../stores/useCartStore";
import { useAuthStore } from "../../../stores/useAuthStore";
import { logout as logoutApi } from "../../../api/auth.api";
import { useState, useEffect } from "react";
import { getSearchSuggestions } from "../../../api/home.api";

export const MainHeader = () => {
    const totalItemsCount = useCartStore((state) => state.totalItemsChecked());
    const totalAmount = useCartStore((state) => state.totalAmountChecked());
    const items = useCartStore((state) => state.items);
    const isHydrated = useCartStore((state) => state.isHydrated);
    const cartCount = isHydrated ? totalItemsCount : 0;
    const removeFromCart = useCartStore((state) => state.removeFromCart);

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    // Search state
    const [keyword, setKeyword] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Debounce search
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (keyword.trim().length > 1) {
                try {
                    const res = await getSearchSuggestions(keyword);
                    if (res && res.data) {
                        setSuggestions(res.data);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [keyword]);

    const handleRemove = (id: string) => {
        setTimeout(() => {
            removeFromCart(id);
        }, 300);
    };

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.error(error);
        } finally {
            logout();
            navigate("/auth/login");
        }
    };

    return (
        <>
            <div className="p-[30px] bg-white border-b border-[#1029371A] z-50 relative">
                <div className="app-container flex items-center justify-between">
                    {/* Logo */}
                    <div className="w-[15%] flex justify-center">
                        <Link to="/">
                            <img src="https://i.imgur.com/V2kwkkK.png" alt="" className="w-[190px] object-cover z-10" />
                        </Link>
                    </div>

                    {/* Form Search */}
                    <div className="w-[34.2%] relative z-50">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (keyword.trim()) {
                                    navigate(`/shop?keyword=${encodeURIComponent(keyword)}`);
                                    setShowSuggestions(false);
                                }
                            }}
                            className="w-full flex"
                        >
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm kiếm sản phẩm"
                                className="w-[95.2%] bg-[#10293708] rounded-l-[4rem] h-[50px] border border-[#d7d7d7] px-[32px] py-[16px] focus:outline-none focus:border-[#102937] transition-[border] duration-300 ease-linear"
                            />
                            <div
                                onClick={() => {
                                    if (keyword.trim()) {
                                        navigate(`/shop?keyword=${encodeURIComponent(keyword)}`);
                                        setShowSuggestions(false);
                                    }
                                }}
                                className="ml-[-25px] w-[5rem] h-[5rem] rounded-full bg-client-secondary flex items-center justify-center text-white cursor-pointer hover:bg-client-primary transition-[background] duration-300 ease-linear"
                            >
                                <Search stroke="3" />
                            </div>
                        </form>

                        {/* Search Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-[60px] left-0 w-full bg-white rounded-[10px] shadow-lg border border-[#f0f0f0] p-[10px] animate-fadeIn">
                                <ul>
                                    {suggestions.map((product: any) => (
                                        <li key={product.productId} className="mb-[10px] last:mb-0">
                                            <Link
                                                to={`/product/detail/${product.slug}`}
                                                className="flex items-center gap-[15px] p-[10px] hover:bg-gray-50 rounded-[8px] transition-colors"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <img
                                                    src={product.imageUrl || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg"}
                                                    alt={product.name}
                                                    className="w-[50px] h-[50px] object-cover rounded-[5px]"
                                                />
                                                <div>
                                                    <p className="text-[1.4rem] font-secondary text-client-secondary line-clamp-1">{product.name}</p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-[30px] w-[34.2%] justify-end mr-[16px]">
                        <div className="w-[3.5rem] h-[3.5rem] p-[5px] flex items-center justify-center text-[#102937] hover:text-client-primary transition-[color] duration-300 cursor-pointer">
                            <Heart stroke="2" className="w-[2.5rem] h-[2.5rem]" />
                        </div>
                        <div className="group relative w-[3.5rem] h-[3.5rem] p-[5px] flex items-center justify-center cursor-pointer">
                            <Link to="/cart">
                                <Handbag stroke="2" className="w-[2.5rem] h-[2.5rem] text-[#102937] group-hover:text-client-primary transition-default" />
                            </Link>
                            {cartCount > 0 && (
                                <span className="absolute right-[-1px] top-[-5px] w-[18px] h-[18px] text-[1rem] bg-client-secondary text-white rounded-full flex items-center justify-center">{cartCount}</span>
                            )}
                            <div
                                className="hidden group-hover:block bg-white border border-[#d7d7d7] min-w-[350px] p-[20px] absolute top-[45px] right-[-20px] rounded-[20px] shadow-[0_-1px_8px_3px_#10293714] z-50 after:content-[''] after:block after:absolute after:w-0 after:h-0 after:border-solid after:border-[8px] after:border-transparent after:border-b-[#d7d7d7] after:right-[28px] after:top-[-16px]"
                            >
                                {items.length > 0 ? (
                                    <ul>
                                        {items.map((item) => (
                                            <li className="p-[15px] w-full relative bg-[#fff0f0] rounded-[10px] flex mb-[15px]">
                                                <div
                                                    onClick={() => handleRemove(item.id as string)}
                                                    className="absolute left-[-7px] top-[-7px] text-[1.2rem] bg-[#10293726] text-client-secondary hover:bg-client-primary hover:text-white transition-default w-[20px] h-[20px] rounded-full flex items-center justify-center">
                                                    x
                                                </div>
                                                <Link to="#" className="inline-block w-[80px] h-[80px] mr-[20px]">
                                                    <img src={item.image} width={80} height={80} alt="" className="w-full h-full object-cover rounded-[10px]" />
                                                </Link>
                                                <div>
                                                    <h3 className="text-client-secondary hover:text-client-text transition-default font-secondary text-[1.8rem] mb-[3px]">{item.title}</h3>
                                                    <div className="text-client-text text-[1.4rem] font-[400] mb-[5px]"><span className="text-client-secondary font-secondary mr-[2px]">Kích cỡ:</span> {item.option?.size}</div>
                                                    <div className="text-client-text text-[1.4rem]">{item.quantity} x {item.option?.price?.toLocaleString()}đ</div>
                                                </div>
                                            </li>
                                        ))}
                                        <div className="border-t border-[#d7d7d7] text-client-secondary font-[700] text-[1.8rem] mt-[20px] pt-[10px] flex justify-between">
                                            <strong>Tạm tính:</strong>
                                            <span>{totalAmount.toLocaleString()}đ</span>
                                        </div>
                                        <div className="mt-[20px] mb-[5px]">
                                            <Link to="/cart" className="block text-[1.4rem] font-secondary bg-client-secondary hover:bg-client-primary transition-default text-white py-[16px] px-[30px] cursor-pointer text-center rounded-[40px] mb-[10px]">Xem giỏ hàng</Link>
                                            <Link to="/checkout" className="block text-[1.4rem] font-secondary bg-client-secondary hover:bg-client-primary transition-default text-white py-[16px] px-[30px] cursor-pointer text-center rounded-[40px]">Thanh toán</Link>
                                        </div>
                                    </ul>
                                ) : (
                                    <span>Không có sản phẩm trong giỏ hàng.</span>
                                )}

                            </div>
                        </div>
                        {user ? (
                            <div className="group relative">
                                <Link to="/dashboard/profile" className="w-[3.5rem] h-[3.5rem] rounded-full overflow-hidden flex items-center justify-center border border-gray-200 hover:border-client-primary transition-default">
                                    <img
                                        src={user.avatarUrl || "https://i.imgur.com/L8j8x7x.png"}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                </Link>
                                <div className="hidden group-hover:block absolute top-[45px] right-0 min-w-[200px] bg-white rounded-[10px] shadow-lg border border-[#f0f0f0] z-50 py-[10px] animate-fadeIn">
                                    <div className="px-[20px] py-[10px] border-b border-[#f0f0f0]">
                                        <p className="font-bold text-client-secondary truncate">{user.lastName} {user.firstName}</p>
                                        <p className="text-[1.2rem] text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <Link to="/dashboard/profile" className="block px-[20px] py-[10px] text-[1.4rem] text-client-text hover:bg-gray-50 hover:text-client-primary transition-colors">
                                        Hồ sơ cá nhân
                                    </Link>
                                    <div
                                        onClick={handleLogout}
                                        className="block px-[20px] py-[10px] text-[1.4rem] text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                                    >
                                        Đăng xuất
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/auth/login" className="w-[3.5rem] h-[3.5rem] p-[5px] flex items-center justify-center text-[#102937] hover:text-client-primary transition-[color] duration-300 cursor-pointer">
                                <User stroke="2" className="w-[2.5rem] h-[2.5rem]" />
                            </Link>
                        )}
                        <Button
                            content="Liên hệ chúng tôi"
                            background="bg-client-secondary"
                            hoverBackground="group-hover:bg-client-primary"
                            svgColor="text-client-secondary"
                            hoverSvgColor="group-hover:text-client-primary"
                            textColor="text-white"
                            hoverTextColor="text-white"
                            iconColor="before:bg-white after:bg-white"
                            hoverIconColor="hover:before:bg-white hover:after:bg-white"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}