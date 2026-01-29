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

export const getProducts = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const createProduct = async (data: any): Promise<any> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
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

export const createProductTag = async (data: { name: string }): Promise<any> => {
    const response = await apiApp.post(TAGS_URL, data, withAuth());
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
