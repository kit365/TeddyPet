// Blog Tag Upsert Request (Create & Update)
export interface BlogTagUpsertRequest {
  tagId?: number | null; // Null when creating new
  name: string;
  displayOrder?: number; // Optional
}

// Blog Tag Response
export interface BlogTagResponse {
  tagId: number;
  name: string;
  slug?: string;
  displayOrder: number;
  postCount?: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Blog Tag Info (for nested references)
export interface BlogTagInfo {
  tagId: number;
  name: string;
  slug?: string;
  displayOrder: number;
}
