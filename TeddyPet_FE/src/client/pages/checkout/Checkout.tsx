import { useEffect, useState, useRef } from "react";
import { ProductBanner } from "../product/sections/ProductBanner"
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Phone, User, Search, LogOut, Navigation } from "lucide-react";
import { useCartStore } from "../../../stores/useCartStore";
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { FooterSub } from "../../components/layouts/FooterSub";
import { getAllAddresses, createAddress } from "../../../api/address.api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../../stores/useAuthStore";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-toastify";
import { createOrder } from "../../../api/order.api";
import { OrderRequest, OrderItemRequest, PaymentMethod } from "../../../types/order.type";
import { UserAddressResponse } from "../../../types/address.type";
import { sendGuestOtp, verifyGuestOtp } from "../../../api/otp.api";
// Phí ship luôn "Liên hệ sau" - shop gọi lại chốt giá, không tính lúc checkout
import { CheckCircle2 } from "lucide-react";

// Fix for leaflet default marker icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const breadcrumbs = [
    { label: "Trang chủ", to: "/" },
    { label: "Thanh toán", to: "/checkout" },
];

const schema = z.object({
    fullName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    note: z.string().optional(),
    guestEmail: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    otpCode: z.string().optional(),
    saveAddress: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function MapController({ center }: { center: L.LatLngExpression }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15);
    }, [center, map]);
    return null;
}

function MapResizeHandler({ active }: { active: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (!active) return;

        // Use ResizeObserver to detect any change in the map container size
        const container = map.getContainer();
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });

        resizeObserver.observe(container);

        // Still keep the timeout as a fallback for the initial animation
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 500);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [active, map]);

    return null;
}

function LocationMarker({
    position,
    setPosition,
    onLocationSelect
}: {
    position: L.LatLng | null;
    setPosition: (pos: L.LatLng) => void;
    onLocationSelect: (lat: number, lon: number) => void;
}) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [showOrderNotes, setShowOrderNotes] = useState(false);
    const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [shippingFee] = useState<number | null>(null); // Luôn null = "Liên hệ sau" (giữ hook để tránh lỗi "Rendered more hooks")
    const [_calculatingFee] = useState(false); // Không dùng, giữ để số lượng hooks ổn định

    // Shipping & Payment States
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Map States for New Address
    const [newPos, setNewPos] = useState<L.LatLng | null>(new L.LatLng(10.7410688, 106.7164031));
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.7410688, 106.7164031]);
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isManualChange = useRef(false);

    // Guest Auth States
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isGuestVerified, setIsGuestVerified] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const items = useCartStore((state) => state.items);
    const cartTotalAmount = useCartStore((state) => state.totalAmountChecked());
    const clearCart = useCartStore((state) => state.clearCart);
    const buyNowItem = useCartStore((state) => state.buyNowItem);
    const setBuyNowItem = useCartStore((state) => state.setBuyNowItem);

    // Identify checkout type
    const isBuyNow = !!buyNowItem;
    const checkoutItems = isBuyNow ? [buyNowItem] : items.filter(item => item.checked);
    const checkoutTotalAmount = isBuyNow
        ? (buyNowItem.option.price * buyNowItem.quantity)
        : cartTotalAmount;

    const { register, handleSubmit, setValue, watch, getValues } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: user ? `${user.firstName} ${user.lastName}` : "",
            phone: user?.phoneNumber || "",
            latitude: 10.7410688,
            longitude: 106.7164031,
            saveAddress: false
        }
    });

    // Handle auto-verification from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const email = params.get("verify-email");
        const otp = params.get("otp");

        if (email) {
            setValue("guestEmail", email);
        }
        if (otp) {
            setValue("otpCode", otp);
            toast.info("Đã tự động điền mã xác thực từ email.");

            // Auto trigger verification if both are present
            if (email && otp) {
                handleVerifyOtpAction(email, otp);
            }
        }
    }, [location.search, setValue]);

    const handleVerifyOtpAction = async (email: string, otp: string) => {
        setIsVerifyingOtp(true);
        try {
            const response = await verifyGuestOtp(email, otp);
            if (response.success) {
                toast.success("Xác thực email thành công! Bạn có thể tiếp tục đặt hàng.");
                setIsGuestVerified(true);
            } else {
                toast.error(response.message || "Mã xác thực không chính xác");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi xác thực OTP");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    // Update form values if user loads after initial render
    useEffect(() => {
        if (user) {
            setValue("fullName", `${user.firstName} ${user.lastName}`);
            if (user.phoneNumber) setValue("phone", user.phoneNumber);
        }
    }, [user, setValue]);

    const watchAddress = watch("address");
    const watchGuestEmail = watch("guestEmail");

    useEffect(() => {
        let timer: any;
        if (otpCooldown > 0) {
            timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [otpCooldown]);

    const handleSendOtp = async () => {
        if (!watchGuestEmail || !watchGuestEmail.includes("@")) {
            toast.error("Vui lòng nhập email hợp lệ!");
            return;
        }
        setIsSendingOtp(true);
        try {
            const response = await sendGuestOtp(watchGuestEmail);
            if (response.success) {
                toast.success("Mã OTP đã được gửi đến email của bạn!");
                setOtpCooldown(Number(response.data) || 120);
            } else {
                toast.error(response.message || "Gửi OTP thất bại");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi gửi OTP");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const watchOtpCode = watch("otpCode");

    const onManualVerify = () => {
        if (!watchGuestEmail || !watchOtpCode) {
            toast.error("Vui lòng nhập đầy đủ Email và mã OTP");
            return;
        }
        handleVerifyOtpAction(watchGuestEmail, watchOtpCode);
    };

    // Fetch initial addresses
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user) {
                setLoadingAddresses(false);
                return;
            }
            try {
                const response = await getAllAddresses();
                if (response.success) {
                    setAddresses(response.data);
                    const defaultAddr = response.data.find((addr: UserAddressResponse) => addr.isDefault);
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr.id.toString());
                    } else if (response.data.length > 0) {
                        setSelectedAddressId(response.data[0].id.toString());
                    } else {
                        setSelectedAddressId("new");
                    }
                }
            } catch (error) {
                console.error("Lỗi lấy địa chỉ:", error);
            } finally {
                setLoadingAddresses(false);
            }
        };

        fetchAddresses();
    }, [user]);

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.info("Trình duyệt của bạn không hỗ trợ định vị GPS");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newLatLng = new L.LatLng(latitude, longitude);
                setNewPos(newLatLng);
                setMapCenter([latitude, longitude]);
                setValue("latitude", latitude);
                setValue("longitude", longitude);
                fetchAddressFromCoords(latitude, longitude);
            },
            (err) => {
                console.error("Lỗi GPS:", err);
                toast.error("Không thể lấy vị trí. Vui lòng kiểm tra quyền GPS.");
            }
        );
    };

    const fetchAddressFromCoords = async (lat: number, lon: number) => {
        setValue("latitude", lat);
        setValue("longitude", lon);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                isManualChange.current = false;
                setValue("address", data.display_name);
                setSearchKeyword(data.display_name);
            }
        } catch (error) {
            console.error("Lỗi reverse geocoding:", error);
        }
    };

    const geocodeFromAddress = async (query: string, isFromSearch: boolean = false) => {
        if (!query.trim() || query.length < 3) return;
        try {
            const trySearch = async (q: string) => {
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
                return await res.json();
            };

            let data = await trySearch(query);

            if (!(data.features && data.features.length > 0) && query.includes("/")) {
                const parts = query.split(/[\s,]+/);
                const houseNumIndex = parts.findIndex(p => p.includes("/"));
                if (houseNumIndex !== -1) {
                    const fallbackQuery = parts.slice(houseNumIndex + 1).join(" ") || query.replace(/\/\d+/g, "");
                    data = await trySearch(fallbackQuery);
                }
            }

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const lat = feature.geometry.coordinates[1];
                const lon = feature.geometry.coordinates[0];
                setNewPos(new L.LatLng(lat, lon));
                setValue("latitude", lat);
                setValue("longitude", lon);
                setMapCenter([lat, lon]);

                const p = feature.properties;
                const houseNum = p.housenumber ? `${p.housenumber} ` : "";
                const street = p.street || "";
                const name = (p.name && p.name !== p.street) ? p.name : "";

                const mainPart = name ? (street ? `${name}, ${houseNum}${street}` : `${houseNum}${name}`) : `${houseNum}${street}`;
                const parts = [mainPart, p.district, p.city, p.country];
                const displayName = parts.filter(Boolean).join(", ");

                if (isFromSearch || !isManualChange.current) {
                    setValue("address", displayName);
                }
                setSearchKeyword(displayName);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error("Lỗi Geocoding:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchKeyword.length > 2) {
                try {
                    const lat = newPos?.lat || 10.7410688;
                    const lon = newPos?.lng || 106.7164031;
                    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchKeyword)}&limit=10&lat=${lat}&lon=${lon}&location_bias_scale=0.5`);
                    const data = await res.json();

                    const photonSuggestions = data.features.map((f: any) => {
                        const p = f.properties;
                        const houseNum = p.housenumber ? `${p.housenumber} ` : "";
                        const street = p.street || "";
                        const name = (p.name && p.name !== p.street) ? p.name : "";

                        const mainPart = name ? (street ? `${name}, ${houseNum}${street}` : `${houseNum}${name}`) : `${houseNum}${street}`;
                        const parts = [mainPart, p.district, p.city, p.country];
                        const displayName = parts.filter(Boolean).join(", ");

                        return {
                            display_name: displayName,
                            lat: f.geometry.coordinates[1],
                            lon: f.geometry.coordinates[0],
                            type: p.osm_value
                        };
                    });

                    setSuggestions(photonSuggestions);
                    setShowSuggestions(true);
                } catch (error) {
                    console.log(error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchKeyword, newPos]);

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        setNewPos(new L.LatLng(lat, lon));
        setMapCenter([lat, lon]);
        setValue("latitude", lat);
        setValue("longitude", lon);
        setValue("address", suggestion.display_name);
        setSearchKeyword(suggestion.display_name);
        setShowSuggestions(false);
    };

    const handlePlaceOrder = async (data: FormData) => {
        const activeItems = checkoutItems;

        if (activeItems.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
            return;
        }

        const saveAddressValue = data.saveAddress || false;

        if (selectedAddressId === "new") {
            if (!data.fullName || !data.phone || !data.address) {
                toast.error("Vui lòng điền đầy đủ thông tin giao hàng!");
                return;
            }
            if (!user && !isGuestVerified) {
                toast.error("Vui lòng xác thực Email trước khi đặt hàng!");
                setIsPlacingOrder(false);
                return;
            }
        }

        setIsPlacingOrder(true);

        try {
            if (user && selectedAddressId === "new" && saveAddressValue) {
                try {
                    await createAddress({
                        fullName: data.fullName!,
                        phone: data.phone!,
                        address: data.address!,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        isDefault: addresses.length === 0
                    });
                    // toast.info("Đã lưu địa chỉ mới vào sổ địa chỉ");
                } catch (error) {
                    console.error("Lỗi khi lưu địa chỉ:", error);
                }
            }

            const orderItems: OrderItemRequest[] = activeItems.map(item => ({
                variantId: Number(item.id),
                quantity: item.quantity
            }));

            let orderRequest: OrderRequest;

            if (selectedAddressId === "new") {
                orderRequest = {
                    paymentMethod: paymentMethod,
                    receiverName: data.fullName!,
                    receiverPhone: data.phone!,
                    shippingAddress: data.address!,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    note: data.note,
                    items: orderItems,
                    ...(!user && {
                        guestEmail: data.guestEmail?.trim(),
                        otpCode: String(data.otpCode ?? getValues("otpCode") ?? "").trim(),
                    })
                };
            } else {
                const selectedAddr = addresses.find(addr => addr.id.toString() === selectedAddressId);
                if (!selectedAddr) {
                    toast.error("Địa chỉ không hợp lệ!");
                    setIsPlacingOrder(false);
                    return;
                }

                orderRequest = {
                    paymentMethod: paymentMethod,
                    userAddressId: selectedAddr.id,
                    note: data.note,
                    items: orderItems,
                };
            }

            const response = await createOrder(orderRequest);

            if (response.success) {
                toast.success("Đơn hàng đã được tạo, đang chờ xác nhận!");
                if (!isBuyNow) clearCart();
                setBuyNowItem(null);
                // Chuyển thẳng sang màn chi tiết đơn (bỏ qua màn thanh toán). Nút thanh toán chỉ hiện sau khi admin xác nhận (status CONFIRMED).
                if (user) {
                    navigate(`/dashboard/orders/${response.data.id}`);
                } else {
                    const guestUrl = data.guestEmail
                        ? `/checkout/success?orderCode=${response.data.orderCode}&email=${encodeURIComponent(data.guestEmail)}`
                        : `/checkout/success?orderCode=${response.data.orderCode}`;
                    navigate(guestUrl);
                }
            } else {
                toast.error(response.message || "Không thể tạo đơn hàng!");
            }
        } catch (error: any) {
            console.error("Đặt hàng lỗi:", error);
            toast.error(error.response?.data?.message || "Đã có lỗi xảy ra khi đặt hàng!");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/auth/login");
    }

    return (
        <>
            <ProductBanner
                pageTitle="Thanh toán"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-listing.jpg"
                className="bg-top"
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active,
                textarea:-webkit-autofill,
                textarea:-webkit-autofill:hover,
                textarea:-webkit-autofill:focus,
                textarea:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 1000px white inset !important;
                    -webkit-text-fill-color: inherit !important;
                    transition: background-color 5000s ease-in-out 0s !important;
                    background-color: white !important;
                }
                
                input, textarea {
                    background-color: white !important;
                }
                
                input:focus, textarea:focus {
                    background-color: white !important;
                }
            `}} />
            {checkoutItems.length > 0 ? (
                <div className="app-container flex pb-[150px] 2xl:pb-[100px] relative">
                    <div className="w-[60%] py-[50px]  origin-top-left">
                        <form onSubmit={handleSubmit(handlePlaceOrder)}>
                            {/* Account Header */}
                            {user && (
                                <div className="mb-[28px] p-[16px] bg-[#fcfcfc] border border-dashed border-gray-200 rounded-[14px] flex items-center justify-between">
                                    <div className="flex items-center gap-[10px] text-[1.063rem] text-client-secondary font-medium">
                                        <div className="w-[34px] h-[34px] rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                                            <User className="w-[1.5rem] h-[1.5rem] text-client-primary" />
                                        </div>
                                        <span>Tài khoản: <span className="font-bold">{user ? `${user.firstName} ${user.lastName}` : 'Khách'}</span></span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="px-[12px] py-[6px] rounded-[10px] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-[6px] text-[1.0rem] font-semibold"
                                    >
                                        <LogOut className="w-[1.063rem] h-[1.063rem]" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}

                            <h2 className="text-[1.25rem] font-secondary mt-[8px] mb-[18px] font-bold">Thông tin nhận hàng</h2>

                            {/* Guest Verification Section */}
                            {!user && (
                                <div className=" origin-top-left -mb-[8px]">
                                    <div className="space-y-[12px] mb-[16px] bg-client-primary/5 p-[15px] rounded-[22px] border border-dashed border-client-primary/20 shadow-inner relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-[13px]">
                                            <div className="flex items-center gap-[14px]">
                                                <div className="w-[40px] h-[40px] rounded-full bg-client-primary/10 flex items-center justify-center">
                                                    <EmailOutlinedIcon className="text-client-primary w-[1.5rem] h-[1.5rem]" />
                                                </div>
                                                <h3 className="text-[1.0rem] font-black text-client-secondary uppercase tracking-tight">Xác thực khách hàng</h3>
                                            </div>
                                            {isGuestVerified && (
                                                <div className="flex items-center gap-[4px] px-[12px] py-[6px] bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 animate-scaleIn border border-white/20">
                                                    <CheckCircle2 className="w-[1.0rem] h-[1.0rem]" />
                                                    <span className="text-[0.469rem] font-black uppercase tracking-wider">Đã xác thực</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-[13px]">
                                            <div className="flex gap-[12px]">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="email"
                                                        placeholder="Địa chỉ Email (Để nhận mã xác thực) *"
                                                        disabled={isGuestVerified}
                                                        {...register("guestEmail")}
                                                        className={`w-full rounded-[35px] border border-[#eee] text-client-secondary py-[14px] pl-[45px] pr-[20px] text-[1.0rem] font-medium outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-white hover:border-gray-300 ${isGuestVerified ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}
                                                    />
                                                </div>
                                                {!isGuestVerified && (
                                                    <button
                                                        type="button"
                                                        disabled={otpCooldown > 0 || isSendingOtp}
                                                        onClick={handleSendOtp}
                                                        className={`px-[18px] rounded-[30px] font-bold text-[0.875rem] transition-all uppercase tracking-wider ${otpCooldown > 0 || isSendingOtp
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-client-secondary text-white hover:bg-client-primary shadow-lg shadow-client-secondary/10 active:scale-95'}`}
                                                    >
                                                        {isSendingOtp ? '...' : otpCooldown > 0 ? `LẠI SAU (${otpCooldown}S)` : 'GỬI MÃ'}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex gap-[12px]">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Mã xác thực 6 số *"
                                                        disabled={isGuestVerified}
                                                        {...register("otpCode")}
                                                        className={`w-full rounded-[35px] border border-[#eee] text-client-secondary py-[14px] pl-[45px] pr-[20px] text-[1.0rem] font-medium outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-white hover:border-gray-300 ${isGuestVerified ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}
                                                    />
                                                </div>
                                                {!isGuestVerified && (
                                                    <button
                                                        type="button"
                                                        disabled={isVerifyingOtp || !watchOtpCode}
                                                        onClick={onManualVerify}
                                                        className={`px-[18px] rounded-[30px] font-bold text-[0.875rem] transition-all uppercase tracking-wider border-2 ${isVerifyingOtp || !watchOtpCode
                                                            ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                                                            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white active:scale-95 shadow-md shadow-emerald-500/5'}`}
                                                    >
                                                        {isVerifyingOtp ? '...' : 'XÁC THỰC NGAY'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>



                                    </div>
                                </div>
                            )}

                            {/* Danh sách địa chỉ có sẵn */}
                            {user && !loadingAddresses && addresses.length > 0 && (
                                <div className="space-y-[15px] mb-[25px]">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => setSelectedAddressId(addr.id.toString())}
                                            className={`relative border rounded-[20px] px-[25px] py-[18px] cursor-pointer transition-all duration-300 flex items-start gap-[20px] ${selectedAddressId === addr.id.toString()
                                                ? 'border-client-primary bg-client-primary/[0.03] ring-1 ring-client-primary/10 shadow-sm'
                                                : 'border-[#eee] hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <div className="shrink-0 flex items-center pt-1">
                                                <input
                                                    type="radio"
                                                    checked={selectedAddressId === addr.id.toString()}
                                                    onChange={() => setSelectedAddressId(addr.id.toString())}
                                                    className="appearance-none w-[20px] h-[20px] border-[2px] border-[#ddd] rounded-full checked:border-client-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-[12px] text-[1.063rem] font-bold text-client-secondary mb-2">
                                                    <span className="line-clamp-1">{addr.fullName}</span>
                                                    {addr.isDefault && (
                                                        <div className="px-2.5 py-1 bg-emerald-500 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm shadow-emerald-500/20">
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Mặc định</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-[10px]">
                                                    <div className="flex items-center gap-[8px] text-[1.063rem] text-gray-500 font-medium">
                                                        <Phone className="w-[1.5rem] h-[1.5rem] text-gray-400 shrink-0" />
                                                        {addr.phone}
                                                    </div>
                                                    <div className="flex items-start gap-[8px] text-[0.95rem] text-gray-600">
                                                        <MapPin className="w-[1.5rem] h-[1.5rem] text-gray-400 shrink-0 mt-0.5" />
                                                        <span className="line-clamp-2 leading-normal">{addr.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Option Sử dụng địa chỉ khác */}
                            {user && (
                                <div
                                    onClick={() => setSelectedAddressId("new")}
                                    className={`border rounded-[18px] px-[18px] py-[14px] cursor-pointer transition-all duration-300 flex items-center gap-[14px] mb-[24px] ${selectedAddressId === "new"
                                        ? 'border-client-primary bg-client-primary/[0.03] ring-1 ring-client-primary/10 shadow-sm'
                                        : 'border-[#eee] hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="shrink-0 flex items-center">
                                        <input
                                            type="radio"
                                            checked={selectedAddressId === "new"}
                                            onChange={() => setSelectedAddressId("new")}
                                            className="appearance-none w-[20px] h-[20px] border-[2px] border-[#ddd] rounded-full checked:border-client-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-[1.063rem] font-semibold transition-all ${selectedAddressId === "new" ? 'text-client-primary' : 'text-gray-500'}`}>
                                            Thêm địa chỉ giao hàng mới
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* New Address Form & Map */}
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${selectedAddressId === "new" ? "max-h-[1500px] opacity-100 " : "max-h-0 opacity-0 scale-95 invisible"}`}>
                                <div className="pt-[20px] space-y-[25px] mb-[40px]">
                                    <div className="grid grid-cols-2 gap-[20px]">
                                        <input
                                            type="text"
                                            placeholder="Họ và tên người nhận *"
                                            {...register("fullName")}
                                            className="rounded-[40px] border border-[#eee] text-client-secondary py-[14px] px-[28px] w-full outline-none focus:border-client-primary transition-default bg-white hover:border-gray-300"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Số điện thoại *"
                                            {...register("phone")}
                                            className="rounded-[40px] border border-[#eee] text-client-secondary py-[14px] px-[28px] w-full outline-none focus:border-client-primary transition-default bg-white hover:border-gray-300"
                                        />
                                    </div>

                                    {/* Map Integration */}
                                    <div className="space-y-[15px]">
                                        <textarea
                                            placeholder="Địa chỉ chi tiết (Số nhà, tên đường...) *"
                                            {...register("address")}
                                            rows={2}
                                            className="rounded-[20px] border border-[#eee] text-client-secondary py-[14px] px-[28px] w-full outline-none focus:border-client-primary transition-default bg-white hover:border-gray-300 resize-none"
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                isManualChange.current = true;
                                                setValue("address", v);
                                                setSearchKeyword(v);
                                            }}
                                            onBlur={() => {
                                                if (isManualChange.current && watchAddress) {
                                                    geocodeFromAddress(watchAddress);
                                                    isManualChange.current = false;
                                                }
                                            }}
                                        />

                                        <div className="relative h-[240px] rounded-[16px] overflow-hidden border border-[#eee] shadow-inner bg-gray-50">
                                            {/* Search box on map */}
                                            <div className="absolute top-[10px] left-[10px] right-[10px] z-[1000] flex gap-[8px]">
                                                <div className="flex-1 relative">
                                                    <div className="absolute left-[12px] top-1/2 -translate-y-1/2">
                                                        <Search className="w-[1.063rem] h-[1.063rem] text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full h-full border-none bg-white rounded-[10px] pl-[36px] pr-[44px] py-[10px] text-[1.0rem] font-medium focus:outline-none shadow-md placeholder:text-gray-400"
                                                        placeholder="Tìm kiếm vị trí trên bản đồ..."
                                                        value={searchKeyword}
                                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const kw = searchKeyword.trim();
                                                                if (kw.length < 3) return;
                                                                setShowSuggestions(false);
                                                                geocodeFromAddress(kw, true);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCurrentLocation}
                                                        className="absolute right-[8px] top-1/2 -translate-y-1/2 p-[6px] text-client-primary hover:bg-gray-100 rounded-full transition-colors z-10"
                                                        title="Vị trí hiện tại"
                                                    >
                                                        <Navigation className="w-[1.063rem] h-[1.063rem]" />
                                                    </button>
                                                    {showSuggestions && suggestions.length > 0 && (
                                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-[10px] shadow-xl overflow-y-auto max-h-[140px] border border-[#eee]">
                                                            {suggestions.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => handleSelectSuggestion(item)}
                                                                    className="px-[12px] py-[8px] hover:bg-gray-50 cursor-pointer border-b border-[#f5f5f5] last:border-none flex items-start gap-[8px]"
                                                                >
                                                                    <MapPin className="w-[1.0rem] h-[1.0rem] text-client-primary shrink-0 mt-[2px]" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[0.547rem] font-semibold text-client-secondary line-clamp-1">{item.display_name.split(',')[0]}</span>
                                                                        <span className="text-[0.547rem] text-gray-500 line-clamp-1">{item.display_name}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <MapController center={mapCenter} />
                                                <MapResizeHandler active={selectedAddressId === "new"} />
                                                <LocationMarker
                                                    position={newPos}
                                                    setPosition={setNewPos}
                                                    onLocationSelect={fetchAddressFromCoords}
                                                />
                                            </MapContainer>
                                        </div>

                                        {user && (
                                            <label className="flex items-center gap-[10px] cursor-pointer mt-[15px] group w-fit">
                                                <input
                                                    type="checkbox"
                                                    {...register("saveAddress")}
                                                    className="w-[18px] h-[18px] accent-client-primary cursor-pointer"
                                                />
                                                <span className="text-[1.063rem] text-gray-500 group-hover:text-client-secondary transition-default font-medium">
                                                    Lưu địa chỉ này vào sổ địa chỉ để dùng cho lần sau
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-[22px] mb-[35px] cursor-pointer">
                                <input type="checkbox" id="orderNotesCheckbox" checked={showOrderNotes} onChange={() => setShowOrderNotes(!showOrderNotes)} className="hidden" />
                                <label htmlFor="orderNotesCheckbox" className="text-client-text pl-[0px] text-[1.063rem] font-medium select-none flex items-center gap-[12px]">
                                    <div className={`w-[20px] h-[20px] border-2 rounded-[4px] flex items-center justify-center transition-all ${showOrderNotes ? 'bg-client-primary border-client-primary' : 'border-[#ddd]'}`}>
                                        {showOrderNotes && <div className="w-[10px] h-[6px] border-l-2 border-b-2 border-white -rotate-45 mb-[2px]"></div>}
                                    </div>
                                    Thêm ghi chú đơn hàng
                                </label>
                                {showOrderNotes && (
                                    <div className="mt-[15px] transition-all duration-300 ease-in-out animate-fade-in-down">
                                        <textarea
                                            placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng mong muốn..."
                                            {...register("note")}
                                            rows={2}
                                            className="rounded-[20px] border border-[#eee] text-client-secondary py-[12px] px-[28px] w-full outline-none focus:border-client-primary transition-default resize-none bg-white hover:border-gray-300 text-[1.063rem]"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-[35px] border-t border-[#eee] flex items-center justify-between">
                                <Link to="/cart" className="flex items-center text-client-secondary font-secondary hover:text-client-primary transition-default group">
                                    <ArrowLeft className="text-[1.25rem] mr-[10px] transition-transform group-hover:-translate-x-1" />
                                    <span className="text-[1.063rem] font-secondary font-medium">Trở lại giỏ hàng</span>
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="w-[40%] ml-[35px] py-[40px]  origin-top-right">
                        <div className="sticky top-[20px] bg-white rounded-[25px] border border-[#eee] overflow-hidden">
                            <h2 className="py-[14px] px-[22px] text-[1.0rem] font-bold text-client-secondary border-b border-[#eee]">Tóm tắt đơn hàng</h2>

                            <div className="px-[22px] pb-[20px] pt-[10px]">
                                {/* Product List */}
                                <ul className="mb-[18px] max-h-[280px] overflow-y-auto pr-[10px] pt-[12px] -mt-[12px]">
                                    {checkoutItems.map((item, index) => (
                                        <li key={index} className="flex mb-[14px] pb-[14px] border-b border-[#f9f9f9] last:border-0 last:mb-0">
                                            <div className="relative shrink-0">
                                                <div className="w-[55px] h-[55px] rounded-[12px] overflow-hidden border border-[#eee] bg-gray-50">
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 shadow-md aspect-square bg-client-primary w-[20px] rounded-full flex items-center justify-center text-white text-[0.547rem] font-bold border-2 border-white z-10">
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div className="pl-[12px] pr-[8px] flex-1">
                                                <div className="text-[1.0rem] font-bold text-client-secondary mb-[2px] line-clamp-1">{item.title}</div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[#FF6262] font-bold text-[0.547rem]">{item.option.price.toLocaleString()}đ</p>
                                                    {item.option.originalPrice && (
                                                        <p className="text-[#999] line-through text-[0.469rem]">{item.option.originalPrice.toLocaleString()}đ</p>
                                                    )}
                                                </div>
                                                {item.option.size && (
                                                    <div className="text-[#999] text-[0.469rem] mt-[2px] italic">
                                                        {item.option.size}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-client-secondary ml-auto font-bold text-[1.0rem] self-center">
                                                {(item.option.price * item.quantity).toLocaleString()}đ
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Payment Methods */}
                                <div className="mb-[25px] pt-[18px] border-t border-[#eee]">
                                    <h3 className="text-[1.0rem] font-bold text-client-secondary mb-[10px] tracking-tight">
                                        Phương thức thanh toán
                                    </h3>
                                    <div className="space-y-[8px]">
                                        {[
                                            { id: 'BANK_TRANSFER' as const, label: 'Chuyển khoản ngân hàng' },
                                            { id: 'CASH' as const, label: 'Thanh toán khi nhận hàng (COD)' }
                                        ].map((method) => (
                                            <label key={method.id} className="flex items-center gap-[12px] cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    checked={paymentMethod === method.id}
                                                    onChange={() => setPaymentMethod(method.id)}
                                                    className="appearance-none w-[16px] h-[16px] border-[2px] border-[#ddd] rounded-full checked:border-client-primary checked:border-[5px] bg-white transition-all cursor-pointer"
                                                />
                                                <span className={`text-[1.0rem] font-medium transition-colors ${paymentMethod === method.id ? 'text-client-secondary font-bold' : 'text-gray-600'}`}>
                                                    {method.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="space-y-[10px] pt-[14px] border-t border-[#eee]">
                                    <div className="flex justify-between text-[#666] text-[1.0rem]">
                                        <span className="font-medium">Tạm tính</span>
                                        <span className="font-bold text-client-secondary">{checkoutTotalAmount.toLocaleString()}đ</span>
                                    </div>

                                    <div className="flex justify-between text-[#666] text-[1.0rem]">
                                        <span className="font-medium">Phí vận chuyển</span>
                                        <span className="font-bold text-client-secondary">
                                            Liên hệ sau
                                        </span>
                                    </div>
                                    <p className="text-[0.8rem] text-[#888] -mt-1">Shop sẽ gọi lại để chốt giá ship</p>

                                    <div className="pt-[10px] border-t border-[#eee] flex justify-between items-center">
                                        <span className="text-[1.0rem] font-bold text-client-secondary uppercase tracking-tight">Tổng thanh toán</span>
                                        <div className="text-[1.375rem] text-client-primary font-bold tracking-tighter leading-none">{((checkoutTotalAmount || 0) + (shippingFee || 0)).toLocaleString()}đ</div>
                                    </div>

                                    <button
                                        onClick={handleSubmit(handlePlaceOrder)}
                                        disabled={isPlacingOrder}
                                        className={`w-full mt-[16px] h-[48px] rounded-[10px] text-white font-bold transition-all text-[0.875rem] flex items-center justify-center gap-2 shadow-md shadow-client-primary/15 bg-client-primary hover:bg-client-secondary active:scale-[0.98] ${isPlacingOrder
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer'
                                            }`}
                                    >
                                        {isPlacingOrder ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                ĐANG XỬ LÝ...
                                            </>
                                        ) : (
                                            <>
                                                {!user && !isGuestVerified ? "VUI LÒNG XÁC THỰC EMAIL" : "ĐẶT HÀNG NGAY"}
                                                <ArrowRight className="w-5 h-5 rotate-[-45deg]" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="app-container p-[80px] text-center pb-[150px]">
                    <div className="w-[160px] h-[160px] bg-white rounded-full flex items-center justify-center mx-auto mb-[40px] border-4 border-dashed border-gray-100 shadow-xl">
                        <ShoppingCartOutlinedIcon style={{
                            fontSize: "3.938rem",
                            color: "#eee"
                        }} />
                    </div>
                    <div className="text-client-secondary text-[1.75rem] font-black font-secondary mb-[20px] uppercase tracking-tighter">Giỏ hàng trống trơn!</div>
                    <p className="max-w-[600px] mx-auto mb-[50px] text-client-text text-[1.25rem] leading-relaxed opacity-60">Bạn chưa chọn được món nào ưng ý sao? Hãy cùng khám phá thêm hàng ngàn sản phẩm tuyệt vời khác từ chúng tôi nhé!</p>
                    <Link to="/shop" className="px-[60px] py-[22px] inline-flex bg-client-primary hover:bg-client-secondary transition-all text-white rounded-[9999px] font-black font-secondary text-[1.25rem] shadow-2xl shadow-client-primary/30 active:scale-95 uppercase tracking-[0.3em] italic">
                        Tiếp tục mua hàng
                    </Link>
                </div>
            )}
            <FooterSub />
        </>
    )
}