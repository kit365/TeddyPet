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
    Chip,
} from "@mui/material";
import { prefixAdmin } from "../../constants/routes";
import { ArrowIcon, EditIcon, EyeIcon, PrintIcon, ShareIcon } from "../../assets/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useBlogCategoryDetail, useUpdateBlogCategory } from "./hooks/useBlogCategory";
import dayjs from "dayjs";
import 'dayjs/locale/vi';
import { sharedContentStyles } from "../../components/layouts/titap/TiptapStyles";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { toast } from "react-toastify";
import ArticleIcon from '@mui/icons-material/Article';

export const BlogCategoryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: detailRes, isLoading, refetch } = useBlogCategoryDetail(id);
    const { mutate: updateCategory } = useUpdateBlogCategory();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    const category = detailRes?.data;

    if (!category) return <Box sx={{ textAlign: 'center', py: 5 }}>Không tìm thấy danh mục</Box>;

    const handleStatusChange = (event: SelectChangeEvent) => {
        const newStatus = event.target.value === 'true';
        updateCategory({ categoryId: category.categoryId, isActive: newStatus }, {
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
                    to={`/${prefixAdmin}/blog-category/list`}
                    color="inherit"
                    startIcon={<ArrowIcon sx={{ rotate: "90deg", width: 16, height: 16 }} />}
                    disableElevation
                    sx={{
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "1.125rem",
                        borderRadius: "8px",
                        p: 0,
                        mb: 1,
                        "&:hover": { backgroundColor: "transparent" }
                    }}
                >
                    {category.name}
                </Button>
                <Breadcrumb
                    items={[
                        { label: "Dashboard", to: "/" },
                        { label: "Danh mục bài viết", to: `/${prefixAdmin}/blog-category/list` },
                        { label: category.name }
                    ]}
                />
            </Box>

            {/* Toolbar */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => navigate(`/${prefixAdmin}/blog-category/edit/${category.categoryId}`)}>
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
                    <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', mb: 0.5 }}>Trạng thái</Typography>
                    <Select
                        value={category.isActive ? 'true' : 'false'}
                        onChange={handleStatusChange}
                        sx={{
                            fontSize: '0.875rem',
                            '& .MuiSelect-select': { py: 1 }
                        }}
                    >
                        <MenuItem value="true" sx={{ fontSize: '0.875rem' }}>Hoạt động</MenuItem>
                        <MenuItem value="false" sx={{ fontSize: '0.875rem' }}>Ngừng hoạt động</MenuItem>
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
                        {/* Icon/Image */}
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
                            {category.imageUrl ? (
                                <Box
                                    component="img"
                                    src={category.imageUrl}
                                    alt={category.name}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <ArticleIcon sx={{ fontSize: '1.875rem', color: '#f5576c' }} />
                            )}
                        </Box>

                        {/* Status Badge & Name */}
                        <Box sx={{ textAlign: 'right' }}>
                            <Box
                                component="span"
                                sx={{
                                    display: 'inline-block',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: category.isActive ? '#22c55e' : '#ef4444',
                                    color: '#fff',
                                    mb: 1
                                }}
                            >
                                {category.isActive ? 'Hoạt động' : 'Ngừng'}
                            </Box>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1C252E' }}>
                                {category.name}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Info Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Danh mục cha
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', color: category.parentName ? '#1C252E' : '#919EAB' }}>
                                {category.parentName || 'Không có'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Vị trí hiển thị
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', color: '#1C252E' }}>
                                {category.position || '--'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Ngày tạo
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', color: '#1C252E' }}>
                                {dayjs(category.createdAt).locale('vi').format('DD MMM YYYY')}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Cập nhật lần cuối
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', color: '#1C252E' }}>
                                {dayjs(category.updatedAt).locale('vi').format('DD MMM YYYY')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Slug */}
                    {category.slug && (
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 600, mb: 1 }}>
                                Đường dẫn (Slug)
                            </Typography>
                            <Chip
                                label={category.slug}
                                sx={{
                                    backgroundColor: '#f4f6f8',
                                    color: '#637381',
                                    fontWeight: 500,
                                    fontSize: '0.8125rem',
                                    fontFamily: 'monospace',
                                }}
                            />
                        </Box>
                    )}

                    <Divider sx={{ my: 4 }} />

                    {/* Description */}
                    <Typography sx={{ fontSize: '0.75rem', color: '#919EAB', fontWeight: 600, mb: 2 }}>
                        Mô tả danh mục
                    </Typography>
                    {category.description ? (
                        <Box sx={{ color: '#212B36', ...sharedContentStyles }}>
                            <div dangerouslySetInnerHTML={{ __html: category.description }} />
                        </Box>
                    ) : (
                        <Typography sx={{ fontSize: '0.875rem', color: '#919EAB', fontStyle: 'italic' }}>
                            Chưa có mô tả
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};
