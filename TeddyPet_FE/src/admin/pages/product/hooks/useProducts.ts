import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IProduct } from '../../../../types/products.type';
import { getProducts } from '../../../../api/product.api';
import { toast } from 'react-toastify';

interface IProductFilters {
    status?: string[];
    stock?: string[];
    search?: string;
}

// Query key dùng chung để invalidate sau khi import/update/delete
export const PRODUCTS_QUERY_KEY = ['admin-products'];

const mapProduct = (item: any): IProduct => {
    const variants = item.variants || [];
    const totalStock = variants.reduce((acc: number, curr: any) => acc + (curr.stockQuantity || 0), 0);
    return {
        id: item.productId,
        product: item.name,
        category: item.categories?.[0]?.name || 'N/A',
        image: item.images?.length > 0
            ? item.images[0].imageUrl
            : 'https://api-prod-minimal-v700.pages.dev/assets/images/m-product/product-1.webp',
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
        stock: totalStock,
        stockStatus: item.stockStatus,
        price: item.minPrice,
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
        productType: item.productType,
        status: item.status ? item.status.toLowerCase() : 'draft',
    };
};

export const useProducts = () => {
    const [filters, setFilters] = useState<IProductFilters>({
        status: [],
        stock: [],
        search: '',
    });

    const { data, isLoading, refetch } = useQuery<IProduct[]>({
        queryKey: PRODUCTS_QUERY_KEY,
        queryFn: async () => {
            const response = await getProducts();
            if (!response.success) throw new Error('Không thể tải danh sách sản phẩm');
            return (response.data.content as any[]).map(mapProduct);
        },
        onError: () => {
            toast.error('Không thể tải danh sách sản phẩm');
        },
    } as any);

    const products: IProduct[] = data ?? [];

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            if (filters.status && filters.status.length > 0) {
                if (!filters.status.includes(product.status)) return false;
            }
            if (filters.stock && filters.stock.length > 0) {
                const matchesStock = filters.stock.some((stock) => {
                    const status = product.stockStatus;
                    if (stock === 'instock') return status === 'IN_STOCK';
                    if (stock === 'lowstock') return status === 'LOW_STOCK';
                    if (stock === 'outofstock') return status === 'OUT_OF_STOCK';
                    return false;
                });
                if (!matchesStock) return false;
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    product.product.toLowerCase().includes(searchLower) ||
                    product.category.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }
            return true;
        });
    }, [products, filters]);

    return {
        products: filteredProducts,
        allProducts: products,
        loading: isLoading,
        filters,
        refetch,
        setStatusFilter: (status: string[]) => setFilters((prev) => ({ ...prev, status })),
        setStockFilter: (stock: string[]) => setFilters((prev) => ({ ...prev, stock })),
        setSearchFilter: (search: string) => setFilters((prev) => ({ ...prev, search })),
        clearFilters: () => setFilters({ status: [], stock: [], search: '' }),
    };
};
