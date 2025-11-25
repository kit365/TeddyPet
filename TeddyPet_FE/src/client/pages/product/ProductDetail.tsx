import { Link } from "react-router-dom"
import React, { useEffect, useState } from "react";
import StarIcon from "@mui/icons-material/Star";
import { Heart, UserCart, EyeSolid } from "iconoir-react";
import { ProductBanner } from "./sections/ProductBanner";
import { ProductGallery } from "./sections/ProductGallery";
import { ProductDesc } from "./sections/ProductDesc";
import { ProductComment } from "./sections/ProductComment";
import { ProductRelated } from "./sections/ProductRelated";
import { FooterSub } from "../../components/layouts/FooterSub";
import { useCartStore } from "../../../stores/useCartStore";

interface Product {
    id: number,
    title: string;
    rating: number;
    image: string;
    sku: string;
    options: {
        id: string,
        size: string,
        price: number
    }[];
}

const data: Product = {
    id: 1,
    title: "Thẻ tên thú cưng",
    rating: 5,
    image: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
    sku: "PET-005",
    options: [
        {
            id: "1",
            size: "Nhỏ",
            price: 68000
        },
        {
            id: "2",
            size: "Trung bình",
            price: 73000
        },
        {
            id: "3",
            size: "Lớn",
            price: 77000
        },
    ],
}

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Phụ kiện cho chó", to: "/phu-kien-cho-cho" },
    { label: "Thẻ tên", to: "/the-ten" },
];

export const ProductDetailPage = () => {
    const MAX_QUANTITY = 20;
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [canAddToCart, setCanAddToCart] = useState(false);

    // Thông báo thành công
    const [showToast, setShowToast] = useState(false);

    // Add to Cart
    const addToCart = useCartStore((state) => state.addToCart);

    const handleAddToCart = () => {
        if (!selectedSize || !currentOption) return;

        const uniqueId = `${data.id}-${currentOption.id}`;

        addToCart({
            id: uniqueId,
            title: data.title,
            image: data.image,
            option: {
                id: selectedSize,
                size: currentOption.size,
                price: currentOption.price,

            },
            quantity: quantity,
        });

        setShowToast(true);
    };

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // End Add to Cart

    const currentOption = data.options.find(option => option.id === selectedSize);
    const currentPrice = currentOption ? currentOption.price : null;

    const handleDecrease = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    };
    const handleIncrease = () => {
        setQuantity((prev) => (prev < MAX_QUANTITY ? prev + 1 : MAX_QUANTITY));
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(e.target.value);
        if (value < 1) value = 1;
        if (value > MAX_QUANTITY) value = MAX_QUANTITY;
        setQuantity(value);
    };
    const handleSelectSize = (id: string) => {
        setSelectedSize(id);
        setCanAddToCart(false);
        setTimeout(() => {
            setCanAddToCart(true);
        }, 500);
    };

    const handleRemoveSelectSize = () => {
        setSelectedSize(null);
        setCanAddToCart(false);
    }

    return (
        <>
            <ProductBanner
                pageTitle="Cửa hàng"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top"
            />
            <section className="relative px-[30px] bg-white">
                <div className="app-container grid grid-cols-2 gap-[60px] 2xl:gap-[40px] relative">
                    <ProductGallery />
                    <div>
                        <div>
                            <h2 className="text-[3rem] mt-[20px] font-secondary text-client-secondary">{data.title}</h2>
                            <div className="flex items-center my-[10px]">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            sx={{
                                                fontSize: "2rem !important",
                                                color: i < data.rating ? "#ffbb00 !important" : "#ccc !important",
                                            }}
                                        />
                                    ))}
                                </div>
                                <Link to={"/"} className="flex items-center text-[#505050] hover:text-client-primary transition-[color] duration-300 ease-linear">
                                    <span className="text-[2rem] mx-[20px]">|</span>
                                    <p>(1 customer review)</p>
                                </Link>
                            </div>
                            <div className="flex items-center">
                                <strong className="text-client-secondary mr-[8px]">SKU:</strong>
                                <span className="text-[#505050]">{data.sku}</span>
                            </div>
                            <div className="mt-[10px] text-client-secondary text-[2.2rem] font-secondary">
                                {currentPrice ? (
                                    <p>{currentPrice.toLocaleString("vi-VN")}đ</p>
                                ) : (
                                    <p>{data.options[0].price.toLocaleString("vi-VN")}đ - {data.options[data.options.length - 1].price.toLocaleString("vi-VN")}đ</p>
                                )}
                            </div>
                            <div className="w-full flex items-center mt-[15px] mb-[20px] px-[40px] py-[20px] rounded-[4.8rem] bg-[#FFF0F0]">
                                <span className="inline-block mr-[20px] text-[#FF6262] w-[3.5rem] aspect-square"><svg className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 66"><path d="M33,0l6.1,9.5l10.4-5.1L50,15.7l11.6,0.8l-5.2,10L66,33l-9.5,6.1l5.1,10.4L50.3,50l-0.8,11.6l-10-5.2L33,66l-6.1-9.5 l-10.4,5.1L16,50.3L4.4,49.5l5.2-10L0,33l9.5-6.1L4.4,16.5L15.7,16l0.8-11.6l10,5.2L33,0z M41.7,18c-0.5-0.3-1.2-0.1-1.5,0.4 L24,46.5c-0.3,0.5-0.1,1.2,0.4,1.5c0.5,0.3,1.2,0.1,1.5-0.4L42,19.5C42.4,19,42.2,18.3,41.7,18z M43.6,38c-1.1-1.1-2.6-1.8-4.2-1.8 c-1.6,0-3.1,0.7-4.2,1.8s-1.8,2.6-1.8,4.2c0,1.7,0.7,3.1,1.8,4.2c1.1,1.1,2.6,1.7,4.2,1.7c1.7,0,3.1-0.7,4.2-1.7 c1.1-1.1,1.8-2.6,1.8-4.2C45.3,40.5,44.7,39,43.6,38z M42,44.9c-0.7,0.7-1.6,1.1-2.7,1.1c-1,0-2-0.4-2.7-1.1s-1.1-1.7-1.1-2.7 c0-1,0.4-2,1.1-2.7c0.7-0.7,1.6-1.1,2.7-1.1c1.1,0,2,0.4,2.7,1.1c0.7,0.7,1.1,1.6,1.1,2.7S42.7,44.2,42,44.9z M30.9,19.6 c-1.1-1.1-2.6-1.8-4.2-1.8c-1.6,0-3.1,0.7-4.2,1.8c-1.1,1.1-1.7,2.6-1.7,4.2c0,1.6,0.7,3.1,1.7,4.2c1.1,1.1,2.6,1.7,4.2,1.7 c1.7,0,3.1-0.7,4.2-1.7c1.1-1.1,1.8-2.6,1.8-4.2C32.6,22.2,31.9,20.7,30.9,19.6z M29.3,26.5c-0.7,0.7-1.7,1.1-2.7,1.1 c-1,0-2-0.4-2.7-1.1c-0.7-0.7-1.1-1.6-1.1-2.7c0-1.1,0.4-2,1.1-2.7s1.6-1.1,2.7-1.1c1.1,0,2,0.4,2.7,1.1s1.1,1.7,1.1,2.7 C30.5,24.9,30,25.8,29.3,26.5z"></path></svg></span>
                                <p className="text-[#505050]">Giảm 200.000₫ cho đơn hàng từ 999.000₫, miễn phí giao hàng</p>
                            </div>
                            <div className="mb-[20px]">
                                <div className="mb-[15px] text-client-secondary flex items-center">
                                    <span className="font-secondary text-[1.8rem] ">Kích cỡ :</span>
                                    {currentOption && (
                                        <span className="text-client-secondary ml-[5px]">{currentOption.size}</span>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    {data.options.map((option) => (
                                        <div
                                            key={option.id}
                                            className={`flex flex-col items-center justify-center m-[5px] py-[8px] px-[20px] cursor-pointer capitalize rounded-[4rem] transition-default
                                                ${selectedSize === option.id ? 'bg-client-secondary text-white' : 'bg-[#fff0f0] text-client-secondary hover:bg-client-secondary hover:text-white'}`}
                                            onClick={() => handleSelectSize(option.id)}
                                        >
                                            {option.size}
                                        </div>
                                    ))}
                                </div>
                                {selectedSize && (
                                    <div onClick={handleRemoveSelectSize} className="underline font-secondary my-[10px] text-[1.3rem] cursor-pointer text-client-secondary hover:text-client-primary transition-default">Xóa</div>
                                )}
                            </div>
                            <div className="flex items-center gap-[20px] h-[55px] mb-[25px]">
                                <div className="text-[#505050] flex items-center h-full">
                                    <input
                                        type="button"
                                        value="-"
                                        className="cursor-pointer w-[45px] h-full rounded-l-[4rem] text-[3.4rem] bg-[#e67e2033] hover:text-client-primary text-center transition-[color] duration-200 ease-linear"
                                        onClick={handleDecrease}
                                    />
                                    <input
                                        type="number"
                                        value={quantity}
                                        min={1}
                                        max={MAX_QUANTITY}
                                        onChange={handleChange}
                                        className="w-[45px] h-full bg-[#e67e2033] text-[1.6rem] text-center outline-none no-spinner"
                                    />
                                    <input
                                        type="button"
                                        value="+"
                                        className="cursor-pointer w-[45px] h-full rounded-r-[4rem] text-[2.4rem] bg-[#e67e2033] hover:text-client-primary text-center transition-[color] duration-200 ease-linear"
                                        onClick={handleIncrease}
                                    />
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className={`bg-client-secondary flex-1 h-full rounded-[4rem] text-white text-[1.6rem] font-secondary transition-default ${canAddToCart ? 'opacity-100 cursor-pointer hover:bg-client-primary' : 'opacity-60 cursor-not-allowed'}`}
                                    disabled={!canAddToCart}
                                >
                                    Thêm vào giỏ hàng
                                </button>
                                <div className="w-[55px] h-full flex items-center justify-center text-client-secondary hover:text-client-primary transition-default text-[2rem] p-[10px] bg-transparent border border-[#d7d7d7] rounded-full">
                                    <Heart className="w-[2.5rem] h-[2.5rem]" />
                                </div>
                            </div>
                            <Link to={"/gio-hang"} className="text-center font-secondary h-[56px] rounded-[50px] py-[16px] block px-[30px] text-[2rem] text-white bg-client-primary hover:bg-client-secondary transition-default">Mua ngay</Link>
                            <ul className="mt-[50px]">
                                <li className="flex items-center text-[#505050] my-[15px]">
                                    <UserCart className="text-client-primary mr-[10px]" />
                                    Chỉ còn <span className="text-client-primary underline mx-[5px]"> 23 giờ 23 phút!</span> Đặt ngay để kịp nhận hàng trước  <span className="text-client-primary underline mx-[5px]">18/10</span>
                                </li>
                                <li className="flex items-center text-[#505050] my-[15px]">
                                    <EyeSolid className="text-client-primary mr-[10px]" />
                                    Có <span className="text-client-secondary mx-[5px]">24</span>người khác cũng đang xem sản phẩm này.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            <ProductDesc />
            <ProductComment />
            <ProductRelated />
            <FooterSub />
            {showToast && (
                <div
                    className={`fixed bottom-[32px] left-[18px] z-[999] p-[15px] bg-[#FCF9F8] shadow-[0_0px_5px_1px_#ffffff40] rounded-[20px] border border-[#d7d7d7] inline-flex items-center max-w-[500px] 
                        transition-all duration-300 ease-in-out
                        ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}
                    `}
                >
                    <div className="pr-[10px] w-[110px] h-[115px] rounded-[10px] overflow-hidden">
                        <img src={data.image} alt={data.title} className="w-full h-full object-cover" width={110} height={115} />
                    </div>
                    <div className="px-[10px] py-[5px] text-client-text flex-1">
                        <div>Sản phẩm</div>
                        <Link to="/san-pham/the-ten" className="text-[2rem] font-secondary mb-[6px] text-client-secondary my-[5px] inline-block">
                            {data.title}
                        </Link>
                        <p>đã được thêm vào giỏ hàng thành công!</p>
                    </div>
                </div>
            )}
        </>
    )
}