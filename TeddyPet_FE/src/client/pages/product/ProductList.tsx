import { FooterSub } from "../../components/layouts/FooterSub"
import { ProductAside } from "./sections/ProductAside"
import { ProductBanner } from "./sections/ProductBanner"
import type { Product } from "../../../types/products.type"
import { ProductCard } from "../../components/ui/ProductCard"
import { ProductListSearch } from "./sections/ProductListSearch"

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Cửa hàng", to: "/shop" },
];

const products: Product[] = [
    {
        id: 1,
        title: "Thẻ tên",
        price: "360.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
        rating: 5,
        isSale: true,
        url: "/san-pham/the-ten",
    },
    {
        id: 2,
        title: "Vòng cổ",
        price: "220.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-11-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-11c-1000x1048.jpg",
        rating: 4,
        isSale: false,
        url: "/san-pham/vong-co",
    },
    {
        id: 3,
        title: "Áo mưa cho chó",
        price: "150.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-12-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-12c-1000x1048.jpg",
        rating: 3,
        isSale: true,
        url: "/san-pham/ao-mua-cho-cho",
    },
    {
        id: 4,
        title: "Nệm nylon",
        price: "540.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-9-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-9a-1000x1048.jpg",
        rating: 4,
        isSale: true,
        url: "/san-pham/nem-nylon",
    },
    {
        id: 5,
        title: "Xương chó",
        price: "160.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-2-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-2b-1000x1048.jpg",
        rating: 5,
        isSale: true,
        url: "/san-pham/xuong-cho",
    },
    {
        id: 6,
        title: "Đồ nhai cho chó",
        price: "270.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-5-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-5a-1000x1048.jpg",
        rating: 4,
        isSale: false,
        url: "/san-pham/do-nhai-cho-cho",
    },
    {
        id: 7,
        title: "Thức ăn khô",
        price: "110.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/v-product-img-15b-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-6a-1000x1048.jpg",
        rating: 3,
        isSale: true,
        url: "/san-pham/thuc-an-kho",
    },
    {
        id: 8,
        title: "Giường thoải mái",
        price: "540.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-7-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-7a-1000x1048.jpg",
        rating: 4,
        isSale: true,
        url: "/san-pham/giuong-thoai-mai",
    },
    {
        id: 9,
        title: "Bát đựng thức ăn",
        price: "60.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-3-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-3a-1000x1048.jpg",
        rating: 5,
        isSale: true,
        url: "/san-pham/bat-dung-thuc-an",
    },
    {
        id: 10,
        title: "Thức ăn ướt",
        price: "120.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/product-img-15bb-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-6c-1000x1048.jpg",
        rating: 4,
        isSale: false,
        url: "/san-pham/thuc-an-uot",
    },
    {
        id: 11,
        title: "Thức ăn khô",
        price: "150.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-6b-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-6a-1000x1048.jpg",
        rating: 3,
        isSale: true,
        url: "/san-pham/thuc-an-kho",
    },
    {
        id: 12,
        title: "Thức ăn vị cá hồi",
        price: "140.000đ",
        primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/product-img-15aa-1000x1048.jpg",
        secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/product-img-15a-1000x1048.jpg",
        rating: 4,
        isSale: true,
        url: "/san-pham/thuc-an-vi-ca-hoi",
    },
];

export const ProductListPage = () => {
    return (
        <>
            <ProductBanner pageTitle="Cửa hàng" breadcrumbs={breadcrumbs} url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-blog-listing.jpg" className="bg-top" />

            <div className="app-container flex gap-[80px] 2xl:gap-[30px] relative">
                <ProductAside />
                <section className="w-[1040px] 2xl:w-[970px]">
                    <ProductListSearch />
                    <div className="grid grid-cols-3 gap-[30px]">
                        {products.map((item) => (
                            <ProductCard product={item} />
                        ))}
                    </div>
                    <ul className="flex items-center mt-[65px] 2xl:mt-[40px] justify-center gap-[11px] pb-[150px] 2xl:pb-[120px]">
                        <li className="flex items-center cursor-pointer justify-center bg-client-secondary text-white rounded-full w-[4.5rem] h-[4.5rem]">1</li>
                        <li className="flex items-center cursor-pointer justify-center bg-client-primary hover:bg-client-secondary transition-default text-white rounded-full w-[4.5rem] h-[4.5rem]">2</li>
                        {/* <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-client-primary hover:bg-client-secondary cursor-pointer transition-default flex items-center justify-center prev-button"></div> */}
                        <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-client-primary hover:bg-client-secondary cursor-pointer transition-default flex items-center justify-center next-button"></div>
                    </ul>
                </section>
            </div>

            <FooterSub />
        </>
    );
};
