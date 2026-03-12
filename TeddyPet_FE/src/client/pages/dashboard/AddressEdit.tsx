import { ArrowRight, MapPin, Search, Navigation } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "./sections/Sidebar";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAddressDetail, updateAddress } from "../../../api/address.api";
import { ProductBanner } from "../product/sections/ProductBanner";

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

export const AddressEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [position, setPosition] = useState<L.LatLng | null>(new L.LatLng(10.7410688, 106.7164031));
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.7410688, 106.7164031]);
    const [address, setAddress] = useState<string>("");
    const [fullName, setFullName] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);

    const isManualChange = useRef(false);

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.info("Trình duyệt của bạn không hỗ trợ định vị GPS");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newLatLng = new L.LatLng(latitude, longitude);
                setPosition(newLatLng);
                setMapCenter([latitude, longitude]);
                fetchAddressFromCoords(latitude, longitude);
                toast.success("Đã tìm thấy vị trí hiện tại của bạn!");
            },
            (err) => {
                console.error("Lỗi GPS:", err);
                toast.error("Không thể lấy vị trí. Vui lòng cấp quyền GPS.");
            }
        );
    };

    // Fetch address data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getAddressDetail(Number(id));
                const data = response.data;

                setFullName(data.fullName);
                setPhone(data.phone);
                setAddress(data.address);
                setIsDefault(data.isDefault);

                if (data.latitude && data.longitude) {
                    const newPos = new L.LatLng(data.latitude, data.longitude);
                    setPosition(newPos);
                    setMapCenter([data.latitude, data.longitude]);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Không thể tải thông tin địa chỉ");
                navigate("/dashboard/address");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, navigate]);

    const fetchAddressFromCoords = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                isManualChange.current = false;
                setAddress(data.display_name);
                setIsNotFound(false);
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

            // Fallback cho địa chỉ có xuyệt (/) 
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
                const newPos = new L.LatLng(lat, lon);
                setPosition(newPos);

                if (isFromSearch) {
                    setMapCenter([lat, lon]);
                    
                    const p = feature.properties;
                    const houseNum = p.housenumber ? `${p.housenumber} ` : "";
                    const street = p.street || "";
                    const name = (p.name && p.name !== p.street) ? p.name : "";
                    
                    const mainPart = name ? (street ? `${name}, ${houseNum}${street}` : `${houseNum}${name}`) : `${houseNum}${street}`;
                    const parts = [mainPart, p.district, p.city, p.country];
                    const displayName = parts.filter(Boolean).join(", ");
                    
                    setAddress(displayName);
                    setSearchKeyword("");
                    setShowSuggestions(false);
                }
                setIsNotFound(false);
            } else {
                setIsNotFound(true);
            }
        } catch (error) {
            console.error("Lỗi Geocoding:", error);
        }
    };

    useEffect(() => {
        if (!isManualChange.current) return;
        const timer = setTimeout(() => {
            if (address.length >= 3) {
                geocodeFromAddress(address);
                isManualChange.current = false;
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [address]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchKeyword.length > 2) {
                try {
                    const lat = position?.lat || 10.7410688;
                    const lon = position?.lng || 106.7164031;
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
                    console.log("Lỗi gợi ý tìm kiếm");
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchKeyword, position]);

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        setPosition(new L.LatLng(lat, lon));
        setMapCenter([lat, lon]);
        setAddress(suggestion.display_name);
        setSearchKeyword("");
        setShowSuggestions(false);
        setIsNotFound(false);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        if (!position) {
            toast.error("Vui lòng chọn vị trí trên bản đồ");
            return;
        }

        const phoneRegex = /(03|05|07|08|09)+([0-9]{8})\b/;
        if (!phoneRegex.test(phone)) {
            toast.error("Số điện thoại không hợp lệ");
            return;
        }

        try {
            setSubmitting(true);
            await updateAddress(Number(id), {
                fullName: fullName.trim(),
                phone: phone.trim(),
                address: address.trim(),
                longitude: position.lng,
                latitude: position.lat,
                isDefault
            });
            toast.success("Cập nhật địa chỉ thành công!");
            navigate("/dashboard/address");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể cập nhật địa chỉ");
        } finally {
            setSubmitting(false);
        }
    };

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Danh sách địa chỉ", to: "/dashboard/address" },
        { label: "Chỉnh sửa địa chỉ", to: `/dashboard/address/edit/${id}` },
    ];

    if (loading) {
        return (
            <>
                <ProductBanner
                    pageTitle="Chỉnh sửa địa chỉ"
                    breadcrumbs={breadcrumbs}
                    url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                    className="bg-top"
                />
                <div className="min-h-[40vh] flex items-center justify-center">
                    <p className="text-[1.125rem] text-client-secondary">Đang tải...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <ProductBanner
                pageTitle="Chỉnh sửa địa chỉ"
                breadcrumbs={breadcrumbs}
                url="https://wdtsweetheart.wpengine.com/wp-content/uploads/2025/06/bc-shop-details.jpg"
                className="bg-top"
            />

            <div className="mt-[-150px] mb-[100px] w-[1600px] mx-auto flex items-stretch">
                <div className="w-[25%] px-[12px] flex">
                    <Sidebar />
                </div>
                <div className="w-[75%] px-[12px]">
                    <div className="mt-[100px] p-[35px] bg-white shadow-[0px_8px_24px_#959da533] rounded-[12px]">
                        <h3 className="text-[1.5rem] font-[600] text-client-secondary mb-[25px] flex items-center justify-between">
                            Chỉnh sửa địa chỉ
                            <Link className="relative overflow-hidden group bg-[#ffa500] rounded-[8px] px-[25px] py-[12px] font-[500] text-[0.875rem] text-white" to={"/dashboard/address"}>
                                <span className="relative z-10">Hủy</span>
                                <div className="absolute top-0 left-0 w-full h-full bg-[#cc8400] transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                            </Link>
                        </h3>
                        <div className="p-[25px] border border-[#eee] rounded-[10px]">
                            <form className="space-y-[20px]" onSubmit={onSubmit}>
                                <div className="grid grid-cols-2 gap-[25px]">
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[0.9375rem] font-[600] text-client-secondary">Họ tên người nhận</label>
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[0.9375rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white"
                                            placeholder="Nhập họ tên"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-[10px]">
                                        <label className="text-[0.9375rem] font-[600] text-client-secondary">Số điện thoại</label>
                                        <input
                                            type="text"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[0.9375rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] hover:bg-white"
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-[10px]">
                                    <label className="text-[0.9375rem] font-[600] text-client-secondary">Địa chỉ chi tiết</label>
                                    <div className="relative group">
                                        <textarea
                                            name="address"
                                            rows={2}
                                            className="w-full border border-[#eee] rounded-[10px] px-[20px] py-[15px] text-[0.9375rem] focus:outline-none focus:border-client-primary focus:ring-4 focus:ring-client-primary/10 transition-all bg-[#fcfcfc] group-hover:bg-white resize-none outline-none"
                                            placeholder="Gõ địa chỉ hoặc chọn trên bản đồ..."
                                            value={address}
                                            onChange={(e) => {
                                                isManualChange.current = true;
                                                setAddress(e.target.value);
                                                if (isNotFound) setIsNotFound(false);
                                            }}
                                        />
                                        <div className="absolute right-[12px] top-[12px]">
                                            <MapPin className="w-[1.125rem] h-[1.125rem] text-client-primary" />
                                        </div>
                                    </div>
                                    {isNotFound && (
                                        <p className="text-[0.8125rem] text-red-500 font-[500] mt-[10px] flex items-center gap-[6px]">
                                            <span className="text-[1rem]">⚠️</span>
                                            Không tìm thấy vị trí này trên bản đồ. Vui lòng kiểm tra lại địa chỉ hoặc chọn trực tiếp từ bản đồ bên dưới.
                                        </p>
                                    )}
                                </div>

                                <div className="relative h-[450px] border border-[#eee] rounded-[16px] overflow-hidden shadow-inner group/map">
                                    <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[500px]">
                                        <div className="relative flex items-center bg-white/90 backdrop-blur-md shadow-[0px_10px_30px_rgba(0,0,0,0.1)] rounded-[8px] border border-white/50 p-[5px]">
                                            <div className="pl-[15px]">
                                                <Search className="w-[1.125rem] h-[1.125rem] text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="flex-1 border-none bg-transparent rounded-[8px] px-[12px] py-[10px] text-[0.875rem] focus:outline-none placeholder:text-gray-400"
                                                placeholder="Tìm kiếm địa điểm..."
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCurrentLocation}
                                                className="p-[8px] mr-[5px] text-client-primary hover:bg-gray-100 rounded-full transition-colors"
                                                title="Vị trí hiện tại"
                                            >
                                                <Navigation className="w-[1.125rem] h-[1.125rem]" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    geocodeFromAddress(searchKeyword, true);
                                                }}
                                                className="bg-client-secondary text-white px-[18px] py-[8px] rounded-[8px] text-[0.875rem] font-[500] hover:bg-client-primary transition-all active:scale-95"
                                            >
                                                Tìm kiếm
                                            </button>
                                        </div>

                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white/95 backdrop-blur-lg border border-[#eee] rounded-[12px] shadow-[0px_15px_35px_rgba(0,0,0,0.15)] overflow-hidden">
                                                {suggestions.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleSelectSuggestion(item)}
                                                        className="px-[20px] py-[15px] hover:bg-client-primary/5 cursor-pointer border-b border-[#f5f5f5] last:border-none flex items-start gap-[12px] transition-colors"
                                                    >
                                                        <MapPin className="w-[1rem] h-[1rem] text-client-secondary shrink-0 mt-[2px]" />
                                                        <div className="flex flex-col gap-[2px]">
                                                            <span className="text-[0.875rem] font-[500] text-[#333] line-clamp-1">{item.display_name.split(',')[0]}</span>
                                                            <span className="text-[0.75rem] text-gray-500 line-clamp-1">{item.display_name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <MapContainer
                                        center={mapCenter}
                                        zoom={15}
                                        scrollWheelZoom={true}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={fetchAddressFromCoords} />
                                        <MapController center={mapCenter} />
                                    </MapContainer>

                                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_50px_rgba(0,0,0,0.02)] rounded-[16px]"></div>
                                </div>

                                <div className="checkbox checkbox-cart mt-[10px]">
                                    <input
                                        type="checkbox"
                                        id="default_address_checkbox"
                                        hidden
                                        checked={isDefault}
                                        onChange={() => setIsDefault(!isDefault)}
                                    />
                                    <label htmlFor="default_address_checkbox" className="text-[0.875rem] font-[500] text-[#555] cursor-pointer select-none">
                                        Đặt làm địa chỉ mặc định
                                    </label>
                                </div>

                                <div className="flex items-center gap-[10px] pt-[10px]">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="relative overflow-hidden group bg-client-primary rounded-[8px] px-[30px] py-[12px] font-[500] text-[0.875rem] text-white cursor-pointer flex items-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="relative z-10">{submitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
                                        <ArrowRight className="relative z-10 w-[1.125rem] h-[1.125rem] transition-transform duration-300 rotate-[-45deg] group-hover:rotate-0" />
                                        <div className="absolute top-0 left-0 w-full h-full bg-client-secondary transition-transform duration-500 ease-in-out transform scale-x-0 origin-left group-hover:scale-x-100"></div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
