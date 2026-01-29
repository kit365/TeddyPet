import { useMemo, useState, useEffect } from 'react';
import { IProduct } from '../configs/types';
import { getProducts } from '../../../../api/product.api';
import { toast } from 'react-toastify';

interface IProductFilters {
    status?: string[];
    stock?: string[];
    search?: string;
}

export const useProducts = () => {
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<IProductFilters>({
        status: [],
        stock: [],
        search: '',
    });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await getProducts();
                if (response.success) {
                    const mappedProducts: IProduct[] = response.data.content.map((item) => {
                        const totalStock = item.variants.reduce((acc, curr) => acc + curr.stockQuantity, 0);
                        // Map backend status to frontend status
                        let status = "draft";
                        if (item.status === "IN_STOCK") status = "active";
                        if (item.status === "OUT_OF_STOCK") status = "inactive"; // or whatever logic you prefer

                        return {
                            id: item.productId,
                            product: item.name,
                            category: item.categories[0]?.name || "N/A",
                            image: "https://api-prod-minimal-v700.pages.dev/assets/images/m-product/product-1.webp", // Placeholder as per demo
                            createdAt: new Date(item.createdAt),
                            stock: totalStock,
                            price: item.minPrice,
                            status: status
                        };
                    });
                    setProducts(mappedProducts);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
                toast.error("Không thể tải danh sách sản phẩm");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Memoize filtered products để tránh unnecessary recalculations
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            // Filter by status
            if (filters.status && filters.status.length > 0) {
                if (!filters.status.includes(product.status)) {
                    return false;
                }
            }

            // Filter by stock
            if (filters.stock && filters.stock.length > 0) {
                const isInStock = product.stock > 20;
                const isLowStock = product.stock > 0 && product.stock <= 20;
                const isOutOfStock = product.stock === 0;

                const matchesStock = filters.stock.some((stock) => {
                    if (stock === 'instock') return isInStock;
                    if (stock === 'lowstock') return isLowStock;
                    if (stock === 'outofstock') return isOutOfStock;
                    return false;
                });

                if (!matchesStock) {
                    return false;
                }
            }

            // Filter by search
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    product.product.toLowerCase().includes(searchLower) ||
                    product.category.toLowerCase().includes(searchLower);

                if (!matchesSearch) {
                    return false;
                }
            }

            return true;
        });
    }, [products, filters]);

    const setStatusFilter = (status: string[]) => {
        setFilters((prev) => ({ ...prev, status }));
    };

    const setStockFilter = (stock: string[]) => {
        setFilters((prev) => ({ ...prev, stock }));
    };

    const setSearchFilter = (search: string) => {
        setFilters((prev) => ({ ...prev, search }));
    };

    const clearFilters = () => {
        setFilters({
            status: [],
            stock: [],
            search: '',
        });
    };

    return {
        products: filteredProducts,
        allProducts: products,
        loading,
        filters,
        setStatusFilter,
        setStockFilter,
        setSearchFilter,
        clearFilters,
    };
};
