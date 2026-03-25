import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBrands, createBrand, getBrandById, updateBrand, deleteBrand, downloadBrandsTemplate, exportBrandsExcel, importBrandsExcel, previewBrandsImportExcel } from '../../../api/brand.api';
import { ApiResponse } from '../../../config/type';
import { toast } from 'react-toastify';

export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: getBrands,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useCreateBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
    });
};

export const useUpdateBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => updateBrand(id, data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                queryClient.invalidateQueries({ queryKey: ['brand'] });
            }
        },
    });
};

export const useBrandDetail = (id?: string | number) => {
    return useQuery({
        queryKey: ['brand', id],
        queryFn: () => getBrandById(id!),
        enabled: !!id,
    });
};

export const useDeleteBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
    });
};

// ─── Excel ───────────────────────────────────────────────────────────────

export const useDownloadBrandsTemplate = () => {
    return useMutation({
        mutationFn: downloadBrandsTemplate,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'brands_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useExportBrandsExcel = () => {
    return useMutation({
        mutationFn: exportBrandsExcel,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'brands_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useImportBrandsExcel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importBrandsExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            const result = response?.data;
            const created = result?.created ?? 0;
            const updated = result?.updated ?? 0;
            const skipped = result?.skipped ?? 0;
            const errors = result?.errors ?? [];

            if (errors && errors.length > 0) {
                const errorStr = errors.map((e: string) => `• ${e}`).join('\n');
                toast.warn(
                    `Hoàn tất nhập dữ liệu:\n  Tạo mới: ${created}\n  Cập nhật: ${updated}\n  Bỏ qua: ${skipped}\n\nLỗi:\n${errorStr}`,
                    { autoClose: 8000 } // Hiển thị lâu hơn để người dùng đọc kịp
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

export const usePreviewBrandImportExcel = () => {
    return useMutation({
        mutationFn: previewBrandsImportExcel,
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Không thể kiểm tra dữ liệu Excel');
        }
    });
};
