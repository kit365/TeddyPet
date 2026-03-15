import { prefixAdmin } from "./routes";
import DataExplorationIcon from '@mui/icons-material/DataExploration';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import ExtensionIcon from '@mui/icons-material/Extension';
import ArticleIcon from '@mui/icons-material/Article';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DiscountIcon from '@mui/icons-material/Discount';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BadgeIcon from '@mui/icons-material/Badge';
import ForumIcon from '@mui/icons-material/Forum';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CreditScoreIcon from '@mui/icons-material/CreditScore';

export const menuOverviewData = [
    {
        id: "system",
        Icon: CreditScoreIcon,
        label: "Tổng quan",
        path: `/${prefixAdmin}/dashboard/system`,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
        id: "analytics",
        Icon: DataExplorationIcon,
        label: "Phân tích",
        path: `/${prefixAdmin}/dashboard/analytics`,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
        id: "staff-dashboard",
        Icon: BadgeIcon,
        label: "Bảng điều khiển",
        path: `/${prefixAdmin}/staff/dashboard`,
        allowedRoles: ["STAFF", "SUPER_ADMIN"],
    },
    {
        id: "booking",
        Icon: ScheduleSendIcon,
        label: "Đặt lịch",
        path: `/${prefixAdmin}/dashboard/booking`,
        allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
    },
];

/** Menu item for booking management (list/detail) - can be added under a parent or as link from dashboard. */
export const bookingManagementItem = {
    id: "bookings",
    label: "Đặt lịch",
    Icon: ScheduleSendIcon,
    allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
    children: [
        {
            id: "list",
            label: "Danh sách đặt lịch",
            path: `/${prefixAdmin}/booking/list`,
            allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
        },
        {
            id: "refund-policies",
            label: "Chính sách hoàn tiền đặt lịch",
            path: `/${prefixAdmin}/booking/refund-policies`,
            allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        },
    ],
};

export const menuManagementData = [
    {
        id: "orders",
        label: "Đơn hàng",
        Icon: ArticleIcon,
        allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
        children: [
            {
                id: "list",
                label: "Danh sách đơn hàng",
                path: `/${prefixAdmin}/order/list`,
                allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
            },
            {
                id: "manual",
                label: "Tạo đơn tại quầy",
                tKey: "admin.order.manual_order",
                path: `/${prefixAdmin}/order/manual`,
                allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
            },
        ]
    },
    {
        id: "bookings",
        label: "Đặt lịch",
        Icon: ScheduleSendIcon,
        allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
        children: [
            {
                id: "list",
                label: "Danh sách đặt lịch",
                path: `/${prefixAdmin}/booking/list`,
                allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
            },
            {
                id: "refund-policies",
                label: "Chính sách hoàn tiền đặt lịch",
                path: `/${prefixAdmin}/booking/refund-policies`,
                allowedRoles: ["ADMIN", "SUPER_ADMIN"],
            },
        ]
    },
    {
        id: "users",
        label: "Tài khoản",
        Icon: PersonIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            {
                id: "list",
                label: "Danh sách người dùng",
                path: `/${prefixAdmin}/user/list`,
                allowedRoles: ["ADMIN", "SUPER_ADMIN"],
            },
        ]
    },
    {
        id: "feedbacks",
        label: "Đánh giá",
        Icon: ForumIcon,
        allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
        children: [
            { id: "list", label: "Danh sách đánh giá", path: `/${prefixAdmin}/feedback/list`, allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "products",
        label: "Sản phẩm",
        tKey: "admin.sidebar.products",
        Icon: ExtensionIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "list", label: "Danh sách", tKey: "admin.sidebar.list", path: `/${prefixAdmin}/product/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "brand", label: "Thương hiệu", tKey: "admin.sidebar.brand", path: `/${prefixAdmin}/brand/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "category", label: "Danh mục", tKey: "admin.sidebar.category", path: `/${prefixAdmin}/product-category/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "attribute", label: "Thuộc tính", tKey: "admin.sidebar.attribute", path: `/${prefixAdmin}/product/attribute/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "create", label: "Tạo sản phẩm", tKey: "admin.sidebar.product_create", path: `/${prefixAdmin}/product/create`, hidden: true, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "edit", label: "Sửa sản phẩm", tKey: "admin.sidebar.product_edit", path: `/${prefixAdmin}/product/edit`, hidden: true, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "category-create", label: "Tạo danh mục sản phẩm", tKey: "admin.sidebar.category_create", path: `/${prefixAdmin}/product-category/create`, hidden: true, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "brand-create", label: "Tạo thương hiệu", tKey: "admin.sidebar.brand_create", path: `/${prefixAdmin}/brand/create`, hidden: true, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "tags", label: "Tags", tKey: "admin.sidebar.tags", path: `/${prefixAdmin}/product/list?modal=product-tags`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "age-ranges", label: "Độ tuổi", tKey: "admin.sidebar.age-ranges", path: `/${prefixAdmin}/product/list?modal=product-age-ranges`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "blogs",
        label: "Bài viết",
        tKey: "admin.sidebar.blogs",
        Icon: ArticleIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "create", label: "Tạo bài viết", tKey: "admin.sidebar.blog_create", path: `/${prefixAdmin}/blog/create`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "list", label: "Danh sách bài viết", tKey: "admin.sidebar.blog_list", path: `/${prefixAdmin}/blog/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "category", label: "Danh mục bài viết", tKey: "admin.sidebar.blog_category", path: `/${prefixAdmin}/blog-category/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "tags", label: "Tags", tKey: "admin.sidebar.tags", path: `/${prefixAdmin}/blog/list?modal=tags`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "category-create", label: "Tạo danh mục bài viết", tKey: "admin.sidebar.blog_category_create", path: `/${prefixAdmin}/blog-category/create`, hidden: true, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "roles",
        label: "Nhóm quyền",
        tKey: "admin.sidebar.roles",
        Icon: ManageAccountsIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "create", label: "Tạo nhóm quyền", tKey: "admin.sidebar.role_create", path: `/${prefixAdmin}/role/create`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "list", label: "Danh sách nhóm quyền", tKey: "admin.sidebar.role_list", path: `/${prefixAdmin}/role/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "coupons",
        label: "Mã giảm giá",
        tKey: "admin.sidebar.coupons",
        Icon: DiscountIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "create", label: "Tạo mã giảm giá", tKey: "admin.sidebar.coupon_create", path: `/${prefixAdmin}/role/create`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "list", label: "Danh sách mã giảm giá", tKey: "admin.sidebar.coupon_list", path: `/${prefixAdmin}/role/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "shipping",
        label: "Vận chuyển",
        Icon: LocalShippingIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "list", label: "Phí vận chuyển", path: `/${prefixAdmin}/shipping/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "settings",
        label: "Cài đặt",
        Icon: ManageAccountsIcon,
        path: `/${prefixAdmin}/settings`,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
    },
    {
        id: "service",
        label: "Dịch vụ",
        Icon: ScheduleSendIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "list", label: "Quản lý dịch vụ", path: `/${prefixAdmin}/service/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "category", label: "Danh mục dịch vụ", path: `/${prefixAdmin}/service-category/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "room",
        label: "Quản lý phòng",
        Icon: MeetingRoomIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "room-type-list", label: "Danh sách loại phòng", path: `/${prefixAdmin}/room-type/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "room-list", label: "Danh sách phòng", path: `/${prefixAdmin}/room/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "room-layout-config", label: "Sắp xếp vị trí phòng", path: `/${prefixAdmin}/room-layout-config/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "amenity-list", label: "Tiện nghi", path: `/${prefixAdmin}/amenity/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "amenity-category-list", label: "Danh mục tiện nghi", path: `/${prefixAdmin}/amenity-category/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "shop-schedule",
        label: "Cài đặt lịch",
        Icon: ScheduleSendIcon,
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
        children: [
            { id: "operation-hours", label: "Giờ hoạt động", path: `/${prefixAdmin}/shop-operation-hours`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "exceptions", label: "Ngoại lệ lịch", path: `/${prefixAdmin}/time-slot-exception/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    },
    {
        id: "staff",
        label: "Nhân sự",
        Icon: BadgeIcon,
        allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"],
        children: [
            { id: "staff-dashboard", label: "Nhiệm vụ", path: `/${prefixAdmin}/staff/dashboard`, allowedRoles: ["STAFF", "SUPER_ADMIN"] },
            { id: "staff-personal-schedule", label: "Lịch cá nhân", path: `/${prefixAdmin}/staff/personal-schedule`, allowedRoles: ["STAFF", "SUPER_ADMIN"] },
            { id: "staff-profiles", label: "Hồ sơ nhân viên", path: `/${prefixAdmin}/staff/profile/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-positions", label: "Danh mục chức vụ", path: `/${prefixAdmin}/staff/position/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-skills", label: "Danh mục kỹ năng", path: `/${prefixAdmin}/staff/skill/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-skills-map", label: "Kỹ năng nhân viên", path: `/${prefixAdmin}/staff/skills-map/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-contracts", label: "Hợp đồng", path: `/${prefixAdmin}/staff/contract/list`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-fixed-schedules", label: "Lịch cố định", path: `/${prefixAdmin}/staff/fixed-schedules`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-official-schedule", label: "Lịch chính thức", path: `/${prefixAdmin}/staff/official-schedule`, allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"] },
            { id: "staff-work-shifts", label: "Ca làm việc (QL)", path: `/${prefixAdmin}/staff/work-shifts`, role: "ADMIN" as const, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
            { id: "staff-register-shifts", label: "Ca làm việc", path: `/${prefixAdmin}/staff/work-shifts/register`, role: "STAFF" as const, allowedRoles: ["STAFF", "SUPER_ADMIN"] },
            { id: "staff-realtime", label: "Trạng thái realtime", path: `/${prefixAdmin}/staff/realtime`, allowedRoles: ["ADMIN", "STAFF", "SUPER_ADMIN"] },
            { id: "staff-payroll", label: "Lương", path: `/${prefixAdmin}/staff/payroll`, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
        ]
    }
];
