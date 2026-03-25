import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import NotesIcon from "@mui/icons-material/Notes";
import PetsIcon from "@mui/icons-material/Pets";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import type { BookingPetResponse } from "../../../../types/booking.type";

const formatBool = (v?: boolean | string) => {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v === "true" || v === "1" ? "Có" : "Không";
  return v ? "Có" : "Không";
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
    <Box sx={{ minWidth: 180 }}>
      <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.875rem", display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9688rem", color: "text.primary", fontWeight: 500 }}>
        {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  </Stack>
);

const parsePhotoUrls = (value?: string | null): string[] => {
  if (!value) return [];
  const s = String(value).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x)).filter(Boolean);
    }
  } catch {
    // Backward compatibility: old data might be a single URL string.
  }
  return [s];
};

interface BookingPetDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  pet: BookingPetResponse | null;
}

export const BookingPetDetailDrawer = ({ open, onClose, pet }: BookingPetDetailDrawerProps) => {
  const theme = useTheme();
  if (!pet) return null;

  const arrivalPhotos = parsePhotoUrls(pet.arrivalPhotos);
  const departurePhotos = parsePhotoUrls(pet.departurePhotos);
  const belongingPhotos = parsePhotoUrls(pet.belongingPhotos);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440 },
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.125rem", color: "#1C252E" }}>
            Chi tiết thú cưng
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1C252E", mb: 2 }}>
          {pet.petName} ({pet.petType})
        </Typography>
        <Divider sx={{ my: 2 }} />

        <InfoRow label="Tên thú cưng" value={pet.petName} />
        <InfoRow label="Loại thú cưng" value={pet.petType} />
        <InfoRow label="Liên hệ khẩn cấp" value={pet.emergencyContactName} />
        <InfoRow label="SĐT khẩn cấp" value={pet.emergencyContactPhone} />
        <InfoRow label="Cân nặng khi đặt" value={pet.weightAtBooking != null ? `${pet.weightAtBooking} kg` : undefined} />
        <InfoRow label="Ghi chú tình trạng" value={pet.petConditionNotes} />
        <InfoRow label="Vấn đề sức khỏe" value={pet.healthIssues} />

        <Divider sx={{ my: 2 }} />
        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>
          Nhân viên / Admin quản lý
        </Typography>
        <InfoRow label="Tình trạng khi đến" value={pet.arrivalCondition} />
        <InfoRow label="Tình trạng khi về" value={pet.departureCondition} />
        <InfoRow label="Ảnh khi đến" value={arrivalPhotos.length ? "Đã có" : "—"} />
        <InfoRow label="Ảnh khi về" value={departurePhotos.length ? "Đã có" : "—"} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Ảnh đồ đạc mang theo" value={belongingPhotos.length ? "Đã có" : "—"} />

        <Divider sx={{ my: 2 }} />
        <InfoRow
          label="Mang theo thức ăn"
          value={
            pet.foodItems && pet.foodItems.length > 0
              ? "Có"
              : formatBool(pet.foodBrought)
          }
        />
        {pet.foodItems && pet.foodItems.length > 0 ? (
          <>
            {pet.foodItems.map((item, idx) => (
              <Box key={item.id ?? idx} sx={{ mt: 1.5, pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
                <InfoRow label="Loại" value={item.foodBroughtType ?? "—"} />
                <InfoRow label="Nhãn hiệu" value={item.foodBrand ?? "—"} />
                <InfoRow label="Số lượng" value={item.quantity != null ? String(item.quantity) : "—"} />
                <InfoRow label="Hướng dẫn cho ăn" value={item.feedingInstructions ?? "—"} />
              </Box>
            ))}
          </>
        ) : (
          formatBool(pet.foodBrought) === "Có" && (
            <>
              <InfoRow
                label="Loại thức ăn mang theo"
                value={
                  pet.foodBroughtType
                    ? Array.isArray(pet.foodBroughtType)
                      ? pet.foodBroughtType.join(", ")
                      : String(pet.foodBroughtType)
                    : "—"
                }
              />
              <InfoRow label="Hướng dẫn cho ăn" value={pet.feedingInstructions} />
            </>
          )
        )}
      </Box>
    </Drawer>
  );
};
