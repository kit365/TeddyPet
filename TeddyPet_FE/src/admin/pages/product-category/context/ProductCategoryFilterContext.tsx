import { createContext, useContext } from 'react';

export type ParentFilterValue = 'all' | number;

export interface ParentOption {
    id: number;
    label: string;
}

export interface ProductCategoryFilterContextValue {
    parentFilter: ParentFilterValue;
    setParentFilter: (v: ParentFilterValue) => void;
    parentOptions: ParentOption[];
}

const ProductCategoryFilterContext = createContext<ProductCategoryFilterContextValue | null>(null);

export function ProductCategoryFilterProvider({
    children,
    value,
}: {
    children: React.ReactNode;
    value: ProductCategoryFilterContextValue;
}) {
    return (
        <ProductCategoryFilterContext.Provider value={value}>
            {children}
        </ProductCategoryFilterContext.Provider>
    );
}

export function useProductCategoryFilter() {
    return useContext(ProductCategoryFilterContext);
}
