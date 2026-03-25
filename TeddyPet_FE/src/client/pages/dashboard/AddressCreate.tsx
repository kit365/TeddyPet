import { MapPin, Search, Navigation, BadgeCheck, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createAddress } from "../../../api/address.api";
import { DashboardLayout } from "./sections/DashboardLayout";

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
            console.log("🖱️ Bản đồ được click tại:", e.latlng);
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

export const AddressCreatePage = () => {
    const navigate = useNavigate();
    const [position, setPosition] = useState<L.LatLng | null>(new L.LatLng(10.7410688, 106.7164031));
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.7410688, 106.7164031]);
    const [address, setAddress] = useState<string>("");
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedWard, setSelectedWard] = useState<string>("");
    const [houseNumber, setHouseNumber] = useState<string>("");

    // Ref để theo dõi thao tác người dùng
    const isManualChange = useRef(false);

    // Khởi tạo từ Header nếu có
    useEffect(() => {
        const savedAddress = localStorage.getItem("delivery_address");
        const savedCoords = localStorage.getItem("delivery_coords");

        if (savedAddress && savedAddress !== "Chọn địa chỉ giao hàng" && !address) {
            setAddress(savedAddress);
            setSearchKeyword(savedAddress);
            if (savedCoords) {
                const { lat, lon } = JSON.parse(savedCoords);
                const newPos = new L.LatLng(lat, lon);
                setPosition(newPos);
                setMapCenter([lat, lon]);
            }
        } else if (position && !address) {
            // Fetch initial address for default coords if nothing saved
            fetchAddressFromCoords(position.lat, position.lng);
        }
        
        fetchDistricts();
    }, []);

    const fetchDistricts = async () => {
        try {
            const res = await fetch("https://provinces.open-api.vn/api/p/79?depth=2");
            const data = await res.json();
            if (data && data.districts) {
                setDistricts(data.districts);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách quận huyện:", error);
        }
    };

    const fetchWards = async (districtCode: number) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await res.json();
            if (data && data.wards) {
                setWards(data.wards);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách phường xã:", error);
        }
    };

    // Log mỗi khi Tọa độ (Position) thay đổi
    useEffect(() => {
        if (position) {
            console.log("📍 TOẠ ĐỘ HIỆN TẠI (Lat/Lon):", {
                lat: position.lat,
                lon: position.lng
            });
        }
    }, [position]);

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
                toast.success("Đã tìm thấy vị trí của bạn!");
            },
            (err) => {
                console.error("Lỗi GPS:", err);
                toast.error("Không thể lấy vị trí. Vui lòng cấp quyền GPS.");
            }
        );
    };

    // Hàm lấy địa chỉ từ tọa độ (sau khi click bản đồ)
    const fetchAddressFromCoords = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                console.log("📝 Đã tìm thấy địa chỉ từ bản đồ:", data.display_name);
                isManualChange.current = false;
                setAddress(data.display_name);
                setSearchKeyword(data.display_name); // Sync search bar
                setIsNotFound(false);
                setShowSuggestions(false); // Hide any existing suggestions
            }
        } catch (error) {
            console.error("Lỗi reverse geocoding:", error);
        }
    };

    // Hàm lấy tọa độ từ địa chỉ chuỗi (Geocoding)
    const geocodeFromAddress = async (query: string, isFromSearch: boolean = false) => {
        if (!query.trim() || query.length < 3) return;

        console.log(`🔍 Đang tìm tọa độ cho địa chỉ: "${query}"...`);

        try {
            const trySearch = async (q: string) => {
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`);
                return await res.json();
            };

            let data = await trySearch(query);

            // Fallback cho địa chỉ có xuyệt (/) - cực kỳ phổ biến ở VN
            // Nếu tìm full không ra, thử cắt bớt phần xuyệt để tìm ngõ/đường chính
            if (!(data.features && data.features.length > 0) && query.includes("/")) {
                const parts = query.split(/[\s,]+/);
                const houseNumIndex = parts.findIndex(p => p.includes("/"));
                if (houseNumIndex !== -1) {
                    // Thử tìm theo số nhà chính hoặc tên đường
                    const fallbackQuery = parts.slice(houseNumIndex + 1).join(" ") || query.replace(/\/\d+/g, "");
                    console.log(`⚠️ Không tìm thấy địa chỉ chi tiết, thử tìm cụm chính: "${fallbackQuery}"`);
                    data = await trySearch(fallbackQuery);
                }
            }

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const lat = feature.geometry.coordinates[1];
                const lon = feature.geometry.coordinates[0];
                console.log(`✅ THÀNH CÔNG! Tìm thấy tọa độ:`, { lat, lon });

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
                console.log("❌ Không tìm thấy tọa độ phù hợp.");
                setIsNotFound(true);
            }
        } catch (error) {
            console.error("Lỗi Geocoding:", error);
        }
    };

    // Tự động tìm tọa độ khi người dùng ngừng gõ trong ô "Địa chỉ chi tiết"
    useEffect(() => {
        if (!isManualChange.current) return;

        const timer = setTimeout(() => {
            if (address.length >= 3) {
                geocodeFromAddress(address);
                isManualChange.current = false; // Reset lại sau khi tìm xong
            }
        }, 1000); // 1 giây sau khi ngừng gõ/paste

        return () => clearTimeout(timer);
    }, [address]);

    // Gợi ý tìm kiếm cho thanh Search trên bản đồ
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
                    console.error("Lỗi gợi ý tìm kiếm:", error);
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
        setSearchKeyword(suggestion.display_name); // Sync search bar
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
            
            let finalAddress = address.trim();
            let lat = position?.lat;
            let lon = position?.lng;

            if (isManualMode) {
                if (!houseNumber.trim() || !selectedWard || !selectedDistrict) {
                    toast.error("Vui lòng nhập đầy đủ địa chỉ thủ công");
                    setSubmitting(false);
                    return;
                }
                finalAddress = `${houseNumber.trim()}, ${selectedWard}, ${selectedDistrict}, Thành phố Hồ Chí Minh`;
                // Nếu đang dùng tay, ta để lat/lon mặc định HCM nếu chưa chọn map
                if (!lat || !lon) {
                    lat = 10.762622;
                    lon = 106.660172;
                }
            }

            await createAddress({
                fullName: fullName.trim(),
                phone: phone.trim(),
                address: finalAddress,
                longitude: lon,
                latitude: lat,
                isDefault
            });
            toast.success("Thêm địa chỉ thành công!");
            navigate("/dashboard/address");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể thêm địa chỉ");
        } finally {
            setSubmitting(false);
        }
    };

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Sổ địa chỉ", to: "/dashboard/address" },
        { label: "Thêm địa chỉ mới", to: `/dashboard/address/create` },
    ];

    return (
        <DashboardLayout pageTitle="Thêm địa chỉ mới" breadcrumbs={breadcrumbs}>
            <div className="max-w-[56rem] space-y-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[1.5rem] font-bold text-slate-800 flex items-center gap-2.5">
                            <MapPin className="text-client-primary" size={24} />
                            Thêm địa chỉ mới
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Thiết lập nơi nhận hàng của bạn</p>
                    </div>
                </div>

                <form className="space-y-5" onSubmit={onSubmit}>
                    {/* Form Row 1: Name & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Họ tên người nhận</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Ví dụ: Nguyễn Văn A"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Số điện thoại</label>
                            <input
                                type="text"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Ví dụ: 0912345678"
                            />
                        </div>

                        {!isManualMode && (
                             <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Địa chỉ chi tiết (từ bản đồ)</label>
                                <textarea
                                    required
                                    value={address}
                                    onChange={(e) => {
                                        isManualChange.current = true;
                                        setAddress(e.target.value);
                                    }}
                                    rows={2}
                                    className="w-full px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                                    placeholder="Vui lòng chọn trên bản đồ hoặc nhập tại đây..."
                                />
                                {isNotFound && (
                                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                                        ⚠️ Không tìm thấy vị trí chính xác. Thử chọn lại trên bản đồ.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="md:col-span-2 flex justify-end pr-2">
                             <button 
                                type="button" 
                                onClick={() => setIsManualMode(!isManualMode)}
                                className="text-[11px] font-bold text-client-primary hover:underline"
                            >
                                {isManualMode ? "← Quay lại dùng bản đồ" : "Hoặc nhập thủ công (Quận/Phường/Đường)"}
                            </button>
                        </div>
                    </div>

                    {isManualMode && (
                        <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quận / Huyện</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDistrict}
                                            onChange={(e) => {
                                                const district = districts.find(d => d.name === e.target.value);
                                                setSelectedDistrict(e.target.value);
                                                setSelectedWard("");
                                                if (district) fetchWards(district.code);
                                            }}
                                            className="w-full px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer pr-10"
                                        >
                                            <option value="">Chọn Quận/Huyện</option>
                                            {districts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phường / Xã</label>
                                    <div className="relative">
                                        <select
                                            value={selectedWard}
                                            onChange={(e) => setSelectedWard(e.target.value)}
                                            disabled={!selectedDistrict}
                                            className="w-full px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 pr-10"
                                        >
                                            <option value="">Chọn Phường/Xã</option>
                                            {wards.map(w => <option key={w.code} value={w.name}>{w.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số nhà, tên đường</label>
                                <input
                                    type="text"
                                    value={houseNumber}
                                    onChange={(e) => setHouseNumber(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Ví dụ: 123 Đường ABC..."
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic">
                                * Địa chỉ này sẽ được dùng làm fallback khi hệ thống bản đồ gặp trục trặc.
                            </p>
                        </div>
                    )}

                    {!isManualMode && (
                        /* Map Section */
                        <div className="relative min-h-[280px] h-[280px] border border-slate-200 rounded-2xl overflow-hidden bg-white shrink-0">
                        {/* Search Bar */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[92%]">
                            <div className="relative flex items-center gap-1.5 bg-white shadow-lg rounded-xl border border-slate-200 p-1.5">
                                <Search size={14} className="text-slate-400 ml-1" />
                                <input
                                    type="text"
                                    className="flex-1 border-none bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none placeholder:text-slate-400"
                                    placeholder="Địa chỉ..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleCurrentLocation}
                                    className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Vị trí hiện tại"
                                >
                                    <Navigation size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); geocodeFromAddress(searchKeyword, true); }}
                                    className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-client-primary transition-all active:scale-95"
                                >
                                    Tìm
                                </button>
                            </div>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white/98 border border-slate-100 rounded-xl shadow-xl overflow-y-auto max-h-[220px]">
                                    {suggestions.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="px-3 py-2 hover:bg-client-primary/5 cursor-pointer border-b border-slate-50 last:border-none flex items-start gap-2.5 transition-colors"
                                        >
                                            <MapPin size={14} className="text-client-secondary shrink-0 mt-0.5" />
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.display_name.split(',')[0]}</span>
                                                <span className="text-[11px] text-slate-400 line-clamp-1">{item.display_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker position={position} setPosition={setPosition} onLocationSelect={fetchAddressFromCoords} />
                            <MapController center={mapCenter} />
                        </MapContainer>
                    </div>
                )}

                    {/* Default Address Checkbox */}
                    <div className="flex items-center gap-2.5 pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isDefault}
                                    onChange={() => setIsDefault(!isDefault)}
                                />
                                <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded-md transition-all peer-checked:bg-client-primary peer-checked:border-client-primary group-hover:border-client-primary/50"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-white scale-0 transition-transform peer-checked:scale-100">
                                    <BadgeCheck size={12} />
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Đặt làm địa chỉ mặc định</span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-client-primary transition-all shadow-sm disabled:opacity-60"
                        >
                            {submitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Plus size={14} />}
                            {submitting ? "Đang lưu..." : "Thêm địa chỉ"}
                        </button>
                        <Link 
                            to="/dashboard/address" 
                            className="flex items-center justify-center px-6 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Hủy
                        </Link>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};
