import {
    Box,
    Button,
    Container,
    IconButton,
    Menu,
    MenuItem,
    SpeedDial,
    SpeedDialAction,
    Tooltip,
    Typography,
    CircularProgress,
    Stack,
    Chip,
    Avatar,
    Pagination,
} from "@mui/material"
import { prefixAdmin } from "../../constants/routes"
import { ArrowIcon, EditIcon, GoLiveIcon, UploadIcon, DraftIcon, ArchivedIcon, ShareIcon, FacebookIcon, InstagramIcon, ImagePlusIcon, AttachFileIcon, EmojiIcon } from "../../assets/icons"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useBlogDetail, useUpdateBlog } from "./hooks/useBlog"
import dayjs from "dayjs"
import 'dayjs/locale/vi'
import { toast } from "react-toastify"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { sharedContentStyles } from "../../components/layouts/titap/TiptapStyles"

type BlogStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED"

const getItemStyle = (current: BlogStatus, value: BlogStatus) => ({
    mb: "4px",
    borderRadius: "8px",
    fontWeight: current === value ? 600 : 400,
    backgroundColor:
        current === value
            ? "rgba(145 158 171 / 16%)"
            : "transparent",
    gap: "16px",
    "&:hover": {
        backgroundColor: "rgba(145 158 171 / 24%)"
    }
})

export const BlogDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Hãy viết bình luận của bạn',
            }),
        ],
        content: '',
    });

    const { data: detailRes, isLoading, refetch } = useBlogDetail(id);
    const { mutate: updateBlog } = useUpdateBlog();

    // Status local để hiển thị khi chưa update xong hoặc để thao tác
    const [status, setStatus] = useState<BlogStatus>("DRAFT");

    useEffect(() => {
        if (detailRes?.success && detailRes?.data) {
            setStatus(detailRes.data.status || "DRAFT");
        }
    }, [detailRes]);

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleChangeStatus = (value: BlogStatus) => {
        if (value === status) {
            handleClose();
            return;
        }

        // Gọi API update status
        updateBlog({ id: Number(id), data: { status: value } }, {
            onSuccess: (res) => {
                if (res.success) {
                    toast.success("Cập nhật trạng thái thành công");
                    setStatus(value);
                    refetch();
                } else {
                    toast.error(res.message);
                }
            },
            onError: () => toast.error("Có lỗi xảy ra")
        });
        handleClose()
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress color="inherit" />
            </Box>
        );
    }

    const blog = detailRes?.data;


    if (!blog) return <Box sx={{ textAlign: 'center', py: 5 }}>Không tìm thấy bài viết</Box>;

    return (
        <>
            <Container disableGutters maxWidth={false} sx={{ px: "40px" }}>
                <Box sx={{ mb: "40px", gap: "12px", display: "flex", alignItems: 'flex-start' }}>
                    {/* Back */}
                    <Button
                        component={Link}
                        to={`/${prefixAdmin}/blog/list`}
                        color="inherit"
                        startIcon={
                            <ArrowIcon sx={{ rotate: "90deg", width: 16, height: 16 }} />
                        }
                        disableElevation
                        sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            fontSize: "1.3rem",
                            borderRadius: "8px",
                            "&:hover": {
                                backgroundColor: "#919eab14"
                            }
                        }}
                    >
                        Quay lại
                    </Button>

                    <Box sx={{ flex: 1 }} />

                    <Box sx={{ display: "flex", gap: "12px" }}>
                        {/* Actions */}
                        {status === 'PUBLISHED' && (
                            <Tooltip title="Xem trực tiếp">
                                <IconButton component={Link} to={`/blog/detail/${blog.slug}`} target="_blank">
                                    <GoLiveIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chỉnh sửa">
                            <IconButton onClick={() => navigate(`/${prefixAdmin}/blog/edit/${blog.id}`)}>
                                <EditIcon sx={{ mr: 0, color: "#637381" }} />
                            </IconButton>
                        </Tooltip>

                        {/* Status Button */}
                        <Button
                            variant="contained"
                            color="inherit"
                            disableElevation
                            onClick={handleOpen}
                            endIcon={<ArrowIcon />}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "1.3rem",
                                backgroundColor: "#1C252E",
                                color: "#fff",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                "&:hover": {
                                    backgroundColor: "#454F5B",
                                    boxShadow:
                                        "0 8px 16px 0 rgba(145 158 171 / 16%)"
                                }
                            }}
                        >
                            {status === "PUBLISHED"
                                ? "Xuất bản"
                                : status === "DRAFT"
                                    ? "Bản nháp"
                                    : "Đã lưu trữ"}
                        </Button>
                    </Box>

                    {/* MENU */}
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{
                            paper: {
                                sx: {
                                    borderRadius: "10px",
                                    minWidth: 140,
                                    boxShadow:
                                        "0 0 2px 0 rgba(145 158 171 / 24%), -20px 20px 40px -4px rgba(145 158 171 / 24%)",
                                    overflow: "visible",
                                    mt: 1,
                                    '& .MuiMenuItem-root': {
                                        fontSize: '1.4rem'
                                    }
                                }
                            }
                        }}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem
                            dense
                            sx={getItemStyle(status, "PUBLISHED")}
                            onClick={() => handleChangeStatus("PUBLISHED")}
                        >
                            <UploadIcon sx={{ fontSize: "2rem" }} />
                            Xuất bản
                        </MenuItem>

                        <MenuItem
                            dense
                            sx={getItemStyle(status, "DRAFT")}
                            onClick={() => handleChangeStatus("DRAFT")}
                        >
                            <DraftIcon />
                            Bản nháp
                        </MenuItem>

                        <MenuItem
                            dense
                            sx={getItemStyle(status, "ARCHIVED")}
                            onClick={() => handleChangeStatus("ARCHIVED")}
                        >
                            <ArchivedIcon />
                            Đã lưu trữ
                        </MenuItem>
                    </Menu>
                </Box>
            </Container>

            {/* Image + Title */}
            <Box
                sx={{
                    backgroundImage: `linear-gradient(0deg, rgba(20, 26, 33, 0.64), rgba(20, 26, 33, 0.64)), url("${blog.featuredImage || 'https://api-prod-minimal-v700.pages.dev/assets/images/cover/cover-3.webp'}")`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center center",
                    height: "480px",
                    overflow: "hidden",
                }}
            >
                <Container sx={{ height: "100%", position: "relative" }}>
                    <Stack sx={{ height: '100%', justifyContent: 'flex-end', pb: '80px' }}>
                        <Typography sx={{ fontSize: "3rem", maxWidth: "720px", fontWeight: "700", zIndex: "9", color: "#fff", lineHeight: "1.5" }}>
                            {blog.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, color: '#fff', opacity: 0.8, fontSize: '1.4rem' }}>
                            <Box component="span">
                                {dayjs(blog.createdAt).locale('vi').format('DD MMM YYYY, HH:mm')}
                            </Box>
                        </Box>
                    </Stack>

                    <Box sx={{ position: "absolute", left: "0", bottom: "0", width: "100%" }}>
                        <SpeedDial
                            ariaLabel="Share post"
                            direction="left"
                            icon={<ShareIcon />}
                            sx={{
                                position: "absolute",
                                bottom: "64px",
                                right: "24px",
                                zIndex: "1050",

                                '& .MuiFab-root': {
                                    width: "48px",
                                    height: "48px",
                                    backgroundColor: "#00A76F",

                                    '& .MuiSvgIcon-root': {
                                        color: "#fff",
                                        width: "2rem",
                                        height: "2rem"
                                    }
                                },
                                '& .MuiSpeedDialAction-fab': {
                                    width: "4rem",
                                    height: "4rem",
                                    boxShadow: "0 8px 16px 0 rgba(145 158 171 / 16%)",
                                    backgroundColor: "#FFFFFF",
                                    m: "8px",

                                    '& svg': {
                                        width: "2rem",
                                        height: "2rem"
                                    }
                                }
                            }}
                        >
                            <SpeedDialAction
                                icon={<FacebookIcon />}
                                sx={{ transitionDelay: "120ms !important" }}
                                slotProps={{
                                    tooltip: {
                                        title: "Facebook",
                                    },
                                }}
                            />
                            <SpeedDialAction
                                icon={<InstagramIcon />}
                                sx={{ transitionDelay: "90ms !important" }}
                                slotProps={{
                                    tooltip: {
                                        title: "Instagram",
                                    },
                                }}
                            />
                        </SpeedDial>
                    </Box>
                </Container >
            </Box >

            {/* Content */}
            {/* <Container maxWidth="md" sx={{ mt: 8, mb: 10 }}>


              

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 5 }}>
                    {blog.tags?.map((tag: any) => (
                        <Chip key={tag.tagId} label={`Tag ${tag.tagId}`} sx={{ borderRadius: '8px' }} />
                    ))}
                </Stack>
            </Container> */}
            <Box sx={{ maxWidth: "720px", mt: "80px", px: "24px", mx: "auto", pb: "40px" }}>
                <Typography variant="h6" sx={{ fontWeight: "600", fontSize: "1.6rem", color: '#1C252E' }}>
                    {blog.excerpt}
                </Typography>
                <hr className="my-[32px] border-[#919eab33] border-solid" />
                <Box className="" sx={{
                    color: '#212B36',
                    ...sharedContentStyles,
                }}>
                    <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                </Box>
                {/* Tags */}
                <div className="py-[24px] border-y border-dashed border-[#919eab33]">
                    <div className="flex flex-wrap gap-[8px]">
                        {blog.tags?.map((tag: any) => (
                            <Chip
                                key={tag.tagId}
                                label={tag.name}
                                sx={{
                                    fontSize: "1.3rem",
                                    color: "#1C252E",
                                    borderRadius: "10px"
                                }}
                            />
                        ))}
                    </div>
                </div>
                {/* Comments */}
                <div className="mt-[40px] mb-[24px] flex">
                    <h4 className="text-[2.4rem] font-[700]">Bình luận</h4>
                    <h6 className="text-[#919EAB] text-[1.4rem] font-[600]">(4)</h6>
                </div>
                <form noValidate autoComplete="off">
                    <Box sx={{
                        ...sharedContentStyles,
                        border: '1px solid #919eab33',
                        borderRadius: '12px',
                        padding: '5px 14px 16px',
                        minHeight: '120px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            borderColor: '#1C252E',
                        },
                        '&:focus-within': {
                            borderColor: '#1C252E',
                            boxShadow: '0 0 0 0.5px #1C252E',
                        },
                        '& .tiptap.ProseMirror': {
                            outline: 'none',
                            minHeight: '100px',
                        },
                        '& .is-editor-empty:first-of-type::before': {
                            content: 'attr(data-placeholder)',
                            float: 'left',
                            color: '#919EAB',
                            pointerEvents: 'none',
                            height: 0,
                            fontStyle: 'normal',
                        },
                    }}>
                        <EditorContent editor={editor} />
                    </Box>
                    <div className="flex items-center justify-between mt-[24px]">
                        <div className="flex items-center">
                            <IconButton>
                                <ImagePlusIcon />
                            </IconButton>
                            <IconButton>
                                <AttachFileIcon />
                            </IconButton>
                            <IconButton>
                                <EmojiIcon />
                            </IconButton>
                        </div>
                        <Button
                            type="submit"
                            sx={{
                                background: '#1C252E',
                                minHeight: "3.6rem",
                                minWidth: "6.4rem",
                                fontWeight: 700,
                                fontSize: "1.4rem",
                                padding: "6px 12px",
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
                            Gửi bình luận
                        </Button>
                    </div>
                </form>
                <hr className="mt-[40px] mb-[16px] border-[#919eab33] border-solid" />
                {/* Comment 1 */}
                <div className="pt-[24px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                    <Button sx={{ '&:hover': { background: '#919eab14' }, fontWeight: "700", p: "4px", color: "inherit", borderRadius: "8px", height: "30px", fontSize: "1.2rem", textTransform: "none", position: "absolute", right: "0" }} startIcon={<EditIcon sx={{ mr: "0px", fontSize: "1.5rem" }} />}>Phản hồi</Button>
                </div>
                <div className="pt-[24px] pl-[64px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                </div>
                <div className="pt-[24px] pl-[64px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                </div>
                <div className="pt-[24px] pl-[64px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                </div>
                {/* Comment 2 */}
                <div className="pt-[24px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                    <Button sx={{ '&:hover': { background: '#919eab14' }, fontWeight: "700", p: "4px", color: "inherit", borderRadius: "8px", height: "30px", fontSize: "1.2rem", textTransform: "none", position: "absolute", right: "0" }} startIcon={<EditIcon sx={{ mr: "0px", fontSize: "1.5rem" }} />}>Phản hồi</Button>
                </div>
                <div className="pt-[24px] pl-[64px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                </div>
                <div className="pt-[24px] pl-[64px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                </div>
                <div className="pt-[24px] pl-[64px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                </div>
                {/* Cmt 3 */}
                <div className="pt-[24px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                    <Button sx={{ '&:hover': { background: '#919eab14' }, fontWeight: "700", p: "4px", color: "inherit", borderRadius: "8px", height: "30px", fontSize: "1.2rem", textTransform: "none", position: "absolute", right: "0" }} startIcon={<EditIcon sx={{ mr: "0px", fontSize: "1.5rem" }} />}>Phản hồi</Button>
                </div>
                {/* Cmt 4 */}
                <div className="pt-[24px] flex relative gap-[16px]">
                    <Avatar src="https://api-prod-minimal-v700.pages.dev/assets/images/avatar/avatar-1.webp" sx={{ width: "4.8rem", height: "4.8rem" }} />
                    <div className="pb-[24px] flex flex-col border-b border-[#919eab33] flex-1">
                        <h6 className="text-[1.4rem] font-[600] mb-[4px]">Jayvion Simon</h6>
                        <span className="text-[#919EAB] text-[1.2rem]">16 Jan 2026</span>
                        <p className="text-[1.4rem] mt-[8px]">She eagerly opened the gift, her eyes sparkling with excitement.</p>
                    </div>
                    <Button sx={{ '&:hover': { background: '#919eab14' }, fontWeight: "700", p: "4px", color: "inherit", borderRadius: "8px", height: "30px", fontSize: "1.2rem", textTransform: "none", position: "absolute", right: "0" }} startIcon={<EditIcon sx={{ mr: "0px", fontSize: "1.5rem" }} />}>Phản hồi</Button>
                </div>
                <Pagination
                    count={8}
                    page={1}
                    shape="circular"
                    sx={{
                        my: "64px",
                        "& .MuiPaginationItem-root": {
                            fontSize: "1.4rem",
                            color: "#1C252E",
                            lineHeight: "1.57143"
                        },
                        "& .Mui-disabled": {
                            opacity: "0.48"
                        },
                        '& .MuiSvgIcon-root': {
                            width: "2rem",
                            height: "2rem"
                        },
                        "& .Mui-selected": {
                            backgroundColor: "#1C252E !important",
                            color: "#FFFFFF",
                            fontWeight: 600,
                        },
                        '& .MuiPagination-ul': {
                            justifyContent: "center"
                        },
                    }}
                />
            </Box>
        </>

    )
}
