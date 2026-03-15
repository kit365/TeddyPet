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
    alpha,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import PushPinIcon from '@mui/icons-material/PushPin';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getAllSettings, updateSetting, getReceivingAccount, updateReceivingAccount } from '../../api/setting.api';
import { APP_SETTING_KEYS } from '../../constants/settings';
import { getBanks } from '../../../api/bank.api';
import type { BankOption } from '../../../types/bank.type';

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

/** Số tài khoản: chỉ số, 6-19 ký tự (theo chuẩn VietQR/Napas) */
const RECEIVING_ACCOUNT_NUMBER_REGEX = /^[0-9]{6,19}$/;

/** Mã ngân hàng VietQR (8 chữ số) theo chuẩn Napas - dùng cho API ảnh img.vietqr.io */
const BANK_CODE_TO_VIETQR_ID: Record<string, string> = {
    VCB: '970436', BIDV: '970418', CTG: '970415', ACB: '970416', TCB: '970407', MBB: '970422',
    VPB: '970432', TPB: '970423', SHB: '970443', STB: '970403', VIB: '970441', HDB: '970437',
    EIB: '970431', OCB: '970448', MSB: '970426', SCB: '970429', SGB: '970400', BVB: '970438',
    KLB: '970452', ABB: '970425', SEAB: '970440', PGB: '970430', NCB: '970419', IVB: '970434',
    VRB: '970427', UOB: '970458', HSBC: '970442', SCVN: '970410',
};

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
    const [shopPhone, setShopPhone] = useState('');
    const [shopEmail, setShopEmail] = useState('');
    const [shopWebsite, setShopWebsite] = useState('');
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [appleStoreUrl, setAppleStoreUrl] = useState('');
    const [playStoreUrl, setPlayStoreUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<any>(null);

    // Thông tin tài khoản nhận tiền (PayOS)
    const [banks, setBanks] = useState<BankOption[]>([]);
    const [receivingBankCode, setReceivingBankCode] = useState('');
    const [receivingAccountNumber, setReceivingAccountNumber] = useState('');
    const [receivingAccountHolderName, setReceivingAccountHolderName] = useState('');
    const [receivingNote, setReceivingNote] = useState('');
    const [downloadingQr, setDownloadingQr] = useState(false);
    const [receivingAccountNumberError, setReceivingAccountNumberError] = useState<string>('');
    const [receivingAccountHolderNameError, setReceivingAccountHolderNameError] = useState<string>('');

    // Map States
    const [pos, setPos] = useState<L.LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([10.7410, 106.7145]);
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const loadBanks = async () => {
            try {
                const res = await getBanks();
                if (res.success && Array.isArray(res.data)) setBanks(res.data);
            } catch (e) {
                console.error('Load banks', e);
            }
        };
        loadBanks();
    }, []);

    const fetchSettings = async () => {
        try {
            const [response, receivingRes] = await Promise.all([
                getAllSettings(),
                getReceivingAccount()
            ]);
            if (receivingRes.success && receivingRes.data) {
                setReceivingBankCode(receivingRes.data.bankCode || '');
                setReceivingAccountNumber(receivingRes.data.accountNumber || '');
                setReceivingAccountHolderName(receivingRes.data.accountHolderName || '');
                setReceivingNote(receivingRes.data.note || '');
            } else {
                setReceivingBankCode('');
                setReceivingAccountNumber('');
                setReceivingAccountHolderName('');
                setReceivingNote('');
            }
            if (response.success && response.data) {
                const settings = response.data;
                const address = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_ADDRESS)?.settingValue || '';
                const lat = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_LAT)?.settingValue || '10.7410';
                const lng = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_LNG)?.settingValue || '106.7145';
                const phone = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_PHONE)?.settingValue || '';
                const email = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_EMAIL)?.settingValue || '';
                const website = settings.find(s => s.settingKey === APP_SETTING_KEYS.SHOP_WEBSITE)?.settingValue || '';
                const facebook = settings.find(s => s.settingKey === APP_SETTING_KEYS.SOCIAL_FACEBOOK)?.settingValue || '';
                const instagram = settings.find(s => s.settingKey === APP_SETTING_KEYS.SOCIAL_INSTAGRAM)?.settingValue || '';
                const apple = settings.find(s => s.settingKey === APP_SETTING_KEYS.SOCIAL_APPLE_STORE)?.settingValue || '';
                const play = settings.find(s => s.settingKey === APP_SETTING_KEYS.SOCIAL_PLAY_STORE)?.settingValue || '';

                setShopAddress(address);
                setShopLat(lat);
                setShopLng(lng);
                setShopPhone(phone);
                setShopEmail(email);
                setShopWebsite(website);
                setFacebookUrl(facebook);
                setInstagramUrl(instagram);
                setAppleStoreUrl(apple);
                setPlayStoreUrl(play);

                setOriginalSettings({
                    address, lat, lng, phone, email, website, facebook, instagram, apple, play,
                    receivingBankCode: receivingRes.success && receivingRes.data ? receivingRes.data.bankCode : '',
                    receivingAccountNumber: receivingRes.success && receivingRes.data ? receivingRes.data.accountNumber : '',
                    receivingAccountHolderName: receivingRes.success && receivingRes.data ? receivingRes.data.accountHolderName : '',
                    receivingNote: receivingRes.success && receivingRes.data ? (receivingRes.data.note || '') : ''
                });

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

    const normalizeAddress = (query: string) => {
        return query
            .replace(/\b[Pp]\.?\s?(\d+|[\w\s]+)\b/g, "Phường $1")
            .replace(/\b[Qq]\.?\s?(\d+|[\w\s]+)\b/g, "Quận $1")
            .replace(/\b[Tt][Pp]\.?\s/g, "Thành phố ")
            .replace(/\b[Hh]\.?\s/g, "Huyện ")
            .replace(/\b[Tt][Xx]\.?\s/g, "Thị xã ")
            .trim();
    };

    // Auto-fetch suggestions when typing
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchKeyword.length < 3) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            try {
                const normalized = normalizeAddress(searchKeyword);
                // Biasing towards current position if exists
                const bias = pos ? `&location_bias_scale=0.5&lat=${pos.lat}&lon=${pos.lng}` : "";
                // Adding bbox for Vietnam to restrict results
                const bbox = "&bbox=102.1,8.5,109.5,23.4";
                
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(normalized)}&limit=10${bias}${bbox}`);
                const data = await res.json();
                
                if (data.features) {
                    const mapped = data.features.map((f: any) => {
                        const p = f.properties;
                        const houseNum = p.housenumber ? `${p.housenumber} ` : "";
                        const street = p.street || "";
                        const name = (p.name && p.name !== p.street) ? p.name : "";
                        const mainPart = name ? (street ? `${name}, ${houseNum}${street}` : `${houseNum}${name}`) : `${houseNum}${street}`;
                        const parts = [mainPart, p.district, p.city, p.country];
                        return {
                            display_name: parts.filter(Boolean).join(", "),
                            lat: f.geometry.coordinates[1],
                            lon: f.geometry.coordinates[0]
                        };
                    });
                    setSuggestions(mapped);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error("Lỗi gợi ý:", error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 400);
        return () => clearTimeout(timer);
    }, [searchKeyword, pos]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSetting(APP_SETTING_KEYS.SHOP_ADDRESS, shopAddress, 'Địa chỉ cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_LAT, shopLat, 'Vĩ độ cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_LNG, shopLng, 'Kinh độ cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_PHONE, shopPhone, 'Số điện thoại cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_EMAIL, shopEmail, 'Email cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SHOP_WEBSITE, shopWebsite, 'Website cửa hàng'),
                updateSetting(APP_SETTING_KEYS.SOCIAL_FACEBOOK, facebookUrl, 'Facebook URL'),
                updateSetting(APP_SETTING_KEYS.SOCIAL_INSTAGRAM, instagramUrl, 'Instagram URL'),
                updateSetting(APP_SETTING_KEYS.SOCIAL_APPLE_STORE, appleStoreUrl, 'Apple Store URL'),
                updateSetting(APP_SETTING_KEYS.SOCIAL_PLAY_STORE, playStoreUrl, 'Play Store URL')
            ]);
            // Validate thông tin tài khoản nhận tiền nếu có nhập
            const hasReceiving = receivingBankCode.trim() || receivingAccountNumber.trim() || receivingAccountHolderName.trim();
            if (hasReceiving) {
                setReceivingAccountNumberError('');
                setReceivingAccountHolderNameError('');
                const accNum = receivingAccountNumber.trim();
                const accName = receivingAccountHolderName.trim();
                let valid = true;
                if (!receivingBankCode.trim()) {
                    toast.error('Vui lòng chọn Ngân hàng.');
                    valid = false;
                }
                if (!accNum) {
                    setReceivingAccountNumberError('Số tài khoản là bắt buộc.');
                    valid = false;
                } else if (!RECEIVING_ACCOUNT_NUMBER_REGEX.test(accNum)) {
                    setReceivingAccountNumberError('Số tài khoản chỉ được chứa chữ số, từ 6 đến 19 ký tự.');
                    valid = false;
                }
                if (!accName) {
                    setReceivingAccountHolderNameError('Chủ tài khoản là bắt buộc.');
                    valid = false;
                }
                if (!valid) {
                    setSaving(false);
                    return;
                }
                await updateReceivingAccount({
                    bankCode: receivingBankCode.trim(),
                    accountNumber: accNum,
                    accountHolderName: accName,
                    note: receivingNote.trim() || undefined
                });
            }
            setOriginalSettings({
                address: shopAddress,
                lat: shopLat,
                lng: shopLng,
                phone: shopPhone,
                email: shopEmail,
                website: shopWebsite,
                facebook: facebookUrl,
                instagram: instagramUrl,
                apple: appleStoreUrl,
                play: playStoreUrl
            });
            setIsEditing(false);
            toast.success("Cập nhật cài đặt thành công");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Lỗi khi cập nhật cài đặt");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (originalSettings) {
            setShopAddress(originalSettings.address);
            setShopLat(originalSettings.lat);
            setShopLng(originalSettings.lng);
            setShopPhone(originalSettings.phone);
            setShopEmail(originalSettings.email);
            setShopWebsite(originalSettings.website);
            setFacebookUrl(originalSettings.facebook);
            setInstagramUrl(originalSettings.instagram);
            setAppleStoreUrl(originalSettings.apple);
            setPlayStoreUrl(originalSettings.play);
            setReceivingBankCode(originalSettings.receivingBankCode ?? '');
            setReceivingAccountNumber(originalSettings.receivingAccountNumber ?? '');
            setReceivingAccountHolderName(originalSettings.receivingAccountHolderName ?? '');
            setReceivingNote(originalSettings.receivingNote ?? '');
            setReceivingAccountNumberError('');
            setReceivingAccountHolderNameError('');

            const latitude = parseFloat(originalSettings.lat);
            const longitude = parseFloat(originalSettings.lng);
            setPos(new L.LatLng(latitude, longitude));
            setMapCenter([latitude, longitude]);
        }
        setIsEditing(false);
    };

    const handleLocationSelect = async (lat: number, lon: number) => {
        if (!isEditing) return;
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

    const geocodeFromAddress = async (query: string, isFromSearch: boolean = false) => {
        if (!query.trim() || query.length < 3) return;
        
        const normalizedQuery = normalizeAddress(query);
        
        try {
            const trySearch = async (q: string) => {
                // Bias and bbox mapping
                const bias = pos ? `&lat=${pos.lat}&lon=${pos.lng}&location_bias_scale=0.5` : "";
                const bbox = "&bbox=102.1,8.5,109.5,23.4";
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1${bias}${bbox}`);
                return await res.json();
            };

            let data = await trySearch(normalizedQuery);

            // Fallback 1: Strip house number if no result
            if (!(data.features && data.features.length > 0)) {
                const parts = normalizedQuery.split(/[\s,]+/);
                const slashIndex = parts.findIndex(p => p.includes("/"));
                if (slashIndex !== -1) {
                    const streetOnly = parts.slice(slashIndex + 1).join(" ");
                    if (streetOnly.length > 3) {
                        data = await trySearch(streetOnly);
                    }
                }
            }

            // Fallback 2: Nominatim override (more detailed for specific addresses)
            if (!(data.features && data.features.length > 0)) {
                const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedQuery)}&limit=1&countrycodes=vn`);
                const nomData = await nomRes.json();
                if (nomData && nomData.length > 0) {
                    const res = nomData[0];
                    const lat = parseFloat(res.lat);
                    const lon = parseFloat(res.lon);
                    const newLatLng = new L.LatLng(lat, lon);
                    setPos(newLatLng);
                    setMapCenter([lat, lon]);
                    setShopLat(lat.toString());
                    setShopLng(lon.toString());
                    if (isFromSearch) {
                        setShopAddress(res.display_name);
                        setSearchKeyword("");
                        setShowSuggestions(false);
                    }
                    return;
                }
            }

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const lat = feature.geometry.coordinates[1];
                const lon = feature.geometry.coordinates[0];
                const newLatLng = new L.LatLng(lat, lon);
                setPos(newLatLng);
                setMapCenter([lat, lon]);
                setShopLat(lat.toString());
                setShopLng(lon.toString());

                if (isFromSearch) {
                    const p = feature.properties;
                    const houseNum = p.housenumber ? `${p.housenumber} ` : "";
                    const street = p.street || "";
                    const name = (p.name && p.name !== p.street) ? p.name : "";
                    const mainPart = name ? (street ? `${name}, ${houseNum}${street}` : `${houseNum}${name}`) : `${houseNum}${street}`;
                    const parts = [mainPart, p.district, p.city, p.country];
                    const displayName = parts.filter(Boolean).join(", ");
                    
                    setShopAddress(displayName);
                    setSearchKeyword("");
                    setShowSuggestions(false);
                }
            } else {
                toast.warn("Không tìm thấy vị trí chính xác. Hãy chọn trên bản đồ hoặc gõ tên đường.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
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

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Trình duyệt không hỗ trợ định vị GPS");
            return;
        }

        toast.info("Đang lấy vị trí của bạn...", { autoClose: 2000 });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const newLatLng = new L.LatLng(latitude, longitude);
                setPos(newLatLng);
                setMapCenter([latitude, longitude]);
                setShopLat(latitude.toString());
                setShopLng(longitude.toString());
                
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        setShopAddress(data.display_name);
                    }
                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                }
            },
            (error) => {
                console.error("GPS error:", error);
                toast.error("Không thể lấy vị trí. Vui lòng cho phép quyền truy cập GPS.");
            },
            { enableHighAccuracy: true }
        );
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
                            <StoreIcon sx={{ fontSize: '1.5rem' }} />
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
                            disabled={!isEditing}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#00AB55' }} /></InputAdornment>,
                                sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' }
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
                                    onKeyPress={(e) => e.key === 'Enter' && geocodeFromAddress(searchKeyword, true)}
                                    disabled={!isEditing}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#637381' }} /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button
                                                    onClick={handleCurrentLocation}
                                                    disabled={!isEditing}
                                                    sx={{ 
                                                        minWidth: 0, 
                                                        p: 1, 
                                                        borderRadius: '10px',
                                                        color: '#00AB55',
                                                        '&:hover': { bgcolor: alpha('#00AB55', 0.1) }
                                                    }}
                                                >
                                                    <MyLocationIcon />
                                                </Button>
                                            </InputAdornment>
                                        ),
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
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C252E' }}>{item.display_name.split(',')[0]}</Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#637381' }}>{item.display_name}</Typography>
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
                                <PushPinIcon sx={{ fontSize: '0.875rem', color: '#00AB55' }} />
                                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600 }}>Tọa độ: {parseFloat(shopLat).toFixed(4)}, {parseFloat(shopLng).toFixed(4)}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: 2.5, borderRadius: '20px', bgcolor: alpha('#00AB55', 0.04), border: '1px dashed #00AB55', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            <Box sx={{ fontSize: '1.5rem' }}>📍</Box>
                            <Typography variant="body2" sx={{ color: '#1C252E', fontWeight: 600, fontSize: '0.8125rem' }}>
                                <b>Hướng dẫn:</b> Bạn hãy click trực tiếp vào bản đồ để chọn chính xác vị trí cửa hàng. Tọa độ này sẽ được sử dụng để tự động tính khoảng cách (Km) cho tất cả các đơn hàng mới.
                            </Typography>
                        </Box>
                    </Stack>
                </Card>

                {/* Contact & Social Settings */}
                <Card sx={{ p: 4, borderRadius: '32px', border: '1px solid #F4F6F8', boxShadow: '0 8px 32px rgba(145, 158, 171, 0.05)' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: alpha('#546E7A', 0.1), color: '#546E7A', display: 'flex' }}>
                            <PushPinIcon sx={{ fontSize: '1.5rem' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1C252E' }}>Thông tin liên hệ & Mạng xã hội</Typography>
                            <Typography variant="body2" sx={{ color: '#637381' }}>Quản lý các liên kết mạng xã hội và thông tin liên hệ hiển thị trên toàn hệ thống.</Typography>
                        </Box>
                    </Stack>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3.5 }}>
                        <TextField
                            fullWidth
                            label="Số điện thoại"
                            value={shopPhone}
                            onChange={(e) => setShopPhone(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Email cửa hàng"
                            value={shopEmail}
                            onChange={(e) => setShopEmail(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Website cửa hàng"
                            value={shopWebsite}
                            onChange={(e) => setShopWebsite(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Facebook URL"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Instagram URL"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                        <Box /> {/* Spacer */}
                        <TextField
                            fullWidth
                            label="Apple Store URL"
                            value={appleStoreUrl}
                            onChange={(e) => setAppleStoreUrl(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                        <TextField
                            fullWidth
                            label="Google Play Store URL"
                            value={playStoreUrl}
                            onChange={(e) => setPlayStoreUrl(e.target.value)}
                            variant="outlined"
                            disabled={!isEditing}
                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                        />
                    </Box>
                </Card>

                {/* Thông tin tài khoản nhận tiền (PayOS) */}
                <Card sx={{ p: 4, borderRadius: '32px', border: '1px solid #F4F6F8', boxShadow: '0 8px 32px rgba(145, 158, 171, 0.05)' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                        <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: alpha('#2196F3', 0.1), color: '#2196F3', display: 'flex' }}>
                            <AccountBalanceIcon sx={{ fontSize: '1.5rem' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1C252E' }}>Thông tin tài khoản nhận tiền</Typography>
                            <Typography variant="body2" sx={{ color: '#637381' }}>Tài khoản ngân hàng nhận tiền khi khách thanh toán online (PayOS). Cấu hình một tài khoản duy nhất cho hệ thống.</Typography>
                        </Box>
                    </Stack>
                    {(() => {
                        const bankId = receivingBankCode ? BANK_CODE_TO_VIETQR_ID[receivingBankCode.trim().toUpperCase()] : null;
                        const accountNo = receivingAccountNumber.trim();
                        const accountName = receivingAccountHolderName.trim();
                        const accountNoValid = RECEIVING_ACCOUNT_NUMBER_REGEX.test(accountNo);
                        const hasAll = bankId && accountNo && accountName && accountNoValid;
                        const qrImageUrl = hasAll
                            ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?accountName=${encodeURIComponent(accountName)}`
                            : null;
                        return (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
                                {/* Cột trái: các ô nhập */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3.5 }}>
                                        <FormControl fullWidth variant="outlined" disabled={!isEditing} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}>
                                            <InputLabel>Ngân hàng</InputLabel>
                                            <Select
                                                value={receivingBankCode}
                                                onChange={(e) => setReceivingBankCode(e.target.value)}
                                                label="Ngân hàng"
                                            >
                                                <MenuItem value="">— Chọn ngân hàng —</MenuItem>
                                                {banks.map((b) => (
                                                    <MenuItem key={b.bankCode} value={b.bankCode}>{b.bankName} ({b.bankCode})</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Số tài khoản"
                                            value={receivingAccountNumber}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/\D/g, '');
                                                if (v.length <= 19) {
                                                    setReceivingAccountNumber(v);
                                                    setReceivingAccountNumberError('');
                                                }
                                            }}
                                            onBlur={() => {
                                                const v = receivingAccountNumber.trim();
                                                if (!v) {
                                                    setReceivingAccountNumberError('');
                                                    return;
                                                }
                                                if (!RECEIVING_ACCOUNT_NUMBER_REGEX.test(v)) {
                                                    setReceivingAccountNumberError('Số tài khoản chỉ được chứa chữ số, từ 6 đến 19 ký tự.');
                                                } else {
                                                    setReceivingAccountNumberError('');
                                                }
                                            }}
                                            error={!!receivingAccountNumberError}
                                            helperText={receivingAccountNumberError}
                                            variant="outlined"
                                            disabled={!isEditing}
                                            placeholder="Chỉ số, 6-19 chữ số"
                                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                                        />
                                        <TextField
                                            fullWidth
                                            required
                                            label="Chủ tài khoản"
                                            value={receivingAccountHolderName}
                                            onChange={(e) => {
                                                setReceivingAccountHolderName(e.target.value);
                                                setReceivingAccountHolderNameError('');
                                            }}
                                            onBlur={() => {
                                                if (!receivingAccountHolderName.trim()) {
                                                    setReceivingAccountHolderNameError('Chủ tài khoản là bắt buộc.');
                                                } else {
                                                    setReceivingAccountHolderNameError('');
                                                }
                                            }}
                                            error={!!receivingAccountHolderNameError}
                                            helperText={receivingAccountHolderNameError}
                                            variant="outlined"
                                            disabled={!isEditing}
                                            placeholder="Tên đầy đủ (bắt buộc)"
                                            sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Ghi chú (tùy chọn)"
                                            value={receivingNote}
                                            onChange={(e) => setReceivingNote(e.target.value)}
                                            variant="outlined"
                                            disabled={!isEditing}
                                            sx={{ gridColumn: '1 / -1' }}
                                            InputProps={{ sx: { borderRadius: '16px', fontWeight: 600, fontSize: '0.875rem' } }}
                                        />
                                    </Box>
                                    {/* Gợi ý khi chưa đủ thông tin hoặc ngân hàng chưa hỗ trợ QR */}
                                    {!qrImageUrl && (
                                        <Box sx={{ mt: 2 }}>
                                            {accountNo && accountName && receivingBankCode && !bankId ? (
                                                <Typography variant="body2" sx={{ color: '#B76E00' }}>
                                                    Ngân hàng <strong>{receivingBankCode}</strong> tạm thời chưa hỗ trợ hiển thị QR tự động.
                                                </Typography>
                                            ) : !hasAll && (
                                                <Typography variant="body2" sx={{ color: '#919EAB' }}>
                                                    Điền đủ Ngân hàng, Số tài khoản và Chủ tài khoản để hiển thị mã QR bên cạnh.
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                {/* Cột phải: ô hình ảnh QR (cùng hàng, to hơn) */}
                                <Box
                                    sx={{
                                        flexShrink: 0,
                                        p: 2.5,
                                        borderRadius: '20px',
                                        bgcolor: alpha('#2196F3', 0.04),
                                        border: '1px solid rgba(33, 150, 243, 0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        alignSelf: { xs: 'center', md: 'flex-start' },
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C252E', mb: 2 }}>
                                        Mã QR chuyển khoản (VietQR)
                                    </Typography>
                                    {qrImageUrl ? (
                                        <>
                                            <Box
                                                component="img"
                                                src={qrImageUrl}
                                                alt="QR chuyển khoản"
                                                sx={{ width: 280, height: 280, borderRadius: '12px', border: '1px solid #E5E8EB', bgcolor: '#fff' }}
                                            />
                                            <Typography variant="body2" sx={{ color: '#637381', mt: 1.5, textAlign: 'center', maxWidth: 280 }}>
                                                Khách quét mã QR bằng app ngân hàng để chuyển khoản.
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                size="medium"
                                                startIcon={<DownloadIcon />}
                                                disabled={downloadingQr}
                                                onClick={async () => {
                                                    setDownloadingQr(true);
                                                    try {
                                                        const res = await fetch(qrImageUrl, { mode: 'cors' });
                                                        if (!res.ok) throw new Error('Không tải được ảnh');
                                                        const blob = await res.blob();
                                                        const a = document.createElement('a');
                                                        a.href = URL.createObjectURL(blob);
                                                        a.download = `qr-chuyen-khoan-${accountNo}.jpg`;
                                                        a.click();
                                                        URL.revokeObjectURL(a.href);
                                                        toast.success('Đã tải ảnh QR xuống');
                                                    } catch {
                                                        window.open(qrImageUrl, '_blank');
                                                        toast.info('Mở ảnh QR trong tab mới. Bạn có thể nhấn chuột phải > Lưu hình ảnh.');
                                                    } finally {
                                                        setDownloadingQr(false);
                                                    }
                                                }}
                                                sx={{ mt: 2, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
                                            >
                                                {downloadingQr ? 'Đang tải...' : 'Tải ảnh QR'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Box
                                            sx={{
                                                width: 280,
                                                height: 280,
                                                borderRadius: '12px',
                                                border: '1px dashed #E5E8EB',
                                                bgcolor: '#FAFBFC',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ color: '#919EAB', textAlign: 'center', px: 2 }}>
                                                Mã QR sẽ hiển thị khi điền đủ thông tin bên trái
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        );
                    })()}
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {!isEditing ? (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => setIsEditing(true)}
                            sx={{
                                borderRadius: '16px',
                                px: 6,
                                py: 2,
                                fontSize: '1rem',
                                fontWeight: 900,
                                bgcolor: '#1C252E',
                                color: 'white',
                                boxShadow: '0 8px 32px rgba(28, 37, 46, 0.2)',
                                '&:hover': { bgcolor: '#000000', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)' },
                                textTransform: 'none'
                            }}
                        >
                            Chỉnh sửa cài đặt
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={handleCancel}
                                disabled={saving}
                                sx={{
                                    borderRadius: '16px',
                                    px: 6,
                                    py: 2,
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    borderColor: '#637381',
                                    color: '#637381',
                                    '&:hover': { borderColor: '#1C252E', color: '#1C252E', bgcolor: alpha('#637381', 0.04) },
                                    textTransform: 'none'
                                }}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                disabled={saving}
                                onClick={handleSave}
                                sx={{
                                    borderRadius: '16px',
                                    px: 10,
                                    py: 2.2,
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    bgcolor: '#00AB55',
                                    boxShadow: '0 8px 32px rgba(0, 171, 85, 0.3)',
                                    '&:hover': { bgcolor: '#007B55', boxShadow: '0 12px 40px rgba(0, 171, 85, 0.4)' },
                                    textTransform: 'none'
                                }}
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        </>
                    )}
                </Box>
            </Stack>
        </Box>
    );
};
