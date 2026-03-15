import type { RouteObject } from "react-router-dom";
import { ProductListPage } from "../pages/product/ProductListPage";
import { ProductFormPage } from "../pages/product/ProductFormPage";
import { ProductCategoryListPage } from "../pages/product-category/ProductCategoryListPage";
import { ProductCategoryCreatePage } from "../pages/product-category/ProductCategoryCreatePage";
import { ProductCategoryEditPage } from "../pages/product-category/ProductCategoryEditPage";
import { ProductCategoryDetailPage } from "../pages/product-category/ProductCategoryDetailPage";
import { BrandListPage } from "../pages/brand/BrandListPage";
import { BrandCreatePage } from "../pages/brand/BrandCreatePage";
import { BrandEditPage } from "../pages/brand/BrandEditPage";
import { BrandDetailPage } from "../pages/brand/BrandDetailPage";
import { BlogListPage } from "../pages/blog/BlogListPage";
import { BlogCategoryListPage } from "../pages/blog-category/BlogCategoryListPage";
import { BlogCategoryCreatePage } from "../pages/blog-category/BlogCategoryCreatePage";
import { BlogCategoryEditPage } from "../pages/blog-category/BlogCategoryEditPage";
import { BlogCategoryDetailPage } from "../pages/blog-category/BlogCategoryDetailPage";
import { BlogCreatePage } from "../pages/blog/BlogCreatePage";
import { BlogDetailPage } from "../pages/blog/BlogDetailPage";
import { BlogEditPage } from "../pages/blog/BlogEditPage";
import { LoginPage } from "../pages/authen/LoginPage";
import { SetupPasswordPage } from "../pages/authen/SetupPasswordPage";
import { AnalyticsPage } from "../pages/dashboard/AnalyticsPage";
import { DashboardHome } from "../pages/dashboard/DashboardHome";
import { SystemPage } from "../pages/dashboard/SystemPage";
import { ProductAttributeListPage } from "../pages/product-attribute/ProductAttributeListPage";
import { ProductAttributeCreatePage } from "../pages/product-attribute/ProductAttributeCreatePage";
import { ProductAttributeEditPage } from "../pages/product-attribute/ProductAttributeEditPage";
import { ProductAttributeDetailPage } from "../pages/product-attribute/ProductAttributeDetailPage";
import { UserListPage } from "../pages/user/UserListPage";
import { UserDetailPage } from "../pages/user/UserDetailPage";
import { OrderListPage } from "../pages/order/OrderListPage";
import { OrderDetailPage } from "../pages/order/OrderDetailPage";
import { ManualOrderPage } from "../pages/order/manual/ManualOrderPage";
import { ShippingRuleListPage } from "../pages/shipping/ShippingRuleListPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { ServiceManagementPage } from "../pages/service/ServiceManagementPage";
import { ServiceCategoryListPage } from "../pages/service/ServiceCategoryListPage";
import { ServiceCategoryCreatePage } from "../pages/service/ServiceCategoryCreatePage";
import { ServiceCategoryEditPage } from "../pages/service/ServiceCategoryEditPage";
import { ServiceCreatePage } from "../pages/service/ServiceCreatePage";
import { ServiceEditPage } from "../pages/service/ServiceEditPage";
import { ServiceComboCreatePage } from "../pages/service/ServiceComboCreatePage";
import { ServiceComboEditPage } from "../pages/service/ServiceComboEditPage";
import { BookingListPage } from "../pages/booking/BookingListPage";
import { BookingDetailPage } from "../pages/booking/BookingDetailPage";
import { BookingPetDetailPage } from "../pages/booking/BookingPetDetailPage";
import { BookingPetServiceDetailPage } from "../pages/booking/BookingPetServiceDetailPage";
import { BookingCreatePage } from "../pages/booking/BookingCreatePage";
import { BookingCreateDetailPage } from "../pages/booking/BookingCreateDetailPage";
import { BookingRefundPolicyListPage } from "../pages/booking/BookingRefundPolicyListPage";
import { ShopOperationHoursPage } from "../pages/shop/ShopOperationHoursPage";
import { TimeSlotExceptionListPage } from "../pages/shop/TimeSlotExceptionListPage";
import { TimeSlotExceptionFormPage } from "../pages/shop/TimeSlotExceptionFormPage";
import { RoomTypeListPage } from "../pages/room/RoomTypeListPage";
import { RoomTypeCreatePage } from "../pages/room/RoomTypeCreatePage";
import { RoomTypeEditPage } from "../pages/room/RoomTypeEditPage";
import { RoomListPage } from "../pages/room/RoomListPage";
import { RoomCreatePage } from "../pages/room/RoomCreatePage";
import { RoomEditPage } from "../pages/room/RoomEditPage";
import { RoomLayoutConfigListPage } from "../pages/room/RoomLayoutConfigListPage";
import { RoomLayoutEditorPage } from "../pages/room/RoomLayoutEditorPage";
import { AmenityListPage } from "../pages/amenity/AmenityListPage";
import { AmenityCreatePage } from "../pages/amenity/AmenityCreatePage";
import { AmenityEditPage } from "../pages/amenity/AmenityEditPage";
import { AmenityCategoryListPage } from "../pages/amenity/AmenityCategoryListPage";
import { AmenityCategoryCreatePage } from "../pages/amenity/AmenityCategoryCreatePage";
import { AmenityCategoryEditPage } from "../pages/amenity/AmenityCategoryEditPage";
import { SkillListPage } from "../pages/staff/skill/SkillListPage";
import { SkillCreatePage } from "../pages/staff/skill/SkillCreatePage";
import { SkillEditPage } from "../pages/staff/skill/SkillEditPage";
import { StaffPositionListPage } from "../pages/staff/position/StaffPositionListPage";
import { StaffPositionCreatePage } from "../pages/staff/position/StaffPositionCreatePage";
import { StaffPositionEditPage } from "../pages/staff/position/StaffPositionEditPage";
import { StaffProfileListPage } from "../pages/staff/profile/StaffProfileListPage";
import { StaffProfileOnboardingPage } from "../pages/staff/profile/StaffProfileOnboardingPage";
import { StaffProfileEditPage } from "../pages/staff/profile/StaffProfileEditPage";
import { StaffProfileDetailPage } from "../pages/staff/profile/StaffProfileDetailPage";
import { ContractListPage } from "../pages/staff/contract/ContractListPage";
import { ContractCreatePage } from "../pages/staff/contract/ContractCreatePage";
import { ContractEditPage } from "../pages/staff/contract/ContractEditPage";
import { ContractDetailPage } from "../pages/staff/contract/ContractDetailPage";
import { WorkShiftAdminPage } from "../pages/staff/workShift/WorkShiftAdminPage";
import { WorkShiftStaffPage } from "../pages/staff/workShift/WorkShiftStaffPage";
import { OfficialSchedulePage } from "../pages/staff/workShift/OfficialSchedulePage";
import { StaffFixedSchedulePage } from "../pages/staff/fixedSchedule/StaffFixedSchedulePage";
import { RoleRouteGuard } from "../components/guards/RoleRouteGuard";
import { AdminOnlyGuard } from "../components/guards/AdminOnlyGuard";
import { prefixAdmin } from "../constants/routes";
import { StaffRealtimePage } from "../pages/staff/realtime/StaffRealtimePage";
import { PayrollPage } from "../pages/staff/payroll/PayrollPage";
import { StaffSkillListPage } from "../pages/staff/staffSkill/StaffSkillListPage";
import { FeedbackListPage } from "../pages/feedback/FeedbackListPage";
import { EmployeeDashboardPage } from "../pages/staff/dashboard/EmployeeDashboardPage";
import PersonalSchedule from "../pages/personal-schedule/PersonalSchedule";
import { AcceptInvitationPage } from "../pages/authen/AcceptInvitationPage";
import { BankInformationVerifyPage } from "../pages/bank-information/BankInformationVerifyPage";
import { CalendarPage } from "../pages/calendar/CalendarPage";

export const AdminRoutes: RouteObject[] = [
    { path: "dashboard", element: <DashboardHome /> },
    { path: "dashboard/analytics", element: <AnalyticsPage /> },
    { path: "dashboard/system", element: <SystemPage /> },
    { path: "dashboard/booking", element: <BookingListPage /> },
    { path: "calendar", element: <AdminOnlyGuard><CalendarPage /></AdminOnlyGuard> },
    { path: "product/list", element: <AdminOnlyGuard><ProductListPage /></AdminOnlyGuard> },
    { path: "product/create", element: <AdminOnlyGuard><ProductFormPage /></AdminOnlyGuard> },
    { path: "product/edit/:id", element: <AdminOnlyGuard><ProductFormPage /></AdminOnlyGuard> },
    { path: "product/detail/:id", element: <AdminOnlyGuard><ProductFormPage /></AdminOnlyGuard> },
    { path: "product/attribute/list", element: <AdminOnlyGuard><ProductAttributeListPage /></AdminOnlyGuard> },
    { path: "product-attribute/create", element: <AdminOnlyGuard><ProductAttributeCreatePage /></AdminOnlyGuard> },
    { path: "product-attribute/edit/:id", element: <AdminOnlyGuard><ProductAttributeEditPage /></AdminOnlyGuard> },
    { path: "product-attribute/detail/:id", element: <AdminOnlyGuard><ProductAttributeDetailPage /></AdminOnlyGuard> },
    { path: "product-category/list", element: <AdminOnlyGuard><ProductCategoryListPage /></AdminOnlyGuard> },
    { path: "product-category/create", element: <AdminOnlyGuard><ProductCategoryCreatePage /></AdminOnlyGuard> },
    { path: "product-category/edit/:id", element: <AdminOnlyGuard><ProductCategoryEditPage /></AdminOnlyGuard> },
    { path: "product-category/detail/:id", element: <AdminOnlyGuard><ProductCategoryDetailPage /></AdminOnlyGuard> },
    { path: "brand/list", element: <AdminOnlyGuard><BrandListPage /></AdminOnlyGuard> },
    { path: "brand/create", element: <AdminOnlyGuard><BrandCreatePage /></AdminOnlyGuard> },
    { path: "brand/edit/:id", element: <AdminOnlyGuard><BrandEditPage /></AdminOnlyGuard> },
    { path: "brand/detail/:id", element: <AdminOnlyGuard><BrandDetailPage /></AdminOnlyGuard> },
    { path: "blog/list", element: <AdminOnlyGuard><BlogListPage /></AdminOnlyGuard> },
    { path: "blog/create", element: <AdminOnlyGuard><BlogCreatePage /></AdminOnlyGuard> },
    { path: "blog/edit/:id", element: <AdminOnlyGuard><BlogEditPage /></AdminOnlyGuard> },
    { path: "blog/detail/:id", element: <AdminOnlyGuard><BlogDetailPage /></AdminOnlyGuard> },
    { path: "blog-category/list", element: <AdminOnlyGuard><BlogCategoryListPage /></AdminOnlyGuard> },
    { path: "blog-category/create", element: <AdminOnlyGuard><BlogCategoryCreatePage /></AdminOnlyGuard> },
    { path: "blog-category/edit/:id", element: <AdminOnlyGuard><BlogCategoryEditPage /></AdminOnlyGuard> },
    { path: "blog-category/detail/:id", element: <AdminOnlyGuard><BlogCategoryDetailPage /></AdminOnlyGuard> },
    { path: "user/list", element: <AdminOnlyGuard><UserListPage /></AdminOnlyGuard> },
    { path: "user/detail/:id", element: <AdminOnlyGuard><UserDetailPage /></AdminOnlyGuard> },
    { path: "order/list", element: <OrderListPage /> },
    { path: "order/detail/:id", element: <OrderDetailPage /> },
    { path: "order/manual", element: <ManualOrderPage /> },
    { path: "feedback/list", element: <FeedbackListPage /> },
    { path: "booking/list", element: <BookingListPage /> },
    { path: "booking/create", element: <BookingCreatePage /> },
    { path: "booking/create/detail", element: <BookingCreateDetailPage /> },
    { path: "booking/refund-policies", element: <AdminOnlyGuard><BookingRefundPolicyListPage /></AdminOnlyGuard> },
    { path: "booking/detail/:id", element: <BookingDetailPage /> },
    { path: "booking/detail/:id/pet/:petId", element: <BookingPetDetailPage /> },
    { path: "booking/detail/:id/pet/:petId/service/:serviceId", element: <BookingPetServiceDetailPage /> },
    { path: "booking/refund-policy/list", element: <AdminOnlyGuard><BookingRefundPolicyListPage /></AdminOnlyGuard> },
    { path: "bank-information/verify", element: <AdminOnlyGuard><BankInformationVerifyPage /></AdminOnlyGuard> },
    { path: "shipping/list", element: <AdminOnlyGuard><ShippingRuleListPage /></AdminOnlyGuard> },
    { path: "settings", element: <AdminOnlyGuard><SettingsPage /></AdminOnlyGuard> },
    { path: "service/list", element: <AdminOnlyGuard><ServiceManagementPage /></AdminOnlyGuard> },
    { path: "service/create", element: <AdminOnlyGuard><ServiceCreatePage /></AdminOnlyGuard> },
    { path: "service/edit/:id", element: <AdminOnlyGuard><ServiceEditPage /></AdminOnlyGuard> },
    { path: "service-combo/create", element: <AdminOnlyGuard><ServiceComboCreatePage /></AdminOnlyGuard> },
    { path: "service-combo/edit/:id", element: <AdminOnlyGuard><ServiceComboEditPage /></AdminOnlyGuard> },
    { path: "service-category/list", element: <AdminOnlyGuard><ServiceCategoryListPage /></AdminOnlyGuard> },
    { path: "service-category/create", element: <AdminOnlyGuard><ServiceCategoryCreatePage /></AdminOnlyGuard> },
    { path: "service-category/edit/:id", element: <AdminOnlyGuard><ServiceCategoryEditPage /></AdminOnlyGuard> },
    { path: "shop-operation-hours", element: <AdminOnlyGuard><ShopOperationHoursPage /></AdminOnlyGuard> },
    { path: "time-slot-exception/list", element: <AdminOnlyGuard><TimeSlotExceptionListPage /></AdminOnlyGuard> },
    { path: "time-slot-exception/create", element: <AdminOnlyGuard><TimeSlotExceptionFormPage /></AdminOnlyGuard> },
    { path: "time-slot-exception/edit/:id", element: <AdminOnlyGuard><TimeSlotExceptionFormPage /></AdminOnlyGuard> },
    { path: "room-type/list", element: <AdminOnlyGuard><RoomTypeListPage /></AdminOnlyGuard> },
    { path: "room-type/create", element: <AdminOnlyGuard><RoomTypeCreatePage /></AdminOnlyGuard> },
    { path: "room-type/edit/:id", element: <AdminOnlyGuard><RoomTypeEditPage /></AdminOnlyGuard> },
    { path: "room/list", element: <AdminOnlyGuard><RoomListPage /></AdminOnlyGuard> },
    { path: "room/create", element: <AdminOnlyGuard><RoomCreatePage /></AdminOnlyGuard> },
    { path: "room/edit/:id", element: <AdminOnlyGuard><RoomEditPage /></AdminOnlyGuard> },
    { path: "room-layout-config/list", element: <AdminOnlyGuard><RoomLayoutConfigListPage /></AdminOnlyGuard> },
    { path: "room-layout-config/editor/:id", element: <AdminOnlyGuard><RoomLayoutEditorPage /></AdminOnlyGuard> },
    { path: "amenity/list", element: <AdminOnlyGuard><AmenityListPage /></AdminOnlyGuard> },
    { path: "amenity/create", element: <AdminOnlyGuard><AmenityCreatePage /></AdminOnlyGuard> },
    { path: "amenity/edit/:id", element: <AdminOnlyGuard><AmenityEditPage /></AdminOnlyGuard> },
    { path: "amenity-category/list", element: <AdminOnlyGuard><AmenityCategoryListPage /></AdminOnlyGuard> },
    { path: "amenity-category/create", element: <AdminOnlyGuard><AmenityCategoryCreatePage /></AdminOnlyGuard> },
    { path: "amenity-category/edit/:id", element: <AdminOnlyGuard><AmenityCategoryEditPage /></AdminOnlyGuard> },
    { path: "staff/profile/list", element: <AdminOnlyGuard><StaffProfileListPage /></AdminOnlyGuard> },
    { path: "staff/profile/detail/:id", element: <AdminOnlyGuard><StaffProfileDetailPage /></AdminOnlyGuard> },
    { path: "staff/profile/onboarding", element: <AdminOnlyGuard><StaffProfileOnboardingPage /></AdminOnlyGuard> },
    { path: "staff/profile/edit/:id", element: <AdminOnlyGuard><StaffProfileEditPage /></AdminOnlyGuard> },
    { path: "staff/position/list", element: <AdminOnlyGuard><StaffPositionListPage /></AdminOnlyGuard> },
    { path: "staff/position/create", element: <AdminOnlyGuard><StaffPositionCreatePage /></AdminOnlyGuard> },
    { path: "staff/position/edit/:id", element: <AdminOnlyGuard><StaffPositionEditPage /></AdminOnlyGuard> },
    { path: "staff/skill/list", element: <AdminOnlyGuard><SkillListPage /></AdminOnlyGuard> },
    { path: "staff/skill/create", element: <AdminOnlyGuard><SkillCreatePage /></AdminOnlyGuard> },
    { path: "staff/skill/edit/:id", element: <AdminOnlyGuard><SkillEditPage /></AdminOnlyGuard> },
    { path: "staff/skills-map/list", element: <AdminOnlyGuard><StaffSkillListPage /></AdminOnlyGuard> },
    { path: "staff/contract/list", element: <AdminOnlyGuard><ContractListPage /></AdminOnlyGuard> },
    { path: "staff/contract/create", element: <AdminOnlyGuard><ContractCreatePage /></AdminOnlyGuard> },
    { path: "staff/contract/edit/:id", element: <AdminOnlyGuard><ContractEditPage /></AdminOnlyGuard> },
    { path: "staff/contract/detail/:id", element: <AdminOnlyGuard><ContractDetailPage /></AdminOnlyGuard> },
    { path: "staff/fixed-schedules", element: <AdminOnlyGuard><StaffFixedSchedulePage /></AdminOnlyGuard> },
    { path: "staff/official-schedule", element: <OfficialSchedulePage /> },
    {
        path: "staff/work-shifts",
        element: (
            <RoleRouteGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]} redirectTo={`/${prefixAdmin}/staff/work-shifts/register`}>
                <WorkShiftAdminPage />
            </RoleRouteGuard>
        ),
    },
    {
        path: "staff/work-shifts/register",
        element: (
            <RoleRouteGuard allowedRoles={["STAFF", "SUPER_ADMIN"]} redirectTo={`/${prefixAdmin}/staff/work-shifts`}>
                <WorkShiftStaffPage />
            </RoleRouteGuard>
        ),
    },
    { path: "staff/realtime", element: <StaffRealtimePage /> },
    { path: "staff/payroll", element: <AdminOnlyGuard><PayrollPage /></AdminOnlyGuard> },
    {
        path: "staff/dashboard",
        element: (
            <RoleRouteGuard allowedRoles={["STAFF", "SUPER_ADMIN"]} redirectTo={`/${prefixAdmin}/staff/profile/list`}>
                <EmployeeDashboardPage />
            </RoleRouteGuard>
        ),
    },
    {
        path: "staff/personal-schedule",
        element: (
            <RoleRouteGuard allowedRoles={["STAFF", "SUPER_ADMIN"]} redirectTo={`/${prefixAdmin}/staff/profile/list`}>
                <PersonalSchedule />
            </RoleRouteGuard>
        ),
    },
];

export const AdminAuthRoutes: RouteObject[] = [
    { path: "auth/login", element: <LoginPage /> },
    { path: "auth/accept-invitation", element: <AcceptInvitationPage /> },
    { path: "setup-password", element: <SetupPasswordPage /> },
];
