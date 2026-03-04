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
      <Typography sx={{ color: "text.secondary", fontWeight: 600, fontSize: "1.4rem", display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.55rem", color: "text.primary", fontWeight: 500 }}>
        {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  </Stack>
);

interface BookingPetDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  pet: BookingPetResponse | null;
}

export const BookingPetDetailDrawer = ({ open, onClose, pet }: BookingPetDetailDrawerProps) => {
  const theme = useTheme();
  if (!pet) return null;

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
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.8rem", color: "#1C252E" }}>
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
        <InfoRow label="Ảnh khi đến" value={pet.arrivalPhotos ? "Đã có" : "—"} />
        <InfoRow label="Ảnh khi về" value={pet.departurePhotos ? "Đã có" : "—"} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Ảnh đồ đạc mang theo" value={pet.belongingPhotos ? "Đã có" : "—"} />

        <Divider sx={{ my: 2 }} />
        <InfoRow label="Mang theo thức ăn" value={formatBool(pet.foodBrought)} />
        {formatBool(pet.foodBrought) === "Có" && (
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
        )}
      </Box>
    </Drawer>
  );
};
