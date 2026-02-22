import { Navigation } from "swiper/modules";
import type { Product, APIProduct } from "../../../../types/products.type";
import { ProductCard } from "../../../components/ui/ProductCard"
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from "swiper";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRelatedProducts } from "../../../../api/product.api";

interface ProductRelatedProps {
    productId?: number;
}

export const ProductRelated = ({ productId }: ProductRelatedProps) => {
    const prevButtonRef = useRef<HTMLDivElement>(null);
    const nextButtonRef = useRef<HTMLDivElement>(null);

    const { data: relatedRes, isLoading } = useQuery({
        queryKey: ['related-products', productId],
        queryFn: () => productId ? getRelatedProducts(productId, 6) : Promise.resolve(null),
        enabled: !!productId
    });

    const productsData = relatedRes?.data?.content || [];

    const mappedProducts: Product[] = productsData.map((p: APIProduct) => {
        const hasSale = p.variants?.some(v => v.salePrice && v.salePrice > 0) || false;
        let isSoldOut = false;

        if (p.variants && p.variants.length > 0) {
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
            const minPriceVariant = p.variants.find(v => (v.salePrice || v.price) === p.minPrice);
            if (minPriceVariant && minPriceVariant.salePrice) {
                oldPriceStr = minPriceVariant.price.toLocaleString('vi-VN') + 'đ';
            }
        }

        return {
            id: p.id,
            title: p.name,
            price: (p.minPrice ?? 0).toLocaleString('vi-VN') + 'đ',
            oldPrice: oldPriceStr,
            primaryImage: p.images[0]?.imageUrl || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            secondaryImage: p.images[1]?.imageUrl || p.images[0]?.imageUrl || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            rating: p.averageRating || 5,
            isSale: hasSale || p.tags.some(t => t.slug === 'sale'),
            isSoldOut: isSoldOut,
            url: `/product/detail/${p.slug}`
        };
    });

    if (!productId || isLoading || mappedProducts.length === 0) {
        return null;
    }

    return (
        <div className="app-container pb-[150px] 2xl:pb-[120px] relative">
            <h2 className="text-[3.5rem] 2xl:text-[2.8rem] font-secondary text-client-secondary mb-[40px]">Sản phẩm liên quan</h2>
            <div className="flex gap-[10px] absolute top-[-3%] right-0">
                <div ref={prevButtonRef} className="w-[50px] h-[50px] rounded-full bg-client-primary hover:bg-client-secondary cursor-pointer transition-default flex items-center justify-center prev-button"></div>
                <div ref={nextButtonRef} className="w-[50px] h-[50px] rounded-full bg-client-primary hover:bg-client-secondary cursor-pointer transition-default flex items-center justify-center next-button"></div>
            </div>

            <Swiper
                modules={[Navigation]}
                slidesPerView={4}
                spaceBetween={30}
                navigation={{
                    prevEl: prevButtonRef.current,
                    nextEl: nextButtonRef.current,
                }}
                onBeforeInit={(swiper: SwiperType) => {
                    if (
                        swiper.params.navigation &&
                        typeof swiper.params.navigation !== "boolean"
                    ) {
                        swiper.params.navigation.prevEl = prevButtonRef.current;
                        swiper.params.navigation.nextEl = nextButtonRef.current;
                    }
                }}
                className="mySwiper"
            >
                {mappedProducts.map((item: Product) => (
                    <SwiperSlide key={item.id}>
                        <ProductCard product={item} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}