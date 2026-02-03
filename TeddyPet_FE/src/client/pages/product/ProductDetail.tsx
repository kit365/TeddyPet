import { Link, useParams, useNavigate } from "react-router-dom"
import React, { useEffect, useState, useMemo } from "react";
import StarIcon from "@mui/icons-material/Star";
import { Heart, UserCart, EyeSolid } from "iconoir-react";
import { toast } from "react-toastify";
import { ProductBanner } from "./sections/ProductBanner";
import { ProductGallery } from "./sections/ProductGallery";
import { ProductDesc } from "./sections/ProductDesc";
import { ProductComment } from "./sections/ProductComment";
import { ProductRelated } from "./sections/ProductRelated";
import { FooterSub } from "../../components/layouts/FooterSub";
import { useCartStore } from "../../../stores/useCartStore";
import { CartItem } from "../../../types/cart.type";
import { getProductBySlug } from "../../../api/product.api";
import { APIProduct, APIProductVariant, APIProductAttributeValue } from "../../../types/products.type";

export const ProductDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // State
    const [product, setProduct] = useState<APIProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({}); // attributeId -> valueId
    const [quantity, setQuantity] = useState(1);

    // Derived State
    const [selectedVariant, setSelectedVariant] = useState<APIProductVariant | null>(null);
    const [canAddToCart, setCanAddToCart] = useState(false);
    const [outOfStock, setOutOfStock] = useState(false);

    // Toast
    const [showToast, setShowToast] = useState(false);

    // Cart Store
    const addToCart = useCartStore((state) => state.addToCart);
    const cartItems = useCartStore((state) => state.items);

    // Fetch Product
    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const res = await getProductBySlug(slug);
                if (res && res.data) {
                    setProduct(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch product", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    // Calculate Unique Attribute Values for Rendering Options
    const attributeValueMap = useMemo(() => {
        if (!product) return {};
        const map: { [key: number]: APIProductAttributeValue } = {};
        product.variants.forEach(v => {
            v.attributes.forEach(a => {
                map[a.valueId] = a;
            });
        });
        return map;
    }, [product]);

    // Find Selected Variant when Options Change
    useEffect(() => {
        setOutOfStock(false);
        if (!product) return;

        // Case 1: Simple Product (No attributes)
        if (product.attributes.length === 0) {
            // Usually simple products have 1 variant. Select it automatically.
            const variant = product.variants[0];
            if (variant) {
                setSelectedVariant(variant);
                if (variant.stockQuantity > 0) {
                    setCanAddToCart(true);
                    setOutOfStock(false);
                } else {
                    setCanAddToCart(false);
                    setOutOfStock(true);
                }
            } else {
                // No variant found even for simple product
                setSelectedVariant(null);
                setCanAddToCart(false);
                setOutOfStock(true);
            }
            return;
        }

        // Case 2: Variable Product (Has attributes)
        if (Object.keys(selectedOptions).length === 0) {
            setSelectedVariant(null);
            setCanAddToCart(false);
            return;
        }

        // Check if all attributes are selected
        const allAttributesSelected = product.attributes.every(attr => selectedOptions[attr.attributeId]);
        if (!allAttributesSelected) {
            setSelectedVariant(null);
            setCanAddToCart(false);
            return;
        }

        // Find matching variant
        const variant = product.variants.find(v => {
            return v.attributes.every(attr => selectedOptions[attr.attributeId] === attr.valueId);
        });

        if (variant) {
            setSelectedVariant(variant);
            if (variant.stockQuantity > 0) {
                setCanAddToCart(true);
                setOutOfStock(false);
            } else {
                setCanAddToCart(false);
                setOutOfStock(true);
            }
        } else {
            setSelectedVariant(null);
            setCanAddToCart(false);
            setOutOfStock(true);
        }

    }, [selectedOptions, product]);

    // Ensure quantity doesn't exceed new max when variant changes
    useEffect(() => {
        if (outOfStock) {
            setQuantity(0);
        } else if (selectedVariant && quantity > selectedVariant.stockQuantity) {
            setQuantity(Math.max(1, selectedVariant.stockQuantity));
        } else if (quantity === 0 && !outOfStock) {
            setQuantity(1);
        }
    }, [selectedVariant, quantity, outOfStock]);

    // Toast Timer
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // Handlers
    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;

        const existingCartItem = cartItems.find(item => item.id === selectedVariant.variantId);
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;

        if (currentCartQuantity + quantity > selectedVariant.stockQuantity) {
            toast.error(`Bạn đã có ${currentCartQuantity} sản phẩm trong giỏ hàng. Số lượng tồn kho chỉ còn ${selectedVariant.stockQuantity}. Không thể thêm quá số lượng này.`);
            return;
        }

        const cartItem: CartItem = {
            id: selectedVariant.variantId, // Use variantId as unique ID
            title: product.name,
            image: selectedVariant.featuredImageUrl || product.images[0]?.imageUrl || "",
            option: {
                id: String(selectedVariant.variantId),
                size: selectedVariant.attributes.map(a => a.value).join(" / "), // Summary of options
                price: selectedVariant.salePrice || selectedVariant.price,
                originalPrice: selectedVariant.salePrice ? selectedVariant.price : undefined,
            },
            quantity: quantity,
        };

        addToCart(cartItem);
        setShowToast(true);
    };

    const handleSelectOption = (attributeId: number, valueId: number) => {
        setSelectedOptions(prev => ({
            ...prev,
            [attributeId]: valueId
        }));
    };

    const existingCartItem = selectedVariant ? cartItems.find(item => item.id === selectedVariant.variantId) : null;
    const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;

    // Max quantity user can add now = Stock - InCart
    const availableStock = selectedVariant ? Math.max(0, selectedVariant.stockQuantity - currentCartQuantity) : 0;
    const currentMaxQuantity = outOfStock ? 0 : availableStock;

    const handleDecrease = () => {
        if (outOfStock) return;
        setQuantity(prev => Math.max(1, prev - 1));
    };
    const handleIncrease = () => {
        if (outOfStock || quantity >= currentMaxQuantity) return;
        setQuantity(prev => Math.min(currentMaxQuantity, prev + 1));
    };
    const handleChangeQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (outOfStock) return;
        const val = parseInt(e.target.value) || 1;
        setQuantity(Math.max(1, Math.min(currentMaxQuantity, val)));
    };

    // Breadcrumbs
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Cửa hàng", to: "/shop" },
        { label: product?.name || "Chi tiết", to: `/product/detail/${slug}` },
    ];

    // --- RENDER ---
    if (loading) return <div className="p-10 text-center text-2xl">Đang tải sản phẩm...</div>;
    if (!product) return <div className="p-10 text-center text-2xl">Không tìm thấy sản phẩm.</div>;

    // Price Display
    const allAttributesSelected = product.attributes.every(attr => selectedOptions[attr.attributeId]);

    let priceElement: React.ReactNode;

    if (selectedVariant) {
        if (selectedVariant.stockQuantity <= 0) {
            priceElement = <p className="text-[#FF6262] font-bold">Tạm hết hàng</p>;
        } else if (selectedVariant.salePrice) {
            priceElement = (
                <div className="flex items-center gap-3">
                    <p className="text-[#FF6262] font-bold">{selectedVariant.salePrice.toLocaleString("vi-VN")}đ</p>
                    <p className="text-[#999] line-through text-[1.6rem]">{selectedVariant.price.toLocaleString("vi-VN")}đ</p>
                </div>
            );
        } else {
            priceElement = <p>{selectedVariant.price.toLocaleString("vi-VN")}đ</p>;
        }
    } else if (allAttributesSelected && !selectedVariant) {
        priceElement = <p className="text-red-500 font-bold">Tạm hết hàng</p>;
    } else {
        if (product.minPrice === product.maxPrice) {
            priceElement = <p>{product.minPrice?.toLocaleString("vi-VN")}đ</p>;
        } else {
            priceElement = <p>{product.minPrice?.toLocaleString("vi-VN")}đ - {product.maxPrice?.toLocaleString("vi-VN")}đ</p>;
        }
    }

    const mainImage = selectedVariant?.featuredImageUrl || product.images?.[0]?.imageUrl || "https://placeholder.com/600";

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
                    <ProductGallery
                        images={product.images || []}
                        selectedImage={selectedVariant?.featuredImageUrl}
                    />

                    <div>
                        <div>
                            <h2 className="text-[3rem] mt-[20px] font-secondary text-client-secondary">{product.name}</h2>
                            <div className="flex items-center my-[10px]">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            sx={{
                                                fontSize: "2rem !important",
                                                color: i < (product.averageRating || 5) ? "#ffbb00 !important" : "#ccc !important",
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center text-[#505050]">
                                    <span className="text-[2rem] mx-[20px]">|</span>
                                    <p>({product.ratingCount || 0} customer review)</p>
                                </div>
                            </div>
                            {/* <div className="flex items-center">
                                <strong className="text-client-secondary mr-[8px]">SKU:</strong>
                                <span className="text-[#505050]">{selectedVariant?.productSlug || product.sku || "N/A"}</span>
                            </div> */}
                            <div className="mt-[10px] text-client-secondary text-[2.2rem] font-secondary">
                                {priceElement}
                            </div>

                            <div className="w-full flex items-center mt-[15px] mb-[20px] px-[40px] py-[20px] rounded-[4.8rem] bg-[#FFF0F0]">
                                <span className="inline-block mr-[20px] text-[#FF6262] w-[3.5rem] aspect-square">
                                    <svg className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 66"><path d="M33,0l6.1,9.5l10.4-5.1L50,15.7l11.6,0.8l-5.2,10L66,33l-9.5,6.1l5.1,10.4L50.3,50l-0.8,11.6l-10-5.2L33,66l-6.1-9.5 l-10.4,5.1L16,50.3L4.4,49.5l5.2-10L0,33l9.5-6.1L4.4,16.5L15.7,16l0.8-11.6l10,5.2L33,0z M41.7,18c-0.5-0.3-1.2-0.1-1.5,0.4 L24,46.5c-0.3,0.5-0.1,1.2,0.4,1.5c0.5,0.3,1.2,0.1,1.5-0.4L42,19.5C42.4,19,42.2,18.3,41.7,18z M43.6,38c-1.1-1.1-2.6-1.8-4.2-1.8 c-1.6,0-3.1,0.7-4.2,1.8s-1.8,2.6-1.8,4.2c0,1.7,0.7,3.1,1.8,4.2c1.1,1.1,2.6,1.7,4.2,1.7c1.7,0,3.1-0.7,4.2-1.7 c1.1-1.1,1.8-2.6,1.8-4.2C45.3,40.5,44.7,39,43.6,38z M42,44.9c-0.7,0.7-1.6,1.1-2.7,1.1c-1,0-2-0.4-2.7-1.1s-1.1-1.7-1.1-2.7 c0-1,0.4-2,1.1-2.7c0.7-0.7,1.6-1.1,2.7-1.1c1.1,0,2,0.4,2.7,1.1c0.7,0.7,1.1,1.6,1.1,2.7S42.7,44.2,42,44.9z M30.9,19.6 c-1.1-1.1-2.6-1.8-4.2-1.8c-1.6,0-3.1,0.7-4.2,1.8c-1.1,1.1-1.7,2.6-1.7,4.2c0,1.6,0.7,3.1,1.7,4.2c1.1,1.1,2.6,1.7,4.2,1.7 c1.7,0,3.1-0.7,4.2-1.7c1.1-1.1,1.8-2.6,1.8-4.2C32.6,22.2,31.9,20.7,30.9,19.6z M29.3,26.5c-0.7,0.7-1.7,1.1-2.7,1.1 c-1,0-2-0.4-2.7-1.1c-0.7-0.7-1.1-1.6-1.1-2.7c0-1.1,0.4-2,1.1-2.7s1.6-1.1,2.7-1.1c1.1,0,2,0.4,2.7,1.1s1.1,1.7,1.1,2.7 C30.5,24.9,30,25.8,29.3,26.5z"></path></svg>
                                </span>
                                <p className="text-[#505050]">Giảm 200.000₫ cho đơn hàng từ 999.000₫, miễn phí giao hàng</p>
                            </div>

                            {/* Attributes / Options */}
                            <div className="mb-[20px]">
                                {product.attributes.map((attr) => (
                                    <div key={attr.attributeId} className="mb-[15px]">
                                        <div className="mb-[10px] text-client-secondary flex items-center">
                                            <span className="font-secondary text-[1.8rem] ">{attr.name} :</span>
                                            {selectedOptions[attr.attributeId] && (
                                                <span className="text-client-secondary ml-[5px]">
                                                    {attributeValueMap[selectedOptions[attr.attributeId]]?.value}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center flex-wrap">
                                            {attr.valueIds.map((valId) => {
                                                const val = attributeValueMap[valId];
                                                if (!val) return null;
                                                const isSelected = selectedOptions[attr.attributeId] === valId;
                                                return (
                                                    <div
                                                        key={valId}
                                                        onClick={() => handleSelectOption(attr.attributeId, valId)}
                                                        className={`flex flex-col items-center justify-center m-[5px] py-[8px] px-[20px] cursor-pointer capitalize rounded-[4rem] transition-default border
                                                            ${isSelected
                                                                ? 'bg-client-secondary text-white border-client-secondary'
                                                                : 'bg-[#fff0f0] text-client-secondary border-transparent hover:bg-client-secondary hover:text-white'}`}
                                                    >
                                                        {val.value}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {Object.keys(selectedOptions).length > 0 && (
                                    <div
                                        onClick={() => { setSelectedOptions({}); setCanAddToCart(false); }}
                                        className="underline font-secondary my-[10px] text-[1.3rem] cursor-pointer text-client-secondary hover:text-client-primary transition-default text-right"
                                    >
                                        Xóa lựa chọn
                                    </div>
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
                                        max={currentMaxQuantity}
                                        onChange={handleChangeQuantity}
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
                                    className={`bg-client-secondary flex-1 h-full rounded-[4rem] text-white text-[1.6rem] font-secondary transition-default flex items-center justify-center
                                        ${canAddToCart ? 'opacity-100 cursor-pointer hover:bg-client-primary' : 'opacity-60 cursor-not-allowed'}`}
                                    disabled={!canAddToCart}
                                >
                                    {outOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
                                </button>
                                <div className="w-[55px] h-full flex items-center justify-center text-client-secondary hover:text-client-primary transition-default text-[2rem] p-[10px] bg-transparent border border-[#d7d7d7] rounded-full">
                                    <Heart className="w-[2.5rem] h-[2.5rem]" />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!canAddToCart || !selectedVariant) {
                                        toast.error("Vui lòng chọn đầy đủ các tùy chọn sản phẩm!");
                                        return;
                                    }
                                    const buyNowItem: CartItem = {
                                        id: selectedVariant.variantId,
                                        title: product.name,
                                        image: selectedVariant.featuredImageUrl || product.images[0]?.imageUrl || "",
                                        option: {
                                            id: String(selectedVariant.variantId),
                                            size: selectedVariant.attributes.map(a => a.value).join(" / "),
                                            price: selectedVariant.salePrice || selectedVariant.price,
                                            originalPrice: selectedVariant.salePrice ? selectedVariant.price : undefined,
                                        },
                                        quantity: quantity,
                                    };
                                    // Add to cart first so it appears in the persistent cart
                                    addToCart(buyNowItem);
                                    useCartStore.getState().setBuyNowItem(buyNowItem);
                                    navigate("/checkout");
                                }}
                                disabled={!canAddToCart}
                                className={`w-full text-center font-secondary h-[56px] rounded-[50px] py-[16px] block px-[30px] text-[2rem] text-white transition-default ${canAddToCart ? 'bg-client-primary hover:bg-client-secondary cursor-pointer' : 'bg-client-primary opacity-60 cursor-not-allowed'}`}
                            >
                                {outOfStock ? "Hết hàng" : "Mua ngay"}
                            </button>

                            <ul className="mt-[50px]">
                                <li className="flex items-center text-[#505050] my-[15px]">
                                    <UserCart className="text-client-primary mr-[10px]" />
                                    Chỉ còn <span className="text-client-primary underline mx-[5px]"> 23 giờ 23 phút!</span> Đặt ngay để kịp nhận hàng trước  <span className="text-client-primary underline mx-[5px]">18/10</span>
                                </li>
                                <li className="flex items-center text-[#505050] my-[15px]">
                                    <EyeSolid className="text-client-primary mr-[10px]" />
                                    Có <span className="text-client-secondary mx-[5px]">{product.viewCount || 24}</span>người khác cũng đang xem sản phẩm này.
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

            {showToast && selectedVariant && (
                <div className={`fixed bottom-[32px] left-[18px] z-[999] p-[15px] bg-[#FCF9F8] shadow-[0_0px_5px_1px_#ffffff40] rounded-[20px] border border-[#d7d7d7] inline-flex items-center max-w-[500px] transition-all duration-300 ease-in-out ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
                    <div className="pr-[10px] w-[110px] h-[115px] rounded-[10px] overflow-hidden">
                        <img src={mainImage} alt={product.name} className="w-full h-full object-cover" width={110} height={115} />
                    </div>
                    <div className="px-[10px] py-[5px] text-client-text flex-1">
                        <div>Sản phẩm</div>
                        <Link to={`/product/detail/${slug}`} className="text-[2rem] font-secondary mb-[6px] text-client-secondary my-[5px] inline-block">
                            {product.name}
                        </Link>
                        <p>đã được thêm vào giỏ hàng thành công!</p>
                    </div>
                </div>
            )}
        </>
    )
}