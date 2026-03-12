import { FooterSub } from "../../components/layouts/FooterSub";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PhoneEnabledOutlinedIcon from "@mui/icons-material/PhoneEnabledOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import type { BookingStep1FormData } from "./Booking";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getServiceCategories,
    getServices,
    getRoomLayoutConfigsByServiceId,
    getRoomsByLayoutConfigId,
    getRoomTypes,
    getTimeSlotsByServiceId,
    type RoomLayoutConfigClient,
    type RoomClient,
    type RoomTypeClient,
    type TimeSlotClient,
} from "../../../api/service.api";
import { getSupportPhone } from "../../../api/settings.api";
import { getFoodBrandOptions, type ProductBrandOption } from "../../../api/home.api";
import type { BookingPetForm, BookingPetServiceForm, PetFoodBroughtItemForm } from "../../../types/booking.type";
import type { ServiceCategoryClient, ServiceClient } from "../../../types/booking.type";
import { ServiceSelectField } from "../../components/ui/ServiceSelectField";
import { SESSION_SLOTS, PET_TYPES, FOOD_TYPE_OPTIONS } from "./constants";
import type { IServicePricing } from "../../../admin/pages/service/configs/types";
import { getServicePricingsByServiceId } from "../../../admin/api/service-pricing.api";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import "dayjs/locale/vi";
import { buildCreateBookingPayload } from "../../../api/booking.api";
import { createBookingDepositIntent } from "../../../api/booking-deposit.api";
import { getBanks, getMyBankInformation } from "../../../api/bank.api";
import type { BankOption, BankInformationPayload } from "../../../types/bank.type";
import { useAuthStore } from "../../../stores/useAuthStore";

const defaultStep1Data: BookingStep1FormData = {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    message: "",
};

dayjs.locale("vi");

const OTHER_BRAND_VALUE = "__OTHER__";

const normalizePetType = (v?: string | null) => v?.toString().trim().toLowerCase() || "";

const toPetTypeEnum = (petType: string): string => {
    const norm = normalizePetType(petType);
    if (!norm) return "";
    return norm.toUpperCase(); // dog -> DOG (PetTypeEnum)
};

const buildUsedBrandKeysForType = (items: PetFoodBroughtItemForm[], currentIndex: number, foodType: string) => {
    const result = new Set<string>();
    items.forEach((it, idx) => {
        if (idx === currentIndex) return;
        if ((it.foodBroughtType ?? "") !== foodType) return;
        const brand = it.foodBrand;
        if (brand == null) result.add(OTHER_BRAND_VALUE);
        else {
            const key = brand.toString().trim();
            if (key) result.add(key);
        }
    });
    return result;
};

type FoodBrandSelectProps = {
    petTypeEnum: string;
    foodType: string;
    items: PetFoodBroughtItemForm[];
    itemIndex: number;
    value: string | null | undefined;
    onChange: (nextBrand: string | null) => void;
};

type PetFieldErrors = {
    petType?: string;
    weight?: string;
    petName?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    /** Lỗi Ngày gửi/Ngày trả cho từng dịch vụ (key: "main" hoặc id của dịch vụ thêm). */
    serviceDateErrors?: Record<string, string>;
    /** Lỗi chọn phòng cho từng dịch vụ yêu cầu phòng (key: "main" hoặc id của dịch vụ thêm). */
    serviceRoomErrors?: Record<string, string>;
};

const FoodBrandSelect = ({ petTypeEnum, foodType, items, itemIndex, value, onChange }: FoodBrandSelectProps) => {
    const { data: brandOptionsData, isFetching } = useQuery({
        queryKey: ["food-brand-options", petTypeEnum],
        queryFn: () => getFoodBrandOptions(petTypeEnum),
        enabled: !!petTypeEnum,
        staleTime: 5 * 60 * 1000,
    });

    const allBrands: ProductBrandOption[] = brandOptionsData?.data ?? [];

    const usedBrandKeys = useMemo(() => buildUsedBrandKeysForType(items, itemIndex, foodType), [items, itemIndex, foodType]);

    const availableBrands = useMemo(() => {
        return allBrands
            .filter((b) => b.isActive && !b.isDeleted)
            .filter((b) => !usedBrandKeys.has((b.name ?? "").trim()))
            .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "vi"));
    }, [allBrands, usedBrandKeys]);

    const canSelect = !!petTypeEnum && !!foodType;
    const selectValue = value == null ? OTHER_BRAND_VALUE : value ?? "";
    const canShowOther = !usedBrandKeys.has(OTHER_BRAND_VALUE);

    return (
        <select
            value={selectValue}
            disabled={!canSelect || isFetching}
            onChange={(e) => {
                const v = e.target.value;
                if (v === OTHER_BRAND_VALUE) onChange(null);
                else onChange(v);
            }}
            className="input-booking w-full py-[10px] px-[14px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] outline-none text-[0.875rem] bg-white disabled:bg-[#f5f5f5] disabled:text-[#999]"
        >
            <option value="">
                {!petTypeEnum
                    ? "Vui lòng chọn loại thú cưng"
                    : !foodType
                        ? "Chọn loại thức ăn trước"
                        : isFetching
                            ? "Đang tải nhãn hiệu..."
                            : "Chọn nhãn hiệu"}
            </option>
            {availableBrands.map((b) => (
                <option key={b.id} value={b.name}>
                    {b.name}
                </option>
            ))}
            {canShowOther ? <option value={OTHER_BRAND_VALUE}>Khác</option> : null}
        </select>
    );
};

type PetTypeDropdownProps = {
    isOpen: boolean;
    value: string;
    options: string[];
    onToggle: () => void;
    onChange: (next: string) => void;
    renderLabel: (value: string) => string;
};

const PetTypeDropdown = ({ isOpen, value, options, onToggle, onChange, renderLabel }: PetTypeDropdownProps) => {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between py-[12px] px-[16px] rounded-[10px] border border-[#ddd] bg-white text-[#181818] hover:border-[#ffbaa0]/60 transition-colors text-[0.9375rem]"
            >
                <span className="truncate">{renderLabel(value) || "— Chọn loại —"}</span>
                <span className="ml-3 text-[#999] text-[0.8125rem]">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-[6px] z-30 bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_12px_30px_rgba(15,23,42,0.18)] max-h-[260px] overflow-y-auto">
                    <div className="py-[8px]">
                        {options.map((opt) => {
                            const isSelected = opt === value;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => onChange(opt)}
                                    className={`w-full text-left rounded-[10px] mx-[8px] px-[10px] py-[10px] border transition-colors ${isSelected
                                        ? "border-[#ffbaa0] bg-[#fff7f3]"
                                        : "border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3]"
                                        }`}
                                >
                                    <span className="text-[0.9062rem] font-[600] text-[#181818]">{renderLabel(opt)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

/** Ô Ngày gửi + Khung giờ khi dịch vụ thêm có isRequiredRoom = false (dùng time_slots của dịch vụ). */
type AdditionalServiceNonRoomFieldsProps = {
    petId: string;
    pet: BookingPetForm;
    asvc: BookingPetServiceForm;
    updateAdditionalService: (petId: string, svcId: string, updates: Partial<BookingPetServiceForm>) => void;
    services: ServiceClient[];
    bookingDatePickerPopperSx: object;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
};

/** Ô Ngày gửi + Khung giờ cho dịch vụ chính khi isRequiredRoom = false (dùng time_slots của dịch vụ). */
type MainServiceNonRoomFieldsProps = {
    pet: BookingPetForm;
    updatePet: (id: string, updates: Partial<BookingPetForm>) => void;
    services: ServiceClient[];
    bookingDatePickerPopperSx: object;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
};

const MainServiceNonRoomFields = ({
    pet,
    updatePet,
    services,
    bookingDatePickerPopperSx,
    getServicePriceForWeight,
}: MainServiceNonRoomFieldsProps) => {
    const selectedSvc = pet.serviceId ? services.find((s) => s.serviceId === pet.serviceId) : undefined;
    const isNonRoom = selectedSvc?.isRequiredRoom === false;

    const { data: timeSlotsData } = useQuery({
        queryKey: ["time-slots-main", pet.id, pet.serviceId],
        queryFn: () => getTimeSlotsByServiceId(pet.serviceId!),
        enabled: !!pet.serviceId && isNonRoom,
        select: (res) => res.data ?? [],
    });

    const timeSlots: TimeSlotClient[] = timeSlotsData ?? [];
    const slotOptions = useMemo(() => {
        return timeSlots
            .filter((ts) => ts.status !== "INACTIVE")
            .filter((ts) => (ts.currentBookings ?? 0) < (ts.maxCapacity ?? 1))
            .map((ts) => {
                const start = typeof ts.startTime === "string" ? ts.startTime.slice(0, 5) : ts.startTime;
                const end = typeof ts.endTime === "string" ? ts.endTime.slice(0, 5) : ts.endTime;
                const label = start && end ? `${start} - ${end}` : start || end || `Slot #${ts.id}`;
                return { value: String(ts.id), label };
            });
    }, [timeSlots]);

    if (!pet.serviceId || !isNonRoom) return null;

    const mainServicePrice = selectedSvc ? getServicePriceForWeight(selectedSvc, pet.weight, pet.petType) : undefined;
    const addonIds = pet.addonServiceIds ?? [];
    const addonServices = addonIds
        .map((id) => services.find((s) => s.serviceId === id))
        .filter((s): s is ServiceClient => s != null);
    const addonTotal = addonServices.reduce((sum, s) => {
        const p = getServicePriceForWeight(s, pet.weight, pet.petType);
        return sum + (p ?? 0);
    }, 0);
    const totalEstimated =
        (mainServicePrice ?? 0) + (addonServices.length > 0 || addonTotal > 0 ? addonTotal : 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
            <div>
                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày gửi *</label>
                <DatePicker
                    value={pet.sessionDate ? dayjs(pet.sessionDate) : null}
                    onChange={(d: Dayjs | null) =>
                        updatePet(pet.id, { sessionDate: d ? d.format("YYYY-MM-DD") : "" })
                    }
                    format="DD/MM/YYYY"
                    slotProps={{
                        textField: {
                            placeholder: "DD/MM/YYYY",
                            required: true,
                            fullWidth: true,
                            sx: bookingDatePickerTextFieldSx,
                        },
                        popper: { sx: bookingDatePickerPopperSx },
                    }}
                />
            </div>
            <div>
                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Khung giờ *</label>
                <select
                    value={pet.sessionTimeSlotId != null ? String(pet.sessionTimeSlotId) : ""}
                    onChange={(e) => {
                        const id = Number(e.target.value);
                        const opt = slotOptions.find((o) => o.value === e.target.value);
                        updatePet(pet.id, {
                            sessionTimeSlotId: id || undefined,
                            sessionSlotLabel: opt?.label,
                            sessionSlot: opt?.label?.split(" - ")[0] ?? "",
                        });
                    }}
                    required
                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] bg-white text-[0.9375rem] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none"
                >
                    <option value="">— Chọn khung giờ —</option>
                    {slotOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {(mainServicePrice != null || addonServices.length > 0) && (
                <div className="sm:col-span-2 mt-2 rounded-[10px] bg-white border border-[#ffe0ce] px-4 py-3">
                    <div className="text-[0.8438rem] text-[#181818] font-[600] mb-1">Tóm tắt giá dự kiến</div>
                    {mainServicePrice != null && (
                        <div className="text-[0.8125rem] text-[#555]">
                            Dịch vụ chính:{" "}
                            <strong className="text-[#c45a3a]">
                                {selectedSvc?.serviceName} — {Number(mainServicePrice).toLocaleString("vi-VN")}đ
                            </strong>
                        </div>
                    )}
                    <div className="text-[0.8125rem] text-[#555] mt-1">
                        Dịch vụ add-on:{" "}
                        {addonServices.length === 0 ? (
                            <span className="text-[#888]">Không có</span>
                        ) : (
                            <span className="text-[#181818]">
                                {addonServices
                                    .map((s) => {
                                        const p = getServicePriceForWeight(s, pet.weight, pet.petType);
                                        const priceText = p != null ? ` — ${Number(p).toLocaleString("vi-VN")}đ` : "";
                                        return `${s.serviceName}${priceText}`;
                                    })
                                    .join("; ")}
                            </span>
                        )}
                    </div>
                    {totalEstimated > 0 && (
                        <div className="text-[0.8438rem] text-[#555] mt-2">
                            Tổng dự kiến:{" "}
                            <strong className="text-[0.9375rem] text-[#c45a3a]">
                                {Number(totalEstimated).toLocaleString("vi-VN")}đ
                            </strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AdditionalServiceNonRoomFields = ({
    petId,
    pet,
    asvc,
    updateAdditionalService,
    services,
    bookingDatePickerPopperSx,
    getServicePriceForWeight,
}: AdditionalServiceNonRoomFieldsProps) => {
    const selectedSvc = asvc.serviceId ? services.find((s) => s.serviceId === asvc.serviceId) : undefined;
    const isNonRoom = selectedSvc?.isRequiredRoom === false;

    const { data: timeSlotsData } = useQuery({
        queryKey: ["time-slots", asvc.serviceId],
        queryFn: () => getTimeSlotsByServiceId(asvc.serviceId!),
        enabled: !!asvc.serviceId && isNonRoom,
        select: (res) => res.data ?? [],
    });

    const timeSlots: TimeSlotClient[] = timeSlotsData ?? [];

    const slotOptions = useMemo(() => {
        return timeSlots
            .filter((ts) => ts.status !== "INACTIVE")
            .filter((ts) => (ts.currentBookings ?? 0) < (ts.maxCapacity ?? 1))
            .map((ts) => {
                const start = typeof ts.startTime === "string" ? ts.startTime.slice(0, 5) : ts.startTime;
                const end = typeof ts.endTime === "string" ? ts.endTime.slice(0, 5) : ts.endTime;
                const label = start && end ? `${start} - ${end}` : start || end || `Slot #${ts.id}`;
                return { value: String(ts.id), label };
            });
    }, [timeSlots]);

    if (!asvc.serviceId || !isNonRoom) return null;

    const mainServicePrice = selectedSvc ? getServicePriceForWeight(selectedSvc, pet.weight, pet.petType) : undefined;
    const addonIds = asvc.addonServiceIds ?? [];
    const addonServices = addonIds
        .map((id) => services.find((s) => s.serviceId === id))
        .filter((s): s is ServiceClient => s != null);
    const addonTotal = addonServices.reduce((sum, s) => {
        const p = getServicePriceForWeight(s, pet.weight, pet.petType);
        return sum + (p ?? 0);
    }, 0);
    const totalEstimated =
        (mainServicePrice ?? 0) + (addonServices.length > 0 || addonTotal > 0 ? addonTotal : 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
            <div>
                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày gửi *</label>
                <DatePicker
                    value={asvc.sessionDate ? dayjs(asvc.sessionDate) : null}
                    onChange={(d: Dayjs | null) =>
                        updateAdditionalService(petId, asvc.id, { sessionDate: d ? d.format("YYYY-MM-DD") : "" })
                    }
                    format="DD/MM/YYYY"
                    slotProps={{
                        textField: { size: "small", fullWidth: true, placeholder: "DD/MM/YYYY" },
                        popper: { sx: bookingDatePickerPopperSx },
                    }}
                />
            </div>
            <div>
                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Khung giờ *</label>
                <select
                    value={asvc.sessionTimeSlotId != null ? String(asvc.sessionTimeSlotId) : ""}
                    onChange={(e) => {
                        const id = Number(e.target.value);
                        const opt = slotOptions.find((o) => o.value === e.target.value);
                        updateAdditionalService(petId, asvc.id, {
                            sessionTimeSlotId: id || undefined,
                            sessionSlotLabel: opt?.label,
                            sessionSlot: opt?.label?.split(" - ")[0] ?? "",
                        });
                    }}
                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] bg-white text-[0.9375rem] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none"
                >
                    <option value="">— Chọn khung giờ —</option>
                    {slotOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {(mainServicePrice != null || addonServices.length > 0) && (
                <div className="sm:col-span-2 mt-2 rounded-[10px] bg-white border border-[#ffe0ce] px-4 py-3">
                    <div className="text-[0.8438rem] text-[#181818] font-[600] mb-1">Tóm tắt giá dịch vụ thêm</div>
                    {mainServicePrice != null && (
                        <div className="text-[0.8125rem] text-[#555]">
                            Dịch vụ thêm:{" "}
                            <strong className="text-[#c45a3a]">
                                {selectedSvc?.serviceName} — {Number(mainServicePrice).toLocaleString("vi-VN")}đ
                            </strong>
                        </div>
                    )}
                    <div className="text-[0.8125rem] text-[#555] mt-1">
                        Dịch vụ add-on:{" "}
                        {addonServices.length === 0 ? (
                            <span className="text-[#888]">Không có</span>
                        ) : (
                            <span className="text-[#181818]">
                                {addonServices
                                    .map((s) => {
                                        const p = getServicePriceForWeight(s, pet.weight, pet.petType);
                                        const priceText = p != null ? ` — ${Number(p).toLocaleString("vi-VN")}đ` : "";
                                        return `${s.serviceName}${priceText}`;
                                    })
                                    .join("; ")}
                            </span>
                        )}
                    </div>
                    {totalEstimated > 0 && (
                        <div className="text-[0.8438rem] text-[#555] mt-2">
                            Tổng dự kiến:{" "}
                            <strong className="text-[0.9375rem] text-[#c45a3a]">
                                {Number(totalEstimated).toLocaleString("vi-VN")}đ
                            </strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const cellSize = 48;

type RoomPickerSectionProps = {
    pet: BookingPetForm;
    updatePet: (id: string, updates: Partial<BookingPetForm>) => void;
    services: ServiceClient[];
    onViewRoomDetail?: (room: RoomClient) => void;
    getRoomTotalPrice?: (p: BookingPetForm, roomTypeId: number | null) => number | null;
};

const RoomPickerSection = ({ pet, updatePet, services, onViewRoomDetail, getRoomTotalPrice }: RoomPickerSectionProps) => {
    const selectedService = services.find((s) => s.serviceId === pet.serviceId);
    const needsRoom = selectedService?.isRequiredRoom === true;
    const hasDates = !!(pet.pricingModel === "per_day" && pet.dateFrom && pet.dateTo);
    const showPicker = needsRoom && hasDates && !!pet.serviceId;

    const { data: layoutData } = useQuery({
        queryKey: ["room-layout-config", pet.serviceId, "IN_USE"],
        queryFn: () => getRoomLayoutConfigsByServiceId(pet.serviceId!, "IN_USE"),
        enabled: showPicker && !!pet.serviceId,
        select: (res) => res.data,
    });

    const layouts: RoomLayoutConfigClient[] = layoutData ?? [];
    const activeLayout = layouts[0];
    const layoutId = activeLayout?.id;

    const { data: roomsData } = useQuery({
        queryKey: ["rooms-by-layout", layoutId],
        queryFn: () => getRoomsByLayoutConfigId(layoutId!),
        enabled: showPicker && !!layoutId,
        select: (res) => res.data ?? [],
    });

    const { data: roomTypesData } = useQuery({
        queryKey: ["room-types", pet.serviceId],
        queryFn: () => getRoomTypes(pet.serviceId!),
        enabled: showPicker && !!pet.serviceId,
        select: (res) => res.data ?? [],
    });

    const rooms: RoomClient[] = roomsData ?? [];
    const roomTypes: RoomTypeClient[] = (roomTypesData ?? []).filter((rt) => rt.isActive && !rt.isDeleted);
    const selectedRoomTypeId = pet.selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;
    const effectiveRoomTypeId = selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;

    // Tự chọn loại phòng đầu tiên khi picker hiển thị mà chưa có loại phòng nào được chọn
    const firstRoomTypeId = roomTypes[0]?.roomTypeId;
    useEffect(() => {
        if (!showPicker || firstRoomTypeId == null || pet.selectedRoomTypeId != null) return;
        updatePet(pet.id, { selectedRoomTypeId: firstRoomTypeId });
    }, [showPicker, roomTypes.length, firstRoomTypeId, pet.id, pet.selectedRoomTypeId, updatePet]);

    const placedRooms = useMemo(
        () => rooms.filter((r) => r.roomLayoutConfigId === layoutId && r.gridRow != null && r.gridCol != null),
        [rooms, layoutId]
    );

    const getRoomAt = useCallback(
        (row: number, col: number) => placedRooms.find((r) => r.gridRow === row && r.gridCol === col),
        [placedRooms]
    );

    const { data: supportPhone, isLoading: supportPhoneLoading } = useQuery({
        queryKey: ["support-phone"],
        queryFn: getSupportPhone,
        enabled: showPicker,
    });

    if (!showPicker) return null;

    if (!activeLayout) {
        const hasPhone = typeof supportPhone === "string" && supportPhone.trim() !== "";
        const phoneDisplay = hasPhone
            ? supportPhone!.trim()
            : supportPhoneLoading
                ? "..."
                : "hotline cửa hàng (cấu hình tại mục Cài đặt – Trang Admin)";
        return (
            <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
                <p className="text-[0.875rem] text-[#555]">
                    Chưa có dữ liệu phòng cho dịch vụ này, vui lòng liên hệ{" "}
                    <strong>{phoneDisplay}</strong> để được hỗ trợ.
                </p>
            </div>
        );
    }

    const maxRows = activeLayout.maxRows ?? 10;
    const maxCols = activeLayout.maxCols ?? 20;

    return (
        <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
            <label className="block mb-[12px] text-[0.875rem] font-[600] text-[#181818]">Chọn phòng *</label>

            {roomTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-[12px]">
                    <span className="w-full text-[0.8125rem] text-[#888] mb-1">Chọn loại phòng:</span>
                    {roomTypes.map((rt) => {
                        const isSelected = effectiveRoomTypeId === rt.roomTypeId;
                        return (
                            <button
                                key={rt.roomTypeId}
                                type="button"
                                onClick={() => {
                                    const currentRoom = placedRooms.find((r) => r.roomId === pet.selectedRoomId);
                                    const keepSelection = currentRoom && currentRoom.roomTypeId === rt.roomTypeId;
                                    updatePet(pet.id, {
                                        selectedRoomTypeId: rt.roomTypeId,
                                        selectedRoomId: keepSelection ? pet.selectedRoomId : null,
                                    });
                                }}
                                className={`py-[10px] px-[18px] rounded-[10px] border font-[600] text-[0.8438rem] transition-colors ${isSelected
                                    ? "border-[#ffbaa0] bg-[#ffbaa0]/25 text-[#c45a3a]"
                                    : "border-[#ddd] bg-white text-[#666] hover:border-[#ffbaa0]/60 hover:bg-[#fff7f3]"
                                    }`}
                            >
                                {rt.displayTypeName ?? rt.typeName}
                            </button>
                        );
                    })}
                </div>
            )}

            {roomTypes.length > 1 && !effectiveRoomTypeId ? (
                <div className="py-[24px] text-center text-[0.875rem] text-[#888] rounded-[12px] bg-[#f9fafb] border border-dashed border-[#e5e7eb]">
                    Vui lòng chọn loại phòng ở trên để xem sơ đồ và chọn phòng.
                </div>
            ) : (
                <div className="flex justify-center overflow-x-auto py-4">
                    <div
                        className="inline-grid gap-[8px] p-4 rounded-[14px] bg-white/60 border border-[#ffe0ce] shadow-sm"
                        style={{
                            gridTemplateColumns: `repeat(${maxCols}, ${cellSize}px)`,
                            gridTemplateRows: `repeat(${maxRows}, ${cellSize}px)`,
                        }}
                    >
                        {Array.from({ length: maxRows * maxCols }, (_, i) => {
                            const row = Math.floor(i / maxCols);
                            const col = i % maxCols;
                            const room = getRoomAt(row, col);
                            const isMatchingType = room && (effectiveRoomTypeId == null ? true : room.roomTypeId === effectiveRoomTypeId);
                            const isSelected = room && pet.selectedRoomId === room.roomId;
                            const isClickable = isMatchingType;

                            return (
                                <button
                                    key={`${row}-${col}`}
                                    type="button"
                                    disabled={!isClickable}
                                    onClick={() => {
                                        if (isClickable && room) {
                                            updatePet(pet.id, {
                                                selectedRoomId: isSelected ? null : room.roomId,
                                                selectedRoomTypeId: room.roomTypeId
                                            });
                                        }
                                    }}
                                    className={`flex flex-col items-center justify-center rounded-[10px] border-2 transition-all ${!room
                                        ? "border-dashed border-[#e5e7eb] bg-[#f4f4f5] cursor-default"
                                        : isMatchingType
                                            ? isSelected
                                                ? "border-[#c45a3a] bg-[#e67e20] text-white cursor-pointer shadow-md ring-2 ring-[#c45a3a] ring-offset-2 hover:bg-[#d96e1a]"
                                                : "border-[#e67e20] bg-[#fef3eb] text-[#c45a3a] cursor-pointer hover:bg-[#ffedd5] hover:border-[#c45a3a] hover:shadow"
                                            : "border-[#e5e7eb] bg-[#f4f4f5] opacity-40 cursor-not-allowed text-[#9ca3af]"
                                        }`}
                                    style={{ width: cellSize, height: cellSize }}
                                >
                                    {room ? (
                                        <>
                                            <span className="text-[0.6875rem] font-[700] leading-tight">
                                                {room.roomNumber ?? ""}
                                            </span>
                                            <span className={`text-[0.5625rem] font-[600] ${isSelected ? "text-white/90" : "text-[#888]"}`}>T{room.tier || 1}</span>
                                        </>
                                    ) : (
                                        <span className="text-[0.5312rem] text-[#9ca3af]">{row + 1},{col + 1}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Phòng đang chọn + giá tổng + Xem chi tiết (chỉ khi đã chọn phòng) */}
            {effectiveRoomTypeId && (() => {
                const selectedRoom = pet.selectedRoomId != null ? placedRooms.find((r) => r.roomId === pet.selectedRoomId) ?? null : null;
                if (!selectedRoom) return null;
                const roomDisplayName = selectedRoom.roomName?.trim() ? `${selectedRoom.roomNumber} – ${selectedRoom.roomName}` : `${selectedRoom.roomNumber} T${selectedRoom.tier ?? 1}`;
                const totalPrice = getRoomTotalPrice?.(pet, effectiveRoomTypeId) ?? null;
                return (
                    <div className="mt-4 rounded-[12px] border border-[#ffe0ce] bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[0.875rem] text-[#181818]">
                                Phòng đang chọn: <strong className="text-[#c45a3a]">{roomDisplayName}</strong>
                            </span>
                            {onViewRoomDetail && (
                                <button
                                    type="button"
                                    onClick={() => onViewRoomDetail(selectedRoom)}
                                    className="inline-flex items-center gap-2 rounded-[10px] border-2 border-[#ffbaa0] bg-[#fff7f3] px-4 py-2 text-[0.8438rem] font-[600] text-[#c45a3a] transition-colors hover:bg-[#ffbaa0] hover:text-[#181818]"
                                >
                                    Xem chi tiết
                                </button>
                            )}
                        </div>
                        {totalPrice != null && pet.numberOfNights != null && pet.numberOfNights > 0 && (
                            <div className="mt-3 border-t border-[#ffe0ce] pt-3 space-y-1">
                                <div className="text-[0.8438rem] text-[#555]">
                                    Giá 1 phòng/đêm:{" "}
                                    <strong className="text-[#c45a3a]">
                                        {Number(Math.round(totalPrice / pet.numberOfNights)).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                                <div className="text-[0.8438rem] text-[#555]">
                                    Số đêm: <strong className="text-[#c45a3a]">x{pet.numberOfNights}</strong>
                                </div>
                                <div className="text-[0.8438rem] text-[#555]">
                                    Tổng tiền:{" "}
                                    <strong className="text-[0.9375rem] text-[#c45a3a]">
                                        {Number(totalPrice).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

/** Sơ đồ chọn phòng + xem chi tiết phòng cho dịch vụ thêm có isRequiredRoom = true. */
type RoomPickerSectionForAdditionalProps = {
    pet: BookingPetForm;
    asvc: BookingPetServiceForm;
    updateAdditionalService: (petId: string, svcId: string, updates: Partial<BookingPetServiceForm>) => void;
    services: ServiceClient[];
    getAdditionalRoomTotalPrice: (asvc: BookingPetServiceForm, roomTypeId: number | null) => number | null;
    onViewRoomDetail?: (room: RoomClient) => void;
};

const RoomPickerSectionForAdditional = ({
    pet,
    asvc,
    updateAdditionalService,
    services,
    getAdditionalRoomTotalPrice,
    onViewRoomDetail,
}: RoomPickerSectionForAdditionalProps) => {
    const selectedService = services.find((s) => s.serviceId === asvc.serviceId);
    const needsRoom = selectedService?.isRequiredRoom === true;
    const hasDates = !!(asvc.pricingModel === "per_day" && asvc.dateFrom && asvc.dateTo);
    const showPicker = needsRoom && hasDates && !!asvc.serviceId;

    const { data: layoutData } = useQuery({
        queryKey: ["room-layout-config", asvc.serviceId, "IN_USE"],
        queryFn: () => getRoomLayoutConfigsByServiceId(asvc.serviceId!, "IN_USE"),
        enabled: showPicker && !!asvc.serviceId,
        select: (res) => res.data,
    });

    const layouts: RoomLayoutConfigClient[] = layoutData ?? [];
    const activeLayout = layouts[0];
    const layoutId = activeLayout?.id;

    const { data: roomsData } = useQuery({
        queryKey: ["rooms-by-layout", layoutId],
        queryFn: () => getRoomsByLayoutConfigId(layoutId!),
        enabled: showPicker && !!layoutId,
        select: (res) => res.data ?? [],
    });

    const { data: roomTypesData } = useQuery({
        queryKey: ["room-types", asvc.serviceId],
        queryFn: () => getRoomTypes(asvc.serviceId!),
        enabled: showPicker && !!asvc.serviceId,
        select: (res) => res.data ?? [],
    });

    const rooms: RoomClient[] = roomsData ?? [];
    const roomTypes: RoomTypeClient[] = (roomTypesData ?? []).filter((rt) => rt.isActive && !rt.isDeleted);
    const selectedRoomTypeId = asvc.selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;
    const effectiveRoomTypeId = selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;

    const firstRoomTypeId = roomTypes[0]?.roomTypeId;
    useEffect(() => {
        if (!showPicker || firstRoomTypeId == null || asvc.selectedRoomTypeId != null) return;
        updateAdditionalService(pet.id, asvc.id, { selectedRoomTypeId: firstRoomTypeId });
    }, [showPicker, roomTypes.length, firstRoomTypeId, pet.id, asvc.id, asvc.selectedRoomTypeId, updateAdditionalService]);

    const placedRooms = useMemo(
        () => rooms.filter((r) => r.roomLayoutConfigId === layoutId && r.gridRow != null && r.gridCol != null),
        [rooms, layoutId]
    );

    const getRoomAt = useCallback(
        (row: number, col: number) => placedRooms.find((r) => r.gridRow === row && r.gridCol === col),
        [placedRooms]
    );

    const { data: supportPhone, isLoading: supportPhoneLoading } = useQuery({
        queryKey: ["support-phone"],
        queryFn: getSupportPhone,
        enabled: showPicker,
    });

    if (!showPicker) return null;

    if (!activeLayout) {
        const hasPhone = typeof supportPhone === "string" && supportPhone.trim() !== "";
        const phoneDisplay = hasPhone
            ? supportPhone!.trim()
            : supportPhoneLoading
                ? "..."
                : "hotline cửa hàng (cấu hình tại mục Cài đặt – Trang Admin)";
        return (
            <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
                <p className="text-[0.875rem] text-[#555]">
                    Chưa có dữ liệu phòng cho dịch vụ này, vui lòng liên hệ{" "}
                    <strong>{phoneDisplay}</strong> để được hỗ trợ.
                </p>
            </div>
        );
    }

    const maxRows = activeLayout.maxRows ?? 10;
    const maxCols = activeLayout.maxCols ?? 20;

    return (
        <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
            <label className="block mb-[12px] text-[0.875rem] font-[600] text-[#181818]">Chọn phòng *</label>

            {roomTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-[12px]">
                    <span className="w-full text-[0.8125rem] text-[#888] mb-1">Chọn loại phòng:</span>
                    {roomTypes.map((rt) => {
                        const isSelected = effectiveRoomTypeId === rt.roomTypeId;
                        return (
                            <button
                                key={rt.roomTypeId}
                                type="button"
                                onClick={() => {
                                    const currentRoom = placedRooms.find((r) => r.roomId === asvc.selectedRoomId);
                                    const keepSelection = currentRoom && currentRoom.roomTypeId === rt.roomTypeId;
                                    updateAdditionalService(pet.id, asvc.id, {
                                        selectedRoomTypeId: rt.roomTypeId,
                                        selectedRoomId: keepSelection ? asvc.selectedRoomId : null,
                                    });
                                }}
                                className={`py-[10px] px-[18px] rounded-[10px] border font-[600] text-[0.8438rem] transition-colors ${isSelected
                                    ? "border-[#ffbaa0] bg-[#ffbaa0]/25 text-[#c45a3a]"
                                    : "border-[#ddd] bg-white text-[#666] hover:border-[#ffbaa0]/60 hover:bg-[#fff7f3]"
                                    }`}
                            >
                                {rt.displayTypeName ?? rt.typeName}
                            </button>
                        );
                    })}
                </div>
            )}

            {roomTypes.length > 1 && !effectiveRoomTypeId ? (
                <div className="py-[24px] text-center text-[0.875rem] text-[#888] rounded-[12px] bg-[#f9fafb] border border-dashed border-[#e5e7eb]">
                    Vui lòng chọn loại phòng ở trên để xem sơ đồ và chọn phòng.
                </div>
            ) : (
                <div className="flex justify-center overflow-x-auto py-4">
                    <div
                        className="inline-grid gap-[8px] p-4 rounded-[14px] bg-white/60 border border-[#ffe0ce] shadow-sm"
                        style={{
                            gridTemplateColumns: `repeat(${maxCols}, ${cellSize}px)`,
                            gridTemplateRows: `repeat(${maxRows}, ${cellSize}px)`,
                        }}
                    >
                        {Array.from({ length: maxRows * maxCols }, (_, i) => {
                            const row = Math.floor(i / maxCols);
                            const col = i % maxCols;
                            const room = getRoomAt(row, col);
                            const isMatchingType = room && (effectiveRoomTypeId == null ? true : room.roomTypeId === effectiveRoomTypeId);
                            const isSelected = room && asvc.selectedRoomId === room.roomId;
                            const isClickable = isMatchingType;

                            return (
                                <button
                                    key={`${row}-${col}`}
                                    type="button"
                                    disabled={!isClickable}
                                    onClick={() => {
                                        if (isClickable && room) {
                                            updateAdditionalService(pet.id, asvc.id, {
                                                selectedRoomId: isSelected ? null : room.roomId,
                                                selectedRoomTypeId: room.roomTypeId
                                            });
                                        }
                                    }}
                                    className={`flex flex-col items-center justify-center rounded-[10px] border-2 transition-all ${!room
                                        ? "border-dashed border-[#e5e7eb] bg-[#f4f4f5] cursor-default"
                                        : isMatchingType
                                            ? isSelected
                                                ? "border-[#c45a3a] bg-[#e67e20] text-white cursor-pointer shadow-md ring-2 ring-[#c45a3a] ring-offset-2 hover:bg-[#d96e1a]"
                                                : "border-[#e67e20] bg-[#fef3eb] text-[#c45a3a] cursor-pointer hover:bg-[#ffedd5] hover:border-[#c45a3a] hover:shadow"
                                            : "border-[#e5e7eb] bg-[#f4f4f5] opacity-40 cursor-not-allowed text-[#9ca3af]"
                                        }`}
                                    style={{ width: cellSize, height: cellSize }}
                                >
                                    {room ? (
                                        <>
                                            <span className="text-[0.6875rem] font-[700] leading-tight">
                                                {room.roomNumber ?? ""}
                                            </span>
                                            <span className={`text-[0.5625rem] font-[600] ${isSelected ? "text-white/90" : "text-[#888]"}`}>T{room.tier || 1}</span>
                                        </>
                                    ) : (
                                        <span className="text-[0.5312rem] text-[#9ca3af]">{row + 1},{col + 1}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {effectiveRoomTypeId && (() => {
                const selectedRoom = asvc.selectedRoomId != null ? placedRooms.find((r) => r.roomId === asvc.selectedRoomId) ?? null : null;
                if (!selectedRoom) return null;
                const roomDisplayName = selectedRoom.roomName?.trim() ? `${selectedRoom.roomNumber} – ${selectedRoom.roomName}` : `${selectedRoom.roomNumber} T${selectedRoom.tier ?? 1}`;
                const totalPrice = getAdditionalRoomTotalPrice(asvc, effectiveRoomTypeId) ?? null;
                return (
                    <div className="mt-4 rounded-[12px] border border-[#ffe0ce] bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[0.875rem] text-[#181818]">
                                Phòng đang chọn: <strong className="text-[#c45a3a]">{roomDisplayName}</strong>
                            </span>
                            {onViewRoomDetail && (
                                <button
                                    type="button"
                                    onClick={() => onViewRoomDetail(selectedRoom)}
                                    className="inline-flex items-center gap-2 rounded-[10px] border-2 border-[#ffbaa0] bg-[#fff7f3] px-4 py-2 text-[0.8438rem] font-[600] text-[#c45a3a] transition-colors hover:bg-[#ffbaa0] hover:text-[#181818]"
                                >
                                    Xem chi tiết
                                </button>
                            )}
                        </div>
                        {totalPrice != null && asvc.numberOfNights != null && asvc.numberOfNights > 0 && (
                            <div className="mt-3 border-t border-[#ffe0ce] pt-3 space-y-1">
                                <div className="text-[0.8438rem] text-[#555]">
                                    Giá 1 phòng/đêm:{" "}
                                    <strong className="text-[#c45a3a]">
                                        {Number(Math.round(totalPrice / asvc.numberOfNights)).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                                <div className="text-[0.8438rem] text-[#555]">
                                    Số đêm: <strong className="text-[#c45a3a]">x{asvc.numberOfNights}</strong>
                                </div>
                                <div className="text-[0.8438rem] text-[#555]">
                                    Tổng tiền:{" "}
                                    <strong className="text-[0.9375rem] text-[#c45a3a]">
                                        {Number(totalPrice).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

const bookingDatePickerTextFieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        minHeight: 48,
        backgroundColor: "#fff !important",
        transition: "box-shadow 150ms ease, border-color 150ms ease",
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ddd !important",
            borderWidth: "1px",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 186, 160, 0.7) !important",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffbaa0 !important",
        },
        "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(255, 186, 160, 0.2)",
        },
    },
    "& .MuiOutlinedInput-input": {
        padding: "12px 16px",
        fontSize: "0.9375rem",
        lineHeight: 1.25,
        fontWeight: 500,
        color: "#181818",
        fontFamily: "inherit",
        "&::placeholder": {
            color: "#9ca3af",
            opacity: 1,
        },
    },
    "& .MuiInputAdornment-root": {
        marginRight: "4px",
    },
    "& .MuiIconButton-root": {
        padding: "8px",
        borderRadius: "10px",
    },
    "& .MuiInputAdornment-root .MuiSvgIcon-root": {
        fontSize: 22,
        color: "#888",
    },
    "& .MuiFormHelperText-root": {
        marginLeft: 0,
        fontSize: "0.7812rem",
    },
};

const bookingDatePickerPopperSx = {
    "& .MuiPaper-root": {
        borderRadius: "14px",
        minWidth: 340,
        padding: "14px",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
        border: "1px solid rgba(0,0,0,0.06)",
    },
    "& .MuiPickersDay-root": {
        fontSize: "0.9062rem",
        width: 40,
        height: 40,
        borderRadius: "10px",
    },
    "& .MuiPickersDay-root.Mui-selected": {
        backgroundColor: "#ffbaa0",
        color: "#181818",
        fontWeight: 700,
    },
    "& .MuiDayCalendar-weekDayLabel": {
        fontSize: "0.8125rem",
        color: "#6b7280",
        fontWeight: 700,
    },
    "& .MuiPickersCalendarHeader-label": {
        fontSize: "1rem",
        fontWeight: 700,
        color: "#181818",
    },
    "& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root": {
        fontSize: 26,
    },
    "& .MuiPickersTodayButton-root, & .MuiPickersClearButton-root": {
        fontSize: "0.8125rem",
        fontWeight: 700,
    },
};

function createEmptyFoodItem(): PetFoodBroughtItemForm {
    return { foodBroughtType: "", foodBrand: "", quantity: null, feedingInstructions: "" };
}

function createEmptyPet(step1: BookingStep1FormData): BookingPetForm {
    return {
        id: crypto.randomUUID?.() ?? `pet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        petName: "",
        petType: "",
        weight: "",
        notes: "",
        emergencyContactName: step1.fullName,
        emergencyContactPhone: step1.phone,
        foodBrought: false,
        foodItems: [],
        serviceId: null,
        pricingModel: null,
        dateFrom: "",
        dateTo: "",
        numberOfNights: null,
        roomLayoutConfigId: null,
        selectedRoomTypeId: null,
        selectedRoomId: null,
        sessionDate: "",
        sessionSlot: SESSION_SLOTS[0] ?? "08:00",
        addonServiceIds: [],
        additionalServices: [],
    };
}

function createEmptyAdditionalService(): BookingPetServiceForm {
    return {
        id: crypto.randomUUID?.() ?? `svc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        serviceId: null,
        pricingModel: null,
        dateFrom: "",
        dateTo: "",
        numberOfNights: null,
        roomLayoutConfigId: null,
        selectedRoomTypeId: null,
        selectedRoomId: null,
        sessionDate: "",
        sessionSlot: SESSION_SLOTS[0] ?? "08:00",
        addonServiceIds: [],
    };
}

/** Draft form đặt lịch (để truyền qua màn chi tiết phòng và khôi phục khi quay lại). */
export type BookingDetailDraft = {
    step1Data: BookingStep1FormData;
    pets: BookingPetForm[];
};

export const BookingDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rawState = location.state as (BookingStep1FormData & { bookingDraft?: BookingDetailDraft; bookingCodeForEdit?: string }) | undefined;
    const draft = rawState?.bookingDraft;
    const step1Data: BookingStep1FormData = draft?.step1Data ?? (rawState as BookingStep1FormData) ?? defaultStep1Data;

    useEffect(() => {
        if (!step1Data.fullName?.trim() || !step1Data.phone?.trim()) {
            navigate("/dat-lich", { replace: true });
        }
    }, [step1Data.fullName, step1Data.phone, navigate]);

    const [pets, setPets] = useState<BookingPetForm[]>(() => {
        if (draft?.pets?.length) return draft.pets;
        return [createEmptyPet(step1Data)];
    });
    const [openServicePetId, setOpenServicePetId] = useState<string | null>(null);
    const [openPetTypePetId, setOpenPetTypePetId] = useState<string | null>(null);
    /** Index thú cưng đang xem (story style: chuyển qua lại bên phải) */
    const [activePetIndex, setActivePetIndex] = useState(0);
    const queryClient = useQueryClient();

    useEffect(() => {
        setActivePetIndex((i) => Math.min(i, Math.max(0, pets.length - 1)));
    }, [pets.length]);

    const { data: categoriesData } = useQuery({
        queryKey: ["service-categories-client"],
        queryFn: () => getServiceCategories(),
    });
    const { data: servicesData } = useQuery({
        queryKey: ["services-client"],
        queryFn: () => getServices(),
    });

    const categories: ServiceCategoryClient[] = categoriesData?.data ?? [];
    const services: ServiceClient[] = servicesData?.data ?? [];

    // Map serviceId -> danh sách pricing rule
    const { data: servicePricingMap } = useQuery({
        queryKey: ["service-pricings-client", services.map((s) => s.serviceId)],
        queryFn: async (): Promise<Record<number, IServicePricing[]>> => {
            const result: Record<number, IServicePricing[]> = {};
            await Promise.all(
                services.map(async (s) => {
                    try {
                        const res = await getServicePricingsByServiceId(s.serviceId);
                        result[s.serviceId] = res.data ?? [];
                    } catch {
                        result[s.serviceId] = [];
                    }
                })
            );
            return result;
        },
        enabled: services.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    const petTypeOptions = useMemo(() => {
        const result = new Set<string>();
        services.forEach((s) => {
            s.suitablePetTypes?.forEach((t) => {
                if (t) result.add(normalizePetType(t));
            });
        });
        // Nếu BE chưa trả suitablePetTypes thì fallback về hằng PET_TYPES cũ
        if (result.size === 0) {
            PET_TYPES.forEach((t) => result.add(t.value));
        }
        return Array.from(result);
    }, [services]);

    const renderPetTypeLabel = (value: string) => {
        const norm = normalizePetType(value);
        switch (norm) {
            case "dog":
                return "Chó";
            case "cat":
                return "Mèo";
            case "other":
                return "Khác";
            default:
                return value;
        }
    };

    const parseWeight = (weightStr?: string | null): number | null => {
        if (!weightStr) return null;
        const n = Number(weightStr.toString().replace(",", "."));
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    /**
     * Tìm rule giá phù hợp cho 1 dịch vụ theo cân nặng + loại thú cưng.
     * Nếu không có rule nào match thì trả về undefined.
     */
    const findMatchingPricingRule = (
        serviceId: number,
        petWeightStr?: string | null,
        petType?: string | null
    ): IServicePricing | undefined => {
        const rules = servicePricingMap?.[serviceId] ?? [];
        if (!rules.length) return undefined;

        const weight = parseWeight(petWeightStr);
        if (weight == null) return undefined;

        const petNorm = normalizePetType(petType);

        const activeRules = rules.filter((r) => r.isActive && !r.isDeleted);
        activeRules.sort((a, b) => a.priority - b.priority);

        return activeRules.find((r) => {
            const minOk = r.minWeight == null || weight >= r.minWeight;
            const maxOk = r.maxWeight == null || weight <= r.maxWeight;
            if (!minOk || !maxOk) return false;

            if (!r.suitablePetTypes || !r.suitablePetTypes.trim()) return true;
            if (!petNorm) return false;
            let list: string[] = [];
            const trimmed = r.suitablePetTypes.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                const inner = trimmed.substring(1, trimmed.length - 1).trim();
                list = inner.split(",")
                    .map(s => s.replace(/["']/g, "").trim().toLowerCase())
                    .filter(Boolean);
            } else {
                list = trimmed.split(",")
                    .map(s => s.trim().toLowerCase())
                    .filter(Boolean);
            }
            return list.includes(petNorm);
        });
    };

    const getServicePriceForWeight = (
        service: ServiceClient,
        petWeightStr?: string | null,
        petType?: string | null
    ): number | undefined => {
        const rule = findMatchingPricingRule(service.serviceId, petWeightStr, petType);
        return rule?.price;
    };

    /**
     * Tìm rule giá cho dịch vụ bắt buộc chọn phòng: ưu tiên rule có roomTypeId trùng, rồi weight/petType.
     */
    const findMatchingPricingRuleWithRoom = (
        serviceId: number,
        roomTypeId: number | null,
        petWeightStr?: string | null,
        petType?: string | null
    ): IServicePricing | undefined => {
        const rules = servicePricingMap?.[serviceId] ?? [];
        if (!rules.length) return undefined;

        const weight = parseWeight(petWeightStr);
        if (weight == null) return undefined;

        const petNorm = normalizePetType(petType);

        const activeRules = rules.filter((r) => r.isActive && !r.isDeleted);
        activeRules.sort((a, b) => a.priority - b.priority);

        const byRoom = activeRules.filter((r) => r.roomTypeId == null || r.roomTypeId === roomTypeId);
        return byRoom.find((r) => {
            const minOk = r.minWeight == null || weight >= r.minWeight;
            const maxOk = r.maxWeight == null || weight <= r.maxWeight;
            if (!minOk || !maxOk) return false;
            if (!r.suitablePetTypes || !r.suitablePetTypes.trim()) return true;
            if (!petNorm) return false;

            let list: string[] = [];
            const trimmed = r.suitablePetTypes.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                const inner = trimmed.substring(1, trimmed.length - 1).trim();
                list = inner.split(",")
                    .map(s => s.replace(/["']/g, "").trim().toLowerCase())
                    .filter(Boolean);
            } else {
                list = trimmed.split(",")
                    .map(s => s.trim().toLowerCase())
                    .filter(Boolean);
            }
            return list.includes(petNorm);
        });
    };

    /** Tổng tiền phòng = giá/đêm (theo loại phòng) × số đêm. Trả về null nếu không đủ dữ liệu. */
    const getRoomTotalPrice = (p: BookingPetForm, roomTypeId: number | null): number | null => {
        if (!p.serviceId || p.numberOfNights == null || p.numberOfNights < 1) return null;
        const rule = findMatchingPricingRuleWithRoom(p.serviceId, roomTypeId, p.weight, p.petType);
        if (rule?.price == null) return null;
        return rule.price * p.numberOfNights;
    };

    /** Tổng tiền phòng cho dịch vụ thêm (dùng weight/petType của pet). */
    const getAdditionalRoomTotalPrice = (asvc: BookingPetServiceForm, roomTypeId: number | null, pet: BookingPetForm): number | null => {
        if (!asvc.serviceId || asvc.numberOfNights == null || asvc.numberOfNights < 1) return null;
        const rule = findMatchingPricingRuleWithRoom(asvc.serviceId, roomTypeId, pet.weight, pet.petType);
        if (rule?.price == null) return null;
        return rule.price * asvc.numberOfNights;
    };

    const scrollToPet = (index: number, anchorId?: string) => {
        setActivePetIndex(Math.min(index, Math.max(0, pets.length - 1)));
        setTimeout(() => {
            if (anchorId) {
                const el = document.getElementById(anchorId);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                }
            }
            formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    const validateBeforePayment = (): boolean => {
        // 1) Kiểm tra thông tin liên hệ của khách hàng (Step 1)
        const fullName = (step1Data.fullName ?? "").trim();
        const email = (step1Data.email ?? "").trim();
        const phone = (step1Data.phone ?? "").trim();
        const address = (step1Data.address ?? "").trim();

        if (!fullName || !email || !phone || !address) {
            toast.error("Vui lòng điền đầy đủ Họ tên, Email, Số điện thoại và Địa chỉ ở phần Thông tin khách hàng.");
            // Cuộn lên phần thông tin khách hàng ở đầu trang
            window.scrollTo({ top: 0, behavior: "smooth" });
            return false;
        }

        // 2) Kiểm tra chi tiết thú cưng & dịch vụ
        const nextErrors: Record<string, PetFieldErrors> = {};
        setPetErrors({});

        for (let i = 0; i < pets.length; i++) {
            const pet = pets[i];
            const idxLabel = `thú cưng ${i + 1}`;

            if (!pet.petType.trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    petType: "Vui lòng chọn loại thú cưng.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lòng chọn loại thú cưng cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-petType`);
                return false;
            }

            if (!pet.weight?.toString().trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    weight: "Vui lòng nhập cân nặng của thú cưng.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lòng nhập cân nặng cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-weight`);
                return false;
            }

            if (!pet.petName.trim()) {
                nextErrors[pet.id] = { ...(nextErrors[pet.id] ?? {}), petName: "Vui lòng nhập tên thú cưng." };
                setPetErrors(nextErrors);
                toast.error(`Vui lòng nhập tên cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-name`);
                return false;
            }
            if (!pet.emergencyContactName?.trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    emergencyContactName: "Vui lòng nhập người liên hệ khẩn cấp.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lòng nhập người liên hệ khẩn cấp cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-emergency-name`);
                return false;
            }
            if (!pet.emergencyContactPhone?.trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    emergencyContactPhone: "Vui lòng nhập SĐT liên hệ khẩn cấp.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lòng nhập SĐT liên hệ khẩn cấp cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-emergency-phone`);
                return false;
            }

            const allServices: { base: BookingPetForm | BookingPetServiceForm; svc?: ServiceClient | undefined }[] = [];
            if (pet.serviceId != null) {
                allServices.push({ base: pet, svc: services.find((s) => s.serviceId === pet.serviceId) });
            }
            for (const asvc of pet.additionalServices ?? []) {
                if (asvc.serviceId != null) {
                    allServices.push({ base: asvc, svc: services.find((s) => s.serviceId === asvc.serviceId) });
                }
            }

            if (allServices.length === 0) {
                toast.error(`Vui lòng chọn ít nhất một dịch vụ cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-service`);
                return false;
            }

            for (let j = 0; j < allServices.length; j++) {
                const { base, svc } = allServices[j];
                const serviceLabel = `Dịch vụ ${j + 1} của ${idxLabel}`;
                const serviceKey = "id" in base ? base.id : "main";

                if (!svc) {
                    toast.error(`Vui lòng chọn ${serviceLabel}.`);
                    scrollToPet(i);
                    return false;
                }

                const isRoomRequired = svc.isRequiredRoom === true;
                if (isRoomRequired) {
                    const dateFrom = "dateFrom" in base ? base.dateFrom : (base as BookingPetServiceForm).dateFrom;
                    const dateTo = "dateTo" in base ? base.dateTo : (base as BookingPetServiceForm).dateTo;
                    const selectedRoomId =
                        "selectedRoomId" in base ? base.selectedRoomId : (base as BookingPetServiceForm).selectedRoomId;

                    if (!dateFrom || !dateTo || !dayjs(dateTo).isAfter(dayjs(dateFrom))) {
                        const petErr = nextErrors[pet.id] ?? {};
                        const svcDateErrors = { ...(petErr.serviceDateErrors ?? {}) };
                        svcDateErrors[serviceKey] = "Vui lòng chọn Ngày gửi/Ngày trả hợp lệ.";
                        nextErrors[pet.id] = { ...petErr, serviceDateErrors: svcDateErrors };
                        setPetErrors(nextErrors);

                        toast.error(`Vui lòng chọn Ngày gửi/Ngày trả hợp lệ cho ${serviceLabel}.`);
                        scrollToPet(i, `pet-${pet.id}-${serviceKey}-dates`);
                        return false;
                    }
                    if (!selectedRoomId) {
                        const petErr = nextErrors[pet.id] ?? {};
                        const svcRoomErrors = { ...(petErr.serviceRoomErrors ?? {}) };
                        svcRoomErrors[serviceKey] = "Vui lòng chọn phòng cho dịch vụ này.";
                        nextErrors[pet.id] = { ...petErr, serviceRoomErrors: svcRoomErrors };
                        setPetErrors(nextErrors);

                        toast.error(`Vui lòng chọn phòng cho ${serviceLabel}.`);
                        scrollToPet(i, `pet-${pet.id}-${serviceKey}-room`);
                        return false;
                    }
                } else {
                    const sessionDate =
                        "sessionDate" in base ? base.sessionDate : (base as BookingPetServiceForm).sessionDate;
                    const sessionTimeSlotId =
                        "sessionTimeSlotId" in base
                            ? base.sessionTimeSlotId
                            : (base as BookingPetServiceForm).sessionTimeSlotId;

                    if (!sessionDate || !sessionTimeSlotId) {
                        toast.error(`Vui lòng chọn Ngày gửi và Khung giờ cho ${serviceLabel}.`);
                        scrollToPet(i, `pet-${pet.id}-${"id" in base ? base.id : "main"}-session`);
                        return false;
                    }
                }
            }
        }
        return true;
    };

    const getServiceDisplayLabel = (pet: BookingPetForm): string => {
        if (!pet.serviceId) return "";
        const svc = services.find((s) => s.serviceId === pet.serviceId);
        if (!svc) return "";
        if (svc.isRequiredRoom === true) return svc.serviceName;
        const price = getServicePriceForWeight(svc, pet.weight, pet.petType);
        const priceText = price != null ? ` — ${Number(price).toLocaleString("vi-VN")}đ` : "";
        return `${svc.serviceName}${priceText}`;
    };

    const getCategoryByServiceId = useCallback(
        (serviceId: number): ServiceCategoryClient | undefined => {
            const svc = services.find((s) => s.serviceId === serviceId);
            if (!svc) return undefined;
            return categories.find((c) => c.categoryId === svc.serviceCategoryId);
        },
        [categories, services]
    );

    const isHotelCategory = useCallback(
        (category: ServiceCategoryClient | undefined): boolean => {
            if (!category) return false;
            const slug = (category.slug ?? "").toLowerCase();
            const name = (category.categoryName ?? "").toLowerCase();
            return (
                slug.includes("hotel") ||
                slug.includes("luu-tru") ||
                slug.includes("khach-san") ||
                slug.includes("luu tru") ||
                name.includes("lưu trú") ||
                name.includes("khách sạn") ||
                name.includes("hotel")
            );
        },
        []
    );

    const addPet = () => {
        setPets((prev) => [...prev, createEmptyPet(step1Data)]);
        setActivePetIndex((i) => i + 1);
    };
    const removePet = (id: string) => {
        if (pets.length <= 1) return;
        const idx = pets.findIndex((p) => p.id === id);
        setPets((prev) => prev.filter((p) => p.id !== id));
        setActivePetIndex((cur) => {
            if (idx < 0) return cur;
            if (cur > idx) return cur - 1;
            if (cur === idx) return Math.min(cur, Math.max(0, pets.length - 2));
            return cur;
        });
    };

    const addAdditionalService = (petId: string) => {
        setPets((prev) =>
            prev.map((p) =>
                p.id !== petId
                    ? p
                    : { ...p, additionalServices: [...(p.additionalServices ?? []), createEmptyAdditionalService()] }
            )
        );
    };

    const removeAdditionalService = (petId: string, svcId: string) => {
        setPets((prev) =>
            prev.map((p) =>
                p.id !== petId
                    ? p
                    : { ...p, additionalServices: (p.additionalServices ?? []).filter((s) => s.id !== svcId) }
            )
        );
    };

    const updateAdditionalService = (petId: string, svcId: string, updates: Partial<BookingPetServiceForm>) => {
        setPets((prev) =>
            prev.map((p) => {
                if (p.id !== petId) return p;
                const list = p.additionalServices ?? [];
                const nextList = list.map((s) => {
                    if (s.id !== svcId) return s;
                    const next = { ...s, ...updates };
                    if (updates.serviceId !== undefined) {
                        const cat = updates.serviceId != null ? getCategoryByServiceId(updates.serviceId) : null;
                        const pricingModel =
                            cat?.pricingModel === "per_day" ? "per_day" : cat?.pricingModel === "per_session" ? "per_session" : null;
                        next.pricingModel = pricingModel ?? null;
                        next.dateFrom = "";
                        next.dateTo = "";
                        next.numberOfNights = null;
                        next.roomLayoutConfigId = null;
                        next.selectedRoomTypeId = null;
                        next.selectedRoomId = null;
                        next.sessionDate = "";
                        next.sessionSlot = SESSION_SLOTS[0] ?? "08:00";
                        next.sessionTimeSlotId = undefined;
                        next.sessionSlotLabel = undefined;
                        next.addonServiceIds = [];
                    }
                    if (updates.dateFrom !== undefined || updates.dateTo !== undefined) {
                        const from = updates.dateFrom ?? next.dateFrom;
                        const to = updates.dateTo ?? next.dateTo;
                        if (from && to && dayjs(to).isAfter(dayjs(from))) {
                            next.numberOfNights = dayjs(to).diff(dayjs(from), "day");
                        } else {
                            next.numberOfNights = null;
                        }
                    }
                    return next;
                });
                return { ...p, additionalServices: nextList };
            })
        );
    };

    const updatePet = (id: string, updates: Partial<BookingPetForm>) => {
        setPets((prev) =>
            prev.map((p) => {
                if (p.id !== id) return p;
                const next = { ...p, ...updates };

                // Nếu thay đổi petType hoặc weight thì reset dịch vụ và các field phụ thuộc
                if (updates.petType !== undefined || updates.weight !== undefined) {
                    next.serviceId = null;
                    next.pricingModel = null;
                    next.dateFrom = "";
                    next.dateTo = "";
                    next.numberOfNights = null;
                    next.sessionDate = "";
                    next.sessionSlot = SESSION_SLOTS[0] ?? "08:00";
                    next.sessionTimeSlotId = undefined;
                    next.sessionSlotLabel = undefined;
                    next.foodBrought = false;
                    next.foodItems = [];
                }
                if (updates.dateFrom !== undefined || updates.dateTo !== undefined) {
                    const from = updates.dateFrom ?? next.dateFrom;
                    const to = updates.dateTo ?? next.dateTo;
                    if (from && to && dayjs(to).isAfter(dayjs(from))) {
                        next.numberOfNights = dayjs(to).diff(dayjs(from), "day");
                    } else {
                        next.numberOfNights = null;
                    }
                }
                if (updates.serviceId !== undefined) {
                    const cat = updates.serviceId != null ? getCategoryByServiceId(updates.serviceId) : null;
                    const pricingModel = cat?.pricingModel === "per_day" ? "per_day" : cat?.pricingModel === "per_session" ? "per_session" : null;
                    next.pricingModel = pricingModel ?? null;
                    if (!pricingModel) {
                        next.dateFrom = "";
                        next.dateTo = "";
                        next.numberOfNights = null;
                        next.sessionDate = "";
                        next.sessionSlot = SESSION_SLOTS[0] ?? "08:00";
                        next.sessionTimeSlotId = undefined;
                        next.sessionSlotLabel = undefined;
                    }
                    next.roomLayoutConfigId = null;
                    next.selectedRoomTypeId = null;
                    next.selectedRoomId = null;
                    if (cat && !isHotelCategory(cat)) {
                        next.foodBrought = false;
                        next.foodItems = [];
                    }
                }
                return next;
            })
        );
    };

    const formSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    const [isSubmitting] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [isBankInfoOpen, setIsBankInfoOpen] = useState(false);
    const [petErrors, setPetErrors] = useState<Record<string, PetFieldErrors>>({});

    // --- Bank info state ---
    const authUser = useAuthStore((s) => s.user);
    const isLoggedIn = !!authUser;

    const { data: banksData } = useQuery({
        queryKey: ["banks-list"],
        queryFn: getBanks,
        select: (res) => res.data ?? [],
        staleTime: 10 * 60 * 1000,
    });
    const banks: BankOption[] = banksData ?? [];

    const { data: myBankAccountsData } = useQuery({
        queryKey: ["my-bank-accounts"],
        queryFn: getMyBankInformation,
        select: (res) => res.data ?? [],
        enabled: isLoggedIn,
        staleTime: 2 * 60 * 1000,
    });
    const myBankAccounts = myBankAccountsData ?? [];

    // Bank info form state (for adding new account or guest)
    const [bankFormMode, setBankFormMode] = useState<"select" | "add-new">("select");
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
    const [bankForm, setBankForm] = useState<BankInformationPayload>({
        accountNumber: "",
        accountHolderName: "",
        bankCode: "",
        note: "",
    });

    const openBankInfoModal = () => {
        // Reset bank form when opening
        if (isLoggedIn && myBankAccounts.length > 0) {
            setBankFormMode("select");
            // Auto select default account if exists
            const defaultAcc = myBankAccounts.find((a) => a.isDefault) ?? myBankAccounts[0];
            setSelectedBankAccountId(defaultAcc?.id ?? null);
        } else {
            setBankFormMode("add-new");
            setSelectedBankAccountId(null);
        }
        setBankForm({ accountNumber: "", accountHolderName: "", bankCode: "", note: "" });
        setIsBankInfoOpen(true);
    };

    const handleProceedToPayment = async (bankPayload?: BankInformationPayload) => {
        if (!validateBeforePayment()) return;
        setIsHolding(true);
        try {
            const payload = buildCreateBookingPayload(step1Data, pets);
            // Attach bank info if provided (guest or newly added)
            const finalPayload = bankPayload
                ? { ...payload, bankInformation: bankPayload }
                : payload;
            const res = await createBookingDepositIntent(finalPayload);
            if (res?.success && res?.data?.depositId && res?.data?.bookingCode) {
                toast.success("Đơn đặt lịch của bạn đã được xác nhận, vui lòng thanh toán cọc để giữ chỗ.");
                navigate(`/dat-lich/chi-tiet-don/${res.data.bookingCode}`, {
                    replace: true,
                    state: { openPayment: true }
                });
                return;
            }
            toast.error(res?.message ?? "Không thể giữ chỗ. Vui lòng thử lại.");
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { message?: string; data?: { errorCode?: string; petIndex?: number; serviceIndex?: number; roomId?: number } } } })?.response?.data;
            const message = data?.message ?? (err instanceof Error ? err.message : "Không thể giữ chỗ. Vui lòng thử lại.");
            const errorData = data?.data;
            toast.error(message);

            if (errorData?.errorCode) {
                const petIndex = typeof errorData.petIndex === "number" ? errorData.petIndex : 0;
                setActivePetIndex(Math.min(petIndex, Math.max(0, pets.length - 1)));
                setTimeout(() => {
                    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
                if (errorData.errorCode === "TIME_SLOT_FULL") {
                    queryClient.invalidateQueries({ queryKey: ["time-slots-main"] });
                    queryClient.invalidateQueries({ queryKey: ["time-slots"] });
                }
                if (errorData.errorCode === "ROOM_ALREADY_BOOKED" && errorData.roomId) {
                    queryClient.invalidateQueries({ queryKey: ["rooms-by-layout"] });
                    queryClient.invalidateQueries({ queryKey: ["room-layout-config"] });
                }
            }
        } finally {
            setIsHolding(false);
            setIsBankInfoOpen(false);
        }
    };

    const handleBankInfoConfirm = async () => {
        if (isLoggedIn && bankFormMode === "select") {
            // Logged-in user selected an existing account — no need to send bankPayload
            await handleProceedToPayment();
        } else {
            // Guest or adding new: validate form
            if (!bankForm.accountNumber.trim()) {
                toast.error("Vui lòng nhập số tài khoản.");
                return;
            }
            if (!bankForm.accountHolderName.trim()) {
                toast.error("Vui lòng nhập tên chủ tài khoản.");
                return;
            }
            if (!bankForm.bankCode) {
                toast.error("Vui lòng chọn ngân hàng.");
                return;
            }
            await handleProceedToPayment(bankForm);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <>
                <div className="relative">
                    <div className="app-container flex py-[100px] bg-white">
                        <div className="px-[20px] w-[42%] z-[10]">
                            <p className="uppercase text-client-secondary text-[1.0625rem] font-[700] mb-[15px]">
                                {rawState?.bookingCodeForEdit ? "Chỉnh sửa đơn đặt lịch" : "Đặt lịch chi tiết"}
                            </p>
                            <h2 className="text-[3.125rem] text-[#181818] leading-[1.2] font-third mb-[20px]">
                                Thông tin lịch hẹn cho thú cưng
                            </h2>
                            {rawState?.bookingCodeForEdit && (
                                <p className="mt-[8px] text-[0.9375rem] text-[#c45a3a] font-[600]">
                                    Mã đặt lịch: <span className="font-[800]">{rawState.bookingCodeForEdit}</span>
                                </p>
                            )}
                            <p className="text-[#505050] font-[500] text-[1.125rem] inline-block mt-[15px]">
                                Thêm thú cưng, chọn dịch vụ và thời gian phù hợp với từng loại hình dịch vụ.
                            </p>
                        </div>
                    </div>
                    <img
                        className="absolute right-[0%] max-w-[58%] top-[-20%] 2xl:top-[-17%]"
                        src="https://pawsitive.bold-themes.com/coco/wp-content/uploads/sites/3/2019/08/hero_image_13-1.png"
                        alt=""
                    />
                </div>

                <div ref={formSectionRef} className="app-container flex py-[60px] gap-[48px] justify-center">
                    <aside className="w-[320px] shrink-0 hidden lg:block">
                        <h2 className="text-[1.5rem] font-third text-[#181818] mb-[24px]">Thông tin</h2>
                        <div className="space-y-[20px]">
                            <div className="flex gap-3">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#afe2e5]/40 flex items-center justify-center shrink-0">
                                    <EditLocationAltIcon sx={{ fontSize: 22, color: "#0d7c82" }} />
                                </div>
                                <div>
                                    <div className="font-[700] text-[#181818] text-[0.9375rem]">Địa điểm</div>
                                    <p className="text-[#505050] text-[0.875rem]">64 Ung Văn Khiêm, Pleiku, Gia Lai</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#cfecbc]/40 flex items-center justify-center shrink-0">
                                    <ScheduleIcon sx={{ fontSize: 22, color: "#2e7d32" }} />
                                </div>
                                <div>
                                    <div className="font-[700] text-[#181818] text-[0.9375rem]">Giờ làm việc</div>
                                    <p className="text-[#505050] text-[0.875rem]">T2 - T7: 7:00 - 16:00</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#ffbaa0]/30 flex items-center justify-center shrink-0">
                                    <RocketLaunchIcon sx={{ fontSize: 22, color: "#c45a3a" }} />
                                </div>
                                <div>
                                    <div className="font-[700] text-[#181818] text-[0.9375rem]">Chăm sóc di động</div>
                                    <p className="text-[#505050] text-[0.875rem]">Theo dõi qua camera trên điện thoại.</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="w-full max-w-[800px]">
                        {/* ========== PHẦN 1: Thông tin cơ bản khách ========== */}
                        <section className="mb-[40px]">
                            <div className="flex items-center gap-2 mb-[16px]">
                                <span className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffbaa0] text-[#181818] font-[700] text-[0.875rem]">1</span>
                                <h3 className="text-[1.25rem] font-[700] text-[#181818]">Thông tin khách hàng</h3>
                            </div>
                            <div className="bg-white rounded-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#eee] overflow-hidden">
                                <div className="bg-gradient-to-r from-[#ffbaa0]/12 to-[#e67e2010] px-[24px] py-[16px] border-b border-[#eee] flex items-center gap-3">
                                    <PersonOutlineOutlinedIcon sx={{ fontSize: 26, color: "#c45a3a" }} />
                                    <span className="text-[1rem] font-[600] text-[#181818]">Thông tin liên hệ</span>
                                </div>
                                <div className="p-[24px] grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[16px] text-[0.9375rem]">
                                    <div>
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Họ và tên</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.fullName || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Email</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.email || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Số điện thoại</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.phone || "—"}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Địa chỉ</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.address || "—"}</span>
                                    </div>
                                    {step1Data.message ? (
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Lời nhắn</span>
                                            <span className="text-[#181818] font-[500]">{step1Data.message}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {/* ========== PHẦN 2: Số lượng thú cưng + thông tin từng thú + dịch vụ + ngày/slot ========== */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <section className="mb-[40px]">
                                <div className="flex items-center justify-between gap-4 mb-[16px]">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffbaa0] text-[#181818] font-[700] text-[0.875rem]">2</span>
                                        <h3 className="text-[1.25rem] font-[700] text-[#181818]">Thú cưng & dịch vụ</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addPet}
                                        className="flex items-center gap-2 py-[10px] px-[20px] rounded-[12px] bg-[#ffbaa0]/20 text-[#c45a3a] font-[600] text-[0.875rem] hover:bg-[#ffbaa0]/35 transition-colors"
                                    >
                                        <AddIcon sx={{ fontSize: 20 }} /> Thêm thú cưng
                                    </button>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Hiển thị 3 tab thú cưng, tab đang xem ở giữa và nổi bật; chuyển bằng 2 nút mũi tên */}
                                    <div className="flex items-center justify-center gap-2 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setActivePetIndex((i) => Math.max(0, i - 1))}
                                            disabled={activePetIndex === 0 || pets.length <= 1}
                                            className="w-11 h-11 rounded-full border-2 border-[#eee] bg-white shadow-sm flex items-center justify-center text-[#181818] disabled:opacity-40 disabled:pointer-events-none hover:border-[#ffbaa0] hover:bg-[#fff7f3] transition-all duration-300 ease-out shrink-0"
                                            aria-label="Thú cưng trước"
                                        >
                                            <span className="text-[1.375rem] leading-none font-light">‹</span>
                                        </button>
                                        <div className="flex items-center gap-2 transition-all duration-300 ease-out">
                                            {(() => {
                                                const total = pets.length;
                                                const showCount = Math.min(3, total);
                                                const start = Math.max(0, Math.min(activePetIndex - 1, total - showCount));
                                                const indices = Array.from({ length: showCount }, (_, i) => start + i);
                                                return indices.map((idx) => {
                                                    const pet = pets[idx];
                                                    const isActive = idx === activePetIndex;
                                                    return (
                                                        <button
                                                            key={pet.id}
                                                            type="button"
                                                            onClick={() => setActivePetIndex(idx)}
                                                            className={`flex items-center gap-2 rounded-[12px] border-2 px-3 py-2.5 text-left min-w-[100px] max-w-[140px] transition-all duration-300 ease-out ${isActive
                                                                ? "border-[#ffbaa0] bg-[#fff7f3] shadow-md scale-105 ring-2 ring-[#ffbaa0]/40"
                                                                : "border-[#eee] bg-white hover:border-[#ffbaa0]/60 hover:bg-[#fafafa] hover:scale-[1.02]"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-300 ease-out ${isActive ? "bg-[#ffbaa0]/50 text-[#c45a3a]" : "bg-[#f0f0f0] text-[#888]"
                                                                    }`}
                                                            >
                                                                <PetsIcon sx={{ fontSize: 18 }} />
                                                            </span>
                                                            <span className={`truncate transition-all duration-300 ease-out ${isActive ? "text-[0.875rem] font-[700] text-[#181818]" : "text-[0.8125rem] font-[500] text-[#555]"}`}>
                                                                {pet.petName.trim() || `Thú cưng ${idx + 1}`}
                                                            </span>
                                                            {total > 1 && (
                                                                <span className={`shrink-0 text-[0.6875rem] transition-all duration-300 ease-out ${isActive ? "font-[600] text-[#c45a3a]" : "font-[500] text-[#999]"}`}>
                                                                    {idx + 1}/{total}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActivePetIndex((i) => Math.min(pets.length - 1, i + 1))}
                                            disabled={activePetIndex === pets.length - 1 || pets.length <= 1}
                                            className="w-11 h-11 rounded-full border-2 border-[#eee] bg-white shadow-sm flex items-center justify-center text-[#181818] disabled:opacity-40 disabled:pointer-events-none hover:border-[#ffbaa0] hover:bg-[#fff7f3] transition-all duration-300 ease-out shrink-0"
                                            aria-label="Thú cưng sau"
                                        >
                                            <span className="text-[1.375rem] leading-none font-light">›</span>
                                        </button>
                                    </div>

                                    {/* Form thú cưng đang chọn (chỉ 1 card hiển thị, chuyển qua lại như story) */}
                                    <div className="flex-1 min-w-0 relative">
                                        {pets.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePetIndex((i) => Math.max(0, i - 1))}
                                                    disabled={activePetIndex === 0}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow border border-[#eee] flex items-center justify-center text-[#181818] disabled:opacity-40 disabled:pointer-events-none hover:bg-[#fff7f3] -translate-x-1/2 lg:translate-x-0"
                                                    aria-label="Thú cưng trước"
                                                >
                                                    <span className="text-[1.25rem] leading-none">‹</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePetIndex((i) => Math.min(pets.length - 1, i + 1))}
                                                    disabled={activePetIndex === pets.length - 1}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow border border-[#eee] flex items-center justify-center text-[#181818] disabled:opacity-40 disabled:pointer-events-none hover:bg-[#fff7f3] translate-x-1/2 lg:translate-x-0"
                                                    aria-label="Thú cưng sau"
                                                >
                                                    <span className="text-[1.25rem] leading-none">›</span>
                                                </button>
                                            </>
                                        )}
                                        {pets.map((pet, index) => index !== activePetIndex ? null : (
                                            <div key={pet.id} className="booking-pet-card-enter">
                                                <div
                                                    className="bg-white rounded-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#eee]"
                                                >
                                                    <div className="bg-[#f8f9fa] px-[24px] py-[14px] border-b border-[#eee] flex items-center justify-between flex-wrap gap-2">
                                                        <span className="flex items-center gap-2 text-[0.9375rem] font-[600] text-[#181818]">
                                                            <PetsIcon sx={{ fontSize: 22, color: "#c45a3a" }} />
                                                            {pet.petName.trim() || `Thú cưng ${index + 1}`}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {pets.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePet(pet.id)}
                                                                    className="p-[6px] rounded-[8px] text-[#888] hover:bg-[#eee] hover:text-[#e53935] transition-colors"
                                                                    aria-label="Xóa thú cưng"
                                                                >
                                                                    <DeleteOutlineIcon sx={{ fontSize: 22 }} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="p-[24px] space-y-[24px] overflow-visible">
                                                        {/* Thông tin thú cưng */}
                                                        <div className="space-y-[16px]">
                                                            {/* Row 1: Tên thú cưng + Loại (ngang hàng) */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Tên thú cưng *</label>
                                                                    {(() => {
                                                                        const err = petErrors[pet.id]?.petName;
                                                                        return err ? (
                                                                            <p className="mb-[4px] text-[0.75rem] text-[#ef4444]">{err}</p>
                                                                        ) : null;
                                                                    })()}
                                                                    <input
                                                                        id={`pet-${pet.id}-name`}
                                                                        type="text"
                                                                        value={pet.petName}
                                                                        onChange={(e) => updatePet(pet.id, { petName: e.target.value })}
                                                                        placeholder="Ví dụ: Milu"
                                                                        required
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Loại *</label>
                                                                    {(() => {
                                                                        const err = petErrors[pet.id]?.petType;
                                                                        return err ? (
                                                                            <p className="mb-[4px] text-[0.75rem] text-[#ef4444]">{err}</p>
                                                                        ) : null;
                                                                    })()}
                                                                    <PetTypeDropdown
                                                                        // anchor id for scroll
                                                                        // @ts-ignore
                                                                        id={`pet-${pet.id}-petType`}
                                                                        isOpen={openPetTypePetId === pet.id}
                                                                        value={pet.petType}
                                                                        options={petTypeOptions}
                                                                        renderLabel={renderPetTypeLabel}
                                                                        onToggle={() => setOpenPetTypePetId((prev) => (prev === pet.id ? null : pet.id))}
                                                                        onChange={(nextType) => {
                                                                            setOpenPetTypePetId(null);
                                                                            updatePet(pet.id, { petType: nextType });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Cân nặng + Liên hệ khẩn cấp + SĐT khẩn cấp */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Cân nặng (kg)</label>
                                                                    {(() => {
                                                                        const err = petErrors[pet.id]?.weight;
                                                                        return err ? (
                                                                            <p className="mb-[4px] text-[0.75rem] text-[#ef4444]">{err}</p>
                                                                        ) : null;
                                                                    })()}
                                                                    <input
                                                                        id={`pet-${pet.id}-weight`}
                                                                        type="text"
                                                                        value={pet.weight}
                                                                        onChange={(e) => updatePet(pet.id, { weight: e.target.value })}
                                                                        placeholder="Ví dụ: 5"
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Liên hệ khẩn cấp</label>
                                                                    {(() => {
                                                                        const err = petErrors[pet.id]?.emergencyContactName;
                                                                        return err ? (
                                                                            <p className="mb-[4px] text-[0.75rem] text-[#ef4444]">{err}</p>
                                                                        ) : null;
                                                                    })()}
                                                                    <input
                                                                        id={`pet-${pet.id}-emergency-name`}
                                                                        type="text"
                                                                        value={pet.emergencyContactName ?? ""}
                                                                        onChange={(e) => updatePet(pet.id, { emergencyContactName: e.target.value })}
                                                                        placeholder="Họ tên người liên hệ"
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">SĐT khẩn cấp</label>
                                                                    {(() => {
                                                                        const err = petErrors[pet.id]?.emergencyContactPhone;
                                                                        return err ? (
                                                                            <p className="mb-[4px] text-[0.75rem] text-[#ef4444]">{err}</p>
                                                                        ) : null;
                                                                    })()}
                                                                    <input
                                                                        id={`pet-${pet.id}-emergency-phone`}
                                                                        type="tel"
                                                                        value={pet.emergencyContactPhone ?? ""}
                                                                        onChange={(e) => updatePet(pet.id, { emergencyContactPhone: e.target.value })}
                                                                        placeholder="Số điện thoại"
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Row 3: Ghi chú */}
                                                            <div>
                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ghi chú (bệnh, dị ứng...)</label>
                                                                <input
                                                                    type="text"
                                                                    value={pet.notes}
                                                                    onChange={(e) => updatePet(pet.id, { notes: e.target.value })}
                                                                    placeholder="Tùy chọn"
                                                                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Chọn dịch vụ + các tuỳ chọn phụ thuộc */}
                                                        <div className="mt-[8px]">
                                                            <ServiceSelectField
                                                                label="Chọn dịch vụ *"
                                                                displayValue={getServiceDisplayLabel(pet) || "— Chọn dịch vụ —"}
                                                                disabled={!pet.weight || !pet.petType}
                                                                disabledPlaceholder="Vui lòng chọn loại thú cưng và cân nặng trước"
                                                                isOpen={openServicePetId === pet.id}
                                                                onToggle={() => setOpenServicePetId((prev) => (prev === pet.id ? null : pet.id))}
                                                                dropdownContent={
                                                                    openServicePetId === pet.id && pet.weight && pet.petType ? (
                                                                        <div className="py-[8px]">
                                                                            {categories.map((cat) => {
                                                                                const catServices = services.filter((s) => {
                                                                                    if (s.serviceCategoryId !== cat.categoryId || !s.isActive)
                                                                                        return false;
                                                                                    // Không cho chọn dịch vụ add-on / additional charge ở phần dịch vụ chính
                                                                                    if (s.isAddon === true || s.isAdditionalCharge === true) return false;
                                                                                    const petTypeNorm = normalizePetType(pet.petType);
                                                                                    const serviceSupportsPetType =
                                                                                        !s.suitablePetTypes || s.suitablePetTypes.length === 0
                                                                                            ? true
                                                                                            : s.suitablePetTypes.some(
                                                                                                (t) => normalizePetType(t) === petTypeNorm
                                                                                            );
                                                                                    if (!serviceSupportsPetType) return false;
                                                                                    const matchedRule = findMatchingPricingRule(
                                                                                        s.serviceId,
                                                                                        pet.weight,
                                                                                        pet.petType
                                                                                    );
                                                                                    return !!matchedRule;
                                                                                });
                                                                                if (catServices.length === 0) return null;
                                                                                return (
                                                                                    <div key={cat.categoryId} className="px-[12px] py-[6px]">
                                                                                        <div className="text-[0.8125rem] font-[600] text-[#6b7280] mb-[4px]">
                                                                                            {cat.categoryName}
                                                                                        </div>
                                                                                        <div className="space-y-[4px]">
                                                                                            {catServices.map((s) => {
                                                                                                const price = getServicePriceForWeight(s, pet.weight, pet.petType);
                                                                                                const isSelected = pet.serviceId === s.serviceId;
                                                                                                return (
                                                                                                    <button
                                                                                                        key={s.serviceId}
                                                                                                        type="button"
                                                                                                        onClick={() => {
                                                                                                            updatePet(pet.id, { serviceId: s.serviceId });
                                                                                                            setOpenServicePetId(null);
                                                                                                        }}
                                                                                                        className={`w-full text-left rounded-[10px] px-[10px] py-[8px] border transition-colors ${isSelected
                                                                                                            ? "border-[#ffbaa0] bg-[#fff7f3]"
                                                                                                            : "border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3]"
                                                                                                            }`}
                                                                                                    >
                                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                                            <span className="text-[0.9062rem] font-[600] text-[#181818]">{s.serviceName}</span>
                                                                                                            {s.isRequiredRoom !== true && price != null && (
                                                                                                                <span className="text-[0.875rem] font-[600] text-[#c45a3a] whitespace-nowrap">
                                                                                                                    {Number(price).toLocaleString("vi-VN")}đ{" "}
                                                                                                                    <span className="text-[0.7812rem] font-[600] text-[#888]">(Dự kiến)</span>
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </button>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : null
                                                                }
                                                            />
                                                        </div>

                                                        {/* Dịch vụ add-on kèm theo: luôn hiển thị ô input khi đã chọn dịch vụ chính; add-on cùng category với dịch vụ đang chọn */}
                                                        {pet.serviceId && (() => {
                                                            const currentService = services.find((s) => s.serviceId === pet.serviceId);
                                                            const categoryId = currentService?.serviceCategoryId;
                                                            const addonServices = services.filter(
                                                                (s) =>
                                                                    s.isAddon === true &&
                                                                    s.serviceId !== pet.serviceId &&
                                                                    s.isActive &&
                                                                    (categoryId == null || s.serviceCategoryId === categoryId)
                                                            );
                                                            const selectedIds = pet.addonServiceIds ?? [];
                                                            const availableToAdd = addonServices.filter((s) => !selectedIds.includes(s.serviceId));
                                                            const selectedServices = selectedIds
                                                                .map((id) => services.find((s) => s.serviceId === id))
                                                                .filter((s): s is ServiceClient => s != null);
                                                            return (
                                                                <div className="mt-4 p-4 rounded-[12px] border border-[#ffe0ce] bg-[#fffbf9]">
                                                                    <label className="block mb-3 text-[0.875rem] font-[600] text-[#181818]">Dịch vụ add-on kèm theo (tùy chọn)</label>
                                                                    {selectedServices.length > 0 && (
                                                                        <div className="mb-3 flex flex-wrap gap-2">
                                                                            {selectedServices.map((s) => {
                                                                                const price = getServicePriceForWeight(s, pet.weight, pet.petType);
                                                                                return (
                                                                                    <span
                                                                                        key={s.serviceId}
                                                                                        className="inline-flex items-center gap-2 rounded-[10px] border border-[#ffbaa0] bg-[#fff7f3] px-3 py-2 text-[0.8438rem] font-[500] text-[#181818]"
                                                                                    >
                                                                                        <span>
                                                                                            {s.serviceName}
                                                                                            {price != null && (
                                                                                                <span className="ml-2 text-[0.8125rem] font-[600] text-[#c45a3a]">
                                                                                                    {Number(price).toLocaleString("vi-VN")}đ
                                                                                                </span>
                                                                                            )}
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                updatePet(pet.id, {
                                                                                                    addonServiceIds: selectedIds.filter(
                                                                                                        (id) => id !== s.serviceId
                                                                                                    ),
                                                                                                })
                                                                                            }
                                                                                            className="p-0.5 rounded hover:bg-[#ffbaa0]/40 text-[#888] hover:text-[#e53935] transition-colors duration-200"
                                                                                            aria-label="Xóa"
                                                                                        >
                                                                                            ×
                                                                                        </button>
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                    {availableToAdd.length > 0 ? (
                                                                        <div className="space-y-[4px]">
                                                                            {availableToAdd.map((s) => {
                                                                                const price = getServicePriceForWeight(s, pet.weight, pet.petType);
                                                                                const isSelected = selectedIds.includes(s.serviceId);
                                                                                return (
                                                                                    <button
                                                                                        key={s.serviceId}
                                                                                        type="button"
                                                                                        disabled={isSelected}
                                                                                        onClick={() => {
                                                                                            if (!isSelected) {
                                                                                                updatePet(pet.id, {
                                                                                                    addonServiceIds: [...selectedIds, s.serviceId],
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        className={`w-full text-left rounded-[10px] px-[10px] py-[8px] border transition-colors ${isSelected
                                                                                            ? "border-[#ffbaa0] bg-[#fff7f3] text-[#999] cursor-default"
                                                                                            : "border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3]"
                                                                                            }`}
                                                                                    >
                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                            <span className="text-[0.875rem] font-[600] text-[#181818]">
                                                                                                {s.serviceName}
                                                                                            </span>
                                                                                            {price != null && (
                                                                                                <span className="text-[0.8438rem] font-[600] text-[#c45a3a] whitespace-nowrap">
                                                                                                    {Number(price).toLocaleString("vi-VN")}đ
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[0.8438rem] text-[#888] py-2">
                                                                            {addonServices.length === 0
                                                                                ? "Không có dịch vụ add-on cho nhóm này."
                                                                                : "Đã chọn hết dịch vụ add-on khả dụng."}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Mang theo thức ăn (danh sách mục → bảng PetFoodBrought) */}
                                                        {pet.serviceId && isHotelCategory(getCategoryByServiceId(pet.serviceId)) && (
                                                            <div className="mt-[16px] space-y-[20px]">
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Mang theo thức ăn</label>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const hasFood = (pet.foodItems?.length ?? 0) > 0;
                                                                                updatePet(pet.id, {
                                                                                    foodBrought: true,
                                                                                    foodItems: hasFood ? pet.foodItems : [createEmptyFoodItem()],
                                                                                });
                                                                            }}
                                                                            className={`py-[12px] px-[24px] rounded-[10px] font-[600] text-[0.9375rem] transition-colors ${(pet.foodItems?.length ?? 0) > 0
                                                                                ? "bg-[#ffbaa0] text-[#181818] border-2 border-[#ffbaa0]"
                                                                                : "bg-white text-[#888] border-2 border-[#ddd] hover:border-[#ffbaa0]/50"
                                                                                }`}
                                                                        >
                                                                            Có
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePet(pet.id, { foodBrought: false, foodItems: [] })}
                                                                            className={`py-[12px] px-[24px] rounded-[10px] font-[600] text-[0.9375rem] transition-colors ${(pet.foodItems?.length ?? 0) === 0
                                                                                ? "bg-[#ffbaa0] text-[#181818] border-2 border-[#ffbaa0]"
                                                                                : "bg-white text-[#888] border-2 border-[#ddd] hover:border-[#ffbaa0]/50"
                                                                                }`}
                                                                        >
                                                                            Không
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {(pet.foodItems?.length ?? 0) > 0 && (
                                                                    <div className="space-y-[16px]">
                                                                        {(pet.foodItems ?? []).map((item, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="p-[16px] rounded-[12px] border border-[#eee] bg-[#fafafa] space-y-[12px]"
                                                                            >
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <span className="text-[0.8438rem] font-[600] text-[#555]">Mục thức ăn {pet.foodItems!.length > 1 ? idx + 1 : ""}</span>
                                                                                    {pet.foodItems!.length > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const next = pet.foodItems!.filter((_, i) => i !== idx);
                                                                                                updatePet(pet.id, { foodItems: next });
                                                                                            }}
                                                                                            className="p-[6px] rounded-[8px] text-[#888] hover:bg-[#eee] hover:text-[#e53935] transition-colors"
                                                                                            aria-label="Xóa mục"
                                                                                        >
                                                                                            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block mb-[6px] text-[0.8438rem] font-[600] text-[#181818]">Loại thức ăn mang theo</label>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {FOOD_TYPE_OPTIONS.map((opt) => {
                                                                                            const selected = (item.foodBroughtType ?? "") === opt.value;
                                                                                            return (
                                                                                                <button
                                                                                                    key={opt.value}
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        const next = [...(pet.foodItems ?? [])];
                                                                                                        const usedBrands = buildUsedBrandKeysForType(next, idx, opt.value);
                                                                                                        const currentBrandKey =
                                                                                                            next[idx]?.foodBrand == null
                                                                                                                ? OTHER_BRAND_VALUE
                                                                                                                : (next[idx]?.foodBrand ?? "").toString().trim();
                                                                                                        const shouldClearBrand = !!currentBrandKey && usedBrands.has(currentBrandKey);
                                                                                                        const prevBrand = next[idx]?.foodBrand ?? "";
                                                                                                        next[idx] = {
                                                                                                            ...next[idx],
                                                                                                            foodBroughtType: opt.value,
                                                                                                            foodBrand: shouldClearBrand ? "" : prevBrand,
                                                                                                        };
                                                                                                        updatePet(pet.id, { foodItems: next });
                                                                                                    }}
                                                                                                    className={`py-[10px] px-[18px] rounded-[999px] text-[0.875rem] font-[600] border-2 transition-colors ${selected ? "bg-[#ffbaa0] text-[#181818] border-[#ffbaa0]" : "bg-white text-[#888] border-[#ddd] hover:border-[#ffbaa0]/60"
                                                                                                        }`}
                                                                                                >
                                                                                                    {opt.label}
                                                                                                </button>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                                                                                    <div>
                                                                                        <label className="block mb-[4px] text-[0.8125rem] font-[500] text-[#555]">Nhãn hiệu</label>
                                                                                        <FoodBrandSelect
                                                                                            petTypeEnum={toPetTypeEnum(pet.petType)}
                                                                                            value={item.foodBrand}
                                                                                            foodType={item.foodBroughtType ?? ""}
                                                                                            items={pet.foodItems ?? []}
                                                                                            itemIndex={idx}
                                                                                            onChange={(nextBrand) => {
                                                                                                const next = [...(pet.foodItems ?? [])];
                                                                                                next[idx] = { ...next[idx], foodBrand: nextBrand };
                                                                                                updatePet(pet.id, { foodItems: next });
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="block mb-[4px] text-[0.8125rem] font-[500] text-[#555]">Số lượng</label>
                                                                                        <input
                                                                                            type="number"
                                                                                            min={0}
                                                                                            value={item.quantity ?? ""}
                                                                                            onChange={(e) => {
                                                                                                const v = e.target.value;
                                                                                                const next = [...(pet.foodItems ?? [])];
                                                                                                next[idx] = { ...next[idx], quantity: v === "" ? null : Number(v) };
                                                                                                updatePet(pet.id, { foodItems: next });
                                                                                            }}
                                                                                            placeholder="Tùy chọn"
                                                                                            className="input-booking w-full py-[10px] px-[14px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] outline-none text-[0.875rem]"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block mb-[4px] text-[0.8125rem] font-[500] text-[#555]">Hướng dẫn cho ăn</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.feedingInstructions ?? ""}
                                                                                        onChange={(e) => {
                                                                                            const next = [...(pet.foodItems ?? [])];
                                                                                            next[idx] = { ...next[idx], feedingInstructions: e.target.value };
                                                                                            updatePet(pet.id, { foodItems: next });
                                                                                        }}
                                                                                        placeholder="Ví dụ: 2 bữa/ngày, mỗi bữa 200g"
                                                                                        className="input-booking w-full py-[10px] px-[14px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] outline-none text-[0.875rem]"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePet(pet.id, { foodItems: [...(pet.foodItems ?? []), createEmptyFoodItem()] })}
                                                                            className="flex items-center gap-2 py-[10px] px-[20px] rounded-[10px] bg-[#ffbaa0]/20 text-[#c45a3a] font-[600] text-[0.875rem] hover:bg-[#ffbaa0]/35 transition-colors"
                                                                        >
                                                                            <AddIcon sx={{ fontSize: 20 }} /> Thêm mục thức ăn
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Theo pricingModel: per_day hoặc per_session */}
                                                        {pet.pricingModel === "per_day" && (
                                                            <div
                                                                id={`pet-${pet.id}-main-dates`}
                                                                className="p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce] scroll-mt-[120px]"
                                                            >
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                    <div>
                                                                        <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày gửi *</label>
                                                                        <DatePicker
                                                                            value={pet.dateFrom ? dayjs(pet.dateFrom) : null}
                                                                            onChange={(d: Dayjs | null) => {
                                                                                const next = d ? d.format("YYYY-MM-DD") : "";
                                                                                const updates: Partial<BookingPetForm> = { dateFrom: next };
                                                                                if (pet.dateTo && next && !dayjs(pet.dateTo).isAfter(dayjs(next))) {
                                                                                    updates.dateTo = "";
                                                                                }
                                                                                updatePet(pet.id, updates);
                                                                            }}
                                                                            format="DD/MM/YYYY"
                                                                            slotProps={{
                                                                                textField: {
                                                                                    placeholder: "DD/MM/YYYY",
                                                                                    required: true,
                                                                                    fullWidth: true,
                                                                                    color: "warning",
                                                                                    sx: bookingDatePickerTextFieldSx,
                                                                                },
                                                                                popper: { sx: bookingDatePickerPopperSx },
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày trả *</label>
                                                                        <DatePicker
                                                                            value={pet.dateTo ? dayjs(pet.dateTo) : null}
                                                                            onChange={(d: Dayjs | null) => updatePet(pet.id, { dateTo: d ? d.format("YYYY-MM-DD") : "" })}
                                                                            format="DD/MM/YYYY"
                                                                            minDate={pet.dateFrom ? dayjs(pet.dateFrom).add(1, "day") : undefined}
                                                                            slotProps={{
                                                                                textField: {
                                                                                    placeholder: "DD/MM/YYYY",
                                                                                    required: true,
                                                                                    fullWidth: true,
                                                                                    color: "warning",
                                                                                    sx: bookingDatePickerTextFieldSx,
                                                                                    helperText:
                                                                                        pet.dateFrom && !pet.dateTo
                                                                                            ? "Ngày trả phải sau ngày gửi (ít nhất 1 đêm)"
                                                                                            : undefined,
                                                                                },
                                                                                popper: { sx: bookingDatePickerPopperSx },
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {pet.numberOfNights != null && pet.numberOfNights > 0 && (
                                                                    <p className="mt-3 text-[0.875rem] font-[600] text-[#c45a3a]">
                                                                        Số đêm: {pet.numberOfNights} đêm
                                                                    </p>
                                                                )}
                                                                {petErrors[pet.id]?.serviceDateErrors?.main && (
                                                                    <p className="mt-2 text-[0.75rem] text-[#ef4444]">
                                                                        {petErrors[pet.id]?.serviceDateErrors?.main}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {pet.pricingModel === "per_day" && (
                                                            <>
                                                                <RoomPickerSection
                                                                    // container id for scroll to room
                                                                    // @ts-ignore
                                                                    id={`pet-${pet.id}-main-room`}
                                                                    pet={pet}
                                                                    updatePet={updatePet}
                                                                    services={services}
                                                                    getRoomTotalPrice={getRoomTotalPrice}
                                                                    onViewRoomDetail={(room) =>
                                                                        navigate(`/dat-lich/phong/${room.roomId}`, {
                                                                            state: {
                                                                                fromBooking: true,
                                                                                room,
                                                                                bookingDraft: { step1Data, pets },
                                                                            },
                                                                        })
                                                                    }
                                                                />
                                                                {petErrors[pet.id]?.serviceRoomErrors?.main && (
                                                                    <p className="mt-2 text-[0.75rem] text-[#ef4444]">
                                                                        {petErrors[pet.id]?.serviceRoomErrors?.main}
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}

                                                        <MainServiceNonRoomFields
                                                            pet={pet}
                                                            updatePet={updatePet}
                                                            services={services}
                                                            bookingDatePickerPopperSx={bookingDatePickerPopperSx}
                                                            getServicePriceForWeight={getServicePriceForWeight}
                                                            // id để scroll tới phần session
                                                            // @ts-ignore
                                                            id={`pet-${pet.id}-main-session`}
                                                        />

                                                        {/* Dịch vụ thêm (nhiều booking_pet_services, không trùng dịch vụ) */}
                                                        <div className="border-t border-[#eee] pt-[20px]">
                                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                                <span className="text-[0.875rem] font-[600] text-[#181818]">Dịch vụ thêm</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addAdditionalService(pet.id)}
                                                                    className="flex items-center gap-2 py-[10px] px-[18px] rounded-[10px] bg-[#ffbaa0]/20 text-[#c45a3a] font-[600] text-[0.8438rem] hover:bg-[#ffbaa0]/35 transition-colors"
                                                                >
                                                                    <AddIcon sx={{ fontSize: 20 }} /> Thêm dịch vụ
                                                                </button>
                                                            </div>
                                                            {(pet.additionalServices ?? []).length > 0 && (
                                                                <div className="space-y-3">
                                                                    {(pet.additionalServices ?? []).map((asvc, index) => {
                                                                        const excludedIds = [
                                                                            pet.serviceId,
                                                                            ...(pet.additionalServices ?? []).map((s) => s.serviceId).filter((id): id is number => id != null),
                                                                        ].filter((id, i, arr) => arr.indexOf(id) === i);
                                                                        const canSelect = (serviceId: number) => !excludedIds.includes(serviceId) || serviceId === asvc.serviceId;
                                                                        // Đã có dịch vụ is_required_room ở chính hoặc dịch vụ thêm khác thì không cho chọn thêm dịch vụ is_required_room ở ô này (trừ đang giữ chọn dịch vụ hiện tại)
                                                                        const mainSvc = pet.serviceId ? services.find((s) => s.serviceId === pet.serviceId) : undefined;
                                                                        const mainIsRoomRequired = mainSvc?.isRequiredRoom === true;
                                                                        const roomRequiredInOtherAdditional = (pet.additionalServices ?? []).some(
                                                                            (ad) => ad.id !== asvc.id && ad.serviceId != null && services.find((s) => s.serviceId === ad.serviceId)?.isRequiredRoom === true
                                                                        );
                                                                        const roomRequiredElsewhere = mainIsRoomRequired || roomRequiredInOtherAdditional;
                                                                        const allowService = (s: ServiceClient) =>
                                                                            canSelect(s.serviceId) &&
                                                                            (!s.isRequiredRoom || s.serviceId === asvc.serviceId || !roomRequiredElsewhere);
                                                                        // Dịch vụ thêm: dùng cùng logic với phần Chọn dịch vụ chính
                                                                        const catServicesForAdditional = categories
                                                                            .map((cat) => ({
                                                                                cat,
                                                                                catServices: services.filter(
                                                                                    (s) =>
                                                                                        s.serviceCategoryId === cat.categoryId &&
                                                                                        s.isActive &&
                                                                                        s.isAddon !== true &&
                                                                                        s.isAdditionalCharge !== true &&
                                                                                        allowService(s)
                                                                                ),
                                                                            }))
                                                                            .filter(({ catServices }) => catServices.length > 0);
                                                                        const additionalServiceDisplayLabel = asvc.serviceId
                                                                            ? (() => {
                                                                                const svc = services.find((s) => s.serviceId === asvc.serviceId);
                                                                                if (!svc) return `Dịch vụ #${asvc.serviceId}`;
                                                                                if (svc.isRequiredRoom === true) return svc.serviceName;
                                                                                const price = getServicePriceForWeight(svc, pet.weight, pet.petType);
                                                                                const priceText = price != null ? ` — ${Number(price).toLocaleString("vi-VN")}đ` : "";
                                                                                return `${svc.serviceName}${priceText}`;
                                                                            })()
                                                                            : "";
                                                                        return (
                                                                            <div
                                                                                key={asvc.id}
                                                                                className="space-y-3"
                                                                            >
                                                                                <ServiceSelectField
                                                                                    label={`Chọn dịch vụ ${index + 1}`}
                                                                                    displayValue={additionalServiceDisplayLabel || "— Chọn dịch vụ —"}
                                                                                    isOpen={openServicePetId === `add-${pet.id}-${asvc.id}`}
                                                                                    onToggle={() => setOpenServicePetId(openServicePetId === `add-${pet.id}-${asvc.id}` ? null : `add-${pet.id}-${asvc.id}`)}
                                                                                    dropdownContent={
                                                                                        openServicePetId === `add-${pet.id}-${asvc.id}` ? (
                                                                                            <div className="py-[8px]">
                                                                                                {catServicesForAdditional.map(({ cat, catServices }) => (
                                                                                                    <div key={cat.categoryId} className="px-[12px] py-[6px]">
                                                                                                        <div className="text-[0.8125rem] font-[600] text-[#6b7280] mb-[4px]">
                                                                                                            {cat.categoryName}
                                                                                                        </div>
                                                                                                        <div className="space-y-[4px]">
                                                                                                            {catServices.map((s) => {
                                                                                                                const price = getServicePriceForWeight(s, pet.weight, pet.petType);
                                                                                                                const isSelected = asvc.serviceId === s.serviceId;
                                                                                                                return (
                                                                                                                    <button
                                                                                                                        key={s.serviceId}
                                                                                                                        type="button"
                                                                                                                        onClick={() => {
                                                                                                                            updateAdditionalService(pet.id, asvc.id, { serviceId: s.serviceId });
                                                                                                                            setOpenServicePetId(null);
                                                                                                                        }}
                                                                                                                        className={`w-full text-left rounded-[10px] px-[10px] py-[8px] border transition-colors ${isSelected
                                                                                                                            ? "border-[#ffbaa0] bg-[#fff7f3]"
                                                                                                                            : "border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3]"
                                                                                                                            }`}
                                                                                                                    >
                                                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                                                            <span className="text-[0.9062rem] font-[600] text-[#181818]">{s.serviceName}</span>
                                                                                                                            {s.isRequiredRoom !== true && price != null && (
                                                                                                                                <span className="text-[0.875rem] font-[600] text-[#c45a3a] whitespace-nowrap">
                                                                                                                                    {Number(price).toLocaleString("vi-VN")}đ{" "}
                                                                                                                                    <span className="text-[0.7812rem] font-[600] text-[#888]">(Dự kiến)</span>
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    </button>
                                                                                                                );
                                                                                                            })}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        ) : null
                                                                                    }
                                                                                    actionRight={
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removeAdditionalService(pet.id, asvc.id)}
                                                                                            className="p-2 rounded-[8px] text-[#888] hover:bg-[#eee] hover:text-[#e53935] shrink-0 mt-8"
                                                                                            aria-label="Xóa dịch vụ thêm"
                                                                                        >
                                                                                            <DeleteOutlineIcon sx={{ fontSize: 22 }} />
                                                                                        </button>
                                                                                    }
                                                                                />
                                                                                {/* Dịch vụ add-on kèm theo: danh sách đã chọn ở trên, dropdown ở dưới; add-on cùng category với dịch vụ đang chọn */}
                                                                                {asvc.serviceId && (() => {
                                                                                    const currentSvc = services.find((s) => s.serviceId === asvc.serviceId);
                                                                                    const categoryIdAdd = currentSvc?.serviceCategoryId;
                                                                                    const addonForAdditional = services.filter(
                                                                                        (s) =>
                                                                                            s.isAddon === true &&
                                                                                            s.serviceId !== asvc.serviceId &&
                                                                                            s.isActive &&
                                                                                            (categoryIdAdd == null || s.serviceCategoryId === categoryIdAdd)
                                                                                    );
                                                                                    if (addonForAdditional.length === 0 && (asvc.addonServiceIds ?? []).length === 0) return null;
                                                                                    const selectedIdsAdd = asvc.addonServiceIds ?? [];
                                                                                    const availableToAddAdd = addonForAdditional.filter((s) => !selectedIdsAdd.includes(s.serviceId));
                                                                                    const selectedServicesAdd = selectedIdsAdd
                                                                                        .map((id) => services.find((s) => s.serviceId === id))
                                                                                        .filter((s): s is ServiceClient => s != null);
                                                                                    return (
                                                                                        <div className="mt-4 p-4 rounded-[12px] border border-[#ffe0ce] bg-[#fffbf9]">
                                                                                            <label className="block mb-3 text-[0.875rem] font-[600] text-[#181818]">Dịch vụ add-on kèm theo (tùy chọn)</label>
                                                                                            {selectedServicesAdd.length > 0 && (
                                                                                                <div className="mb-3 flex flex-wrap gap-2">
                                                                                                    {selectedServicesAdd.map((s) => {
                                                                                                        const price = getServicePriceForWeight(
                                                                                                            s,
                                                                                                            pet.weight,
                                                                                                            pet.petType
                                                                                                        );
                                                                                                        return (
                                                                                                            <span
                                                                                                                key={s.serviceId}
                                                                                                                className="inline-flex items-center gap-2 rounded-[10px] border border-[#ffbaa0] bg-[#fff7f3] px-3 py-2 text-[0.8438rem] font-[500] text-[#181818]"
                                                                                                            >
                                                                                                                <span>
                                                                                                                    {s.serviceName}
                                                                                                                    {price != null && (
                                                                                                                        <span className="ml-2 text-[0.8125rem] font-[600] text-[#c45a3a]">
                                                                                                                            {Number(price).toLocaleString(
                                                                                                                                "vi-VN"
                                                                                                                            )}
                                                                                                                            đ
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </span>
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() =>
                                                                                                                        updateAdditionalService(
                                                                                                                            pet.id,
                                                                                                                            asvc.id,
                                                                                                                            {
                                                                                                                                addonServiceIds:
                                                                                                                                    selectedIdsAdd.filter(
                                                                                                                                        (id) =>
                                                                                                                                            id !==
                                                                                                                                            s.serviceId
                                                                                                                                    ),
                                                                                                                            }
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="p-0.5 rounded hover:bg-[#ffbaa0]/40 text-[#888] hover:text-[#e53935] transition-colors duration-200"
                                                                                                                    aria-label="Xóa"
                                                                                                                >
                                                                                                                    ×
                                                                                                                </button>
                                                                                                            </span>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            )}
                                                                                            {availableToAddAdd.length > 0 ? (
                                                                                                <div className="space-y-[4px]">
                                                                                                    {availableToAddAdd.map((s) => {
                                                                                                        const price = getServicePriceForWeight(
                                                                                                            s,
                                                                                                            pet.weight,
                                                                                                            pet.petType
                                                                                                        );
                                                                                                        const isSelected =
                                                                                                            selectedIdsAdd.includes(
                                                                                                                s.serviceId
                                                                                                            );
                                                                                                        return (
                                                                                                            <button
                                                                                                                key={s.serviceId}
                                                                                                                type="button"
                                                                                                                disabled={isSelected}
                                                                                                                onClick={() => {
                                                                                                                    if (!isSelected) {
                                                                                                                        updateAdditionalService(
                                                                                                                            pet.id,
                                                                                                                            asvc.id,
                                                                                                                            {
                                                                                                                                addonServiceIds: [
                                                                                                                                    ...selectedIdsAdd,
                                                                                                                                    s.serviceId,
                                                                                                                                ],
                                                                                                                            }
                                                                                                                        );
                                                                                                                    }
                                                                                                                }}
                                                                                                                className={`w-full text-left rounded-[10px] px-[10px] py-[8px] border transition-colors ${isSelected
                                                                                                                    ? "border-[#ffbaa0] bg-[#fff7f3] text-[#999] cursor-default"
                                                                                                                    : "border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3]"
                                                                                                                    }`}
                                                                                                            >
                                                                                                                <div className="flex items-center justify-between gap-3">
                                                                                                                    <span className="text-[0.875rem] font-[600] text-[#181818]">
                                                                                                                        {s.serviceName}
                                                                                                                    </span>
                                                                                                                    {price != null && (
                                                                                                                        <span className="text-[0.8438rem] font-[600] text-[#c45a3a] whitespace-nowrap">
                                                                                                                            {Number(
                                                                                                                                price
                                                                                                                            ).toLocaleString(
                                                                                                                                "vi-VN"
                                                                                                                            )}
                                                                                                                            đ
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </button>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <p className="text-[0.8438rem] text-[#888] py-2">
                                                                                                    Không còn dịch vụ add-on để chọn.
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                                {(() => {
                                                                                    const selectedSvc = asvc.serviceId ? services.find((s) => s.serviceId === asvc.serviceId) : undefined;
                                                                                    const isAdditionalRoom = selectedSvc?.isRequiredRoom === true;
                                                                                    const isAdditionalNonRoom = selectedSvc?.isRequiredRoom === false;
                                                                                    return (
                                                                                        <>
                                                                                            {/* Dịch vụ thêm cần phòng: Ngày gửi, Ngày trả (giống phần chọn dịch vụ chính) */}
                                                                                            {isAdditionalRoom && (
                                                                                                <>
                                                                                                    <div
                                                                                                        id={`pet-${pet.id}-${asvc.id}-dates`}
                                                                                                        className="p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce] scroll-mt-[120px]"
                                                                                                    >
                                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                                                            <div>
                                                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày gửi *</label>
                                                                                                                <DatePicker
                                                                                                                    value={asvc.dateFrom ? dayjs(asvc.dateFrom) : null}
                                                                                                                    onChange={(d: Dayjs | null) => {
                                                                                                                        const next = d ? d.format("YYYY-MM-DD") : "";
                                                                                                                        const updates: Partial<BookingPetServiceForm> = { dateFrom: next };
                                                                                                                        if (asvc.dateTo && next && !dayjs(asvc.dateTo).isAfter(dayjs(next))) {
                                                                                                                            updates.dateTo = "";
                                                                                                                        }
                                                                                                                        updateAdditionalService(pet.id, asvc.id, updates);
                                                                                                                    }}
                                                                                                                    format="DD/MM/YYYY"
                                                                                                                    slotProps={{
                                                                                                                        textField: {
                                                                                                                            placeholder: "DD/MM/YYYY",
                                                                                                                            required: true,
                                                                                                                            fullWidth: true,
                                                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                                                        },
                                                                                                                        popper: { sx: bookingDatePickerPopperSx },
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày trả *</label>
                                                                                                                <DatePicker
                                                                                                                    value={asvc.dateTo ? dayjs(asvc.dateTo) : null}
                                                                                                                    onChange={(d: Dayjs | null) => updateAdditionalService(pet.id, asvc.id, { dateTo: d ? d.format("YYYY-MM-DD") : "" })}
                                                                                                                    format="DD/MM/YYYY"
                                                                                                                    minDate={asvc.dateFrom ? dayjs(asvc.dateFrom).add(1, "day") : undefined}
                                                                                                                    slotProps={{
                                                                                                                        textField: {
                                                                                                                            placeholder: "DD/MM/YYYY",
                                                                                                                            required: true,
                                                                                                                            fullWidth: true,
                                                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                                                            helperText: asvc.dateFrom && !asvc.dateTo ? "Ngày trả phải sau ngày gửi (ít nhất 1 đêm)" : undefined,
                                                                                                                        },
                                                                                                                        popper: { sx: bookingDatePickerPopperSx },
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {asvc.numberOfNights != null && asvc.numberOfNights > 0 && (
                                                                                                            <p className="mt-3 text-[0.875rem] font-[600] text-[#c45a3a]">
                                                                                                                Số đêm: {asvc.numberOfNights} đêm
                                                                                                            </p>
                                                                                                        )}
                                                                                                        {petErrors[pet.id]?.serviceDateErrors?.[asvc.id] && (
                                                                                                            <p className="mt-2 text-[0.75rem] text-[#ef4444]">
                                                                                                                {petErrors[pet.id]?.serviceDateErrors?.[asvc.id]}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <RoomPickerSectionForAdditional
                                                                                                        // @ts-ignore
                                                                                                        id={`pet-${pet.id}-${asvc.id}-room`}
                                                                                                        pet={pet}
                                                                                                        asvc={asvc}
                                                                                                        updateAdditionalService={updateAdditionalService}
                                                                                                        services={services}
                                                                                                        getAdditionalRoomTotalPrice={(a, roomTypeId) =>
                                                                                                            getAdditionalRoomTotalPrice(a, roomTypeId, pet)
                                                                                                        }
                                                                                                        onViewRoomDetail={(room) =>
                                                                                                            navigate(`/dat-lich/phong/${room.roomId}`, {
                                                                                                                state: {
                                                                                                                    fromBooking: true,
                                                                                                                    room,
                                                                                                                    bookingDraft: { step1Data, pets },
                                                                                                                },
                                                                                                            })
                                                                                                        }
                                                                                                    />
                                                                                                    {petErrors[pet.id]?.serviceRoomErrors?.[asvc.id] && (
                                                                                                        <p className="mt-2 text-[0.75rem] text-[#ef4444]">
                                                                                                            {petErrors[pet.id]?.serviceRoomErrors?.[asvc.id]}
                                                                                                        </p>
                                                                                                    )}
                                                                                                </>
                                                                                            )}
                                                                                            {/* Dịch vụ thêm không cần phòng: chỉ Ngày gửi + Khung giờ */}
                                                                                            {isAdditionalNonRoom && (
                                                                                                <AdditionalServiceNonRoomFields
                                                                                                    petId={pet.id}
                                                                                                    pet={pet}
                                                                                                    asvc={asvc}
                                                                                                    updateAdditionalService={updateAdditionalService}
                                                                                                    services={services}
                                                                                                    bookingDatePickerPopperSx={bookingDatePickerPopperSx}
                                                                                                    getServicePriceForWeight={getServicePriceForWeight}
                                                                                                    // @ts-ignore
                                                                                                    id={`pet-${pet.id}-${asvc.id}-session`}
                                                                                                />
                                                                                            )}
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* ========== PHẦN 3: Nút hành động ========== */}
                            <section className="flex flex-wrap items-center justify-between gap-4 pt-[8px]">
                                <button
                                    type="button"
                                    onClick={() => navigate("/dat-lich", {
                                        state: {
                                            ...step1Data,
                                            bookingDraft: {
                                                step1Data,
                                                pets
                                            },
                                            bookingCodeForEdit: rawState?.bookingCodeForEdit
                                        }
                                    })}
                                    className="py-[14px] px-[28px] rounded-[12px] border border-[#ddd] text-[#181818] font-[600] text-[0.9375rem] hover:bg-[#f5f5f5] transition-colors"
                                >
                                    Quay lại
                                </button>
                                <div className="flex flex-wrap gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!validateBeforePayment()) return;
                                            setIsSummaryOpen(true);
                                        }}
                                        disabled={isHolding || isSubmitting}
                                        className="py-[14px] px-[28px] rounded-[12px] border border-[#ffbaa0] bg-[#fff7f3] hover:bg-[#ffe9dd] text-[#c45a3a] font-[700] text-[0.9375rem] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isHolding ? "Đang giữ chỗ..." : "Tiếp tục thanh toán"}
                                    </button>
                                </div>
                            </section>
                        </form>
                    </main>
                </div>

                {isSummaryOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
                        <div className="bg-white rounded-[18px] max-w-[960px] w-full max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(15,23,42,0.45)] p-[24px] sm:p-[28px]">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="text-[1.3125rem] font-[800] text-[#181818]">Xác nhận thông tin đặt lịch</h3>
                                    <p className="text-[0.875rem] text-[#6b7280] mt-1">
                                        Vui lòng kiểm tra lại thông tin trước khi tiếp tục thanh toán cọc.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSummaryOpen(false)}
                                    className="text-[1.25rem] leading-none px-2 text-[#888] hover:text-[#e53935]"
                                    aria-label="Đóng"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-16">
                                <section>
                                    <h4 className="text-[1rem] font-[700] text-[#181818] mb-2">Thông tin chủ thú cưng</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-[6px] gap-x-[24px] text-[0.875rem]">
                                        <div>
                                            <span className="text-[#888] block mb-[2px]">Họ và tên</span>
                                            <span className="font-[600] text-[#181818]">{step1Data.fullName || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#888] block mb-[2px]">Số điện thoại</span>
                                            <span className="font-[600] text-[#181818]">{step1Data.phone || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#888] block mb-[2px]">Email</span>
                                            <span className="font-[500] text-[#181818]">{step1Data.email || "—"}</span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[2px]">Địa chỉ</span>
                                            <span className="font-[500] text-[#181818]">{step1Data.address || "—"}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[1rem] font-[700] text-[#181818] mb-3">Thú cưng & dịch vụ</h4>
                                    <div className="space-y-6">
                                        {pets.map((pet, idx) => {
                                            const additional = pet.additionalServices ?? [];

                                            const buildAddonList = (addonIds: number[] | undefined): ServiceClient[] =>
                                                (addonIds ?? [])
                                                    .map((id) => services.find((s) => s.serviceId === id))
                                                    .filter((s): s is ServiceClient => s != null);

                                            const mainService = pet.serviceId
                                                ? services.find((s) => s.serviceId === pet.serviceId)
                                                : undefined;
                                            const mainAddons = buildAddonList(pet.addonServiceIds);

                                            const computeMainPrices = (): { unit: number | null; total: number | null } => {
                                                if (!mainService) return { unit: null, total: null };
                                                if (mainService.isRequiredRoom) {
                                                    if (!pet.serviceId || pet.numberOfNights == null || pet.numberOfNights < 1) {
                                                        return { unit: null, total: null };
                                                    }
                                                    const roomTypeId = pet.selectedRoomTypeId ?? null;
                                                    const rule = findMatchingPricingRuleWithRoom(
                                                        pet.serviceId,
                                                        roomTypeId,
                                                        pet.weight,
                                                        pet.petType
                                                    );
                                                    if (rule?.price == null) return { unit: null, total: null };
                                                    return {
                                                        unit: rule.price,
                                                        total: rule.price * pet.numberOfNights,
                                                    };
                                                }
                                                const price = getServicePriceForWeight(mainService, pet.weight, pet.petType);
                                                const val = price != null ? price : null;
                                                return { unit: val, total: val };
                                            };

                                            const computeAdditionalPrices = (
                                                asvc: BookingPetServiceForm,
                                                svc: ServiceClient | undefined
                                            ): { unit: number | null; total: number | null } => {
                                                if (!svc || !asvc.serviceId) return { unit: null, total: null };
                                                if (svc.isRequiredRoom) {
                                                    if (asvc.numberOfNights == null || asvc.numberOfNights < 1) {
                                                        return { unit: null, total: null };
                                                    }
                                                    const roomTypeId = asvc.selectedRoomTypeId ?? null;
                                                    const rule = findMatchingPricingRuleWithRoom(
                                                        asvc.serviceId,
                                                        roomTypeId,
                                                        pet.weight,
                                                        pet.petType
                                                    );
                                                    if (rule?.price == null) return { unit: null, total: null };
                                                    return {
                                                        unit: rule.price,
                                                        total: rule.price * asvc.numberOfNights,
                                                    };
                                                }
                                                const price = getServicePriceForWeight(svc, pet.weight, pet.petType);
                                                const val = price != null ? price : null;
                                                return { unit: val, total: val };
                                            };

                                            const mainPrices = computeMainPrices();
                                            const additionalItems = additional.map((asvc) => {
                                                const svc = asvc.serviceId
                                                    ? services.find((s) => s.serviceId === asvc.serviceId)
                                                    : undefined;
                                                const addons = buildAddonList(asvc.addonServiceIds);
                                                const prices = computeAdditionalPrices(asvc, svc);
                                                return { asvc, svc, addons, prices };
                                            });

                                            const calcAddonTotal = (addons: ServiceClient[]): number =>
                                                addons.reduce((sum, s) => {
                                                    const price = getServicePriceForWeight(s, pet.weight, pet.petType);
                                                    return sum + (price ?? 0);
                                                }, 0);

                                            const mainAddonTotal = calcAddonTotal(mainAddons);
                                            const additionalAddonTotals = additionalItems.map((item) =>
                                                calcAddonTotal(item.addons)
                                            );

                                            const serviceTotals: number[] = [];
                                            if (mainPrices.total != null) serviceTotals.push(mainPrices.total);
                                            additionalItems.forEach((item) => {
                                                if (item.prices.total != null) serviceTotals.push(item.prices.total);
                                            });

                                            const addonsTotals: number[] = [];
                                            if (mainAddonTotal > 0) addonsTotals.push(mainAddonTotal);
                                            additionalAddonTotals.forEach((t) => {
                                                if (t > 0) addonsTotals.push(t);
                                            });

                                            const grandTotal =
                                                serviceTotals.reduce((a, b) => a + b, 0) +
                                                addonsTotals.reduce((a, b) => a + b, 0);

                                            return (
                                                <div
                                                    key={pet.id}
                                                    className="rounded-[14px] border border-[#ffe0ce] bg-[#fffbf9] px-4 py-3 sm:px-5 sm:py-4"
                                                >
                                                    <div className="flex items-center justify-between gap-3 mb-3">
                                                        <div>
                                                            <div className="text-[0.9375rem] font-[700] text-[#181818]">
                                                                Thú cưng {idx + 1}: {pet.petName || "Chưa đặt tên"}
                                                            </div>
                                                            <div className="text-[0.8125rem] text-[#6b7280]">
                                                                Loại: {pet.petType || "—"}{" "}
                                                                {pet.weight ? `• Cân nặng: ${pet.weight}kg` : ""}
                                                            </div>
                                                        </div>
                                                        {grandTotal > 0 && (
                                                            <div className="text-[0.8438rem] font-[700] text-[#c45a3a]">
                                                                Tổng tạm tính: {grandTotal.toLocaleString("vi-VN")}đ
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4">
                                                        <div className="space-y-2 text-[0.8438rem] text-[#374151]">
                                                            {(!mainService && additionalItems.length === 0) ? (
                                                                <div className="text-[#9ca3af] text-[0.8125rem]">
                                                                    Chưa chọn dịch vụ nào.
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {mainService && (
                                                                        <div className="border border-[#ffe0ce] rounded-[10px] px-3 py-2 bg-white">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="font-[600] text-[#111827]">
                                                                                    Dịch vụ 1: {mainService.serviceName}
                                                                                </div>
                                                                                {mainPrices.total != null && (
                                                                                    <div className="text-[0.8125rem] font-[700] text-[#c45a3a] whitespace-nowrap">
                                                                                        {mainPrices.total.toLocaleString("vi-VN")}đ
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="mt-[2px] text-[0.7812rem] text-[#4b5563]">
                                                                                {mainService.isRequiredRoom ? (
                                                                                    <>
                                                                                        <div>
                                                                                            Ngày gửi:{" "}
                                                                                            <span className="font-[500]">
                                                                                                {pet.dateFrom || "—"}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            Ngày trả:{" "}
                                                                                            <span className="font:[500]">
                                                                                                {pet.dateTo || "—"}
                                                                                            </span>
                                                                                        </div>
                                                                                        {pet.numberOfNights != null && (
                                                                                            <div>
                                                                                                Số đêm:{" "}
                                                                                                <span className="font-[500]">
                                                                                                    {pet.numberOfNights}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        {mainPrices.unit != null && mainPrices.total != null && (
                                                                                            <div>
                                                                                                Giá 1 đêm:{" "}
                                                                                                <span className="font-[500]">
                                                                                                    {mainPrices.unit.toLocaleString("vi-VN")}đ
                                                                                                </span>{" "}
                                                                                                • Tổng:{" "}
                                                                                                <span className="font-[500]">
                                                                                                    {mainPrices.total.toLocaleString("vi-VN")}đ
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <div>
                                                                                            Ngày sử dụng:{" "}
                                                                                            <span className="font-[500]">
                                                                                                {pet.sessionDate || "—"}
                                                                                            </span>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            <div className="mt-[4px]">
                                                                                <span className="font-[500] text-[#111827]">
                                                                                    Add-on:
                                                                                </span>{" "}
                                                                                {mainAddons.length === 0 ? (
                                                                                    <span className="text-[#9ca3af]">
                                                                                        Không có
                                                                                    </span>
                                                                                ) : (
                                                                                    <div className="mt-[2px] space-y-[2px]">
                                                                                        {mainAddons.map((s) => {
                                                                                            const price = getServicePriceForWeight(
                                                                                                s,
                                                                                                pet.weight,
                                                                                                pet.petType
                                                                                            );
                                                                                            return (
                                                                                                <div
                                                                                                    key={s.serviceId}
                                                                                                    className="flex items-center justify-between text-[0.7812rem]"
                                                                                                >
                                                                                                    <span>{s.serviceName}</span>
                                                                                                    {price != null && (
                                                                                                        <span className="font-[600] text-[#c45a3a]">
                                                                                                            {price.toLocaleString(
                                                                                                                "vi-VN"
                                                                                                            )}
                                                                                                            đ
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {additionalItems.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            {additionalItems.map((item, aIdx) => (
                                                                                <div
                                                                                    key={item.asvc.id}
                                                                                    className="border border-[#ffe0ce] rounded-[10px] px-3 py-2 bg-white"
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                        <div className="font-[600] text-[#111827]">
                                                                                            Dịch vụ {mainService ? aIdx + 2 : aIdx + 1}
                                                                                            :{" "}
                                                                                            {item.svc
                                                                                                ? item.svc.serviceName
                                                                                                : "Chưa chọn dịch vụ"}
                                                                                        </div>
                                                                                        {item.prices.total != null && (
                                                                                            <div className="text-[0.8125rem] font-[700] text-[#c45a3a] whitespace-nowrap">
                                                                                                {item.prices.total.toLocaleString("vi-VN")}đ
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="mt-[2px] text-[0.7812rem] text-[#4b5563]">
                                                                                        {item.svc?.isRequiredRoom ? (
                                                                                            <>
                                                                                                <div>
                                                                                                    Ngày gửi:{" "}
                                                                                                    <span className="font-[500]">
                                                                                                        {item.asvc.dateFrom || "—"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    Ngày trả:{" "}
                                                                                                    <span className="font-[500]">
                                                                                                        {item.asvc.dateTo || "—"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {item.asvc.numberOfNights != null && (
                                                                                                    <div>
                                                                                                        Số đêm:{" "}
                                                                                                        <span className="font-[500]">
                                                                                                            {item.asvc.numberOfNights}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {item.prices.unit != null && item.prices.total != null && (
                                                                                                    <div>
                                                                                                        Giá 1 đêm:{" "}
                                                                                                        <span className="font-[500]">
                                                                                                            {item.prices.unit.toLocaleString("vi-VN")}đ
                                                                                                        </span>{" "}
                                                                                                        • Tổng:{" "}
                                                                                                        <span className="font-[500]">
                                                                                                            {item.prices.total.toLocaleString("vi-VN")}đ
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <div>
                                                                                                    Ngày sử dụng:{" "}
                                                                                                    <span className="font-[500]">
                                                                                                        {item.asvc.sessionDate || "—"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="mt-[4px]">
                                                                                        <span className="font-[500] text-[#111827]">
                                                                                            Add-on:
                                                                                        </span>{" "}
                                                                                        {item.addons.length === 0 ? (
                                                                                            <span className="text-[#9ca3af]">
                                                                                                Không có
                                                                                            </span>
                                                                                        ) : (
                                                                                            <div className="mt-[2px] space-y-[2px]">
                                                                                                {item.addons.map((s) => {
                                                                                                    const price =
                                                                                                        getServicePriceForWeight(
                                                                                                            s,
                                                                                                            pet.weight,
                                                                                                            pet.petType
                                                                                                        );
                                                                                                    return (
                                                                                                        <div
                                                                                                            key={s.serviceId}
                                                                                                            className="flex items-center justify-between text-[0.7812rem]"
                                                                                                        >
                                                                                                            <span>
                                                                                                                {s.serviceName}
                                                                                                            </span>
                                                                                                            {price != null && (
                                                                                                                <span className="font-[600] text-[#c45a3a]">
                                                                                                                    {price.toLocaleString(
                                                                                                                        "vi-VN"
                                                                                                                    )}
                                                                                                                    đ
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="border border-[#e5e7eb] rounded-[12px] bg-white px-3 py-3 text-[0.8125rem] text-[#111827]">
                                                            <div className="font-[700] text-[0.875rem] mb-2">
                                                                Bảng giá tạm tính
                                                            </div>
                                                            <div className="space-y-1">
                                                                {mainPrices.total != null && (
                                                                    <div className="flex justify-between">
                                                                        <span>Dịch vụ 1</span>
                                                                        <span className="font-[600]">
                                                                            {mainPrices.total.toLocaleString("vi-VN")}đ
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {additionalItems.length > 0 &&
                                                                    additionalItems.map((item, aIdx) =>
                                                                        item.prices.total != null ? (
                                                                            <div key={item.asvc.id} className="flex justify-between">
                                                                                <span>
                                                                                    Dịch vụ {mainService ? aIdx + 2 : aIdx + 1}
                                                                                </span>
                                                                                <span className="font-[600]">
                                                                                    {item.prices.total.toLocaleString("vi-VN")}đ
                                                                                </span>
                                                                            </div>
                                                                        ) : null
                                                                    )}
                                                                {mainAddonTotal > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span>Add-on dịch vụ 1</span>
                                                                        <span className="font-[600]">
                                                                            {mainAddonTotal.toLocaleString("vi-VN")}đ
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {additionalItems.length > 0 &&
                                                                    additionalItems.map((item, aIdx) => {
                                                                        const addonTotal = additionalAddonTotals[aIdx] ?? 0;
                                                                        if (addonTotal <= 0) return null;
                                                                        const index = mainService ? aIdx + 2 : aIdx + 1;
                                                                        return (
                                                                            <div key={`${item.asvc.id}-addons`} className="flex justify-between">
                                                                                <span>Add-on dịch vụ {index}</span>
                                                                                <span className="font-[600]">
                                                                                    {addonTotal.toLocaleString("vi-VN")}đ
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                            {grandTotal > 0 && (
                                                                <div className="mt-2 border-t border-dashed border-[#e5e7eb] pt-2 flex justify-between text-[0.875rem]">
                                                                    <span className="font-[700]">Tổng cộng</span>
                                                                    <span className="font-[800] text-[#c45a3a]">
                                                                        {grandTotal.toLocaleString("vi-VN")}đ
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSummaryOpen(false)}
                                    className="py-[11px] px-[22px] rounded-[12px] border border-[#d1d5db] bg-white text-[#111827] text-[0.875rem] font-[600] hover:bg-[#f3f4f6]"
                                >
                                    Quay lại chỉnh sửa
                                </button>
                                <button
                                    type="button"
                                    disabled={isHolding}
                                    onClick={() => {
                                        setIsSummaryOpen(false);
                                        openBankInfoModal();
                                    }}
                                    className="py-[11px] px-[26px] rounded-[12px] bg-[#ffbaa0] hover:bg-[#e6a890] text-[#181818] text-[0.9375rem] font-[700] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Tiếp tục thanh toán
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== BANK INFO MODAL ==================== */}
                {isBankInfoOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4">
                        <div className="bg-white rounded-[18px] max-w-[600px] w-full max-h-[85vh] overflow-y-auto shadow-[0_24px_64px_rgba(15,23,42,0.45)] p-[28px] sm:p-[32px]">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-5">
                                <div>
                                    <h3 className="text-[1.25rem] font-[800] text-[#181818]">Thông tin tài khoản ngân hàng</h3>
                                    <p className="text-[0.8125rem] text-[#6b7280] mt-1">
                                        {isLoggedIn
                                            ? "Chọn tài khoản để hoàn tiền cọc nếu cần, hoặc thêm tài khoản mới."
                                            : "Cung cấp tài khoản để hoàn tiền cọc nếu cần."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBankInfoOpen(false)}
                                    className="text-[1.25rem] leading-none px-2 text-[#888] hover:text-[#e53935]"
                                    aria-label="Đóng"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Logged-in: show existing accounts */}
                            {isLoggedIn && myBankAccounts.length > 0 && bankFormMode === "select" && (
                                <div className="space-y-4">
                                    <div className="text-[0.875rem] font-[700] text-[#374151] mb-2">Tài khoản đã lưu</div>
                                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                        {myBankAccounts.map((acc) => {
                                            const isSelected = selectedBankAccountId === acc.id;
                                            return (
                                                <button
                                                    key={acc.id}
                                                    type="button"
                                                    onClick={() => setSelectedBankAccountId(acc.id)}
                                                    className={`w-full text-left rounded-[14px] border-2 p-4 transition-all ${
                                                        isSelected
                                                            ? "border-[#ffbaa0] bg-[#fff7f3]"
                                                            : "border-[#e5e7eb] bg-white hover:border-[#ffbaa0]/60"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <div className="text-[0.9062rem] font-[700] text-[#111827]">
                                                                {acc.bankName}
                                                            </div>
                                                            <div className="text-[0.8125rem] text-[#4b5563] mt-[2px]">
                                                                {acc.accountNumber} — {acc.accountHolderName}
                                                            </div>
                                                            {acc.note && (
                                                                <div className="text-[0.75rem] text-[#9ca3af] mt-[2px]">
                                                                    {acc.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {acc.isDefault && (
                                                            <span className="shrink-0 text-[0.6875rem] font-[700] text-[#c45a3a] bg-[#ffedd5] px-2 py-1 rounded-full">
                                                                Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBankFormMode("add-new");
                                            setBankForm({ accountNumber: "", accountHolderName: "", bankCode: "", note: "" });
                                            setSelectedBankAccountId(null);
                                        }}
                                        className="mt-2 flex items-center gap-2 text-[0.8438rem] font-[600] text-[#c45a3a] hover:underline"
                                    >
                                        <span className="text-[1rem]">+</span> Thêm tài khoản ngân hàng mới
                                    </button>
                                </div>
                            )}

                            {/* Guest or Add-new form */}
                            {(!isLoggedIn || bankFormMode === "add-new") && (
                                <div className="space-y-4">
                                    {isLoggedIn && bankFormMode === "add-new" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBankFormMode("select");
                                                const defaultAcc = myBankAccounts.find((a) => a.isDefault) ?? myBankAccounts[0];
                                                setSelectedBankAccountId(defaultAcc?.id ?? null);
                                            }}
                                            className="text-[0.8125rem] text-[#6b7280] hover:text-[#111827] flex items-center gap-1"
                                        >
                                            ← Quay lại danh sách tài khoản
                                        </button>
                                    )}

                                    <div className="space-y-4">
                                        {/* Bank select */}
                                        <div>
                                            <label className="block text-[0.875rem] font-[600] text-[#181818] mb-[8px]">
                                                Ngân hàng <span className="text-[#e67e20]">*</span>
                                            </label>
                                            <select
                                                value={bankForm.bankCode}
                                                onChange={(e) => setBankForm((prev) => ({ ...prev, bankCode: e.target.value }))}
                                                className="w-full py-[13px] px-[16px] text-[0.9062rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all rounded-[12px] bg-white"
                                            >
                                                <option value="">— Chọn ngân hàng —</option>
                                                {banks.map((b) => (
                                                    <option key={b.bankCode} value={b.bankCode}>
                                                        {b.bankName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Account number */}
                                        <div>
                                            <label className="block text-[0.875rem] font-[600] text-[#181818] mb-[8px]">
                                                Số tài khoản <span className="text-[#e67e20]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: 0123456789"
                                                value={bankForm.accountNumber}
                                                onChange={(e) => setBankForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                                                className="w-full py-[13px] px-[16px] text-[0.9062rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all rounded-[12px]"
                                            />
                                        </div>

                                        {/* Account holder name */}
                                        <div>
                                            <label className="block text-[0.875rem] font-[600] text-[#181818] mb-[8px]">
                                                Tên chủ tài khoản <span className="text-[#e67e20]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: NGUYEN VAN A"
                                                value={bankForm.accountHolderName}
                                                onChange={(e) => setBankForm((prev) => ({ ...prev, accountHolderName: e.target.value.toUpperCase() }))}
                                                className="w-full py-[13px] px-[16px] text-[0.9062rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all rounded-[12px]"
                                            />
                                        </div>

                                        {/* Note (optional) */}
                                        <div>
                                            <label className="block text-[0.875rem] font-[600] text-[#181818] mb-[8px]">
                                                Ghi chú <span className="text-[0.75rem] text-[#9ca3af] font-[400]">(tuỳ chọn)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: Tài khoản MB Bank cá nhân"
                                                value={bankForm.note ?? ""}
                                                onChange={(e) => setBankForm((prev) => ({ ...prev, note: e.target.value }))}
                                                className="w-full py-[13px] px-[16px] text-[0.9062rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all rounded-[12px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* No accounts yet for logged-in user */}
                            {isLoggedIn && myBankAccounts.length === 0 && bankFormMode === "select" && (
                                <div className="text-[0.8438rem] text-[#9ca3af] text-center py-4">
                                    Bạn chưa có tài khoản ngân hàng nào. Vui lòng thêm bên dưới.
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsBankInfoOpen(false)}
                                    className="py-[11px] px-[22px] rounded-[12px] border border-[#d1d5db] bg-white text-[#111827] text-[0.875rem] font-[600] hover:bg-[#f3f4f6]"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    disabled={isHolding || (isLoggedIn && bankFormMode === "select" && selectedBankAccountId === null && myBankAccounts.length > 0)}
                                    onClick={handleBankInfoConfirm}
                                    className="py-[11px] px-[26px] rounded-[12px] bg-[#ffbaa0] hover:bg-[#e6a890] text-[#181818] text-[0.9375rem] font-[700] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isHolding ? "Đang xử lý..." : "Xác nhận & Tiến hành đặt lịch"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="app-container flex gap-[30px] pb-[100px]">
                    <div className="w-[413px] px-[20px]">
                        <div className="w-full h-[206px]">
                            <img src="https://pawsitive.bold-themes.com/coco/wp-content/uploads/sites/3/2019/08/inner_image_maps_02.png" alt="" width={413} height={206} className="w-full h-full object-cover rounded-t-[50px]" />
                        </div>
                        <div className="bg-[#e67e2026] px-[30px] pt-[32px] pb-[40px] rounded-b-[50px]">
                            <div className="flex mb-[32px]">
                                <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                                    <EditLocationAltIcon style={{ fontSize: "2.5rem" }} />
                                </div>
                                <div className="pl-[20px]">
                                    <div className="text-[1.375rem] font-[800] text-[#181818] mb-[12px]">Địa chỉ</div>
                                    <p className="text-[#181818]">64 Ung Văn Khiêm, Pleiku, Gia Lai</p>
                                </div>
                            </div>
                            <div className="flex mb-[32px]">
                                <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                                    <PhoneEnabledOutlinedIcon style={{ fontSize: "2.5rem" }} />
                                </div>
                                <div className="pl-[20px]">
                                    <div className="text-[1.375rem] font-[800] text-[#181818] mb-[12px]">Số điện thoại</div>
                                    <p className="text-[#181818]">+84346587796</p>
                                </div>
                            </div>
                            <div className="flex mb-[32px]">
                                <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                                    <MailOutlineOutlinedIcon style={{ fontSize: "2.5rem" }} />
                                </div>
                                <div className="pl-[20px]">
                                    <div className="text-[1.375rem] font-[800] text-[#181818] mb-[12px]">E-mail</div>
                                    <p className="text-[#181818]">teddypet@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.610010397031!2d106.809883!3d10.841127599999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2sFPT%20University%20HCMC!5e0!3m2!1sen!2s!4v1761230475278!5m2!1sen!2s"
                            width="100%"
                            height="100%"
                            loading="lazy"
                        />
                    </div>
                </div>

                <FooterSub />
            </>
        </LocalizationProvider>
    );
};
