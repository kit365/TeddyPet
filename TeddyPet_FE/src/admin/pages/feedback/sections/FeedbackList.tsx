import Card from '@mui/material/Card';
import { TextField, InputAdornment, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Stack, Tabs, Tab, Avatar, Typography, IconButton, Checkbox, Chip, MenuItem, Select, CircularProgress, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ReplyIcon from '@mui/icons-material/Reply';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getAllFeedbacks, deleteFeedback, replyFeedback, editFeedbackAsAdmin, getFeedbackStats, FeedbackResponse, FeedbackStatsResponse, getAllBookingReviews, getBookingReviewStats, BookingReviewResponse } from '../../../../api/feedback.api';
import { toast } from 'react-toastify';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../../../api/auth.api';
import { getAllProducts } from '../../../api/product.api';

const dataGridCardStyles = {
    borderRadius: '16px',
    boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
    backgroundColor: 'rgb(255, 255, 255)',
    display: 'flex',
    flexDirection: 'column',
};

export const FeedbackList = () => {
    const [reviewSource, setReviewSource] = useState<"product" | "booking">("product");
    const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
    const [bookingReviews, setBookingReviews] = useState<BookingReviewResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
    const [tabFilter, setTabFilter] = useState<"all" | "unreplied" | "replied">("all");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [stats, setStats] = useState<FeedbackStatsResponse | null>(null);
    const [bookingStats, setBookingStats] = useState<FeedbackStatsResponse | null>(null);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    // Modals
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productSearchKeyword, setProductSearchKeyword] = useState("");

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [confirming, setConfirming] = useState(false);

    // Reply States
    const [replyingId, setReplyingId] = useState<number | null>(null);
    const [replyComment, setReplyComment] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    // Edit States
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editComment, setEditComment] = useState("");
    const [submittingEdit, setSubmittingEdit] = useState(false);

    const { data: meRes } = useQuery({ queryKey: ["me-admin"], queryFn: () => getMe() });
    const isAdminRole = (meRes as any)?.data?.role === 'ADMIN' || (meRes as any)?.data?.role === 'SUPER_ADMIN';

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const response = await getAllFeedbacks();
            setFeedbacks(response.data);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
            toast.error("Không thể tải danh sách đánh giá");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getFeedbackStats();
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching feedback stats:", error);
        }
    };

    const fetchBookingReviews = async () => {
        try {
            const response = await getAllBookingReviews();
            setBookingReviews(response.data || []);
        } catch (error) {
            console.error("Error fetching booking reviews:", error);
            setBookingReviews([]);
        }
    };

    const fetchBookingStats = async () => {
        try {
            const response = await getBookingReviewStats();
            setBookingStats(response.data);
        } catch (error) {
            console.error("Error fetching booking review stats:", error);
        }
    };

    const fetchAllProductsList = async () => {
        try {
            const response = await getAllProducts();
            setAllProducts(response.data || []);
        } catch (error) {
            console.error("Error fetching all products:", error);
            setAllProducts([]);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
        fetchStats();
        fetchBookingReviews();
        fetchBookingStats();
        fetchAllProductsList();
    }, []);


    const handleDelete = async () => {
        if (!deleteId) return;
        setConfirming(true);
        try {
            await deleteFeedback(deleteId);
            toast.success("Đã xóa đánh giá thành công");
            setFeedbacks(feedbacks.filter(f => f.id !== deleteId));
        } catch (error) {
            toast.error("Không thể xóa đánh giá");
        } finally {
            setConfirming(false);
            setDeleteId(null);
        }
    };

    const handleReply = async (feedbackId: number) => {
        if (!replyComment.trim()) {
            toast.warn("Vui lòng nhập nội dung phản hồi");
            return;
        }
        setSubmittingReply(true);
        try {
            const response = await replyFeedback(feedbackId, replyComment.trim());
            toast.success("Đã gửi phản hồi thành công");
            setFeedbacks(feedbacks.map(f => f.id === feedbackId ? response.data : f));
            setReplyingId(null);
            setReplyComment("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể gửi phản hồi");
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleEditSubmit = async (feedbackId: number) => {
        if (!editComment.trim()) {
            toast.warn("Nội dung không được để trống");
            return;
        }
        setSubmittingEdit(true);
        try {
            const response = await editFeedbackAsAdmin(feedbackId, editComment.trim());
            toast.success("Đã lưu nội dung đánh giá");
            setFeedbacks(feedbacks.map(f => f.id === feedbackId ? response.data : f));
            setEditingId(null);
            setEditComment("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể sửa đánh giá");
        } finally {
            setSubmittingEdit(false);
        }
    };

    const filteredProductOptions = useMemo(() => {
        return allProducts.filter(p => 
            p.name.toLowerCase().includes(productSearchKeyword.toLowerCase())
        );
    }, [allProducts, productSearchKeyword]);

    const toggleProductSelection = (product: string) => {
        setSelectedProducts(prev =>
            prev.includes(product)
                ? prev.filter(p => p !== product)
                : [...prev, product]
        );
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        const matchesKeyword =
            (f.userName?.toLowerCase() || f.guestName?.toLowerCase() || "").includes(searchKeyword.toLowerCase()) ||
            f.productName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            f.comment.toLowerCase().includes(searchKeyword.toLowerCase());

        const matchesRating = ratingFilter === "all" || f.rating === ratingFilter;
        const matchesProduct = selectedProducts.length === 0 || selectedProducts.includes(f.productName);
        const matchesTab =
            tabFilter === "all" ||
            (tabFilter === "replied" && f.replyComment) ||
            (tabFilter === "unreplied" && !f.replyComment);
        return matchesKeyword && matchesRating && matchesProduct && matchesTab;
    });

    const filteredBookingReviews = bookingReviews.filter((r) => {
        const keyword = searchKeyword.toLowerCase();
        const matchesKeyword =
            (r.customerName || "").toLowerCase().includes(keyword) ||
            (r.bookingCode || "").toLowerCase().includes(keyword) ||
            (r.serviceName || "").toLowerCase().includes(keyword) ||
            (r.comment || "").toLowerCase().includes(keyword);
        const matchesRating = ratingFilter === "all" || r.rating === ratingFilter;
        return matchesKeyword && matchesRating;
    });

    // Pagination logic
    const activeRowsCount = reviewSource === "product" ? filteredFeedbacks.length : filteredBookingReviews.length;
    const totalPages = Math.ceil(activeRowsCount / ITEMS_PER_PAGE);
    const paginatedFeedbacks = filteredFeedbacks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const paginatedBookingReviews = filteredBookingReviews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchKeyword, ratingFilter, tabFilter, selectedProducts]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: any) => {
        setTabFilter(newValue);
    };
    const activeStats = reviewSource === "product" ? stats : bookingStats;



    return (
        <Stack spacing={3}>
            <Card sx={{ p: 1, borderRadius: '12px', boxShadow: 'none', border: '1px solid rgba(145, 158, 171, 0.2)' }}>
                <Tabs
                    value={reviewSource}
                    onChange={(_, v) => setReviewSource(v)}
                    sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 } }}
                >
                    <Tab value="product" label="Đánh giá sản phẩm" />
                    <Tab value="booking" label="Đánh giá đơn booking" />
                </Tabs>
            </Card>

            {/* Stats Overview */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5, borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(145, 158, 171, 0.2)' }}>
                    <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(255, 171, 0, 0.08)', color: '#FFAB00', display: 'flex' }}>
                        <StarIcon sx={{ fontSize: '1.6rem' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.15rem', lineHeight: 1.2 }}>{activeStats?.averageRating?.toFixed(1) || '0.0'}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Điểm trung bình</Typography>
                    </Box>
                </Card>

                <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5, borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(145, 158, 171, 0.2)' }}>
                    <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(0, 184, 217, 0.08)', color: '#00B8D9', display: 'flex' }}>
                        <RateReviewIcon sx={{ fontSize: '1.6rem' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.15rem', lineHeight: 1.2 }}>{activeStats?.totalReviews || 0}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Tổng đánh giá</Typography>
                    </Box>
                </Card>

                <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5, borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(145, 158, 171, 0.2)' }}>
                    <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.08)', color: '#22C55E', display: 'flex' }}>
                        <TrendingUpIcon sx={{ fontSize: '1.6rem' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.15rem', lineHeight: 1.2 }}>+{activeStats?.todayReviews || 0}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Mới hôm nay</Typography>
                    </Box>
                </Card>
            </Box>

            <Card sx={{ ...dataGridCardStyles, minHeight: '600px', flex: 1 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #919eab1f' }}>
                    <Stack spacing={3}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                            <TextField
                                placeholder="Tìm kiếm nội dung, khách hàng..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.disabled', fontSize: '1.2rem' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.875rem', height: '44px' } }}
                            />


                            <Select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value as any)}
                                displayEmpty
                                sx={{ width: { xs: '100%', md: 150 }, borderRadius: '12px', fontSize: '0.875rem', height: '44px' }}
                            >
                                <MenuItem value="all">Tất cả sao</MenuItem>
                                <MenuItem value={5}>5 Sao</MenuItem>
                                <MenuItem value={4}>4 Sao</MenuItem>
                                <MenuItem value={3}>3 Sao</MenuItem>
                                <MenuItem value={2}>2 Sao</MenuItem>
                                <MenuItem value={1}>1 Sao</MenuItem>
                            </Select>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<FilterListIcon />}
                                onClick={() => setProductModalOpen(true)}
                                sx={{ height: '44px', borderRadius: '12px', px: 3, fontSize: '0.875rem', fontWeight: 600, borderColor: selectedProducts.length > 0 ? '#00AB55' : 'rgba(145, 158, 171, 0.32)', color: selectedProducts.length > 0 ? '#00AB55' : 'inherit' }}
                            >
                                {selectedProducts.length > 0 ? `SP (${selectedProducts.length})` : 'Sản phẩm'}
                            </Button>
                        </Stack>

                        {reviewSource === "product" && <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabFilter} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontSize: '0.9375rem', fontWeight: 700, textTransform: 'none', minWidth: 100, color: '#637381' }, '& .Mui-selected': { color: '#00AB55 !important' }, '& .MuiTabs-indicator': { backgroundColor: '#00AB55' } }}>
                                <Tab label="Tất cả" value="all" />
                                <Tab label="Chưa phản hồi" value="unreplied" />
                                <Tab label="Đã phản hồi" value="replied" />
                            </Tabs>
                        </Box>}
                    </Stack>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: '#f9fafb' }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress sx={{ color: '#00AB55' }} /></Box>
                    ) : activeRowsCount === 0 ? (
                        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" color="text.secondary">
                            <FilterListIcon sx={{ fontSize: '3rem', opacity: 0.2, mb: 1 }} />
                            <Typography fontSize="0.9375rem" fontWeight={600}>Không tìm thấy đánh giá</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={3}>
                            {reviewSource === "product" && paginatedFeedbacks.map((fb) => (
                                <Card key={fb.id} sx={{ p: 2.5, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={{ xs: 2, md: 4 }}>
                                        <Box flexShrink={0} sx={{ width: { xs: '100%', md: '280px' }, borderRight: { md: '1px solid #f0f0f0' }, pr: { md: 2 } }}>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                <Avatar src={fb.productImage} variant="rounded" sx={{ width: 64, height: 64, borderRadius: '8px' }} />
                                                <Box flex={1} overflow="hidden">
                                                    <Typography fontSize="0.875rem" fontWeight={700} sx={{ color: '#212B36' }} noWrap title={fb.productName}>{fb.productName}</Typography>
                                                    {fb.variantName && <Typography fontSize="0.75rem" color="text.secondary" mt={0.5}>{fb.variantName}</Typography>}
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box flex={1}>
                                            <Box display="flex" alignItems="flex-start" gap={2}>
                                                <Avatar src={`https://ui-avatars.com/api/?name=${fb.userName || fb.guestName || 'G'}&background=random`} sx={{ width: 48, height: 48 }} />
                                                <Box flex={1}>
                                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                                        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5}>
                                                            <Typography fontWeight={700} fontSize="0.875rem">{fb.userName || fb.guestName || "Khách"}</Typography>
                                                            {fb.isPurchased && <Chip label="Đã mua" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }} />}
                                                            {fb.orderCode && <Typography fontSize="0.75rem" sx={{ color: '#00AB55', bgcolor: 'rgba(0, 171, 85, 0.08)', px: 1, py: 0.2, borderRadius: '4px', fontWeight: 700 }}>#{fb.orderCode}</Typography>}
                                                        </Box>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            {isAdminRole && <IconButton onClick={() => { setEditingId(fb.id); setEditComment(fb.comment); }} size="small"><EditOutlinedIcon fontSize="small" /></IconButton>}
                                                            <IconButton onClick={() => setDeleteId(fb.id)} size="small" color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
                                                        </Box>
                                                    </Box>

                                                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                                        <Box display="flex">{[...Array(5)].map((_, i) => <StarIcon key={i} sx={{ color: i < fb.rating ? '#FFAB00' : '#dfe3e8', fontSize: '1.5rem' }} />)}</Box>
                                                        <Typography color="text.secondary" fontSize="0.75rem">{new Date(fb.createdAt).toLocaleDateString("vi-VN")}</Typography>
                                                    </Box>

                                                    {editingId === fb.id ? (
                                                        <Box>
                                                            <TextField fullWidth multiline rows={2} value={editComment} onChange={(e) => setEditComment(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '12px' } }} />
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
                                                                <Button size="small" onClick={() => setEditingId(null)}>Hủy</Button>
                                                                <Button variant="contained" color="primary" size="small" onClick={() => handleEditSubmit(fb.id)} disabled={submittingEdit}>Lưu</Button>
                                                            </Stack>
                                                        </Box>
                                                    ) : <Typography fontSize="0.875rem" sx={{ wordBreak: 'break-word', mb: 2 }}>{fb.comment}</Typography>}

                                                    {fb.replyComment ? (
                                                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f4f6f8', borderRadius: '12px', borderLeft: '3px solid #00AB55' }}>
                                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                                <Avatar sx={{ width: 20, height: 20, fontSize: '1rem' }}>TP</Avatar>
                                                                <Typography fontWeight={700} fontSize="0.8125rem" color="#00AB55">TeddyPet Phản hồi</Typography>
                                                            </Box>
                                                            <Typography fontSize="0.8125rem">{fb.replyComment}</Typography>
                                                        </Box>
                                                    ) : replyingId === fb.id ? (
                                                        <Box sx={{ mt: 2 }}>
                                                            <TextField fullWidth multiline rows={2} placeholder="Nhập phản hồi..." value={replyComment} onChange={(e) => setReplyComment(e.target.value)} sx={{ mb: 1, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem', borderRadius: '12px' } }} />
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Button size="small" onClick={() => setReplyingId(null)}>Hủy</Button>
                                                                <Button variant="contained" color="primary" size="small" onClick={() => handleReply(fb.id)} disabled={submittingReply}>Gửi</Button>
                                                            </Stack>
                                                        </Box>
                                                    ) : <Button startIcon={<ReplyIcon />} onClick={() => setReplyingId(fb.id)} sx={{ mt: 1, fontSize: '0.75rem', textTransform: 'none' }}>Trả lời</Button>}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                            {reviewSource === "booking" && paginatedBookingReviews.map((rv) => (
                                <Card key={rv.id} sx={{ p: 2.5, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                                    <Box display="flex" flexDirection="column" gap={1.2}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                            <Typography fontWeight={800} fontSize="0.95rem">#{rv.bookingCode} - {rv.customerName || "Khách hàng"}</Typography>
                                            <Typography fontSize="0.75rem" color="text.secondary">
                                                {rv.createdAt ? new Date(rv.createdAt).toLocaleString("vi-VN") : "-"}
                                            </Typography>
                                        </Box>
                                        <Typography fontSize="0.875rem" color="text.secondary">{rv.serviceName || "Dịch vụ booking"}</Typography>
                                        <Box display="flex">{[...Array(5)].map((_, i) => <StarIcon key={i} sx={{ color: i < rv.rating ? '#FFAB00' : '#dfe3e8', fontSize: '1.5rem' }} />)}</Box>
                                        <Typography fontSize="0.875rem" sx={{ wordBreak: 'break-word' }}>{rv.comment || "Không có nội dung bình luận."}</Typography>
                                    </Box>
                                </Card>
                            ))}

                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                                    <Pagination 
                                        count={totalPages} 
                                        page={page} 
                                        onChange={(_, v) => setPage(v)} 
                                        color="primary"
                                        sx={{
                                            '& .MuiPaginationItem-root': { fontWeight: 700 },
                                            '& .Mui-selected': { bgcolor: 'rgba(0, 171, 85, 0.08) !important', color: '#00AB55' }
                                        }}
                                    />
                                </Box>
                            )}
                        </Stack>
                    )}
                </Box>
            </Card>

            {/* Modals */}
            <Dialog open={productModalOpen} onClose={() => setProductModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Lọc theo sản phẩm</DialogTitle>
                <DialogContent>
                    <TextField 
                        fullWidth 
                        placeholder="Tìm sản phẩm..." 
                        value={productSearchKeyword} 
                        onChange={(e) => setProductSearchKeyword(e.target.value)} 
                        sx={{ mt: 1, mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled', fontSize: '1rem' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Đã chọn {selectedProducts.length} sản phẩm
                        </Typography>
                        <Button 
                            size="small" 
                            onClick={() => {
                                if (selectedProducts.length === allProducts.length) {
                                    setSelectedProducts([]);
                                } else {
                                    setSelectedProducts(allProducts.map(p => p.name));
                                }
                            }}
                        >
                            {selectedProducts.length === allProducts.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </Button>
                    </Box>
                    <Box sx={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #919eab1f', borderRadius: '12px', p: 1 }}>
                        {filteredProductOptions.map(p => (
                            <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', p: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '8px' } }}>
                                <Checkbox 
                                    size="small"
                                    checked={selectedProducts.includes(p.name)} 
                                    onChange={() => toggleProductSelection(p.name)} 
                                    color="success" 
                                />
                                <Avatar 
                                    src={p.images?.[0]?.imageUrl || ''} 
                                    variant="rounded" 
                                    sx={{ width: 32, height: 32, mx: 1, borderRadius: '6px' }} 
                                />
                                <Typography fontSize="0.875rem">{p.name}</Typography>
                            </Box>
                        ))}
                        {filteredProductOptions.length === 0 && (
                            <Box sx={{ py: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Không tìm thấy sản phẩm</Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setProductModalOpen(false)} variant="contained" color="success" fullWidth>Xong</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
                <DialogTitle>Xác nhận xóa</DialogTitle>
                <DialogContent><DialogContentText>Bạn có chắc chắn muốn xóa đánh giá này không?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Hủy</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={confirming}>Xóa</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};
