import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Stack,
    InputAdornment,
    CircularProgress,
    alpha
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import PushPinIcon from '@mui/icons-material/PushPin';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getAllSettings, updateSetting } from '../../api/setting.api';
import { APP_SETTING_KEYS } from '../../constants/settings';

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

export const SettingsPage = () => {
    const [shopAddress, setShopAddress] = useState('');
    const [shopLat, setShopLat] = useState('10.7410');
    const [shopLng, setShopLng] = useState('106.7145');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Map States
    const [pos, setPos] = useState<L.LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.7410, 106.7145]);
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await getAllSettings();
            if (response.success && response.data) {
                const settings = response.data;
                const address = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_ADDRESS)?.settingValue || '';
                const lat = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_LAT)?.settingValue || '10.7410';
                const lng = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_LNG)?.settingValue || '106.7145';

                setShopAddress(address);
                setShopLat(lat);
                setShopLng(lng);

                const latitude = parseFloat(lat);
                const longitude = parseFloat(lng);
                setPos(new L.LatLng(latitude, longitude));
                setMapCenter([latitude, longitude]);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Không thể tải cài đặt");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSetting(APP_SETTING_KEYS.SHOP_ADDRESS, shopAddress, 'Địa chỉ cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_LAT, shopLat, 'Vĩ độ cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_LNG, shopLng, 'Kinh độ cửa hàng')
            ]);
            toast.success("Cập nhật cài đặt thành công");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Lỗi khi cập nhật cài đặt");
        } finally {
            setSaving(false);
        }
    };

    const handleLocationSelect = async (lat: number, lon: number) => {
        setShopLat(lat.toString());
        setShopLng(lon.toString());

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.display_name) {
                setShopAddress(data.display_name);
            }
        } catch (error) {
            console.error("Lỗi reverse geocoding:", error);
        }
    };

    const handleSearch = async () => {
        if (!searchKeyword.trim()) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchKeyword)}&countrycodes=vn&limit=5`);
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error searching location:", error);
        }
    };

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        const newLatLng = new L.LatLng(lat, lon);
        setPos(newLatLng);
        setMapCenter([lat, lon]);
        setShopLat(lat.toString());
        setShopLng(lon.toString());
        setShopAddress(suggestion.display_name);
        setSearchKeyword("");
        setShowSuggestions(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress sx={{ color: '#00AB55' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 10 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#1C252E', letterSpacing: '-1px' }}>
                Cài đặt hệ thống
            </Typography>

            <Stack spacing={4}>
                {/* Store Settings */}
                <Card sx={{ p: 4, borderRadius: '32px', border: '1px solid #F4F6F8', boxShadow: '0 8px 32px rgba(145, 158, 171, 0.05)' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: alpha('#00AB55', 0.1), color: '#00AB55', display: 'flex' }}>
                            <StoreIcon sx={{ fontSize: '2.4rem' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1C252E' }}>Vị trí cửa hàng</Typography>
                            <Typography variant="body2" sx={{ color: '#637381' }}>Địa chỉ này là <b>Điểm lấy hàng (Pickup Point)</b> để tính quãng đường giao hàng cho khách.</Typography>
                        </Box>
                    </Stack>

                    <Stack spacing={3.5}>
                        <TextField
                            fullWidth
                            label="Địa chỉ hiển thị"
                            value={shopAddress}
                            onChange={(e) => setShopAddress(e.target.value)}
                            variant="outlined"
                            multiline
                            rows={2}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#00AB55' }} /></InputAdornment>,
                                sx: { borderRadius: '16px', fontWeight: 600, fontSize: '1.4rem' }
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#E5E8EB' }, '&:hover fieldset': { borderColor: '#00AB55' }, '&.Mui-focused fieldset': { borderColor: '#00AB55' } } }}
                        />

                        {/* Map Area */}
                        <Box sx={{ position: 'relative', height: 480, borderRadius: '24px', overflow: 'hidden', border: '1px solid #F4F6F8', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                            {/* Search Box on Map */}
                            <Box sx={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 1000, maxWidth: 500 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Tìm kiếm địa chỉ trên bản đồ..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#637381' }} /></InputAdornment>,
                                        sx: { bgcolor: 'white', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', border: '1px solid #E5E8EB' }
                                    }}
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <Box sx={{ bgcolor: 'white', mt: 1, borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #E5E8EB' }}>
                                        {suggestions.map((item, index) => (
                                            <Box
                                                key={index}
                                                onClick={() => handleSelectSuggestion(item)}
                                                sx={{ p: 2, cursor: 'pointer', borderBottom: '1px solid #F4F6F8', '&:hover': { bgcolor: '#F9FAFB' } }}
                                            >
                                                <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: '#1C252E' }}>{item.display_name.split(',')[0]}</Typography>
                                                <Typography sx={{ fontSize: '1.2rem', color: '#637381' }}>{item.display_name}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <MapController center={mapCenter} />
                                <LocationMarker
                                    position={pos}
                                    setPosition={setPos}
                                    onLocationSelect={handleLocationSelect}
                                />
                            </MapContainer>

                            {/* Coordinate Overlay (Subtle) */}
                            <Box sx={{ position: 'absolute', bottom: 20, right: 20, zCenter: 1000, bgcolor: 'rgba(28, 37, 46, 0.8)', color: 'white', px: 2, py: 1, borderRadius: '8px', backdropFilter: 'blur(4px)', display: 'flex', gap: 2, alignItems: 'center' }}>
                                <PushPinIcon sx={{ fontSize: '1.4rem', color: '#00AB55' }} />
                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Tọa độ: {parseFloat(shopLat).toFixed(4)}, {parseFloat(shopLng).toFixed(4)}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: 2.5, borderRadius: '20px', bgcolor: alpha('#00AB55', 0.04), border: '1px dashed #00AB55', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            <Box sx={{ fontSize: '2.4rem' }}>📍</Box>
                            <Typography variant="body2" sx={{ color: '#1C252E', fontWeight: 600, fontSize: '1.3rem' }}>
                                <b>Hướng dẫn:</b> Bạn hãy click trực tiếp vào bản đồ để chọn chính xác vị trí cửa hàng. Tọa độ này sẽ được sử dụng để tự động tính khoảng cách (Km) cho tất cả các đơn hàng mới.
                            </Typography>
                        </Box>
                    </Stack>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        size="large"
                        disabled={saving}
                        onClick={handleSave}
                        sx={{
                            borderRadius: '16px',
                            px: 10,
                            py: 2.2,
                            fontSize: '1.6rem',
                            fontWeight: 900,
                            bgcolor: '#00AB55',
                            boxShadow: '0 8px 32px rgba(0, 171, 85, 0.3)',
                            '&:hover': { bgcolor: '#007B55', boxShadow: '0 12px 40px rgba(0, 171, 85, 0.4)' },
                            textTransform: 'none'
                        }}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu cài đặt cửa hàng'}
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};
