import { apiApp } from "./index";
import { APIProduct, PaginatedProducts } from "../types/products.type";
import { ApiResponse } from "../types/common.type";

export type ProductsResponse = ApiResponse<PaginatedProducts>;

const BASE_PATH = "/api/products";
const HOME_BASE_PATH = "/api/home/products";

export const getProducts = async (): Promise<ProductsResponse> => {
    const response = await apiApp.get(`${BASE_PATH}`);
    return response.data;
};

export const getProductBySlug = async (slug: string): Promise<ApiResponse<APIProduct>> => {
    const response = await apiApp.get(`${HOME_BASE_PATH}/${slug}`);
    return response.data;
};
