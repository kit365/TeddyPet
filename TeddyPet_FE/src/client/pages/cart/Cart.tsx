import { useState } from "react";
import { ProductBanner } from "../product/sections/ProductBanner";
import { FooterSub } from "../../components/layouts/FooterSub";
import { useCartStore } from "../../../stores/useCartStore";
import { CartEmpty } from "./sections/CartEmpty";
import { Link } from "react-router-dom";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Giỏ hàng", to: "/gio-hang" },
];

export const CartPage = () => {
    const items = useCartStore((state) => state.items);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const totalAmount = useCartStore((state) => state.totalAmount());

    const [removingItems, setRemovingItems] = useState<string[]>([]);

    const handleRemove = (id: string) => {
        setRemovingItems((prev) => [...prev, id]);
        setTimeout(() => {
            removeFromCart(id);
            setRemovingItems((prev) => prev.filter((itemId) => itemId !== id));
        }, 300);
    };

    return (
        <>
            <ProductBanner
                pageTitle="Giỏ hàng"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />

            {items.length > 0 ? (
                <div className="app-container flex pb-[150px] 2xl:pb-[100px] relative">
                    <div className="w-[65%] bg-white rounded-[20px] border border-[#d7d7d7] overflow-hidden mx-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="w-full text-[2rem] font-secondary text-white bg-client-primary">
                                    <th className="w-[26%] border-r border-[#d7d7d7] py-[10px] px-[20px]">
                                        Sản phẩm
                                    </th>
                                    <th className="border-r border-[#d7d7d7] py-[10px] px-[20px]">
                                        Chi tiết
                                    </th>
                                    <th className="w-[150px] py-[10px] px-[20px]">Tổng</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item) => {
                                    const isRemoving = removingItems.includes(item.id as string);
                                    return (
                                        <tr
                                            key={`${item.id}-${item.option.id}`}
                                            className={`border-t border-[#d7d7d7] transition-opacity duration-300 ${isRemoving ? "opacity-0" : "opacity-100"
                                                }`}
                                        >
                                            <td className="w-[26%] border-r border-[#d7d7d7] py-[20px] px-[30px]">
                                                <img
                                                    className="w-[206px] h-[216px] 2xl:w-[170px] 2xl:h-[179px] object-cover rounded-[10px]"
                                                    src={item.image}
                                                    alt={item.title}
                                                />
                                            </td>

                                            <td className="border-r border-[#d7d7d7] py-[30px] px-[20px]">
                                                <div className="text-center">
                                                    <Link
                                                        to={`/product/detail/the-ten`}
                                                        className="mb-[20px] block text-[2rem] font-secondary"
                                                    >
                                                        {item.title}
                                                    </Link>

                                                    <p className="text-[#505050] mb-[20px] 2xl:mb-[15px]">
                                                        {item.option.price.toLocaleString()}đ
                                                    </p>

                                                    <p className="text-client-text mb-[20px] 2xl:mb-[15px]">
                                                        <span className="font-secondary 2xl:text-[1.4rem] text-client-secondary mr-[5px]">
                                                            Kích cỡ:
                                                        </span>
                                                        {item.option.size}
                                                    </p>

                                                    {/* Tăng giảm số lượng */}
                                                    <div className="flex items-center justify-center gap-[20px] h-[48px] 2xl:h-[48px]">
                                                        <div className="text-[#505050] flex items-center h-full">
                                                            <input
                                                                type="button"
                                                                value="-"
                                                                disabled={item.quantity <= 1}
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id as string,
                                                                        item.quantity - 1
                                                                    )
                                                                }
                                                                className={`w-[40px] h-full rounded-l-[4rem] text-[2.5rem] bg-[#e67e2033] text-center transition-[color] duration-200 ease-linear ${item.quantity <= 1
                                                                    ? "cursor-not-allowed"
                                                                    : "cursor-pointer hover:text-client-primary"
                                                                    }`}
                                                            />
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                readOnly
                                                                value={item.quantity}
                                                                className="w-[40px] h-full bg-[#e67e2033] text-[1.6rem] text-center outline-none no-spinner"
                                                            />
                                                            <input
                                                                type="button"
                                                                value="+"
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id as string,
                                                                        item.quantity + 1
                                                                    )
                                                                }
                                                                className="cursor-pointer w-[40px] h-full rounded-r-[4rem] text-[2.5rem] bg-[#e67e2033] hover:text-client-primary text-center transition-[color] duration-200 ease-linear"
                                                            />
                                                        </div>

                                                        {/* Nút xóa sản phẩm */}
                                                        <button
                                                            onClick={() => handleRemove(item.id as string)}
                                                            disabled={isRemoving}
                                                            className="h-full flex items-center justify-center px-[30px] bg-client-primary rounded-[40px] text-white font-[500] hover:bg-client-secondary transition-default cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Xóa sản phẩm
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="w-[150px] text-center">
                                                {(item.option.price * item.quantity).toLocaleString()}đ
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex-1 ml-[50px]">
                        <div className="sticky top-[0px] min-h-[100px]">
                            <div className="overflow-hidden border border-[#d7d7d7] bg-white rounded-[20px] mb-[16px]">
                                <h2 className="py-[10px] px-[20px] text-[2rem] font-secondary text-white bg-client-primary text-center">Tổng cộng</h2>
                                <div className="p-[20px] border-t border-[#d7d7d7] text-client-secondary font-[500] text-[1.5rem] flex justify-between">
                                    <span>Tổng ước tính</span>
                                    <span className="text-client-text">{totalAmount.toLocaleString()}đ</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <Link to="/thanh-toan" className="py-[16px] px-[30px] text-white font-secondary bg-client-primary inline-block rounded-[50px] transition-default cursor-pointer hover:bg-client-secondary">Tiến hành thanh toán</Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <CartEmpty />
            )}

            <FooterSub />
        </>
    );
};
