import { Box, Stack, TextField, ThemeProvider, useTheme, Button, CircularProgress, Typography } from "@mui/material";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Title } from "../../components/ui/Title";
import { Tiptap } from "../../components/layouts/titap/Tiptap";
import { useState, useEffect } from "react";
import { CollapsibleCard } from "../../components/ui/CollapsibleCard";
import { useBrandDetail, useUpdateBrand } from "./hooks/useBrand";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { createBrandSchema, CreateBrandFormValues } from "../../schemas/brand.schema";
import { SwitchButton } from "../../components/ui/SwitchButton";
import { getBrandTheme } from "./configs/theme";
import { prefixAdmin } from "../../constants/routes";
import { FormUploadSingleFile } from "../../components/upload/FormUploadSingleFile";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

export const BrandEditPage = () => {
    const { id } = useParams();
    const [expandedDetail, setExpandedDetail] = useState(true);

    const toggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
        () => setter(prev => !prev);

    const outerTheme = useTheme();
    const localTheme = getBrandTheme(outerTheme);

    const { data: detailRes, isLoading: isLoadingDetail } = useBrandDetail(id);
    const { mutate: update, isPending: isUpdating } = useUpdateBrand();

    const {
        control,
        handleSubmit,
        reset,
    } = useForm<CreateBrandFormValues>({
        resolver: zodResolver(createBrandSchema),
        defaultValues: {
            name: "",
            websiteUrl: "",
            description: "",
            isActive: true,
            logoUrl: "",
        },
    });

    useEffect(() => {
        if (detailRes?.success && detailRes?.data) {
            const detail = detailRes.data;
            reset({
                name: detail.name || "",
                websiteUrl: detail.websiteUrl || "",
                description: detail.description || "",
                isActive: detail.isActive,
                logoUrl: detail.logoUrl || "",
            });
        }
    }, [detailRes, reset]);

    const onSubmit = (data: CreateBrandFormValues) => {
        update({ id: Number(id), data }, {
            onSuccess: (response) => {
                if (response.success) {
                    toast.success(response.message || "Cập nhật thương hiệu thành công");
                } else {
                    toast.error(response.message);
                }
            },
            onError: () => {
                toast.error("Có lỗi xảy ra trong quá trình cập nhật");
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
                    <Title title="Chỉnh sửa thương hiệu" />
                    <Breadcrumb
                        items={[
                            { label: "Dashboard", to: "/" },
                            { label: "Thương hiệu", to: `/${prefixAdmin}/brand/list` },
                            { label: "Chỉnh sửa" }
                        ]}
                    />
                </div>
            </div>

            <ThemeProvider theme={localTheme}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack sx={{ margin: "0px 120px", gap: "40px" }}>
                        <Box>
                            <Box gap="16px" sx={{ display: "flex", alignItems: "center" }}>
                                <SwitchButton control={control} name="isActive" />
                            </Box>
                        </Box>

                        <CollapsibleCard
                            title="Chi tiết"
                            subheader="Cập nhật tiêu đề và hình ảnh thương hiệu"
                            expanded={expandedDetail}
                            onToggle={toggle(setExpandedDetail)}
                        >
                            <Stack p="24px" gap="24px">
                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 16px" }}>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Tên thương hiệu"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="websiteUrl"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                label="Website URL"
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                                fullWidth
                                            />
                                        )}
                                    />
                                </Box>

                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <Tiptap
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />

                                <FormUploadSingleFile
                                    name="logoUrl"
                                    control={control}
                                />
                            </Stack>
                        </CollapsibleCard>
                    </Stack>

                    {/* ———————————————— STICKY FOOTER ———————————————— */}
                    <Box sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backdropFilter: 'blur(8px)',
                        background: 'rgba(255,255,255,0.85)',
                        borderTop: '1px solid #919eab33',
                        py: '16px',
                        px: { xs: '20px', lg: '120px' },
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                    }}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => navigate(`/${prefixAdmin}/brand/list`)}
                            sx={{
                                minHeight: '2.75rem',
                                minWidth: '6rem',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                padding: '6px 22px',
                                borderRadius: '8px',
                                textTransform: 'none',
                                borderColor: '#919eab52',
                                color: '#637381',
                                '&:hover': {
                                    borderColor: '#1C252E',
                                    color: '#1C252E',
                                    background: 'rgba(145, 158, 171, 0.08)',
                                },
                            }}
                        >
                            Thoát
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isUpdating}
                            sx={{
                                background: '#1C252E',
                                minHeight: '2.75rem',
                                minWidth: '10rem',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                padding: '6px 28px',
                                borderRadius: '8px',
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    background: '#454F5B',
                                    boxShadow: '0 8px 16px 0 rgba(145 158 171 / 16%)',
                                },
                            }}
                        >
                            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thương hiệu'}
                        </Button>
                    </Box>
                </form>
            </ThemeProvider>
        </>
    );
};
