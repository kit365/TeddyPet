
// --- Client/UI Types ---

export interface Product {
    id: number;
    title: string;
    price: string;
    oldPrice?: string;
    primaryImage: string;
    secondaryImage?: string;
    rating: number;
    isSale?: boolean;
    isSoldOut?: boolean;
    url: string;
}

export interface ProductVariant {
    id: string; // Internal UID for UI
    variantId?: number;
    attributes: { name: string; value: string; id?: any }[];
    sku: string;
    originalPrice: number;
    price: number;
    stock: number;
    status: "ACTIVE" | "DRAFT" | "HIDDEN";
    featuredImage?: string;
    featuredImageId?: number;
    active: boolean;
}

export interface IProduct {
    id: number;
    product: string;
    category: string;
    image: string;
    createdAt: Date | null;
    stock: number;
    price: number;
    minPrice?: number;
    maxPrice?: number;
    status: string;
    stockStatus?: string;
    productType?: string;
    categorySlug?: string;
    brandSlug?: string;
    variants?: ProductVariant[];
}

// --- API Response Types ---

export interface APIProductAttributeValue {
    valueId: number;
    attributeId: number;
    attributeName: string;
    value: string;
    displayOrder: number;
    displayCode: string;
}

export interface APIProductVariant {
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
    sku: string;
    status: string;
    attributes: APIProductAttributeValue[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface APIProductAttribute {
    attributeId: number;
    name: string;
    valueIds: number[];
}

export interface APIProduct {
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
    ratingCount?: number;
    averageRating?: number;
    petTypes: string[];
    status: string;
    stockStatus?: string;
    productType: string;
    categories: any[];
    tags: any[];
    ageRanges: any[];
    attributes: APIProductAttribute[];
    variants: APIProductVariant[];
    brand: any | null;
    images: { id: number, imageUrl: string }[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface PaginatedProducts {
    content: APIProduct[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}