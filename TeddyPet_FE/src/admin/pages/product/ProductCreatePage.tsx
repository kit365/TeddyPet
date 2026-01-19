import { Autocomplete, Box, createTheme, FormControl, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack, TextField, ThemeProvider, useTheme, Button } from "@mui/material"
import { useTranslation } from "react-i18next";
import { useProductTags, useProductAgeRanges } from "./hooks/useProduct";
import { Breadcrumb } from "../../components/ui/Breadcrumb"
import { Title } from "../../components/ui/Title"
import { useState } from "react"
import { Tiptap } from "../../components/layouts/titap/Tiptap"
import { UploadFiles } from "../../components/ui/UploadFiles"
import { CollapsibleCard } from "../../components/ui/CollapsibleCard"
import { prefixAdmin } from "../../constants/routes";
import { CategoryMultiTreeSelect } from "../../components/ui/CategoryMultiTreeSelect";
import { useNestedProductCategories } from "../product-category/hooks/useProductCategory";



interface CustomFile extends File {
    preview: string;
}

export const ProductCreatePage = () => {
    const { t } = useTranslation();
    const [expandedDetail, setExpandedDetail] = useState(true);
    const [expandedExtra, setExpandedExtra] = useState(true);
    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const [selectedTags, setSelectedTags] = useState<any[]>([]);
    const { data: tagOptions = [] as any[] } = useProductTags();

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const { data: productCategories = [] } = useNestedProductCategories();

    const [selectedAgeIds, setSelectedAgeIds] = useState<number[]>([]);
    const { data: ageRanges = [] } = useProductAgeRanges();

    const [files, setFiles] = useState<CustomFile[]>([]);

    const outerTheme = useTheme();

    const localTheme = createTheme(outerTheme, {
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none !important",
                        backdropFilter: "none !important",
                        backgroundColor: "#fff !important",
                        boxShadow: "0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f",
                        borderRadius: "16px",
                        color: "#1C252E",
                    },
                }
            },
            MuiAutocomplete: {
                styleOverrides: {
                    listbox: {
                        padding: 0,
                    },
                    option: {
                        fontSize: '1.4rem',
                        padding: '6px',
                        marginBottom: '4px',
                        borderRadius: '6px',

                    },
                },
            },
        }
    });

    const [status, setStatus] = useState<string>("draft");

    const handleChangeStatus = (event: SelectChangeEvent) => {
        setStatus(event.target.value as string);
    };

    const handleChangeAge = (event: SelectChangeEvent<number[]>) => {
        const value = event.target.value;
        setSelectedAgeIds(typeof value === 'string' ? value.split(',').map(Number) : value);
    };

    return (
        <>
            <div className="mb-[40px] gap-[16px] flex items-start justify-end">
                <div className="mr-auto">
                    <Title title={t('admin.product.title.create')} />
                    <Breadcrumb
                        items={[
                            { label: t('admin.dashboard'), to: "/" },
                            { label: t('admin.product.title.list'), to: `/${prefixAdmin}/product/list` },
                            { label: t('admin.common.create') }
                        ]}
                    />
                </div>
            </div>
            <ThemeProvider theme={localTheme}>
                <form action="">
                    <Stack sx={{
                        margin: "0px 120px",
                        gap: "40px"
                    }}>
                        <CollapsibleCard
                            title={t('admin.common.details')}
                            subheader={t('admin.common.description')}
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <TextField label={t('admin.product.fields.name')} fullWidth />
                                <TextField label={t('admin.product.fields.short_desc')} multiline rows={4} fullWidth />
                                <Tiptap />
                                <UploadFiles
                                    files={files}
                                    onFilesChange={(newFiles) => setFiles(newFiles)}
                                />
                            </Stack>
                        </CollapsibleCard>
                        <CollapsibleCard
                            title={t('admin.common.attributes')}
                            subheader={t('admin.common.description')}
                            expanded={expandedExtra}
                            onToggle={toggle(setExpandedExtra)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, 1fr)",
                                        gap: "24px 16px",
                                    }}
                                >
                                    <TextField label={t('admin.product.fields.sku')} name="sku" />
                                    <FormControl>
                                        <InputLabel
                                            id="status-select-label"
                                            sx={{
                                                color: "#637381",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {t('admin.common.status')}
                                        </InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            value={status}
                                            input={<OutlinedInput label={t('admin.common.status')} />}
                                            onChange={handleChangeStatus}
                                        >
                                            <MenuItem value="draft">{t('admin.product.status.draft')}</MenuItem>
                                            <MenuItem value="active">{t('admin.product.status.active')}</MenuItem>
                                            <MenuItem value="inactive">{t('admin.product.status.inactive')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField label={t('admin.common.position')} name="position" />
                                    <FormControl>
                                        <InputLabel
                                            id="age-select-label"
                                        >
                                            Độ tuổi
                                        </InputLabel>
                                        <Select
                                            labelId="age-select-label"
                                            multiple
                                            value={selectedAgeIds}
                                            onChange={handleChangeAge}
                                            input={<OutlinedInput label="Độ tuổi" />}
                                            renderValue={(selected) => {
                                                if (selected.length === 0) return "";
                                                const names = selected.map(id => {
                                                    const age = ageRanges.find((a: any) => a.id === id || a.ageRangeId === id);
                                                    return age?.name || age?.label || id;
                                                });
                                                return names.join(', ');
                                            }}
                                        >
                                            {ageRanges.map((age: any) => {
                                                const ageId = age.id || age.ageRangeId;
                                                return (
                                                    <MenuItem key={ageId} value={ageId}>
                                                        {age.name || age.label}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <CategoryMultiTreeSelect
                                    categories={productCategories}
                                    selectedIds={selectedCategoryIds}
                                    onChange={(ids) => setSelectedCategoryIds(ids)}
                                />
                                <Autocomplete
                                    multiple
                                    options={tagOptions}
                                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                    value={selectedTags}
                                    onChange={(_event, newValue) => {
                                        // This page seems to be using local state for now, not react-hook-form managed fully?
                                        // Keeping consistent with existing code style in this file
                                        setSelectedTags(newValue);
                                    }}
                                    filterSelectedOptions
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('admin.product.fields.tags')}
                                            placeholder={t('admin.product.fields.tags_placeholder')}
                                        />
                                    )}
                                    sx={{
                                        '& .MuiAutocomplete-clearIndicator': {
                                            color: "#637381",
                                            fontSize: "2.4rem",
                                            '& .MuiSvgIcon-root': {
                                                fontSize: '1.8rem',
                                            },
                                        },
                                        '& .MuiFormLabel-root': {
                                            color: "#919EAB",
                                            fontWeight: "400",
                                            '&.Mui-focused, &.MuiFormLabel-filled': {
                                                color: selectedTags.length > 0 || expandedDetail ? "#FF5630" : "#1C252E",
                                                fontWeight: "600",
                                            },
                                        },

                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: "#919eab33 !important",
                                            borderWidth: "1px !important",
                                            transition: 'border-color 0.2s',
                                        },

                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: "#FF5630 !important",
                                            borderWidth: "2px !important",
                                        },


                                        "& .MuiChip-root": {
                                            backgroundColor: "rgba(0, 184, 217, 0.16)",
                                            color: "#006C9C",
                                            fontSize: "1.3rem",
                                            height: "24px",
                                            borderRadius: "8px",
                                        },

                                        '& .MuiChip-label': {
                                            paddingLeft: "8px",
                                            paddingRight: "8px",
                                            fontWeight: "600"
                                        },

                                        "& .MuiChip-deleteIcon": {
                                            color: "rgb(0, 108, 156)",
                                            opacity: "0.48",
                                            fontSize: "1.5rem",
                                            marginRight: "4px",
                                            marginLeft: "-4px"
                                        },

                                        "& .MuiChip-deleteIcon:hover": {
                                            color: "rgb(0, 108, 156)",
                                            opacity: "0.8"
                                        },
                                    }}
                                />

                            </Stack>
                        </CollapsibleCard>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: "16px" }}>
                            <Button
                                variant="contained"
                                sx={{
                                    background: '#1C252E',
                                    fontWeight: 700,
                                    fontSize: "1.4rem",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    "&:hover": {
                                        background: "#454F5B",
                                    }
                                }}
                            >
                                {t('admin.product.title.create')}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </ThemeProvider>

        </>
    )
}