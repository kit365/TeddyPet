import { Tabs, Tab, Box, Typography, Paper, Avatar, Chip, CircularProgress, Stack } from "@mui/material";
import { ListHeader } from "../../components/ui/ListHeader";
import { prefixAdmin } from "../../constants/routes";
import { BillingIcon, GeneralIcon } from "../../assets/icons";
import { useParams } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { useUsers } from "./hooks/useUser";
import type { IUserProfile, UserStatusEnum } from "../../api/user.api";
import { searchOrders } from "../../api/order.api";
import type { OrderResponse } from "../../../types/order.type";
import { ORDER_STATUS_MAP } from "../../../constants/status";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { NavLink } from "react-router-dom";

const STATUS_LABELS: Record<UserStatusEnum, string> = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Không hoạt động",
    LOCKED: "Khóa",
    PENDING_VERIFICATION: "Chờ xác thực",
};

const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const StatusChip = ({ status }: { status: UserStatusEnum }) => {
    const styles = (() => {
        switch (status) {
            case "ACTIVE":
                return { bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E", border: "rgba(34, 197, 94, 0.35)" };
            case "INACTIVE":
                return { bg: "rgba(239, 68, 68, 0.12)", color: "#EF4444", border: "rgba(239, 68, 68, 0.35)" };
            case "LOCKED":
                return { bg: "rgba(255, 86, 48, 0.12)", color: "#FF5630", border: "rgba(255, 86, 48, 0.35)" };
            case "PENDING_VERIFICATION":
                return { bg: "rgba(255, 171, 0, 0.12)", color: "#FFAB00", border: "rgba(255, 171, 0, 0.35)" };
            default:
                return { bg: "rgba(145, 158, 171, 0.12)", color: "#919EAB", border: "rgba(145, 158, 171, 0.35)" };
        }
    })();

    return (
        <Chip
            size="small"
            label={STATUS_LABELS[status] ?? status}
            sx={{
                bgcolor: styles.bg,
                color: styles.color,
                border: `1px solid ${styles.border}`,
                fontWeight: 800,
            }}
        />
    );
};

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

// =====================
// Main Page
// =====================
export const UserDetailPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const { id } = useParams<{ id: string }>();

    // Chọn role mặc định = USER để giảm payload (đúng với bảng UserList hiện tại)
    const { data: users = [], isLoading: isUsersLoading, isError: isUsersError } = useUsers("USER");
    const user: IUserProfile | undefined = useMemo(() => users.find((u) => u.id === id), [users, id]);

    const fullName = useMemo(() => {
        if (!user) return "";
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        return name || user.username;
    }, [user]);

    // Billing state (tab 2)
    const [billingRows, setBillingRows] = useState<OrderResponse[]>([]);
    const [billingLoading, setBillingLoading] = useState(false);
    const [billingTotal, setBillingTotal] = useState(0);
    const [billingPage, setBillingPage] = useState(0);
    const [billingPageSize, setBillingPageSize] = useState(5);

    const billingKeyword = useMemo(() => {
        if (!user) return "";
        return (user.phoneNumber ?? "").trim() || fullName.trim() || "";
    }, [user, fullName]);

    const billingColumns: GridColDef<OrderResponse>[] = useMemo(
        () => [
            {
                field: "orderCode",
                headerName: "Mã đơn",
                width: 140,
                renderCell: (params) => (
                    <Typography
                        component={NavLink}
                        to={`/${prefixAdmin}/order/detail/${params.row.id}`}
                        sx={{
                            fontWeight: 900,
                            color: "#3F51B5",
                            textDecoration: "none",
                            fontSize: "0.8125rem",
                            letterSpacing: "0.3px",
                            "&:hover": { textDecoration: "underline" },
                        }}
                    >
                        #{params.value}
                    </Typography>
                ),
            },
            {
                field: "createdAt",
                headerName: "Ngày đặt",
                width: 160,
                renderCell: (params) => (
                    <Typography sx={{ fontSize: "0.75rem", color: "#637381", fontWeight: 700 }}>
                        {formatDateTime(params.value as string)}
                    </Typography>
                ),
            },
            {
                field: "status",
                headerName: "Trạng thái",
                width: 160,
                renderCell: (params) => {
                    const status = String(params.value ?? "");
                    const mapped = ORDER_STATUS_MAP[status];
                    if (!mapped) return <Typography sx={{ fontWeight: 800, fontSize: "0.75rem" }}>{status || "—"}</Typography>;
                    return (
                        <Box
                            sx={{
                                px: 1.2,
                                py: 0.5,
                                borderRadius: "6px",
                                bgcolor: mapped.bgColor,
                                border: `1px solid ${mapped.color}33`,
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <Typography sx={{ fontWeight: 900, fontSize: "0.75rem", color: mapped.color }}>
                                {mapped.label}
                            </Typography>
                        </Box>
                    );
                },
            },
            {
                field: "finalAmount",
                headerName: "Tổng tiền",
                width: 140,
                align: "right",
                headerAlign: "right",
                renderCell: (params) => (
                    <Typography sx={{ fontWeight: 900, fontSize: "0.8rem", color: "#1C252E" }}>
                        {(params.value as number)?.toLocaleString("vi-VN")}₫
                    </Typography>
                ),
            },
        ],
        []
    );

    useEffect(() => {
        // Only load billing data when user is available and tab is active
        if (activeTab !== 1) return;
        if (!user) return;
        if (!billingKeyword) {
            setBillingRows([]);
            setBillingTotal(0);
            return;
        }

        let cancelled = false;
        const run = async () => {
            setBillingLoading(true);
            try {
                const res = await searchOrders({
                    keyword: billingKeyword,
                    page: billingPage,
                    size: billingPageSize,
                    sortKey: "createdAt",
                    sortDirection: "DESC",
                });

                if (cancelled) return;
                setBillingRows(res?.data?.content ?? []);
                setBillingTotal(res?.data?.totalElements ?? 0);
            } catch (e) {
                if (cancelled) return;
                setBillingRows([]);
                setBillingTotal(0);
            } finally {
                if (!cancelled) setBillingLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [activeTab, user, billingKeyword, billingPage, billingPageSize]);

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
                {activeTab === 0 && (
                    <Paper sx={{ p: 3, borderRadius: "12px" }}>
                        {isUsersLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : isUsersError ? (
                            <Typography sx={{ fontWeight: 800, color: "#B71D18" }}>
                                Không tải được dữ liệu người dùng.
                            </Typography>
                        ) : !user ? (
                            <Typography sx={{ fontWeight: 800, color: "#637381" }}>
                                Không tìm thấy người dùng với id: {id}
                            </Typography>
                        ) : (
                            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexWrap: "wrap" }}>
                                <Stack spacing={2} sx={{ minWidth: 260 }}>
                                    <Avatar
                                        src={user.avatarUrl ?? undefined}
                                        alt={fullName}
                                        sx={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: "14px",
                                            bgcolor: "#F4F6F8",
                                            fontSize: "1rem",
                                            fontWeight: 900,
                                            color: "#637381",
                                        }}
                                    >
                                        {fullName?.charAt(0)?.toUpperCase() ?? "U"}
                                    </Avatar>

                                    <Box>
                                        <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", color: "#1C252E" }}>
                                            {fullName}
                                        </Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#637381" }}>
                                            {user.email}
                                        </Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#637381" }}>
                                            {user.phoneNumber ?? "—"}
                                        </Typography>
                                    </Box>

                                    <StatusChip status={user.status} />

                                    <Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#637381" }}>
                                            Vai trò
                                        </Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: "0.9rem", color: "#1C252E" }}>
                                            {user.role}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Box sx={{ flex: 1, minWidth: 320 }}>
                                    <Stack spacing={1.5}>
                                        <Typography sx={{ fontWeight: 900, color: "#1C252E" }}>Thông tin chi tiết</Typography>
                                        <Stack direction="row" spacing={3} flexWrap="wrap">
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#637381" }}>
                                                    Giới tính
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#1C252E" }}>
                                                    {user.gender ?? "—"}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#637381" }}>
                                                    Ngày sinh
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#1C252E" }}>
                                                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN") : "—"}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#637381" }}>
                                                    Trạng thái cần đổi mật khẩu
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#1C252E" }}>
                                                    {user.mustChangePassword ? "Có" : "Không"}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack direction="row" spacing={3} flexWrap="wrap">
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#637381" }}>
                                                    Tạo lúc
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#1C252E" }}>
                                                    {formatDateTime((user as any).createdAt ?? null)}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#637381" }}>
                                                    ID
                                                </Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#1C252E" }}>
                                                    {user.id}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                )}

                {activeTab === 1 && (
                    <Paper sx={{ p: 3, borderRadius: "12px" }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                            Lịch sử hóa đơn
                        </Typography>

                        {!user ? (
                            <Typography sx={{ fontWeight: 800, color: "#637381" }}>Vui lòng chọn user hợp lệ.</Typography>
                        ) : !billingKeyword ? (
                            <Typography sx={{ fontWeight: 800, color: "#637381" }}>
                                Không có `phoneNumber` hoặc tên để tìm đơn hàng.
                            </Typography>
                        ) : (
                            <div style={{ width: "100%" }}>
                                <DataGrid
                                    rows={billingRows}
                                    columns={billingColumns}
                                    density="comfortable"
                                    autoHeight
                                    disableRowSelectionOnClick
                                    paginationMode="server"
                                    pageSizeOptions={[5, 10, 20]}
                                    rowCount={billingTotal}
                                    paginationModel={{ page: billingPage, pageSize: billingPageSize }}
                                    onPaginationModelChange={(m) => {
                                        setBillingPage(m.page);
                                        setBillingPageSize(m.pageSize);
                                    }}
                                    loading={billingLoading}
                                />
                            </div>
                        )}
                    </Paper>
                )}
            </Box>
        </>
    );
};
