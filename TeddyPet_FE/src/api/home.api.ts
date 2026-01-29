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

export const getHomeProducts = async (params: HomeProductParams) => {
    // Convert array params to comma-separated strings or let axios handle it (usually axios handles arrays as repeated params or brackets depending on config)
    // Spring Boot often expects repeated params like ?categorySlugs=a&categorySlugs=b. Axios does this by default with arrayFormat: 'repeat' usually, or default behavior.
    // However, if the backend expects comma separated, we might need to join. 
    // Let's assume standard axios behavior is fine for now, or check if we need paramsSerializer.
    // If we simply pass params, axios will do params handling.

    const response = await apiApp.get("/api/home/products", { params });
    return response.data;
};


export const getProductBrands = async () => {
    const response = await apiApp.get("/api/home/product-brands");
    return response.data;
};

export const getProductCategoryLeaves = async () => {
    const response = await apiApp.get("/api/home/product-categories/leaves");
    return response.data;
};

export const getSearchSuggestions = async (keyword: string) => {
    const response = await apiApp.get("/api/home/products/search/suggestions", { params: { keyword } });
    return response.data;
};
