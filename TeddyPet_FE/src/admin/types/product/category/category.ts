// ==================== PRODUCT CATEGORY REQUEST ====================
export interface ProductCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
}

// ==================== PRODUCT CATEGORY UPSERT REQUEST ====================
export interface ProductCategoryUpsertRequest {
  categoryId?: number | null; 
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
}

// ==================== PRODUCT CATEGORY INFO ====================
export interface ProductCategoryInfo {
  id: number;
  name: string;
  parentId?: number | null;
  isDeleted: boolean;
  isActive: boolean;
}

// ==================== PRODUCT CATEGORY RESPONSE ====================
export interface ProductCategoryResponse {
  categoryId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  altImage?: string;
  parentId?: number | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ==================== PRODUCT CATEGORY NESTED RESPONSE ====================
export interface ProductCategoryNestedResponse {
  categoryId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  altImage?: string;
  parentId?: number | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  children?: ProductCategoryNestedResponse[];
}
