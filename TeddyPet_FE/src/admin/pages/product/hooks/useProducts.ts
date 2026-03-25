import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { IProduct } from '../../../../types/products.type';
import { getProducts } from '../../../api/product.api';
import { toast } from 'react-toastify';

interface IProductFilters {
    status?: string[];
    stock?: string[];
    search?: string;
    category?: number[];
    brand?: number[];
    petTypes?: string[];
}

// Query key dùng chung để invalidate sau khi import/update/delete
export const PRODUCTS_QUERY_KEY = ['admin-products'];

const mapProduct = (item: any): IProduct => {
    const variants = item.variants || [];
    const totalStock = variants.reduce((acc: number, curr: any) => acc + (curr.stockQuantity || 0), 0);
    
    // Fix: if salePrice is 0, it means no sale, not 0 cost. The backend might return 0 as minPrice if it includes salePrice = 0.
    const validPrices = variants.map((v: any) => v.salePrice > 0 ? v.salePrice : v.price).filter((p: number) => p > 0);
    const calculatedPrice = validPrices.length > 0 ? Math.min(...validPrices) : (item.price || item.minPrice || item.maxPrice || 0);

    return {
        id: item.id || item.productId,
        product: item.name,
        category: item.categories?.[0]?.name || 'N/A',
        categoryId: item.categories?.[0]?.categoryId || item.categories?.[0]?.id,
        brand: item.brand?.name || 'N/A',
        brandId: item.brand?.id || item.brand?.brandId,
        petTypes: item.petTypes || [],
        image: item.images?.length > 0
            ? item.images[0].imageUrl
            : 'https://api-prod-minimal-v700.pages.dev/assets/images/m-product/product-1.webp',
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
        stock: totalStock,
        stockStatus: item.stockStatus,
        price: calculatedPrice,
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
        productType: item.productType,
        status: item.status ? item.status.toLowerCase() : 'draft',
    };
};

export interface IProductExtended extends IProduct {
    categoryId?: number;
    brand?: string;
    brandId?: number;
    petTypes?: string[];
}

export const useProducts = () => {
    const [filters, setFilters] = useState<IProductFilters>({
        status: [],
        stock: [],
        search: '',
        category: [],
        brand: [],
        petTypes: [],
    });

    // Prepare params for API
    const apiParams = useMemo(() => {
        const params: any = {};
        
        // Use 'keyword' for string search as per backend ProductController.java
        if (filters.search) params.keyword = filters.search;
        
        // Filter by status tab
        if (filters.status && filters.status.length > 0 && filters.status[0] !== 'all') {
            let status = filters.status[0].toUpperCase();
            if (status === 'INACTIVE') status = 'HIDDEN';
            params.status = status;
        }
        
        // Filter by categories (comma separated string)
        if (filters.category && filters.category.length > 0) {
            params.categoryIds = filters.category.join(',');
        }
        
        // Filter by brand (backend expects single Long brandId)
        if (filters.brand && filters.brand.length > 0) {
            params.brandId = filters.brand[0];
        }
        
        // Filter by pet types (comma separated string)
        if (filters.petTypes && filters.petTypes.length > 0) {
            params.petTypes = filters.petTypes.join(',');
        }
        
        // Filter by stock status
        if (filters.stock && filters.stock.length > 0) {
            if (filters.stock.includes('instock')) params.stockStatus = 'IN_STOCK';
            else if (filters.stock.includes('outofstock')) params.stockStatus = 'OUT_OF_STOCK';
            else if (filters.stock.includes('lowstock')) params.stockStatus = 'LOW_STOCK';
        }

        return params;
    }, [filters]);

    const { data, isLoading, refetch } = useQuery<IProductExtended[]>({
        queryKey: [...PRODUCTS_QUERY_KEY, apiParams],
        queryFn: async () => {
            // This getProducts MUST be the one from src/admin/api/product.api.ts which accepts params
            const response = await getProducts(apiParams);
            if (!response.success) throw new Error('Không thể tải danh sách sản phẩm');
            
            const content = response.data?.content || response.data || [];
            return (content as any[]).map(mapProduct);
        },
        onError: () => {
            toast.error('Không thể tải danh sách sản phẩm');
        },
        placeholderData: keepPreviousData,
    } as any);

    const products: IProductExtended[] = data ?? [];

    return {
        products: products,
        allProducts: products,
        loading: isLoading,
        filters,
        refetch,
        setStatusFilter: (status: string[]) => setFilters((prev) => ({ ...prev, status })),
        setStockFilter: (stock: string[]) => setFilters((prev) => ({ ...prev, stock })),
        setCategoryFilter: (category: number[]) => setFilters((prev) => ({ ...prev, category })),
        setBrandFilter: (brand: number[]) => setFilters((prev) => ({ ...prev, brand })),
        setPetTypeFilter: (petTypes: string[]) => setFilters((prev) => ({ ...prev, petTypes })),
        setSearchFilter: (search: string) => setFilters((prev) => ({ ...prev, search })),
        clearFilters: () => setFilters({ status: [], stock: [], search: '', category: [], brand: [], petTypes: [] }),
    };
};
