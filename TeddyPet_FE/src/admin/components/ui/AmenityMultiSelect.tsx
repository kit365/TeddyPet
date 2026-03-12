import { Autocomplete, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getAmenityCategoriesWithAmenities } from '../../api/amenity.api';
import type { IAmenityListItem } from '../../api/amenity.api';

export type AmenityMultiSelectProps = {
    value: string; // JSON array of amenity ids: "[1,2,3]" or ""
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Ids to exclude from options (e.g. to avoid same amenity in both additional and removed) */
    excludeIds?: number[];
};

export function parseAmenityIds(value: string | null | undefined): number[] {
    if (value == null || value === '') return [];
    try {
        const arr = JSON.parse(value);
        return Array.isArray(arr) ? arr.filter((x): x is number => typeof x === 'number') : [];
    } catch {
        return [];
    }
}

export function AmenityMultiSelect({ value, onChange, label = 'Tiện nghi', placeholder = 'Chọn tiện nghi...', disabled, excludeIds }: AmenityMultiSelectProps) {
    const { data: res, isLoading } = useQuery({
        queryKey: ['amenity-categories-with-amenities'],
        queryFn: () => getAmenityCategoriesWithAmenities(),
        select: (r) => r.data ?? [],
    });

    const allOptions: IAmenityListItem[] = (res ?? []).flatMap((cat) => cat.amenities ?? []);
    const activeOnly = allOptions.filter((o) => o.isActive !== false);
    const options = excludeIds?.length
        ? activeOnly.filter((o) => !excludeIds.includes(o.id))
        : activeOnly;
    const selectedIds = parseAmenityIds(value);
    const selectedOptions = allOptions.filter((o) => selectedIds.includes(o.id));

    return (
        <Autocomplete
            multiple
            disabled={disabled}
            loading={isLoading}
            options={options}
            value={selectedOptions}
            onChange={(_, newValue) => {
                const ids = newValue.map((o) => o.id);
                onChange(ids.length ? JSON.stringify(ids) : '');
            }}
            groupBy={(option) => option.categoryName ?? ''}
            getOptionLabel={(option) => option.description ?? `#${option.id}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    size="small"
                    sx={{
                        '& .MuiInputBase-input': { fontSize: '0.9062rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                        '& .MuiChip-label': { fontSize: '0.8438rem' },
                    }}
                />
            )}
            slotProps={{
                paper: {
                    sx: {
                        maxHeight: 420,
                        minWidth: 320,
                        '& .MuiAutocomplete-listbox': {
                            '& .MuiAutocomplete-option': { fontSize: '0.9062rem', minHeight: 44 },
                            '& .MuiListSubheader-root': { fontSize: '0.8438rem', fontWeight: 600 },
                        },
                    },
                },
            }}
        />
    );
}
