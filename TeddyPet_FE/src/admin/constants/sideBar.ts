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

export const menuOverviewData = [
    {
        id: "analytics",
        Icon: DataExplorationIcon,
        label: "Phân tích",
        tKey: "admin.sidebar.analytics",
        path: `/${prefixAdmin}/dashboard/analytics`
    },
    {
        id: "booking",
        Icon: ScheduleSendIcon,
        label: "Đặt lịch",
        tKey: "admin.sidebar.booking",
        path: `/${prefixAdmin}/dashboard/booking`
    },
];

/** Menu item for booking management (list/detail) - can be added under a parent or as link from dashboard. */
export const bookingManagementItem = {
    id: "bookings",
    label: "Đặt lịch",
    Icon: ScheduleSendIcon,
    children: [
        { id: "list", label: "Danh sách đặt lịch", path: `/${prefixAdmin}/booking/list` },
    ],
};

export const menuManagementData = [
    {
        id: "orders",
        label: "Đơn hàng",
        Icon: ArticleIcon,
        children: [
            { id: "list", label: "Danh sách đơn hàng", path: `/${prefixAdmin}/order/list` },
        ]
    },
    {
        id: "bookings",
        label: "Đặt lịch",
        Icon: ScheduleSendIcon,
        children: [
            { id: "list", label: "Danh sách đặt lịch", path: `/${prefixAdmin}/booking/list` },
        ]
    },
    {
        id: "users",
        label: "Tài khoản",
        Icon: PersonIcon,
        children: [
            { id: "list", label: "Danh sách người dùng", path: `/${prefixAdmin}/user/list` },
        ]
    },
    {
        id: "products",
        label: "Sản phẩm",
        tKey: "admin.sidebar.products",
        Icon: ExtensionIcon,
        children: [
            { id: "list", label: "Danh sách", tKey: "admin.sidebar.list", path: `/${prefixAdmin}/product/list` },
            { id: "brand", label: "Thương hiệu", tKey: "admin.sidebar.brand", path: `/${prefixAdmin}/brand/list` },
            { id: "category", label: "Danh mục", tKey: "admin.sidebar.category", path: `/${prefixAdmin}/product-category/list` },
            { id: "attribute", label: "Thuộc tính", tKey: "admin.sidebar.attribute", path: `/${prefixAdmin}/product/attribute/list` },
            { id: "create", label: "Tạo sản phẩm", tKey: "admin.sidebar.product_create", path: `/${prefixAdmin}/product/create`, hidden: true },
            { id: "edit", label: "Sửa sản phẩm", tKey: "admin.sidebar.product_edit", path: `/${prefixAdmin}/product/edit`, hidden: true },
            { id: "category-create", label: "Tạo danh mục sản phẩm", tKey: "admin.sidebar.category_create", path: `/${prefixAdmin}/product-category/create`, hidden: true },
            { id: "brand-create", label: "Tạo thương hiệu", tKey: "admin.sidebar.brand_create", path: `/${prefixAdmin}/brand/create`, hidden: true },
            { id: "tags", label: "Tags", tKey: "admin.sidebar.tags", path: `/${prefixAdmin}/product/list?modal=product-tags` },
            { id: "age-ranges", label: "Độ tuổi", tKey: "admin.sidebar.age-ranges", path: `/${prefixAdmin}/product/list?modal=product-age-ranges` },
        ]
    },
    {
        id: "blogs",
        label: "Bài viết",
        tKey: "admin.sidebar.blogs",
        Icon: ArticleIcon,
        children: [
            { id: "create", label: "Tạo bài viết", tKey: "admin.sidebar.blog_create", path: `/${prefixAdmin}/blog/create` },
            { id: "list", label: "Danh sách bài viết", tKey: "admin.sidebar.blog_list", path: `/${prefixAdmin}/blog/list` },
            { id: "category", label: "Danh mục bài viết", tKey: "admin.sidebar.blog_category", path: `/${prefixAdmin}/blog-category/list` },
            { id: "tags", label: "Tags", tKey: "admin.sidebar.tags", path: `/${prefixAdmin}/blog/list?modal=tags` },
            { id: "category-create", label: "Tạo danh mục bài viết", tKey: "admin.sidebar.blog_category_create", path: `/${prefixAdmin}/blog-category/create`, hidden: true },
        ]
    },
    {
        id: "roles",
        label: "Nhóm quyền",
        tKey: "admin.sidebar.roles",
        Icon: ManageAccountsIcon,
        children: [
            { id: "create", label: "Tạo nhóm quyền", tKey: "admin.sidebar.role_create", path: `/${prefixAdmin}/role/create` },
            { id: "list", label: "Danh sách nhóm quyền", tKey: "admin.sidebar.role_list", path: `/${prefixAdmin}/role/list` },
        ]
    },
    {
        id: "coupons",
        label: "Mã giảm giá",
        tKey: "admin.sidebar.coupons",
        Icon: DiscountIcon,
        children: [
            { id: "create", label: "Tạo mã giảm giá", tKey: "admin.sidebar.coupon_create", path: `/${prefixAdmin}/role/create` },
            { id: "list", label: "Danh sách mã giảm giá", tKey: "admin.sidebar.coupon_list", path: `/${prefixAdmin}/role/list` },
        ]
    },
    {
        id: "shipping",
        label: "Vận chuyển",
        Icon: LocalShippingIcon,
        children: [
            { id: "list", label: "Phí vận chuyển", path: `/${prefixAdmin}/shipping/list` },
        ]
    },
    {
        id: "settings",
        label: "Cài đặt",
        Icon: ManageAccountsIcon,
        path: `/${prefixAdmin}/settings`
    },
    {
        id: "service",
        label: "Dịch vụ",
        Icon: ScheduleSendIcon,
        children: [
            { id: "list", label: "Quản lý dịch vụ", path: `/${prefixAdmin}/service/list` },
            { id: "category", label: "Danh mục dịch vụ", path: `/${prefixAdmin}/service-category/list` },
        ]
    },
    {
        id: "room",
        label: "Quản lý phòng",
        Icon: MeetingRoomIcon,
        children: [
            { id: "room-type-list", label: "Danh sách loại phòng", path: `/${prefixAdmin}/room-type/list` },
            { id: "room-list", label: "Danh sách phòng", path: `/${prefixAdmin}/room/list` },
            { id: "room-layout-config", label: "Sắp xếp vị trí phòng", path: `/${prefixAdmin}/room-layout-config/list` },
            { id: "amenity-list", label: "Tiện nghi", path: `/${prefixAdmin}/amenity/list` },
            { id: "amenity-category-list", label: "Danh mục tiện nghi", path: `/${prefixAdmin}/amenity-category/list` },
        ]
    },
    {
        id: "shop-schedule",
        label: "Cài đặt lịch",
        Icon: ScheduleSendIcon,
        children: [
            { id: "operation-hours", label: "Giờ hoạt động", path: `/${prefixAdmin}/shop-operation-hours` },
            { id: "exceptions", label: "Ngoại lệ lịch", path: `/${prefixAdmin}/time-slot-exception/list` },
        ]
    },
    {
        id: "staff",
        label: "Nhân sự",
        Icon: BadgeIcon,
        children: [
            { id: "staff-profiles", label: "Hồ sơ nhân viên", path: `/${prefixAdmin}/staff/profile/list` },
            { id: "staff-positions", label: "Danh mục chức vụ", path: `/${prefixAdmin}/staff/position/list` },
            { id: "staff-skills", label: "Danh mục kỹ năng", path: `/${prefixAdmin}/staff/skill/list` },
            { id: "staff-skills-map", label: "Kỹ năng nhân viên", path: `/${prefixAdmin}/staff/skills-map/list` },
            { id: "staff-contracts", label: "Hợp đồng", path: `/${prefixAdmin}/staff/contract/list` },
            { id: "staff-work-shifts", label: "Ca làm việc (QL)", path: `/${prefixAdmin}/staff/work-shifts`, role: "ADMIN" as const },
            { id: "staff-register-shifts", label: "Đăng ký ca", path: `/${prefixAdmin}/staff/work-shifts/register`, role: "STAFF" as const },
            { id: "staff-realtime", label: "Trạng thái realtime", path: `/${prefixAdmin}/staff/realtime` },
            { id: "staff-payroll", label: "Lương", path: `/${prefixAdmin}/staff/payroll` },
        ]
    }
];
