import { useState } from "react";
import { ListHeader } from "../../components/ui/ListHeader";
import { BookingList } from "./sections/BookingList";
import { BookingCalendarView } from "./sections/BookingCalendarView";
import { prefixAdmin } from "../../constants/routes";
import { useTranslation } from "react-i18next";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import ListIcon from "@mui/icons-material/List";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

type MainTab = "list" | "calendar";

export const BookingListPage = () => {
    const { t } = useTranslation();
    const [mainTab, setMainTab] = useState<MainTab>("list");

    const handleMainTabChange = (_: React.SyntheticEvent, newValue: MainTab) => {
        setMainTab(newValue);
    };

    return (
        <div className={`flex flex-col ${mainTab === "calendar" ? "gap-3" : "gap-8"}`}>
            <ListHeader
                title="Quản lý đặt lịch"
                breadcrumbItems={[
                    { label: t("admin.dashboard"), to: `/${prefixAdmin}` },
                    { label: "Đặt lịch", to: `/${prefixAdmin}/booking/list` },
                    { label: t("admin.common.list") },
                ]}
            />
            <Box sx={{ mb: mainTab === "calendar" ? 1 : 2 }}>
                <Tabs
                    value={mainTab}
                    onChange={handleMainTabChange}
                    sx={{
                        mb: 0,
                        "& .MuiTab-root": {
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            textTransform: "none",
                            minHeight: 48,
                            color: "#637381",
                            "&.Mui-selected": { color: "#1C252E" },
                        },
                        "& .MuiTabs-indicator": { height: 3, bgcolor: "#1C252E" },
                    }}
                >
                    <Tab value="list" label="Danh sách" icon={<ListIcon sx={{ fontSize: 22 }} />} iconPosition="start" />
                    <Tab value="calendar" label="Lịch" icon={<CalendarMonthIcon sx={{ fontSize: 22 }} />} iconPosition="start" />
                </Tabs>
            </Box>
            {mainTab === "list" && <BookingList />}
            {mainTab === "calendar" && <BookingCalendarView />}
        </div>
    );
};
