/** Map of categoryId -> { name, colorCode } for displaying category with color in service list */
export type CategoryInfoMap = Record<number, { name: string; colorCode?: string }>;

export interface IServiceCategory {
    categoryId: number;
    categoryName: string;
    slug: string;
    description?: string;
    serviceType?: string;
    pricingModel?: string;
    icon?: string;
    imageUrl?: string;
    colorCode?: string;
    metaTitle?: string;
    metaDescription?: string;
    parentId?: number;
    displayOrder?: number;
    isActive: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IService {
    serviceId: number;
    serviceCategoryId: number;
    code: string;
    serviceName: string;
    suitablePetTypes?: string[];
    slug?: string;
    shortDescription?: string;
    description?: string;
    priceUnit?: string;
    duration: number;
    bufferTime?: number;
    basePrice?: number;
    maxPetsPerSession?: number;
    advanceBookingHours?: number;
    imageURL?: string;
    galleryImages?: string[];
    requiredStaffCount?: number;
    requiredCertifications?: string;
    requiresVaccination?: boolean;
    displayOrder?: number;
    isPopular?: boolean;
    isAddon?: boolean;
    isAdditionalCharge?: boolean;
    isCritical?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    isActive: boolean;
    isRequiredRoom?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IServiceCombo {
    comboId: number;
    code: string;
    comboName: string;
    slug?: string;
    description?: string;
    comboPrice?: number;
    originalPrice?: number;
    validFrom?: string;
    validTo?: string;
    imgURL?: string;
    discountPercentage?: number;
    minPetWeight?: number;
    maxPetWeight?: number;
    suitablePetTypes?: string;
    displayOrder?: number;
    tags?: string;
    isPopular?: boolean;
    isActive: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    serviceItems?: IServiceComboItem[];
}

export interface IServiceComboItem {
    serviceId: number;
    serviceCode?: string;
    serviceName?: string;
    quantity: number;
    serviceActive?: boolean;
}

export interface IServicePricing {
    pricingId: number;
    serviceId: number;
    suitablePetTypes?: string;
    pricingName: string;
    price: number;
    weekendMultiplier?: number;
    peakSeasonMultiplier?: number;
    holidayMultiplier?: number;
    minWeight?: number;
    maxWeight?: number;
    effectiveFrom?: string;
    effectiveTo?: string;
    priority: number;
    roomTypeId?: number | null;
    roomTypeName?: string | null;
    isActive: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IServiceCategoryNode extends IServiceCategory {
    children?: IServiceCategoryNode[];
}
