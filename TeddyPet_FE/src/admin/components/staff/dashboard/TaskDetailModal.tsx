import type { CareTask, SpaTask } from "../../../types/employeeDashboard";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    Typography, 
    Stack, 
    Box, 
    Divider, 
    Chip, 
    IconButton,
    Paper,
    useTheme,
    alpha
} from "@mui/material";
import { 
    X, 
    User, 
    Dog, 
    Hash, 
    MapPin, 
    Calendar, 
    Clock, 
    FileText, 
    CheckCircle2, 
    AlertCircle,
    Activity
} from "lucide-react";

interface Props {
    task: CareTask | SpaTask | null;
    open: boolean;
    onClose: () => void;
    beforePhotos?: string[];
    duringPhotos?: string[];
    afterPhotos?: string[];
}

const formatService = (task: CareTask | SpaTask) => {
    if (task.type === "SPA") {
        const t = task as SpaTask;
        switch (t.serviceType) {
            case "SHOWER": return "Tắm gội";
            case "HAIRCUT": return "Cắt tỉa lông";
            case "NAIL": return "Cắt móng";
            case "COMBO": return "Combo Spa";
            default: return "Dịch vụ Spa";
        }
    }
    return task.title || "Dịch vụ chăm sóc";
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "COMPLETED": return "success";
        case "IN_PROGRESS": return "warning";
        case "PENDING":
        case "WAITING_STAFF": return "primary";
        case "PET_IN_HOTEL": return "secondary";
        default: return "default";
    }
};

const getStatusLabel = (status: string, serviceRequiresRoom?: boolean) => {
    switch (status) {
        case "COMPLETED": return "Đã hoàn thành";
        case "IN_PROGRESS": return serviceRequiresRoom ? "Chờ thực hiện" : "Đang xử lý";
        case "PENDING":
        case "WAITING_STAFF": return serviceRequiresRoom ? "Chưa bắt đầu" : "Chờ thực hiện";
        case "PET_IN_HOTEL": return "Thú cưng đã vào Hotel";
        default: return status;
    }
};

export const TaskDetailModal = ({ 
    task, 
    open, 
    onClose,
    beforePhotos,
    duringPhotos,
    afterPhotos
}: Props) => {
    const theme = useTheme();
    if (!task) return null;

    const isCare = task.type === "CARE";
    const careTask = task as CareTask;
    const spaTask = task as SpaTask;

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ 
                p: 0.75, 
                borderRadius: "8px", 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                display: "flex"
            }}>
                <Icon size={18} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary", letterSpacing: 1.2 }}>
                {title}
            </Typography>
        </Stack>
    );

    const InfoRow = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: any }) => (
        <Stack direction="row" spacing={1.5} sx={{ py: 1 }}>
            {Icon && <Box sx={{ mt: 0.25, color: "text.disabled" }}><Icon size={16} /></Box>}
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {value || "—"}
                </Typography>
            </Box>
        </Stack>
    );

    const PhotoGallery = ({ title, photos }: { title: string, photos?: string[] }) => {
        if (!photos || photos.length === 0) return null;
        return (
            <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                    {title} ({photos.length})
                </Typography>
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { height: 4 } }}>
                    {photos.map((src, i) => (
                        <Box
                            key={i}
                            component="img"
                            src={src}
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "12px",
                                objectFit: "cover",
                                border: "2px solid #fff",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                cursor: "pointer",
                                transition: "transform 0.2s",
                                "&:hover": { transform: "scale(1.05)" }
                            }}
                            onClick={() => window.open(src, "_blank")}
                        />
                    ))}
                </Stack>
            </Box>
        );
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: { 
                    borderRadius: "20px",
                    boxShadow: "0 24px 48px -12px rgba(0,0,0,0.12)"
                }
            }}
        >
            <DialogTitle sx={{ p: 3, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                        Chi tiết dịch vụ
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {formatService(task)}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: "text.disabled" }}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: 1 }}>
                <Stack spacing={4}>
                    {/* Status Area */}
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            borderRadius: "16px", 
                            bgcolor: alpha(theme.palette[getStatusColor(task.status) as any]?.main || theme.palette.grey[500], 0.04),
                            borderColor: alpha(theme.palette[getStatusColor(task.status) as any]?.main || theme.palette.grey[500], 0.1),
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Activity size={18} color={theme.palette[getStatusColor(task.status) as any]?.main} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Trạng thái hiện tại
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Chip 
                                label={getStatusLabel(task.status, task.serviceRequiresRoom)} 
                                color={getStatusColor(task.status) as any}
                                size="small"
                                sx={{ fontWeight: 800, fontSize: "0.75rem" }}
                            />
                            <Chip 
                                icon={task.bookingCheckedIn ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                label={task.bookingCheckedIn ? "Đã Check-in" : "Chờ Check-in"}
                                variant="outlined"
                                color={task.bookingCheckedIn ? "success" : "warning"}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                            />
                        </Stack>
                    </Paper>

                    {/* Section: Photos */}
                    {(beforePhotos?.length || duringPhotos?.length || afterPhotos?.length) ? (
                        <Box>
                            <SectionTitle icon={MapPin} title="Hình ảnh thực hiện" />
                            <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: "16px" }}>
                                <PhotoGallery title="Trước khi làm" photos={beforePhotos} />
                                <PhotoGallery title="Trong khi làm" photos={duringPhotos} />
                                <PhotoGallery title="Sau khi làm" photos={afterPhotos} />
                            </Box>
                        </Box>
                    ) : null}

                    {/* Section: Customer & Pet */}
                    <Box>
                        <SectionTitle icon={User} title="Khách hàng & Thú cưng" />
                        <Box sx={{ 
                            display: "grid", 
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, 
                            gap: 2,
                            bgcolor: "grey.50",
                            p: 2,
                            borderRadius: "16px"
                        }}>
                            <InfoRow icon={User} label="Khách hàng" value={task.customerName} />
                            <InfoRow icon={Hash} label="Mã Booking" value={task.bookingCode} />
                            <InfoRow icon={Dog} label="Thú cưng" value={`${task.petName} (${task.petSpecies})`} />
                            {isCare && <InfoRow icon={MapPin} label="Số hiệu Chuồng" value={careTask.cageNumber} />}
                        </Box>
                    </Box>

                    {/* Section: Service Details */}
                    <Box>
                        <SectionTitle icon={FileText} title="Chi tiết thực hiện" />
                        <Stack spacing={1}>
                            {task.type === "SPA" && (
                                <Box sx={{ display: "flex", gap: 3 }}>
                                    <InfoRow icon={Clock} label="Thời lượng" value={`${spaTask.durationMinutes} phút`} />
                                    <InfoRow icon={Calendar} label="Hẹn lúc" value={new Date(spaTask.bookingTime).toLocaleString()} />
                                </Box>
                            )}
                            <Box sx={{ p: 2, borderRadius: "12px", border: "1px dashed", borderColor: "divider" }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                    Ghi chú / Mô tả nhiệm vụ
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.primary", whiteSpace: "pre-wrap" }}>
                                    {task.description || "Không có ghi chú nào cho nhiệm vụ này."}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Section: Timeline */}
                    <Box>
                        <SectionTitle icon={Clock} title="Thời gian dự kiến" />
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                            <InfoRow label="Bắt đầu dự kiến" value={task.scheduledStart ? new Date(task.scheduledStart).toLocaleString() : "—"} />
                            <InfoRow label="Kết thúc dự kiến" value={task.scheduledEnd ? new Date(task.scheduledEnd).toLocaleString() : "—"} />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Technical Footer */}
                    <Box sx={{ opacity: 0.5, textAlign: "center" }}>
                        <Typography variant="caption" sx={{ fontSize: "10px", fontFamily: "monospace" }}>
                            ID: {task.id} • BookingID: {task.bookingId} • PetID: {task.bookingPetId}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
