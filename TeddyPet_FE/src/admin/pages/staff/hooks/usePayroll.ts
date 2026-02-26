import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runPayroll, getPayrollByMonthYear, type IPayrollRunRequest } from '../../../api/payroll.api';
import { ApiResponse } from '../../../config/type';

export const usePayrollByMonthYear = (month: number, year: number, staffId?: number | null) => {
    return useQuery({
        queryKey: ['payroll', month, year, staffId],
        queryFn: () => getPayrollByMonthYear(month, year, staffId),
        enabled: month >= 1 && month <= 12 && year > 0,
        select: (res: ApiResponse<any>) => res.data ?? [],
    });
};

export const useRunPayroll = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: IPayrollRunRequest) => runPayroll(data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ['payroll', variables.month, variables.year, variables.staffId] });
            qc.invalidateQueries({ queryKey: ['payroll', variables.month, variables.year] });
        },
    });
};
