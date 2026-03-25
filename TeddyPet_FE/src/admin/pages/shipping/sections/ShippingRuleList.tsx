import { DataGrid } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import { useDataGridLocale } from '../../../hooks/useDataGridLocale';
import { dataGridCardStyles, dataGridContainerStyles, dataGridStyles } from '../configs/styles.config';
import { Stack, Typography } from '@mui/material';
import { ShippingRule } from '../../../../types/shipping.type';
import { getShippingColumns } from '../configs/column.config';

interface ShippingRuleListProps {
    rules: ShippingRule[];
    loading: boolean;
    onEdit: (rule: ShippingRule) => void;
    onDelete: (id: number) => void;
}

const CustomNoRowsOverlay = () => {
    return (
        <Stack height="100%" alignItems="center" justifyContent="center">
            <Typography variant="body1" sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'text.secondary' }}>
                Không có dữ liệu
            </Typography>
        </Stack>
    );
}

export const ShippingRuleList = ({ rules, loading, onEdit, onDelete }: ShippingRuleListProps) => {
    const localeText = useDataGridLocale();
    const columns = getShippingColumns({ onEdit, onDelete });

    return (
        <Card elevation={0} sx={dataGridCardStyles}>
            <div style={dataGridContainerStyles}>
                <DataGrid
                    loading={loading}
                    rows={rules}
                    columns={columns}
                    localeText={localeText}
                    pagination
                    getRowHeight={() => 'auto'}
                    getEstimatedRowHeight={() => 60}
                    pageSizeOptions={[5, 10, 20]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay
                    }}
                    sx={dataGridStyles}
                />
            </div>
        </Card>
    );
};
