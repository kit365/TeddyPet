import Card from '@mui/material/Card';
import { TextField, InputAdornment, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Stack, Avatar, Typography, IconButton, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getAllBlogComments, deleteBlogComment, BlogCommentResponse } from '../../../../api/blogComment.api';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

const dataGridCardStyles = {
    borderRadius: '0 0 16px 16px',
    boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
    backgroundColor: 'rgb(255, 255, 255)',
    display: 'flex',
    flexDirection: 'column',
};

export const BlogCommentList = () => {
    const [comments, setComments] = useState<BlogCommentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState("");

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [confirming, setConfirming] = useState(false);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await getAllBlogComments();
            setComments(response.data);
        } catch (error) {
            console.error("Error fetching blog comments:", error);
            toast.error("Không thể tải danh sách bình luận blog");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setConfirming(true);
        try {
            await deleteBlogComment(deleteId);
            toast.success("Đã xóa bình luận thành công");
            setComments(comments.filter(c => c.id !== deleteId));
        } catch (error) {
            toast.error("Không thể xóa bình luận");
        } finally {
            setConfirming(false);
            setDeleteId(null);
        }
    };

    const filteredComments = comments.filter(c => {
        const matchesKeyword =
            (c.userName?.toLowerCase() || c.guestName?.toLowerCase() || "").includes(searchKeyword.toLowerCase()) ||
            c.content.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchesKeyword;
    });

    return (
        <Card sx={{ ...dataGridCardStyles, height: 'calc(100vh - 200px)', minHeight: '500px' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #919eab1f' }}>
                <TextField
                    placeholder="Tìm kiếm nội dung, người dùng..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.disabled', fontSize: '1.2rem' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            height: '44px'
                        }
                    }}
                />
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2.5, backgroundColor: '#f9fafb' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress sx={{ color: '#00AB55' }} />
                    </Box>
                ) : filteredComments.length === 0 ? (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" color="text.secondary">
                        <Typography fontSize="0.9375rem" fontWeight={600}>Không tìm thấy bình luận phù hợp</Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {filteredComments.map((comment) => (
                            <Card key={comment.id} sx={{ p: 2.5, borderRadius: '16px' }}>
                                <Box display="flex" gap={2}>
                                    <Avatar
                                        src={`https://ui-avatars.com/api/?name=${comment.userName || comment.guestName || 'G'}&background=random`}
                                        sx={{ width: 48, height: 48 }}
                                    />
                                    <Box flex={1}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography fontWeight={700} fontSize="0.875rem">
                                                    {comment.userName || comment.guestName || "Người dùng"}
                                                </Typography>
                                                <Typography color="text.secondary" fontSize="0.75rem">
                                                    {new Date(comment.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                            <IconButton onClick={() => setDeleteId(comment.id)} color="error" size="small">
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Box>
                                        <Typography fontSize="0.875rem" mt={1} sx={{ wordBreak: 'break-word' }}>
                                            {comment.content}
                                        </Typography>
                                        {comment.replies && comment.replies.length > 0 && (
                                            <Box mt={2} ml={4} p={2} bgcolor="#f4f6f8" borderRadius="12px">
                                                {comment.replies.map(reply => (
                                                    <Box key={reply.id} mb={1}>
                                                        <Typography fontWeight={700} fontSize="0.8125rem">{reply.userName || reply.guestName}</Typography>
                                                        <Typography fontSize="0.8125rem">{reply.content}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>

            <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Xác nhận xóa bình luận</DialogTitle>
                <DialogContent>
                    <DialogContentText>Bạn có chắc chắn muốn xóa bình luận này không?</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteId(null)} color="inherit">Hủy</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" disabled={confirming}>
                        {confirming ? 'Đang xóa...' : 'Đồng ý xóa'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};
