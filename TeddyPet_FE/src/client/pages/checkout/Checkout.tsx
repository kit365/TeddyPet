import { useEffect, useState, useRef } from "react";
import { ProductBanner } from "../product/sections/ProductBanner"
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Phone, User, Search, LogOut } from "iconoir-react";
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
import { sendGuestOtp } from "../../../api/otp.api";
import { getShippingEstimation } from "../../api/shipping.api";

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
    const { user, logout } = useAuthStore();
    const [showOrderNotes, setShowOrderNotes] = useState(false);
    const [addresses, setAddresses] = useState<UserAddressResponse[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [shippingFee, setShippingFee] = useState<number | null>(null);
    const [calculatingFee, setCalculatingFee] = useState(false);

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

    // Clear buyNowItem only on success, not on unmount to avoid Strict Mode issues
    useEffect(() => {
        // We handle clearing buyNowItem in handlePlaceOrder success case
    }, []);

    const { register, handleSubmit, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: user ? `${user.firstName} ${user.lastName}` : "",
            phone: user?.phoneNumber || "",
            latitude: 10.7410688,
            longitude: 106.7164031,
            saveAddress: false
        }
    });

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



    const calculateShipping = async (lat: number, lon: number) => {
        let provinceId = 0;
        // Mock HCM detection
        if (lat >= 10.7 && lat <= 11.0 && lon >= 106.6 && lon <= 106.8) {
            provinceId = 79;
        }

        setCalculatingFee(true);
        try {
            const resVal = await getShippingEstimation(provinceId);
            if (resVal && resVal.data !== undefined && resVal.data > 0) {
                setShippingFee(Number(resVal.data));
            } else {
                setShippingFee(null); // null means "Liên hệ sau"
            }
        } catch (err) {
            console.error("Error calculating fee", err);
            setShippingFee(null);
        } finally {
            setCalculatingFee(false);
        }
    };

    // Calculate shipping when selecting existing address
    // Calculate shipping when selecting existing address
    useEffect(() => {
        // Disabled automatic shipping calculation on client side as per requirement
        setShippingFee(0);

        /* 
        if (selectedAddressId !== "new" && addresses.length > 0) {
            const addr = addresses.find(a => a.id.toString() === selectedAddressId);
            if (addr && addr.latitude && addr.longitude) {
                calculateShipping(addr.latitude, addr.longitude);
            } else {
                setShippingFee(null);
            }
        }
        */
    }, [selectedAddressId, addresses]);

    // Map Logic handling
    const fetchAddressFromCoords = async (lat: number, lon: number) => {
        setValue("latitude", lat);
        setValue("longitude", lon);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                isManualChange.current = false;
                setValue("address", data.display_name);

                // Calculate shipping - DISABLED as per new requirement (no fee for unconfirmed orders)
                // calculateShipping(lat, lon);
                setShippingFee(0);
            }
        } catch (error) {
            console.error("Lỗi reverse geocoding:", error);
        }
    };


    const geocodeFromAddress = async (query: string, isFromSearch: boolean = false) => {
        if (!query.trim() || query.length < 3) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setNewPos(new L.LatLng(lat, lon));
                setValue("latitude", lat);
                setValue("longitude", lon);
                if (isFromSearch) {
                    setMapCenter([lat, lon]);
                    setValue("address", data[0].display_name);
                    setSearchKeyword("");
                    setShowSuggestions(false);
                }
                calculateShipping(lat, lon);
            }
        } catch (error) {
            console.error("Lỗi Geocoding:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchKeyword.length > 2) {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchKeyword)}&countrycodes=vn&limit=5`);
                    const data = await res.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.log(error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        setNewPos(new L.LatLng(lat, lon));
        setMapCenter([lat, lon]);
        setValue("latitude", lat);
        setValue("longitude", lon);
        setValue("address", suggestion.display_name);
        setSearchKeyword("");
        setShowSuggestions(false);
        calculateShipping(lat, lon);
    };



    const handlePlaceOrder = async (data: FormData) => {
        const activeItems = checkoutItems;

        if (activeItems.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
            return;
        }

        const saveAddressValue = data.saveAddress || false;

        // Validate address
        if (selectedAddressId === "new") {
            if (!data.fullName || !data.phone || !data.address) {
                toast.error("Vui lòng điền đầy đủ thông tin giao hàng!");
                return;
            }
            if (!user && (!data.guestEmail || !data.otpCode)) {
                toast.error("Vui lòng nhập Email và mã OTP để xác thực khách hàng!");
                return;
            }
        }

        setIsPlacingOrder(true);

        try {
            // Save address if user is logged in and checkbox is checked
            if (user && selectedAddressId === "new" && saveAddressValue) {
                try {
                    await createAddress({
                        fullName: data.fullName!,
                        phone: data.phone!,
                        address: data.address!,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        isDefault: addresses.length === 0 // Make default if it's the first address
                    });
                    toast.info("Đã lưu địa chỉ mới vào sổ địa chỉ");
                } catch (error) {
                    console.error("Lỗi khi lưu địa chỉ:", error);
                    // Continue with order even if address saving fails
                }
            }

            // Prepare order items
            const orderItems: OrderItemRequest[] = activeItems.map(item => ({
                variantId: Number(item.id),
                quantity: item.quantity
            }));

            // Prepare order request
            let orderRequest: OrderRequest;

            if (selectedAddressId === "new") {
                // New address case
                orderRequest = {
                    paymentMethod: paymentMethod,
                    receiverName: data.fullName!,
                    receiverPhone: data.phone!,
                    shippingAddress: data.address!,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    note: data.note,
                    items: orderItems,
                    // Only send guest info if not logged in
                    ...(!user && {
                        guestEmail: data.guestEmail,
                        otpCode: data.otpCode,
                        latitude: data.latitude,
                        longitude: data.longitude,
                    })
                };
            } else {
                // Existing address case
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
                toast.success("Đặt hàng thành công!");
                if (!isBuyNow) clearCart();
                setBuyNowItem(null);
                const successUrl = !user && data.guestEmail
                    ? `/checkout/success?orderCode=${response.data.orderCode}&email=${data.guestEmail}`
                    : `/checkout/success?orderCode=${response.data.orderCode}`;
                navigate(successUrl);
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
                    <div className="w-[60%] py-[50px]">
                        <form onSubmit={handleSubmit(handlePlaceOrder)}>
                            {/* Account Header */}
                            {user && (
                                <div className="mb-[40px] p-[20px] bg-[#fcfcfc] border border-dashed border-gray-200 rounded-[15px] flex items-center justify-between">
                                    <div className="flex items-center gap-[12px] text-[1.6rem] text-client-secondary font-medium">
                                        <div className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                                            <User className="w-[2rem] h-[2rem] text-client-primary" />
                                        </div>
                                        <span>Tài khoản: <span className="font-bold">{user ? `${user.firstName} ${user.lastName}` : 'Khách'}</span></span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="px-[15px] py-[8px] rounded-[10px] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-[8px] text-[1.3rem] font-bold"
                                    >
                                        <LogOut className="w-[1.6rem] h-[1.6rem]" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}

                            <h2 className="text-[2.5rem] font-secondary mt-[8px] mb-[30px] font-bold">Thông tin nhận hàng</h2>

                            {/* Guest Verification Section */}
                            {!user && (
                                <div className="space-y-[18px] mb-[35px] bg-client-primary/5 p-[25px] rounded-[20px] border border-dashed border-client-primary/20 shadow-inner">
                                    <div className="flex items-center gap-[10px] mb-[5px]">
                                        <div className="w-[30px] h-[30px] rounded-full bg-client-primary/10 flex items-center justify-center">
                                            <EmailOutlinedIcon className="text-client-primary w-[1.8rem] h-[1.8rem]" />
                                        </div>
                                        <h3 className="text-[1.6rem] font-bold text-client-secondary uppercase tracking-tight">Xác thực khách hàng</h3>
                                    </div>
                                    <div className="flex gap-[12px]">
                                        <div className="flex-1">
                                            <input
                                                type="email"
                                                placeholder="Email của bạn *"
                                                {...register("guestEmail")}
                                                className="w-full rounded-[40px] border border-[#eee] text-client-secondary py-[14px] px-[25px] outline-none focus:border-client-primary transition-all bg-white hover:border-gray-300"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={otpCooldown > 0 || isSendingOtp}
                                            onClick={handleSendOtp}
                                            className={`px-[25px] rounded-[40px] font-bold text-[1.3rem] transition-all uppercase tracking-wider ${otpCooldown > 0 || isSendingOtp
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-client-secondary text-white hover:bg-client-primary shadow-lg shadow-client-secondary/20 active:scale-95'}`}
                                        >
                                            {isSendingOtp ? 'Đang gửi...' : otpCooldown > 0 ? `Lại sau (${otpCooldown}s)` : 'Gửi mã'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã xác thực (OTP) *"
                                        {...register("otpCode")}
                                        className="w-full rounded-[40px] border border-[#eee] text-client-secondary py-[14px] px-[25px] outline-none focus:border-client-primary transition-all bg-white hover:border-gray-300"
                                    />
                                    <div className="text-[1.2rem] text-gray-400 italic mt-[5px] flex items-center gap-[6px]">
                                        <div className="w-[4px] h-[4px] bg-client-primary rounded-full"></div>
                                        Lưu ý: Chúng tôi sẽ dùng Email này để gửi thông tin hành trình đơn hàng.
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
                                            className={`relative border rounded-[20px] px-[25px] py-[18px] cursor-pointer transition-all duration-300 flex items-center gap-[20px] ${selectedAddressId === addr.id.toString()
                                                ? 'border-client-primary bg-client-primary/[0.03] ring-1 ring-client-primary/10 shadow-sm'
                                                : 'border-[#eee] hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <div className="shrink-0 flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={selectedAddressId === addr.id.toString()}
                                                    onChange={() => setSelectedAddressId(addr.id.toString())}
                                                    className="appearance-none w-[20px] h-[20px] border-[2px] border-[#ddd] rounded-full checked:border-client-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-[12px] text-[1.5rem] font-bold text-client-secondary">
                                                    <span className="line-clamp-1">{addr.fullName}</span>
                                                    {addr.isDefault && <span className="shrink-0 bg-client-primary/10 text-client-primary text-[1.1rem] px-[10px] py-[3px] rounded-full font-bold uppercase tracking-tighter">Mặc định</span>}
                                                </div>
                                                <div className="flex items-center gap-[25px] mt-[6px]">
                                                    <div className="flex items-center gap-[8px] text-[1.4rem] text-gray-500 font-medium">
                                                        <Phone className="w-[1.6rem] h-[1.6rem] text-gray-400" />
                                                        {addr.phone}
                                                    </div>
                                                    <div className="flex items-center gap-[8px] text-[1.4rem] text-gray-500 truncate flex-1">
                                                        <MapPin className="w-[1.6rem] h-[1.6rem] text-gray-400 shrink-0" />
                                                        <span className="truncate">{addr.address}</span>
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
                                    className={`border rounded-[20px] px-[25px] py-[18px] cursor-pointer transition-all duration-300 flex items-center gap-[20px] mb-[30px] ${selectedAddressId === "new"
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
                                        <div className={`text-[1.5rem] font-bold transition-all ${selectedAddressId === "new" ? 'text-client-primary' : 'text-gray-400'}`}>
                                            Thêm địa chỉ giao hàng mới
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* New Address Form & Map */}
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${selectedAddressId === "new" ? "max-h-[1500px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 invisible"}`}>
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
                                                isManualChange.current = true;
                                                setValue("address", e.target.value);
                                            }}
                                            onBlur={() => {
                                                if (isManualChange.current && watchAddress) {
                                                    geocodeFromAddress(watchAddress);
                                                    isManualChange.current = false;
                                                }
                                            }}
                                        />

                                        <div className="relative h-[400px] rounded-[20px] overflow-hidden border border-[#eee] shadow-inner">
                                            {/* Search box on map */}
                                            <div className="absolute top-[20px] left-[20px] right-[20px] z-[1000] flex gap-[10px]">
                                                <div className="flex-1 relative">
                                                    <div className="absolute left-[15px] top-1/2 -translate-y-1/2">
                                                        <Search className="w-[1.8rem] h-[1.8rem] text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full h-full border-none bg-white rounded-[12px] pl-[45px] pr-[15px] py-[12px] text-[1.4rem] focus:outline-none shadow-lg placeholder:text-gray-400"
                                                        placeholder="Tìm kiếm vị trí trên bản đồ..."
                                                        value={searchKeyword}
                                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                                    />
                                                    {showSuggestions && suggestions.length > 0 && (
                                                        <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white rounded-[12px] shadow-2xl overflow-hidden border border-[#eee]">
                                                            {suggestions.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    onClick={() => handleSelectSuggestion(item)}
                                                                    className="px-[20px] py-[15px] hover:bg-gray-50 cursor-pointer border-b border-[#f5f5f5] last:border-none flex items-start gap-[12px]"
                                                                >
                                                                    <MapPin className="w-[1.6rem] h-[1.6rem] text-client-primary shrink-0 mt-[2px]" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[1.4rem] font-bold text-client-secondary line-clamp-1">{item.display_name.split(',')[0]}</span>
                                                                        <span className="text-[1.2rem] text-gray-500 line-clamp-1">{item.display_name}</span>
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
                                                <span className="text-[1.4rem] text-gray-500 group-hover:text-client-secondary transition-default font-medium">
                                                    Lưu địa chỉ này vào sổ địa chỉ để dùng cho lần sau
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-[30px] mb-[40px] cursor-pointer">
                                <input type="checkbox" id="orderNotesCheckbox" checked={showOrderNotes} onChange={() => setShowOrderNotes(!showOrderNotes)} className="hidden" />
                                <label htmlFor="orderNotesCheckbox" className="text-client-text pl-[0px] text-[1.6rem] font-medium select-none flex items-center gap-[12px]">
                                    <div className={`w-[20px] h-[20px] border-2 rounded-[4px] flex items-center justify-center transition-all ${showOrderNotes ? 'bg-client-primary border-client-primary' : 'border-[#ddd]'}`}>
                                        {showOrderNotes && <div className="w-[10px] h-[6px] border-l-2 border-b-2 border-white -rotate-45 mb-[2px]"></div>}
                                    </div>
                                    Thêm ghi chú đơn hàng
                                </label>
                                {showOrderNotes && (
                                    <div className="mt-[20px] transition-all duration-300 ease-in-out animate-fade-in-down">
                                        <textarea
                                            placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng mong muốn..."
                                            {...register("note")}
                                            rows={3}
                                            className="rounded-[20px] border border-[#eee] text-client-secondary py-[14px] px-[28px] w-full outline-none focus:border-client-primary transition-default resize-none bg-white hover:border-gray-300"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-[40px] border-t border-[#eee] flex items-center justify-between">
                                <Link to="/cart" className="flex items-center text-client-secondary font-secondary hover:text-client-primary transition-default group">
                                    <ArrowLeft className="text-[1.8rem] mr-[10px] transition-transform group-hover:-translate-x-1" />
                                    <span className="text-[1.6rem] font-secondary font-medium">Trở lại giỏ hàng</span>
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="w-[40%] ml-[50px] py-[50px]">
                        <div className="sticky top-[20px] bg-white rounded-[25px] border border-[#eee] overflow-hidden">
                            <h2 className="py-[20px] px-[30px] text-[2rem] font-bold text-client-secondary border-b border-[#eee]">Tóm tắt đơn hàng</h2>

                            <div className="px-[35px] pb-[35px] pt-[15px]">
                                {/* Product List */}
                                <ul className="mb-[25px] max-h-[360px] overflow-y-auto pr-[10px] pt-[15px] -mt-[15px]">
                                    {checkoutItems.map((item, index) => (
                                        <li key={index} className="flex mb-[20px] pb-[20px] border-b border-[#f9f9f9] last:border-0 last:mb-0">
                                            <div className="relative shrink-0">
                                                <div className="w-[65px] h-[65px] rounded-[12px] overflow-hidden border border-[#eee] bg-gray-50">
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 shadow-md aspect-square bg-client-primary w-[24px] rounded-full flex items-center justify-center text-white text-[1.1rem] font-bold border-2 border-white z-10">
                                                    {item.quantity}
                                                </div>
                                            </div>
                                            <div className="pl-[15px] pr-[10px] flex-1">
                                                <div className="text-[1.4rem] font-bold text-client-secondary mb-[2px] line-clamp-1">{item.title}</div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[#FF6262] font-bold text-[1.3rem]">{item.option.price.toLocaleString()}đ</p>
                                                    {item.option.originalPrice && (
                                                        <p className="text-[#999] line-through text-[1.1rem]">{item.option.originalPrice.toLocaleString()}đ</p>
                                                    )}
                                                </div>
                                                {item.option.size && (
                                                    <div className="text-[#999] text-[1.1rem] mt-[2px] italic">
                                                        {item.option.size}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-client-secondary ml-auto font-bold text-[1.4rem] self-center">
                                                {(item.option.price * item.quantity).toLocaleString()}đ
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Payment Methods */}
                                <div className="mb-[35px] pt-[25px] border-t border-[#eee]">
                                    <h3 className="text-[1.6rem] font-bold text-client-secondary mb-[18px] tracking-tight">
                                        Phương thức thanh toán
                                    </h3>
                                    <div className="space-y-[12px]">
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
                                                <span className={`text-[1.4rem] font-medium transition-colors ${paymentMethod === method.id ? 'text-client-secondary font-bold' : 'text-gray-600'}`}>
                                                    {method.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="space-y-[15px] pt-[25px] border-t border-[#eee]">
                                    <div className="flex justify-between text-[#666] text-[1.4rem]">
                                        <span className="font-medium">Tạm tính</span>
                                        <span className="font-bold text-client-secondary">{checkoutTotalAmount.toLocaleString()}đ</span>
                                    </div>

                                    <div className="flex justify-between text-[#666] text-[1.4rem]">
                                        <span className="font-medium">Phí vận chuyển</span>
                                        <span className="font-bold text-client-secondary">
                                            {calculatingFee ? "Đang tính..." : (shippingFee !== null && shippingFee > 0 ? `${shippingFee.toLocaleString()}đ` : "Liên hệ sau")}
                                        </span>
                                    </div>

                                    <div className="pt-[20px] border-t border-[#eee] flex justify-between items-center">
                                        <span className="text-[1.6rem] font-bold text-client-secondary uppercase tracking-tight">Tổng thanh toán</span>
                                        <div className="text-[2.6rem] text-client-primary font-bold tracking-tighter leading-none">{((checkoutTotalAmount || 0) + (shippingFee || 0)).toLocaleString()}đ</div>
                                    </div>

                                    <button
                                        onClick={handleSubmit(handlePlaceOrder)}
                                        disabled={isPlacingOrder}
                                        className={`w-full mt-[10px] py-[16px] px-[30px] rounded-[40px] text-white font-bold transition-all text-[1.6rem] flex items-center justify-center gap-2 ${isPlacingOrder
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-client-primary hover:bg-client-secondary cursor-pointer active:scale-95'
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
                                                ĐẶT HÀNG NGAY
                                                <ArrowRight className="w-6 h-6 rotate-[-45deg]" />
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
                            fontSize: "7rem",
                            color: "#eee"
                        }} />
                    </div>
                    <div className="text-client-secondary text-[3.2rem] font-black font-secondary mb-[20px] uppercase tracking-tighter">Giỏ hàng trống trơn!</div>
                    <p className="max-w-[600px] mx-auto mb-[50px] text-client-text text-[1.8rem] leading-relaxed opacity-60">Bạn chưa chọn được món nào ưng ý sao? Hãy cùng khám phá thêm hàng ngàn sản phẩm tuyệt vời khác từ chúng tôi nhé!</p>
                    <Link to="/shop" className="px-[60px] py-[22px] inline-flex bg-client-primary hover:bg-client-secondary transition-all text-white rounded-[9999px] font-black font-secondary text-[1.8rem] shadow-2xl shadow-client-primary/30 active:scale-95 uppercase tracking-[0.3em] italic">
                        Tiếp tục mua hàng
                    </Link>
                </div>
            )}
            <FooterSub />
        </>
    )
}