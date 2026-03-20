import { apiApp } from '../../api';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/products';
const TAGS_URL = '/api/product-tags';
const AGE_RANGES_URL = '/api/product-age-ranges';

/** Header auth dùng chung */
const withAuth = () => {
    const token = Cookies.get('tokenAdmin');

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// --- PRODUCT API ---

export const getProducts = async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiApp.get(BASE_URL, { ...withAuth(), params });
    return response.data;
};

export const getAllProducts = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(`${BASE_URL}/all`, withAuth());
    return response.data;
};

export const createProduct = async (data: any): Promise<any> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const getProductById = async (id: string | number): Promise<ApiResponse<any>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const updateProduct = async (id: string | number, data: any): Promise<any> => {
    const response = await apiApp.put(`${BASE_URL}/${id}`, data, withAuth());
    return response.data;
};

export const deleteProduct = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

// --- EXCEL PRODUCT API ---

export const exportProductsExcel = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL}/excel/export`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

export const downloadProductsTemplate = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL}/excel/template`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

// ─── TAG EXCEL ──────────────────────────────────────────────────────────

const BASE_URL_TAGS = '/api/product-tags';

export const exportTagsExcel = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL_TAGS}/excel/export`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

export const downloadTagsTemplate = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL_TAGS}/excel/template`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

export const importTagsExcel = async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiApp.post(`${BASE_URL_TAGS}/excel/import`, formData, {
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const previewTagsImportExcel = async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiApp.post(`${BASE_URL_TAGS}/excel/preview`, formData, {
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// ─── AGE RANGE EXCEL ──────────────────────────────────────────────────────────

const BASE_URL_AGERANGES = '/api/product-age-ranges';

export const exportAgeRangesExcel = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL_AGERANGES}/excel/export`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

export const downloadAgeRangesTemplate = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL_AGERANGES}/excel/template`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

export const importAgeRangesExcel = async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiApp.post(`${BASE_URL_AGERANGES}/excel/import`, formData, {
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const previewAgeRangesImportExcel = async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiApp.post(`${BASE_URL_AGERANGES}/excel/preview`, formData, {
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export type DuplicateResolution = { rowNumber: number; decision: 'OVERWRITE' | 'CREATE_NEW' };

export const importProductsExcel = async (
    file: File,
    duplicateResolutions?: DuplicateResolution[]
): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (duplicateResolutions != null && duplicateResolutions.length > 0) {
        formData.append('duplicateResolutions', JSON.stringify(duplicateResolutions));
    }

    const token = Cookies.get('tokenAdmin');
    const response = await apiApp.post(`${BASE_URL}/excel/import`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// --- EXCEL PRODUCT IMPORT WIZARD ---

export const previewProductsExcelImport = async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiApp.post(`${BASE_URL}/excel/preview`, formData, {
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const confirmCreateMissingForProductsExcel = async (preview: any): Promise<ApiResponse<any>> => {
    const response = await apiApp.post(`${BASE_URL}/excel/confirm-create`, preview, withAuth());
    return response.data;
};

export const getCountries = async (): Promise<any[]> => {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2');
    return response.data;
};

// --- TAGS API ---

export const getProductTags = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(TAGS_URL, withAuth());
    return response.data;
};

export const createProductTag = async (data: { name: string; description?: string; color?: string }): Promise<any> => {
    const response = await apiApp.post(TAGS_URL, data, withAuth());
    return response.data;
};

export const updateProductTag = async (id: string | number, data: { name: string; description?: string; color?: string }): Promise<any> => {
    const response = await apiApp.put(`${TAGS_URL}/${id}`, data, withAuth());
    return response.data;
};

export const deleteProductTag = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${TAGS_URL}/${id}`, withAuth());
    return response.data;
};

// --- AGE RANGE API ---

export const getProductAgeRanges = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(AGE_RANGES_URL, withAuth());
    return response.data;
};

export const getProductAgeRangeById = async (id: string | number): Promise<any> => {
    const response = await apiApp.get(`${AGE_RANGES_URL}/${id}`, withAuth());
    return response.data;
};

export const createProductAgeRange = async (data: { name: string; description: string }): Promise<any> => {
    const response = await apiApp.post(AGE_RANGES_URL, data, withAuth());
    return response.data;
};

export const updateProductAgeRange = async (id: string | number, data: { name: string; description: string }): Promise<any> => {
    const response = await apiApp.put(`${AGE_RANGES_URL}/${id}`, data, withAuth());
    return response.data;
};

export const deleteProductAgeRange = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${AGE_RANGES_URL}/${id}`, withAuth());
    return response.data;
};

// --- ENUMS & METADATA ---

export const getPetTypes = async (): Promise<ApiResponse<string[]>> => {
    const response = await apiApp.get('/api/enums/pet-types', withAuth());
    return response.data;
};

export const getProductStatuses = async (): Promise<ApiResponse<string[]>> => {
    const response = await apiApp.get('/api/enums/product-statuses', withAuth());
    return response.data;
};

export const getProductTypes = async (): Promise<ApiResponse<string[]>> => {
    const response = await apiApp.get('/api/enums/product-types', withAuth());
    return response.data;
};

export const getSalesUnits = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get('/api/product-variants/sales', withAuth());
    return response.data;
};
