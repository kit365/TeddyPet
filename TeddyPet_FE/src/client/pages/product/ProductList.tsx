import { FooterSub } from "../../components/layouts/FooterSub"
import { ProductAside, FilterState } from "./sections/ProductAside"
import { ProductBanner } from "./sections/ProductBanner"
import type { Product } from "../../../types/products.type"
import { ProductCard } from "../../components/ui/ProductCard"
import { ProductListSearch } from "./sections/ProductListSearch"
import { useQuery } from "@tanstack/react-query"
import { getHomeProducts } from "../../../api/home.api"
import { useState } from "react"

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Cửa hàng", to: "/shop" },
];

import { ProductQuickViewModal } from "../../components/ui/ProductQuickViewModal"

export const ProductListPage = () => {
    const [filters, setFilters] = useState<FilterState>({
        categorySlugs: [],
        brandSlugs: [],
        page: 0,
        sortKey: 'id',
        sortDirection: 'desc'
    });

    const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

    const { data: productRes, isLoading } = useQuery({
        queryKey: ['home-products', filters],
        queryFn: () => getHomeProducts({
            keyword: filters.keyword,
            categorySlugs: filters.categorySlugs.length ? filters.categorySlugs : undefined,
            brandSlugs: filters.brandSlugs.length ? filters.brandSlugs : undefined,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            page: filters.page,
            size: 12,
            sortKey: filters.sortKey,
            sortDirection: filters.sortDirection
        }),
        placeholderData: (previousData) => previousData
    });

    const productsData = productRes?.data;
    const products = productsData?.content || [];
    const totalPages = productsData?.totalPages || 0;
    const totalElements = productsData?.totalElements || 0;

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortChange = (key: string, direction: string) => {
        setFilters(prev => ({
            ...prev,
            sortKey: key,
            sortDirection: direction,
            page: 0
        }));
    };

    // Map backend data to frontend Product interface
    const mappedProducts: Product[] = products.map(p => {
        const hasSale = p.variants?.some(v => v.salePrice && v.salePrice > 0) || false;

        // Priority: Check stockStatus from Backend > Check variants stock
        let isSoldOut = false;

        if (p.variants && p.variants.length > 0) {
            // Only check variants if they exist. If empty, fallback to stockStatus (which is likely IN_STOCK or undefined -> Available)
            const activeVariants = p.variants.filter(v => v.status === "ACTIVE" || v.isActive);

            if (activeVariants.length > 0) {
                const everyVariantZeroStock = activeVariants.every(v => v.stockQuantity === 0);

                if (everyVariantZeroStock) {
                    isSoldOut = true;
                }
            }
        }

        let oldPriceStr: string | undefined = undefined;

        if (hasSale) {
            // Find the original price corresponding to the minPrice (which is the discounted price)
            const minPriceVariant = p.variants.find(v => (v.salePrice || v.price) === p.minPrice);
            if (minPriceVariant && minPriceVariant.salePrice) {
                oldPriceStr = minPriceVariant.price.toLocaleString('vi-VN') + 'đ';
            }
        }

        return {
            id: p.productId,
            title: p.name,
            price: (p.minPrice ?? 0).toLocaleString('vi-VN') + 'đ',
            oldPrice: oldPriceStr,
            primaryImage: p.images[0]?.imageUrl || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            secondaryImage: p.images[1]?.imageUrl || p.images[0]?.imageUrl || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            rating: 5, // Default for now
            isSale: hasSale || p.tags.some(t => t.slug === 'sale'),
            isSoldOut: isSoldOut,
            url: `/product/detail/${p.slug}`
        };
    });

    return (
        <>
            <ProductBanner pageTitle="Cửa hàng" breadcrumbs={breadcrumbs} url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-blog-listing.jpg" className="bg-top" />

            <div className="app-container flex gap-[80px] 2xl:gap-[30px] relative">
                <ProductAside filters={filters} onFiltersChange={setFilters} />
                <section className="w-[1040px] 2xl:w-[970px]">
                    <ProductListSearch
                        totalElements={totalElements}
                        page={filters.page}
                        size={12}
                        onSortChange={handleSortChange}
                    />

                    {isLoading && !productsData ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-client-primary"></div>
                        </div>
                    ) : (
                        <>
                            {mappedProducts.length > 0 ? (
                                <div className="grid grid-cols-3 gap-[30px]">
                                    {mappedProducts.map((item) => (
                                        <ProductCard
                                            key={item.id}
                                            product={item}
                                            onQuickView={(slug) => setQuickViewSlug(slug)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-[1.6rem] text-gray-500">
                                    Không tìm thấy sản phẩm nào phù hợp.
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <ul className="flex items-center mt-[65px] 2xl:mt-[40px] justify-center gap-[11px] pb-[150px] 2xl:pb-[120px]">
                                    {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                                        <li
                                            key={p}
                                            onClick={() => handlePageChange(p)}
                                            className={`flex items-center cursor-pointer justify-center rounded-full w-[4.5rem] h-[4.5rem] text-[1.6rem] transition-default ${filters.page === p
                                                ? "bg-client-secondary text-white"
                                                : "bg-client-primary text-white hover:bg-client-secondary"
                                                }`}
                                        >
                                            {p + 1}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </section>
            </div>

            <FooterSub />

            <ProductQuickViewModal
                slug={quickViewSlug}
                onClose={() => setQuickViewSlug(null)}
            />
        </>
    );
};
