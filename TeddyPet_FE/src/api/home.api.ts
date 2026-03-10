import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";

export interface HomeProductParams {
    keyword?: string;
    categorySlugs?: string[];
    brandSlugs?: string[];
    tagSlugs?: string[];
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
    sortKey?: string;
    sortDirection?: string;
}

const BASE_PATH = "/api/home";

export interface ProductBrandOption {
    id: number;
    name: string;
    isDeleted: boolean;
    isActive: boolean;
}

export const getHomeProducts = async (params: HomeProductParams) => {
    const response = await apiApp.get(`${BASE_PATH}/products`, { params });
    return response.data;
};

export const getProductBrands = async () => {
    const response = await apiApp.get(`${BASE_PATH}/product-brands`);
    return response.data;
};

export const getFoodBrandOptions = async (petType: string): Promise<ApiResponse<ProductBrandOption[]>> => {
    const response = await apiApp.get<ApiResponse<ProductBrandOption[]>>(`${BASE_PATH}/product-brands/food-options`, {
        params: { petType },
    });
    return response.data;
};

export const getProductCategoryLeaves = async () => {
    const response = await apiApp.get(`${BASE_PATH}/product-categories/leaves`);
    return response.data;
};

export const getSearchSuggestions = async (keyword: string) => {
    const response = await apiApp.get(`${BASE_PATH}/products/search/suggestions`, { params: { keyword } });
    return response.data;
};

export const getHomeTags = async () => {
    const response = await apiApp.get(`${BASE_PATH}/product-tags`);
    return response.data;
};
