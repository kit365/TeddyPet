import { useState, useEffect } from "react";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { ShippingRuleList } from "./sections/ShippingRuleList";
import { ShippingRuleFormDialog } from "./components/ShippingRuleFormDialog";
import { useShippingRules } from "./hooks/useShippingRules";
import { ShippingRule } from "../../../types/shipping.type";
import { deleteShippingRule } from "../../api/shipping.api";
import { toast } from "react-toastify";
import { Button, Card, CardContent, Typography, Box, TextField, InputAdornment } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

export const ShippingRuleListPage = () => {
    const { rules, loading, refetch } = useShippingRules();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<ShippingRule | null>(null);

    // Shop Config State
    const [shopConfig, setShopConfig] = useState({
        address: "74/39 Đường số 9, Phường 16, Gò Vấp, TP.HCM",
        latitude: 10.835,
        longitude: 106.678
    });

    // Map States
    const [markerPos, setMarkerPos] = useState<L.LatLng | null>(new L.LatLng(10.835, 106.678));
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.835, 106.678]);
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleCreate = () => {
        setSelectedRule(null);
        setDialogOpen(true);
    };

    const handleEdit = (rule: ShippingRule) => {
        setSelectedRule(rule);
        setDialogOpen(true);
    };

    const handleSaveConfig = () => {
        toast.success("Đã cập nhật địa chỉ cửa hàng làm điểm gốc tính phí");
    };

    const handleDelete = async (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) {
            try {
                await deleteShippingRule(id);
                toast.success("Đã xóa quy tắc vận chuyển");
                refetch();
            } catch (error: any) {
                toast.error(error.message || "Không thể xóa quy tắc");
            }
        }
    };

    // Geocoding logic
    const fetchAddressFromCoords = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                setShopConfig(prev => ({
                    ...prev,
                    address: data.display_name,
                    latitude: lat,
                    longitude: lon
                }));
                setMarkerPos(new L.LatLng(lat, lon));
                setMapCenter([lat, lon]);
            }
        } catch (error) {
            console.error("Lỗi reverse geocoding:", error);
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
        const newPos = new L.LatLng(lat, lon);
        setMarkerPos(newPos);
        setMapCenter([lat, lon]);
        setShopConfig({
            address: suggestion.display_name,
            latitude: lat,
            longitude: lon
        });
        setSearchKeyword("");
        setShowSuggestions(false);
    };

    const AddButton = (
        <Button
            onClick={handleCreate}
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
            startIcon={<AddIcon />}
        >
            Thêm mới
        </Button>
    );

    return (
        <div className="flex flex-col gap-[32px]">
            <ListHeader
                title="Quản lý phí vận chuyển"
                breadcrumbItems={[
                    { label: "Trang chủ", to: "/" },
                    { label: "Vận chuyển", to: `/${prefixAdmin}/shipping/list` },
                    { label: "Danh sách" }
                ]}
                action={AddButton}
            />

            {/* Shop Config Section with Map */}
            <Card sx={{ borderRadius: '16px', border: '1px solid #919eab33', boxShadow: 'none' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <StorefrontIcon sx={{ color: '#1C252E', fontSize: '2.4rem' }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.8rem' }}>📍 Địa chỉ gốc cửa hàng (Pickup Point)</Typography>
                    </Box>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <Box sx={{ position: 'relative' }}>
                                <TextField
                                    label="Tìm kiếm địa chỉ nhanh"
                                    fullWidth
                                    variant="outlined"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    placeholder="Nhập địa chỉ cửa hàng..."
                                    InputProps={{
                                        style: { fontSize: '1.4rem' },
                                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                                    }}
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        zIndex: 1000,
                                        bgcolor: 'white',
                                        mt: 1,
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        border: '1px solid #eee',
                                        maxHeight: '300px',
                                        overflow: 'auto'
                                    }}>
                                        {suggestions.map((item, idx) => (
                                            <Box
                                                key={idx}
                                                onClick={() => handleSelectSuggestion(item)}
                                                sx={{
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: '#F4F6F8' },
                                                    borderBottom: '1px solid #f5f5f5'
                                                }}
                                            >
                                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 600 }}>{item.display_name.split(',')[0]}</Typography>
                                                <Typography sx={{ fontSize: '1.1rem', color: '#637381' }}>{item.display_name}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            <TextField
                                label="Địa chỉ chi tiết"
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                value={shopConfig.address}
                                onChange={(e) => setShopConfig({ ...shopConfig, address: e.target.value })}
                                InputProps={{ style: { fontSize: '1.4rem' } }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSaveConfig}
                                    sx={{
                                        bgcolor: '#1C252E',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '1.4rem',
                                        px: 4,
                                        py: 1.2,
                                        borderRadius: '10px',
                                        '&:hover': { bgcolor: '#454F5B' }
                                    }}
                                >
                                    Lưu cấu hình cửa hàng
                                </Button>
                            </Box>
                        </div>

                        <Box sx={{ height: '400px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #919eab33' }}>
                            <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <MapController center={mapCenter} />
                                <LocationMarker
                                    position={markerPos}
                                    setPosition={setMarkerPos}
                                    onLocationSelect={fetchAddressFromCoords}
                                />
                            </MapContainer>
                        </Box>
                    </div>
                </CardContent>
            </Card>

            <ShippingRuleList
                rules={rules}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <ShippingRuleFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={refetch}
                initialData={selectedRule}
            />
        </div>
    );
};
