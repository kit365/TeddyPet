import { BlogPostStatusEnum } from '../../enums/BlogPostStatusEnum';
import { BlogCategoryInfo } from '../category/category';
import { BlogTagInfo } from '../tag/tag';

// Blog Post Create Request
export interface BlogPostCreateRequest {
  title: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: number | null;
  tagIds?: number[];
  parentId?: number | null; // For series
  status?: BlogPostStatusEnum; // Optional, default DRAFT
  metaTitle?: string;
  metaDescription?: string;
  displayOrder?: number; // Optional
}

// Blog Post Update Request
export interface BlogPostUpdateRequest {
  title: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: number | null;
  tagIds?: number[];
  parentId?: number | null; // For series
  status?: BlogPostStatusEnum;
  metaTitle?: string;
  metaDescription?: string;
  displayOrder?: number; // Optional
}

// Blog Post Search Request
export interface BlogPostSearchRequest {
  page?: number; // Default 0
  size?: number; // Default 20, max 100
  keyword?: string;
  sortKey?: string;
  sortDirection?: string;
  categoryId?: number | null;
  tagId?: number | null;
  status?: BlogPostStatusEnum;
  createdAtFrom?: string; // ISO date string
  createdAtTo?: string; // ISO date string
}

// Blog Post Response
export interface BlogPostResponse {
  postId: number;
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  category?: BlogCategoryInfo;
  tags?: BlogTagInfo[];
  parentId?: number;
  status?: BlogPostStatusEnum;
  metaTitle?: string;
  metaDescription?: string;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Blog Post Info (for nested references)
export interface BlogPostInfo {
  postId: number;
  title: string;
  slug?: string;
  excerpt?: string;
  featuredImage?: string;
  viewCount?: number;
  status?: BlogPostStatusEnum;
}
