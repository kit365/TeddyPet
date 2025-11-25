// Blog Category Upsert Request (Create & Update)
export interface BlogCategoryUpsertRequest {
  categoryId?: number | null; // Null when creating new
  name: string;
  description?: string;
  imageUrl?: string;
  altImage?: string;
  parentId?: number | null;
  displayOrder?: number; // Optional, auto-generated if null
}

// Blog Category Response
export interface BlogCategoryResponse {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  altImage?: string;
  parentId?: number | null;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Blog Category Info (for nested references)
export interface BlogCategoryInfo {
  categoryId: number;
  name: string;
  slug: string;
  imageUrl?: string;
  altImage?: string;
  displayOrder: number;
}

// Blog Category Nested Response (with children)
export interface BlogCategoryNestedResponse {
  categoryId: number;
  name: string;
  slug: string;
  imageUrl?: string;
  altImage?: string;
  displayOrder: number;
  children?: BlogCategoryNestedResponse[];
}
