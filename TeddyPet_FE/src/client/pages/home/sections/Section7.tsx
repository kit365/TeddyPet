import type { Product } from "../../../../types/products.type";
import { Button } from "../../../components/ui/Button"
import { ProductCard } from "../../../components/ui/ProductCard";
import { SaleOff } from "../../../components/ui/SaleOff"
import { SectionHeader } from "../../../components/ui/SectionHeader"
import { SHOP_CONTENT } from "../../../constants/shop-content";
import { useQuery } from "@tanstack/react-query";
import { getHomeProducts } from "../../../../api/home.api";

export const Section7 = () => {
    const { data: productRes, isLoading } = useQuery({
        queryKey: ['home-products-section7'],
        queryFn: () => getHomeProducts({
            page: 0,
            size: 3,
            sortKey: 'viewCount',
            sortDirection: 'desc'
        })
    });

    const products = productRes?.data?.content || [];

    const mappedProducts: Product[] = products.map(p => {
        const hasSale = p.variants?.some(v => v.salePrice && v.salePrice > 0) || false;
        let isSoldOut = false;
        if (p.variants && p.variants.length > 0) {
            const activeVariants = p.variants.filter(v => v.status === "ACTIVE" || v.isActive);
            if (activeVariants.length > 0 && activeVariants.every(v => v.stockQuantity === 0)) {
                isSoldOut = true;
            }
        }

        return {
            id: p.productId,
            title: p.name,
            price: (p.minPrice ?? 0).toLocaleString('vi-VN') + 'đ',
            oldPrice: hasSale ? (p.maxPrice ?? 0).toLocaleString('vi-VN') + 'đ' : undefined,
            primaryImage: p.images[0]?.imageUrl || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            secondaryImage: p.images[1]?.imageUrl || p.images[0]?.imageUrl,
            rating: 5,
            isSale: hasSale,
            isSoldOut: isSoldOut,
            url: `/product/detail/${p.slug}`
        };
    });
    return (
        <section className="relative px-[30px] py-[120px]">
            <div className="app-container flex gap-[30px]">
                <div className="w-[63.5%]">
                    <SectionHeader
                        subtitle={SHOP_CONTENT.BANNERS.ESSENTIAL_PET_SUPPLIES}
                        title={SHOP_CONTENT.BANNERS.FAVORITE_PRODUCTS}
                        align="left"
                    />
                    <div className="grid grid-cols-3 gap-[30px] mt-[50px]">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="animate-pulse bg-gray-100 h-[350px] rounded-[20px]"></div>
                            ))
                        ) : (
                            mappedProducts.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))
                        )}
                    </div>
                </div>
                <div className="flex-1">
                    <div
                        className="flex flex-col gap-[30px] justify-end bg-center bg-cover bg-no-repeat w-full h-full rounded-[30px] p-[40px] relative bg-image-section-7"
                        style={{
                            backgroundImage: "url('https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/h1-Product-imgbox.jpg')"
                        }}
                    >
                        <SaleOff content={SHOP_CONTENT.BANNERS.OFF_20} backgroundColor="bg-[#FFF3E2]" textColor="text-client-secondary" />
                        <h2 className="text-white text-[4rem] leading-[1.2] font-secondary relative">{SHOP_CONTENT.BANNERS.PREMIUM_DESTINATION}</h2>
                        <div className="relative">
                            <Button
                                content={SHOP_CONTENT.BANNERS.VIEW_ALL_PRODUCTS}
                                hoverBackground="group-hover:bg-client-primary"
                                textColor="text-client-secondary"
                                hoverTextColor="group-hover:text-white"
                                iconColor="before:bg-client-secondary after:bg-client-secondary"
                                hoverIconColor="hover:before:bg-white hover:after:bg-white"
                                url="/shop"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}