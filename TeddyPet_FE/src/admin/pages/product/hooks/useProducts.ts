import { useMemo, useState, useEffect } from 'react';
import { IProduct } from '../../../../types/products.type';
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
                    const mappedProducts: IProduct[] = response.data.content.map((item: any) => {
                        const variants = item.variants || [];
                        const totalStock = variants.reduce((acc: number, curr: any) => acc + (curr.stockQuantity || 0), 0);
                        const status = item.status ? item.status.toLowerCase() : "draft";

                        return {
                            id: item.productId,
                            product: item.name,
                            category: item.categories[0]?.name || "N/A",
                            image: item.images && item.images.length > 0 ? item.images[0].imageUrl : "https://api-prod-minimal-v700.pages.dev/assets/images/m-product/product-1.webp",
                            createdAt: item.createdAt ? new Date(item.createdAt) : null,
                            stock: totalStock,
                            stockStatus: item.stockStatus,
                            price: item.minPrice,
                            minPrice: item.minPrice,
                            maxPrice: item.maxPrice,
                            productType: item.productType,
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
                const matchesStock = filters.stock.some((stock) => {
                    const status = product.stockStatus;
                    if (stock === 'instock') return status === 'IN_STOCK';
                    if (stock === 'lowstock') return status === 'LOW_STOCK';
                    if (stock === 'outofstock') return status === 'OUT_OF_STOCK';
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
