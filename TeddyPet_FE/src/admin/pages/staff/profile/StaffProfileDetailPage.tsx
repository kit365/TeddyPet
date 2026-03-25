import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Button, 
    Card, 
    Stack, 
    Typography, 
    Avatar, 
    IconButton,
    Container,
    ThemeProvider,
    useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { 
    ShieldCheck, 
    Calendar, 
    Users, 
    Mail, 
    Phone, 
    MapPin, 
    Award, 
    Briefcase, 
    Landmark, 
    UserCircle,
    CheckCircle2
} from 'lucide-react';

import { Breadcrumb } from '../../../components/ui/Breadcrumb';
import { useStaffProfileById } from '../hooks/useStaffProfile';
import { prefixAdmin } from '../../../constants/routes';
import type { IStaffProfile } from '../../../api/staffProfile.api';
import { useBanks } from '../../../hooks/useBanks';
import { getProductCategoryTheme } from '../../product-category/configs/theme';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) => (
    <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '220px 1fr' },
        alignItems: 'center',
        p: 2.25,
        borderBottom: '1px solid #F1F5F9',
        transition: 'all 0.2s',
        '&:hover': { bgcolor: '#F8FAFC' },
        '&:last-child': { borderBottom: 'none' }
    }}>
        <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                {icon}
            </Box>
            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#637381', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {label}
            </Typography>
        </Stack>
        <Box sx={{ mt: { xs: 1, sm: 0 } }}>
            {value ? (
                <Box sx={{
                    display: 'inline-flex',
                    px: 1.75, py: 0.75,
                    bgcolor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    borderRadius: '10px',
                    minWidth: '80px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C252E' }}>
                        {value}
                    </Typography>
                </Box>
            ) : (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#CBD5E1', fontStyle: 'italic', ml: 1 }}>
                    Chưa cập nhật
                </Typography>
            )}
        </Box>
    </Box>
);

export const StaffProfileDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const outerTheme = useTheme();
    const localTheme = getProductCategoryTheme(outerTheme);

    const { data: res, isLoading } = useStaffProfileById(id);
    const { data: banks } = useBanks();
    const profile = (res as any)?.data as IStaffProfile;

    const bankData = banks?.find(b => b.shortName === profile?.bankName || b.name === profile?.bankName);

    if (isLoading) return (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
            <Box className="animate-pulse flex flex-col items-center">
                <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: '#f1f5f9', mb: 2 }} />
                <Box sx={{ width: 140, height: 20, borderRadius: 4, bgcolor: '#f1f5f9' }} />
            </Box>
        </Stack>
    );
    if (!profile) return <Box p={3} sx={{ textAlign: 'center' }}>Không tìm thấy hồ sơ nhân viên</Box>;

    const handleEdit = () => {
        navigate(`/${prefixAdmin}/staff/profile/edit/${profile.staffId}`);
    };

    return (
        <ThemeProvider theme={localTheme}>
            <Container maxWidth="lg" sx={{ pb: 15 }}>
            {/* Header / Breadcrumbs */}
            <Stack direction="row" alignItems="center" spacing={2.5} sx={{ mb: 6, mt: 4 }}>
                <IconButton 
                    onClick={() => navigate(-1)} 
                    sx={{ 
                        bgcolor: 'white', 
                        width: 48, height: 48,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)', 
                        border: '1px solid #E2E8F0',
                        '&:hover': { bgcolor: '#F8FAFC' } 
                    }}
                >
                    <ArrowBackIcon sx={{ fontSize: 20, color: '#0F172A' }} />
                </IconButton>
                <Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1C252E', letterSpacing: '-0.04em' }}>
                        Chi tiết nhân sự
                    </Typography>
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Nhân sự', to: `/${prefixAdmin}/staff/profile/list` },
                            { label: profile.fullName || 'Chi tiết' },
                        ]}
                    />
                </Box>
            </Stack>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' },
                gap: 5,
                alignItems: 'start' // Prevent stretching
            }}>
                {/* Left Side: Identity Card (Cleaned) */}
                <Box>
                    <Card sx={{ 
                        p: 5, textAlign: 'center', borderRadius: '2rem',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 8px 32px -4px rgba(145, 158, 171, 0.08)',
                        height: 'fit-content',
                        bgcolor: 'white'
                    }}>
                        <Box sx={{ position: 'relative', width: 140, height: 140, mx: 'auto', mb: 4.5 }}>
                            <Avatar
                                src={profile.avatarUrl ?? profile.altImage ?? undefined}
                                sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    borderRadius: '50%',
                                    border: '6px solid white',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                                }}
                            />
                            {/* Account Status Badge - Strategically Positioned */}
                            {((profile.googleWhitelistStatus === 'ACCEPTED' || !!profile.userId) && profile.googleWhitelistStatus !== 'PENDING') && (
                                <Box sx={{ 
                                    position: 'absolute',
                                    bottom: -10,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap',
                                    px: 2, py: 0.75, 
                                    bgcolor: '#0F172A', // Dark Slate for premium contrast
                                    color: 'white', 
                                    border: '3px solid white',
                                    borderRadius: 'full', 
                                    fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                                    display: 'flex', alignItems: 'center', gap: 0.5,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                    <CheckCircle2 size={10} className="text-emerald-400" /> Google Verified
                                </Box>
                            )}
                        </Box>

                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, mb: 1, color: '#1C252E', letterSpacing: '-0.02em' }}>
                            {profile.fullName}
                        </Typography>
                        
                        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: '#64748B', mb: 3 }}>
                            {profile.email || 'Chưa cập nhật email'}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                            <Box sx={{ 
                                px: 1.5, py: 0.75, bgcolor: '#F0FDF4', color: '#166534', 
                                border: '1px solid #DCFCE7', borderRadius: '10px', 
                                fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {profile.active ? "Đang làm việc" : "Ngừng hoạt động"}
                            </Box>
                            <Box sx={{ 
                                px: 1.5, py: 0.75, bgcolor: '#F8FAFC', color: '#64748B', 
                                border: '1px solid #F1F5F9', borderRadius: '10px', 
                                fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {profile.employmentType === 'FULL_TIME' ? "Toàn thời gian" : "Bán thời gian"}
                            </Box>
                        </Stack>
                    </Card>
                </Box>

                {/* Right Side: Information Groups (Encapsulated) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {/* Personal & contact */}
                    <Card sx={{ 
                        borderRadius: '1.5rem', border: '1px solid #E2E8F0', borderBottom: '2px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(145, 158, 171, 0.04)', overflow: 'hidden' 
                    }}>
                        <Box sx={{ p: 2.5, px: 4, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <UserCircle size={20} className="text-slate-600" />
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#637381', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Thông tin cá nhân & Liên hệ
                            </Typography>
                        </Box>
                        <Box>
                            <InfoRow icon={<ShieldCheck size={18} />} label="Số CCCD/CMND" value={profile.citizenId} />
                            <InfoRow icon={<Calendar size={18} />} label="Ngày sinh" value={profile.dateOfBirth} />
                            <InfoRow icon={<Users size={18} />} label="Giới tính" value={profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'} />
                            <InfoRow icon={<Mail size={18} />} label="Email làm việc" value={profile.email} />
                            <InfoRow icon={<Mail size={18} />} label="Email dự phòng" value={profile.backupEmail} />
                            <InfoRow icon={<Phone size={18} />} label="Số điện thoại" value={profile.phoneNumber} />
                            <InfoRow icon={<MapPin size={18} />} label="Địa chỉ liên hệ" value={profile.address} />
                        </Box>
                    </Card>

                    {/* Work & Bank */}
                    <Card sx={{ 
                        borderRadius: '1.5rem', border: '1px solid #E2E8F0', borderBottom: '2px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(145, 158, 171, 0.04)', overflow: 'hidden' 
                    }}>
                        <Box sx={{ p: 2.5, px: 4, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Briefcase size={20} className="text-slate-600" />
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#637381', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Công việc & Tài chính
                            </Typography>
                        </Box>
                        <Box>
                            <InfoRow icon={<Award size={18} />} label="Vị trí tuyển dụng" value={profile.positionName} />
                            <InfoRow icon={<Award size={18} />} label="Chức vụ phụ" value={profile.secondaryPositionName} />
                            <InfoRow icon={<Briefcase size={18} />} label="Loại hình nhân sự" value={profile.employmentType === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian'} />
                             {bankData ? (
                                 <Box sx={{ 
                                     display: 'grid', 
                                     gridTemplateColumns: { xs: '1fr', sm: '220px 1fr' },
                                     alignItems: 'center',
                                     p: 2.25,
                                     borderBottom: '1px solid #F1F5F9',
                                     transition: 'all 0.2s',
                                     '&:hover': { bgcolor: '#F8FAFC' }
                                 }}>
                                     <Stack direction="row" alignItems="center" spacing={2}>
                                         <Box sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                                             <Landmark size={18} />
                                         </Box>
                                         <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#637381', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                             Ngân hàng thụ hưởng
                                         </Typography>
                                     </Stack>
                                     <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                                         <Box sx={{
                                             display: 'inline-flex',
                                             alignItems: 'center',
                                             gap: 1.5,
                                             px: 1.75, py: 0.75,
                                             bgcolor: '#F8FAFC',
                                             border: '1px solid #F1F5F9',
                                             borderRadius: '10px',
                                             boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                         }}>
                                             <img 
                                                src={bankData.logo} 
                                                width="32" 
                                                alt={bankData.shortName}
                                                style={{ borderRadius: '4px', border: '1px solid #E2E8F0', padding: '2px', background: 'white' }} 
                                             />
                                             <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1C252E' }}>
                                                 {bankData.shortName}
                                             </Typography>
                                         </Box>
                                     </Box>
                                 </Box>
                             ) : (
                                 <InfoRow icon={<Landmark size={18} />} label="Ngân hàng thụ hưởng" value={profile.bankName} />
                             )}
                            <InfoRow icon={<ShieldCheck size={18} />} label="Số tài khoản ngân hàng" value={profile.bankAccountNo} />
                        </Box>
                    </Card>

                </Box>
            </Box>

            {/* Fixed Footer for Navigation (Consolidated) */}
            <Box sx={{
                position: 'fixed', bottom: 0, left: 0, right: 0, 
                bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
                borderTop: '1px solid #E2E8F0', py: 2.5, px: 8,
                display: 'flex', justifyContent: 'flex-end', gap: 2, zIndex: 1000
            }}>
                <Button 
                    variant="outlined" 
                    onClick={() => navigate(`/${prefixAdmin}/staff/profile/list`)} 
                    sx={{ 
                        borderRadius: '12px', textTransform: 'none', fontWeight: 800, fontSize: '0.875rem',
                        color: '#475569', borderColor: '#E2E8F0', px: 6, height: '48px',
                        bgcolor: 'white',
                        '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' } 
                    }}
                >
                    Danh sách
                </Button>
                <Button 
                    variant="contained" 
                    startIcon={<EditIcon />} 
                    onClick={handleEdit} 
                    sx={{ 
                        bgcolor: '#0F172A', borderRadius: '12px', textTransform: 'none', fontWeight: 800, 
                        fontSize: '0.875rem', px: 6, height: '48px',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                        '&:hover': { bgcolor: '#1E293B', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.3)' } 
                    }}
                >
                    Chỉnh sửa
                </Button>
            </Box>
        </Container>
    </ThemeProvider>
    );
};
