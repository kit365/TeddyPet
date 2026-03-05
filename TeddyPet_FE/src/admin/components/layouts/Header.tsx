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
import Dialog from "@mui/material/Dialog";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from 'react-toastify';
import { InputAdornment, TextField } from "@mui/material";
import { Search } from "iconoir-react";
import { Link } from "react-router-dom";
import { LogoTeddyPet } from "../../../assets/admin/LogoTeddyPet";

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
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [openSearchDialog, setOpenSearchDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
                            <span className="text-[1.8rem] font-[800] text-[#1c252e] uppercase tracking-wider">TeddyPet Dashboard</span>
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
                            <Button
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
        </>
    )
}