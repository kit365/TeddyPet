import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";
import {
    CartResponse,
    AddToCartRequest,
    UpdateCartItemRequest
} from "../types/cart.type";

const BASE_PATH = "/api/carts";

// GET /api/carts - Lấy giỏ hàng hiện tại
export const getCart = async () => {
    const response = await apiApp.get<ApiResponse<CartResponse>>(`${BASE_PATH}`);
    return response.data;
};

// POST /api/carts/items - Thêm sản phẩm vào giỏ hàng
export const addToCart = async (request: AddToCartRequest) => {
    const response = await apiApp.post<ApiResponse<void>>(`${BASE_PATH}/items`, request);
    return response.data;
};

// PUT /api/carts/items - Cập nhật số lượng sản phẩm
export const updateCartItem = async (request: UpdateCartItemRequest) => {
    const response = await apiApp.put<ApiResponse<void>>(`${BASE_PATH}/items`, request);
    return response.data;
};

// DELETE /api/carts/items/{variantId} - Xóa sản phẩm khỏi giỏ hàng
export const removeCartItem = async (variantId: number) => {
    const response = await apiApp.delete<ApiResponse<void>>(`${BASE_PATH}/items/${variantId}`);
    return response.data;
};
