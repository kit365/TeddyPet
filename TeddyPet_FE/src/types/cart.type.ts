export interface CartItemResponse {
    variantId: number;
    sku: string;
    productName: string;
    variantName: string;
    featuredImageUrl: string;
    altImage: string;
    price: number;
    salePrice: number | null;
    finalPrice: number;
    quantity: number;
    subTotal: number;
    stockQuantity: number;
    isAvailable: boolean;
}

export interface CartItem {
    id: string | number;
    title: string;
    image: string;
    option: {
        id: string;
        size: string;
        price: number;
    };
    quantity: number;
    stockQuantity?: number;
    checked?: boolean;
}

export interface CartResponse {
    userId: string | number;
    items: CartItemResponse[];
    totalAmount: number;
    totalItems: number;
}

export interface AddToCartRequest {
    variantId: number;
    quantity: number;
}

export interface UpdateCartItemRequest {
    variantId: number;
    quantity: number;
}
