import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProductAttributes,
    getProductAttributeDetail,
    deleteProductAttribute,
    updateProductAttribute,
    getDisplayTypes,
    getSalesUnits,
    getMeasurementUnits,
    createProductAttribute,
    exportProductAttributesExcel,
    downloadProductAttributesTemplate,
    importProductAttributesExcel
} from '../../../api/product-attribute.api';
import { ApiResponse } from '../../../config/type';
import { toast } from 'react-toastify';

export const useProductAttributes = () => {
    return useQuery({
        queryKey: ['product-attributes'],
        queryFn: getProductAttributes,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useProductAttributeDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['product-attribute-detail', id],
        queryFn: () => getProductAttributeDetail(id!),
        enabled: !!id,
    });
};

export const useDisplayTypes = () => {
    return useQuery({
        queryKey: ['display-types'],
        queryFn: getDisplayTypes,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useSalesUnits = () => {
    return useQuery({
        queryKey: ['sales-units'],
        queryFn: getSalesUnits,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useMeasurementUnits = () => {
    return useQuery({
        queryKey: ['measurement-units'],
        queryFn: getMeasurementUnits,
        select: (res: ApiResponse<any[]>) => res.data || [],
    });
};

export const useCreateProductAttribute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductAttribute,
        onSuccess: (response: any) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
            }
        },
    });
};

export const useUpdateProductAttribute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number | string; data: any }) => updateProductAttribute(id, data),
        onSuccess: (response: any) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
                queryClient.invalidateQueries({ queryKey: ['product-attribute-detail'] });
            }
        },
    });
};

export const useDeleteProductAttribute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductAttribute,
        onSuccess: (response: any) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
            }
        },
    });
};

// ─── Excel Import/Export ─────────────────────────────────────────────────────

export const useExportProductAttributesExcel = () => {
    return useMutation({
        mutationFn: exportProductAttributesExcel,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'product_attributes_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useDownloadProductAttributesTemplate = () => {
    return useMutation({
        mutationFn: downloadProductAttributesTemplate,
        onSuccess: (data: Blob) => {
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'product_attributes_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    });
};

export const useImportProductAttributesExcel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importProductAttributesExcel,
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
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
                toast.success(`Import thành công! Đã tạo ${created}, cập nhật ${updated}, bỏ qua ${skipped} dòng.`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu từ Excel');
        }
    });
};
