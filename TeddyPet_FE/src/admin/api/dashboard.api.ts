import { apiApp } from "../../api/index";
import { ApiResponse } from "../../types/common.type";
import { OrderResponse } from "../../types/order.type";

const BASE_PATH = "/api/dashboard";

export interface DashboardStatsResponse {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    confirmedOrders: number;
    processingOrders: number;
    deliveringOrders: number;
    deliveredOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    returnedOrders: number;
    todayOrders: number;
    todayRevenue: number;
    lowStockCount: number;
    todayBookings: number;
}

export interface RevenueChartItem {
    label: string;
    revenue: number;
    orders: number;
}

export const getDashboardStats = async () => {
    const response = await apiApp.get<ApiResponse<DashboardStatsResponse>>(`${BASE_PATH}/stats`);
    return response.data;
};

export const getStaffStats = async () => {
    const response = await apiApp.get<ApiResponse<DashboardStatsResponse>>(`${BASE_PATH}/staff-stats`);
    return response.data;
};

export const getRevenueChart = async (days: number = 30) => {
    const response = await apiApp.get<ApiResponse<RevenueChartItem[]>>(`${BASE_PATH}/revenue-chart`, {
        params: { days }
    });
    return response.data;
};

export const getRecentOrders = async (limit: number = 10) => {
    const response = await apiApp.get<ApiResponse<OrderResponse[]>>(`${BASE_PATH}/recent-orders`, {
        params: { limit }
    });
    return response.data;
};

export const getSalesByCategory = async () => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/sales-by-category`);
    return response.data;
};

export const getTopCustomers = async () => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/top-customers`);
    return response.data;
};

export const getLatestProducts = async () => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/latest-products`);
    return response.data;
};

export const getPetDistribution = async () => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/pet-distribution`);
    return response.data;
};

export const getServiceStatistics = async () => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/service-statistics`);
    return response.data;
};
