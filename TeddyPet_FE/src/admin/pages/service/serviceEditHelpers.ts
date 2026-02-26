import { toast } from 'react-toastify';

type DeletePricingMutation = (id: number, opts: { onSuccess?: (res: { success?: boolean; message?: string }) => void }) => void;

export function createDeletePricingHandler(deletePricing: DeletePricingMutation) {
    return (pricingId: number) => {
        if (!window.confirm('Xóa quy tắc giá này?')) return;
        deletePricing(pricingId, {
            onSuccess: (res) => {
                if (res?.success) toast.success('Đã xóa quy tắc giá');
                else toast.error(res?.message);
            },
        });
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PricingMutation = (payload: any, opts: { onSuccess?: (res: { success?: boolean; message?: string }) => void }) => void;

export function createOnPricingSubmit(
    serviceId: number,
    editingPricing: { pricingId: number } | null,
    updatePricing: PricingMutation,
    createPricing: PricingMutation,
    setPricingModalOpen: (v: boolean) => void,
    setEditingPricing: (v: null) => void
) {
    return (data: { price: number; priority: number; [k: string]: unknown }) => {
        const suitablePetTypes = Array.isArray((data as any).suitablePetTypes)
            ? ((data as any).suitablePetTypes as string[]).join(',')
            : ((data as any).suitablePetTypes as string | undefined);
        const payload = { ...data, suitablePetTypes, serviceId, price: Number(data.price), priority: Number(data.priority) };
        if (editingPricing) {
            updatePricing(
                { ...payload, pricingId: editingPricing.pricingId },
                {
                    onSuccess: (res) => {
                        if (res?.success) {
                            toast.success('Cập nhật quy tắc giá thành công');
                            setPricingModalOpen(false);
                            setEditingPricing(null);
                        } else toast.error(res?.message);
                    },
                }
            );
        } else {
            createPricing(payload, {
                onSuccess: (res) => {
                    if (res?.success) {
                        toast.success('Thêm quy tắc giá thành công');
                        setPricingModalOpen(false);
                    } else toast.error(res?.message);
                },
            });
        }
    };
}
