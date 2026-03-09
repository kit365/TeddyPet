import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, IconButton, Typography, Box, Skeleton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';
import StarIcon from "@mui/icons-material/Star";
import { toast } from "react-toastify";
import { Heart } from 'iconoir-react';

import { getProductBySlug } from '../../../api/product.api';
import { APIProduct, APIProductAttributeValue, APIProductVariant } from '../../../types/products.type';
import { useCartStore } from '../../../stores/useCartStore';
import { CartItem } from '../../../types/cart.type';

interface ProductQuickViewModalProps {
    slug: string | null;
    onClose: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ slug, onClose }) => {
    const [product, setProduct] = useState<APIProduct | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
    const [selectedVariant, setSelectedVariant] = useState<APIProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [outOfStock, setOutOfStock] = useState(false);
    const [canAddToCart, setCanAddToCart] = useState(false);

    // Cart Store
    const addToCart = useCartStore((state) => state.addToCart);
    const cartItems = useCartStore((state) => state.items);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        getProductBySlug(slug)
            .then(res => {
                if (res && res.data) {
                    setProduct(res.data);
                }
            })
            .catch(err => console.error("QuickView Error:", err))
            .finally(() => setLoading(false));
    }, [slug]);

    // Calculate Unique Attribute Values
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

    // Update variant based on options
    useEffect(() => {
        setOutOfStock(false);
        if (!product) return;

        // Simple Product Case
        if (product.attributes.length === 0) {
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
                setSelectedVariant(null);
                setCanAddToCart(false);
                setOutOfStock(true);
            }
            return;
        }

        // Variable Product Case
        if (Object.keys(selectedOptions).length === 0) {
            setSelectedVariant(null);
            setCanAddToCart(false);
            return;
        }

        const allAttributesSelected = product.attributes.every(attr => selectedOptions[attr.attributeId]);
        if (!allAttributesSelected) {
            setSelectedVariant(null);
            setCanAddToCart(false);
            return;
        }

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

    // Max quantity logic matching ProductDetail
    const existingCartItem = selectedVariant ? cartItems.find(item => item.id === selectedVariant.variantId) : null;
    const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
    const availableStock = selectedVariant ? Math.max(0, selectedVariant.stockQuantity - currentCartQuantity) : 0;
    const currentMaxQuantity = outOfStock ? 0 : availableStock;

    // Correct quantity when variant changes
    useEffect(() => {
        if (outOfStock) {
            setQuantity(0);
        } else if (selectedVariant && quantity > selectedVariant.stockQuantity) {
            setQuantity(Math.max(1, selectedVariant.stockQuantity));
        } else if (quantity === 0 && !outOfStock) {
            setQuantity(1);
        }
    }, [selectedVariant, quantity, outOfStock]);

    const handleSelectOption = (attributeId: number, valueId: number) => {
        setSelectedOptions(prev => ({
            ...prev,
            [attributeId]: valueId
        }));
    };

    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;

        if (currentCartQuantity + quantity > selectedVariant.stockQuantity) {
            toast.error(`Bạn đã có ${currentCartQuantity} sản phẩm trong giỏ hàng. Số lượng tồn kho chỉ còn ${selectedVariant.stockQuantity}. Không thể thêm quá số lượng này.`);
            return;
        }

        const cartItem: CartItem = {
            id: selectedVariant.variantId,
            title: product.name,
            image: selectedVariant.featuredImageUrl || product.images[0]?.imageUrl || "",
            option: {
                id: String(selectedVariant.variantId),
                size: selectedVariant.attributes.map(a => a.value).join(" / "),
                price: (selectedVariant.salePrice && selectedVariant.salePrice > 0) ? selectedVariant.salePrice : selectedVariant.price,
                originalPrice: (selectedVariant.salePrice && selectedVariant.salePrice > 0) ? selectedVariant.price : undefined,
            },
            quantity: quantity,
        };

        addToCart(cartItem);
        toast.success("Đã thêm vào giỏ hàng!");
        onClose();
    };

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

    // --- RENDER ---
    const isOpen = !!slug;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '20px', padding: '0px', maxWidth: '800px' }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                    zIndex: 10
                }}
            >
                <CloseIcon fontSize='large' />
            </IconButton>

            <DialogContent sx={{ p: 0 }}>
                {loading || !product ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
                        <Skeleton variant="text" height={40} />
                        <Skeleton variant="text" height={40} width="60%" />
                    </Box>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] p-[20px]">
                        {/* Image Section */}
                        <div>
                            <Box sx={{
                                borderRadius: '15px',
                                overflow: 'hidden',
                                width: '100%',
                                aspectRatio: '1/1',
                                border: '1px solid #eee'
                            }}>
                                <img
                                    src={selectedVariant?.featuredImageUrl || product.images?.[0]?.imageUrl || "https://placeholder.com/600"}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </Box>
                        </div>

                        {/* Info Section */}
                        <div className="flex flex-col">
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1, fontFamily: 'var(--font-secondary)', fontSize: '2.4rem' }}>
                                {product.name}
                            </Typography>

                            {/* Rating */}
                            <div className="flex items-center mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon
                                        key={i}
                                        sx={{
                                            fontSize: "2rem !important",
                                            color: i < (product.averageRating || 5) ? "#ffbb00 !important" : "#ccc !important",
                                        }}
                                    />
                                ))}
                                <span className="ml-2 text-gray-500">({product.ratingCount || 0} customer review)</span>
                            </div>

                            {/* Price */}
                            <Box sx={{ mb: 2 }}>
                                {selectedVariant ? (
                                    selectedVariant.stockQuantity <= 0 ? (
                                        <p className="text-[#FF6262] font-bold text-[2rem]">Tạm hết hàng</p>
                                    ) : (selectedVariant.salePrice && selectedVariant.salePrice > 0) ? (
                                        <div className="flex items-center gap-3">
                                            <p className="text-[#FF6262] font-bold text-[2.2rem]">{selectedVariant.salePrice.toLocaleString("vi-VN")}đ</p>
                                            <p className="text-[#999] line-through text-[1.6rem]">{selectedVariant.price.toLocaleString("vi-VN")}đ</p>
                                        </div>
                                    ) : (
                                        <p className="text-[2.2rem] font-medium text-client-secondary">{selectedVariant.price.toLocaleString("vi-VN")}đ</p>
                                    )
                                ) : (
                                    product.attributes.length > 0 ? (
                                        product.minPrice === product.maxPrice ?
                                            <p className="text-[2.2rem] font-medium text-client-secondary">{product.minPrice?.toLocaleString("vi-VN")}đ</p> :
                                            <p className="text-[2.2rem] font-medium text-client-secondary">{product.minPrice?.toLocaleString("vi-VN")}đ - {product.maxPrice?.toLocaleString("vi-VN")}đ</p>
                                    ) : (
                                        <p className="text-[#FF6262] font-bold text-[2rem]">Tạm hết hàng</p>
                                    )
                                )}
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {/* Options */}
                            <div className="mb-[20px]">
                                {product.attributes.map((attr) => (
                                    <div key={attr.attributeId} className="mb-[15px]">
                                        <div className="mb-[5px] text-client-secondary flex items-center">
                                            <span className="font-secondary text-[1.6rem] ">{attr.name}:</span>
                                            {selectedOptions[attr.attributeId] && (
                                                <span className="text-client-secondary ml-[5px] font-medium">
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
                                                        className={`flex flex-col items-center justify-center m-[5px] py-[6px] px-[15px] cursor-pointer capitalize rounded-[3rem] transition-default border text-[1.4rem]
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
                            </div>

                            {/* Quantity & Actions */}
                            <div className="flex items-center gap-[15px] h-[50px] mb-[15px] mt-auto">
                                <div className="text-[#505050] flex items-center h-full">
                                    <input
                                        type="button"
                                        value="-"
                                        className="cursor-pointer w-[40px] h-full rounded-l-[3rem] text-[2.5rem] bg-[#e67e2033] hover:text-client-primary text-center transition-[color] duration-200 ease-linear pb-1"
                                        onClick={handleDecrease}
                                    />
                                    <input
                                        type="number"
                                        value={quantity}
                                        min={1}
                                        max={currentMaxQuantity}
                                        onChange={handleChangeQuantity}
                                        className="w-[40px] h-full bg-[#e67e2033] text-[1.6rem] text-center outline-none no-spinner"
                                    />
                                    <input
                                        type="button"
                                        value="+"
                                        className="cursor-pointer w-[40px] h-full rounded-r-[3rem] text-[2rem] bg-[#e67e2033] hover:text-client-primary text-center transition-[color] duration-200 ease-linear pb-1"
                                        onClick={handleIncrease}
                                    />
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={!canAddToCart}
                                    className={`bg-client-secondary flex-1 h-full rounded-[3rem] text-white text-[1.4rem] font-bold uppercase transition-default flex items-center justify-center px-4
                                        ${canAddToCart ? 'opacity-100 cursor-pointer hover:bg-client-primary' : 'opacity-60 cursor-not-allowed'}`}
                                >
                                    {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                                </button>

                                <div className="w-[50px] h-full flex items-center justify-center text-client-secondary hover:text-client-primary transition-default p-[10px] bg-transparent border border-[#d7d7d7] rounded-full cursor-pointer">
                                    <Heart className="w-[2.2rem] h-[2.2rem]" />
                                </div>
                            </div>

                            <Link
                                to={`/product/detail/${product.slug}`}
                                className="text-client-primary hover:underline text-[1.4rem] mt-2 inline-block"
                            >
                                Xem chi tiết đầy đủ &rarr;
                            </Link>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
