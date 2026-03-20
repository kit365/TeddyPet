import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, getNestedCategories, getCategoryById, deleteCategory, downloadCategoriesTemplate, exportCategoriesExcel, importCategoriesExcel, previewCategoriesImportExcel } from '../../../api/product-category.api';
import { ApiResponse } from '../../../config/type';
import { toast } from 'react-toastify';

export const useProductCategories = () => {
    return useQuery({
        queryKey: ['product-categories'],
        queryFn: getCategories,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useNestedProductCategories = () => {
    return useQuery({
        queryKey: ['product-categories', 'nested'],
        queryFn: getNestedCategories,
        select: (res) => res.data,
    });
};

export const useCreateProductCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
        },
    });
};

export const useUpdateProductCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // Sử dụng chung hàm createCategory, data lúc này sẽ bao gồm categoryId
        mutationFn: (data: any) => createCategory(data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-categories'] });
                queryClient.invalidateQueries({ queryKey: ['product-category'] });
            }
        },
    });
};

export const useProductCategoryDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['product-category', id],
        queryFn: () => getCategoryById(id!),
        enabled: !!id,
    });
};

export const useDeleteProductCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
        },
    });
};

// ─── Excel ───────────────────────────────────────────────────────────────

export const useDownloadCategoriesTemplate = () => {
    return useMutation({
        mutationFn: downloadCategoriesTemplate,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'categories_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useExportCategoriesExcel = () => {
    return useMutation({
        mutationFn: exportCategoriesExcel,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'categories_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useImportCategoriesExcel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importCategoriesExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            const result = response?.data;
            const created = result?.created ?? 0;
            const updated = result?.updated ?? 0;
            const skipped = result?.skipped ?? 0;
            const errors = result?.errors ?? [];

            if (errors && errors.length > 0) {
                const errorStr = errors.map((e: string) => `• ${e}`).join('\n');
                toast.warn(
                    `Hoàn tất nhập dữ liệu:\n  Tạo mới: ${created}\n  Cập nhật: ${updated}\n  Bỏ qua: ${skipped}\n\nLỗi:\n${errorStr}`,
                    { autoClose: 8000 }
                );
            } else {
                toast.success(`Import thành công! Đã tạo ${created}, tự động cập nhật ${updated}, bỏ qua ${skipped} dòng.`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu từ Excel');
        }
    });
};

export const usePreviewCategoryImportExcel = () => {
    return useMutation({
        mutationFn: previewCategoriesImportExcel,
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Không thể kiểm tra dữ liệu Excel');
        }
    });
};
