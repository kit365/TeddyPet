import { FooterSub } from "../../components/layouts/FooterSub";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PhoneEnabledOutlinedIcon from "@mui/icons-material/PhoneEnabledOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import { useNavigate, useLocation, Link } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { prefixAdmin } from "../../../admin/constants/routes";
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
    getBookedRoomIds,
    type RoomLayoutConfigClient,
    type RoomClient,
    type RoomTypeClient,
    type TimeSlotClient,
} from "../../../api/service.api";
import { getSettingByKey, getSupportPhone, DEFAULT_SHOP_PHONE } from "../../../api/settings.api";
import { getFoodBrandOptions, type ProductBrandOption } from "../../../api/home.api";
import type { BookingPetForm, BookingPetServiceForm, PetFoodBroughtItemForm } from "../../../types/booking.type";
import type { ServiceCategoryClient, ServiceClient } from "../../../types/booking.type";
import { ServiceSelectField } from "../../components/ui/ServiceSelectField";
import { SESSION_SLOTS, PET_TYPES, FOOD_TYPE_OPTIONS } from "./constants";
import type { IServicePricing } from "../../../admin/pages/service/configs/types";
import { getServicePricingsByServiceId } from "../../../api/service-pricing.api";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { toast } from "react-toastify";
import "dayjs/locale/vi";
import { buildCreateBookingPayload, createBookingFromClient, getBookingShiftCoverage } from "../../../api/booking.api";
import { createBookingDepositIntent } from "../../../api/booking-deposit.api";
import { getAdminBookings } from "../../../admin/api/booking.api";
import { getBanks, getMyBankInformation, createGuestBankInformationByBookingCode, getBankByGuestEmail } from "../../../api/bank.api";
import type { BankOption, BankInformationPayload } from "../../../types/bank.type";
import { useAuthStore } from "../../../stores/useAuthStore";

const defaultStep1Data: BookingStep1FormData = {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    message: "",
};

dayjs.extend(isoWeek);
dayjs.locale("vi");

/** Ngày gửi nằm trong ISO tuần hiện tại hoặc tuần kế tiếp → áp dụng ràng buộc theo ca làm (chỉ cần admin đã tạo ca OPEN/ASSIGNED). */
function isCheckInInCurrentOrNextIsoWeek(d: Dayjs): boolean {
    if (!d || !d.isValid()) return false;
    const wStart = dayjs().startOf("isoWeek");
    const wEnd = dayjs().endOf("isoWeek").add(1, "week");
    const ge = d.isAfter(wStart, "day") || d.isSame(wStart, "day");
    const le = d.isBefore(wEnd, "day") || d.isSame(wEnd, "day");
    return ge && le;
}

/** Dịch vụ theo buổi (không phòng): khóa khung giờ AM/PM theo phủ ca trong cùng khoảng 2 tuần ISO với ô Ngày gửi. */
function getShiftCoverageFlagsForSessionDate(
    dateYmd: string | undefined,
    shiftCoverageLoading: boolean,
    rangeStart: Dayjs,
    rangeEnd: Dayjs,
    shiftCoverageMap: Map<string, { morning: boolean; afternoon: boolean }>
): { apply: boolean; morning: boolean; afternoon: boolean } {
    const ymd = dateYmd?.trim();
    if (!ymd || shiftCoverageLoading) {
        return { apply: false, morning: true, afternoon: true };
    }
    const d = dayjs(ymd);
    if (!d.isValid() || d.isBefore(rangeStart, "day") || d.isAfter(rangeEnd, "day")) {
        return { apply: false, morning: true, afternoon: true };
    }
    const cov = shiftCoverageMap.get(ymd);
    if (!cov) {
        return { apply: true, morning: false, afternoon: false };
    }
    return { apply: true, morning: cov.morning, afternoon: cov.afternoon };
}

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
    const [isOpen, setIsOpen] = useState(false);
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

    const canShowOther = !usedBrandKeys.has(OTHER_BRAND_VALUE);

    const options = useMemo(() => {
        const opts = availableBrands.map((b) => ({ value: (b.name ?? "").trim(), label: b.name ?? "" }));
        if (canShowOther) opts.push({ value: OTHER_BRAND_VALUE, label: "Khác" });
        return opts;
    }, [availableBrands, canShowOther]);

    const placeholder = !petTypeEnum ? "Vui lòng chọn loại thú cưng" : !foodType ? "Chọn loại thức ăn trước" : isFetching ? "Đang tải nhãn hiệu..." : "Chọn nhãn hiệu";

    return (
        <GenericDropdown
            isOpen={isOpen}
            value={value == null ? OTHER_BRAND_VALUE : value ?? ""}
            onToggle={() => setIsOpen(!isOpen)}
            onChange={(val) => {
                if (val === OTHER_BRAND_VALUE) onChange(null);
                else onChange(val);
            }}
            options={options}
            placeholder={placeholder}
        />
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
                className="w-full flex items-center justify-between py-[12px] px-[16px] rounded-[10px] border border-[#ddd] bg-white text-[#181818] hover:border-[#ffbaa0]/60 transition-all text-[0.9375rem] focus:outline-none focus:ring-2 focus:ring-[#ffbaa0]/20 active:scale-[0.985]"
            >
                <span className="truncate">{renderLabel(value) || "— Chọn loại —"}</span>
                <span className={`ml-3 text-[#ffbaa0] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-[8px] z-50 bg-white border border-[#ffe0ce]/60 rounded-[16px] shadow-[0_20px_40px_rgba(255,186,160,0.15),0_10px_20px_rgba(0,0,0,0.05)] max-h-[260px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-[8px] space-y-[4px]">
                        {options.map((opt) => {
                            const isSelected = opt === value;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => onChange(opt)}
                                    className={`w-full text-left rounded-[12px] px-[14px] py-[12px] transition-all flex items-center justify-between ${isSelected
                                        ? "bg-[#fff7f3] text-[#c45a3a]"
                                        : "text-[#4b5563] hover:bg-[#fff7f3]/50 hover:text-[#c45a3a]"
                                        }`}
                                >
                                    <span className={`text-[0.9375rem] ${isSelected ? "font-[700]" : "font-[500]"}`}>{renderLabel(opt)}</span>
                                    {isSelected && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffbaa0]"><path d="M20 6L9 17l-5-5" /></svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

type GenericDropdownOption = { value: string; label: string; disabled?: boolean };

type GenericDropdownGroup = {
    groupLabel: string;
    options: GenericDropdownOption[];
};

type GenericDropdownProps = {
    isOpen: boolean;
    value: string;
    onToggle: () => void;
    onChange: (val: string, label: string) => void;
    options?: GenericDropdownOption[];
    groups?: GenericDropdownGroup[];
    placeholder?: string;
    label?: string;
    required?: boolean;
    twoColumns?: boolean;
};

const GenericDropdown = ({ isOpen, value, onToggle, onChange, options, groups, placeholder, label, required, twoColumns }: GenericDropdownProps) => {
    const allOptions = useMemo(() => {
        if (groups) return groups.flatMap((g) => g.options);
        return options ?? [];
    }, [options, groups]);

    const selectedOption = allOptions.find((o) => o.value === value);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && isOpen) {
                onToggle();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onToggle]);

    const renderOption = (opt: GenericDropdownOption) => {
        const isSelected = opt.value === value;
        const isDisabled = opt.disabled === true;
        return (
            <button
                key={opt.value}
                type="button"
                disabled={isDisabled}
                title={isDisabled ? "Không có ca làm cho buổi này trong ngày đã chọn" : undefined}
                onClick={() => {
                    if (isDisabled) return;
                    onChange(opt.value, opt.label);
                    onToggle();
                }}
                className={`w-full text-left rounded-[12px] px-[14px] py-[11px] transition-all flex items-center justify-between ${isDisabled
                    ? "cursor-not-allowed opacity-45 text-[#9ca3af]"
                    : isSelected
                      ? "bg-[#fff7f3] text-[#c45a3a]"
                      : "text-[#4b5563] hover:bg-[#fff7f3]/50 hover:text-[#c45a3a]"
                    }`}
            >
                <span className={`text-[0.9062rem] whitespace-nowrap ${isSelected && !isDisabled ? "font-[700]" : "font-[500]"}`}>{opt.label}</span>
                {isSelected && !isDisabled && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffbaa0]"><path d="M20 6L9 17l-5-5" /></svg>
                )}
            </button>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">{label} {required && "*"}</label>}
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between py-[12px] px-[16px] rounded-[10px] border bg-white text-[0.9375rem] transition-all outline-none ${isOpen ? "border-[#ffbaa0] ring-2 ring-[#ffbaa0]/20" : "border-[#ddd] hover:border-[#ffbaa0]/60"
                    } ${selectedOption ? "text-[#181818] font-[500]" : "text-[#9ca3af]"}`}
            >
                <span className="truncate">{selectedOption?.label || placeholder || "— Chọn —"}</span>
                <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} text-[#ffbaa0]`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
            </button>

            {isOpen && (
                <div className={`absolute left-0 mt-[8px] z-50 bg-white border border-[#ffe0ce]/60 rounded-[16px] shadow-[0_20px_40px_rgba(255,186,160,0.15),0_10px_40px_rgba(0,0,0,0.08)] max-h-[320px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 ${twoColumns ? "w-max min-w-full shadow-[0_25px_50px_-12px_rgba(255,186,160,0.25)]" : "right-0"
                    }`}>
                    <div className={`p-[8px] relative ${twoColumns && groups ? "grid grid-cols-2 gap-x-6" : "space-y-[2px]"}`}>
                        {twoColumns && groups && (
                            <div className="absolute left-1/2 top-[12px] bottom-[12px] w-[1px] bg-[#ffe0ce]/80 -translate-x-1/2" />
                        )}
                        {groups ? (
                            groups.map((group, gIdx) => (
                                <div key={gIdx} className="mb-2 last:mb-0">
                                    <div className="px-[14px] py-[6px] text-[0.75rem] font-[700] text-[#9ca3af] uppercase tracking-wider bg-[#fafafa]/50 rounded-[8px] mb-[4px]">
                                        {group.groupLabel}
                                    </div>
                                    <div className="space-y-[2px]">
                                        {group.options.map((opt) => renderOption(opt))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            options?.map((opt) => renderOption(opt))
                        )}
                        {allOptions.length === 0 && (
                            <div className="py-8 px-4 text-center text-[0.875rem] text-[#9ca3af]">Không có tùy chọn khả dụng</div>
                        )}
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
    globalDateFrom: string;
    enforceAdvanceBookingHours: boolean;
    bookingDatePickerPopperSx: object;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
    /** Trong 2 tuần ISO: khóa khung giờ sáng/chiều theo ca OPEN/ASSIGNED */
    sessionShiftCoverage: { apply: boolean; morning: boolean; afternoon: boolean };
};

/** Ô Ngày gửi + Khung giờ cho dịch vụ chính khi isRequiredRoom = false (dùng time_slots của dịch vụ). */
type MainServiceNonRoomFieldsProps = {
    pet: BookingPetForm;
    updatePet: (id: string, updates: Partial<BookingPetForm>) => void;
    services: ServiceClient[];
    globalDateFrom: string;
    enforceAdvanceBookingHours: boolean;
    bookingDatePickerPopperSx: object;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
    sessionShiftCoverage: { apply: boolean; morning: boolean; afternoon: boolean };
};

const MainServiceNonRoomFields = ({
    pet,
    updatePet,
    services,
    globalDateFrom,
    enforceAdvanceBookingHours,
    bookingDatePickerPopperSx,
    getServicePriceForWeight,
    sessionShiftCoverage,
}: MainServiceNonRoomFieldsProps) => {
    const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);
    const selectedSvc = pet.serviceId ? services.find((s) => s.serviceId === pet.serviceId) : undefined;
    const isNonRoom = selectedSvc?.isRequiredRoom === false;

    const { data: timeSlotsData } = useQuery({
        queryKey: ["time-slots-main", pet.id, pet.serviceId],
        queryFn: () => getTimeSlotsByServiceId(pet.serviceId!),
        enabled: !!pet.serviceId && isNonRoom,
        select: (res) => res.data ?? [],
    });

    const timeSlots: TimeSlotClient[] = timeSlotsData ?? [];

    useEffect(() => {
        if (!sessionShiftCoverage.apply || pet.sessionTimeSlotId == null) return;
        const ts = timeSlots.find((t) => t.id === pet.sessionTimeSlotId);
        if (!ts) return;
        const start = typeof ts.startTime === "string" ? ts.startTime.slice(0, 5) : String(ts.startTime ?? "").slice(0, 5);
        const isPm = start && start >= "12:00";
        const allowed = isPm ? sessionShiftCoverage.afternoon : sessionShiftCoverage.morning;
        if (!allowed) {
            updatePet(pet.id, { sessionTimeSlotId: undefined, sessionSlotLabel: undefined, sessionSlot: undefined });
        }
    }, [
        sessionShiftCoverage.apply,
        sessionShiftCoverage.morning,
        sessionShiftCoverage.afternoon,
        pet.sessionTimeSlotId,
        pet.id,
        timeSlots,
        updatePet,
    ]);

    const slotGroups = useMemo(() => {
        const am: GenericDropdownOption[] = [];
        const pm: GenericDropdownOption[] = [];

        timeSlots
            .filter((ts) => ts.status !== "INACTIVE")
            .filter((ts) => (ts.currentBookings ?? 0) < (ts.maxCapacity ?? 1))
            .forEach((ts) => {
                const start = typeof ts.startTime === "string" ? ts.startTime.slice(0, 5) : ts.startTime;
                const end = typeof ts.endTime === "string" ? ts.endTime.slice(0, 5) : ts.endTime;
                const label = start && end ? `${start} - ${end}` : start || end || `Slot #${ts.id}`;
                const isPm = !!(start && start >= "12:00");
                const shiftBlocked = sessionShiftCoverage.apply && (isPm ? !sessionShiftCoverage.afternoon : !sessionShiftCoverage.morning);
                const option: GenericDropdownOption = { value: String(ts.id), label, disabled: shiftBlocked };

                // Determine AM or PM based on start time (HH:mm)
                if (isPm) {
                    pm.push(option);
                } else {
                    am.push(option);
                }
            });

        const groups: GenericDropdownGroup[] = [];
        if (am.length > 0) groups.push({ groupLabel: "Buổi sáng (AM)", options: am });
        if (pm.length > 0) groups.push({ groupLabel: "Buổi chiều (PM)", options: pm });
        return groups;
    }, [timeSlots, sessionShiftCoverage.apply, sessionShiftCoverage.morning, sessionShiftCoverage.afternoon]);

    if (!pet.serviceId || !isNonRoom) return null;

    const advanceHours = selectedSvc?.advanceBookingHours ?? 24;
    const minSessionDate = enforceAdvanceBookingHours
        ? dayjs().add(advanceHours, "hour").startOf("day")
        : dayjs().startOf("day");

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
                    disabled
                    readOnly
                    value={globalDateFrom ? dayjs(globalDateFrom) : null}
                    onChange={undefined}
                    minDate={minSessionDate}
                    format="DD/MM/YYYY"
                    slotProps={{
                        textField: {
                            placeholder: "DD/MM/YYYY",
                            required: true,
                            fullWidth: true,
                            sx: bookingDatePickerTextFieldSx,
                            helperText: "Ngày gửi được lấy từ ô Ngày gửi chung phía trên.",
                        },
                        popper: { sx: bookingDatePickerPopperSx },
                    }}
                />
            </div>
            <div>
                <GenericDropdown
                    label="Khung giờ"
                    required
                    isOpen={isSlotDropdownOpen}
                    value={pet.sessionTimeSlotId != null ? String(pet.sessionTimeSlotId) : ""}
                    onToggle={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)}
                    onChange={(val, label) => {
                        updatePet(pet.id, {
                            sessionTimeSlotId: Number(val) || undefined,
                            sessionSlotLabel: label,
                            sessionSlot: label.split(" - ")[0] ?? "",
                        });
                    }}
                    groups={slotGroups}
                    placeholder="— Chọn khung giờ —"
                    twoColumns={true}
                />
                {sessionShiftCoverage.apply && (!sessionShiftCoverage.morning || !sessionShiftCoverage.afternoon) && (
                    <p className="mt-1 text-[0.75rem] text-[#888]">
                        Khung giờ được lọc theo ca làm đã xếp trong ngày (chỉ chọn được buổi có ca sáng hoặc ca chiều tương ứng).
                    </p>
                )}
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
    globalDateFrom,
    enforceAdvanceBookingHours,
    bookingDatePickerPopperSx,
    getServicePriceForWeight,
    sessionShiftCoverage,
}: AdditionalServiceNonRoomFieldsProps) => {
    const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);
    const selectedSvc = asvc.serviceId ? services.find((s) => s.serviceId === asvc.serviceId) : undefined;
    const isNonRoom = selectedSvc?.isRequiredRoom === false;

    const { data: timeSlotsData } = useQuery({
        queryKey: ["time-slots", asvc.serviceId],
        queryFn: () => getTimeSlotsByServiceId(asvc.serviceId!),
        enabled: !!asvc.serviceId && isNonRoom,
        select: (res) => res.data ?? [],
    });

    const timeSlots: TimeSlotClient[] = timeSlotsData ?? [];

    useEffect(() => {
        if (!sessionShiftCoverage.apply || asvc.sessionTimeSlotId == null) return;
        const ts = timeSlots.find((t) => t.id === asvc.sessionTimeSlotId);
        if (!ts) return;
        const start = typeof ts.startTime === "string" ? ts.startTime.slice(0, 5) : String(ts.startTime ?? "").slice(0, 5);
        const isPm = start && start >= "12:00";
        const allowed = isPm ? sessionShiftCoverage.afternoon : sessionShiftCoverage.morning;
        if (!allowed) {
            updateAdditionalService(petId, asvc.id, {
                sessionTimeSlotId: undefined,
                sessionSlotLabel: undefined,
                sessionSlot: undefined,
            });
        }
    }, [
        sessionShiftCoverage.apply,
        sessionShiftCoverage.morning,
        sessionShiftCoverage.afternoon,
        asvc.sessionTimeSlotId,
        asvc.id,
        petId,
        timeSlots,
        updateAdditionalService,
    ]);

    const slotGroups = useMemo(() => {
        const am: GenericDropdownOption[] = [];
        const pm: GenericDropdownOption[] = [];

        timeSlots
            .filter((ts) => ts.status !== "INACTIVE")
            .filter((ts) => (ts.currentBookings ?? 0) < (ts.maxCapacity ?? 1))
            .forEach((ts) => {
                const start = typeof ts.startTime === "string" ? ts.startTime.slice(0, 5) : ts.startTime;
                const end = typeof ts.endTime === "string" ? ts.endTime.slice(0, 5) : ts.endTime;
                const label = start && end ? `${start} - ${end}` : start || end || `Slot #${ts.id}`;
                const isPm = !!(start && start >= "12:00");
                const shiftBlocked = sessionShiftCoverage.apply && (isPm ? !sessionShiftCoverage.afternoon : !sessionShiftCoverage.morning);
                const option: GenericDropdownOption = { value: String(ts.id), label, disabled: shiftBlocked };

                if (isPm) {
                    pm.push(option);
                } else {
                    am.push(option);
                }
            });

        const groups: GenericDropdownGroup[] = [];
        if (am.length > 0) groups.push({ groupLabel: "Buổi sáng (AM)", options: am });
        if (pm.length > 0) groups.push({ groupLabel: "Buổi chiều (PM)", options: pm });
        return groups;
    }, [timeSlots, sessionShiftCoverage.apply, sessionShiftCoverage.morning, sessionShiftCoverage.afternoon]);

    if (!asvc.serviceId || !isNonRoom) return null;

    const advanceHours = selectedSvc?.advanceBookingHours ?? 24;
    const minSessionDate = enforceAdvanceBookingHours
        ? dayjs().add(advanceHours, "hour").startOf("day")
        : dayjs().startOf("day");

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
                    disabled
                    readOnly
                    value={globalDateFrom ? dayjs(globalDateFrom) : null}
                    onChange={undefined}
                    minDate={minSessionDate}
                    format="DD/MM/YYYY"
                    slotProps={{
                        textField: {
                            size: "small",
                            fullWidth: true,
                            placeholder: "DD/MM/YYYY",
                            sx: bookingDatePickerTextFieldSx,
                            helperText: "Ngày gửi được lấy từ ô Ngày gửi chung phía trên.",
                        },
                        popper: { sx: bookingDatePickerPopperSx },
                    }}
                />
            </div>
            <div>
                <GenericDropdown
                    label="Khung giờ"
                    required
                    isOpen={isSlotDropdownOpen}
                    value={asvc.sessionTimeSlotId != null ? String(asvc.sessionTimeSlotId) : ""}
                    onToggle={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)}
                    onChange={(val, label) => {
                        updateAdditionalService(petId, asvc.id, {
                            sessionTimeSlotId: Number(val) || undefined,
                            sessionSlotLabel: label,
                            sessionSlot: label.split(" - ")[0] ?? "",
                        });
                    }}
                    groups={slotGroups}
                    placeholder="— Chọn khung giờ —"
                    twoColumns={true}
                />
                {sessionShiftCoverage.apply && (!sessionShiftCoverage.morning || !sessionShiftCoverage.afternoon) && (
                    <p className="mt-1 text-[0.75rem] text-[#888]">
                        Khung giờ được lọc theo ca làm đã xếp trong ngày (chỉ chọn được buổi có ca sáng hoặc ca chiều tương ứng).
                    </p>
                )}
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
    globalDateFrom: string;
    onViewRoomDetail?: (room: RoomClient) => void;
    getRoomTotalPrice?: (p: BookingPetForm, roomTypeId: number | null) => number | null;
    findMatchingPricingRule?: (serviceId: number, weight?: string | null, type?: string | null) => IServicePricing | undefined;
};

const RoomPickerSection = ({
    pet,
    updatePet,
    services,
    globalDateFrom,
    onViewRoomDetail,
    getRoomTotalPrice,
    findMatchingPricingRule
}: RoomPickerSectionProps) => {
    const selectedService = services.find((s) => s.serviceId === pet.serviceId);
    const needsRoom = selectedService?.isRequiredRoom === true;

    // Nếu state dateFrom bị reset về "", vẫn lấy từ globalDateFrom để hiển thị/ mở sơ đồ chính xác.
    const effectiveDateFrom = pet.dateFrom || globalDateFrom;
    // Chỉ cần đủ ngày gửi/ngày trả hợp lệ là mở sơ đồ.
    // Trước đây có phụ thuộc pet.pricingModel khiến một số luồng reset dateFrom làm sơ đồ không mở.
    const hasDates =
        !!(
            pet.pricingModel === "per_day" &&
            effectiveDateFrom &&
            pet.dateTo &&
            dayjs(pet.dateTo).isAfter(dayjs(effectiveDateFrom))
        );
    const showPicker = needsRoom && hasDates && !!pet.serviceId;

    const { data: layoutData } = useQuery({
        queryKey: ["room-layout-config", pet.serviceId],
        queryFn: () => getRoomLayoutConfigsByServiceId(pet.serviceId!),
        enabled: showPicker && !!pet.serviceId,
        select: (res) => res.data,
    });

    const layouts: RoomLayoutConfigClient[] = layoutData ?? [];
    const activeLayout = layouts.find(l => l.status === "IN_USE" || l.status === "READY_FOR_USE");
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

    const { data: bookedRoomIdsData } = useQuery({
        queryKey: ["booked-room-ids", effectiveDateFrom, pet.dateTo],
        queryFn: () => getBookedRoomIds(effectiveDateFrom!, pet.dateTo!),
        enabled: showPicker && !!effectiveDateFrom && !!pet.dateTo,
        select: (res) => res.data ?? [],
    });

    const rooms: RoomClient[] = roomsData ?? [];
    const bookedRoomIdSet = useMemo(() => new Set(bookedRoomIdsData ?? []), [bookedRoomIdsData]);

    const placedRooms = useMemo(
        () => rooms.filter((r) => r.roomLayoutConfigId === layoutId && r.gridRow != null && r.gridCol != null),
        [rooms, layoutId]
    );

    const roomTypes: RoomTypeClient[] = useMemo(() => {
        const fetchTypes = (roomTypesData ?? []).filter((rt) => rt.isActive && !rt.isDeleted);
        if (fetchTypes.length > 0) return fetchTypes;

        const map = new Map<number, RoomTypeClient>();
        placedRooms.forEach((r) => {
            if (r.roomTypeId && !map.has(r.roomTypeId)) {
                map.set(r.roomTypeId, {
                    roomTypeId: r.roomTypeId,
                    typeName: r.roomTypeName || `Phòng loại ${r.roomTypeId}`,
                    displayTypeName: r.roomTypeName || `Phòng loại ${r.roomTypeId}`,
                    isActive: true,
                });
            }
        });
        return Array.from(map.values()).sort((a,b) => a.roomTypeId - b.roomTypeId);
    }, [roomTypesData, placedRooms]);

    const selectedRoomTypeId = pet.selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;
    const effectiveRoomTypeId = selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;

    // Tự chọn loại phòng đầu tiên khi picker hiển thị mà chưa có loại phòng nào được chọn
    const firstRoomTypeId = roomTypes[0]?.roomTypeId;
    useEffect(() => {
        if (!showPicker || firstRoomTypeId == null || pet.selectedRoomTypeId != null) return;
        updatePet(pet.id, { selectedRoomTypeId: firstRoomTypeId });
    }, [showPicker, roomTypes.length, firstRoomTypeId, pet.id, pet.selectedRoomTypeId, updatePet]);

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
        const phoneValue = hasPhone ? supportPhone!.trim() : DEFAULT_SHOP_PHONE;
        
        return (
            <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
                <p className="text-[0.875rem] text-[#555]">
                    Chưa có dữ liệu phòng cho dịch vụ này, vui lòng liên hệ hotline{" "}
                    <a 
                        href={`tel:${phoneValue.replace(/\s+/g, '')}`} 
                        className="text-[#c45a3a] font-[700] hover:underline"
                    >
                        {phoneValue}
                    </a>{" "}
                    để được hỗ trợ.
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
                            const isBooked = room && bookedRoomIdSet.has(room.roomId);
                            const isMatchingType = room && (effectiveRoomTypeId == null ? true : room.roomTypeId === effectiveRoomTypeId);
                            const isSelected = room && pet.selectedRoomId === room.roomId;
                            const isClickable = isMatchingType && !isBooked;

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
                                        ? "border-[#e5e7eb] bg-[#f9fafb]/50 cursor-default"
                                        : isBooked
                                            ? "border-[#e5e7eb] bg-[#f4f4f5] opacity-40 cursor-not-allowed text-[#9ca3af] blur-[1.5px] select-none"
                                            : isMatchingType
                                                ? isSelected
                                                    ? "border-[#c45a3a] bg-[#e67e20] text-white cursor-pointer shadow-md ring-2 ring-[#c45a3a] ring-offset-2 hover:bg-[#d96e1a]"
                                                    : "border-[#e67e20] bg-[#fef3eb] text-[#c45a3a] cursor-pointer hover:bg-[#ffedd5] hover:border-[#c45a3a] hover:shadow"
                                                : "border-[#e5e7eb] bg-[#f4f4f5] opacity-40 cursor-not-allowed text-[#9ca3af]"
                                        }`}
                                    style={{ width: cellSize, height: cellSize }}
                                    title={isBooked ? "Phòng đã được đặt" : undefined}
                                >
                                    {room && (
                                        <>
                                            <span className="text-[0.6875rem] font-[700] leading-tight">
                                                {room.roomNumber ?? ""}
                                            </span>
                                            <span
                                                className={`text-[0.5625rem] font-[600] ${isSelected ? "text-white/90" : "text-[#888]"
                                                    }`}
                                            >
                                                T{room.tier || 1}
                                            </span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Phòng đang chọn + giá tổng + Xem chi tiết (chỉ khi đã chọn phòng) */}
            {(() => {
                const mainServicePrice = selectedService ? getRoomTotalPrice?.(pet, effectiveRoomTypeId) : null;
                const addonIds = pet.addonServiceIds ?? [];
                const addonServices = addonIds
                    .map((id) => services.find((s) => s.serviceId === id))
                    .filter((s): s is ServiceClient => s != null);
                const addonTotal = addonServices.reduce((sum, s) => {
                    const matchedRule = findMatchingPricingRule?.(s.serviceId, pet.weight, pet.petType);
                    return sum + (matchedRule?.price ?? 0);
                }, 0);
                const totalEstimated = (mainServicePrice ?? 0) + addonTotal;

                if (!selectedService || (!mainServicePrice && addonServices.length === 0) || !pet.selectedRoomId) return null;

                return (
                    <div className="mt-4 rounded-[12px] border border-[#ffe0ce] bg-white px-4 py-3">
                        <div className="text-[0.8438rem] text-[#181818] font-[600] mb-2">Tóm tắt giá dự kiến</div>
                        <div className="space-y-1.5">
                            {mainServicePrice != null && (
                                <div className="text-[0.8125rem] text-[#555]">
                                    Dịch vụ chính:{" "}
                                    <strong className="text-[#c45a3a]">
                                        {selectedService.serviceName}
                                        {pet.numberOfNights != null && pet.numberOfNights > 0 && (
                                            <> — {Number(Math.round(mainServicePrice / pet.numberOfNights)).toLocaleString("vi-VN")}đ x{pet.numberOfNights} đêm</>
                                        )}
                                        {" "} — {Number(mainServicePrice).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                            )}
                            <div className="text-[0.8125rem] text-[#555]">
                                Dịch vụ add-on:{" "}
                                {addonServices.length === 0 ? (
                                    <span className="text-[#888]">Không có</span>
                                ) : (
                                    <span className="text-[#181818]">
                                        {addonServices
                                            .map((s) => {
                                                const matchedRule = findMatchingPricingRule?.(s.serviceId, pet.weight, pet.petType);
                                                const p = matchedRule?.price;
                                                const priceText = p != null ? ` — ${Number(p).toLocaleString("vi-VN")}đ` : "";
                                                return `${s.serviceName}${priceText}`;
                                            })
                                            .join("; ")}
                                    </span>
                                )}
                            </div>
                            {totalEstimated > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#ffe0ce] text-[0.8438rem] text-[#555]">
                                    Tổng dự kiến:{" "}
                                    <strong className="text-[0.9375rem] text-[#c45a3a]">
                                        {Number(totalEstimated).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* Thông tin phòng đang chọn (nếu có) */}
                        {(() => {
                            const selectedRoom = pet.selectedRoomId != null ? placedRooms.find((r) => r.roomId === pet.selectedRoomId) ?? null : null;
                            if (!selectedRoom) return null;
                            const roomDisplayName = selectedRoom.roomName?.trim() ? `${selectedRoom.roomNumber} – ${selectedRoom.roomName}` : `${selectedRoom.roomNumber} T${selectedRoom.tier ?? 1}`;
                            return (
                                <div className="mt-3 pt-3 border-t border-[#ffe0ce] flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-[0.8125rem] text-[#181818]">
                                        Phòng đang chọn: <strong className="text-[#c45a3a]">{roomDisplayName}</strong>
                                    </span>
                                    {onViewRoomDetail && (
                                        <button
                                            type="button"
                                            onClick={() => onViewRoomDetail(selectedRoom)}
                                            className="inline-flex items-center gap-2 rounded-[10px] border border-[#ffbaa0] bg-[#fff7f3] px-3 py-1.5 text-[0.7812rem] font-[600] text-[#c45a3a] transition-colors hover:bg-[#ffbaa0] hover:text-[#181818]"
                                        >
                                            Xem chi tiết
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
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
    globalDateFrom: string;
    getAdditionalRoomTotalPrice: (asvc: BookingPetServiceForm, roomTypeId: number | null) => number | null;
    onViewRoomDetail?: (room: RoomClient) => void;
    findMatchingPricingRule: (serviceId: number, weight?: string | null, type?: string | null) => IServicePricing | undefined;
};

const RoomPickerSectionForAdditional = ({
    pet,
    asvc,
    updateAdditionalService,
    services,
    globalDateFrom,
    getAdditionalRoomTotalPrice,
    onViewRoomDetail,
    findMatchingPricingRule,
}: RoomPickerSectionForAdditionalProps) => {
    const selectedService = services.find((s) => s.serviceId === asvc.serviceId);
    const needsRoom = selectedService?.isRequiredRoom === true;
    const effectiveDateFrom = asvc.dateFrom || globalDateFrom;
    const hasDates = !!(asvc.pricingModel === "per_day" && effectiveDateFrom && asvc.dateTo && dayjs(asvc.dateTo).isAfter(dayjs(effectiveDateFrom)));
    const showPicker = needsRoom && hasDates && !!asvc.serviceId;

    const { data: layoutData } = useQuery({
        queryKey: ["room-layout-config", asvc.serviceId],
        queryFn: () => getRoomLayoutConfigsByServiceId(asvc.serviceId!),
        enabled: showPicker && !!asvc.serviceId,
        select: (res) => res.data,
    });

    const layouts: RoomLayoutConfigClient[] = layoutData ?? [];
    const activeLayout = layouts.find(l => l.status === "IN_USE" || l.status === "READY_FOR_USE");
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

    const { data: bookedRoomIdsDataAdd } = useQuery({
        queryKey: ["booked-room-ids", effectiveDateFrom, asvc.dateTo],
        queryFn: () => getBookedRoomIds(effectiveDateFrom!, asvc.dateTo!),
        enabled: showPicker && !!effectiveDateFrom && !!asvc.dateTo,
        select: (res) => res.data ?? [],
    });

    const rooms: RoomClient[] = roomsData ?? [];
    const bookedRoomIdSetAdd = useMemo(() => new Set(bookedRoomIdsDataAdd ?? []), [bookedRoomIdsDataAdd]);

    const placedRooms = useMemo(
        () => rooms.filter((r) => r.roomLayoutConfigId === layoutId && r.gridRow != null && r.gridCol != null),
        [rooms, layoutId]
    );

    const roomTypes: RoomTypeClient[] = useMemo(() => {
        const fetchTypes = (roomTypesData ?? []).filter((rt) => rt.isActive && !rt.isDeleted);
        if (fetchTypes.length > 0) return fetchTypes;

        const map = new Map<number, RoomTypeClient>();
        placedRooms.forEach((r) => {
            if (r.roomTypeId && !map.has(r.roomTypeId)) {
                map.set(r.roomTypeId, {
                    roomTypeId: r.roomTypeId,
                    typeName: r.roomTypeName || `Phòng loại ${r.roomTypeId}`,
                    displayTypeName: r.roomTypeName || `Phòng loại ${r.roomTypeId}`,
                    isActive: true,
                });
            }
        });
        return Array.from(map.values()).sort((a,b) => a.roomTypeId - b.roomTypeId);
    }, [roomTypesData, placedRooms]);

    const selectedRoomTypeId = asvc.selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;
    const effectiveRoomTypeId = selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;

    const firstRoomTypeId = roomTypes[0]?.roomTypeId;
    useEffect(() => {
        if (!showPicker || firstRoomTypeId == null || asvc.selectedRoomTypeId != null) return;
        updateAdditionalService(pet.id, asvc.id, { selectedRoomTypeId: firstRoomTypeId });
    }, [showPicker, roomTypes.length, firstRoomTypeId, pet.id, asvc.id, asvc.selectedRoomTypeId, updateAdditionalService]);

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
        const phoneValue = hasPhone ? supportPhone!.trim() : DEFAULT_SHOP_PHONE;
        
        return (
            <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
                <p className="text-[0.875rem] text-[#555]">
                    Chưa có dữ liệu phòng cho dịch vụ này, vui lòng liên hệ hotline{" "}
                    <a 
                        href={`tel:${phoneValue.replace(/\s+/g, '')}`} 
                        className="text-[#c45a3a] font-[700] hover:underline"
                    >
                        {phoneValue}
                    </a>{" "}
                    để được hỗ trợ.
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
                            const isBooked = room && bookedRoomIdSetAdd.has(room.roomId);
                            const isMatchingType = room && (effectiveRoomTypeId == null ? true : room.roomTypeId === effectiveRoomTypeId);
                            const isSelected = room && asvc.selectedRoomId === room.roomId;
                            const isClickable = isMatchingType && !isBooked;

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
                                        ? "border-[#e5e7eb] bg-[#f9fafb]/50 cursor-default"
                                        : isBooked
                                            ? "border-[#e5e7eb] bg-[#f4f4f5] opacity-40 cursor-not-allowed text-[#9ca3af] blur-[1.5px] select-none"
                                            : isMatchingType
                                                ? isSelected
                                                    ? "border-[#c45a3a] bg-[#e67e20] text-white cursor-pointer shadow-md ring-2 ring-[#c45a3a] ring-offset-2 hover:bg-[#d96e1a]"
                                                    : "border-[#e67e20] bg-[#fef3eb] text-[#c45a3a] cursor-pointer hover:bg-[#ffedd5] hover:border-[#c45a3a] hover:shadow"
                                                : "border-[#e5e7eb] bg-[#f4f4f5] opacity-40 cursor-not-allowed text-[#9ca3af]"
                                        }`}
                                    style={{ width: cellSize, height: cellSize }}
                                    title={isBooked ? "Phòng đã được đặt" : undefined}
                                >
                                    {room ? (
                                        <>
                                            <span className="text-[0.6875rem] font-[700] leading-tight">
                                                {room.roomNumber ?? ""}
                                            </span>
                                            <span className={`text-[0.5625rem] font-[600] ${isSelected ? "text-white/90" : "text-[#888]"}`}>T{room.tier || 1}</span>
                                        </>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {(() => {
                const mainServicePrice = selectedService ? getAdditionalRoomTotalPrice(asvc, effectiveRoomTypeId) : null;
                const addonIds = asvc.addonServiceIds ?? [];
                const addonServices = addonIds
                    .map((id) => services.find((s) => s.serviceId === id))
                    .filter((s): s is ServiceClient => s != null);
                const addonTotal = addonServices.reduce((sum, s) => {
                    const matchedRule = findMatchingPricingRule(s.serviceId, pet.weight, pet.petType);
                    return sum + (matchedRule?.price ?? 0);
                }, 0);
                const totalEstimated = (mainServicePrice ?? 0) + addonTotal;

                if (!selectedService || (!mainServicePrice && addonServices.length === 0) || !asvc.selectedRoomId) return null;

                return (
                    <div className="mt-4 rounded-[12px] border border-[#ffe0ce] bg-white px-4 py-3">
                        <div className="text-[0.8438rem] text-[#181818] font-[600] mb-2">Tóm tắt giá dự kiến</div>
                        <div className="space-y-1.5">
                            {mainServicePrice != null && (
                                <div className="text-[0.8125rem] text-[#555]">
                                    Dịch vụ thêm:{" "}
                                    <strong className="text-[#c45a3a]">
                                        {selectedService.serviceName}
                                        {asvc.numberOfNights != null && asvc.numberOfNights > 0 && (
                                            <> — {Number(Math.round(mainServicePrice / asvc.numberOfNights)).toLocaleString("vi-VN")}đ x{asvc.numberOfNights} đêm</>
                                        )}
                                        {" "} — {Number(mainServicePrice).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                            )}
                            <div className="text-[0.8125rem] text-[#555]">
                                Dịch vụ add-on:{" "}
                                {addonServices.length === 0 ? (
                                    <span className="text-[#888]">Không có</span>
                                ) : (
                                    <span className="text-[#181818]">
                                        {addonServices
                                            .map((s) => {
                                                const matchedRule = findMatchingPricingRule(s.serviceId, pet.weight, pet.petType);
                                                const p = matchedRule?.price;
                                                const priceText = p != null ? ` — ${Number(p).toLocaleString("vi-VN")}đ` : "";
                                                return `${s.serviceName}${priceText}`;
                                            })
                                            .join("; ")}
                                    </span>
                                )}
                            </div>
                            {totalEstimated > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#ffe0ce] text-[0.8438rem] text-[#555]">
                                    Tổng dự kiến:{" "}
                                    <strong className="text-[0.9375rem] text-[#c45a3a]">
                                        {Number(totalEstimated).toLocaleString("vi-VN")}đ
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* Thông tin phòng đang chọn (nếu có) */}
                        {(() => {
                            const selectedRoom = asvc.selectedRoomId != null ? placedRooms.find((r) => r.roomId === asvc.selectedRoomId) ?? null : null;
                            if (!selectedRoom) return null;
                            const roomDisplayName = selectedRoom.roomName?.trim() ? `${selectedRoom.roomNumber} – ${selectedRoom.roomName}` : `${selectedRoom.roomNumber} T${selectedRoom.tier ?? 1}`;
                            return (
                                <div className="mt-3 pt-3 border-t border-[#ffe0ce] flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-[0.8125rem] text-[#181818]">
                                        Phòng đang chọn: <strong className="text-[#c45a3a]">{roomDisplayName}</strong>
                                    </span>
                                    {onViewRoomDetail && (
                                        <button
                                            type="button"
                                            onClick={() => onViewRoomDetail(selectedRoom)}
                                            className="inline-flex items-center gap-2 rounded-[10px] border border-[#ffbaa0] bg-[#fff7f3] px-3 py-1.5 text-[0.7812rem] font-[600] text-[#c45a3a] transition-colors hover:bg-[#ffbaa0] hover:text-[#181818]"
                                        >
                                            Xem chi tiết
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                );
            })()}
        </div>
    );
};

const bookingDatePickerTextFieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        minHeight: 48,
        backgroundColor: "#fff !important",
        transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#e5e7eb !important",
            borderWidth: "1px",
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffbaa0 !important",
            borderWidth: "1px",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffbaa0 !important",
            borderWidth: "2px",
        },
        "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(255, 186, 160, 0.15)",
        },
    },
    "& .MuiOutlinedInput-input": {
        padding: "12px 16px",
        fontSize: "0.9375rem",
        lineHeight: 1.5,
        fontWeight: 500,
        color: "#1f2937",
        fontFamily: "inherit",
        "&::placeholder": {
            color: "#9ca3af",
            opacity: 1,
        },
    },
    "& .MuiInputAdornment-root": {
        marginRight: "8px",
    },
    "& .MuiIconButton-root": {
        padding: "8px",
        borderRadius: "10px",
        color: "#6b7280",
        transition: "all 200ms ease",
        "&:hover": {
            backgroundColor: "#fff7f3",
            color: "#c45a3a",
        },
    },
    "& .MuiInputAdornment-root .MuiSvgIcon-root": {
        fontSize: 20,
    },
    "& .MuiFormHelperText-root": {
        marginLeft: 2,
        marginTop: 6,
        fontSize: "0.8125rem",
        color: "#6b7280",
        fontWeight: 500,
        lineHeight: 1.4,
    },
};

const bookingDatePickerPopperSx = {
    "& .MuiPaper-root": {
        borderRadius: "20px",
        minWidth: 320,
        padding: "8px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        border: "1px solid #f3f4f6",
        marginTop: "8px !important",
        backgroundColor: "#ffffff",
    },
    "& .MuiCalendarOrClockPicker-root": {
        width: "100%",
    },
    "& .MuiPickersDay-root": {
        fontSize: "0.875rem",
        width: 36,
        height: 36,
        borderRadius: "12px",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        margin: "2px",
        fontWeight: 500,
        color: "#374151",
        "&:hover": {
            backgroundColor: "#fff7f3",
            color: "#c45a3a",
            transform: "translateY(-1px)",
        },
        "&.MuiPickersDay-today": {
            borderColor: "#ffbaa0",
            backgroundColor: "transparent",
            color: "#c45a3a",
            fontWeight: 700,
            "&:hover": {
                backgroundColor: "#fff7f3",
            }
        },
    },
    "& .MuiPickersDay-root.Mui-selected": {
        backgroundColor: "#c45a3a !important",
        color: "#ffffff !important",
        fontWeight: 700,
        boxShadow: "0 4px 12px rgba(196, 90, 58, 0.3)",
        "&:hover": {
            backgroundColor: "#b34e2f !important",
        },
    },
    "& .MuiDayCalendar-weekDayLabel": {
        fontSize: "0.75rem",
        color: "#9ca3af",
        fontWeight: 600,
        width: 40,
        marginBottom: "8px",
    },
    "& .MuiPickersCalendarHeader-root": {
        paddingLeft: "16px",
        paddingRight: "8px",
        marginTop: "8px",
        marginBottom: "16px",
    },
    "& .MuiPickersCalendarHeader-label": {
        fontSize: "0.9375rem",
        fontWeight: 800,
        color: "#111827",
        textTransform: "capitalize",
    },
    "& .MuiPickersArrowSwitcher-button": {
        color: "#6b7280",
        "&:hover": {
            backgroundColor: "#f9fafb",
            color: "#c45a3a",
        },
    },
    "& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root": {
        fontSize: 20,
    },
    "& .MuiPickersFadeTransitionGroup-root": {
        padding: "0 4px",
    },
    "& .MuiPickersTodayButton-root, & .MuiPickersClearButton-root": {
        fontSize: "0.8125rem",
        fontWeight: 700,
        color: "#c45a3a",
        textTransform: "none",
        padding: "6px 12px",
        borderRadius: "8px",
        "&:hover": {
            backgroundColor: "#fff7f3",
        }
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

type BookingDetailPageMode = "client" | "admin-counter";

type BookingDetailPageProps = {
    mode?: BookingDetailPageMode;
};

type ServicePricingQueryResult = {
    map: Record<number, IServicePricing[]>;
    failedServiceIds: number[];
};

export const BookingDetailPage = ({ mode = "client" }: BookingDetailPageProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const rawState = location.state as (BookingStep1FormData & { bookingDraft?: BookingDetailDraft; bookingCodeForEdit?: string; bookingMode?: BookingDetailPageMode }) | undefined;
    const searchParams = new URLSearchParams(location.search);
    const routeMode = searchParams.get("mode") === "counter" ? "admin-counter" : undefined;
    const currentMode: BookingDetailPageMode = routeMode ?? rawState?.bookingMode ?? mode;
    const isCounterBooking = currentMode === "admin-counter";
    const enforceAdvanceBookingHours = !isCounterBooking;
    const draft = rawState?.bookingDraft;
    const step1Data: BookingStep1FormData = draft?.step1Data ?? (rawState as BookingStep1FormData) ?? defaultStep1Data;

    useEffect(() => {
        if (!step1Data.fullName?.trim() || !step1Data.phone?.trim()) {
            navigate(isCounterBooking ? "/admin/booking/create?mode=counter" : "/dat-lich", { replace: true });
        }
    }, [step1Data.fullName, step1Data.phone, navigate, isCounterBooking]);

    const initialPets: BookingPetForm[] = draft?.pets?.length ? draft.pets : [createEmptyPet(step1Data)];

    const [pets, setPets] = useState<BookingPetForm[]>(initialPets);
    const [globalDateFrom, setGlobalDateFrom] = useState<string>(() => initialPets[0]?.dateFrom ?? "");
    const [openServicePetId, setOpenServicePetId] = useState<string | null>(null);
    const [openPetTypePetId, setOpenPetTypePetId] = useState<string | null>(null);
    /** Index thú cưng đang xem (story style: chuyển qua lại bên phải) */
    const [activePetIndex, setActivePetIndex] = useState(0);
    const queryClient = useQueryClient();
    const pricingWarningShownRef = useRef<string>("");

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

    // Min "Ngày gửi chung" = hôm nay + max(advanceBookingHours) của các dịch vụ hiện có (active).
    // Mục tiêu: luôn chặn chọn ngày quá khứ, và luôn áp dụng quy định đặt trước lớn nhất để dễ quản lý.
    const maxAdvanceBookingHours = useMemo(() => {
        const active = services.filter((s) => s.isActive !== false);
        const hours = active
            .map((s) => Number((s as any).advanceBookingHours ?? 0))
            .filter((h) => Number.isFinite(h) && h > 0);
        return hours.length ? Math.max(...hours) : 0;
    }, [services]);

    const minGlobalDateFrom = useMemo(() => {
        const base = dayjs().startOf("day"); // không bao giờ cho chọn ngày quá khứ
        if (!enforceAdvanceBookingHours || !maxAdvanceBookingHours || maxAdvanceBookingHours <= 0) return base;
        return dayjs().add(maxAdvanceBookingHours, "hour").startOf("day");
    }, [maxAdvanceBookingHours, enforceAdvanceBookingHours]);

    // Nếu globalDateFrom đang nhỏ hơn min thì tự đẩy lên mốc tối thiểu để tránh sai logic
    useEffect(() => {
        if (!minGlobalDateFrom) return;
        const minStr = minGlobalDateFrom.format("YYYY-MM-DD");
        if (!globalDateFrom || dayjs(globalDateFrom).isBefore(minGlobalDateFrom, "day")) {
            setGlobalDateFrom(minStr);
            applyGlobalDateFromToAll(minStr);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minGlobalDateFrom?.valueOf()]);

    // Map serviceId -> danh sách pricing rule
    const serviceIdsForPricingQuery = useMemo(
        () => services.map((s) => s.serviceId).sort((a, b) => a - b),
        [services]
    );

    const {
        data: servicePricingData,
        refetch: refetchServicePricing,
    } = useQuery({
        queryKey: ["service-pricings-client", serviceIdsForPricingQuery],
        queryFn: async (): Promise<ServicePricingQueryResult> => {
            const result: Record<number, IServicePricing[]> = {};
            const failedServiceIds: number[] = [];
            await Promise.all(
                services.map(async (s) => {
                    try {
                        const res = await getServicePricingsByServiceId(s.serviceId);
                        result[s.serviceId] = res.data ?? [];
                    } catch {
                        result[s.serviceId] = [];
                        failedServiceIds.push(s.serviceId);
                    }
                })
            );
            return {
                map: result,
                failedServiceIds,
            };
        },
        enabled: services.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    const servicePricingMap = servicePricingData?.map;
    const failedServiceIds = servicePricingData?.failedServiceIds ?? [];

    /** Khoảng 2 tuần ISO (tuần này + tuần sau) để lấy phủ ca từ BE */
    const shiftCoverageRange = useMemo(() => {
        const start = dayjs().startOf("isoWeek");
        const end = dayjs().endOf("isoWeek").add(1, "week");
        return {
            start,
            end,
            fromStr: start.format("YYYY-MM-DD"),
            toStr: end.format("YYYY-MM-DD"),
        };
    }, []);

    /** Cần hiển thị gợi ý ràng buộc ca (ngày trả) khi ngày gửi thuộc 2 tuần ISO gần nhất */
    const needsShiftCoverageForCheckout = useMemo(() => {
        if (globalDateFrom && isCheckInInCurrentOrNextIsoWeek(dayjs(globalDateFrom))) return true;
        return pets.some((p) => p.dateFrom && isCheckInInCurrentOrNextIsoWeek(dayjs(p.dateFrom)));
    }, [globalDateFrom, pets]);

    /** Luôn tải phủ ca 2 tuần để khóa ô Ngày gửi chung + ngày trả trong khoảng đó (tuần xa hơn không ràng buộc). */
    const { data: shiftCoverageApi, isLoading: shiftCoverageLoading } = useQuery({
        queryKey: ["booking-shift-coverage", shiftCoverageRange.fromStr, shiftCoverageRange.toStr],
        queryFn: () => getBookingShiftCoverage(shiftCoverageRange.fromStr, shiftCoverageRange.toStr),
        staleTime: 120_000,
    });

    const shiftCoverageMap = useMemo(() => {
        const m = new Map<string, { morning: boolean; afternoon: boolean }>();
        const rows = shiftCoverageApi?.data ?? [];
        rows.forEach((row) => m.set(row.date, { morning: row.morning, afternoon: row.afternoon }));
        return m;
    }, [shiftCoverageApi]);

    /** Khung giờ dịch vụ không phòng: theo ca sáng/chiều của ngày gửi chung (cùng khoảng 2 tuần ISO). */
    const sessionShiftCoverageFlags = useMemo(
        () =>
            getShiftCoverageFlagsForSessionDate(
                globalDateFrom,
                shiftCoverageLoading,
                shiftCoverageRange.start,
                shiftCoverageRange.end,
                shiftCoverageMap
            ),
        [globalDateFrom, shiftCoverageLoading, shiftCoverageRange.start, shiftCoverageRange.end, shiftCoverageMap]
    );

    /**
     * Trong [tuần ISO hiện tại, tuần ISO kế]: khóa ngày nếu cả buổi sáng và chiều đều không có ca (OPEN/ASSIGNED).
     * Ngoài khoảng đó → không khóa (tuần xa admin sẽ xếp ca sau; nếu trùng ngày nghỉ có thể báo khách đổi sau).
     */
    const isDateWithNoShiftInNearWeeks = useCallback(
        (d: Dayjs | null) => {
            if (!d || !d.isValid()) return false;
            if (shiftCoverageLoading) return false;
            if (d.isBefore(shiftCoverageRange.start, "day") || d.isAfter(shiftCoverageRange.end, "day")) return false;
            const cov = shiftCoverageMap.get(d.format("YYYY-MM-DD"));
            if (!cov) return true;
            return !cov.morning && !cov.afternoon;
        },
        [shiftCoverageLoading, shiftCoverageMap, shiftCoverageRange.start, shiftCoverageRange.end]
    );

    const isReturnDateDisabledByShift = useCallback(
        (checkInYmd: string | undefined, d: Dayjs | null) => {
            const cin = checkInYmd?.trim();
            if (!cin) return false;
            const checkIn = dayjs(cin);
            if (!checkIn.isValid() || !isCheckInInCurrentOrNextIsoWeek(checkIn)) return false;
            return isDateWithNoShiftInNearWeeks(d);
        },
        [isDateWithNoShiftInNearWeeks]
    );

    /**
     * Ngày trả: dịch vụ cần phòng → cùng quy tắc ca như ô Ngày gửi (2 tuần ISO gần nhất).
     * Dịch vụ không cần phòng → chỉ áp khi ngày gửi thuộc 2 tuần đó (logic cũ).
     */
    const shouldDisableReturnDateByShift = useCallback(
        (checkInYmd: string | undefined, d: Dayjs | null, requiresRoom: boolean) => {
            if (requiresRoom) return isDateWithNoShiftInNearWeeks(d);
            return isReturnDateDisabledByShift(checkInYmd, d);
        },
        [isDateWithNoShiftInNearWeeks, isReturnDateDisabledByShift]
    );

    const helperTextReturnDateShift = (requiresRoom: boolean) => {
        if (requiresRoom) {
            return "Tuần này & tuần sau: chỉ chọn được ngày có ít nhất một ca làm (sáng hoặc chiều). Các tuần sau không giới hạn theo lịch ca.";
        }
        if (needsShiftCoverageForCheckout) {
            return "Tuần này & tuần sau: không chọn được ngày trả nếu cả ca sáng và ca chiều đều trống (khi ngày gửi cũng trong 2 tuần đó).";
        }
        return undefined;
    };

    useEffect(() => {
        if (!failedServiceIds.length) {
            pricingWarningShownRef.current = "";
            return;
        }

        const key = failedServiceIds.slice().sort((a, b) => a - b).join(",");
        if (pricingWarningShownRef.current === key) return;

        pricingWarningShownRef.current = key;
        toast.warning(
            "Một số bảng giá chưa tải được. Vui lòng bấm 'Tải lại bảng giá' để cập nhật đầy đủ."
        );
    }, [failedServiceIds]);

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
        // Sort giống backend: ưu tiên priority (tăng dần), sau đó rule có ràng buộc weight nhiều hơn,
        // rồi minWeight cao hơn, cuối cùng maxWeight thấp hơn.
        activeRules.sort((a, b) => {
            const pa = a.priority ?? 0;
            const pb = b.priority ?? 0;
            if (pa !== pb) return pa - pb;

            const scoreA = (a.minWeight != null ? 1 : 0) + (a.maxWeight != null ? 1 : 0);
            const scoreB = (b.minWeight != null ? 1 : 0) + (b.maxWeight != null ? 1 : 0);
            if (scoreA !== scoreB) return scoreB - scoreA; // reverse

            const minA = a.minWeight != null ? a.minWeight : -1;
            const minB = b.minWeight != null ? b.minWeight : -1;
            if (minA !== minB) return minB - minA; // reverse

            const maxA = a.maxWeight != null ? a.maxWeight : Number.POSITIVE_INFINITY;
            const maxB = b.maxWeight != null ? b.maxWeight : Number.POSITIVE_INFINITY;
            return maxA - maxB;
        });

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
        // Sort giống backend để chọn đúng rule khi có nhiều khoảng weight cùng match.
        activeRules.sort((a, b) => {
            const pa = a.priority ?? 0;
            const pb = b.priority ?? 0;
            if (pa !== pb) return pa - pb;

            const scoreA = (a.minWeight != null ? 1 : 0) + (a.maxWeight != null ? 1 : 0);
            const scoreB = (b.minWeight != null ? 1 : 0) + (b.maxWeight != null ? 1 : 0);
            if (scoreA !== scoreB) return scoreB - scoreA; // reverse

            const minA = a.minWeight != null ? a.minWeight : -1;
            const minB = b.minWeight != null ? b.minWeight : -1;
            if (minA !== minB) return minB - minA; // reverse

            const maxA = a.maxWeight != null ? a.maxWeight : Number.POSITIVE_INFINITY;
            const maxB = b.maxWeight != null ? b.maxWeight : Number.POSITIVE_INFINITY;
            return maxA - maxB;
        });

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
        const effectiveFrom = p.dateFrom || globalDateFrom;
        const nights =
            p.numberOfNights != null
                ? p.numberOfNights
                : effectiveFrom && p.dateTo && dayjs(p.dateTo).isAfter(dayjs(effectiveFrom))
                    ? dayjs(p.dateTo).diff(dayjs(effectiveFrom), "day")
                    : null;

        if (!p.serviceId || nights == null || nights < 1) return null;
        // Resolve theo quy tắc admin: roomType + petType + cân nặng.
        const rule = findMatchingPricingRuleWithRoom(p.serviceId, roomTypeId, p.weight, p.petType);
        if (rule?.price == null) return null;
        return rule.price * nights;
    };

    /** Tổng tiền phòng cho dịch vụ thêm (dùng weight/petType của pet). */
    const getAdditionalRoomTotalPrice = (asvc: BookingPetServiceForm, roomTypeId: number | null, pet: BookingPetForm): number | null => {
        const effectiveFrom = asvc.dateFrom || globalDateFrom;
        const nights =
            asvc.numberOfNights != null
                ? asvc.numberOfNights
                : effectiveFrom && asvc.dateTo && dayjs(asvc.dateTo).isAfter(dayjs(effectiveFrom))
                    ? dayjs(asvc.dateTo).diff(dayjs(effectiveFrom), "day")
                    : null;

        if (!asvc.serviceId || nights == null || nights < 1) return null;
        // Resolve theo quy tắc admin: roomType + petType + cân nặng.
        const rule = findMatchingPricingRuleWithRoom(asvc.serviceId, roomTypeId, pet.weight, pet.petType);
        if (rule?.price == null) return null;
        return rule.price * nights;
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
                    // Trong UI, Ngày gửi cho các dịch vụ được lấy từ "Ngày gửi chung" (globalDateFrom).
                    // Có trường hợp state dateFrom của service/pet bị rỗng trong khi UI vẫn hiển thị từ globalDateFrom,
                    // dẫn tới validate bị báo sai dù user đã chọn ngày trả.
                    const effectiveDateFrom = dateFrom || globalDateFrom;
                    const selectedRoomId =
                        "selectedRoomId" in base ? base.selectedRoomId : (base as BookingPetServiceForm).selectedRoomId;

                    if (!effectiveDateFrom || !dateTo || !dayjs(dateTo).isAfter(dayjs(effectiveDateFrom))) {
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

                    // UI có thể hiển thị ngày gửi từ globalDateFrom (readOnly/disabled),
                    // nhưng state sessionDate vẫn rỗng -> validate sẽ sai.
                    // Fallback sang globalDateFrom để validate đúng theo quy tắc "Ngày gửi chung".
                    const effectiveSessionDate = sessionDate || globalDateFrom;

                    const sessionSlotLabel =
                        "sessionSlotLabel" in base
                            ? (base as BookingPetForm | BookingPetServiceForm).sessionSlotLabel
                            : (base as BookingPetServiceForm).sessionSlotLabel;

                    // Một số trường hợp UI đã chọn "Khung giờ" nhưng sessionTimeSlotId chưa được set đúng,
                    // trong khi sessionSlotLabel vẫn có. Cho validate pass theo label để tránh báo sai.
                    const hasTimeSlot = !!sessionTimeSlotId || !!sessionSlotLabel;

                    if (!effectiveSessionDate || !hasTimeSlot) {
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
        setPets((prev) => [
            ...prev,
            {
                ...createEmptyPet(step1Data),
                dateFrom: globalDateFrom || "",
            },
        ]);
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
                    : {
                          ...p,
                          additionalServices: [
                              ...(p.additionalServices ?? []),
                              {
                                  ...createEmptyAdditionalService(),
                                  dateFrom: globalDateFrom || "",
                              },
                          ],
                      }
            )
        );
    };

    const applyGlobalDateFromToAll = (next: string) => {
        setPets((prev) =>
            prev.map((p) => {
                let dateTo = p.dateTo;
                if (dateTo && next && !dayjs(dateTo).isAfter(dayjs(next))) {
                    dateTo = "";
                }

                const updatedAdditional =
                    p.additionalServices?.map((asvc) => {
                        if (asvc.pricingModel === "per_day") {
                            let svcDateTo = asvc.dateTo;
                            if (svcDateTo && next && !dayjs(svcDateTo).isAfter(dayjs(next))) {
                                svcDateTo = "";
                            }
                            return { ...asvc, dateFrom: next, dateTo: svcDateTo };
                        }
                        // Dịch vụ không cần phòng: ngày gửi = globalDateFrom (không phụ thuộc pricingModel)
                        if (asvc.serviceId) {
                            const svc = services.find((s) => s.serviceId === asvc.serviceId);
                            if (svc && svc.isRequiredRoom === false) {
                                return { ...asvc, sessionDate: next };
                            }
                        }
                        return asvc;
                    }) ?? p.additionalServices;

                // Dịch vụ chính không cần phòng (per_session): tự fill ngày gửi theo globalDateFrom
                const mainSvc = p.serviceId ? services.find((s) => s.serviceId === p.serviceId) : undefined;
                const updatedSessionDate = mainSvc && mainSvc.isRequiredRoom === false ? next : p.sessionDate;

                return {
                    ...p,
                    dateFrom: next,
                    dateTo,
                    sessionDate: updatedSessionDate,
                    additionalServices: updatedAdditional,
                };
            })
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

                        // Nếu service mới:
                        // - isRequiredRoom=false: tự fill sessionDate theo globalDateFrom
                        // - isRequiredRoom=true : tự fill dateFrom theo globalDateFrom (để summary "Ngày gửi" không bị —)
                        const svc =
                            updates.serviceId != null ? services.find((x) => x.serviceId === updates.serviceId) : undefined;
                        if (svc?.isRequiredRoom === false) {
                            next.sessionDate = globalDateFrom || "";
                        }
                        if (svc?.isRequiredRoom === true) {
                            next.dateFrom = globalDateFrom || "";
                        }
                    }
                    if (updates.dateFrom !== undefined || updates.dateTo !== undefined) {
                        // DateFrom của dịch vụ "per_day" nên được đồng bộ từ globalDateFrom.
                        // Một số luồng trước đó có thể reset next.dateFrom về "" nên khi user chỉ chọn dateTo
                        // thì numberOfNights sẽ không được tính và room diagram cũng không mở.
                        const from = (updates.dateFrom ?? next.dateFrom ?? globalDateFrom) || "";
                        const to = updates.dateTo ?? next.dateTo;
                        next.dateFrom = from;
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
                    // DateFrom của booking "per_day" được áp dụng từ globalDateFrom phía trên.
                    // Nếu pet.dateFrom đang rỗng (do reset ở các luồng trước), thì cần đồng bộ khi user chọn dateTo
                    // để hiển thị số đêm và mở sơ đồ chọn phòng.
                    const from = (updates.dateFrom ?? next.dateFrom ?? globalDateFrom) || "";
                    const to = updates.dateTo ?? next.dateTo;
                    next.dateFrom = from;
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
                    // Nếu service:
                    // - isRequiredRoom=false: tự fill sessionDate theo globalDateFrom
                    // - isRequiredRoom=true : tự fill dateFrom theo globalDateFrom (để summary "Ngày gửi" không bị —)
                    const svc =
                        updates.serviceId != null ? services.find((x) => x.serviceId === updates.serviceId) : undefined;
                    if (svc?.isRequiredRoom === false) {
                        next.sessionDate = globalDateFrom || "";
                    }
                    if (svc?.isRequiredRoom === true) {
                        next.dateFrom = globalDateFrom || "";
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
    /** Remount dropdown "chọn TK để điền" sau mỗi lần chọn để có thể chọn lại cùng một dòng. */
    const [bankQuickFillKey, setBankQuickFillKey] = useState(0);

    const openBankInfoModal = async () => {
        // Reset bank form when opening
        if (isLoggedIn && myBankAccounts.length > 0) {
            setBankFormMode("select");
            const defaultAcc = myBankAccounts.find((a) => a.isDefault) ?? myBankAccounts[0];
            setSelectedBankAccountId(defaultAcc?.id ?? null);
        } else {
            setBankFormMode("add-new");
            setSelectedBankAccountId(null);
        }
        setBankForm({ accountNumber: "", accountHolderName: "", bankCode: "", note: "" });
        setBankQuickFillKey((k) => k + 1);
        setIsBankInfoOpen(true);
        // Pre-fill bank form theo email khách đã lưu (khi guest hoặc đang thêm mới)
        const email = step1Data?.email?.trim();
        if (email && (!isLoggedIn || myBankAccounts.length === 0)) {
            try {
                const res = await getBankByGuestEmail(email);
                if (res?.data) {
                    setBankForm({
                        accountNumber: res.data.accountNumber || "",
                        accountHolderName: res.data.accountHolderName || "",
                        bankCode: res.data.bankCode || "",
                        note: res.data.note ?? "",
                    });
                }
            } catch {
                // ignore
            }
        }
    };

    const handleProceedToPayment = async (bankPayload?: BankInformationPayload) => {
        if (!validateBeforePayment()) return;
        setIsHolding(true);
        try {
            const payload = buildCreateBookingPayload(step1Data, pets, isCounterBooking ? "walk-in" : "online");
            if (isCounterBooking) {
                const createRes = await createBookingFromClient(payload);
                const bookingCode = createRes?.data?.bookingCode;
                if (createRes?.success && bookingCode) {
                    const adminBookingsRes = await getAdminBookings();
                    const matched = (adminBookingsRes?.data ?? []).find((b) => b.bookingCode === bookingCode);
                    toast.success("Đặt lịch tại quầy thành công. Vui lòng ghi nhận thanh toán.");
                    if (matched?.id != null) {
                        navigate(`/admin/booking/detail/${matched.id}`, { replace: true });
                        return;
                    }
                    navigate("/admin/booking/list", { replace: true });
                    return;
                }
                toast.error(createRes?.message ?? "Không thể tạo đơn đặt lịch tại quầy.");
                return;
            }
            // Attach bank info if provided (guest or newly added)
            const finalPayload = bankPayload
                ? { ...payload, bankInformation: bankPayload }
                : payload;
            const res = await createBookingDepositIntent(finalPayload);
            if (res?.success && res?.data?.depositId && res?.data?.bookingCode) {
                // Nếu có bank info (khách vãng lai hoặc thêm mới), lưu vào bank_information gắn với booking
                if (bankPayload) {
                    try {
                        await createGuestBankInformationByBookingCode(res.data.bookingCode, {
                            bankName: bankPayload.bankName,
                            accountNumber: bankPayload.accountNumber,
                            accountHolderName: bankPayload.accountHolderName,
                            bankCode: bankPayload.bankCode,
                            note: bankPayload.note,
                            userEmail: step1Data?.email?.trim() || undefined,
                        });
                    } catch (e) {
                        // Nếu lưu bank info thất bại, vẫn cho khách tiếp tục nhưng log/toast nhẹ
                        console.error("Failed to create guest bank information", e);
                    }
                }
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
            if (!isCounterBooking) {
                setIsBankInfoOpen(false);
            }
        }
    };

    const handleBankInfoConfirm = async () => {
        if (isLoggedIn && bankFormMode === "select") {
            // Logged-in user selected an existing account — no need to send bankPayload
            await handleProceedToPayment();
        } else {
            // Guest or adding new: validate form
            const accNum = bankForm.accountNumber.trim();
            if (!accNum) {
                toast.error("Vui lòng nhập số tài khoản.");
                return;
            }
            if (!/^[0-9]+$/.test(accNum)) {
                toast.error("Số tài khoản chỉ được chứa chữ số (0-9).");
                return;
            }
            if (accNum.length < 6 || accNum.length > 19) {
                toast.error("Số tài khoản phải từ 6 đến 19 chữ số.");
                return;
            }

            const holderName = bankForm.accountHolderName.trim();
            if (!holderName) {
                toast.error("Vui lòng nhập tên chủ tài khoản.");
                return;
            }
            if (!bankForm.bankCode) {
                toast.error("Vui lòng chọn ngân hàng.");
                return;
            }
            
            const bankMeta = banks.find((b) => b.bankCode === bankForm.bankCode);
            await handleProceedToPayment({
                ...bankForm,
                accountNumber: accNum,
                accountHolderName: holderName,
                bankName: bankForm.bankName ?? bankMeta?.bankName ?? null,
            });
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <>
                {!isCounterBooking && (
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
                )}

                <div
                    ref={formSectionRef}
                    className={`app-container flex gap-[48px] justify-center ${isCounterBooking ? "py-8 bg-[#fbfbf9]" : "py-[60px]"}`}
                >
                    {!isCounterBooking && (
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
                    )}

                    <main className="w-full max-w-[800px]">
                        {isCounterBooking && (
                            <div className="mb-6">
                                <Link
                                    to={`/${prefixAdmin}/booking/list`}
                                    className="inline-flex items-center gap-2 text-[0.9375rem] font-[600] text-[#c45a3a] hover:text-[#a04330] transition-colors"
                                >
                                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} aria-hidden />
                                    Quay lại danh sách đặt lịch
                                </Link>
                            </div>
                        )}
                        {failedServiceIds.length > 0 && (
                            <div className="mb-[20px] rounded-[12px] border border-[#ffd7a8] bg-[#fff7ed] px-[16px] py-[12px]">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-[0.875rem] text-[#9a3412]">
                                        Một số quy tắc giá chưa tải được ({failedServiceIds.length} dịch vụ). Bạn có thể tải lại để đồng bộ giá.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void refetchServicePricing()}
                                        className="self-start rounded-[8px] border border-[#fb923c] bg-white px-[12px] py-[6px] text-[0.8125rem] font-[600] text-[#c2410c] transition hover:bg-[#fff1e6]"
                                    >
                                        Tải lại bảng giá
                                    </button>
                                </div>
                            </div>
                        )}

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
                                            className="w-9 h-9 rounded-full border border-[#eee] bg-white shadow-sm flex items-center justify-center text-[#181818] disabled:opacity-40 disabled:pointer-events-none hover:border-[#ffbaa0] hover:bg-[#fff7f3] transition-all duration-300 ease-out shrink-0"
                                            aria-label="Thú cưng trước"
                                        >
                                            <span className="text-[1.25rem] leading-none font-light">‹</span>
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
                                                            className={`flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 text-left min-w-[90px] max-w-[130px] transition-all duration-300 ease-out ${isActive
                                                                ? "border-[#ffbaa0] bg-[#fff7f3] shadow-sm"
                                                                : "border-[#eee] bg-white hover:border-[#ffbaa0]/60 hover:bg-[#fafafa] hover:scale-[1.01]"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-all duration-300 ease-out ${isActive ? "bg-[#ffbaa0]/50 text-[#c45a3a]" : "bg-[#f0f0f0] text-[#888]"
                                                                    }`}
                                                            >
                                                                <PetsIcon sx={{ fontSize: 16 }} />
                                                            </span>
                                                            <span className={`truncate transition-all duration-300 ease-out ${isActive ? "text-[0.8125rem] font-[700] text-[#181818]" : "text-[0.75rem] font-[500] text-[#555]"}`}>
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
                                            className="w-9 h-9 rounded-full border border-[#eee] bg-white shadow-sm flex items-center justify-center text-[#181818] disabled:opacity-40 disabled:pointer-events-none hover:border-[#ffbaa0] hover:bg-[#fff7f3] transition-all duration-300 ease-out shrink-0"
                                            aria-label="Thú cưng sau"
                                        >
                                            <span className="text-[1.25rem] leading-none font-light">›</span>
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

                                                            {/* Ngày gửi chung cho toàn bộ đơn (hiển thị một lần dưới thú cưng đầu tiên) */}
                                                            {index === 0 && (
                                                                <div className="mt-[16px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
                                                                    <div>
                                                                        <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">
                                                                            Ngày gửi (áp dụng cho tất cả dịch vụ) *
                                                                        </label>
                                                                        <DatePicker
                                                                            value={globalDateFrom ? dayjs(globalDateFrom) : null}
                                                                            onChange={(d: Dayjs | null) => {
                                                                                const next = d ? d.format("YYYY-MM-DD") : "";
                                                                                setGlobalDateFrom(next);
                                                                                applyGlobalDateFromToAll(next);
                                                                            }}
                                                                            minDate={minGlobalDateFrom}
                                                                            shouldDisableDate={(d) => isDateWithNoShiftInNearWeeks(d)}
                                                                            format="DD/MM/YYYY"
                                                                            slotProps={{
                                                                                textField: {
                                                                                    placeholder: "DD/MM/YYYY",
                                                                                    required: true,
                                                                                    fullWidth: true,
                                                                                    color: "warning",
                                                                                    sx: bookingDatePickerTextFieldSx,
                                                                                    helperText:
                                                                                        "Ngày gửi áp dụng cho mọi dịch vụ. Tuần này & tuần sau: chỉ chọn được ngày có ít nhất một ca làm (sáng hoặc chiều). Các tuần sau không giới hạn theo lịch ca.",
                                                                                },
                                                                                popper: { sx: bookingDatePickerPopperSx },
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

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
                                                                {/** Min Ngày gửi dựa trên advanceBookingHours của các dịch vụ cần phòng (main + additional). */}
                                                                {(() => {
                                                                    const mainService = pet.serviceId
                                                                        ? services.find((s) => s.serviceId === pet.serviceId)
                                                                        : undefined;
                                                                    const additionalRoomServices =
                                                                        (pet.additionalServices ?? [])
                                                                            .map((asvc) =>
                                                                                asvc.serviceId
                                                                                    ? services.find((s) => s.serviceId === asvc.serviceId)
                                                                                    : undefined
                                                                            )
                                                                            .filter(
                                                                                (s): s is ServiceClient =>
                                                                                    !!s && s.isRequiredRoom === true
                                                                            );
                                                                    const roomServices: ServiceClient[] = [
                                                                        ...(mainService?.isRequiredRoom ? [mainService as ServiceClient] : []),
                                                                        ...additionalRoomServices,
                                                                    ];
                                                                    const maxAdvanceHours =
                                                                        roomServices.length > 0
                                                                            ? Math.max(
                                                                                ...roomServices.map(
                                                                                    (s) => s.advanceBookingHours ?? 0
                                                                                )
                                                                            )
                                                                            : null;
                                                                    const minCheckInDate =
                                                                        maxAdvanceHours != null
                                                                            ? dayjs()
                                                                                .add(maxAdvanceHours, "hour")
                                                                                .startOf("day")
                                                                            : undefined;

                                                                    return (
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                            <div>
                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày gửi *</label>
                                                                                <DatePicker
                                                                                    disabled
                                                                                    readOnly
                                                                                    value={
                                                                                        (globalDateFrom || pet.dateFrom)
                                                                                            ? dayjs(globalDateFrom || pet.dateFrom)
                                                                                            : null
                                                                                    }
                                                                                    onChange={undefined}
                                                                                    minDate={minCheckInDate}
                                                                                    format="DD/MM/YYYY"
                                                                                    slotProps={{
                                                                                        textField: {
                                                                                            placeholder: "DD/MM/YYYY",
                                                                                            required: true,
                                                                                            fullWidth: true,
                                                                                            color: "warning",
                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                            helperText:
                                                                                                "Ngày gửi được lấy từ ô Ngày gửi chung phía trên.",
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
                                                                                    minDate={
                                                                                        (pet.dateFrom || globalDateFrom)
                                                                                            ? dayjs(pet.dateFrom || globalDateFrom).add(1, "day")
                                                                                            : dayjs().add(1, "day")
                                                                                    }
                                                                                    shouldDisableDate={(d) =>
                                                                                        shouldDisableReturnDateByShift(
                                                                                            globalDateFrom || pet.dateFrom,
                                                                                            d,
                                                                                            mainService?.isRequiredRoom === true
                                                                                        )
                                                                                    }
                                                                                    slotProps={{
                                                                                        textField: {
                                                                                            placeholder: "DD/MM/YYYY",
                                                                                            required: true,
                                                                                            fullWidth: true,
                                                                                            color: "warning",
                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                            helperText: [
                                                                                                pet.dateFrom && !pet.dateTo
                                                                                                    ? "Ngày trả phải sau ngày gửi (ít nhất 1 đêm)"
                                                                                                    : null,
                                                                                                helperTextReturnDateShift(mainService?.isRequiredRoom === true) ?? null,
                                                                                            ]
                                                                                                .filter(Boolean)
                                                                                                .join(" ") || undefined,
                                                                                        },
                                                                                        popper: { sx: bookingDatePickerPopperSx },
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {(() => {
                                                                    const effectiveFrom = pet.dateFrom || globalDateFrom;
                                                                    if (!effectiveFrom || !pet.dateTo) return null;
                                                                    if (!dayjs(pet.dateTo).isAfter(dayjs(effectiveFrom))) return null;
                                                                    const nights =
                                                                        pet.numberOfNights != null && pet.numberOfNights > 0
                                                                            ? pet.numberOfNights
                                                                            : dayjs(pet.dateTo).diff(dayjs(effectiveFrom), "day");
                                                                    if (!nights || nights <= 0) return null;
                                                                    return (
                                                                        <p className="mt-3 text-[0.875rem] font-[600] text-[#c45a3a]">
                                                                            Số đêm: {nights} đêm
                                                                        </p>
                                                                    );
                                                                })()}
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
                                                                                                                globalDateFrom={globalDateFrom}
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
                                                                    findMatchingPricingRule={findMatchingPricingRule}
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
                                                            globalDateFrom={globalDateFrom}
                                                            enforceAdvanceBookingHours={enforceAdvanceBookingHours}
                                                            bookingDatePickerPopperSx={bookingDatePickerPopperSx}
                                                            getServicePriceForWeight={getServicePriceForWeight}
                                                            sessionShiftCoverage={sessionShiftCoverageFlags}
                                                            // id để scroll tới phần session
                                                            // @ts-ignore
                                                            id={`pet-${pet.id}-main-session`}
                                                        />

                                                        {/* Dịch vụ thêm (nhiều booking_pet_services, không trùng dịch vụ) */}
                                                        <div className="border-t border-[#eee] pt-[20px]">
                                                            <div className="flex flex-col gap-3 mb-6">
                                                                <span className="text-[0.875rem] font-[600] text-[#181818]">Dịch vụ thêm</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addAdditionalService(pet.id)}
                                                                    className="flex items-center justify-center gap-2 py-[12px] px-[24px] rounded-[12px] border-2 border-dashed border-[#ffbaa0] bg-[#fff7f3] text-[#c45a3a] font-[700] text-[0.875rem] hover:bg-[#ffbaa0]/10 hover:border-[#c45a3a] transition-all duration-200"
                                                                >
                                                                    <AddIcon sx={{ fontSize: 22 }} /> Thêm dịch vụ
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
                                                                                className="space-y-3 relative group"
                                                                            >
                                                                                <ServiceSelectField
                                                                                    label={
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span>Chọn dịch vụ {index + 1}</span>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => removeAdditionalService(pet.id, asvc.id)}
                                                                                                className="p-1 rounded-[6px] text-[#e53935] hover:bg-[#fef2f2] transition-colors"
                                                                                                aria-label="Xóa dịch vụ thêm"
                                                                                            >
                                                                                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                                                                            </button>
                                                                                        </div>
                                                                                    }
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
                                                                                    const selectedIdsAdd = asvc.addonServiceIds ?? [];
                                                                                    const availableToAddAdd = addonForAdditional.filter((s) => !selectedIdsAdd.includes(s.serviceId));
                                                                                    const selectedServicesAdd = selectedIdsAdd
                                                                                        .map((id) => services.find((s) => s.serviceId === id))
                                                                                        .filter((s): s is ServiceClient => s != null);

                                                                                    const isAdditionalRoom = currentSvc?.isRequiredRoom === true;
                                                                                    const isAdditionalNonRoom = currentSvc?.isRequiredRoom === false;

                                                                                    return (
                                                                                        <>
                                                                                            {(addonForAdditional.length > 0 || selectedIdsAdd.length > 0) && (
                                                                                                <div className="mt-4 p-4 rounded-[12px] border border-[#ffe0ce] bg-[#fffbf9]">
                                                                                                    <label className="block mb-3 text-[0.875rem] font-[600] text-[#181818]">Dịch vụ add-on kèm theo (tùy chọn)</label>
                                                                                                    {selectedServicesAdd.length > 0 && (
                                                                                                        <div className="mb-3 flex flex-wrap gap-2">
                                                                                                            {selectedServicesAdd.map((s) => {
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
                                                                                                                            onClick={() => updateAdditionalService(pet.id, asvc.id, {
                                                                                                                                addonServiceIds: selectedIdsAdd.filter(id => id !== s.serviceId)
                                                                                                                            })}
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
                                                                                                                const price = getServicePriceForWeight(s, pet.weight, pet.petType);
                                                                                                                return (
                                                                                                                    <button
                                                                                                                        key={s.serviceId}
                                                                                                                        type="button"
                                                                                                                        onClick={() => updateAdditionalService(pet.id, asvc.id, {
                                                                                                                            addonServiceIds: [...selectedIdsAdd, s.serviceId]
                                                                                                                        })}
                                                                                                                        className="w-full text-left rounded-[10px] px-[10px] py-[8px] border border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3] transition-colors"
                                                                                                                    >
                                                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                                                            <span className="text-[0.875rem] font-[600] text-[#181818]">{s.serviceName}</span>
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
                                                                                                        selectedIdsAdd.length > 0 && availableToAddAdd.length === 0 ? (
                                                                                                            <p className="text-[0.8438rem] text-[#888] py-2">Không còn dịch vụ add-on để chọn.</p>
                                                                                                        ) : null
                                                                                                    )}
                                                                                                </div>
                                                                                            )}

                                                                                            {isAdditionalRoom && (
                                                                                                <>
                                                                                                    <div id={`pet-${pet.id}-${asvc.id}-dates`} className="p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce] scroll-mt-[120px] mt-4">
                                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                                                            <div>
                                                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ngày gửi *</label>
                                                                                                                <DatePicker
                                                                                                                    disabled
                                                                                                                    readOnly
                                                                                                                    value={
                                                                                                                        (globalDateFrom || asvc.dateFrom)
                                                                                                                            ? dayjs(globalDateFrom || asvc.dateFrom)
                                                                                                                            : null
                                                                                                                    }
                                                                                                                    onChange={undefined}
                                                                                                                    format="DD/MM/YYYY"
                                                                                                                    slotProps={{
                                                                                                                        textField: {
                                                                                                                            placeholder: "DD/MM/YYYY",
                                                                                                                            required: true,
                                                                                                                            fullWidth: true,
                                                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                                                            helperText: "Ngày gửi được lấy từ ô Ngày gửi chung phía trên.",
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
                                                                                                                    minDate={
                                                                                        (asvc.dateFrom || globalDateFrom || pet.dateFrom)
                                                                                            ? dayjs(asvc.dateFrom || globalDateFrom || pet.dateFrom).add(1, "day")
                                                                                            : dayjs().add(1, "day")
                                                                                    }
                                                                                                                    shouldDisableDate={(d) =>
                                                                                                                        shouldDisableReturnDateByShift(
                                                                                                                            globalDateFrom || asvc.dateFrom || pet.dateFrom,
                                                                                                                            d,
                                                                                                                            isAdditionalRoom
                                                                                                                        )
                                                                                                                    }
                                                                                                                    slotProps={{
                                                                                                                        textField: {
                                                                                                                            placeholder: "DD/MM/YYYY",
                                                                                                                            required: true,
                                                                                                                            fullWidth: true,
                                                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                                                            helperText: [
                                                                                                                                asvc.dateFrom && !asvc.dateTo
                                                                                                                                    ? "Ngày trả phải sau ngày gửi (ít nhất 1 đêm)"
                                                                                                                                    : null,
                                                                                                                                helperTextReturnDateShift(isAdditionalRoom) ?? null,
                                                                                                                            ]
                                                                                                                                .filter(Boolean)
                                                                                                                                .join(" ") || undefined,
                                                                                                                        },
                                                                                                                        popper: { sx: bookingDatePickerPopperSx },
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                        {(() => {
                                            const effectiveFrom = asvc.dateFrom || globalDateFrom;
                                            if (!effectiveFrom || !asvc.dateTo) return null;
                                            if (!dayjs(asvc.dateTo).isAfter(dayjs(effectiveFrom))) return null;
                                            const nights =
                                                asvc.numberOfNights != null && asvc.numberOfNights > 0
                                                    ? asvc.numberOfNights
                                                    : dayjs(asvc.dateTo).diff(dayjs(effectiveFrom), "day");
                                            if (!nights || nights <= 0) return null;
                                            return (
                                                <p className="mt-3 text-[0.875rem] font-[600] text-[#c45a3a]">
                                                    Số đêm: {nights} đêm
                                                </p>
                                            );
                                        })()}
                                                                                                        {petErrors[pet.id]?.serviceDateErrors?.[asvc.id] && (
                                                                                                            <p className="mt-2 text-[0.75rem] text-[#ef4444]">{petErrors[pet.id]?.serviceDateErrors?.[asvc.id]}</p>
                                                                                                        )}
                                                                                                    </div>

                                                                                                    <RoomPickerSectionForAdditional
                                                                                                        // @ts-ignore
                                                                                                        id={`pet-${pet.id}-${asvc.id}-room`}
                                                                                                        pet={pet}
                                                                                                        asvc={asvc}
                                                                                                        updateAdditionalService={updateAdditionalService}
                                                                                                        services={services}
                                                                                                        globalDateFrom={globalDateFrom}
                                                                                                        getAdditionalRoomTotalPrice={(a, rt) => getAdditionalRoomTotalPrice(a, rt, pet)}
                                                                                                        onViewRoomDetail={(room) =>
                                                                                                            navigate(`/dat-lich/phong/${room.roomId}`, {
                                                                                                                state: {
                                                                                                                    fromBooking: true,
                                                                                                                    room,
                                                                                                                    bookingDraft: { step1Data, pets },
                                                                                                                },
                                                                                                            })
                                                                                                        }
                                                                                                        findMatchingPricingRule={findMatchingPricingRule}
                                                                                                    />
                                                                                                    {petErrors[pet.id]?.serviceRoomErrors?.[asvc.id] && (
                                                                                                        <p className="mt-2 text-[0.75rem] text-[#ef4444]">{petErrors[pet.id]?.serviceRoomErrors?.[asvc.id]}</p>
                                                                                                    )}
                                                                                                </>
                                                                                            )}

                                                                                            {isAdditionalNonRoom && (
                                                                                                <AdditionalServiceNonRoomFields
                                                                                                    petId={pet.id}
                                                                                                    pet={pet}
                                                                                                    asvc={asvc}
                                                                                                    updateAdditionalService={updateAdditionalService}
                                                                                                    services={services}
                                                                                                    globalDateFrom={globalDateFrom}
                                                                                                    enforceAdvanceBookingHours={enforceAdvanceBookingHours}
                                                                                                    bookingDatePickerPopperSx={bookingDatePickerPopperSx}
                                                                                                    getServicePriceForWeight={getServicePriceForWeight}
                                                                                                    sessionShiftCoverage={sessionShiftCoverageFlags}
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
                                    onClick={() => navigate(isCounterBooking ? "/admin/booking/create?mode=counter" : "/dat-lich", {
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
                                        {isHolding ? (isCounterBooking ? "Đang tạo đơn..." : "Đang giữ chỗ...") : (isCounterBooking ? "Tạo đơn tại quầy" : "Tiếp tục thanh toán")}
                                    </button>
                                </div>
                            </section>
                        </form>
                    </main>
                </div>

                {isSummaryOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
                        <div className="bg-white rounded-[18px] max-w-[960px] w-full max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(15,23,42,0.45)] p-[24px] sm:p-[28px]">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <h3 className="text-[1.3125rem] font-[800] text-[#181818]">Xác nhận thông tin đặt lịch</h3>
                                    <p className="text-[0.875rem] text-[#6b7280] mt-0.5">
                                        {isCounterBooking
                                            ? "Vui lòng kiểm tra lại thông tin trước khi tạo đơn tại quầy."
                                            : "Vui lòng kiểm tra lại thông tin trước khi tiếp tục thanh toán cọc."}
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

                            <div className="space-y-6">
                                <section>
                                    <h4 className="text-[1rem] font-[700] text-[#181818] mb-2">Thông tin chủ thú cưng</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-[12px] gap-x-[24px] text-[0.875rem]">
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[2px]">Họ và tên</span>
                                            <span className="font-[600] text-[#181818]">{step1Data.fullName || "—"}</span>
                                        </div>
                                        <div className="sm:col-span-2">
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
                                                    const effectiveFrom = pet.dateFrom || globalDateFrom;
                                                    const nights =
                                                        pet.numberOfNights != null && pet.numberOfNights > 0
                                                            ? pet.numberOfNights
                                                            : effectiveFrom && pet.dateTo && dayjs(pet.dateTo).isAfter(dayjs(effectiveFrom))
                                                                ? dayjs(pet.dateTo).diff(dayjs(effectiveFrom), "day")
                                                                : null;
                                                    if (!pet.serviceId || !nights || nights < 1) return { unit: null, total: null };
                                                    const roomTypeId = pet.selectedRoomTypeId ?? null;
                                                    // Resolve theo quy tắc admin: roomType + petType + cân nặng.
                                                    const rule = findMatchingPricingRuleWithRoom(pet.serviceId, roomTypeId, pet.weight, pet.petType);
                                                    if (rule?.price == null) return { unit: null, total: null };
                                                    return {
                                                        unit: rule.price,
                                                        total: rule.price * nights,
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
                                                    const effectiveFrom = asvc.dateFrom || globalDateFrom;
                                                    const nights =
                                                        asvc.numberOfNights != null && asvc.numberOfNights > 0
                                                            ? asvc.numberOfNights
                                                            : effectiveFrom && asvc.dateTo && dayjs(asvc.dateTo).isAfter(dayjs(effectiveFrom))
                                                                ? dayjs(asvc.dateTo).diff(dayjs(effectiveFrom), "day")
                                                                : null;
                                                    if (!asvc.serviceId || !nights || nights < 1) return { unit: null, total: null };
                                                    const roomTypeId = asvc.selectedRoomTypeId ?? null;
                                                    // Resolve theo quy tắc admin: roomType + petType + cân nặng.
                                                    const rule = findMatchingPricingRuleWithRoom(asvc.serviceId, roomTypeId, pet.weight, pet.petType);
                                                    if (rule?.price == null) return { unit: null, total: null };
                                                    return {
                                                        unit: rule.price,
                                                        total: rule.price * nights,
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

                                            const showFoodDetails = pet.foodBrought;
                                            const foodItems = pet.foodItems ?? [];

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
                                                            <div className="space-y-[2px] text-[0.8125rem] text-[#6b7280]">
                                                                <div>
                                                                    Loại: {pet.petType || "—"}{" "}
                                                                    {pet.weight ? `• Cân nặng: ${pet.weight}kg` : ""}
                                                                </div>
                                                                {(pet.emergencyContactName || pet.emergencyContactPhone) && (
                                                                    <div>
                                                                        Liên hệ khẩn cấp:{" "}
                                                                        <span className="font-[500]">
                                                                            {pet.emergencyContactName || "—"}
                                                                        </span>
                                                                        {pet.emergencyContactPhone && (
                                                                            <>
                                                                                {" "}
                                                                                •{" "}
                                                                                <span className="font-[500]">
                                                                                    {pet.emergencyContactPhone}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {pet.notes && (
                                                                    <div>
                                                                        Ghi chú tình trạng:{" "}
                                                                        <span className="font-[500]">
                                                                            {pet.notes}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {showFoodDetails && (
                                                                    <div>
                                                                        Thức ăn mang theo:{" "}
                                                                        {foodItems.length === 0 ? (
                                                                            <span className="font-[500]">Có</span>
                                                                        ) : (
                                                                            <ul className="list-disc list-inside mt-[1px] space-y-[1px]">
                                                                                {foodItems.map((fi, fiIdx) => (
                                                                                    <li key={fiIdx}>
                                                                                        <span className="font-[500]">
                                                                                            {fi.foodBroughtType || "Thức ăn"}
                                                                                        </span>
                                                                                        {fi.foodBrand && ` — ${fi.foodBrand}`}
                                                                                        {fi.quantity != null && ` • SL: ${fi.quantity}`}
                                                                                        {fi.feedingInstructions && ` • ${fi.feedingInstructions}`}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                )}
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
                                                                                        <div>
                                                                                            Khung giờ:{" "}
                                                                                            <span className="font-[500]">
                                                                                                {pet.sessionSlotLabel || pet.sessionSlot || "—"}
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
                                        if (isCounterBooking) {
                                            handleProceedToPayment();
                                            return;
                                        }
                                        openBankInfoModal();
                                    }}
                                    className="py-[11px] px-[26px] rounded-[12px] bg-[#ffbaa0] hover:bg-[#e6a890] text-[#181818] text-[0.9375rem] font-[700] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isCounterBooking ? "Tạo đơn tại quầy" : "Tiếp tục thanh toán"}
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
                                                    className={`w-full text-left rounded-[14px] border-2 p-4 transition-all ${isSelected
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

                                    {isLoggedIn && bankFormMode === "add-new" && myBankAccounts.length > 0 && (
                                        <div className="rounded-[14px] border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
                                            <div className="text-[0.8125rem] font-[700] text-[#374151]">
                                                Điền nhanh từ tài khoản đã lưu
                                            </div>
                                            <p className="text-[0.75rem] text-[#6b7280] -mt-1">
                                                Chọn một tài khoản để tự điền form bên dưới — bạn vẫn có thể chỉnh sửa trước khi xác nhận.
                                            </p>
                                            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const acc =
                                                            myBankAccounts.find((a) => a.isDefault) ?? myBankAccounts[0];
                                                        if (!acc) return;
                                                        setBankForm({
                                                            accountNumber: acc.accountNumber || "",
                                                            accountHolderName: (acc.accountHolderName || "").toUpperCase(),
                                                            bankCode: acc.bankCode || "",
                                                            note: acc.note ?? "",
                                                            bankName: acc.bankName ?? undefined,
                                                        });
                                                        toast.success("Đã điền từ tài khoản mặc định.");
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-[12px] border-2 border-[#ffbaa0] bg-white px-4 py-2.5 text-[0.8125rem] font-[700] text-[#c45a3a] hover:bg-[#fff7f3] transition-colors"
                                                >
                                                    Điền tài khoản mặc định
                                                </button>
                                                <div className="flex-1 min-w-[200px]">
                                                    <label htmlFor="booking-bank-quick-fill" className="sr-only">
                                                        Chọn tài khoản đã lưu để điền form
                                                    </label>
                                                    <select
                                                        key={bankQuickFillKey}
                                                        id="booking-bank-quick-fill"
                                                        defaultValue=""
                                                        className="w-full py-[11px] px-[14px] text-[0.8438rem] text-[#111827] outline-none border border-[#d1d5db] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 rounded-[12px] bg-white"
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            if (!raw) return;
                                                            const id = Number(raw);
                                                            const acc = myBankAccounts.find((a) => a.id === id);
                                                            if (!acc) return;
                                                            setBankForm({
                                                                accountNumber: acc.accountNumber || "",
                                                                accountHolderName: (acc.accountHolderName || "").toUpperCase(),
                                                                bankCode: acc.bankCode || "",
                                                                note: acc.note ?? "",
                                                                bankName: acc.bankName ?? undefined,
                                                            });
                                                            setBankQuickFillKey((k) => k + 1);
                                                            toast.success("Đã điền thông tin từ tài khoản đã chọn.");
                                                        }}
                                                    >
                                                        <option value="">— Hoặc chọn tài khoản trong danh sách —</option>
                                                        {myBankAccounts.map((acc) => (
                                                            <option key={acc.id} value={acc.id}>
                                                                {acc.bankName} · {acc.accountNumber}
                                                                {acc.isDefault ? " (Mặc định)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
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
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="text-[0.8438rem] text-[#9ca3af] text-center">
                                        Bạn chưa có tài khoản ngân hàng nào.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBankFormMode("add-new");
                                            setBankForm({ accountNumber: "", accountHolderName: "", bankCode: "", note: "" });
                                            setSelectedBankAccountId(null);
                                        }}
                                        className="flex items-center gap-2 rounded-[12px] border-2 border-[#ffbaa0] bg-[#fff7f3] px-5 py-2.5 text-[0.875rem] font-[700] text-[#c45a3a] hover:bg-[#ffbaa0] hover:text-[#181818] transition-colors"
                                    >
                                        <span className="text-[1.1rem]">+</span> Thêm mới
                                    </button>
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

                {!isCounterBooking && (
                    <>
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
                                            <p className="text-[#181818]">99/45, Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, Ho Chi Minh City, Vietnam</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-[32px]">
                                        <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                                            <PhoneEnabledOutlinedIcon style={{ fontSize: "2.5rem" }} />
                                        </div>
                                        <div className="pl-[20px]">
                                            <div className="text-[1.375rem] font-[800] text-[#181818] mb-[12px]">Số điện thoại</div>
                                            <p className="text-[#181818]">096 768 13 28</p>
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
                )}
            </>
        </LocalizationProvider>
    );
};
