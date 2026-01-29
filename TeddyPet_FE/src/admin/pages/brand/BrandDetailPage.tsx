import {
    Box,
    Button,
    Container,
    IconButton,
    Tooltip,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
} from "@mui/material";
import { prefixAdmin } from "../../constants/routes";
import { ArrowIcon, EditIcon, EyeIcon, PrintIcon, ShareIcon } from "../../assets/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useBrandDetail, useUpdateBrand } from "./hooks/useBrand";
import dayjs from "dayjs";
import 'dayjs/locale/vi';
import { sharedContentStyles } from "../../components/layouts/titap/TiptapStyles";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { toast } from "react-toastify";

export const BrandDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: detailRes, isLoading, refetch } = useBrandDetail(id);
    const { mutate: updateBrand } = useUpdateBrand();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    const brand = detailRes?.data;

    if (!brand) return <Box sx={{ textAlign: 'center', py: 5 }}>Không tìm thấy thương hiệu</Box>;

    const handleStatusChange = (event: SelectChangeEvent) => {
        const newStatus = event.target.value === 'true';
        updateBrand({ id: Number(id), data: { isActive: newStatus } }, {
            onSuccess: (res) => {
                if (res.success) {
                    toast.success("Cập nhật trạng thái thành công");
                    refetch();
                } else {
                    toast.error(res.message);
                }
            },
            onError: () => toast.error("Có lỗi xảy ra")
        });
    };

    return (
        <Container disableGutters maxWidth={false} sx={{ px: "40px", pb: 5 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Button
                    component={Link}
                    to={`/${prefixAdmin}/brand/list`}
                    color="inherit"
                    startIcon={<ArrowIcon sx={{ rotate: "90deg", width: 16, height: 16 }} />}
                    disableElevation
                    sx={{
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "1.8rem",
                        borderRadius: "8px",
                        p: 0,
                        mb: 1,
                        "&:hover": { backgroundColor: "transparent" }
                    }}
                >
                    {brand.name}
                </Button>
                <Breadcrumb
                    items={[
                        { label: "Dashboard", to: "/" },
                        { label: "Thương hiệu", to: `/${prefixAdmin}/brand/list` },
                        { label: brand.name }
                    ]}
                />
            </Box>

            {/* Toolbar */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => navigate(`/${prefixAdmin}/brand/edit/${brand.brandId}`)}>
                            <EditIcon sx={{ color: "#637381" }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Xem trước">
                        <IconButton>
                            <EyeIcon sx={{ color: "#637381" }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="In">
                        <IconButton>
                            <PrintIcon sx={{ color: "#637381" }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Chia sẻ">
                        <IconButton>
                            <ShareIcon sx={{ color: "#637381" }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Status Dropdown */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', mb: 0.5 }}>Trạng thái</Typography>
                    <Select
                        value={brand.isActive ? 'true' : 'false'}
                        onChange={handleStatusChange}
                        sx={{
                            fontSize: '1.4rem',
                            '& .MuiSelect-select': { py: 1 }
                        }}
                    >
                        <MenuItem value="true" sx={{ fontSize: '1.4rem' }}>Hoạt động</MenuItem>
                        <MenuItem value="false" sx={{ fontSize: '1.4rem' }}>Ngừng hoạt động</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Main Card */}
            <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 0 2px 0 rgba(145 158 171 / 20%), 0 12px 24px -4px rgba(145 158 171 / 12%)',
            }}>
                <CardContent sx={{ p: 5 }}>
                    {/* Header inside card */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
                        {/* Logo */}
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '12px',
                                backgroundColor: '#f4f6f8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {brand.logoUrl ? (
                                <Box
                                    component="img"
                                    src={brand.logoUrl}
                                    alt={brand.name}
                                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, color: '#667eea' }}>
                                    {brand.name?.charAt(0)}
                                </Typography>
                            )}
                        </Box>

                        {/* Status Badge & ID */}
                        <Box sx={{ textAlign: 'right' }}>
                            <Box
                                component="span"
                                sx={{
                                    display: 'inline-block',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    fontSize: '1.2rem',
                                    fontWeight: 700,
                                    backgroundColor: brand.isActive ? '#22c55e' : '#ef4444',
                                    color: '#fff',
                                    mb: 1
                                }}
                            >
                                {brand.isActive ? 'Hoạt động' : 'Ngừng'}
                            </Box>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1C252E' }}>
                                {brand.name}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Info Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
                        <Box>
                            <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Website
                            </Typography>
                            {brand.websiteUrl ? (
                                <Typography
                                    component="a"
                                    href={brand.websiteUrl}
                                    target="_blank"
                                    sx={{ fontSize: '1.4rem', color: '#006C9C', textDecoration: 'none' }}
                                >
                                    {brand.websiteUrl}
                                </Typography>
                            ) : (
                                <Typography sx={{ fontSize: '1.4rem', color: '#637381' }}>--</Typography>
                            )}
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Mã thương hiệu
                            </Typography>
                            <Typography sx={{ fontSize: '1.4rem', color: '#1C252E' }}>
                                BRAND-{brand.brandId}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
                        <Box>
                            <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Ngày tạo
                            </Typography>
                            <Typography sx={{ fontSize: '1.4rem', color: '#1C252E' }}>
                                {dayjs(brand.createdAt).locale('vi').format('DD MMM YYYY')}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Cập nhật lần cuối
                            </Typography>
                            <Typography sx={{ fontSize: '1.4rem', color: '#1C252E' }}>
                                {dayjs(brand.updatedAt).locale('vi').format('DD MMM YYYY')}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Description */}
                    <Typography sx={{ fontSize: '1.2rem', color: '#919EAB', fontWeight: 600, mb: 2 }}>
                        Mô tả thương hiệu
                    </Typography>
                    {brand.description ? (
                        <Box sx={{ color: '#212B36', ...sharedContentStyles }}>
                            <div dangerouslySetInnerHTML={{ __html: brand.description }} />
                        </Box>
                    ) : (
                        <Typography sx={{ fontSize: '1.4rem', color: '#919EAB', fontStyle: 'italic' }}>
                            Chưa có mô tả
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};
