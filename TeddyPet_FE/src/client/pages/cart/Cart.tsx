import { useState, useEffect } from "react";
import { ProductBanner } from "../product/sections/ProductBanner";
import { FooterSub } from "../../components/layouts/FooterSub";
import { useCartStore } from "../../../stores/useCartStore";
import { CartEmpty } from "./sections/CartEmpty";
import { Link } from "react-router-dom";

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Giỏ hàng", to: "/cart" },
];

export const CartPage = () => {
    const items = useCartStore((state) => state.items);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const toggleCheck = useCartStore((state) => state.toggleCheck);
    const toggleAll = useCartStore((state) => state.toggleAll);
    const totalAmountChecked = useCartStore((state) => state.totalAmountChecked());
    const syncWithBackend = useCartStore((state) => state.syncWithBackend);

    useEffect(() => {
        syncWithBackend(true);
    }, [syncWithBackend]);

    const [removingItems, setRemovingItems] = useState<string[]>([]);



    const handleRemove = (id: string) => {
        setRemovingItems((prev) => [...prev, id]);
        setTimeout(() => {
            removeFromCart(id);
            setRemovingItems((prev) => prev.filter((itemId) => itemId !== id));
        }, 300);
    };

    const handleSelectAll = (checked: boolean) => {
        toggleAll(checked);
    };

    const handleSelectItem = (id: string | number) => {
        toggleCheck(id);
    };

    // Calculate totals for selected items only
    const selectedItemsData = items.filter(item => item.checked && (item.isAvailable !== false));
    const subtotal = totalAmountChecked;
    const total = subtotal;

    const allSelected = items.length > 0 && items.every(item => item.checked);

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
                                    <th className="w-[60px] border-r border-[#d7d7d7] py-[10px] px-[20px]">
                                        <div className="checkbox checkbox-cart flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                id="select-all"
                                                hidden
                                            />
                                            <label htmlFor="select-all" className="cursor-pointer m-0"></label>
                                        </div>
                                    </th>
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
                                    const isAvailable = item.isAvailable !== false; // Mặc định là true nếu chưa sync
                                    return (
                                        <tr
                                            key={`${item.id}-${item.option.id}`}
                                            className={`border-t border-[#d7d7d7] transition-all duration-300 ${isRemoving ? "opacity-0" : "opacity-100"} ${!isAvailable ? "bg-gray-50/50" : ""}`}
                                        >
                                            <td className="w-[60px] border-r border-[#d7d7d7] py-[20px] px-[20px] text-center">
                                                <div className="checkbox checkbox-cart flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.checked && isAvailable}
                                                        disabled={!isAvailable}
                                                        onChange={() => handleSelectItem(item.id)}
                                                        id={`item-${item.id}`}
                                                        hidden
                                                    />
                                                    <label
                                                        htmlFor={`item-${item.id}`}
                                                        className={`m-0 ${!isAvailable ? "cursor-not-allowed bg-gray-200 border-gray-300 opacity-50" : "cursor-pointer"}`}
                                                    ></label>
                                                </div>
                                            </td>
                                            <td className="w-[26%] border-r border-[#d7d7d7] py-[20px] px-[30px] relative">
                                                <div className="relative overflow-hidden rounded-[10px]">
                                                    <img
                                                        className={`w-[206px] h-[216px] 2xl:w-[170px] 2xl:h-[179px] object-cover transition-all duration-500 ${!isAvailable ? "grayscale opacity-60 scale-105" : ""}`}
                                                        src={item.image}
                                                        alt={item.title}
                                                    />
                                                    {!isAvailable && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                            <span className="text-white font-black text-[1.4rem] uppercase tracking-widest bg-red-600/90 py-2 px-4 rounded-full shadow-lg border border-red-400 animate-pulse">
                                                                Tạm hết hàng
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
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

                                                    <p className="text-client-text mb-[20px] 2xl:mb-[15px] flex items-center justify-center gap-4">
                                                        <span className="">
                                                            <span className="font-secondary 2xl:text-[1.4rem] text-client-secondary mr-[5px]">
                                                                Phân loại:
                                                            </span>
                                                            {item.option.size}
                                                        </span>
                                                        {item.stockQuantity !== undefined && (
                                                            <span className={`text-[1.2rem] px-3 py-1 rounded-full font-bold ${item.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                                {item.stockQuantity > 0 ? `Còn ${item.stockQuantity}` : 'Hết hàng'}
                                                            </span>
                                                        )}
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
                                                <span className="text-[2rem] font-bold text-client-secondary">
                                                    {(item.option.price * item.quantity).toLocaleString()}đ
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex-1 ml-[50px]">
                        <div className="sticky top-[0px] min-h-[100px]">
                            <div className="overflow-hidden border border-[#d7d7d7] bg-white rounded-[20px]">
                                <h2 className="py-[10px] px-[20px] text-[2rem] font-secondary text-white bg-client-primary text-center">Tóm tắt đơn hàng</h2>

                                {/* Selected Items Summary */}
                                <div className="p-[20px]">
                                    {selectedItemsData.length > 0 ? (
                                        <div className="mb-[20px]">
                                            {selectedItemsData.map((item) => (
                                                <div key={item.id} className="flex items-start gap-3 mb-[15px] pb-[15px] border-b border-[#f0f0f0] last:border-b-0">
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-[60px] h-[60px] object-cover rounded-[8px] border border-gray-200"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[1.4rem] font-medium text-client-secondary line-clamp-2 mb-[5px]">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[1.2rem] text-gray-500 mb-[3px]">
                                                            {item.option.price.toLocaleString()}đ × {item.quantity}
                                                        </p>
                                                        <p className="text-[1.2rem] text-gray-400">
                                                            Màu sắc: {item.option.size}
                                                        </p>
                                                    </div>
                                                    <div className="text-[1.4rem] font-bold text-client-secondary">
                                                        {(item.option.price * item.quantity).toLocaleString()}đ
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}

                                    {/* Subtotal */}
                                    <div className="border-t border-[#d7d7d7] pt-[15px] mb-[15px]">
                                        <div className="flex justify-between items-center text-client-text font-[400] text-[1.5rem]">
                                            <span>Tạm tính</span>
                                            <span>{subtotal.toLocaleString()}đ</span>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between items-center mb-[20px]">
                                        <span className="text-[1.8rem] font-secondary text-client-secondary">Tổng thanh toán</span>
                                        <span className="text-[2rem] font-bold text-client-primary">
                                            {total.toLocaleString()}đ
                                        </span>
                                    </div>

                                    {/* Checkout Button */}
                                    <Link
                                        to="/checkout"
                                        className={`block w-full py-[16px] px-[30px] text-white font-secondary text-center rounded-[50px] transition-default ${selectedItemsData.length > 0
                                            ? 'bg-client-primary hover:bg-client-secondary cursor-pointer'
                                            : 'bg-gray-300 cursor-not-allowed pointer-events-none'
                                            }`}
                                    >
                                        Tiến hành thanh toán
                                    </Link>

                                    {/* Note */}
                                    <p className="text-[1.2rem] text-gray-400 text-center mt-[10px]">
                                        (Nhận thanh toán sau khi lên đơn hàng)
                                    </p>
                                </div>
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
