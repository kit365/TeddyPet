import AppBar from "@mui/material/AppBar";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import React from "react";
import Container from "@mui/material/Container";
import Box from '@mui/material/Box';
import SettingsIcon from '@mui/icons-material/Settings';
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from 'react-toastify';
import { InputAdornment, TextField } from "@mui/material";
import { Search } from "iconoir-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyStaffProfile } from "../../api/staffProfile.api";
import { useUpdateStaffProfile } from "../../pages/staff/hooks/useStaffProfile";
import { uploadImage } from "../../../api/upload.api";
import { useNotificationStore } from "../../../stores/useNotificationStore";
import { useAuthStore } from "../../../stores/useAuthStore";

interface Props {
    window?: () => Window;
    children: React.ReactElement<any, any>;
    sx?: any;
}

function ElevationScroll(props: Props) {
    const { children, window, sx: extraSx } = props;

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
        target: window ? window() : undefined,
    });

    return React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
        className: (children.props.className || "") + (trigger ? ' header__admin scrolled' : ' header__admin'),
        sx: {
            ...children.props.sx,
            ...extraSx,
            backgroundImage: "none !important",
            backgroundColor: "#fff !important",
            backdropFilter: "none",
            boxShadow: trigger ? "0 0 2px 0 rgba(145 158 171 / 24%), -20px 20px 40px -4px rgba(145 158 171 / 24%)" : "none",
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
    });
}

// Searchable routes data
const SEARCH_ROUTES = [
    { category: "Dashboard", label: "Tổng quan", path: "/admin/dashboard" },
    { category: "Sản phẩm", label: "Danh sách sản phẩm", path: "/admin/product/list" },
    { category: "Sản phẩm", label: "Thêm sản phẩm", path: "/admin/product/create" },
    { category: "Thuộc tính", label: "Danh sách thuộc tính", path: "/admin/product/attribute/list" },
    { category: "Thuộc tính", label: "Thêm thuộc tính", path: "/admin/product-attribute/create" },
    { category: "Danh mục sản phẩm", label: "Danh sách danh mục", path: "/admin/product-category/list" },
    { category: "Danh mục sản phẩm", label: "Thêm danh mục", path: "/admin/product-category/create" },
    { category: "Thương hiệu", label: "Danh sách thương hiệu", path: "/admin/brand/list" },
    { category: "Thương hiệu", label: "Thêm thương hiệu", path: "/admin/brand/create" },
    { category: "Bài viết", label: "Danh sách bài viết", path: "/admin/blog/list" },
    { category: "Bài viết", label: "Thêm bài viết", path: "/admin/blog/create" },
    { category: "Danh mục bài viết", label: "Danh sách danh mục", path: "/admin/blog-category/list" },
    { category: "Danh mục bài viết", label: "Thêm danh mục", path: "/admin/blog-category/create" },
];

export const Header = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [openSearchDialog, setOpenSearchDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuthStore();
    const [openProfileDialog, setOpenProfileDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

    // Notifications state
    const { unreadCount, markAllAsRead, markAsRead, notifications } = useNotificationStore();
    const adminUnreadNotifications = notifications.filter(n => !n.isRead);
    const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [openConfirmAll, setOpenConfirmAll] = useState(false);
    const openNotif = Boolean(notifAnchorEl);

    const { data: myProfileRes } = useQuery({
        queryKey: ["my-staff-profile"],
        queryFn: getMyStaffProfile,
        enabled: !!user && (typeof user.role === 'string' ? (user.role.includes('ADMIN') || user.role.includes('STAFF')) : true)
    });
    const myProfile = myProfileRes?.data;
    const { mutate: updateProfile, isPending: updatingProfile } = useUpdateStaffProfile();
    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (myProfile && openProfileDialog) {
            setAvatarUrl(myProfile.avatarUrl ?? "");
            setAvatarPreview(null);
            setEmail(myProfile.email ?? "");
            setPhoneNumber(myProfile.phoneNumber ?? "");
            setAddress(myProfile.address ?? "");
            setEditMode(false);
        }
    }, [myProfile, openProfileDialog]);

    // Filter routes based on search query
    const filteredRoutes = SEARCH_ROUTES.filter(route => {
        const query = searchQuery.toLowerCase();
        return (
            route.label.toLowerCase().includes(query) ||
            route.category.toLowerCase().includes(query) ||
            route.path.toLowerCase().includes(query)
        );
    });

    const handleOpenSearchDialog = () => {
        setOpenSearchDialog(true);
    };

    const handleCloseSearchDialog = () => {
        setOpenSearchDialog(false);
        setSearchQuery(""); // Reset search when closing
    };

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleChangeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        const message = lng === 'vi' ? 'Đã đổi sang Tiếng Việt!' : 'Language changed to English!';
        toast.success(message);
        handleClose();
    };

    const handleOpenNotif = (event: React.MouseEvent<HTMLButtonElement>) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleCloseNotif = () => {
        setNotifAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    // Flags
    const VI_FLAG = "https://flagcdn.com/w40/vn.png";
    const US_FLAG = "https://flagcdn.com/w40/gb.png";

    const currentFlag = i18n.language === 'vi' ? VI_FLAG : US_FLAG;

    return (
        <>
            <ElevationScroll>
                <AppBar
                    position="sticky"
                    color="inherit"
                    sx={{
                        width: "100%",
                    }}
                >
                    <Container
                        className="flex items-center justify-between"
                        maxWidth={false}
                        style={{
                            paddingLeft: "40px",
                            paddingRight: "40px",
                            height: "72px"
                        }}
                    >
                        <div className="flex items-center gap-[12px] py-[4px]">
                            <span className="text-[2.2rem] font-[800] text-[#1c252e] uppercase tracking-wider">TEDDYPET DASHBOARD</span>
                        </div>
                        <Box className="flex items-center gap-[6px]">
                            <Box onClick={handleOpenSearchDialog} className="flex items-center pr-[8px] cursor-pointer bg-[#919eab14] hover:bg-[#919eab29] rounded-[12px] transition-colors duration-150 ease-in-out">
                                <Box className="p-[8px]">
                                    <svg className="text-[2rem] text-[#637381]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" id="«ro»" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8a7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42M5 11a6 6 0 1 1 6 6a6 6 0 0 1-6-6"></path></svg>
                                </Box>
                                <span className="h-[2.4rem] min-w-[2.4rem] flex items-center justify-center text-[#1C252E] text-[1.2rem] font-[900] pl-[6px] pr-[6px] rounded-[6px] bg-white box-shadow-[0_1px_2px_0_rgba(145,158,171,0.16)]"><span className="text-[0.7rem] mt-[1px] mr-[1px]">⌘</span>K</span>
                            </Box>

                            <Button
                                onClick={handleOpen}
                                sx={{
                                    minWidth: 0,
                                    mx: "10px",
                                    width: 40,
                                    height: "40px",
                                    padding: "0",
                                    borderRadius: '50%',
                                    '&:hover': {
                                        backgroundColor: 'rgba(145, 158, 171, 0.16)',
                                        scale: "1.04"
                                    }
                                }}
                            >
                                <img
                                    src={currentFlag}
                                    alt="flag"
                                    style={{
                                        width: 26,
                                        height: 20,
                                        borderRadius: 5,
                                        objectFit: 'cover',
                                    }}
                                />
                            </Button>
                            <Popover
                                open={open}
                                anchorEl={anchorEl}
                                onClose={handleClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            ml: 0.75,
                                            width: 168,
                                            '& .MuiMenuItem-root': {
                                                px: 1,
                                                typography: 'body2',
                                                borderRadius: 0.75,
                                            },
                                        },
                                    }
                                }}
                            >
                                <MenuItem
                                    selected={i18n.language === 'en'}
                                    onClick={() => handleChangeLanguage('en')}
                                    sx={{
                                        padding: "6px 8px",
                                        mb: "4px",
                                        fontSize: '1.3rem !important',
                                        '&.Mui-selected': {
                                            fontWeight: 600,
                                            backgroundColor: '#919eab29 !important',
                                            '&:hover': {
                                                backgroundColor: '#919eab3d !important',
                                            }
                                        }
                                    }}
                                >
                                    <Box component="img" alt="en" src={US_FLAG} sx={{ width: 26, height: 20, mr: 2, borderRadius: "5px", objectFit: 'cover' }} />
                                    English
                                </MenuItem>
                                <MenuItem
                                    selected={i18n.language === 'vi'}
                                    onClick={() => handleChangeLanguage('vi')}
                                    sx={{
                                        padding: "6px 8px",
                                        mb: "4px",
                                        fontSize: '1.3rem !important',
                                        '&.Mui-selected': {
                                            fontWeight: 600,
                                            backgroundColor: '#919eab29 !important',
                                            '&:hover': {
                                                backgroundColor: '#919eab3d !important',
                                            }
                                        }
                                    }}
                                >
                                    <Box component="img" alt="vi" src={VI_FLAG} sx={{ width: 26, height: 20, mr: 2, borderRadius: "5px", objectFit: 'cover' }} />
                                    Tiếng Việt
                                </MenuItem>
                            </Popover>

                            {user && (
                                <Button
                                    onClick={handleOpenNotif}
                                    className="hover:scale-[1.04] hover:bg-admin-hoverIcon transition-all duration-150 ease-in-out"
                                    sx={{
                                        minWidth: 0,
                                        width: 44,
                                        height: 44,
                                        padding: 0,
                                        borderRadius: '50%',
                                    }}
                                >
                                    <Badge
                                        badgeContent={unreadCount}
                                        color="error"
                                        max={99}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                fontSize: '1rem',
                                                fontWeight: 800,
                                                minWidth: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: '2px solid #fff',
                                                boxShadow: '0 2px 4px rgba(255, 48, 48, 0.3)',
                                                top: 4,
                                                right: 4,
                                            }
                                        }}
                                    >
                                        <NotificationsIcon
                                            sx={{
                                                color: "#637381",
                                                fontSize: "2.2rem",
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'rotate(15deg)'
                                                }
                                            }}
                                        />
                                    </Badge>
                                </Button>
                            )}

                            <Popover
                                open={openNotif}
                                anchorEl={notifAnchorEl}
                                onClose={handleCloseNotif}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            mt: 1.5,
                                            ml: 0.75,
                                            width: 420,
                                            maxHeight: 520,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2.5,
                                            boxShadow: '0 12px 24px -4px rgba(145, 158, 171, 0.12), 0 0 2px 0 rgba(145, 158, 171, 0.2)'
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 3, background: 'linear-gradient(to right, #f8f9fa, #ffffff)' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#1a202c' }}>Thông báo</Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '1rem', mt: 0.2 }}>
                                            Bạn có <span style={{ color: '#3b82f6', fontWeight: 700 }}>{unreadCount}</span> thông báo mới
                                        </Typography>
                                    </Box>
                                    {unreadCount > 0 && (
                                        <Button
                                            size="small"
                                            onClick={() => setOpenConfirmAll(true)}
                                            startIcon={<DoneAllIcon sx={{ fontSize: '1.8rem !important' }} />}
                                            sx={{
                                                color: '#3b82f6',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                borderRadius: '8px',
                                                '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' }
                                            }}
                                        >
                                            Đọc tất cả
                                        </Button>
                                    )}
                                </Box>

                                <Divider sx={{ borderColor: 'rgba(145, 158, 171, 0.12)', borderStyle: 'solid' }} />

                                <Box sx={{
                                    maxHeight: '450px',
                                    overflowY: 'auto',
                                    flexGrow: 1,
                                    py: 1,
                                    '&::-webkit-scrollbar': { width: '6px' },
                                    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
                                }}>
                                    {adminUnreadNotifications.length > 0 ? (
                                        adminUnreadNotifications.map((notif) => (
                                            <MenuItem
                                                key={notif.id}
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    if (notif.targetUrl) {
                                                        navigate(notif.targetUrl);
                                                    }
                                                    handleCloseNotif();
                                                }}
                                                sx={{
                                                    py: 2,
                                                    px: 3,
                                                    borderBottom: '1px solid rgba(145, 158, 171, 0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    whiteSpace: 'normal',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                        transform: 'translateX(4px)',
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, width: '100%' }}>
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#3b82f6', flexShrink: 0, boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' }} />
                                                    <Typography variant="subtitle1" sx={{
                                                        fontWeight: 800,
                                                        fontSize: '1.15rem',
                                                        color: '#1a202c',
                                                        flexGrow: 1,
                                                        lineHeight: 1.3
                                                    }}>
                                                        {notif.title}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body1" sx={{
                                                    color: '#454f5b',
                                                    fontSize: '1rem',
                                                    lineHeight: 1.5,
                                                    pl: 3.5
                                                }}>
                                                    {notif.message}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, pl: 3.5, gap: 1 }}>
                                                    <Typography variant="caption" sx={{
                                                        color: 'text.disabled',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 500
                                                    }}>
                                                        {new Date(notif.timestamp).toLocaleString('vi-VN')}
                                                    </Typography>
                                                    <Box sx={{ px: 1, py: 0.2, borderRadius: '4px', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>Mới</Box>
                                                </Box>
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <Box sx={{ py: 10, textAlign: 'center', px: 4 }}>
                                            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.3rem', fontWeight: 500, opacity: 0.6 }}>
                                                Hiện chưa có thông báo nào dành cho bạn
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Confirmation Dialog for Mark All As Read */}
                                <Dialog
                                    open={openConfirmAll}
                                    onClose={() => setOpenConfirmAll(false)}
                                    PaperProps={{
                                        sx: { borderRadius: '20px', p: 1, width: '400px' }
                                    }}
                                >
                                    <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', textAlign: 'center' }}>
                                        Xác nhận
                                    </DialogTitle>
                                    <DialogContent>
                                        <Typography sx={{ textAlign: 'center', fontSize: '1.1rem', color: 'text.secondary' }}>
                                            Bạn có chắc chắn muốn đánh dấu tất cả thông báo là đã đọc?
                                        </Typography>
                                    </DialogContent>
                                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                                        <Button
                                            onClick={() => setOpenConfirmAll(false)}
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                px: 3
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={async () => {
                                                await markAllAsRead();
                                                setOpenConfirmAll(false);
                                                handleCloseNotif();
                                            }}
                                            sx={{
                                                borderRadius: '12px',
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                px: 3,
                                                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.24)'
                                            }}
                                        >
                                            Xác nhận
                                        </Button>
                                    </DialogActions>
                                </Dialog>

                                <Divider sx={{ borderStyle: 'dashed' }} />

                                <Box sx={{ p: 1.5 }}>
                                    <Button
                                        fullWidth
                                        color="inherit"
                                        onClick={() => navigate('/admin/notifications')}
                                        sx={{
                                            py: 1.5,
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}
                                    >
                                        Xem tất cả
                                    </Button>
                                </Box>
                            </Popover>
                            <Button
                                onClick={() => navigate('/admin/settings')}
                                className="hover:scale-[1.04] hover:bg-admin-hoverIcon transition-all duration-150 ease-in-out"
                                sx={{
                                    minWidth: 0,
                                    padding: 0,
                                }}>
                                <SettingsIcon
                                    sx={{
                                        color: "#637381",
                                        fontSize: "2.2rem",
                                        animation: "spin 10s linear infinite",
                                        "@keyframes spin": {
                                            "0%": { transform: "rotate(0deg)" },
                                            "100%": { transform: "rotate(360deg)" }
                                        }
                                    }}
                                />
                            </Button>
                            <Button
                                sx={{
                                    minWidth: 0,
                                    padding: 0,
                                }}
                            >
                                <div className="relative rounded-full p-[3px] w-[4rem] h-[4rem] header__avatar">
                                    <Avatar className="w-full h-full" src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/images/mock/avatar/avatar-25.webp" />
                                </div>
                            </Button>
                        </Box>
                    </Container>
                </AppBar>
            </ElevationScroll>

            {/* Search Dialog */}
            <Dialog
                open={openSearchDialog}
                onClose={handleCloseSearchDialog}
                maxWidth="sm"
                fullWidth
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'flex-start',
                        paddingTop: '10vh',
                    },
                    '& .MuiBackdrop-root': {
                        backgroundColor: '#1c252e7a',
                    },
                    '& .MuiPaper-root': {
                        backgroundImage: "none",
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        p: "0"
                    }
                }}
            >
                <TextField
                    placeholder="Tìm kiếm..."
                    fullWidth
                    variant="standard"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search className="text-[1.6rem] text-[#637381] font-[600]" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <span className="px-[6px] text-[#637381] h-[24px] min-w-[24px] inline-flex justify-center items-center text-[1.2rem] font-[700] rounded-[6px] bg-[#919EAB29]">Esc</span>
                                </InputAdornment>
                            ),
                            disableUnderline: true,
                        },
                    }}
                    sx={{
                        p: "24px",
                        borderBottom: "1px solid #919eab33",

                        '& .MuiInputBase-root': {
                            p: "0",
                            outline: "none",
                            border: "none !important"
                        },

                        '& .MuiInputBase-input': {
                            fontSize: "1.7rem",
                            fontWeight: "600",
                        }
                    }}
                />
                <ul className="h-[400px] p-[20px] flex flex-col overflow-y-auto">
                    {filteredRoutes.length > 0 ? (
                        filteredRoutes.map((route, index) => (
                            <li key={index} className="mb-[4px]">
                                <Link
                                    to={route.path}
                                    onClick={handleCloseSearchDialog}
                                    className="flex items-center py-[8px] px-[16px] border border-dashed border-b-[#919eab33] bg-transparent border-transparent rounded-[8px] hover:border-[#00A76F] hover:bg-[#00a76f14]"
                                >
                                    <div className="flex-1">
                                        <div className="text-[1.4rem] font-[600] text-[#1C252E]">{route.category}</div>
                                        <span className="text-[1.2rem] text-[#637381]">{route.path}</span>
                                    </div>
                                    <div className="h-[24px] min-w-[24px] inline-flex items-center justify-center px-[6px] text-[1.2rem] bg-[#919EAB29] font-[700] text-[#1C252E] rounded-[6px]">{route.label}</div>
                                </Link>
                            </li>
                        ))
                    ) : (
                        <li className="flex-1 flex items-center justify-center">
                            <div className="text-center text-[#1C252E]">
                                <div className="text-[1.8rem] font-[600] mb-[15px]">Không tìm thấy</div>
                                <p className="text-[1.4rem]">Không tìm thấy kết quả nào cho <span className="font-[700]">"{searchQuery}"</span>.</p>
                                <span className="text-[1.4rem]">Hãy thử kiểm tra lại lỗi chính tả hoặc dùng từ cho đầy đủ.</span>
                            </div>
                        </li>
                    )}
                </ul>
            </Dialog>

            {/* Profile Dialog */}
            <Dialog
                open={openProfileDialog}
                onClose={() => setOpenProfileDialog(false)}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 6,
                        overflow: 'hidden',
                        boxShadow: '0 20px 45px rgba(15,23,42,0.14)',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        px: 3,
                        pt: 2.5,
                        pb: 1.5,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        borderBottom: '1px solid',
                        borderColor: 'grey.100',
                        bgcolor: 'grey.50',
                    }}
                >
                    Thông tin tài khoản
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {myProfile ? (
                        <>
                            {/* Header: avatar + tên + role */}
                            <Box
                                sx={{
                                    px: 4,
                                    pt: 4,
                                    pb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    bgcolor: 'white',
                                    borderBottom: '1px solid',
                                    borderColor: 'grey.100',
                                }}
                            >
                                <Avatar
                                    src={avatarPreview || avatarUrl || myProfile.avatarUrl || undefined}
                                    alt={myProfile.fullName}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        bgcolor: 'primary.main',
                                        fontSize: '2.25rem',
                                        cursor: editMode ? 'pointer' : 'default',
                                    }}
                                    onClick={() => {
                                        if (editMode && avatarInputRef.current) {
                                            avatarInputRef.current.click();
                                        }
                                    }}
                                >
                                    {myProfile.fullName?.charAt(0) ?? 'U'}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '1.5rem', // ~ text-2xl
                                            color: 'grey.900',
                                            mb: 0.5,
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {myProfile.fullName}
                                    </Typography>
                                    {myProfile.positionName && (
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '1rem', // ~ text-base
                                                color: 'primary.main',
                                                mb: 0.25,
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {myProfile.positionName}
                                        </Typography>
                                    )}
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'grey.500' }}>
                                        ID: {myProfile.staffId}
                                        {myProfile.employmentType &&
                                            ` · ${myProfile.employmentType === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian'}`}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Body */}
                            <Box sx={{ px: 4, py: 4, bgcolor: 'grey.50' }}>
                                {/* Thông tin liên hệ (form) */}
                                <Box
                                    sx={{
                                        mb: 4,
                                        p: 3,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '1.05rem', // ~ text-lg
                                            mb: 2,
                                            color: 'grey.900',
                                            borderBottom: '1px solid',
                                            borderColor: 'grey.100',
                                            pb: 0.75,
                                        }}
                                    >
                                        Thông tin liên hệ
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                            gap: 3,
                                        }}
                                    >
                                        <TextField
                                            label="Email"
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={!editMode}
                                            sx={{
                                                '& .MuiInputLabel-root': {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600, // label đậm hơn
                                                    color: 'grey.700',
                                                },
                                                '& .MuiOutlinedInput-input': {
                                                    fontSize: '0.95rem', // ~ text-base
                                                    color: 'grey.900',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '& fieldset': { borderColor: 'grey.300' },
                                                    '&:hover fieldset': { borderColor: 'grey.400' },
                                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                                },
                                            }}
                                        />
                                        <TextField
                                            label="Số điện thoại"
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            disabled={!editMode}
                                            sx={{
                                                '& .MuiInputLabel-root': {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: 'grey.700',
                                                },
                                                '& .MuiOutlinedInput-input': {
                                                    fontSize: '0.95rem',
                                                    color: 'grey.900',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '& fieldset': { borderColor: 'grey.300' },
                                                    '&:hover fieldset': { borderColor: 'grey.400' },
                                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                                },
                                            }}
                                        />
                                        <TextField
                                            label="Địa chỉ"
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            disabled={!editMode}
                                            sx={{
                                                gridColumn: { xs: 'span 1', sm: 'span 2' },
                                                '& .MuiInputLabel-root': {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: 'grey.700',
                                                },
                                                '& .MuiOutlinedInput-input': {
                                                    fontSize: '0.95rem',
                                                    color: 'grey.900',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '& fieldset': { borderColor: 'grey.300' },
                                                    '&:hover fieldset': { borderColor: 'grey.400' },
                                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                                },
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Thông tin cá nhân (read-only) */}
                                <Box
                                    sx={{
                                        p: 3,
                                        bgcolor: 'white',
                                        borderRadius: 2,
                                        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '1.05rem',
                                            mb: 2,
                                            color: 'grey.900',
                                            borderBottom: '1px solid',
                                            borderColor: 'grey.100',
                                            pb: 0.75,
                                        }}
                                    >
                                        Thông tin cá nhân
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                            rowGap: 3,
                                            columnGap: 4,
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500, // label đậm hơn
                                                    color: 'grey.500',
                                                    mb: 0.5,
                                                }}
                                            >
                                                Ngày sinh
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '1rem', // text-base
                                                    fontWeight: 700,
                                                    color: 'grey.900',
                                                }}
                                            >
                                                {myProfile.dateOfBirth ?? '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'grey.500',
                                                    mb: 0.5,
                                                }}
                                            >
                                                Giới tính
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'grey.900',
                                                }}
                                            >
                                                {myProfile.gender === 'MALE'
                                                    ? 'Nam'
                                                    : myProfile.gender === 'FEMALE'
                                                        ? 'Nữ'
                                                        : myProfile.gender === 'OTHER'
                                                            ? 'Khác'
                                                            : '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'grey.500',
                                                    mb: 0.5,
                                                }}
                                            >
                                                CCCD
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'grey.900',
                                                }}
                                            >
                                                {myProfile.citizenId ?? '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'grey.500',
                                                    mb: 0.5,
                                                }}
                                            >
                                                Ngân hàng
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'grey.900',
                                                }}
                                            >
                                                {myProfile.bankName ?? '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'grey.500',
                                                    mb: 0.5,
                                                }}
                                            >
                                                Số tài khoản
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'grey.900',
                                                }}
                                            >
                                                {myProfile.bankAccountNo ?? '—'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ p: 3 }}>
                            <Typography>Không tải được thông tin nhân viên.</Typography>
                        </Box>
                    )}
                </DialogContent>

                {/* Footer */}
                <DialogActions
                    sx={{
                        px: 4,
                        py: 2.5,
                        borderTop: '1px solid',
                        borderColor: 'grey.100',
                        bgcolor: 'grey.50',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                    }}
                >
                    <Button
                        onClick={() => setOpenProfileDialog(false)}
                        sx={{
                            textTransform: 'none',
                            color: 'grey.600',
                            px: 2.5,
                            fontWeight: 700,
                            '&:hover': { bgcolor: 'grey.100' },
                        }}
                    >
                        Đóng
                    </Button>
                    {myProfile && (
                        <>
                            <Button
                                onClick={() => setEditMode((prev) => !prev)}
                                disabled={updatingProfile}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: 'grey.300',
                                    color: 'grey.700',
                                    px: 2.5,
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' },
                                }}
                                variant="outlined"
                            >
                                {editMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
                            </Button>
                            <Button
                                variant="contained"
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 120,
                                    bgcolor: 'primary.main',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: 'primary.dark' },
                                }}
                                onClick={() => {
                                    if (!editMode) {
                                        setEditMode(true);
                                        return;
                                    }
                                    updateProfile(
                                        {
                                            staffId: myProfile.staffId,
                                            data: {
                                                avatarUrl: avatarUrl || null,
                                                email: email || null,
                                                phoneNumber: phoneNumber || null,
                                                address: address || null,
                                            },
                                        },
                                        {
                                            onSuccess: () => {
                                                queryClient.setQueryData(['my-staff-profile'], (old: any) => {
                                                    if (!old?.data) return old;
                                                    return {
                                                        ...old,
                                                        data: {
                                                            ...old.data,
                                                            avatarUrl: avatarUrl || old.data.avatarUrl,
                                                            email,
                                                            phoneNumber,
                                                            address,
                                                        },
                                                    };
                                                });
                                                toast.success('Cập nhật thông tin thành công');
                                                setEditMode(false);
                                            },
                                            onError: (err: any) => {
                                                toast.error(
                                                    err?.response?.data?.message ?? err?.message ?? 'Cập nhật thất bại',
                                                );
                                            },
                                        },
                                    );
                                }}
                                disabled={updatingProfile || avatarUploading}
                            >
                                {editMode ? 'Lưu thay đổi' : 'Lưu'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Hidden file input for avatar upload */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) {
                        toast.error("Vui lòng chọn file ảnh (JPG, PNG, ...).");
                        return;
                    }
                    const maxSizeMB = 10;
                    if (file.size > maxSizeMB * 1024 * 1024) {
                        toast.error(`Ảnh không được quá ${maxSizeMB}MB.`);
                        return;
                    }
                    if (avatarPreview) {
                        URL.revokeObjectURL(avatarPreview);
                    }
                    setAvatarPreview(URL.createObjectURL(file));
                    setAvatarUploading(true);
                    try {
                        const url = await uploadImage(file, "staff-avatars");
                        setAvatarUrl(url);
                        if (avatarInputRef.current) avatarInputRef.current.value = "";
                        toast.success("Tải ảnh lên thành công");
                    } catch (err: any) {
                        const msg = err?.response?.data?.message || err?.message || "Tải ảnh lên thất bại.";
                        toast.error(msg);
                    } finally {
                        setAvatarUploading(false);
                    }
                }}
            />
        </>
    )
}