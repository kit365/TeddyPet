import { useMemo, useState } from 'react';
import { IProduct } from '../configs/types';
import { DemoData } from '../configs/constants';

interface IProductFilters {
    status?: string[];
    stock?: string[];
    search?: string;
}

export const useProducts = () => {
    const [products] = useState<IProduct[]>(DemoData);
    const [filters, setFilters] = useState<IProductFilters>({
        status: [],
        stock: [],
        search: '',
    });

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
        filters,
        setStatusFilter,
        setStockFilter,
        setSearchFilter,
        clearFilters,
    };
};
