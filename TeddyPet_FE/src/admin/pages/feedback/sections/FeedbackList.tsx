import Card from '@mui/material/Card';
import { TextField, InputAdornment, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Stack, Tabs, Tab, Avatar, Typography, IconButton, Checkbox, FormControlLabel, Chip, MenuItem, Select, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { getAllFeedbacks, deleteFeedback, replyFeedback, editFeedbackAsAdmin, FeedbackResponse } from '../../../../api/feedback.api';
import { toast } from 'react-toastify';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../../../api/auth.api';

const dataGridCardStyles = {
    borderRadius: '16px',
    boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
    backgroundColor: 'rgb(255, 255, 255)',
    display: 'flex',
    flexDirection: 'column',
};

export const FeedbackList = () => {
    const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
    const [tabFilter, setTabFilter] = useState<"all" | "unreplied" | "replied">("all");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

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

    const { data: meRes } = useQuery({ queryKey: ["me-admin"], queryFn: getMe });
    const isAdminRole = meRes?.data?.role === 'ADMIN';

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

    useEffect(() => {
        fetchFeedbacks();
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

    const uniqueProducts = useMemo(() => {
        const products = feedbacks.map(f => f.productName);
        return Array.from(new Set(products)).sort();
    }, [feedbacks]);

    const filteredUniqueProducts = useMemo(() => {
        return uniqueProducts.filter(p => p.toLowerCase().includes(productSearchKeyword.toLowerCase()));
    }, [uniqueProducts, productSearchKeyword]);

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

    const handleTabChange = (_: React.SyntheticEvent, newValue: any) => {
        setTabFilter(newValue);
    };

    return (
        <Card sx={{ ...dataGridCardStyles, height: 'calc(100vh - 120px)', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #919eab1f', flexShrink: 0 }}>
                <Stack spacing={3}>
                    {/* Top Row: Search and Product Filter */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField
                            placeholder="Tìm kiếm nội dung, khách hàng..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.disabled', fontSize: '2rem' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    fontSize: '1.3rem',
                                }
                            }}
                        />

                        <Select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value as any)}
                            displayEmpty
                            sx={{
                                width: { xs: '100%', md: 200 },
                                borderRadius: '12px',
                                fontSize: '1.3rem',
                                '.MuiSelect-select': { py: 1.5 }
                            }}
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
                            sx={{
                                height: '52px',
                                borderRadius: '12px',
                                px: 3,
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                borderColor: selectedProducts.length > 0 ? '#00AB55' : 'rgba(145, 158, 171, 0.32)',
                                color: selectedProducts.length > 0 ? '#00AB55' : 'inherit',
                                width: { xs: '100%', md: 'auto' }
                            }}
                        >
                            {selectedProducts.length > 0 ? `Lọc sản phẩm (${selectedProducts.length})` : 'Chọn sản phẩm'}
                        </Button>
                    </Stack>

                    {/* Bottom Row: Status Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabFilter}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    fontSize: '1.4rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    minWidth: 100,
                                    py: 1.5,
                                    color: '#637381'
                                },
                                '& .Mui-selected': { color: '#00AB55 !important' },
                                '& .MuiTabs-indicator': { backgroundColor: '#00AB55' }
                            }}
                        >
                            <Tab label="Mới nhất" value="all" />
                            <Tab label="Chưa phản hồi" value="unreplied" />
                            <Tab label="Đã phản hồi" value="replied" />
                        </Tabs>
                    </Box>
                </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3, backgroundColor: '#f9fafb' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress sx={{ color: '#00AB55' }} />
                    </Box>
                ) : filteredFeedbacks.length === 0 ? (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" color="text.secondary">
                        <FilterListIcon sx={{ fontSize: '6rem', opacity: 0.2, mb: 2 }} />
                        <Typography fontSize="1.6rem" fontWeight={600}>Không tìm thấy đánh giá phù hợp</Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {filteredFeedbacks.map((fb) => (
                            <Card key={fb.id} sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)' }}>
                                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={{ xs: 2, md: 4 }}>

                                    {/* Left: Product Info */}
                                    <Box flexShrink={0} sx={{ width: { xs: '100%', md: '280px' }, borderRight: { md: '1px solid #f0f0f0' }, pr: { md: 2 } }}>
                                        <Box sx={{ p: 2, borderRadius: '12px', display: 'flex', gap: 2, alignItems: 'flex-start', bgcolor: 'transparent' }}>
                                            <Avatar src={fb.productImage} variant="rounded" sx={{ width: 64, height: 64, borderRadius: '8px' }} />
                                            <Box flex={1} overflow="hidden">
                                                <Typography fontSize="1.3rem" fontWeight={700} sx={{ color: '#212B36', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={fb.productName}>
                                                    {fb.productName}
                                                </Typography>
                                                {fb.variantName && (
                                                    <Typography fontSize="1.2rem" color="text.secondary" mt={0.5}>
                                                        {fb.variantName}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Right: User & Comment */}
                                    <Box flex={1} sx={{ minWidth: 0 }}>
                                        <Box display="flex" alignItems="flex-start" gap={2}>
                                            <Avatar
                                                src={`https://ui-avatars.com/api/?name=${fb.userName || fb.guestName || 'G'}&background=random`}
                                                sx={{ width: 48, height: 48 }}
                                            />
                                            <Box flex={1} sx={{ minWidth: 0 }}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5}>
                                                        <Typography fontWeight={700} fontSize="1.4rem" color="#212b36">
                                                            {fb.userName || fb.guestName || "Khách hàng"}
                                                        </Typography>
                                                        {fb.isPurchased && (
                                                            <Chip
                                                                icon={<CheckCircleIcon sx={{ fontSize: '1.4rem !important' }} />}
                                                                label="Đã mua"
                                                                size="small"
                                                                color="success"
                                                                sx={{ height: 20, fontSize: '1rem', fontWeight: 600, bgcolor: '#e8f5e9', color: '#2e7d32', '& .MuiChip-icon': { color: '#2e7d32' } }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Box display="flex" alignItems="center">
                                                        {isAdminRole && (
                                                            <IconButton onClick={() => { setEditingId(fb.id); setEditComment(fb.comment); setReplyingId(null); }} color="primary" title="Sửa đánh giá" size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                                                <EditOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                        <IconButton onClick={() => setDeleteId(fb.id)} color="error" title="Xóa đánh giá" size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                                    <Box display="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            i < fb.rating ? <StarIcon key={i} sx={{ color: '#FFAB00', fontSize: '1.5rem' }} /> : <StarBorderIcon key={i} sx={{ color: '#dfe3e8', fontSize: '1.5rem' }} />
                                                        ))}
                                                    </Box>
                                                    <Typography color="text.secondary" fontSize="1.2rem">
                                                        {new Date(fb.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </Box>

                                                {editingId === fb.id ? (
                                                    <Box sx={{ mb: 2 }}>
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={3}
                                                            value={editComment}
                                                            onChange={(e) => setEditComment(e.target.value)}
                                                            autoFocus
                                                            sx={{ '& .MuiOutlinedInput-root': { fontSize: '1.4rem', borderRadius: '12px' } }}
                                                        />
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
                                                            <Button size="small" sx={{ fontSize: '1.2rem', fontWeight: 600, color: 'text.secondary', textTransform: 'none' }} onClick={() => { setEditingId(null); setEditComment(""); }}>Hủy</Button>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                size="small"
                                                                disableElevation
                                                                sx={{ fontSize: '1.2rem', fontWeight: 700, borderRadius: '8px', backgroundColor: '#00AB55', '&:hover': { backgroundColor: '#009045' }, textTransform: 'none' }}
                                                                onClick={() => handleEditSubmit(fb.id)}
                                                                disabled={submittingEdit}
                                                            >
                                                                Lưu chỉnh sửa
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Typography fontSize="1.4rem" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', mb: 2, color: '#212b36', lineHeight: 1.6 }}>
                                                        {fb.comment}
                                                    </Typography>
                                                )}

                                                {/* Reply Block */}
                                                {fb.replyComment ? (
                                                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f4f6f8', borderRadius: '12px', borderLeft: '3px solid #00AB55' }}>
                                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                            <Avatar src="/images/logo.png" sx={{ width: 20, height: 20 }} />
                                                            <Typography fontWeight={700} fontSize="1.3rem" color="#00AB55">TeddyPet</Typography>
                                                            {fb.repliedAt && (
                                                                <Typography fontSize="1.1rem" color="text.secondary" ml={1}>
                                                                    {new Date(fb.repliedAt).toLocaleDateString('vi-VN')}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Typography fontSize="1.3rem" color="text.primary" sx={{ lineHeight: 1.5 }}>
                                                            {fb.replyComment}
                                                        </Typography>
                                                    </Box>
                                                ) : replyingId === fb.id ? (
                                                    <Box sx={{ mt: 2 }}>
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={2}
                                                            placeholder="Nhập nội dung phản hồi khách hàng..."
                                                            value={replyComment}
                                                            onChange={(e) => setReplyComment(e.target.value)}
                                                            autoFocus
                                                            sx={{ mb: 1, '& .MuiOutlinedInput-root': { fontSize: '1.3rem', borderRadius: '12px', bgcolor: '#f9fafb' } }}
                                                        />
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Button size="small" sx={{ fontSize: '1.2rem', fontWeight: 600, color: 'text.secondary', textTransform: 'none' }} onClick={() => { setReplyingId(null); setReplyComment(""); }}>Hủy</Button>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                size="small"
                                                                disableElevation
                                                                sx={{ fontSize: '1.2rem', fontWeight: 700, borderRadius: '8px', backgroundColor: '#00AB55', '&:hover': { backgroundColor: '#009045' }, textTransform: 'none' }}
                                                                onClick={() => handleReply(fb.id)}
                                                                disabled={submittingReply}
                                                            >
                                                                Gửi phản hồi
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Button
                                                        startIcon={<ReplyIcon sx={{ fontSize: '16px' }} />}
                                                        onClick={() => { setReplyingId(fb.id); setReplyComment(""); }}
                                                        sx={{ mt: 0.5, fontSize: '1.2rem', fontWeight: 600, color: 'text.secondary', p: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#00AB55' } }}
                                                    >
                                                        Trả lời
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Product Filter Modal */}
            <Dialog
                open={productModalOpen}
                onClose={() => setProductModalOpen(false)}
                PaperProps={{ sx: { borderRadius: '16px', width: '100%', maxWidth: 500 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.8rem', pb: 1 }}>
                    Lọc theo sản phẩm
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Tìm tên sản phẩm..."
                        value={productSearchKeyword}
                        onChange={(e) => setProductSearchKeyword(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mt: 1, mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />

                    <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                        {filteredUniqueProducts.length === 0 ? (
                            <Typography textAlign="center" color="text.secondary" py={3} fontSize="1.3rem">
                                Không có sản phẩm nào
                            </Typography>
                        ) : (
                            filteredUniqueProducts.map(product => (
                                <FormControlLabel
                                    key={product}
                                    control={
                                        <Checkbox
                                            checked={selectedProducts.includes(product)}
                                            onChange={() => toggleProductSelection(product)}
                                            color="success"
                                        />
                                    }
                                    label={<Typography fontSize="1.4rem" fontWeight={500}>{product}</Typography>}
                                    sx={{ display: 'flex', width: '100%', m: 0, py: 0.5, '&:hover': { backgroundColor: '#f5f5f5' }, borderRadius: '8px' }}
                                />
                            ))
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
                    <Button
                        onClick={() => setSelectedProducts([])}
                        color="inherit"
                        sx={{ fontSize: '1.2rem', fontWeight: 600, mr: 'auto' }}
                    >
                        Bỏ chọn tất cả
                    </Button>
                    <Button
                        onClick={() => setProductModalOpen(false)}
                        variant="contained"
                        sx={{ fontSize: '1.3rem', fontWeight: 700, borderRadius: '8px', backgroundColor: '#00AB55', '&:hover': { backgroundColor: '#009045' } }}
                    >
                        Áp dụng
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteId !== null}
                onClose={() => setDeleteId(null)}
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.6rem' }}>
                    Xác nhận xóa đánh giá
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '1.3rem' }}>
                        Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={() => setDeleteId(null)}
                        sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#637381' }}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={confirming}
                        sx={{ fontWeight: 700, fontSize: '1.1rem', borderRadius: '8px' }}
                    >
                        {confirming ? 'Đang xóa...' : 'Đồng ý xóa'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};
