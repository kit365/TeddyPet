import { apiApp } from "./index";

export interface ProductVariant {
    variantId: number;
    productId: number;
    productName: string;
    productSlug: string;
    name: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    price: number;
    salePrice: number | null;
    stockQuantity: number;
    unit: string;
    featuredImageId: number | null;
    featuredImageUrl: string | null;
    attributes: any[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface Product {
    productId: number;
    slug: string;
    barcode: string | null;
    name: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    minPrice: number;
    maxPrice: number;
    origin: string;
    material: string;
    viewCount: number;
    soldCount: number;
    petTypes: string[];
    status: string;
    categories: any[];
    tags: any[];
    ageRanges: any[];
    attribute: any | null;
    variants: ProductVariant[];
    brand: any | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface PaginatedProducts {
    content: Product[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface ProductsResponse {
    success: boolean;
    message: string;
    data: PaginatedProducts;
    timestamp: string;
}

export const getProducts = async (): Promise<ProductsResponse> => {
    const response = await apiApp.get("/api/products");
    return response.data;
};
