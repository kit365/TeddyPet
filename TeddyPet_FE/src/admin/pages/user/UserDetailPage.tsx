import { Tab, Tabs, Box, Typography, Paper } from "@mui/material";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { BillingIcon, GeneralIcon } from "../../assets/icons";
import { useState } from "react";

const tabs = [
    {
        label: "Tổng quan",
        icon: <GeneralIcon />,
        key: "general",
    },
    {
        label: "Hóa đơn",
        icon: <BillingIcon />,
        key: "billing",
    },
];

const GeneralTab = () => {
    return (
        <Box component="form" sx={{ display: "flex", gap: "24px" }} noValidate autoComplete="off">
            <div className="w-[357px] pt-[80px] pb-[40px] px-[24px]">
                dsa
            </div>
            <div className="flex-1">dsa</div>
        </Box>
    );
};

// =====================
// Tab 2 – Hóa đơn
// =====================
const BillingTab = () => {
    return (
        <Paper sx={{ p: 3, borderRadius: "12px" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Lịch sử hóa đơn
            </Typography>

            {/* Demo list */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[1, 2, 3].map((item) => (
                    <Box
                        key={item}
                        sx={{
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                                Hóa đơn #{item}
                            </Typography>
                            <Typography sx={{ fontSize: "0.8125rem", color: "#637381" }}>
                                12/01/2026
                            </Typography>
                        </Box>

                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                            1.250.000 đ
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

// =====================
// Main Page
// =====================
export const UserDetailPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <>
            <ListHeader
                title="Người dùng"
                breadcrumbItems={[
                    { label: "Dashboard", to: "/" },
                    { label: "Người dùng", to: `/${prefixAdmin}/user/list` },
                    { label: "Tài khoản" },
                ]}
                addButtonLabel="Tạo tài khoản"
                addButtonPath={`/${prefixAdmin}/user/create`}
            />

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={handleChange}
                sx={{
                    mb: "40px",
                    minHeight: "48px",

                    "& .MuiTabs-flexContainer": {
                        gap: "40px",
                    },

                    "& .MuiTabs-indicator": {
                        backgroundColor: "#1C252E",
                        height: "3px",
                        borderRadius: "2px",
                    },
                }}
                variant="scrollable"
                scrollButtons={false}
            >
                {tabs.map((tab) => (
                    <Tab
                        key={tab.key}
                        disableRipple
                        label={tab.label}
                        icon={tab.icon}
                        iconPosition="start"
                        sx={{
                            padding: "9px 0px",
                            fontSize: "0.8125rem",
                            minWidth: "48px",
                            minHeight: "auto",
                            textTransform: "none",
                            fontWeight: 600,

                            color: "#637381",

                            "& .MuiTab-iconWrapper": {
                                color: "#637381",
                            },

                            "&.Mui-selected": {
                                color: "#1C252E",
                            },

                            "&.Mui-selected .MuiTab-iconWrapper": {
                                color: "#1C252E",
                            },

                            "&:hover": {
                                color: "#1C252E",
                            },
                        }}
                    />
                ))}
            </Tabs>

            {/* Nội dung theo tab */}
            <Box>
                {activeTab === 0 && <GeneralTab />}
                {activeTab === 1 && <BillingTab />}
            </Box>
        </>
    );
};
