import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const AMENITIES_URL = '/api/amenities';
const AMENITY_CATEGORIES_URL = '/api/amenity-categories';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export interface IAmenityListItem {
    id: number;
    description: string | null;
    icon: string | null;
    categoryId: number;
    categoryName: string;
    displayOrder: number | null;
    isActive?: boolean;
}

export interface IAmenityCategoryWithAmenities {
    id: number;
    categoryName: string;
    displayOrder: number | null;
    amenities: IAmenityListItem[];
}

/** Admin: category list (all non-deleted) */
export interface IAmenityCategory {
    id: number;
    categoryName: string;
    description: string | null;
    displayOrder: number | null;
    icon: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/** Admin: amenity list/detail */
export interface IAmenity {
    id: number;
    categoryId: number;
    categoryName: string;
    description: string | null;
    icon: string | null;
    image: string | null;
    displayOrder: number | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const getAmenities = async (params?: { categoryId?: number; forAdmin?: boolean }): Promise<ApiResponse<IAmenityListItem[]>> => {
    const response = await apiApp.get(AMENITIES_URL, { ...withAuth(), params });
    return response.data;
};

export const getAmenityCategoriesWithAmenities = async (): Promise<ApiResponse<IAmenityCategoryWithAmenities[]>> => {
    const response = await apiApp.get(AMENITY_CATEGORIES_URL, withAuth());
    return response.data;
};

/** Admin: list categories (forAdmin=true) */
export const getAmenityCategoriesAdmin = async (): Promise<ApiResponse<IAmenityCategory[]>> => {
    const response = await apiApp.get(AMENITY_CATEGORIES_URL, { ...withAuth(), params: { forAdmin: true } });
    return response.data;
};

/** Admin: get category by id */
export const getAmenityCategoryById = async (id: string | number): Promise<ApiResponse<IAmenityCategory>> => {
    const response = await apiApp.get(`${AMENITY_CATEGORIES_URL}/${id}`, withAuth());
    return response.data;
};

/** Admin: create category */
export const createAmenityCategory = async (data: Record<string, unknown>): Promise<ApiResponse<IAmenityCategory>> => {
    const response = await apiApp.post(AMENITY_CATEGORIES_URL, data, withAuth());
    return response.data;
};

/** Admin: update category */
export const updateAmenityCategory = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<IAmenityCategory>> => {
    const response = await apiApp.put(`${AMENITY_CATEGORIES_URL}/${id}`, data, withAuth());
    return response.data;
};

/** Admin: delete category (soft) */
export const deleteAmenityCategory = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${AMENITY_CATEGORIES_URL}/${id}`, withAuth());
    return response.data;
};

/** Admin: list amenities (forAdmin=true, optional categoryId) */
export const getAmenitiesAdmin = async (categoryId?: number | null): Promise<ApiResponse<IAmenity[]>> => {
    const params: Record<string, unknown> = { forAdmin: true };
    if (categoryId != null) params.categoryId = categoryId;
    const response = await apiApp.get(AMENITIES_URL, { ...withAuth(), params });
    return response.data;
};

/** Admin: get amenity by id */
export const getAmenityById = async (id: string | number): Promise<ApiResponse<IAmenity>> => {
    const response = await apiApp.get(`${AMENITIES_URL}/${id}`, withAuth());
    return response.data;
};

/** Admin: create amenity */
export const createAmenity = async (data: Record<string, unknown>): Promise<ApiResponse<IAmenity>> => {
    const response = await apiApp.post(AMENITIES_URL, data, withAuth());
    return response.data;
};

/** Admin: update amenity */
export const updateAmenity = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<IAmenity>> => {
    const response = await apiApp.put(`${AMENITIES_URL}/${id}`, data, withAuth());
    return response.data;
};

/** Admin: delete amenity (soft) */
export const deleteAmenity = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${AMENITIES_URL}/${id}`, withAuth());
    return response.data;
};
