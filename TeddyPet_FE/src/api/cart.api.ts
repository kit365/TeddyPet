import { apiApp } from "./index";

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

export interface CartResponse {
    userId: number;
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

// GET /api/carts - Lấy giỏ hàng hiện tại
export const getCart = async () => {
    const response = await apiApp.get<{ success: boolean; data: CartResponse }>('/api/carts');
    return response.data;
};

// POST /api/carts/items - Thêm sản phẩm vào giỏ hàng
export const addToCart = async (request: AddToCartRequest) => {
    const response = await apiApp.post<{ success: boolean; message: string }>('/api/carts/items', request);
    return response.data;
};

// PUT /api/carts/items - Cập nhật số lượng sản phẩm
export const updateCartItem = async (request: UpdateCartItemRequest) => {
    const response = await apiApp.put<{ success: boolean; message: string }>('/api/carts/items', request);
    return response.data;
};

// DELETE /api/carts/items/{variantId} - Xóa sản phẩm khỏi giỏ hàng
export const removeCartItem = async (variantId: number) => {
    const response = await apiApp.delete<{ success: boolean; message: string }>(`/api/carts/items/${variantId}`);
    return response.data;
};
