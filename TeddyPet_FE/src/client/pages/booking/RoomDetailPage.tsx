import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    getRoomById,
    getRoomTypeById,
    type RoomClient,
    type RoomTypeClient,
    type RoomTypeDetailClient,
} from "../../../api/service.api";
import type { ApiResponse } from "../../../types/common.type";
import type { BookingDetailDraft } from "./BookingDetail";
import { FooterSub } from "../../components/layouts/FooterSub";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PetsIcon from "@mui/icons-material/Pets";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PolicyIcon from "@mui/icons-material/Policy";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SecurityIcon from "@mui/icons-material/Security";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";

type LocationState = {
    fromBooking?: boolean;
    room?: RoomClient;
    roomTypeName?: string;
    /** Draft form từ màn chi tiết đặt lịch, truyền lại khi "Quay lại chọn phòng" */
    bookingDraft?: BookingDetailDraft;
};

export const RoomDetailPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as LocationState;

    const { data: roomRes, isLoading: roomLoading, isError: roomError } = useQuery({
        queryKey: ["room-detail", roomId],
        queryFn: () => getRoomById(Number(roomId)),
        enabled: !!roomId && !state.room,
        select: (res: ApiResponse<RoomClient>) => res.data,
    });

    const room = state.room ?? roomRes;

    const { data: roomTypeRes } = useQuery({
        queryKey: ["room-type-detail", room?.roomTypeId],
        queryFn: () => getRoomTypeById(room!.roomTypeId),
        enabled: !!room?.roomTypeId,
        select: (res: ApiResponse<RoomTypeDetailClient>) => res.data,
    });

    const roomType = roomTypeRes;
    const isLoading = roomLoading && !state.room;
    const isError = roomError && !state.room;

    if (!roomId) {
        return (
            <div className="min-h-screen flex flex-col">
                <main className="flex-1 px-4 py-8 max-w-[900px] mx-auto w-full">
                    <Typography sx={{ fontSize: "1.5rem", color: "#666" }}>Không tìm thấy phòng.</Typography>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/dat-lich/chi-tiet", { state: { bookingDraft: state.bookingDraft } })}
                        sx={{ mt: 2 }}
                    >
                        Quay lại đặt lịch
                    </Button>
                </main>
                <FooterSub />
            </div>
        );
    }

    if (isLoading && !room) {
        return (
            <div className="min-h-screen flex flex-col">
                <main className="flex-1 flex items-center justify-center px-4 py-8">
                    <CircularProgress />
                </main>
                <FooterSub />
            </div>
        );
    }

    if ((isError || !room) && !state.room) {
        return (
            <div className="min-h-screen flex flex-col">
                <main className="flex-1 px-4 py-8 max-w-[900px] mx-auto w-full">
                    <Typography sx={{ fontSize: "1.5rem", color: "#b91c1c" }}>
                        Không tải được thông tin phòng. Vui lòng thử lại.
                    </Typography>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/dat-lich/chi-tiet", { state: { bookingDraft: state.bookingDraft } })}
                        sx={{ mt: 2 }}
                    >
                        Quay lại đặt lịch
                    </Button>
                </main>
                <FooterSub />
            </div>
        );
    }

    const displayTypeName =
        state.roomTypeName ?? room.roomTypeName ?? roomType?.displayTypeName ?? roomType?.typeName ?? "—";
    const statusLabel =
        room.status === "AVAILABLE"
            ? "Sẵn sàng"
            : room.status === "OCCUPIED"
              ? "Đang sử dụng"
              : room.status === "MAINTENANCE"
                ? "Bảo trì"
                : room.status === "CLEANING"
                  ? "Đang vệ sinh"
                  : room.status === "BLOCKED"
                    ? "Tạm khóa"
                    : room.status === "OUT_OF_SERVICE"
                      ? "Ngừng phục vụ"
                      : room.status ?? "—";

    const allImages: string[] = [];
    if (roomType?.imageUrl) allImages.push(roomType.imageUrl);
    if (roomType?.galleryImages?.length) allImages.push(...roomType.galleryImages);
    if (room?.images && typeof room.images === "string") {
        room.images.split(",").forEach((u) => {
            const t = u.trim();
            if (t && !allImages.includes(t)) allImages.push(t);
        });
    }
    const heroImage = allImages[0] ?? null;

    const formatPrice = (n: number | null | undefined) =>
        n != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n) : null;

    const leadText = roomType?.shortDescription || roomType?.description?.slice(0, 200) || "";
    const fullDescription = roomType?.description || roomType?.shortDescription || "";

    // Lý do nên chọn: từ features (split by newline/dấu chấm) hoặc mặc định
    const reasonsFromFeatures =
        roomType?.features
            ?.split(/\n|\.|;/)
            .map((s) => s.trim())
            .filter(Boolean) ?? [];
    const defaultReasons = [
        "Không gian thoải mái, sạch sẽ cho thú cưng",
        "Tiện nghi đầy đủ theo tiêu chuẩn loại phòng",
        "Đội ngũ chăm sóc chuyên nghiệp, tận tâm",
        "Giá cả minh bạch, phù hợp từng nhu cầu",
    ];
    const reasonsToChoose =
        reasonsFromFeatures.length > 0 ? reasonsFromFeatures : defaultReasons;

    // Tiện nghi: gộp standardAmenities + additionalAmenities, tách thành list
    const amenitiesList: string[] = [];
    if (roomType?.standardAmenities) {
        roomType.standardAmenities
            .split(/\n|,|;|\./)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => amenitiesList.push(s));
    }
    if (room?.additionalAmenities) {
        room.additionalAmenities
            .split(/\n|,|;|\./)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => amenitiesList.push(s));
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <main className="flex-1 w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
                {/* Breadcrumb */}
                <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Link
                        component="button"
                        variant="body2"
                        onClick={() => navigate("/")}
                        sx={{ fontSize: "1.35rem", color: "#637381", "&:hover": { color: "#ffbaa0" } }}
                    >
                        Trang chủ
                    </Link>
                    <Typography component="span" sx={{ color: "#919EAB", fontSize: "1.35rem" }}>
                        /
                    </Typography>
                    <Link
                        component="button"
                        variant="body2"
                        onClick={() => navigate("/dat-lich/chi-tiet")}
                        sx={{ fontSize: "1.35rem", color: "#637381", "&:hover": { color: "#ffbaa0" } }}
                    >
                        Đặt lịch
                    </Link>
                    <Typography component="span" sx={{ color: "#919EAB", fontSize: "1.35rem" }}>
                        /
                    </Typography>
                    <Typography sx={{ fontSize: "1.35rem", fontWeight: 600, color: "#181818" }}>
                        {room.roomNumber} – {room.roomName || displayTypeName}
                    </Typography>
                </Box>

                {/* Nút quay lại: nếu từ màn đặt lịch thì quay lại kèm draft để giữ form */}
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() =>
                        state.fromBooking && state.bookingDraft
                            ? navigate("/dat-lich/chi-tiet", { state: { bookingDraft: state.bookingDraft } })
                            : navigate(-1)
                    }
                    sx={{
                        fontSize: "1.4rem",
                        fontWeight: 600,
                        color: "#555",
                        textTransform: "none",
                        mb: 2,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                    }}
                >
                    Quay lại
                </Button>

                {/* Hero ảnh (giống blog: ảnh lớn full width, bo góc) */}
                <Box
                    sx={{
                        borderRadius: "20px",
                        overflow: "hidden",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
                        mb: 4,
                        bgcolor: "#e8e8e8",
                    }}
                >
                    {heroImage ? (
                        <Box
                            component="img"
                            src={heroImage}
                            alt={room.roomNumber}
                            sx={{
                                width: "100%",
                                height: { xs: 280, sm: 380, md: 480 },
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: "100%",
                                height: { xs: 280, sm: 380, md: 480 },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "rgba(255,186,160,0.15)",
                            }}
                        >
                            <MeetingRoomIcon sx={{ fontSize: 80, color: "rgba(255,186,160,0.6)" }} />
                        </Box>
                    )}
                    {/* Overlay: loại phòng + trạng thái (chỉ khi có ảnh) */}
                    {heroImage && (
                    <Box
                        sx={{
                            position: "relative",
                            marginTop: "-80px",
                            p: 2.5,
                            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
                            color: "#fff",
                            zIndex: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                opacity: 0.95,
                            }}
                        >
                            {displayTypeName}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mt: 1 }}>
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: "8px",
                                    bgcolor:
                                        room.status === "AVAILABLE"
                                            ? "rgba(0,167,111,0.9)"
                                            : "rgba(145,158,171,0.9)",
                                    fontSize: "1.3rem",
                                    fontWeight: 700,
                                }}
                            >
                                {statusLabel}
                            </Box>
                        </Box>
                    </Box>
                    )}
                    {!heroImage && (
                        <Box sx={{ p: 2.5, bgcolor: "rgba(255,186,160,0.12)", borderTop: "1px solid rgba(255,186,160,0.3)" }}>
                            <Typography sx={{ fontSize: "1.2rem", fontWeight: 600, color: "#637381", textTransform: "uppercase" }}>
                                {displayTypeName}
                            </Typography>
                            <Box
                                sx={{
                                    display: "inline-flex",
                                    mt: 1,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: "8px",
                                    bgcolor: room.status === "AVAILABLE" ? "rgba(0,167,111,0.15)" : "rgba(145,158,171,0.2)",
                                    color: room.status === "AVAILABLE" ? "#00A76F" : "#637381",
                                    fontSize: "1.3rem",
                                    fontWeight: 700,
                                }}
                            >
                                {statusLabel}
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Tiêu đề bài viết (giống blog) */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: "2.6rem", sm: "3.2rem", md: "3.6rem" },
                            fontWeight: 800,
                            color: "#181818",
                            lineHeight: 1.2,
                            mb: 2,
                        }}
                    >
                        {room.roomNumber}
                        {room.roomName ? ` – ${room.roomName}` : ""}
                    </Typography>
                    {/* Đoạn dẫn (lead) giống blog */}
                    {leadText && (
                        <Box
                            sx={{
                                borderLeft: "4px solid #ffbaa0",
                                pl: 3,
                                py: 1.5,
                                bgcolor: "rgba(255,186,160,0.06)",
                                borderRadius: "0 12px 12px 0",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "1.65rem",
                                    color: "#454F5B",
                                    lineHeight: 1.7,
                                    fontStyle: "italic",
                                }}
                            >
                                {leadText.length > 200 ? leadText.slice(0, 200) + "…" : leadText}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Nội dung chính (article body) */}
                <Box component="article" sx={{ "& .article-p": { mb: 2.5, fontSize: "1.6rem", lineHeight: 1.8, color: "#212B36" } }}>
                    {/* Về phòng này */}
                    {fullDescription && (
                        <Box sx={{ mb: 5 }}>
                            <Typography
                                component="h2"
                                sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 2 }}
                            >
                                Về phòng này
                            </Typography>
                            <Typography
                                sx={{ fontSize: "1.6rem", lineHeight: 1.85, color: "#212B36", whiteSpace: "pre-wrap" }}
                            >
                                {fullDescription}
                            </Typography>
                        </Box>
                    )}

                    {/* Tại sao nên chọn phòng này */}
                    <Box sx={{ mb: 5 }}>
                        <Typography
                            component="h2"
                            sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 3 }}
                        >
                            Tại sao nên chọn phòng này?
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                            {reasonsToChoose.map((text, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 1.5,
                                        p: 2,
                                        borderRadius: "12px",
                                        bgcolor: "#fff",
                                        border: "1px solid rgba(145,158,171,0.2)",
                                        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                                    }}
                                >
                                    <CheckCircleOutlineIcon sx={{ color: "#00A76F", fontSize: "2.4rem", flexShrink: 0, mt: 0.2 }} />
                                    <Typography sx={{ fontSize: "1.5rem", lineHeight: 1.6, color: "#212B36" }}>
                                        {text}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Tiện nghi (icon + list) */}
                    <Box sx={{ mb: 5 }}>
                        <Typography
                            component="h2"
                            sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 3 }}
                        >
                            Tiện nghi
                        </Typography>
                        {amenitiesList.length > 0 ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                {amenitiesList.map((a, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 1,
                                            px: 2,
                                            py: 1.25,
                                            borderRadius: "10px",
                                            bgcolor: "#fff",
                                            border: "1px solid rgba(255,186,160,0.4)",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                        }}
                                    >
                                        <StarIcon sx={{ color: "#ffbaa0", fontSize: "2rem" }} />
                                        <Typography sx={{ fontSize: "1.45rem", fontWeight: 500, color: "#181818" }}>
                                            {a}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography sx={{ fontSize: "1.5rem", color: "#637381" }}>
                                Phòng được trang bị đầy đủ tiện nghi cơ bản theo tiêu chuẩn {displayTypeName}.
                            </Typography>
                        )}
                    </Box>

                    {/* Thông tin nhanh (grid gọn) */}
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: "16px",
                            bgcolor: "#fff",
                            border: "1px solid rgba(145,158,171,0.2)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            mb: 5,
                        }}
                    >
                        <Typography sx={{ fontSize: "1.8rem", fontWeight: 700, color: "#181818", mb: 2 }}>
                            Thông tin nhanh
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                gap: 2,
                            }}
                        >
                            <QuickItem label="Loại phòng" value={displayTypeName} />
                            <QuickItem label="Tầng / Ngăn chuồng" value={room.tier ?? "—"} />
                            {(room.gridRow != null || room.gridCol != null) && (
                                <QuickItem
                                    label="Vị trí sơ đồ"
                                    value={`Hàng ${(room.gridRow ?? 0) + 1}, Cột ${(room.gridCol ?? 0) + 1}`}
                                />
                            )}
                            {room.capacity != null && (
                                <QuickItem label="Sức chứa" value={`${room.capacity} thú cưng`} />
                            )}
                            {(room.area != null || roomType?.minArea != null || roomType?.maxArea != null) && (
                                <QuickItem
                                    label="Diện tích"
                                    value={
                                        room.area != null
                                            ? `${room.area} m²`
                                            : [roomType?.minArea, roomType?.maxArea].filter(Boolean).length > 0
                                              ? [roomType?.minArea, roomType?.maxArea].filter(Boolean).join(" – ") + " m²"
                                              : "—"
                                    }
                                />
                            )}
                            <QuickItem label="Trạng thái" value={statusLabel} />
                        </Box>
                    </Box>

                    {/* Hình ảnh (gallery kiểu blog) */}
                    {allImages.length > 0 && (
                        <Box sx={{ mb: 5 }}>
                            <Typography
                                component="h2"
                                sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 3 }}
                            >
                                Hình ảnh
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                                    gap: 2,
                                }}
                            >
                                {allImages.slice(0, 6).map((url, i) => (
                                    <Box
                                        key={i}
                                        component="img"
                                        src={url}
                                        alt=""
                                        sx={{
                                            width: "100%",
                                            aspectRatio: "4/3",
                                            objectFit: "cover",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(145,158,171,0.2)",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Chính sách & yêu cầu */}
                    {(roomType?.cancellationPolicy ||
                        roomType?.requiresVaccination === true ||
                        roomType?.requiresHealthCheck === true) && (
                        <Box sx={{ mb: 5 }}>
                            <Typography
                                component="h2"
                                sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 2 }}
                            >
                                Chính sách & yêu cầu
                            </Typography>
                            <Box sx={{ p: 3, bgcolor: "#fff", borderRadius: "16px", border: "1px solid rgba(145,158,171,0.2)" }}>
                                {roomType?.cancellationPolicy && (
                                    <Typography sx={{ fontSize: "1.5rem", lineHeight: 1.7, color: "#212B36", mb: 2 }}>
                                        {roomType.cancellationPolicy}
                                    </Typography>
                                )}
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                    {roomType?.requiresVaccination === true && (
                                        <Chip label="Yêu cầu tiêm phòng" icon={<SecurityIcon />} />
                                    )}
                                    {roomType?.requiresHealthCheck === true && (
                                        <Chip label="Yêu cầu kiểm tra sức khỏe" icon={<FavoriteIcon />} />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Phù hợp với */}
                    {(roomType?.suitablePetTypes?.length ||
                        roomType?.maxPets != null ||
                        roomType?.suitablePetSizes) && (
                        <Box sx={{ mb: 5 }}>
                            <Typography
                                component="h2"
                                sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 2 }}
                            >
                                Phù hợp với
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                                <PetsIcon sx={{ color: "#ffbaa0", fontSize: "2.8rem" }} />
                                {roomType?.suitablePetTypes?.length ? (
                                    <Typography sx={{ fontSize: "1.5rem", color: "#212B36" }}>
                                        {roomType.suitablePetTypes.join(", ")}
                                        {roomType?.maxPets != null && ` • Tối đa ${roomType.maxPets} thú cưng/phòng`}
                                    </Typography>
                                ) : (
                                    roomType?.maxPets != null && (
                                        <Typography sx={{ fontSize: "1.5rem", color: "#212B36" }}>
                                            Tối đa {roomType.maxPets} thú cưng mỗi phòng
                                        </Typography>
                                    )
                                )}
                                {roomType?.suitablePetSizes && (
                                    <Typography component="span" sx={{ fontSize: "1.45rem", color: "#637381", ml: 1 }}>
                                        • {roomType.suitablePetSizes}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Giá tham khảo */}
                    {roomType?.basePricePerNight != null && roomType.basePricePerNight > 0 && (
                        <Box
                            sx={{
                                p: 3,
                                borderRadius: "16px",
                                bgcolor: "rgba(0,167,111,0.06)",
                                border: "1px solid rgba(0,167,111,0.2)",
                                mb: 5,
                            }}
                        >
                            <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, color: "#637381", mb: 1 }}>
                                Giá tham khảo
                            </Typography>
                            <Typography sx={{ fontSize: "2.4rem", fontWeight: 800, color: "#00A76F" }}>
                                {formatPrice(roomType.basePricePerNight)}
                                <Typography component="span" sx={{ fontSize: "1.4rem", fontWeight: 500, color: "#637381", ml: 1 }}>
                                    / đêm
                                </Typography>
                            </Typography>
                            <Typography sx={{ fontSize: "1.35rem", color: "#637381", mt: 1 }}>
                                Giá có thể thay đổi tùy dịch vụ và thời gian. Vui lòng xác nhận khi đặt lịch.
                            </Typography>
                        </Box>
                    )}

                    {/* Ghi chú phòng */}
                    {room.notes && (
                        <Box sx={{ mb: 5 }}>
                            <Typography
                                component="h2"
                                sx={{ fontSize: "2.2rem", fontWeight: 700, color: "#181818", mb: 2 }}
                            >
                                Ghi chú
                            </Typography>
                            <Typography sx={{ fontSize: "1.55rem", lineHeight: 1.7, color: "#212B36", whiteSpace: "pre-wrap" }}>
                                {room.notes}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* CTA */}
                {state.fromBooking && (
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate("/dat-lich/chi-tiet", { state: { bookingDraft: state.bookingDraft } })}
                        sx={{
                            mt: 2,
                            py: 1.75,
                            fontSize: "1.6rem",
                            fontWeight: 700,
                            borderRadius: "12px",
                            bgcolor: "#ffbaa0",
                            color: "#181818",
                            "&:hover": { bgcolor: "#ff9a7a" },
                        }}
                    >
                        Quay lại chọn phòng
                    </Button>
                )}
            </main>
            <FooterSub />
        </div>
    );
};

function QuickItem({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Typography sx={{ fontSize: "1.25rem", color: "#637381", fontWeight: 600, mb: 0.5 }}>{label}</Typography>
            <Typography sx={{ fontSize: "1.45rem", color: "#181818", fontWeight: 500 }}>{value}</Typography>
        </Box>
    );
}

function Chip({ label, icon }: { label: string; icon?: React.ReactNode }) {
    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: "10px",
                bgcolor: "rgba(0,167,111,0.1)",
                color: "#00A76F",
                fontSize: "1.35rem",
                fontWeight: 600,
            }}
        >
            {icon}
            {label}
        </Box>
    );
}
