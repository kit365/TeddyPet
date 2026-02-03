import { apiApp } from "./index";

export interface HomeProductParams {
    keyword?: string;
    categorySlugs?: string[];
    brandSlugs?: string[];
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
    sortKey?: string;
    sortDirection?: string;
}

const BASE_PATH = "/api/home";

export const getHomeProducts = async (params: HomeProductParams) => {
    const response = await apiApp.get(`${BASE_PATH}/products`, { params });
    return response.data;
};

export const getProductBrands = async () => {
    const response = await apiApp.get(`${BASE_PATH}/product-brands`);
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
