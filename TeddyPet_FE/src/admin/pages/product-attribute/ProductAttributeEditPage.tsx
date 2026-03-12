import {
    Box,
    Stack,
    TextField,
    ThemeProvider,
    useTheme,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    IconButton,
    Typography,
    Checkbox,
    ListItemText,
    CircularProgress
} from "@mui/material";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Title } from "../../components/ui/Title";
import { useState, useEffect } from "react";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import {
    useDisplayTypes,
    useSalesUnits,
    useMeasurementUnits,
    useProductAttributeDetail,
    useUpdateProductAttribute
} from "./hooks/useProductAttribute";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { getProductAttributeTheme } from "./configs/theme";
import { prefixAdmin } from "../../constants/routes";
import { toast } from "react-toastify";
import { z } from "zod";
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useParams } from "react-router-dom";

// Schema validation - flexible based on displayType
const attributeValueSchema = z.object({
    id: z.number().optional(),
    value: z.string().min(1, "Giá trị không được để trống"),
    amount: z.number().optional(),
    unit: z.string().optional(),
    displayCode: z.string().optional(),
});

const editAttributeSchema = z.object({
    name: z.string().min(1, "Tên thuộc tính không được để trống").max(100),
    displayType: z.string().min(1, "Vui lòng chọn kiểu hiển thị"),
    values: z.array(attributeValueSchema).min(1, "Phải có ít nhất 1 giá trị"),
    supportedUnits: z.array(z.string()).optional(),
});

type EditAttributeFormValues = z.infer<typeof editAttributeSchema>;

export const ProductAttributeEditPage = () => {
    const { id } = useParams();
    const [expandedDetail, setExpandedDetail] = useState(true);
    const [expandedValues, setExpandedValues] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();
    const localTheme = getProductAttributeTheme(outerTheme);

    // Fetch options
    const { data: displayTypes = [] } = useDisplayTypes();
    const { data: salesUnits = [] } = useSalesUnits();
    const { data: measurementUnits = [] } = useMeasurementUnits();

    // Fetch detail
    const { data: detailRes, isLoading: isLoadingDetail } = useProductAttributeDetail(id);

    const {
        control,
        handleSubmit,
        reset,
        watch
    } = useForm<EditAttributeFormValues>({
        resolver: zodResolver(editAttributeSchema),
        defaultValues: {
            name: "",
            displayType: "",
            values: [{ value: "", amount: 0, unit: "", displayCode: "" }],
            supportedUnits: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "values",
    });

    // Watch displayType to conditionally render fields
    const watchedDisplayType = watch("displayType");
    const isColorType = watchedDisplayType === "COLOR";

    // Populate form with detail data
    useEffect(() => {
        if (detailRes?.success && detailRes?.data) {
            const detail = detailRes.data;
            reset({
                name: detail.name || "",
                displayType: detail.displayType || "",
                supportedUnits: detail.supportedUnits || [],
                values: detail.values?.map((v: any) => ({
                    id: v.id,
                    value: v.value || "",
                    amount: v.amount || 0,
                    unit: v.unit || "",
                    displayCode: v.displayCode || "",
                })) || [{ value: "", amount: 0, unit: "", displayCode: "" }],
            });
        }
    }, [detailRes, reset]);

    // Update mutation
    const { mutate: update, isPending } = useUpdateProductAttribute();

    const onSubmit = (data: EditAttributeFormValues) => {
        // Transform data based on displayType
        const transformedData = {
            name: data.name,
            displayType: data.displayType,
            supportedUnits: data.supportedUnits,
            values: data.values.map(v => {
                if (isColorType) {
                    // For COLOR type: displayCode has value, amount and unit are null
                    return {
                        id: v.id,
                        value: v.value,
                        displayCode: v.displayCode || null,
                        amount: null,
                        unit: null,
                    };
                } else {
                    // For other types: amount and unit have values, displayCode is null
                    return {
                        id: v.id,
                        value: v.value,
                        amount: v.amount || null,
                        unit: v.unit || null,
                        displayCode: null,
                    };
                }
            }),
        };

        console.log(transformedData);

        update({ id: id!, data: transformedData }, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Cập nhật thuộc tính thành công!");
                } else {
                    toast.error(response.message);
                }
            },
            onError: () => {
                toast.error("Có lỗi xảy ra khi cập nhật thuộc tính");
            }
        });
    };

    if (isLoadingDetail) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title="Chỉnh sửa thuộc tính" />
                    <Breadcrumb
                        items={[
                            { label: "Dashboard", to: "/" },
                            { label: "Thuộc tính sản phẩm", to: `/${prefixAdmin}/product/attribute/list` },
                            { label: "Chỉnh sửa" }
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{
                        margin: "0px 120px",
                        gap: "40px"
                    }}>
                        {/* Thông tin cơ bản */}
                        <CollapsibleCard
                            title="Thông tin thuộc tính"
                            subheader="Cập nhật thông tin cơ bản của thuộc tính"
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, 1fr)",
                                        gap: "24px 16px",
                                    }}
                                >
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Tên thuộc tính"
                                                placeholder="Ví dụ: Màu sắc, Kích cỡ..."
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="displayType"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <FormControl error={!!fieldState.error}>
                                                <InputLabel>Kiểu hiển thị</InputLabel>
                                                <Select
                                                    {...field}
                                                    label="Kiểu hiển thị"
                                                >
                                                    {displayTypes.map((type: any) => (
                                                        <MenuItem
                                                            key={type.value}
                                                            value={type.value}
                                                            sx={{ fontSize: '0.875rem' }}
                                                        >
                                                            {type.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {fieldState.error && (
                                                    <Typography
                                                        sx={{
                                                            color: '#d32f2f',
                                                            fontSize: '0.75rem',
                                                            mt: 0.5,
                                                            ml: 1.75
                                                        }}
                                                    >
                                                        {fieldState.error.message}
                                                    </Typography>
                                                )}
                                            </FormControl>
                                        )}
                                    />
                                </Box>

                                {/* Đơn vị hỗ trợ */}
                                {!isColorType && (
                                    <Controller
                                        name="supportedUnits"
                                        control={control}
                                        render={({ field, fieldState }) => {
                                            const allUnitCodes = measurementUnits.map((u: any) => u.code);
                                            const selected = field.value || [];
                                            const isAllSelected = allUnitCodes.length > 0 && selected.length === allUnitCodes.length;
                                            const isIndeterminate = selected.length > 0 && selected.length < allUnitCodes.length;

                                            const handleChange = (event: any) => {
                                                const {
                                                    target: { value },
                                                } = event;

                                                // Handle Select All
                                                if (value.includes('SELECT_ALL')) {
                                                    if (isAllSelected) {
                                                        field.onChange([]);
                                                    } else {
                                                        field.onChange(allUnitCodes);
                                                    }
                                                    return;
                                                }

                                                // On autofill we get a stringified value.
                                                const newValue = typeof value === 'string' ? value.split(',') : value;
                                                field.onChange(newValue);
                                            };

                                            return (
                                                <FormControl error={!!fieldState.error} fullWidth>
                                                    <InputLabel>Đơn vị hỗ trợ</InputLabel>
                                                    <Select
                                                        labelId="supported-units-label"
                                                        multiple
                                                        value={selected}
                                                        onChange={handleChange}
                                                        label="Đơn vị hỗ trợ"
                                                        renderValue={(selected) => {
                                                            const selectedUnits = measurementUnits.filter((u: any) => selected.includes(u.code));
                                                            return selectedUnits.map((u: any) => u.label).join(', ');
                                                        }}
                                                        MenuProps={{
                                                            PaperProps: {
                                                                style: {
                                                                    maxHeight: 224,
                                                                    width: 250,
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <MenuItem
                                                            value="SELECT_ALL"
                                                            sx={{ fontWeight: 600, py: 1 }}
                                                        >
                                                            <Checkbox
                                                                checked={isAllSelected}
                                                                indeterminate={isIndeterminate}
                                                            />
                                                            <ListItemText primary="Chọn tất cả" primaryTypographyProps={{ style: { fontSize: '0.875rem', fontWeight: 600 } }} />
                                                        </MenuItem>
                                                        {measurementUnits.map((unit: any) => (
                                                            <MenuItem key={unit.code} value={unit.code}>
                                                                <Checkbox checked={selected.indexOf(unit.code) > -1} />
                                                                <ListItemText
                                                                    primary={`${unit.label} (${unit.symbol})`}
                                                                    primaryTypographyProps={{ style: { fontSize: '0.875rem' } }}
                                                                />
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {fieldState.error && (
                                                        <Typography
                                                            sx={{
                                                                color: '#d32f2f',
                                                                fontSize: '0.75rem',
                                                                mt: 0.5,
                                                                ml: 1.75
                                                            }}
                                                        >
                                                            {fieldState.error.message}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            );
                                        }}
                                    />
                                )}
                            </Stack>
                        </CollapsibleCard>

                        {/* Danh sách giá trị */}
                        <CollapsibleCard
                            title="Danh sách giá trị"
                            subheader={isColorType ? "Chỉnh sửa các màu sắc cho thuộc tính" : "Chỉnh sửa các giá trị cho thuộc tính này"}
                            expanded={expandedValues}
                            onToggle={toggle(setExpandedValues)}
                        >
                            <Stack p="24px" gap="16px">
                                {fields.map((field, index) => (
                                    <Box
                                        key={field.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "16px",
                                        }}
                                    >
                                        {isColorType ? (
                                            // COLOR type: Tên màu + Mã màu với preview
                                            <>
                                                <Controller
                                                    name={`values.${index}.value`}
                                                    control={control}
                                                    render={({ field: inputField, fieldState }) => (
                                                        <TextField
                                                            {...inputField}
                                                            label="Tên màu"
                                                            placeholder="Ví dụ: Đỏ, Xanh..."
                                                            error={!!fieldState.error}
                                                            helperText={fieldState.error?.message}
                                                            sx={{ flex: 1 }}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    name={`values.${index}.displayCode`}
                                                    control={control}
                                                    render={({ field: inputField }) => {
                                                        const colorValue = inputField.value || '';
                                                        const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(colorValue);

                                                        return (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <TextField
                                                                    {...inputField}
                                                                    label="Mã màu"
                                                                    placeholder="#FF0000"
                                                                    sx={{ width: 150 }}
                                                                />
                                                                {/* Color preview box - cập nhật khi nhập mã màu */}
                                                                <Box
                                                                    sx={{
                                                                        width: 48,
                                                                        height: 48,
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #919eab33',
                                                                        backgroundColor: isValidHex ? colorValue : '#f4f6f8',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        position: 'relative',
                                                                        overflow: 'hidden',
                                                                        cursor: 'pointer',
                                                                        transition: 'background-color 0.2s',
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="color"
                                                                        value={isValidHex ? colorValue : '#000000'}
                                                                        onChange={(e) => inputField.onChange(e.target.value.toUpperCase())}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            opacity: 0,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    />
                                                                    {!isValidHex && (
                                                                        <Typography sx={{ fontSize: '0.625rem', color: '#919EAB' }}>
                                                                            ?
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        );
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            // Other types: Giá trị + Đơn vị (nhãn tự động)
                                            <>
                                                <Controller
                                                    name={`values.${index}.amount`}
                                                    control={control}
                                                    render={({ field: inputField, fieldState }) => (
                                                        <TextField
                                                            {...inputField}
                                                            type="number"
                                                            label="Giá trị"
                                                            placeholder="0"
                                                            error={!!fieldState.error}
                                                            helperText={fieldState.error?.message}
                                                            onChange={(e) => {
                                                                const numValue = Number(e.target.value);
                                                                inputField.onChange(numValue);
                                                            }}
                                                            sx={{ width: 150 }}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    name={`values.${index}.unit`}
                                                    control={control}
                                                    render={({ field: inputField }) => {
                                                        const supportedUnits = watch('supportedUnits');
                                                        const displayedUnits = measurementUnits.filter((u: any) =>
                                                            !supportedUnits?.length || supportedUnits.includes(u.code)
                                                        );

                                                        return (
                                                            <FormControl sx={{ width: 180 }}>
                                                                <InputLabel>Đơn vị</InputLabel>
                                                                <Select
                                                                    {...inputField}
                                                                    label="Đơn vị"
                                                                >
                                                                    {displayedUnits.map((unit: any) => (
                                                                        <MenuItem
                                                                            key={unit.code}
                                                                            value={unit.code}
                                                                            sx={{ fontSize: '0.875rem' }}
                                                                        >
                                                                            {unit.label} ({unit.symbol})
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        );
                                                    }}
                                                />
                                                <Controller
                                                    name={`values.${index}.value`}
                                                    control={control}
                                                    render={({ field: inputField }) => {
                                                        // Auto-generate label from amount + unit
                                                        const amount = watch(`values.${index}.amount`);
                                                        const unitCode = watch(`values.${index}.unit`);
                                                        const unit = measurementUnits.find((u: any) => u.code === unitCode);
                                                        const autoLabel = amount && unit ? `${amount} ${unit.symbol}` : '';

                                                        // Update value when amount or unit changes
                                                        if (autoLabel && inputField.value !== autoLabel) {
                                                            inputField.onChange(autoLabel);
                                                        }

                                                        return (
                                                            <TextField
                                                                {...inputField}
                                                                label="Nhãn (tự động)"
                                                                placeholder="Ví dụ: 5 kg"
                                                                disabled
                                                                sx={{
                                                                    flex: 1,
                                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                                        WebkitTextFillColor: '#1C252E',
                                                                    }
                                                                }}
                                                            />
                                                        );
                                                    }}
                                                />
                                            </>
                                        )}
                                        <IconButton
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                            sx={{
                                                mt: 1,
                                                color: fields.length === 1 ? '#919EAB' : '#FF5630',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 86, 48, 0.08)'
                                                }
                                            }}
                                        >
                                            <DeleteOutlineIcon />
                                        </IconButton>
                                    </Box>
                                ))}

                                <Button
                                    type="button"
                                    onClick={() => append({ value: "", amount: 0, unit: "", displayCode: "" })}
                                    startIcon={<AddIcon />}
                                    sx={{
                                        alignSelf: 'flex-start',
                                        color: '#00A76F',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 167, 111, 0.08)'
                                        }
                                    }}
                                >
                                    {isColorType ? "Thêm màu" : "Thêm giá trị"}
                                </Button>
                            </Stack>
                        </CollapsibleCard>

                        {/* Submit button */}
                        <Box gap="24px" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            <Button
                                type="submit"
                                disabled={isPending}
                                sx={{
                                    background: '#1C252E',
                                    minHeight: "3rem",
                                    minWidth: "4rem",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    padding: "8px 22px",
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    boxShadow: "none",
                                    "&:hover": {
                                        background: "#454F5B",
                                        boxShadow: "0 8px 16px 0 rgba(145 158 171 / 16%)"
                                    }
                                }}
                                variant="contained"
                            >
                                {isPending ? "Đang cập nhật..." : "Cập nhật thuộc tính"}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>
        </>
    )
}
