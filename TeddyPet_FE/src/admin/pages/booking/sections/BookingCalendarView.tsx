import React, { useRef, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import ViewAgenda from "@mui/icons-material/ViewAgenda";
import ViewDay from "@mui/icons-material/ViewDay";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import ViewWeek from "@mui/icons-material/ViewWeek";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import FilterList from "@mui/icons-material/FilterList";
import { DeleteIcon } from "../../../assets/icons";
import { CalendarFiltersDrawer } from "../../calendar/sections/CalendarFiltersDrawer";
import {
  Badge,
  Box,
  Card,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { prefixAdmin } from "../../../constants/routes";
import { getAdminBookings } from "../../../api/booking.api";
import { useQuery } from "@tanstack/react-query";

dayjs.locale("vi");

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#B76E00",
  CONFIRMED: "#006C9C",
  IN_PROGRESS: "#229A16",
  COMPLETED: "#05A845",
  CANCELLED: "#B71D18",
};

export const BookingCalendarView = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const navigate = useNavigate();
  const [view, setView] = useState("dayGridMonth");
  const [date, setDate] = useState(new Date());
  const [openFilters, setOpenFilters] = useState(false);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState<Dayjs | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Dayjs | null>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: getAdminBookings,
    select: (res) => {
      const list = res?.data;
      if (!Array.isArray(list)) return [];
      return list.map((b: Record<string, unknown>) => ({
        id: String(b.id ?? ""),
        bookingCode: String(b.bookingCode ?? ""),
        customerName: String(b.customerName ?? ""),
        status: String(b.status ?? ""),
        bookingStartDate: b.bookingStartDate != null ? String(b.bookingStartDate) : "",
        bookingEndDate: b.bookingEndDate != null ? String(b.bookingEndDate) : undefined,
      }));
    },
  });

  const allEvents = useMemo(() => {
    return bookings.map((b) => {
      const statusColor = STATUS_COLORS[b.status] ?? "#637381";
      const start = b.bookingStartDate || null;
      const end = b.bookingEndDate || start;
      return {
        id: b.id,
        title: `${b.bookingCode} - ${b.customerName}`,
        start: start ?? undefined,
        end: end ?? undefined,
        color: statusColor,
        textColor: "#fff",
        backgroundColor: statusColor,
      };
    });
  }, [bookings]);

  const events = useMemo(() => {
    if (!startDateFilter && !endDateFilter) return allEvents;
    return allEvents.filter((e) => {
      const d = dayjs(e.start);
      if (startDateFilter && d.isBefore(startDateFilter, "day")) return false;
      if (endDateFilter && d.isAfter(endDateFilter, "day")) return false;
      return true;
    });
  }, [allEvents, startDateFilter, endDateFilter]);

  useEffect(() => {
    if (startDateFilter && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(startDateFilter.toDate());
    }
  }, [startDateFilter]);

  const handleClearDateFilter = () => {
    setStartDateFilter(null);
    setEndDateFilter(null);
  };

  const handleOpenFilters = () => setOpenFilters(true);
  const handleCloseFilters = () => setOpenFilters(false);
  const handleOpenEventDialog = () => setOpenEventDialog(true);
  const handleCloseEventDialog = () => setOpenEventDialog(false);
  const handleSaveEvent = (event: any) => {
    console.log("New event:", event);
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: string | null
  ) => {
    if (newView !== null) {
      setView(newView);
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) calendarApi.changeView(newView);
    }
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  };

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    navigate(`/${prefixAdmin}/booking/detail/${info.event.id}`);
  };

  const handleDatesSet = (arg: { view: { currentStart: Date } }) => {
    setDate(arg.view.currentStart);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "1.6rem", color: "#1C252E", mr: 1 }}>
          Lịch
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "1.3rem", color: "#637381" }}>
          <Box component="span" sx={{ color: "#1C252E", fontWeight: 600 }}>
            {events.length}
          </Box>{" "}
          kết quả tìm thấy
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <DatePicker
            label="Ngày bắt đầu"
            value={startDateFilter}
            onChange={(v) => setStartDateFilter(v)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  minWidth: 160,
                  "& .MuiInputBase-input": { fontSize: "1.35rem" },
                  "& .MuiInputLabel-root": { fontSize: "1.35rem" },
                },
              },
              popper: {
                sx: {
                  "& .MuiPaper-root": {
                    minWidth: 340,
                    minHeight: 380,
                    padding: "16px",
                  },
                  "& .MuiPickersDay-root": {
                    fontSize: "1.6rem",
                    width: 42,
                    height: 42,
                  },
                  "& .MuiDayCalendar-weekDayLabel": {
                    fontSize: "1.5rem",
                  },
                  "& .MuiPickersCalendarHeader-label": {
                    fontSize: "1.8rem",
                    fontWeight: 600,
                  },
                  "& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root": {
                    fontSize: 28,
                  },
                },
              },
            }}
          />
          <DatePicker
            label="Ngày kết thúc"
            value={endDateFilter}
            onChange={(v) => setEndDateFilter(v)}
            format="DD/MM/YYYY"
            minDate={startDateFilter ?? undefined}
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  minWidth: 160,
                  "& .MuiInputBase-input": { fontSize: "1.35rem" },
                  "& .MuiInputLabel-root": { fontSize: "1.35rem" },
                },
              },
              popper: {
                sx: {
                  "& .MuiPaper-root": {
                    minWidth: 340,
                    minHeight: 380,
                    padding: "16px",
                  },
                  "& .MuiPickersDay-root": {
                    fontSize: "1.6rem",
                    width: 42,
                    height: 42,
                  },
                  "& .MuiDayCalendar-weekDayLabel": {
                    fontSize: "1.5rem",
                  },
                  "& .MuiPickersCalendarHeader-label": {
                    fontSize: "1.8rem",
                    fontWeight: 600,
                  },
                  "& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root": {
                    fontSize: 28,
                  },
                },
              },
            }}
          />
          <Button
            startIcon={<DeleteIcon style={{ marginRight: 0 }} sx={{ fontSize: 16 }} />}
            size="small"
            onClick={handleClearDateFilter}
            sx={{
              color: "#FF5630",
              fontWeight: 600,
              fontSize: "1.3rem",
              textTransform: "none",
              py: 0.5,
              minHeight: "auto",
              "&:hover": { bgcolor: "rgba(255, 86, 48, 0.08)" },
            }}
          >
            Xoá
          </Button>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleOpenEventDialog}
          size="small"
          sx={{
            background: "#1C252E",
            minHeight: "32px",
            fontWeight: 600,
            fontSize: "1.3rem",
            borderRadius: "8px",
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { background: "#454F5B", boxShadow: "none" },
          }}
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
        >
          Thêm sự kiện
        </Button>
      </Box>

      <Card
        elevation={0}
        sx={{
          bgcolor: "white",
          backgroundImage: "none",
          borderRadius: "16px",
          boxShadow: "0 0 2px 0 #919eab33, 0 12px 24px -4px #919eab1f",
          color: "#1C252E",
          width: "100%",
          maxWidth: "100%",
          "& .fc": {
            flex: "1 1 auto",
            marginLeft: "-1px",
            marginBottom: "-1px",
            width: "calc(100% + 2px)",
            fontSize: "1.6rem",
            "--fc-border-color": "rgba(145, 158, 171, 0.2)",
            "--fc-page-bg-color": "#fff",
            "--fc-neutral-bg-color": "#F4F6F8",
            "--fc-neutral-text-color": "#637381",
            "--fc-button-text-color": "#fff",
            "--fc-button-bg-color": "#00A76F",
            "--fc-button-border-color": "#00A76F",
            "--fc-button-hover-bg-color": "#007B55",
            "--fc-button-hover-border-color": "#007B55",
            "--fc-button-active-bg-color": "#005249",
            "--fc-button-active-border-color": "#005249",
            "--fc-event-bg-color": "#00A76F",
            "--fc-event-border-color": "#00A76F",
            "--fc-event-text-color": "#fff",
            "--fc-event-selected-overlay-color": "rgba(0, 0, 0, 0.25)",
            "--fc-more-link-bg-color": "rgba(145, 158, 171, 0.12)",
            "--fc-more-link-text-color": "#1C252E",
            "--fc-non-business-color": "rgba(145, 158, 171, 0.08)",
            "--fc-highlight-color": "rgba(0, 167, 111, 0.08)",
            "--fc-today-bg-color": "rgba(255, 171, 0, 0.08)",
            "--fc-now-indicator-color": "#FF5630",
            "--fc-daygrid-event-dot-width": "8px",
            "--fc-list-event-dot-width": "10px",
            "--fc-list-event-hover-bg-color": "rgba(145, 158, 171, 0.08)",
          },
          "& .fc-theme-standard .fc-scrollgrid": { border: "none" },
          "& .fc table": { width: "100% !important" },
          "& .fc-view-harness": {
            height: "calc(100vh - 300px)",
            minHeight: "480px",
            overflowY: "auto",
          },
          "& .fc .fc-scrollgrid": { border: "none" },
          "& .fc .fc-daygrid-body": { height: "auto !important" },
          "& .fc .fc-scrollgrid-sync-table": { height: "auto !important" },
          "& .fc .fc-col-header": {
            borderTop: "1px solid var(--fc-border-color)",
            position: "sticky",
            top: 0,
            zIndex: 3,
            backgroundColor: "#fff",
          },
          "& .fc .fc-col-header-cell": {
            height: "44px",
            padding: "0",
            borderLeft: "none",
            borderRight: "none",
            verticalAlign: "middle",
            "& .fc-col-header-cell-cushion": {
              fontWeight: 700,
              fontSize: "1.6rem",
              color: "#1C252E",
              textTransform: "capitalize",
              textDecoration: "none !important",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            },
          },
          "& .fc .fc-timegrid-axis": { verticalAlign: "middle !important" },
          "& .fc .fc-timegrid-axis-cushion": {
            color: "#637381",
            fontSize: "1.4rem",
            fontWeight: 400,
            textDecoration: "none !important",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          "& .fc .fc-timegrid-slot-label-cushion": {
            color: "#637381",
            fontSize: "1.4rem",
            fontWeight: 400,
            textAlign: "right",
            paddingRight: "8px",
          },
          "& .fc .fc-daygrid-day": {
            "&.fc-day-today": {
              "& .fc-daygrid-day-number": {
                bgcolor: "#FF5630",
                color: "#fff",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "4px",
              },
            },
          },
          "& .fc .fc-daygrid-day-number": {
            fontSize: "1.4rem",
            fontWeight: 500,
            padding: "4px 8px",
            color: "#637381",
            textDecoration: "none !important",
          },
          "& .fc .fc-day-has-event .fc-daygrid-day-number": {
            color: "#1C252E",
          },
          "& .fc .fc-daygrid-event": {
            borderRadius: "6px",
            padding: 0,
            border: "none !important",
            marginLeft: "4px",
            marginRight: "4px",
            marginBottom: "4px",
            marginTop: 0,
            overflow: "hidden",
            minWidth: 0,
            cursor: "pointer",
          },
          "& .fc .fc-daygrid-event-dot": { display: "none" },
          "& .fc .fc-event-main": {
            padding: "4px 8px",
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            minWidth: 0,
            maxWidth: "100%",
          },
          "& .fc .fc-event-time": {
            fontSize: "1.5rem",
            fontWeight: 700,
            flexShrink: 0,
            whiteSpace: "nowrap",
          },
          "& .fc .fc-event-title": {
            fontSize: "1.5rem",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          },
          "& .fc .fc-event-title *": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "& .fc .fc-list": { border: "none" },
          "& .fc .fc-list-event": {
            "&:hover td": { bgcolor: "rgba(145, 158, 171, 0.08)" },
            cursor: "pointer",
          },
          "& .fc .fc-list-event-time": {
            fontSize: "1.4rem",
            color: "#637381",
            fontWeight: 400,
          },
          "& .fc .fc-list-event-title": {
            fontSize: "1.4rem",
            fontWeight: 400,
          },
          "& .fc .fc-list-day-cushion": {
            fontSize: "1.4rem",
            fontWeight: 600,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(145, 158, 171, 0.12)" }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            aria-label="calendar view"
            sx={{
              gap: "4px",
              p: 0.5,
              border: "1px solid #919eab29",
              borderRadius: "10px",
              "& .MuiToggleButton-root": {
                border: "none !important",
                borderRadius: "8px !important",
                p: "4px !important",
                "&.Mui-selected": {
                  bgcolor: "rgba(28, 37, 46, 0.08)",
                  color: "#1C252E",
                  "&:hover": { bgcolor: "rgba(28, 37, 46, 0.16)" },
                },
              },
            }}
          >
            <Tooltip title="Tháng" placement="bottom">
              <ToggleButton value="dayGridMonth" aria-label="Month view">
                <CalendarMonth sx={{ fontSize: 20 }} />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Tuần" placement="bottom">
              <ToggleButton value="timeGridWeek" aria-label="Week view">
                <ViewWeek sx={{ fontSize: 20 }} />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Ngày" placement="bottom">
              <ToggleButton value="timeGridDay" aria-label="Day view">
                <ViewDay sx={{ fontSize: 20 }} />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Chương trình" placement="bottom">
              <ToggleButton value="listWeek" aria-label="Agenda view">
                <ViewAgenda sx={{ fontSize: 20 }} />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconButton size="medium" onClick={handlePrev}>
              <ChevronLeft sx={{ fontSize: 20, color: "#637381" }} />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: "1.7rem", minWidth: "160px", textAlign: "center", color: "#1C252E" }}
            >
              {capitalizeFirstLetter(dayjs(date).format("MMMM YYYY"))}
            </Typography>
            <IconButton size="medium" onClick={handleNext}>
              <ChevronRight sx={{ fontSize: 20, color: "#637381" }} />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleToday}
              sx={{
                bgcolor: "#FF5630",
                borderRadius: "8px",
                minHeight: "30px",
                minWidth: "64px",
                fontSize: "1.2rem",
                textTransform: "none",
                fontWeight: 700,
                padding: "4px 8px",
                "&:hover": { bgcolor: "#B71D18" },
              }}
            >
              Today
            </Button>
            <IconButton size="medium" onClick={handleOpenFilters}>
              <Badge variant="dot" sx={{ "& .MuiBadge-badge": { bgcolor: "#FF5630" } }} invisible={false}>
                <FilterList sx={{ color: "#637381" }} />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={view}
          locale="vi"
          initialDate="2025-02-10"
          events={events}
          headerToolbar={false}
          height="auto"
          dayMaxEventRows={5}
          eventDisplay="block"
          allDayText="Cả ngày"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          dayCellClassNames={(arg) => {
            const cellDateStr = dayjs(arg.date).format("YYYY-MM-DD");
            const hasEvent = events.some((e) => dayjs(e.start).format("YYYY-MM-DD") === cellDateStr);
            return hasEvent ? ["fc-day-has-event"] : [];
          }}
          displayEventEnd={true}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
        />
      </Card>

      <CalendarFiltersDrawer
        open={openFilters}
        onClose={handleCloseFilters}
        events={events}
      />
    </LocalizationProvider>
  );
};
