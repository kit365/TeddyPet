import { useState, useEffect } from "react";
import { MapPin, Search } from "iconoir-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getAllAddresses } from "../../../api/address.api";

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

export const LocationSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [address, setAddress] = useState<string>("Chọn địa chỉ giao hàng");
    const [tempAddress, setTempAddress] = useState<string>("");
    const [pos, setPos] = useState<L.LatLng | null>(new L.LatLng(10.7410688, 106.7164031));
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.7410688, 106.7164031]);
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    useEffect(() => {
        const savedAddress = localStorage.getItem("delivery_address");
        if (savedAddress) {
            setAddress(savedAddress);
            const savedCoords = localStorage.getItem("delivery_coords");
            if (savedCoords) {
                const { lat, lon } = JSON.parse(savedCoords);
                setPos(new L.LatLng(lat, lon));
                setMapCenter([lat, lon]);
            }
        }
    }, []);

    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const fetchDefaultAddress = async () => {
            if (user) {
                setLoadingSaved(true);
                try {
                    const response = await getAllAddresses();
                    if (response.data && response.data.length > 0) {
                        setSavedAddresses(response.data);
                        const savedAddress = localStorage.getItem("delivery_address");
                        // If no manual selection yet, or it's the default placeholder, try to fetch from profile
                        if (!savedAddress || savedAddress === "Chọn địa chỉ giao hàng") {
                            const defaultAddr = response.data.find(a => a.isDefault) || response.data[0];
                            if (defaultAddr) {
                                setAddress(defaultAddr.address);
                                if (defaultAddr.latitude && defaultAddr.longitude) {
                                    const newPos = new L.LatLng(defaultAddr.latitude, defaultAddr.longitude);
                                    setPos(newPos);
                                    setMapCenter([defaultAddr.latitude, defaultAddr.longitude]);
                                    localStorage.setItem("delivery_address", defaultAddr.address);
                                    localStorage.setItem("delivery_coords", JSON.stringify({
                                        lat: defaultAddr.latitude,
                                        lon: defaultAddr.longitude
                                    }));
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user addresses:", error);
                } finally {
                    setLoadingSaved(false);
                }
            }
        };

        fetchDefaultAddress();
    }, [user, isOpen]);

    const fetchAddressFromCoords = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                setTempAddress(data.display_name);
            }
        } catch (error) {
            console.error("Lỗi reverse geocoding:", error);
        }
    };

    const handleConfirm = () => {
        if (tempAddress) {
            setAddress(tempAddress);
            localStorage.setItem("delivery_address", tempAddress);
            if (pos) {
                localStorage.setItem("delivery_coords", JSON.stringify({ lat: pos.lat, lon: pos.lng }));
            }
            // If pos exists, calculate provinceId if needed
            // For now just save the address
        }
        setIsOpen(false);
    };

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        setPos(new L.LatLng(lat, lon));
        setMapCenter([lat, lon]);
        setTempAddress(suggestion.display_name);
        setSearchKeyword("");
        setShowSuggestions(false);
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

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-[8px] cursor-pointer hover:text-client-primary transition-colors pr-[20px] border-r border-[#1029371A]"
            >
                <div className="w-[35px] h-[35px] bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-[18px] h-[18px]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[1.1rem] text-gray-400 font-medium">Giao tới:</span>
                    <span className="text-[1.3rem] font-secondary text-client-secondary truncate w-[140px]">
                        {address}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[20px] w-[900px] max-w-[95vw] h-[650px] flex flex-col overflow-hidden shadow-2xl scale-up">
                        <div className="p-[20px] border-b flex justify-between items-center">
                            <h2 className="text-[2rem] font-secondary text-client-secondary">Chọn địa chỉ giao hàng</h2>
                            <button onClick={() => setIsOpen(false)} className="text-[2.5rem] text-gray-400 hover:text-client-secondary transition-colors">&times;</button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Map Side */}
                            <div className="w-[60%] relative">
                                <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapController center={mapCenter} />
                                    <LocationMarker
                                        position={pos}
                                        setPosition={setPos}
                                        onLocationSelect={(lat, lon) => fetchAddressFromCoords(lat, lon)}
                                    />
                                </MapContainer>

                                <div className="absolute top-[15px] left-[15px] right-[15px] z-[1000]">
                                    <div className="relative">
                                        <div className="flex items-center bg-white rounded-[10px] shadow-lg border p-[5px]">
                                            <Search className="w-[20px] h-[20px] ml-[10px] text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
                                                placeholder="Tìm kiếm địa chỉ..."
                                                className="w-full p-[10px] outline-none text-[1.4rem]"
                                            />
                                        </div>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute top-[55px] left-0 w-full bg-white rounded-[10px] shadow-xl border z-[1001] max-h-[250px] overflow-y-auto">
                                                {suggestions.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleSelectSuggestion(s)}
                                                        className="p-[12px] border-b last:border-0 hover:bg-gray-50 cursor-pointer text-[1.3rem] transition-colors"
                                                    >
                                                        {s.display_name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Side */}
                            <div className="w-[40%] p-[25px] flex flex-col justify-between bg-gray-50">
                                <div className="flex flex-col gap-[20px]">
                                    <div className="bg-white p-[15px] rounded-[15px] border shadow-sm">
                                        <label className="text-gray-400 text-[1.2rem] block mb-[5px] font-medium">Địa chỉ hiện tại</label>
                                        <p className="text-client-secondary text-[1.4rem] font-medium line-clamp-3">
                                            {tempAddress || address}
                                        </p>
                                    </div>
                                    <div className="text-[1.3rem] text-gray-500 leading-relaxed italic pr-[10px]">
                                        * Bạn có thể gõ tìm địa chỉ hoặc click trực tiếp lên bản đồ để chọn vị trí chính xác nhất.
                                    </div>

                                    {user && (
                                        <div className="mt-[10px] flex-1 overflow-hidden flex flex-col">
                                            <div className="flex items-center justify-between mb-[10px]">
                                                <h4 className="text-[1.4rem] font-bold text-client-secondary uppercase tracking-tight">Vị trí đã lưu</h4>
                                                <a href="/dashboard/address/create" className="text-[1.2rem] text-client-primary hover:underline font-bold" onClick={() => setIsOpen(false)}>Thêm mới</a>
                                            </div>
                                            <div className="overflow-y-auto pr-[5px] space-y-[8px] flex-1 max-h-[180px]">
                                                {loadingSaved ? (
                                                    <p className="text-[1.2rem] text-gray-400">Đang tải...</p>
                                                ) : savedAddresses.length > 0 ? (
                                                    savedAddresses.map((addr) => (
                                                        <div
                                                            key={addr.id}
                                                            onClick={() => {
                                                                if (addr.latitude && addr.longitude) {
                                                                    const newPos = new L.LatLng(addr.latitude, addr.longitude);
                                                                    setPos(newPos);
                                                                    setMapCenter([addr.latitude, addr.longitude]);
                                                                    setTempAddress(addr.address);
                                                                }
                                                            }}
                                                            className="p-[12px] bg-white border border-gray-200 rounded-[12px] hover:border-client-primary cursor-pointer transition-all group shadow-sm"
                                                        >
                                                            <div className="flex items-start gap-[10px]">
                                                                <MapPin className="w-[14px] h-[14px] text-gray-400 mt-[3px] group-hover:text-client-primary" />
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="text-[1.3rem] font-bold text-client-secondary truncate group-hover:text-client-primary">{addr.fullName}</p>
                                                                    <p className="text-[1.1rem] text-gray-500 truncate">{addr.address}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[1.2rem] text-gray-400 italic">Chưa có địa chỉ nào được lưu.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-[12px]">
                                    <button
                                        onClick={handleConfirm}
                                        className="w-full bg-client-secondary text-white py-[16px] rounded-[12px] text-[1.6rem] font-secondary hover:bg-client-primary transition-all shadow-md active:scale-[0.98]"
                                    >
                                        Xác nhận địa chỉ
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full bg-white border border-gray-200 text-gray-500 py-[14px] rounded-[12px] text-[1.5rem] hover:bg-gray-50 transition-colors"
                                    >
                                        Để sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
