import { useEffect, useState } from "react";
import { ProductCard } from "../../components/ui/ProductCard";
import type { Product } from "../../../types/products.type";
import { Heart } from "lucide-react";
import { wishlistApi } from "../../../api/wishlist.api";
import { toast } from "react-toastify";
import { ProductBanner } from "../product/sections/ProductBanner";
import { FooterSub } from "../../components/layouts/FooterSub";
import Cookies from "js-cookie";

export const WishlistPage = () => {
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Sản phẩm yêu thích", to: "/wishlist" },
    ];

    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const fetchWishlist = async () => {
        setLoading(true);
        const token = Cookies.get("token");

        if (!token) {
            // Handling Guest Wishlist directly to avert 401 redirect
            const guestWishlist: Product[] = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");

            // Client-side Pagination
            const start = (page - 1) * 12;
            const end = start + 12;

            setWishlistItems(guestWishlist.slice(start, end));
            setTotalPages(Math.ceil(guestWishlist.length / 12) || 1);
            setTotalElements(guestWishlist.length);
            setLoading(false);
            return;
        }

        try {
            const res = await wishlistApi.getMyWishlist(page, 12);
            if (res.data) {
                const products: Product[] = res.data.content.map(w => {
                    const p = w.product;
                    const hasSale = p.variants?.some(v => v.salePrice && v.salePrice > 0) || false;

                    let isSoldOut = false;
                    if (p.variants && p.variants.length > 0) {
                        const activeVariants = p.variants.filter(v => v.status === "ACTIVE" || v.isActive);
                        if (activeVariants.length > 0) {
                            if (activeVariants.every(v => v.stockQuantity === 0)) {
                                isSoldOut = true;
                            }
                        }
                    }

                    let oldPriceStr: string | undefined = undefined;
                    let displayPriceStr = (p.minPrice ?? 0).toLocaleString('vi-VN') + 'đ';

                    if (hasSale) {
                        const minPriceVariant = p.variants.find(v => v.salePrice === p.minPrice && v.salePrice > 0);
                        if (minPriceVariant) {
                            oldPriceStr = minPriceVariant.price.toLocaleString('vi-VN') + 'đ';
                        }
                    }

                    if ((!p.minPrice || p.minPrice === 0) && p.variants && p.variants.length > 0) {
                        const firstValidVariant = p.variants.find(v => v.price > 0);
                        if (firstValidVariant) {
                            displayPriceStr = (firstValidVariant.salePrice && firstValidVariant.salePrice > 0
                                ? firstValidVariant.salePrice
                                : firstValidVariant.price).toLocaleString('vi-VN') + 'đ';
                        }
                    }

                    return {
                        id: p.id,
                        title: p.name,
                        price: displayPriceStr,
                        oldPrice: oldPriceStr,
                        primaryImage: p.images[0]?.imageUrl || "https://placehold.co/600x600",
                        secondaryImage: p.images[1]?.imageUrl || p.images[0]?.imageUrl || "https://placehold.co/600x600",
                        rating: 5,
                        isSale: hasSale || p.tags.some(t => t.slug === 'sale'),
                        url: `/product/detail/${p.slug}`,
                        isSoldOut: isSoldOut
                    };
                });
                setWishlistItems(products);
                setTotalPages(res.data.totalPages);
                setTotalElements(res.data.totalElements);
            }
        } catch (err: any) {
            toast.error("Không thể tải danh sách sản phẩm yêu thích");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, [page]);

    return (
        <div className="min-h-screen flex flex-col">
            <ProductBanner pageTitle="Sản phẩm yêu thích" breadcrumbs={breadcrumbs} url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-blog-listing.jpg" className="bg-top" />
            <div className="app-container flex-grow py-12">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8 mb-12">
                    <div>
                        <h3 className="text-[2.8rem] font-black text-slate-800 tracking-tight italic flex items-center gap-3">
                            <Heart className="text-rose-500 fill-rose-500" size={32} />
                            Sản phẩm yêu thích
                        </h3>
                        <p className="text-[1.2rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">Bộ sưu tập dành riêng cho thú cưng của bạn</p>
                    </div>
                    <div className="px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[1.4rem] font-black text-rose-500 uppercase tracking-widest">
                        {totalElements} Sản phẩm
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-[1.6rem] text-slate-500">Đang tải...</div>
                ) : wishlistItems.length > 0 ? (
                    <>
                        <div className="grid grid-cols-4 gap-[30px]">
                            {wishlistItems.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <ul className="flex items-center mt-16 justify-center gap-4">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <li
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`flex items-center cursor-pointer justify-center rounded-2xl w-14 h-14 font-black transition-all ${page === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 px-4'
                                            }`}
                                    >
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 text-[1.6rem] text-slate-500">Bạn chưa có sản phẩm yêu thích nào.</div>
                )}
            </div>
            <FooterSub />
        </div>
    );
};
