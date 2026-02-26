import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

interface ShowConfirmDialogParams {
    title: string;
    text?: string;
    html?: string;
    icon?: SweetAlertIcon;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
}

export const showConfirmDialog = async ({
    title,
    text,
    html,
    icon = 'question',
    confirmButtonText = 'Đồng ý',
    cancelButtonText = 'Hủy bỏ',
    confirmButtonColor = '#3085d6',
    cancelButtonColor = '#d33'
}: ShowConfirmDialogParams): Promise<SweetAlertResult> => {
    return Swal.fire({
        title,
        text,
        html,
        icon,
        showCancelButton: true,
        confirmButtonColor,
        cancelButtonColor,
        confirmButtonText,
        cancelButtonText,
    });
};
