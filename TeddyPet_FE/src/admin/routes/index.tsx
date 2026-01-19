import type { RouteObject } from "react-router-dom";
import { ProductListPage } from "../pages/product/ProductListPage";
import { ProductCreatePage } from "../pages/product/ProductCreatePage";
import { ProductCategoryListPage } from "../pages/product-category/ProductCategoryListPage";
import { ProductCategoryCreatePage } from "../pages/product-category/ProductCategoryCreatePage";
import { ProductCategoryEditPage } from "../pages/product-category/ProductCategoryEditPage";
import { BrandListPage } from "../pages/brand/BrandListPage";
import { BrandCreatePage } from "../pages/brand/BrandCreatePage";
import { BrandEditPage } from "../pages/brand/BrandEditPage";
import { BlogListPage } from "../pages/blog/BlogListPage";
import { BlogCategoryListPage } from "../pages/blog-category/BlogCategoryListPage";
import { BlogCategoryCreatePage } from "../pages/blog-category/BlogCategoryCreatePage";
import { BlogCreatePage } from "../pages/blog/BlogCreatePage";
import { BlogDetailPage } from "../pages/blog/BlogDetailPage";
import { BlogEditPage } from "../pages/blog/BlogEditPage";
import { LoginPage } from "../pages/authen/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { BlogCategoryEditPage } from "../pages/blog-category/BlogCategoryEditPage";
import { ProductAttributeListPage } from "../pages/product-attribute/ProductAttributeListPage";
import { ProductAttributeCreatePage } from "../pages/product-attribute/ProductAttributeCreatePage";

export const AdminRoutes: RouteObject[] = [
    { path: "dashboard", element: <DashboardPage /> },
    { path: "product/list", element: <ProductListPage /> },
    { path: "product/create", element: <ProductCreatePage /> },
    { path: "product/attribute/list", element: <ProductAttributeListPage /> },
    { path: "product-attribute/create", element: <ProductAttributeCreatePage /> },
    { path: "product-category/list", element: <ProductCategoryListPage /> },
    { path: "product-category/create", element: <ProductCategoryCreatePage /> },
    { path: "product-category/edit/:id", element: <ProductCategoryEditPage /> },
    { path: "brand/list", element: <BrandListPage /> },
    { path: "brand/create", element: <BrandCreatePage /> },
    { path: "brand/edit/:id", element: <BrandEditPage /> },
    { path: "blog/list", element: <BlogListPage /> },
    { path: "blog/create", element: <BlogCreatePage /> },
    { path: "blog/edit/:id", element: <BlogEditPage /> },
    { path: "blog/detail/:id", element: <BlogDetailPage /> },
    { path: "blog-category/list", element: <BlogCategoryListPage /> },
    { path: "blog-category/create", element: <BlogCategoryCreatePage /> },
    { path: "blog-category/edit/:id", element: <BlogCategoryEditPage /> },
];

export const AdminAuthRoutes: RouteObject[] = [
    { path: "auth/login", element: <LoginPage /> },
];
