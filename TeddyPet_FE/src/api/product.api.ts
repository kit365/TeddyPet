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

export interface ProductAttributeValue {
    valueId: number;
    attributeId: number;
    attributeName: string;
    value: string;
    displayOrder: number;
    displayCode: string;
}

export interface ProductVariantDetail {
    variantId: number;
    productId: number;
    name: string;
    price: number;
    stockQuantity: number;
    featuredImageUrl: string | null;
    attributes: ProductAttributeValue[];
    productSlug?: string;
}

export interface ProductAttribute {
    attributeId: number;
    name: string;
    valueIds: number[];
}

export interface ProductDetail {
    id: number;
    slug: string;
    name: string;
    description: string;
    minPrice: number;
    maxPrice: number;
    ratingCount: number;
    averageRating: number;
    sku: string;
    variants: ProductVariantDetail[];
    attributes: ProductAttribute[];
    images: { id: number, url: string }[];
    viewCount?: number;
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

const BASE_PATH = "/api/products";
const HOME_BASE_PATH = "/api/home/products";

export const getProducts = async (): Promise<ProductsResponse> => {
    const response = await apiApp.get(`${BASE_PATH}`);
    return response.data;
};

export const getProductBySlug = async (slug: string) => {
    const response = await apiApp.get(`${HOME_BASE_PATH}/${slug}`);
    return response.data;
};
