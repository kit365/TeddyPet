import { PetTypeEnum } from '../../enums/PetTypeEnum';
import { ProductStatusEnum } from '../../enums/ProductStatusEnum';
import { ProductImageItemRequest } from '../image/image';
import { ProductImageInfo } from '../image/imageInfo';
import { ProductVariantRequest, ProductVariantResponse } from '../variant/variant';
import { ProductCategoryInfo } from '../category/category';
import { ProductTagInfo } from '../tag/tag';
import { ProductAgeRangeInfo } from '../agerange/agerange';
import { ProductBrandInfo } from '../brand/brand';
import { ProductAttributeInfo } from '../attribute/attribute';


export interface ProductRequest {
  name: string;
  barcode?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  minPrice?: number;
  maxPrice?: number;
  origin?: string;
  material?: string;
  petTypes?: PetTypeEnum[];
  brandId?: number;
  status?: ProductStatusEnum;
  categoryIds?: number[];
  tagIds?: number[];
  ageRangeIds?: number[];
  attributeIds?: number[];
  images?: ProductImageItemRequest[];
  variants?: ProductVariantRequest[];
}


export enum ProductSortField {
  ID = 'id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  MIN_PRICE = 'minPrice',
  SOLD_COUNT = 'soldCount',
}

// ==================== PRODUCT SEARCH REQUEST ====================
export interface ProductSearchRequest {
  // Pagination
  page?: number;
  size?: number;
  
  // Search & Sort
  keyword?: string;
  sortKey?: string;
  sortDirection?: string;
  
  // A. Bộ lọc Phân tích dữ liệu
  categoryIds?: number[];
  brandId?: number;
  petTypes?: PetTypeEnum[];
  ageRangeIds?: number[];
  
  // B. Bộ lọc Trạng thái & Vận hành
  status?: ProductStatusEnum;
  stockStatus?: string;
  stockThreshold?: number;
  includeDeletedVariants?: boolean;
  
  // C. Bộ lọc Kiểm toán & Chất lượng
  createdAtFrom?: string; // ISO date string
  createdAtTo?: string;   // ISO date string
  missingFeaturedImage?: boolean;
  missingDescription?: boolean;
}

export interface ProductResponse {
  productId: number;
  slug?: string;
  barcode?: string;
  name: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  minPrice?: number;
  maxPrice?: number;
  origin?: string;
  material?: string;
  viewCount?: number;
  soldCount?: number;
  petTypes?: PetTypeEnum[];
  status?: ProductStatusEnum;
  categories?: ProductCategoryInfo[];
  tags?: ProductTagInfo[];
  ageRanges?: ProductAgeRangeInfo[];
  attribute?: ProductAttributeInfo[];
  variants?: ProductVariantResponse[];
  brand?: ProductBrandInfo;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}


export interface ProductDetailResponse {
  id: number;
  name: string;
  description?: string;
  content?: string;
  minPrice?: number;
  maxPrice?: number;
  viewCount?: number;
  soldCount?: number;
  averageRating?: number;
  ratingCount?: number;
  brand?: ProductBrandInfo;
  categories?: ProductCategoryInfo[];
  tags?: ProductTagInfo[];
  ageRanges?: ProductAgeRangeInfo[];
  attribute?: ProductAttributeInfo[];
  variants?: ProductVariantResponse[];
  images?: ProductImageInfo[];
  metaTitle?: string;
  metaDescription?: string;
  origin?: string;
  material?: string;
  status?: ProductStatusEnum;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
}
