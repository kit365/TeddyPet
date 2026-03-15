import { 
    Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, List, ListItem, 
    ListItemAvatar, ListItemText, Stack, TextField, Typography, Avatar, MenuItem, Select, 
    FormControl, InputLabel, RadioGroup, FormControlLabel, Radio, Autocomplete, 
    CircularProgress, Paper, Chip, Pagination, Dialog, DialogTitle, DialogContent, 
    Grid, Tooltip
} from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { prefixAdmin } from "../../../constants/routes";
import { 
    Search as SearchIcon, 
    ShoppingCart as ShoppingCartIcon,
    Minus as MinusIcon,
    Plus as PlusIcon,
    Trash2 as TrashIcon,
    User as UserIcon,
    CreditCard as PaymentIcon,
    ChevronRight as ChevronRightIcon,
    Store as StoreIcon,
    Info as InfoIcon,
    Filter as FilterIcon,
    X as CloseIcon,
    Package as PackageIcon
} from "lucide-react";
import { getAllProducts } from "../../../api/product.api";
import { getCategories } from "../../../api/product-category.api";
import { getBrands } from "../../../api/brand.api";
import { createOrder } from "../../../../api/order.api";
import { getUsers } from "../../../api/user.api";
import { toast } from "react-toastify";
import { PaymentMethod, OrderType } from "../../../../types/order.type";
import { CartItem } from "./types";

// Premium Theme Colors from Home Page
const CLIENT_PRIMARY = "#FF6262";
const CLIENT_SECONDARY = "#102937";
const GRADIENT_PRIMARY = "linear-gradient(90deg, #FF6262 0%, #FF9466 100%)";
const FONT_SECONDARY = "'Merriweather', serif";

export const ManualOrderPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Data states
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // UI states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<any[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(12);
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerType, setCustomerType] = useState<"GUEST" | "MEMBER">("GUEST");
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestPhoneError, setGuestPhoneError] = useState<string | null>(null);
    const [orderType, setOrderType] = useState<OrderType>("OFFLINE");
    const [shippingAddressOnline, setShippingAddressOnline] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product Detail Dialog
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedProductDetail, setSelectedProductDetail] = useState<any>(null);

    // Variant Selection Dialog
    const [variantDialogOpen, setVariantDialogOpen] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState<any | null>(null);


    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoadingProducts(true);
        try {
            const [prodRes, catRes, brandRes] = await Promise.all([
                getAllProducts(),
                getCategories(),
                getBrands()
            ]);

            if (prodRes.success && Array.isArray(prodRes.data)) setProducts(prodRes.data);
            if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
            if (brandRes.success && Array.isArray(brandRes.data)) setBrands(brandRes.data);
        } catch (error) {
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSearchUsers = async (keyword: string) => {
        if (!keyword || keyword.length < 2) return;
        try {
            setLoadingUsers(true);
            const res = await getUsers();
            if (res.success && res.data) {
                const filtered = res.data.filter((u: any) => {
                    const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`).trim().toLowerCase();
                    const phone = (u.phoneNumber || "").toLowerCase();
                    const email = (u.email || "").toLowerCase();
                    const k = keyword.toLowerCase();
                    return fullName.includes(k) || phone.includes(k) || email.includes(k);
                });
                setUsers(filtered);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const filteredProducts = useMemo(() => {
        let result = products.filter(p => {
            // Category filter (Multi)
            if (selectedCategories.length > 0) {
                const hasCategory = p.categories?.some((c: any) => 
                    selectedCategories.some(sc => String(sc.categoryId) === String(c.categoryId))
                );
                if (!hasCategory) return false;
            }

            // Brand filter (Multi)
            if (selectedBrands.length > 0) {
                const hasBrand = selectedBrands.some(sb => String(sb.brandId) === String(p.brand?.brandId));
                if (!hasBrand) return false;
            }
            
            const nameMatch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
            const skuMatch = p.variants?.some((v: any) => (v.sku || "").toLowerCase().includes(searchTerm.toLowerCase()));
            
            return nameMatch || skuMatch;
        });
        return result;
    }, [products, searchTerm, selectedCategories, selectedBrands]);

    // Pagination logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);


    const handlePageChange = (_: any, value: number) => {
        setPage(value);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handleAddProduct = (product: any) => {
        if (product.productType === "SIMPLE") {
            if (product.variants?.[0]) {
                addToCart(product.variants[0], product);
            }
        } else {
            setSelectedProductForVariants(product);
            setVariantDialogOpen(true);
        }
    };

    const addToCart = (variant: any, parentProduct?: any) => {
        const vId = variant.variantId || variant.id;
        const pId = variant.productId || parentProduct?.productId || variant.parentProduct?.productId;
        const product = parentProduct || variant.parentProduct;
        const allVariants = product?.variants || [];
        
        const existingIndex = cart.findIndex(item => item.variantId === vId);
        
        if (variant.stockQuantity <= 0) {
            toast.warning("Sản phẩm đã hết hàng");
            return;
        }

        if (existingIndex > -1) {
            const newCart = [...cart];
            if (newCart[existingIndex].quantity >= (variant.stockQuantity || 999)) {
                toast.warning("Vượt quá số lượng trong kho");
                return;
            }
            newCart[existingIndex].quantity += 1;
            setCart(newCart);
        } else {
            const newItem: CartItem = {
                productId: pId,
                variantId: vId,
                name: product?.name || variant.productName,
                variantName: variant.name || variant.sku || "Mặc định",
                price: variant.salePrice || variant.price,
                quantity: 1,
                image: variant.featuredImageUrl || product?.images?.[0]?.imageUrl || "",
                stock: variant.stockQuantity || 999,
                allVariants: allVariants
            };
            setCart([...cart, newItem]);
            toast.success(`Đã thêm ${product?.name} (${newItem.variantName})`, { autoClose: 1000, position: "bottom-center" });
        }
        
        // if (variantDialogOpen) setVariantDialogOpen(false); 
        // User wants to select multiple variants, so don't close.
    };


    const updateQuantity = (variantId: number, delta: number) => {
        const newCart = cart.map(item => {
            if (item.variantId === variantId) {
                const newQty = Math.max(0, Math.min(item.stock, item.quantity + delta));
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0);
        setCart(newCart);
    };

    const handleSwitchVariant = (oldVariantId: number, newVariant: any) => {
        const existingInCart = cart.find(item => item.variantId === newVariant.variantId);
        
        if (existingInCart && existingInCart.variantId !== oldVariantId) {
            toast.info("Biến thể này đã có trong giỏ hàng");
            return;
        }

        setCart(prev => prev.map(item => {
            if (item.variantId === oldVariantId) {
                return {
                    ...item,
                    variantId: newVariant.variantId,
                    variantName: newVariant.name || newVariant.sku || "Mặc định",
                    price: newVariant.salePrice || newVariant.price,
                    image: newVariant.featuredImageUrl || item.image,
                    stock: newVariant.stockQuantity || 999
                };
            }
            return item;
        }));
    };

    const removeFromCart = (variantId: number) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    /** Định dạng SĐT Việt Nam (giống backend): 0 hoặc +84, tiếp theo đầu số 3x, 5x, 7x, 8x, 9x và đủ 8 chữ số. */
    const isValidVietnamesePhone = (phone: string): boolean => {
        const trimmed = phone.trim();
        if (!trimmed) return true;
        const normalized = trimmed.replace(/[\s.]/g, "");
        const regex = /^(0|\+84)((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\d{3})(\d{3})$/;
        return regex.test(normalized);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            toast.error("Vui lòng chọn sản phẩm");
            return;
        }

        if (customerType === "GUEST" && guestPhone.trim() && !isValidVietnamesePhone(guestPhone)) {
            setGuestPhoneError("Số điện thoại không đúng định dạng Việt Nam");
            return;
        }
        setGuestPhoneError(null);

        if (orderType === "ONLINE" && (!shippingAddressOnline || !shippingAddressOnline.trim())) {
            toast.error("Vui lòng nhập địa chỉ giao hàng cho đơn đặt online");
            return;
        }

        try {
            setIsSubmitting(true);
            const orderRequest: any = {
                paymentMethod,
                orderType,
                items: cart.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                })),
                note: orderType === "OFFLINE" ? (note || "Đơn hàng tại quầy") : (note || ""),
                shippingAddress: orderType === "OFFLINE" ? "mua tại quầy" : shippingAddressOnline.trim(),
                latitude: 10.7410688,
                longitude: 106.7164031
            };

            if (customerType === "MEMBER" && selectedUser) {
                orderRequest.receiverName = selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`.trim() || undefined;
                orderRequest.receiverPhone = selectedUser.phoneNumber || undefined;
            } else {
                orderRequest.receiverName = guestName.trim() || undefined;
                orderRequest.receiverPhone = guestPhone.trim() || undefined;
            }

            const res = await createOrder(orderRequest);
            if (res.success) {
                toast.success("Tạo đơn hàng thành công!");
                navigate(`/${prefixAdmin}/order/detail/${res.data.id}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openQuickView = (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        setSelectedProductDetail(product);
        setDetailOpen(true);
    };

    return (
        <Box sx={{ pb: 8, bgcolor: "#F9FAFB" }}>
            {/* Premium Header Banner */}
            <Box 
                sx={{ 
                    p: 4, 
                    mb: 4, 
                    borderRadius: "24px", 
                    background: GRADIENT_PRIMARY,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px -5px rgba(255, 98, 98, 0.4)"
                }}
            >
                <Stack spacing={1} sx={{ position: "relative", zIndex: 1 }}>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Box sx={{ 
                            bgcolor: "rgba(255,255,255,0.2)", 
                            p: 2.5, 
                            borderRadius: "16px", 
                            backdropFilter: "blur(10px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <StoreIcon size={40} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontFamily: FONT_SECONDARY, fontWeight: 800, fontSize: { xs: "1.35rem", md: "1.6rem" } }}>
                                {t("admin.order.manual_order")}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ opacity: 0.9, mt: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>Dashboard</Typography>
                                <ChevronRightIcon size={14} />
                                <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>Đơn hàng</Typography>
                                <ChevronRightIcon size={14} />
                                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.875rem" }}>Tạo đơn mới</Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>
                
                {/* Decorative Background */}
                <Box sx={{ position: "absolute", right: -50, bottom: -50, opacity: 0.15, transform: "rotate(-15deg)" }}>
                    <svg width="350" height="350" viewBox="0 0 100 100" fill="white">
                        <path d="M19.6,58.3c14.3-5.3,18.5-17.8,29.4-13.4c0.5,0.2,0.9,0.4,1.5,0.7c0,0,0.1,0,0.1,0c0.5,0.3,1,0.5,1.4,0.8  c10,6.3,2.3,17,6.4,31.7c1.8,6.5-1.6,14.5-7.8,17.3c-7.4,3.3-10.2-3-18-8c-0.4-0.3-0.8-0.5-1.2-0.7c-0.3-0.2-0.7-0.4-1-0.5  c-0.2-0.1-0.3-0.2-0.5-0.3c-0.2-0.1-1.2-0.6-1.5-0.7c-0.4-0.2-0.8-0.4-1.3-0.5c-8.6-3.4-15.4-2-17-9.9C8.8,68,13.3,60.6,19.6,58.3  L19.6,58.3z"></path>
                    </svg>
                </Box>
            </Box>

            <Box sx={{ 
                display: "grid", 
                gridTemplateColumns: { xs: "1fr", lg: "7.5fr 4.5fr" }, 
                gap: "32px",
                maxWidth: "1600px",
                margin: "0 auto",
                px: { xs: 2, md: 0 }
            }}>
                {/* Left: Product Selection */}
                <Box>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 2, 
                            mb: 3, 
                            borderRadius: "14px", 
                            border: "1px solid #E5E7EB",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                        }}
                    >
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tìm kiếm theo tên hoặc SKU..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon size={20} color="#9CA3AF" />
                                        </InputAdornment>
                                    ),
                                    sx: { 
                                        borderRadius: "12px", 
                                        bgcolor: "#F3F4F6", 
                                        "& fieldset": { border: "none" },
                                        fontSize: "0.9375rem",
                                        fontWeight: 500
                                    }
                                }}
                            />
                            
                            <Stack direction="row" spacing={3} sx={{ width: "100%" }}>
                                <Autocomplete
                                    multiple
                                    sx={{ flex: 1 }}
                                    options={categories}
                                    getOptionLabel={(option) => option.name || ""}
                                    isOptionEqualToValue={(option, value) => String(option.categoryId) === String(value.categoryId)}
                                    value={selectedCategories}
                                    onChange={(_, newValue) => {
                                        setSelectedCategories(newValue);
                                        setPage(1);
                                    }}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            size="small"
                                            label="Lọc theo Danh mục"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: <><FilterIcon size={16} style={{ marginRight: 6, color: "#6B7280" }} />{params.InputProps.startAdornment}</>
                                            }}
                                            sx={{ 
                                                "& .MuiOutlinedInput-root": { 
                                                    borderRadius: "12px", 
                                                    fontSize: "0.875rem"
                                                },
                                                "& .MuiInputLabel-root": { fontSize: "0.875rem", fontWeight: 600 },
                                                "& .MuiAutocomplete-tag": { 
                                                    fontSize: "0.75rem", 
                                                    fontWeight: 600, 
                                                    borderRadius: "6px",
                                                    bgcolor: "#FFE4E4",
                                                    color: CLIENT_PRIMARY
                                                }
                                            }}
                                        />
                                    )}
                                    ListboxProps={{
                                        sx: { "& .MuiAutocomplete-option": { fontSize: "0.875rem", py: 1 } }
                                    }}
                                />

                                <Autocomplete
                                    multiple
                                    sx={{ flex: 1 }}
                                    options={brands}
                                    getOptionLabel={(option) => option.name || ""}
                                    isOptionEqualToValue={(option, value) => String(option.brandId) === String(value.brandId)}
                                    value={selectedBrands}
                                    onChange={(_, newValue) => {
                                        setSelectedBrands(newValue);
                                        setPage(1);
                                    }}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            size="small"
                                            label="Lọc theo Thương hiệu"
                                            sx={{ 
                                                "& .MuiOutlinedInput-root": { 
                                                    borderRadius: "12px", 
                                                    fontSize: "0.875rem"
                                                },
                                                "& .MuiInputLabel-root": { fontSize: "0.875rem", fontWeight: 600 },
                                                "& .MuiAutocomplete-tag": { 
                                                    fontSize: "0.75rem", 
                                                    fontWeight: 600, 
                                                    borderRadius: "6px",
                                                    bgcolor: "#E3F2FD",
                                                    color: "#1976D2"
                                                }
                                            }}
                                        />
                                    )}
                                    ListboxProps={{
                                        sx: { "& .MuiAutocomplete-option": { fontSize: "0.875rem", py: 1 } }
                                    }}
                                />

                                <Button 
                                    size="small"
                                    sx={{ 
                                        minWidth: "100px", 
                                        borderRadius: "10px", 
                                        color: CLIENT_PRIMARY,
                                        fontWeight: 700,
                                        fontSize: "0.8125rem",
                                        "&:hover": { bgcolor: "rgba(255, 98, 98, 0.08)" }
                                    }}
                                    onClick={() => { 
                                        setSearchTerm(""); 
                                        setSelectedCategories([]); 
                                        setSelectedBrands([]); 
                                        setPage(1); 
                                    }}
                                >
                                    Xóa lọc
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    <Box sx={{ 
                        display: "grid", 
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr" }, 
                        gap: "24px",
                        minHeight: "600px"
                    }}>
                        {loadingProducts ? (
                            <Box sx={{ gridColumn: "1/-1", py: 20, display: "flex", justifyContent: "center" }}><CircularProgress color="error" thickness={5} size={60} /></Box>
                        ) : paginatedProducts.length === 0 ? (
                            <Box sx={{ gridColumn: "1/-1", py: 6, textAlign: "center" }}>
                                <PackageIcon size={48} color="#eee" style={{ margin: "0 auto 12px" }} />
                                <Typography variant="body1" color="text.secondary" sx={{ fontSize: "0.9375rem" }}>Không tìm thấy sản phẩm</Typography>
                            </Box>
                        ) : paginatedProducts.map((product) => (
                            <Card 
                                key={product.productId}
                                elevation={0}
                                onClick={() => handleAddProduct(product)}
                                sx={{ 
                                    borderRadius: "24px", 
                                    border: "2px solid",
                                    borderColor: "transparent",
                                    transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                                    cursor: "pointer",
                                    "&:hover": { 
                                        borderColor: CLIENT_PRIMARY,
                                        transform: "translateY(-8px)",
                                        boxShadow: "0 20px 40px -15px rgba(255, 98, 98, 0.25)"
                                    },
                                    overflow: "hidden",
                                    position: "relative",
                                    bgcolor: "white"
                                }}
                            >
                                <Box sx={{ position: "relative", height: 160 }}>
                                    <Avatar 
                                        src={product.images?.[0]?.imageUrl || product.featuredImageUrl} 
                                        variant="square" 
                                        sx={{ width: "100%", height: "100%", bgcolor: "#F5F5F3" }}
                                    />
                                    <Tooltip title="Xem thông tin chi tiết">
                                        <IconButton 
                                            onClick={(e) => openQuickView(e, product)}
                                            sx={{ 
                                                position: "absolute", top: 12, right: 12, 
                                                bgcolor: "rgba(255,255,255,0.8)", 
                                                backdropFilter: "blur(4px)",
                                                "&:hover": { bgcolor: "white" }
                                            }}
                                        >
                                            <InfoIcon size={20} color={CLIENT_SECONDARY} />
                                        </IconButton>
                                    </Tooltip>

                                    {product.productType === "VARIABLE" && (
                                        <Box sx={{ position: "absolute", bottom: 12, left: 12 }}>
                                            <Chip 
                                                label={`${product.variants?.length} phân loại`} 
                                                size="small" 
                                                sx={{ bgcolor: CLIENT_SECONDARY, color: "white", fontWeight: 700, backdropFilter: "blur(4px)" }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                                
                                <CardContent sx={{ p: 1.5 }}>
                                    <Stack spacing={0.75}>
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", fontFamily: FONT_SECONDARY, color: CLIENT_SECONDARY }} className="line-clamp-1">
                                            {product.name}
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}>
                                                {product.brand?.name || "TeddyPet Store"}
                                            </Typography>
                                        </Stack>
                                        
                                        <Divider sx={{ my: 0.5, borderStyle: "dashed" }} />
                                        
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: CLIENT_PRIMARY }}>
                                                {product.minPrice === product.maxPrice 
                                                    ? `${new Intl.NumberFormat('vi-VN').format(product.minPrice)}đ` 
                                                    : `${new Intl.NumberFormat('vi-VN').format(product.minPrice)}đ - ${new Intl.NumberFormat('vi-VN').format(product.maxPrice)}đ`
                                                }
                                            </Typography>
                                            <Box sx={{ 
                                                bgcolor: "rgba(16, 185, 129, 0.1)",
                                                color: "#10B981",
                                                px: 1, py: 0.25, borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700
                                            }}>
                                                POS
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    {totalPages > 1 && (
                        <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
                            <Pagination 
                                count={totalPages} 
                                page={page} 
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                sx={{ 
                                    "& .MuiPaginationItem-root": { fontWeight: 800, borderRadius: "12px" }
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Right: Checkout Sidebar */}
                <Stack spacing={3} sx={{ position: "sticky", top: 24, height: "fit-content" }}>
                    {/* Cart Summary */}
                    <Paper 
                        elevation={0}
                        sx={{ 
                            borderRadius: "28px", 
                            overflow: "hidden", 
                            border: "1px solid #E5E7EB",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08)"
                        }}
                    >
                        <Box sx={{ p: 2, bgcolor: CLIENT_SECONDARY, color: "white" }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", p: 0.75, borderRadius: "8px" }}>
                                    <ShoppingCartIcon size={20} />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontFamily: FONT_SECONDARY, fontWeight: 800, fontSize: "1rem" }}>
                                    Thanh toán
                                </Typography>
                                <Chip 
                                    size="small"
                                    label={`${cart.length} món`} 
                                    sx={{ ml: "auto", fontWeight: 700, fontSize: "0.75rem", bgcolor: CLIENT_PRIMARY, color: "white" }} 
                                />
                            </Stack>
                        </Box>
                        
                        <CardContent sx={{ p: 2, maxHeight: "calc(100vh - 420px)", overflowY: "auto" }}>
                            {cart.length === 0 ? (
                                <Box py={5} textAlign="center">
                                    <Box sx={{ color: "#E5E7EB", mb: 1.5 }}><ShoppingCartIcon size={48} /></Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>Giỏ hàng đang trống</Typography>
                                </Box>
                            ) : (
                                <List disablePadding>
                                    {cart.map((item) => (
                                        <ListItem key={item.variantId} disableGutters sx={{ py: 1.5, borderBottom: "1px dashed #E5E7EB" }}>
                                            <ListItemAvatar sx={{ mr: 1.5 }}>
                                                <Avatar src={item.image} variant="rounded" sx={{ width: 52, height: 52, borderRadius: "10px", border: "1px solid #eee" }} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: CLIENT_SECONDARY, mb: 0.25 }}>{item.name}</Typography>}
                                                secondary={
                                                    <Box>
                                                        {item.allVariants && item.allVariants.length > 1 ? (
                                                            <Select
                                                                size="small"
                                                                value={item.variantId}
                                                                onChange={(e) => {
                                                                    const v = item.allVariants?.find(av => (av.variantId || av.id) === e.target.value);
                                                                    if (v) handleSwitchVariant(item.variantId, v);
                                                                }}
                                                                sx={{ 
                                                                    height: 22, 
                                                                    fontSize: "0.75rem", 
                                                                    fontWeight: 600,
                                                                    "& .MuiSelect-select": { py: 0, px: 0.75 },
                                                                    bgcolor: "#F3F4F6",
                                                                    borderRadius: "4px"
                                                                }}
                                                            >
                                                                {item.allVariants.map((v: any) => (
                                                                    <MenuItem key={v.variantId || v.id} value={v.variantId || v.id} sx={{ fontSize: "0.8125rem" }}>
                                                                        {v.name || v.sku} - {new Intl.NumberFormat('vi-VN').format(v.salePrice || v.price)}đ
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        ) : (
                                                            <Typography sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 600 }}>
                                                                {item.variantName} • {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <Stack alignItems="flex-end" spacing={1}>
                                                <Box sx={{ 
                                                    display: "flex", alignItems: "center", bgcolor: "#F3F4F6", 
                                                    borderRadius: "20px", p: 0.25, border: "1px solid #E5E7EB" 
                                                }}>
                                                    <IconButton size="small" onClick={() => updateQuantity(item.variantId, -1)} sx={{ color: CLIENT_SECONDARY, p: 0.25 }}><MinusIcon size={14} /></IconButton>
                                                    <Typography sx={{ fontWeight: 800, minWidth: 26, textAlign: "center", fontSize: "0.8125rem" }}>{item.quantity}</Typography>
                                                    <IconButton size="small" onClick={() => updateQuantity(item.variantId, 1)} sx={{ color: CLIENT_PRIMARY, p: 0.25 }}><PlusIcon size={14} /></IconButton>
                                                </Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.9375rem", color: CLIENT_PRIMARY }}>
                                                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                                                </Typography>
                                            </Stack>
                                            <IconButton 
                                                sx={{ ml: 1, color: "#9CA3AF", "&:hover": { color: "#EF4444" } }} 
                                                onClick={() => removeFromCart(item.variantId)}
                                            >
                                                <TrashIcon size={20} />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>

                        <Box sx={{ p: 2, bgcolor: "#FDFDFD", borderTop: "1px solid #E5E7EB" }}>
                            <Box sx={{ bgcolor: "rgba(255, 98, 98, 0.04)", p: 2, borderRadius: "12px", border: "1px solid rgba(255, 98, 98, 0.1)" }}>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.875rem" }}>Tạm tính</Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</Typography>
                                    </Stack>
                                    <Divider sx={{ borderStyle: "dashed" }} />
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography sx={{ fontWeight: 800, fontFamily: FONT_SECONDARY, color: CLIENT_SECONDARY, fontSize: "1rem" }}>Tổng cộng</Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color: CLIENT_PRIMARY }}>
                                            {new Intl.NumberFormat('vi-VN').format(subtotal)}đ
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Customer Info & Confirm */}
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 2.5, 
                            borderRadius: "16px", 
                            border: "1px solid #E5E7EB",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, color: CLIENT_SECONDARY, fontWeight: 800, fontFamily: FONT_SECONDARY, fontSize: "0.9375rem" }}>
                            <UserIcon size={18} color={CLIENT_PRIMARY} /> Thông tin khách hàng
                        </Typography>

                        {/* Loại đơn - tách riêng */}
                        <Box sx={{ mb: 2.5 }}>
                            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: CLIENT_SECONDARY, mb: 1.5 }}>Loại đơn</Typography>
                            <RadioGroup
                                row
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value as OrderType)}
                            >
                                <FormControlLabel
                                    value="OFFLINE"
                                    control={<Radio size="small" sx={{ color: "#1976d2", "&.Mui-checked": { color: "#1976d2" } }} />}
                                    label={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>Tại quầy</Typography>}
                                    sx={{
                                        flex: 1,
                                        m: 0,
                                        p: 0.75,
                                        borderRadius: "10px",
                                        bgcolor: orderType === "OFFLINE" ? "#E3F2FD" : "transparent",
                                        border: "1px solid",
                                        borderColor: orderType === "OFFLINE" ? "#90CAF9" : "transparent",
                                    }}
                                />
                                <FormControlLabel
                                    value="ONLINE"
                                    control={<Radio size="small" sx={{ color: "#2e7d32", "&.Mui-checked": { color: "#2e7d32" } }} />}
                                    label={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>Đặt online</Typography>}
                                    sx={{
                                        flex: 1,
                                        m: 0,
                                        ml: 1,
                                        p: 0.75,
                                        borderRadius: "10px",
                                        bgcolor: orderType === "ONLINE" ? "#E8F5E9" : "transparent",
                                        border: "1px solid",
                                        borderColor: orderType === "ONLINE" ? "#A5D6A7" : "transparent",
                                    }}
                                />
                            </RadioGroup>
                        </Box>

                        <Divider sx={{ my: 2, borderStyle: "dashed" }} />

                        {/* Loại khách - tách riêng */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: CLIENT_SECONDARY, mb: 1.5 }}>Loại khách</Typography>
                            <RadioGroup
                                row
                                value={customerType}
                                onChange={(e) => setCustomerType(e.target.value as any)}
                            >
                                <FormControlLabel
                                    value="GUEST"
                                    control={<Radio size="small" color="error" />}
                                    label={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>Khách vãng lai</Typography>}
                                    sx={{ flex: 1, bgcolor: customerType === "GUEST" ? "#FFF1F1" : "transparent", borderRadius: "10px", m: 0, p: 0.75 }}
                                />
                                <FormControlLabel
                                    value="MEMBER"
                                    control={<Radio size="small" color="error" />}
                                    label={<Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>Thành viên</Typography>}
                                    sx={{ flex: 1, bgcolor: customerType === "MEMBER" ? "#FFF1F1" : "transparent", borderRadius: "10px", m: 0, p: 0.75, ml: 1 }}
                                />
                            </RadioGroup>
                        </Box>

                        {customerType === "GUEST" ? (
                            <Stack spacing={1.5}>
                                <TextField 
                                    fullWidth 
                                    size="small"
                                    label="Họ tên khách hàng" 
                                    value={guestName} 
                                    placeholder="Nhập tên khách..."
                                    onChange={(e) => setGuestName(e.target.value)} 
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.875rem" } }}
                                />
                                <TextField 
                                    fullWidth 
                                    size="small"
                                    label="Số điện thoại" 
                                    value={guestPhone} 
                                    placeholder="Ví dụ: 0901234567"
                                    error={!!guestPhoneError}
                                    helperText={guestPhoneError}
                                    onChange={(e) => {
                                        setGuestPhone(e.target.value);
                                        if (guestPhoneError) setGuestPhoneError(null);
                                    }}
                                    onBlur={() => {
                                        if (guestPhone.trim() && !isValidVietnamesePhone(guestPhone)) {
                                            setGuestPhoneError("Số điện thoại không đúng định dạng Việt Nam");
                                        } else {
                                            setGuestPhoneError(null);
                                        }
                                    }}
                                    sx={{ 
                                        "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.875rem" },
                                        "& .MuiFormHelperText-root": { color: "#d32f2f", fontSize: "0.75rem", marginLeft: 1 }
                                    }}
                                />
                            </Stack>
                        ) : (
                            <Autocomplete
                                fullWidth
                                options={users}
                                getOptionLabel={(option) => {
                                    const name = option.fullName || `${option.firstName || ""} ${option.lastName || ""}`.trim();
                                    return `${name} (${option.phoneNumber || option.email})`;
                                }}
                                loading={loadingUsers}
                                onInputChange={(_, value) => handleSearchUsers(value)}
                                onChange={(_, value) => setSelectedUser(value)}
                                PaperComponent={({ children }) => (
                                    <Paper sx={{ borderRadius: "16px", mt: 1, boxShadow: "0 15px 30px rgba(0,0,0,0.15)", border: "1px solid #eee" }}>{children}</Paper>
                                )}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        size="small"
                                        label="Tìm kiếm theo Tên, SĐT hoặc Email..." 
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.875rem" } }}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon size={20} color={CLIENT_PRIMARY} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <>
                                                    {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}

                        {orderType === "ONLINE" && (
                            <TextField
                                fullWidth
                                size="small"
                                label="Địa chỉ giao hàng"
                                required
                                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                                value={shippingAddressOnline}
                                onChange={(e) => setShippingAddressOnline(e.target.value)}
                                sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.875rem" } }}
                            />
                        )}

                        <Divider sx={{ my: 2.5 }} />

                        <Typography variant="subtitle1" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, color: CLIENT_SECONDARY, fontWeight: 800, fontFamily: FONT_SECONDARY, fontSize: "0.9375rem" }}>
                            <PaymentIcon size={18} color={CLIENT_PRIMARY} /> Thanh toán
                        </Typography>

                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Phương thức thanh toán</InputLabel>
                                <Select 
                                    value={paymentMethod} 
                                    label="Phương thức thanh toán"
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    sx={{ borderRadius: "10px", fontSize: "0.875rem" }}
                                >
                                    <MenuItem value="CASH">Tiền mặt (Tại quầy)</MenuItem>
                                    <MenuItem value="BANK_TRANSFER">Chuyển khoản (PayOS QR)</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                label="Ghi chú đơn hàng"
                                placeholder="Ghi chú về phục vụ, yêu cầu thêm..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.875rem" } }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                size="medium"
                                disabled={isSubmitting || cart.length === 0}
                                onClick={handlePlaceOrder}
                                sx={{ 
                                    py: 1.25, 
                                    borderRadius: "12px", 
                                    background: GRADIENT_PRIMARY,
                                    color: "white",
                                    fontWeight: 800,
                                    fontSize: "0.9375rem",
                                    fontFamily: FONT_SECONDARY,
                                    textTransform: "none",
                                    boxShadow: "0 4px 14px rgba(255, 98, 98, 0.4)",
                                    "&:hover": { 
                                        boxShadow: "0 6px 20px rgba(255, 98, 98, 0.5)",
                                        transform: "scale(1.01)"
                                    },
                                    "&:disabled": { opacity: 0.6 },
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {isSubmitting ? "Đang tạo đơn..." : "XÁC NHẬN VÀ LÊN ĐƠN"}
                            </Button>
                        </Stack>
                    </Paper>
                </Stack>
            </Box>

            {/* Product Detail Dialog (Quick View) */}
            <Dialog 
                open={detailOpen} 
                onClose={() => setDetailOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: "24px", p: 2 } }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h4" sx={{ fontFamily: FONT_SECONDARY, fontWeight: 800, color: CLIENT_SECONDARY }}>
                            Chi tiết sản phẩm
                        </Typography>
                        <IconButton onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {selectedProductDetail && (
                        <Grid container spacing={4} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Avatar 
                                    src={selectedProductDetail.images?.[0]?.imageUrl} 
                                    variant="rounded" 
                                    sx={{ width: "100%", height: 350, borderRadius: "20px" }} 
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Stack spacing={2}>
                                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{selectedProductDetail.name}</Typography>
                                    <Typography color="text.secondary" sx={{ fontSize: "1.4rem" }}>{selectedProductDetail.description || "Chưa có mô tả chi tiết."}</Typography>
                                    
                                    <Divider />
                                    
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Thông số kỹ thuật:</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Danh mục:</Typography>
                                            <Typography sx={{ fontWeight: 700 }}>{selectedProductDetail.categories?.[0]?.name || "N/A"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Thương hiệu:</Typography>
                                            <Typography sx={{ fontWeight: 700 }}>{selectedProductDetail.brand?.name || "TeddyPet Store"}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Tầm giá:</Typography>
                                            <Typography sx={{ fontWeight: 800, color: CLIENT_PRIMARY }}>
                                                {new Intl.NumberFormat('vi-VN').format(selectedProductDetail.minPrice)}đ - {new Intl.NumberFormat('vi-VN').format(selectedProductDetail.maxPrice)}đ
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Loại sản phẩm:</Typography>
                                            <Typography sx={{ fontWeight: 700 }}>{selectedProductDetail.productType || "Vật dụng"}</Typography>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 3, p: 2, bgcolor: "#FDF2F2", borderRadius: "16px", border: "1px solid rgba(255, 98, 98, 0.1)" }}>
                                        <Typography variant="h6" sx={{ color: CLIENT_PRIMARY, fontWeight: 800, mb: 1 }}>Phân loại ({selectedProductDetail.variants?.length}):</Typography>
                                        <List dense>
                                            {selectedProductDetail.variants?.map((v: any) => (
                                                <ListItem key={v.variantId}>
                                                    <ListItemText 
                                                        primary={<Typography sx={{ fontWeight: 700 }}>{v.name}</Typography>} 
                                                        secondary={`SKU: ${v.sku} | Kho: ${v.stockQuantity}`} 
                                                    />
                                                    <Typography sx={{ fontWeight: 800, color: CLIENT_SECONDARY }}>{new Intl.NumberFormat('vi-VN').format(v.price)}đ</Typography>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
            </Dialog>
            {/* Variant Selection Dialog */}
            <Dialog 
                open={variantDialogOpen} 
                onClose={() => setVariantDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: "14px", maxHeight: "85vh" } }}
            >
                <DialogTitle sx={{ p: 2, pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontFamily: FONT_SECONDARY, fontWeight: 800, color: CLIENT_SECONDARY, fontSize: "1rem" }}>
                                Chọn phân loại
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.8125rem", mt: 0.25 }}>
                                {selectedProductForVariants?.name}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setVariantDialogOpen(false)} sx={{ bgcolor: "#F3F4F6" }}>
                            <CloseIcon size={18} />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List sx={{ pt: 0 }}>
                        {selectedProductForVariants?.variants?.map((v: any, index: number) => (
                            <ListItem 
                                key={v.variantId || index}
                                sx={{ 
                                    py: 1.25, 
                                    px: 2, 
                                    borderBottom: "1px solid #F3F4F6",
                                    cursor: v.stockQuantity > 0 ? "pointer" : "default",
                                    opacity: v.stockQuantity > 0 ? 1 : 0.6,
                                    "&:hover": v.stockQuantity > 0 ? { bgcolor: "#FFF1F1" } : {},
                                    transition: "all 0.2s"
                                }}
                                onClick={() => v.stockQuantity > 0 && addToCart(v, selectedProductForVariants)}
                            >
                                <ListItemAvatar sx={{ mr: 1.5, minWidth: 44 }}>
                                    <Avatar 
                                        src={v.featuredImageUrl || selectedProductForVariants?.images?.[0]?.imageUrl} 
                                        variant="rounded" 
                                        sx={{ width: 44, height: 44, borderRadius: "8px", border: "1px solid #eee" }}
                                    />
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
                                            <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: CLIENT_SECONDARY }}>
                                                {v.name || v.sku || "Phân loại " + (index+1)}
                                            </Typography>
                                            <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: CLIENT_PRIMARY }}>
                                                {new Intl.NumberFormat('vi-VN').format(v.salePrice || v.price)}đ
                                            </Typography>
                                        </Stack>
                                    } 
                                    secondary={
                                        <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem" }}>
                                                SKU: {v.sku}
                                            </Typography>
                                            <Typography variant="caption" sx={{ 
                                                fontWeight: 700, 
                                                fontSize: "0.75rem",
                                                color: v.stockQuantity > 5 ? "#10B981" : "#EF4444" 
                                            }}>
                                                Kho: {v.stockQuantity}
                                            </Typography>
                                        </Stack>
                                    } 
                                />
                                {v.stockQuantity > 0 ? (
                                    <IconButton size="small" sx={{ ml: 1, bgcolor: CLIENT_PRIMARY, color: "white", "&:hover": { bgcolor: "#E64A19" } }}>
                                        <PlusIcon size={16} />
                                    </IconButton>
                                ) : (
                                    <Chip label="Hết hàng" size="small" color="error" sx={{ ml: 1, fontWeight: 600, fontSize: "0.7rem", height: 22 }} />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <Box sx={{ p: 1.5, bgcolor: "#F9FAFB", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px" }}>
                    <Button 
                        fullWidth 
                        size="small"
                        onClick={() => setVariantDialogOpen(false)}
                        sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none", fontSize: "0.875rem" }}
                    >
                        Quay lại
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
};
