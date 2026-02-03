export interface UserAddressRequest {
    fullName: string;
    phone: string;
    address: string;
    longitude?: number;
    latitude?: number;
    isDefault: boolean;
}

export interface UserAddressResponse {
    id: number;
    userId: string;
    fullName: string;
    phone: string;
    address: string;
    longitude?: number;
    latitude?: number;
    isDefault: boolean;
}
