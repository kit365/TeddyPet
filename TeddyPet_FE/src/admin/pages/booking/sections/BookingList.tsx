import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import {
  dataGridCardStyles,
  dataGridContainerStyles,
  dataGridStyles,
} from "../../product/configs/styles.config";
import { useDataGridLocale } from "../../../hooks/useDataGridLocale";
import { getBookingColumns } from "../configs/column.config";
import { BOOKING_STATUS_OPTIONS, type BookingStatusFilter } from "../constants";
import { prefixAdmin } from "../../../constants/routes";
import { MOCK_BOOKINGS } from "../mockBookingData";

const CustomNoRowsOverlay = () => (
  <Stack height="100%" alignItems="center" justifyContent="center">
    <div className="w-[100px] h-[100px] mb-[20px]">
      <img
        src="https://img.icons8.com/fluency/200/nothing-found.png"
        alt="No data"
        className="w-full h-full object-contain filter grayscale opacity-60"
      />
    </div>
    <Typography variant="body1" sx={{ fontSize: "1.5rem", fontWeight: 500, color: "text.secondary" }}>
      Không tìm thấy đặt lịch nào
    </Typography>
  </Stack>
);

export const BookingList = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<BookingStatusFilter>("ALL");
  const [keyword, setKeyword] = useState("");

  const filteredRows = useMemo(() => {
    let list = MOCK_BOOKINGS;
    if (status !== "ALL") {
      list = list.filter((b) => b.status === status);
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(k) ||
          b.customerName.toLowerCase().includes(k) ||
          (b.customerPhone && b.customerPhone.toLowerCase().includes(k))
      );
    }
    return list;
  }, [status, keyword]);

  const pendingCount = useMemo(
    () => MOCK_BOOKINGS.filter((b) => b.status === "PENDING").length,
    []
  );

  const columns = useMemo(
    () =>
      getBookingColumns((row) => navigate(`/${prefixAdmin}/booking/detail/${row.id}`)),
    [navigate]
  );

  const localeText = useDataGridLocale();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setStatus(newValue as BookingStatusFilter);
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          ...dataGridCardStyles,
          background: "white",
          border: "1px solid rgba(145, 158, 171, 0.2)",
          boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
          borderRadius: "24px",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={status}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 2,
            pt: 0.5,
            borderBottom: "1px solid rgba(145, 158, 171, 0.1)",
            "& .MuiTab-root": {
              fontSize: "1.3rem",
              fontWeight: 700,
              textTransform: "none",
              minWidth: 70,
              py: 1.5,
              color: "#637381",
              "&.Mui-selected": { color: "#1C252E" },
            },
            "& .MuiTabs-indicator": { height: 3, bgcolor: "#1C252E" },
          }}
        >
          {BOOKING_STATUS_OPTIONS.map((opt) => (
            <Tab
              key={opt.value}
              value={opt.value}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  {opt.label}
                  {opt.value === "PENDING" && pendingCount > 0 && (
                    <Badge
                      badgeContent={pendingCount}
                      color="error"
                      sx={{
                        ml: 1.5,
                        "& .MuiBadge-badge": {
                          fontSize: "1rem",
                          height: 18,
                          minWidth: 18,
                          position: "static",
                          transform: "none",
                        },
                      }}
                    />
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ p: 2, alignItems: { md: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1C252E", fontSize: "1.6rem" }}>
              {status === "ALL" ? "Tất cả đặt lịch" : BOOKING_STATUS_OPTIONS.find((o) => o.value === status)?.label}
              <Box component="span" sx={{ ml: 1, color: "text.secondary", fontWeight: 500 }}>
                ({filteredRows.length})
              </Box>
            </Typography>
          </Stack>

          <TextField
            size="small"
            placeholder="Tìm mã đơn, tên khách, SĐT..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{
              width: { xs: "100%", md: 280 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "#F4F6F8",
                "& fieldset": { border: "none" },
                "&:hover fieldset": { border: "none" },
                "&.Mui-focused fieldset": { border: "1px solid #1C252E" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: "1.8rem" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <div style={{ ...dataGridContainerStyles, padding: "0 16px 16px", minWidth: 0 }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            localeText={localeText}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
            showCellVerticalBorder={false}
            showColumnVerticalBorder={false}
            density="compact"
            sx={{
              ...dataGridStyles,
              border: "none",
              "& .MuiDataGrid-columnHeader": {
                bgcolor: "#F4F6F8",
                color: "#637381",
                fontWeight: 700,
                fontSize: "1.45rem",
                alignItems: "center",
                justifyContent: "center",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px dashed rgba(145, 158, 171, 0.2)",
                fontSize: "1.45rem",
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
              },
            }}
            slots={{
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            autoHeight
          />
        </div>
      </Card>
    </>
  );
};
