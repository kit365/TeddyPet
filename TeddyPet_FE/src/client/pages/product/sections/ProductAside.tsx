import SearchIcon from "@mui/icons-material/Search";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import type { Product } from "../../../../types/products.type";
import { ProductAsideTitle } from "./ProductAsideTitle";
import { ProductAsideList } from "./ProductAsideList";
import { useQuery } from "@tanstack/react-query";
import { getProductBrands, getProductCategoryLeaves, getHomeProducts } from "../../../../api/home.api";

// Helper interface for filter state
export interface FilterState {
    keyword?: string;
    categorySlugs: string[];
    brandSlugs: string[];
    minPrice?: number;
    maxPrice?: number;
    page: number;
    sortKey?: string;
    sortDirection?: string;
}

interface ProductAsideProps {
    filters: FilterState;
    onFiltersChange: (newFilters: FilterState) => void;
}



const filterTags = [
    {
        title: "Xương gà",
        url: "/san-pham-the/xuong-ga",
    },
    // ... (keeping static tags for now as requested only brands and categories)
    {
        title: "Thức ăn vặt",
        url: "/san-pham-the/thuc-an-vat",
    },
];

const MAX_PRICE_LIMIT = 5000000;

export const ProductAside = ({ filters, onFiltersChange }: ProductAsideProps) => {
    // Local state for slider dragging
    const [minPricePercent, setMinPricePercent] = useState(0);
    const [maxPricePercent, setMaxPricePercent] = useState(100);
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<null | "min" | "max">(null);
    const [localKeyword, setLocalKeyword] = useState(filters.keyword || "");

    // Initialize/Sync slider logic could go here but simple percent separate is safer for UI responsiveness

    // Fetch Brands
    const { data: brandsRes } = useQuery({
        queryKey: ['product-brands'],
        queryFn: getProductBrands
    });

    // Fetch Category Leaves
    const { data: categoriesRes } = useQuery({
        queryKey: ['product-categories-leaves'],
        queryFn: getProductCategoryLeaves
    });

    // Fetch Featured Products (Sidebar)
    const { data: featuredProductsRes } = useQuery({
        queryKey: ['featured-products-aside'],
        queryFn: () => getHomeProducts({
            page: 0,
            size: 4,
            sortKey: 'viewCount',
            sortDirection: 'desc'
        })
    });

    const sidebarProducts = featuredProductsRes?.data?.content || [];

    const displayCategories = categoriesRes?.data?.map((cat) => ({
        name: cat.name,
        count: cat.productCount,
        slug: cat.slug
    })) || [];

    const displayBrands = brandsRes?.data?.map((brand) => ({
        name: brand.name,
        count: brand.productCount,
        slug: brand.slug
    })) || [];

    // Filter Handlers
    const handleCategorySelect = (slug: string) => {
        const newSlugs = filters.categorySlugs.includes(slug)
            ? filters.categorySlugs.filter(s => s !== slug)
            : [...filters.categorySlugs, slug];

        onFiltersChange({ ...filters, categorySlugs: newSlugs, page: 0 });
    };

    const handleBrandSelect = (slug: string) => {
        const newSlugs = filters.brandSlugs.includes(slug)
            ? filters.brandSlugs.filter(s => s !== slug)
            : [...filters.brandSlugs, slug];

        onFiltersChange({ ...filters, brandSlugs: newSlugs, page: 0 });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFiltersChange({ ...filters, keyword: localKeyword, page: 0 });
    };

    const handlePriceFilter = () => {
        const min = Math.round((minPricePercent / 100) * MAX_PRICE_LIMIT);
        const max = Math.round((maxPricePercent / 100) * MAX_PRICE_LIMIT);
        onFiltersChange({ ...filters, minPrice: min, maxPrice: max, page: 0 });
    };

    // Slider Logic
    const handleMouseDown = (type: "min" | "max") => {
        setDragging(type);
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        const step = 2;
        const clamped = Math.min(Math.max(Math.round(percent / step) * step, 0), 100);

        if (dragging === "min" && clamped <= maxPricePercent) {
            setMinPricePercent(clamped);
        } else if (dragging === "max" && clamped >= minPricePercent) {
            setMaxPricePercent(clamped);
        }
    };

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, maxPricePercent, minPricePercent]);

    return (
        <aside className="w-[400px] 2xl:w-[300px] pb-[120px] 2xl:pb-[100px] sticky top-0 self-start">
            {/* Tìm kiếm */}
            <form className="relative mb-[40px]" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    value={localKeyword}
                    onChange={(e) => setLocalKeyword(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full outline-none text-client-text border border-[#d7d7d7] px-[32px] py-[16px] bg-white rounded-[40px]"
                />
                <button
                    type="submit"
                    className="absolute top-0 right-0 p-[10px] rotate-90 rounded-full text-white bg-client-primary hover:bg-client-secondary transition-default cursor-pointer w-[5.7rem] h-[5.7rem] flex items-center justify-center"
                >
                    <SearchIcon sx={{ fontSize: "3.5rem" }} />
                </button>
            </form>

            {/* Danh mục */}
            <div className="mb-[40px]">
                <ProductAsideTitle title="Mua sắm theo danh mục" />
                <ProductAsideList
                    categories={displayCategories}
                    selectedSlugs={filters.categorySlugs}
                    onSelect={handleCategorySelect}
                />
            </div>

            {/* Khoảng giá */}
            <div className="mb-[40px]">
                <ProductAsideTitle title="Khoảng giá" />
                <div className="mt-[40px]">
                    <div
                        ref={trackRef}
                        className="bg-[#10293726] rounded-[16px] h-[3px] mx-[8px] relative select-none"
                    >
                        <div
                            className="absolute top-0 bg-client-secondary h-full z-[1] rounded-[16px]"
                            style={{
                                left: `${minPricePercent}%`,
                                width: `${maxPricePercent - minPricePercent}%`,
                            }}
                        ></div>

                        {/* Nút min */}
                        <span
                            onMouseDown={() => handleMouseDown("min")}
                            className="absolute top-[1px] translate-y-[-50%] bg-client-primary rounded-full w-[16px] ml-[-8px] h-[16px] z-[2] cursor-ew-resize"
                            style={{
                                left: `${minPricePercent}%`,
                            }}
                        ></span>

                        {/* Nút max */}
                        <span
                            onMouseDown={() => handleMouseDown("max")}
                            className="absolute top-[1px] translate-y-[-50%] bg-client-primary rounded-full w-[16px] ml-[-8px] h-[16px] z-[2] cursor-ew-resize"
                            style={{
                                left: `${maxPricePercent}%`,
                            }}
                        ></span>
                    </div>

                    {/* Giá hiển thị */}
                    <div className="flex justify-between mt-[20px] text-client-text text-[1.4rem]">
                        <span>
                            Giá: {(minPricePercent / 100 * MAX_PRICE_LIMIT).toLocaleString("vi-VN")}đ - {(maxPricePercent / 100 * MAX_PRICE_LIMIT).toLocaleString("vi-VN")}đ
                        </span>
                    </div>
                </div>
                <div className="relative block min-w-[135px] mt-[15px]">
                    <button
                        onClick={handlePriceFilter}
                        className={`button-text cursor-pointer before:bg-white after:bg-white bg-client-primary hover:bg-client-secondary text-white hover:[box-shadow:0_0_30px_#ffffff33] inline-block relative mask-[url('/mask-bg-button.svg')] mask-no-repeat mask-center mask-[size:100%] rounded-[10px] px-[40px] py-[10px] text-[1.6rem] font-secondary transition-default`}
                    >
                        Lọc
                    </button>
                </div>
            </div>

            {/* Danh sách sản phẩm (Dynamic) */}
            <div className="mb-[40px]">
                <ProductAsideTitle title="Sản phẩm" />
                <ul className="mt-[25px]">
                    {sidebarProducts.map((item) => (
                        <li key={item.productId} className="p-[15px] mb-[15px] rounded-[10px] bg-[#fff0f066] flex">
                            <Link to={`/product/detail/${item.slug}`} className="mr-[20px] rounded-[10px] overflow-hidden min-w-[80px]">
                                <img
                                    src={item.images[0]?.url || "https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/05/product-img-10-1000x1048.jpg"}
                                    alt={item.name}
                                    className="w-[80px] h-[84px] object-cover"
                                />
                            </Link>
                            <div>
                                <Link to={`/product/detail/${item.slug}`} className="text-[1.7rem] font-secondary text-client-secondary hover:text-[#10293799] transition-default mb-[2px] line-clamp-2 leading-tight">
                                    {item.name}
                                </Link>
                                <div className="flex items-center mb-[7px] ml-[-5px]">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            sx={{
                                                fontSize: "1.8rem !important",
                                                color: "#ffbb00 !important",
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-client-text">{item.minPrice.toLocaleString('vi-VN')}đ</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Thương hiệu sản phẩm */}
            <div className="mb-[40px]">
                <ProductAsideTitle title="Thương hiệu" />
                <ProductAsideList
                    categories={displayBrands}
                    selectedSlugs={filters.brandSlugs}
                    onSelect={handleBrandSelect}
                />
            </div>

            {/* Lọc theo thẻ - Keeping simple links for now or update similar to categories if requested */}
            <div>
                <ProductAsideTitle title="Lọc theo thẻ" />
                <div className="gap-[15px] mt-[10px] p-[20px] bg-[#fff0f066] rounded-[20px] flex flex-wrap">
                    {filterTags.slice(0, 5).map(item => (
                        <Link to={item.url} className="text-client-secondary bg-white hover:text-white hover:bg-client-secondary transition-default py-[8px] px-[16px] text-[1.4rem] border border-[#10293726] rounded-[35px]">
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    )
}