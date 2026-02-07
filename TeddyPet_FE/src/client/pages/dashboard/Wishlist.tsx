import { ProductCard } from "../../components/ui/ProductCard";
import type { Product } from "../../../types/products.type";
import { DashboardLayout } from "./sections/DashboardLayout";
import { Heart } from "lucide-react";

export const WishlistPage = () => {
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Sản phẩm yêu thích", to: "/dashboard/wishlist" },
    ];

    const wishlistItems: Product[] = [
        {
            id: 1,
            title: "Chocolate Cake",
            price: "250.000đ",
            primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            rating: 5,
            isSale: true,
            url: "/product/detail/chocolate-cake",
        },
        {
            id: 2,
            title: "Strawberry",
            price: "180.000đ",
            primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            rating: 4,
            isSale: false,
            url: "/product/detail/strawberry-shortcake",
        },
        {
            id: 3,
            title: "Blueberry",
            price: "45.000đ",
            primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            rating: 5,
            isSale: true,
            url: "/product/detail/blueberry-muffin",
        },
        {
            id: 4,
            title: "Cupcake",
            price: "35.000đ",
            primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            rating: 4,
            isSale: false,
            url: "/product/detail/vanilla-cupcake",
        },
        {
            id: 5,
            title: "Red Velvet",
            price: "220.000đ",
            primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            rating: 5,
            isSale: true,
            url: "/product/detail/red-velvet-cake",
        },
        {
            id: 6,
            title: "Lemon Tart",
            price: "120.000đ",
            primaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10c-1000x1048.jpg",
            secondaryImage: "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg",
            rating: 4,
            isSale: false,
            url: "/product/detail/lemon-tart",
        },
    ];

    return (
        <DashboardLayout pageTitle="Sản phẩm yêu thích" breadcrumbs={breadcrumbs}>
            <div className="flex justify-between items-end border-b border-slate-100 pb-8 mb-12">
                <div>
                    <h3 className="text-[2.8rem] font-black text-slate-800 tracking-tight italic flex items-center gap-3">
                        <Heart className="text-rose-500 fill-rose-500" size={32} />
                        Sản phẩm yêu thích
                    </h3>
                    <p className="text-[1.2rem] text-slate-400 font-medium mt-1 uppercase tracking-widest">Bộ sưu tập dành riêng cho thú cưng của bạn</p>
                </div>
                <div className="px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[1.4rem] font-black text-rose-500 uppercase tracking-widest">
                    {wishlistItems.length} Sản phẩm
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {wishlistItems.map((item) => (
                    <ProductCard key={item.id} product={item} />
                ))}
            </div>

            {/* Pagination */}
            <ul className="flex items-center mt-16 justify-center gap-4">
                <li className="flex items-center cursor-pointer justify-center bg-indigo-600 text-white rounded-2xl w-14 h-14 font-black shadow-lg shadow-indigo-100">1</li>
                <li className="flex items-center cursor-pointer justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all rounded-2xl w-14 h-14 font-black px-4">2</li>
                <li className="flex items-center cursor-pointer justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all rounded-2xl w-14 h-14 font-black px-4">Next</li>
            </ul>
        </DashboardLayout>
    );
};
