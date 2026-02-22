import { apiApp } from "./index";
import { PageResponse, ApiResponse } from "../types/common.type";

import { APIProduct } from "../types/products.type";

export interface WishlistResponse {
    id: number;
    productId: number;
    addedAt: string;
    product: APIProduct;
}

export const wishlistApi = {
    getMyWishlist: async (page: number = 1, size: number = 10): Promise<ApiResponse<PageResponse<WishlistResponse>>> => {
        const response = await apiApp.get<ApiResponse<PageResponse<WishlistResponse>>>(`/api/wishlists`, {
            params: { page, size },
        });
        return response.data;
    },

    toggleWishlist: async (productId: number): Promise<ApiResponse<void>> => {
        const response = await apiApp.post<ApiResponse<void>>(`/api/wishlists/${productId}`);
        return response.data;
    },

    checkWishlist: async (productId: number): Promise<ApiResponse<boolean>> => {
        const response = await apiApp.get<ApiResponse<boolean>>(`/api/wishlists/check/${productId}`);
        return response.data;
    },
};
