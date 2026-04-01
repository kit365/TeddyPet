import { apiApp } from "../../api/index";
import { ApiResponse } from "../../types/common.type";
import { OrderResponse } from "../../types/order.type";

const BASE_PATH = "/api/dashboard";

export interface DashboardStatsResponse {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    avgRating: number;
    completedBookings: number;
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
    /** Khách đặt lịch (phân biệt user / SĐT+email), không tính hủy & booking tạm — theo bộ lọc ngày */
    bookingCustomersExcludingCancelled?: number;
    /** Booking đã thanh toán đủ (PAID), không hủy */
    bookingFullyPaidCount?: number;
    /** Số lượt cọc đã thanh toán */
    bookingDepositsPaidCount?: number;
    /** Tổng tiền cọc đã hoàn */
    bookingDepositsRefundedTotal?: number;
}

export interface RevenueChartItem {
    label: string;
    revenue: number;
    orders: number;
}

export const getDashboardStats = async (startDate?: string, endDate?: string) => {
    const response = await apiApp.get<ApiResponse<DashboardStatsResponse>>(`${BASE_PATH}/stats`, {
        params: { startDate, endDate }
    });
    return response.data;
};

export const getStaffStats = async (startDate?: string, endDate?: string) => {
    const response = await apiApp.get<ApiResponse<DashboardStatsResponse>>(`${BASE_PATH}/staff-stats`, {
        params: { startDate, endDate }
    });
    return response.data;
};

export const getRevenueChart = async (days: number = 30, startDate?: string, endDate?: string, type?: 'DAY' | 'MONTH') => {
    const response = await apiApp.get<ApiResponse<RevenueChartItem[]>>(`${BASE_PATH}/revenue-chart`, {
        params: { days, startDate, endDate, type }
    });
    return response.data;
};

export const getRecentOrders = async (limit: number = 10) => {
    const response = await apiApp.get<ApiResponse<OrderResponse[]>>(`${BASE_PATH}/recent-orders`, {
        params: { limit }
    });
    return response.data;
};

export const getSalesByCategory = async (startDate?: string, endDate?: string) => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/sales-by-category`, {
        params: { startDate, endDate }
    });
    return response.data;
};

export const getTopCustomers = async (startDate?: string, endDate?: string) => {
    const response = await apiApp.get<ApiResponse<any[]>>(`${BASE_PATH}/top-customers`, {
        params: { startDate, endDate }
    });
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

export interface ServiceStatisticsSeriesInfo {
    serviceId: number;
    name: string;
}

export interface ServiceStatisticsWithComparisonResponse {
    /** Dịch vụ đang hoạt động; serviceCounts dùng key = String(serviceId). */
    services: ServiceStatisticsSeriesInfo[];
    months: Array<{ month: string; serviceCounts: Record<string, number> }>;
    totalThisYear: number;
    totalLastYear: number;
    percentChange: number;
}

export const getServiceStatistics = async (year?: number) => {
    const response = await apiApp.get<ApiResponse<ServiceStatisticsWithComparisonResponse>>(`${BASE_PATH}/service-statistics`, {
        params: year != null ? { year } : undefined
    });
    return response.data;
};

export interface VisitsByRegionResponse {
    north: number;
    central: number;
    south: number;
    regions: Array<{ label: string; count: number }>;
}

export const getVisitsByRegion = async () => {
    const response = await apiApp.get<ApiResponse<VisitsByRegionResponse>>(`${BASE_PATH}/visits-by-region`);
    return response.data;
};

export interface CustomerGrowthResponse {
    thisYearMonthly: number[];
    lastYearMonthly: number[];
    monthLabels: string[];
}

export const getCustomerGrowth = async () => {
    const response = await apiApp.get<ApiResponse<CustomerGrowthResponse>>(`${BASE_PATH}/customer-growth`);
    return response.data;
};

export interface TopSellingProductItem {
    product: {
        productId: number;
        name: string;
        minPrice?: number;
        maxPrice?: number;
        images?: Array<{ url?: string }>;
        slug?: string;
    };
    quantitySold: number;
}

export const getTopSellingProducts = async (days?: number | null) => {
    const response = await apiApp.get<ApiResponse<TopSellingProductItem[]>>(`${BASE_PATH}/top-selling-products`, {
        params: days != null ? { days } : undefined
    });
    return response.data;
};

export interface RatingSummaryResponse {
    averageScore: number;
    totalCount: number;
}

export const getRatingSummary = async () => {
    const response = await apiApp.get<ApiResponse<RatingSummaryResponse>>(`${BASE_PATH}/rating-summary`);
    return response.data;
};

export interface TopStaffResponse {
    staffId: number;
    name: string;
    avatarUrl?: string;
    positionName: string;
    completedTasksCount: number;
}

export const getTopStaff = async () => {
    const response = await apiApp.get<ApiResponse<TopStaffResponse[]>>(`${BASE_PATH}/top-staff`);
    return response.data;
};

export interface TodayRevenueOrderDto {
    orderId: string;
    orderCode: string;
    customerName: string;
    finalAmount: number;
    status: string;
    createdAt: string;
}

export interface TodayRevenueBookingDto {
    bookingId: number;
    bookingCode: string;
    customerName: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

export interface TodayRevenueDetailsResponse {
    totalRevenue: number;
    completedOrdersCount: number;
    completedBookingsCount: number;
    orders: TodayRevenueOrderDto[];
    bookings: TodayRevenueBookingDto[];
}

export const getTodayRevenueDetails = async () => {
    const response = await apiApp.get<ApiResponse<TodayRevenueDetailsResponse>>(`${BASE_PATH}/today-revenue-details`);
    return response.data;
};

export const getTotalRevenueDetails = async () => {
    const response = await apiApp.get<ApiResponse<TodayRevenueDetailsResponse>>(`${BASE_PATH}/total-revenue-details`);
    return response.data;
};

