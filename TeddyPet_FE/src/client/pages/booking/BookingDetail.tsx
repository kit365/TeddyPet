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
import { getServicePricingsByServiceId } from "../../../admin/api/service-pricing.api";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import "dayjs/locale/vi";
import { buildCreateBookingPayload } from "../../../api/booking.api";
import { createBookingDepositIntent } from "../../../api/booking-deposit.api";
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
    /** Lá»—i NgÃ y gá»­i/NgÃ y tráº£ cho tá»«ng dá»‹ch vá»¥ (key: "main" hoáº·c id cá»§a dá»‹ch vá»¥ thÃªm). */
    serviceDateErrors?: Record<string, string>;
    /** Lá»—i chá»n phÃ²ng cho tá»«ng dá»‹ch vá»¥ yÃªu cáº§u phÃ²ng (key: "main" hoáº·c id cá»§a dá»‹ch vá»¥ thÃªm). */
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
        if (canShowOther) opts.push({ value: OTHER_BRAND_VALUE, label: "KhÃ¡c" });
        return opts;
    }, [availableBrands, canShowOther]);

    const placeholder = !petTypeEnum ? "Vui lÃ²ng chá»n loáº¡i thÃº cÆ°ng" : !foodType ? "Chá»n loáº¡i thá»©c Äƒn trÆ°á»›c" : isFetching ? "Äang táº£i nhÃ£n hiá»‡u..." : "Chá»n nhÃ£n hiá»‡u";

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
                <span className="truncate">{renderLabel(value) || "â€” Chá»n loáº¡i â€”"}</span>
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

type GenericDropdownOption = { value: string; label: string };

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

type ServiceTypeFilter = "ROOM_REQUIRED" | "SPA";

type ServiceDropdownContentProps = {
    categories: ServiceCategoryClient[];
    services: ServiceClient[];
    selectedServiceId: number | null | undefined;
    petWeight?: string | null;
    petType?: string | null;
    onSelect: (serviceId: number) => void;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
};

const SERVICE_DROPDOWN_FILTERS: Array<{ key: ServiceTypeFilter; label: string; description: string }> = [
    { key: "ROOM_REQUIRED", label: "LÆ°u trÃº", description: "Dá»‹ch vá»¥ cáº§n chá»n phÃ²ng" },
    { key: "SPA", label: "Spa", description: "Dá»‹ch vá»¥ khÃ´ng cáº§n phÃ²ng" },
];

const SERVICE_IMAGE_FALLBACK =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='24' fill='%23FFF2EA'/><path d='M31 56c0-8.3 6.7-15 15-15h4c8.3 0 15 6.7 15 15v6H31v-6Z' fill='%23F39A74'/><circle cx='40' cy='39' r='8' fill='%23F7B79A'/><circle cx='56' cy='39' r='8' fill='%23F7B79A'/><circle cx='48' cy='30' r='7' fill='%23FFD7C5'/></svg>";

const getServiceTypeFilter = (service: ServiceClient): ServiceTypeFilter =>
    service.isRequiredRoom === true ? "ROOM_REQUIRED" : "SPA";

const ServiceDropdownContent = ({
    categories,
    services,
    selectedServiceId,
    petWeight,
    petType,
    onSelect,
    getServicePriceForWeight,
}: ServiceDropdownContentProps) => {
    const categorizedServices = useMemo(() => {
        return categories.map((cat) => ({
            cat,
            catServices: services.filter((s) => s.serviceCategoryId === cat.categoryId),
        }));
    }, [categories, services]);

    const availableFilterKeys = useMemo(() => {
        const next = new Set<ServiceTypeFilter>();
        categorizedServices.forEach(({ catServices }) => {
            catServices.forEach((service) => next.add(getServiceTypeFilter(service)));
        });
        return next;
    }, [categorizedServices]);

    const [activeFilter, setActiveFilter] = useState<ServiceTypeFilter>(() => {
        const selectedService = services.find((service) => service.serviceId === selectedServiceId);
        if (selectedService) return getServiceTypeFilter(selectedService);
        return availableFilterKeys.has("SPA") ? "SPA" : "ROOM_REQUIRED";
    });

    useEffect(() => {
        const selectedService = services.find((service) => service.serviceId === selectedServiceId);
        if (selectedService) {
            const selectedFilter = getServiceTypeFilter(selectedService);
            if (selectedFilter !== activeFilter) {
                setActiveFilter(selectedFilter);
            }
            return;
        }

        if (!availableFilterKeys.has(activeFilter)) {
            setActiveFilter(availableFilterKeys.has("SPA") ? "SPA" : "ROOM_REQUIRED");
        }
    }, [activeFilter, availableFilterKeys, selectedServiceId, services]);

    const filteredSections = useMemo(() => {
        return categorizedServices
            .map(({ cat, catServices }) => ({
                cat,
                catServices: catServices.filter((service) => getServiceTypeFilter(service) === activeFilter),
            }))
            .filter(({ catServices }) => catServices.length > 0);
    }, [activeFilter, categorizedServices]);

    return (
        <div className="py-[12px]">
            <div className="px-[12px] pb-[12px] border-b border-[#f2e4db]">
                <div className="flex flex-wrap gap-[8px]">
                    {SERVICE_DROPDOWN_FILTERS.map((filter) => {
                        const isSelected = filter.key === activeFilter;
                        const isDisabled = !availableFilterKeys.has(filter.key);
                        return (
                            <button
                                key={filter.key}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`rounded-full px-[12px] py-[8px] text-left transition-all border ${
                                    isSelected
                                        ? "border-[#ffb08d] bg-[#fff3ec] text-[#c45a3a]"
                                        : isDisabled
                                            ? "border-[#f1f1f1] bg-[#fafafa] text-[#b5b5b5] cursor-not-allowed"
                                            : "border-[#eee2d8] bg-white text-[#4b5563] hover:border-[#ffcfbb] hover:bg-[#fff8f4]"
                                }`}
                            >
                                <div className="text-[0.875rem] font-[700]">{filter.label}</div>
                                <div className="text-[0.75rem] font-[500] opacity-80">{filter.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="py-[8px]">
                {filteredSections.length > 0 ? (
                    filteredSections.map(({ cat, catServices }) => (
                        <div key={cat.categoryId} className="px-[12px] py-[8px]">
                            <div className="mb-[8px] text-[0.8125rem] font-[700] uppercase tracking-[0.04em] text-[#7b8794]">
                                {cat.categoryName}
                            </div>
                            <div className="space-y-[8px]">
                                {catServices.map((service) => {
                                    const price = getServicePriceForWeight(service, petWeight, petType);
                                    const isSelected = selectedServiceId === service.serviceId;
                                    return (
                                        <button
                                            key={service.serviceId}
                                            type="button"
                                            onClick={() => onSelect(service.serviceId)}
                                            className={`w-full rounded-[16px] border p-[10px] text-left transition-all ${
                                                isSelected
                                                    ? "border-[#ffb08d] bg-[#fff7f3] shadow-[0_10px_25px_rgba(255,186,160,0.16)]"
                                                    : "border-[#f2e7e1] bg-white hover:border-[#ffd3bf] hover:bg-[#fffaf7]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-[12px]">
                                                <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[14px] bg-[#fff3ec] ring-1 ring-[#f6e4db]">
                                                    <img
                                                        src={service.imageURL || SERVICE_IMAGE_FALLBACK}
                                                        alt={service.serviceName}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-[12px]">
                                                        <div className="min-w-0">
                                                            <div className="truncate text-[0.9688rem] font-[700] text-[#181818]">
                                                                {service.serviceName}
                                                            </div>
                                                            <div className="mt-[4px] text-[0.7812rem] font-[600] text-[#7b8794]">
                                                                {service.isRequiredRoom === true ? "Cáº§n chá»n phÃ²ng" : "Dá»‹ch vá»¥ táº¡i spa"}
                                                            </div>
                                                        </div>
                                                        {service.isRequiredRoom !== true && price != null && (
                                                            <div className="shrink-0 text-right">
                                                                <div className="text-[0.9375rem] font-[700] text-[#c45a3a] whitespace-nowrap">
                                                                    {Number(price).toLocaleString("vi-VN")}Ä‘
                                                                </div>
                                                                <div className="text-[0.75rem] font-[600] text-[#8a8a8a]">
                                                                    GiÃ¡ dá»± kiáº¿n
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-[16px] py-[24px] text-center">
                        <div className="text-[0.9375rem] font-[700] text-[#6b7280]">ChÆ°a cÃ³ dá»‹ch vá»¥ phÃ¹ há»£p</div>
                        <div className="mt-[4px] text-[0.8125rem] font-[500] text-[#9ca3af]">
                            HÃ£y chuyá»ƒn sang nhÃ³m cÃ²n láº¡i hoáº·c kiá»ƒm tra láº¡i loáº¡i thÃº cÆ°ng vÃ  cÃ¢n náº·ng.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
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
        return (
            <button
                key={opt.value}
                type="button"
                onClick={() => {
                    onChange(opt.value, opt.label);
                    onToggle();
                }}
                className={`w-full text-left rounded-[12px] px-[14px] py-[11px] transition-all flex items-center justify-between ${isSelected
                    ? "bg-[#fff7f3] text-[#c45a3a]"
                    : "text-[#4b5563] hover:bg-[#fff7f3]/50 hover:text-[#c45a3a]"
                    }`}
            >
                <span className={`text-[0.9062rem] whitespace-nowrap ${isSelected ? "font-[700]" : "font-[500]"}`}>{opt.label}</span>
                {isSelected && (
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
                <span className="truncate">{selectedOption?.label || placeholder || "â€” Chá»n â€”"}</span>
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
                            <div className="py-8 px-4 text-center text-[0.875rem] text-[#9ca3af]">KhÃ´ng cÃ³ tÃ¹y chá»n kháº£ dá»¥ng</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/** Ã” NgÃ y gá»­i + Khung giá» khi dá»‹ch vá»¥ thÃªm cÃ³ isRequiredRoom = false (dÃ¹ng time_slots cá»§a dá»‹ch vá»¥). */
type AdditionalServiceNonRoomFieldsProps = {
    petId: string;
    pet: BookingPetForm;
    asvc: BookingPetServiceForm;
    updateAdditionalService: (petId: string, svcId: string, updates: Partial<BookingPetServiceForm>) => void;
    services: ServiceClient[];
    globalDateFrom: string;
    bookingDatePickerPopperSx: object;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
};

/** Ã” NgÃ y gá»­i + Khung giá» cho dá»‹ch vá»¥ chÃ­nh khi isRequiredRoom = false (dÃ¹ng time_slots cá»§a dá»‹ch vá»¥). */
type MainServiceNonRoomFieldsProps = {
    pet: BookingPetForm;
    updatePet: (id: string, updates: Partial<BookingPetForm>) => void;
    services: ServiceClient[];
    globalDateFrom: string;
    bookingDatePickerPopperSx: object;
    getServicePriceForWeight: (service: ServiceClient, petWeightStr?: string | null, petType?: string | null) => number | undefined;
};

const MainServiceNonRoomFields = ({
    pet,
    updatePet,
    services,
    globalDateFrom,
    bookingDatePickerPopperSx,
    getServicePriceForWeight,
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
                const option = { value: String(ts.id), label };

                // Determine AM or PM based on start time (HH:mm)
                if (start && start >= "12:00") {
                    pm.push(option);
                } else {
                    am.push(option);
                }
            });

        const groups: GenericDropdownGroup[] = [];
        if (am.length > 0) groups.push({ groupLabel: "Buá»•i sÃ¡ng (AM)", options: am });
        if (pm.length > 0) groups.push({ groupLabel: "Buá»•i chiá»u (PM)", options: pm });
        return groups;
    }, [timeSlots]);

    if (!pet.serviceId || !isNonRoom) return null;

    const advanceHours = selectedSvc?.advanceBookingHours ?? 24;
    const minSessionDate = dayjs().add(advanceHours, "hour").startOf("day");

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
                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">NgÃ y gá»­i *</label>
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
                            helperText: "NgÃ y gá»­i Ä‘Æ°á»£c láº¥y tá»« Ã´ NgÃ y gá»­i chung phÃ­a trÃªn.",
                        },
                        popper: { sx: bookingDatePickerPopperSx },
                    }}
                />
            </div>
            <div>
                <GenericDropdown
                    label="Khung giá»"
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
                    placeholder="â€” Chá»n khung giá» â€”"
                    twoColumns={true}
                />
            </div>
            {(mainServicePrice != null || addonServices.length > 0) && (
                <div className="sm:col-span-2 mt-2 rounded-[10px] bg-white border border-[#ffe0ce] px-4 py-3">
                    <div className="text-[0.8438rem] text-[#181818] font-[600] mb-1">TÃ³m táº¯t giÃ¡ dá»± kiáº¿n</div>
                    {mainServicePrice != null && (
                        <div className="text-[0.8125rem] text-[#555]">
                            Dá»‹ch vá»¥ chÃ­nh:{" "}
                            <strong className="text-[#c45a3a]">
                                {selectedSvc?.serviceName} â€” {Number(mainServicePrice).toLocaleString("vi-VN")}Ä‘
                            </strong>
                        </div>
                    )}
                    <div className="text-[0.8125rem] text-[#555] mt-1">
                        Dá»‹ch vá»¥ add-on:{" "}
                        {addonServices.length === 0 ? (
                            <span className="text-[#888]">KhÃ´ng cÃ³</span>
                        ) : (
                            <span className="text-[#181818]">
                                {addonServices
                                    .map((s) => {
                                        const p = getServicePriceForWeight(s, pet.weight, pet.petType);
                                        const priceText = p != null ? ` â€” ${Number(p).toLocaleString("vi-VN")}Ä‘` : "";
                                        return `${s.serviceName}${priceText}`;
                                    })
                                    .join("; ")}
                            </span>
                        )}
                    </div>
                    {totalEstimated > 0 && (
                        <div className="text-[0.8438rem] text-[#555] mt-2">
                            Tá»•ng dá»± kiáº¿n:{" "}
                            <strong className="text-[0.9375rem] text-[#c45a3a]">
                                {Number(totalEstimated).toLocaleString("vi-VN")}Ä‘
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
    bookingDatePickerPopperSx,
    getServicePriceForWeight,
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
                const option = { value: String(ts.id), label };

                if (start && start >= "12:00") {
                    pm.push(option);
                } else {
                    am.push(option);
                }
            });

        const groups: GenericDropdownGroup[] = [];
        if (am.length > 0) groups.push({ groupLabel: "Buá»•i sÃ¡ng (AM)", options: am });
        if (pm.length > 0) groups.push({ groupLabel: "Buá»•i chiá»u (PM)", options: pm });
        return groups;
    }, [timeSlots]);

    if (!asvc.serviceId || !isNonRoom) return null;

    const advanceHours = selectedSvc?.advanceBookingHours ?? 24;
    const minSessionDate = dayjs().add(advanceHours, "hour").startOf("day");

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
                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">NgÃ y gá»­i *</label>
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
                            helperText: "NgÃ y gá»­i Ä‘Æ°á»£c láº¥y tá»« Ã´ NgÃ y gá»­i chung phÃ­a trÃªn.",
                        },
                        popper: { sx: bookingDatePickerPopperSx },
                    }}
                />
            </div>
            <div>
                <GenericDropdown
                    label="Khung giá»"
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
                    placeholder="â€” Chá»n khung giá» â€”"
                    twoColumns={true}
                />
            </div>
            {(mainServicePrice != null || addonServices.length > 0) && (
                <div className="sm:col-span-2 mt-2 rounded-[10px] bg-white border border-[#ffe0ce] px-4 py-3">
                    <div className="text-[0.8438rem] text-[#181818] font-[600] mb-1">TÃ³m táº¯t giÃ¡ dá»‹ch vá»¥ thÃªm</div>
                    {mainServicePrice != null && (
                        <div className="text-[0.8125rem] text-[#555]">
                            Dá»‹ch vá»¥ thÃªm:{" "}
                            <strong className="text-[#c45a3a]">
                                {selectedSvc?.serviceName} â€” {Number(mainServicePrice).toLocaleString("vi-VN")}Ä‘
                            </strong>
                        </div>
                    )}
                    <div className="text-[0.8125rem] text-[#555] mt-1">
                        Dá»‹ch vá»¥ add-on:{" "}
                        {addonServices.length === 0 ? (
                            <span className="text-[#888]">KhÃ´ng cÃ³</span>
                        ) : (
                            <span className="text-[#181818]">
                                {addonServices
                                    .map((s) => {
                                        const p = getServicePriceForWeight(s, pet.weight, pet.petType);
                                        const priceText = p != null ? ` â€” ${Number(p).toLocaleString("vi-VN")}Ä‘` : "";
                                        return `${s.serviceName}${priceText}`;
                                    })
                                    .join("; ")}
                            </span>
                        )}
                    </div>
                    {totalEstimated > 0 && (
                        <div className="text-[0.8438rem] text-[#555] mt-2">
                            Tá»•ng dá»± kiáº¿n:{" "}
                            <strong className="text-[0.9375rem] text-[#c45a3a]">
                                {Number(totalEstimated).toLocaleString("vi-VN")}Ä‘
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

    // Náº¿u state dateFrom bá»‹ reset vá» "", váº«n láº¥y tá»« globalDateFrom Ä‘á»ƒ hiá»ƒn thá»‹/ má»Ÿ sÆ¡ Ä‘á»“ chÃ­nh xÃ¡c.
    const effectiveDateFrom = pet.dateFrom || globalDateFrom;
    // Chá»‰ cáº§n Ä‘á»§ ngÃ y gá»­i/ngÃ y tráº£ há»£p lá»‡ lÃ  má»Ÿ sÆ¡ Ä‘á»“.
    // TrÆ°á»›c Ä‘Ã¢y cÃ³ phá»¥ thuá»™c pet.pricingModel khiáº¿n má»™t sá»‘ luá»“ng reset dateFrom lÃ m sÆ¡ Ä‘á»“ khÃ´ng má»Ÿ.
    const hasDates =
        !!(
            pet.pricingModel === "per_day" &&
            effectiveDateFrom &&
            pet.dateTo &&
            dayjs(pet.dateTo).isAfter(dayjs(effectiveDateFrom))
        );
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

    const { data: bookedRoomIdsData } = useQuery({
        queryKey: ["booked-room-ids", effectiveDateFrom, pet.dateTo],
        queryFn: () => getBookedRoomIds(effectiveDateFrom!, pet.dateTo!),
        enabled: showPicker && !!effectiveDateFrom && !!pet.dateTo,
        select: (res) => res.data ?? [],
    });

    const rooms: RoomClient[] = roomsData ?? [];
    const bookedRoomIdSet = useMemo(() => new Set(bookedRoomIdsData ?? []), [bookedRoomIdsData]);
    const roomTypes: RoomTypeClient[] = (roomTypesData ?? []).filter((rt) => rt.isActive && !rt.isDeleted);
    const selectedRoomTypeId = pet.selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;
    const effectiveRoomTypeId = selectedRoomTypeId ?? roomTypes[0]?.roomTypeId ?? null;

    // Tá»± chá»n loáº¡i phÃ²ng Ä‘áº§u tiÃªn khi picker hiá»ƒn thá»‹ mÃ  chÆ°a cÃ³ loáº¡i phÃ²ng nÃ o Ä‘Æ°á»£c chá»n
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
        const phoneValue = hasPhone ? supportPhone!.trim() : DEFAULT_SHOP_PHONE;
        
        return (
            <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
                <p className="text-[0.875rem] text-[#555]">
                    ChÆ°a cÃ³ dá»¯ liá»‡u phÃ²ng cho dá»‹ch vá»¥ nÃ y, vui lÃ²ng liÃªn há»‡ hotline{" "}
                    <a 
                        href={`tel:${phoneValue.replace(/\s+/g, '')}`} 
                        className="text-[#c45a3a] font-[700] hover:underline"
                    >
                        {phoneValue}
                    </a>{" "}
                    Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.
                </p>
            </div>
        );
    }

    const maxRows = activeLayout.maxRows ?? 10;
    const maxCols = activeLayout.maxCols ?? 20;

    return (
        <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
            <label className="block mb-[12px] text-[0.875rem] font-[600] text-[#181818]">Chá»n phÃ²ng *</label>

            {roomTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-[12px]">
                    <span className="w-full text-[0.8125rem] text-[#888] mb-1">Chá»n loáº¡i phÃ²ng:</span>
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
                    Vui lÃ²ng chá»n loáº¡i phÃ²ng á»Ÿ trÃªn Ä‘á»ƒ xem sÆ¡ Ä‘á»“ vÃ  chá»n phÃ²ng.
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
                                    title={isBooked ? "PhÃ²ng Ä‘Ã£ Ä‘Æ°á»£c Ä‘áº·t" : undefined}
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

            {/* PhÃ²ng Ä‘ang chá»n + giÃ¡ tá»•ng + Xem chi tiáº¿t (chá»‰ khi Ä‘Ã£ chá»n phÃ²ng) */}
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
                        <div className="text-[0.8438rem] text-[#181818] font-[600] mb-2">TÃ³m táº¯t giÃ¡ dá»± kiáº¿n</div>
                        <div className="space-y-1.5">
                            {mainServicePrice != null && (
                                <div className="text-[0.8125rem] text-[#555]">
                                    Dá»‹ch vá»¥ chÃ­nh:{" "}
                                    <strong className="text-[#c45a3a]">
                                        {selectedService.serviceName}
                                        {pet.numberOfNights != null && pet.numberOfNights > 0 && (
                                            <> â€” {Number(Math.round(mainServicePrice / pet.numberOfNights)).toLocaleString("vi-VN")}Ä‘ x{pet.numberOfNights} Ä‘Ãªm</>
                                        )}
                                        {" "} â€” {Number(mainServicePrice).toLocaleString("vi-VN")}Ä‘
                                    </strong>
                                </div>
                            )}
                            <div className="text-[0.8125rem] text-[#555]">
                                Dá»‹ch vá»¥ add-on:{" "}
                                {addonServices.length === 0 ? (
                                    <span className="text-[#888]">KhÃ´ng cÃ³</span>
                                ) : (
                                    <span className="text-[#181818]">
                                        {addonServices
                                            .map((s) => {
                                                const matchedRule = findMatchingPricingRule?.(s.serviceId, pet.weight, pet.petType);
                                                const p = matchedRule?.price;
                                                const priceText = p != null ? ` â€” ${Number(p).toLocaleString("vi-VN")}Ä‘` : "";
                                                return `${s.serviceName}${priceText}`;
                                            })
                                            .join("; ")}
                                    </span>
                                )}
                            </div>
                            {totalEstimated > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#ffe0ce] text-[0.8438rem] text-[#555]">
                                    Tá»•ng dá»± kiáº¿n:{" "}
                                    <strong className="text-[0.9375rem] text-[#c45a3a]">
                                        {Number(totalEstimated).toLocaleString("vi-VN")}Ä‘
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* ThÃ´ng tin phÃ²ng Ä‘ang chá»n (náº¿u cÃ³) */}
                        {(() => {
                            const selectedRoom = pet.selectedRoomId != null ? placedRooms.find((r) => r.roomId === pet.selectedRoomId) ?? null : null;
                            if (!selectedRoom) return null;
                            const roomDisplayName = selectedRoom.roomName?.trim() ? `${selectedRoom.roomNumber} â€“ ${selectedRoom.roomName}` : `${selectedRoom.roomNumber} T${selectedRoom.tier ?? 1}`;
                            return (
                                <div className="mt-3 pt-3 border-t border-[#ffe0ce] flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-[0.8125rem] text-[#181818]">
                                        PhÃ²ng Ä‘ang chá»n: <strong className="text-[#c45a3a]">{roomDisplayName}</strong>
                                    </span>
                                    {onViewRoomDetail && (
                                        <button
                                            type="button"
                                            onClick={() => onViewRoomDetail(selectedRoom)}
                                            className="inline-flex items-center gap-2 rounded-[10px] border border-[#ffbaa0] bg-[#fff7f3] px-3 py-1.5 text-[0.7812rem] font-[600] text-[#c45a3a] transition-colors hover:bg-[#ffbaa0] hover:text-[#181818]"
                                        >
                                            Xem chi tiáº¿t
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

/** SÆ¡ Ä‘á»“ chá»n phÃ²ng + xem chi tiáº¿t phÃ²ng cho dá»‹ch vá»¥ thÃªm cÃ³ isRequiredRoom = true. */
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

    const { data: bookedRoomIdsDataAdd } = useQuery({
        queryKey: ["booked-room-ids", effectiveDateFrom, asvc.dateTo],
        queryFn: () => getBookedRoomIds(effectiveDateFrom!, asvc.dateTo!),
        enabled: showPicker && !!effectiveDateFrom && !!asvc.dateTo,
        select: (res) => res.data ?? [],
    });

    const rooms: RoomClient[] = roomsData ?? [];
    const bookedRoomIdSetAdd = useMemo(() => new Set(bookedRoomIdsDataAdd ?? []), [bookedRoomIdsDataAdd]);
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
        const phoneValue = hasPhone ? supportPhone!.trim() : DEFAULT_SHOP_PHONE;
        
        return (
            <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
                <p className="text-[0.875rem] text-[#555]">
                    ChÆ°a cÃ³ dá»¯ liá»‡u phÃ²ng cho dá»‹ch vá»¥ nÃ y, vui lÃ²ng liÃªn há»‡ hotline{" "}
                    <a 
                        href={`tel:${phoneValue.replace(/\s+/g, '')}`} 
                        className="text-[#c45a3a] font-[700] hover:underline"
                    >
                        {phoneValue}
                    </a>{" "}
                    Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.
                </p>
            </div>
        );
    }

    const maxRows = activeLayout.maxRows ?? 10;
    const maxCols = activeLayout.maxCols ?? 20;

    return (
        <div className="mt-[16px] p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce]">
            <label className="block mb-[12px] text-[0.875rem] font-[600] text-[#181818]">Chá»n phÃ²ng *</label>

            {roomTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-[12px]">
                    <span className="w-full text-[0.8125rem] text-[#888] mb-1">Chá»n loáº¡i phÃ²ng:</span>
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
                    Vui lÃ²ng chá»n loáº¡i phÃ²ng á»Ÿ trÃªn Ä‘á»ƒ xem sÆ¡ Ä‘á»“ vÃ  chá»n phÃ²ng.
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
                                    title={isBooked ? "PhÃ²ng Ä‘Ã£ Ä‘Æ°á»£c Ä‘áº·t" : undefined}
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
                        <div className="text-[0.8438rem] text-[#181818] font-[600] mb-2">TÃ³m táº¯t giÃ¡ dá»± kiáº¿n</div>
                        <div className="space-y-1.5">
                            {mainServicePrice != null && (
                                <div className="text-[0.8125rem] text-[#555]">
                                    Dá»‹ch vá»¥ thÃªm:{" "}
                                    <strong className="text-[#c45a3a]">
                                        {selectedService.serviceName}
                                        {asvc.numberOfNights != null && asvc.numberOfNights > 0 && (
                                            <> â€” {Number(Math.round(mainServicePrice / asvc.numberOfNights)).toLocaleString("vi-VN")}Ä‘ x{asvc.numberOfNights} Ä‘Ãªm</>
                                        )}
                                        {" "} â€” {Number(mainServicePrice).toLocaleString("vi-VN")}Ä‘
                                    </strong>
                                </div>
                            )}
                            <div className="text-[0.8125rem] text-[#555]">
                                Dá»‹ch vá»¥ add-on:{" "}
                                {addonServices.length === 0 ? (
                                    <span className="text-[#888]">KhÃ´ng cÃ³</span>
                                ) : (
                                    <span className="text-[#181818]">
                                        {addonServices
                                            .map((s) => {
                                                const matchedRule = findMatchingPricingRule(s.serviceId, pet.weight, pet.petType);
                                                const p = matchedRule?.price;
                                                const priceText = p != null ? ` â€” ${Number(p).toLocaleString("vi-VN")}Ä‘` : "";
                                                return `${s.serviceName}${priceText}`;
                                            })
                                            .join("; ")}
                                    </span>
                                )}
                            </div>
                            {totalEstimated > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#ffe0ce] text-[0.8438rem] text-[#555]">
                                    Tá»•ng dá»± kiáº¿n:{" "}
                                    <strong className="text-[0.9375rem] text-[#c45a3a]">
                                        {Number(totalEstimated).toLocaleString("vi-VN")}Ä‘
                                    </strong>
                                </div>
                            )}
                        </div>

                        {/* ThÃ´ng tin phÃ²ng Ä‘ang chá»n (náº¿u cÃ³) */}
                        {(() => {
                            const selectedRoom = asvc.selectedRoomId != null ? placedRooms.find((r) => r.roomId === asvc.selectedRoomId) ?? null : null;
                            if (!selectedRoom) return null;
                            const roomDisplayName = selectedRoom.roomName?.trim() ? `${selectedRoom.roomNumber} â€“ ${selectedRoom.roomName}` : `${selectedRoom.roomNumber} T${selectedRoom.tier ?? 1}`;
                            return (
                                <div className="mt-3 pt-3 border-t border-[#ffe0ce] flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-[0.8125rem] text-[#181818]">
                                        PhÃ²ng Ä‘ang chá»n: <strong className="text-[#c45a3a]">{roomDisplayName}</strong>
                                    </span>
                                    {onViewRoomDetail && (
                                        <button
                                            type="button"
                                            onClick={() => onViewRoomDetail(selectedRoom)}
                                            className="inline-flex items-center gap-2 rounded-[10px] border border-[#ffbaa0] bg-[#fff7f3] px-3 py-1.5 text-[0.7812rem] font-[600] text-[#c45a3a] transition-colors hover:bg-[#ffbaa0] hover:text-[#181818]"
                                        >
                                            Xem chi tiáº¿t
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

/** Draft form Ä‘áº·t lá»‹ch (Ä‘á»ƒ truyá»n qua mÃ n chi tiáº¿t phÃ²ng vÃ  khÃ´i phá»¥c khi quay láº¡i). */
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

    const initialPets: BookingPetForm[] = draft?.pets?.length ? draft.pets : [createEmptyPet(step1Data)];

    const [pets, setPets] = useState<BookingPetForm[]>(initialPets);
    const [globalDateFrom, setGlobalDateFrom] = useState<string>(() => initialPets[0]?.dateFrom ?? "");
    const [openServicePetId, setOpenServicePetId] = useState<string | null>(null);
    const [openPetTypePetId, setOpenPetTypePetId] = useState<string | null>(null);
    /** Index thÃº cÆ°ng Ä‘ang xem (story style: chuyá»ƒn qua láº¡i bÃªn pháº£i) */
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

    // Min "NgÃ y gá»­i chung" = hÃ´m nay + max(advanceBookingHours) cá»§a cÃ¡c dá»‹ch vá»¥ hiá»‡n cÃ³ (active).
    // Má»¥c tiÃªu: luÃ´n cháº·n chá»n ngÃ y quÃ¡ khá»©, vÃ  luÃ´n Ã¡p dá»¥ng quy Ä‘á»‹nh Ä‘áº·t trÆ°á»›c lá»›n nháº¥t Ä‘á»ƒ dá»… quáº£n lÃ½.
    const maxAdvanceBookingHours = useMemo(() => {
        const active = services.filter((s) => s.isActive !== false);
        const hours = active
            .map((s) => Number((s as any).advanceBookingHours ?? 0))
            .filter((h) => Number.isFinite(h) && h > 0);
        return hours.length ? Math.max(...hours) : 0;
    }, [services]);

    const minGlobalDateFrom = useMemo(() => {
        const base = dayjs().startOf("day"); // khÃ´ng bao giá» cho chá»n ngÃ y quÃ¡ khá»©
        if (!maxAdvanceBookingHours || maxAdvanceBookingHours <= 0) return base;
        return dayjs().add(maxAdvanceBookingHours, "hour").startOf("day");
    }, [maxAdvanceBookingHours]);

    // Náº¿u globalDateFrom Ä‘ang nhá» hÆ¡n min thÃ¬ tá»± Ä‘áº©y lÃªn má»‘c tá»‘i thiá»ƒu Ä‘á»ƒ trÃ¡nh sai logic
    useEffect(() => {
        if (!minGlobalDateFrom) return;
        const minStr = minGlobalDateFrom.format("YYYY-MM-DD");
        if (!globalDateFrom || dayjs(globalDateFrom).isBefore(minGlobalDateFrom, "day")) {
            setGlobalDateFrom(minStr);
            applyGlobalDateFromToAll(minStr);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minGlobalDateFrom?.valueOf()]);

    // Map serviceId -> danh sÃ¡ch pricing rule
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
        // Náº¿u BE chÆ°a tráº£ suitablePetTypes thÃ¬ fallback vá» háº±ng PET_TYPES cÅ©
        if (result.size === 0) {
            PET_TYPES.forEach((t) => result.add(t.value));
        }
        return Array.from(result);
    }, [services]);

    const renderPetTypeLabel = (value: string) => {
        const norm = normalizePetType(value);
        switch (norm) {
            case "dog":
                return "ChÃ³";
            case "cat":
                return "MÃ¨o";
            case "other":
                return "KhÃ¡c";
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
     * TÃ¬m rule giÃ¡ phÃ¹ há»£p cho 1 dá»‹ch vá»¥ theo cÃ¢n náº·ng + loáº¡i thÃº cÆ°ng.
     * Náº¿u khÃ´ng cÃ³ rule nÃ o match thÃ¬ tráº£ vá» undefined.
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
        // Sort giá»‘ng backend: Æ°u tiÃªn priority (tÄƒng dáº§n), sau Ä‘Ã³ rule cÃ³ rÃ ng buá»™c weight nhiá»u hÆ¡n,
        // rá»“i minWeight cao hÆ¡n, cuá»‘i cÃ¹ng maxWeight tháº¥p hÆ¡n.
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
     * TÃ¬m rule giÃ¡ cho dá»‹ch vá»¥ báº¯t buá»™c chá»n phÃ²ng: Æ°u tiÃªn rule cÃ³ roomTypeId trÃ¹ng, rá»“i weight/petType.
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
        // Sort giá»‘ng backend Ä‘á»ƒ chá»n Ä‘Ãºng rule khi cÃ³ nhiá»u khoáº£ng weight cÃ¹ng match.
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

    /** Tá»•ng tiá»n phÃ²ng = giÃ¡/Ä‘Ãªm (theo loáº¡i phÃ²ng) Ã— sá»‘ Ä‘Ãªm. Tráº£ vá» null náº¿u khÃ´ng Ä‘á»§ dá»¯ liá»‡u. */
    const getRoomTotalPrice = (p: BookingPetForm, roomTypeId: number | null): number | null => {
        const effectiveFrom = p.dateFrom || globalDateFrom;
        const nights =
            p.numberOfNights != null
                ? p.numberOfNights
                : effectiveFrom && p.dateTo && dayjs(p.dateTo).isAfter(dayjs(effectiveFrom))
                    ? dayjs(p.dateTo).diff(dayjs(effectiveFrom), "day")
                    : null;

        if (!p.serviceId || nights == null || nights < 1) return null;
        // Resolve theo quy táº¯c admin: roomType + petType + cÃ¢n náº·ng.
        const rule = findMatchingPricingRuleWithRoom(p.serviceId, roomTypeId, p.weight, p.petType);
        if (rule?.price == null) return null;
        return rule.price * nights;
    };

    /** Tá»•ng tiá»n phÃ²ng cho dá»‹ch vá»¥ thÃªm (dÃ¹ng weight/petType cá»§a pet). */
    const getAdditionalRoomTotalPrice = (asvc: BookingPetServiceForm, roomTypeId: number | null, pet: BookingPetForm): number | null => {
        const effectiveFrom = asvc.dateFrom || globalDateFrom;
        const nights =
            asvc.numberOfNights != null
                ? asvc.numberOfNights
                : effectiveFrom && asvc.dateTo && dayjs(asvc.dateTo).isAfter(dayjs(effectiveFrom))
                    ? dayjs(asvc.dateTo).diff(dayjs(effectiveFrom), "day")
                    : null;

        if (!asvc.serviceId || nights == null || nights < 1) return null;
        // Resolve theo quy táº¯c admin: roomType + petType + cÃ¢n náº·ng.
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
        // 1) Kiá»ƒm tra thÃ´ng tin liÃªn há»‡ cá»§a khÃ¡ch hÃ ng (Step 1)
        const fullName = (step1Data.fullName ?? "").trim();
        const email = (step1Data.email ?? "").trim();
        const phone = (step1Data.phone ?? "").trim();
        const address = (step1Data.address ?? "").trim();

        if (!fullName || !email || !phone || !address) {
            toast.error("Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ Há» tÃªn, Email, Sá»‘ Ä‘iá»‡n thoáº¡i vÃ  Äá»‹a chá»‰ á»Ÿ pháº§n ThÃ´ng tin khÃ¡ch hÃ ng.");
            // Cuá»™n lÃªn pháº§n thÃ´ng tin khÃ¡ch hÃ ng á»Ÿ Ä‘áº§u trang
            window.scrollTo({ top: 0, behavior: "smooth" });
            return false;
        }

        // 2) Kiá»ƒm tra chi tiáº¿t thÃº cÆ°ng & dá»‹ch vá»¥
        const nextErrors: Record<string, PetFieldErrors> = {};
        setPetErrors({});

        for (let i = 0; i < pets.length; i++) {
            const pet = pets[i];
            const idxLabel = `thÃº cÆ°ng ${i + 1}`;

            if (!pet.petType.trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    petType: "Vui lÃ²ng chá»n loáº¡i thÃº cÆ°ng.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lÃ²ng chá»n loáº¡i thÃº cÆ°ng cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-petType`);
                return false;
            }

            if (!pet.weight?.toString().trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    weight: "Vui lÃ²ng nháº­p cÃ¢n náº·ng cá»§a thÃº cÆ°ng.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lÃ²ng nháº­p cÃ¢n náº·ng cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-weight`);
                return false;
            }

            if (!pet.petName.trim()) {
                nextErrors[pet.id] = { ...(nextErrors[pet.id] ?? {}), petName: "Vui lÃ²ng nháº­p tÃªn thÃº cÆ°ng." };
                setPetErrors(nextErrors);
                toast.error(`Vui lÃ²ng nháº­p tÃªn cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-name`);
                return false;
            }
            if (!pet.emergencyContactName?.trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    emergencyContactName: "Vui lÃ²ng nháº­p ngÆ°á»i liÃªn há»‡ kháº©n cáº¥p.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lÃ²ng nháº­p ngÆ°á»i liÃªn há»‡ kháº©n cáº¥p cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-emergency-name`);
                return false;
            }
            if (!pet.emergencyContactPhone?.trim()) {
                nextErrors[pet.id] = {
                    ...(nextErrors[pet.id] ?? {}),
                    emergencyContactPhone: "Vui lÃ²ng nháº­p SÄT liÃªn há»‡ kháº©n cáº¥p.",
                };
                setPetErrors(nextErrors);
                toast.error(`Vui lÃ²ng nháº­p SÄT liÃªn há»‡ kháº©n cáº¥p cho ${idxLabel}.`);
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
                toast.error(`Vui lÃ²ng chá»n Ã­t nháº¥t má»™t dá»‹ch vá»¥ cho ${idxLabel}.`);
                scrollToPet(i, `pet-${pet.id}-service`);
                return false;
            }

            for (let j = 0; j < allServices.length; j++) {
                const { base, svc } = allServices[j];
                const serviceLabel = `Dá»‹ch vá»¥ ${j + 1} cá»§a ${idxLabel}`;
                const serviceKey = "id" in base ? base.id : "main";

                if (!svc) {
                    toast.error(`Vui lÃ²ng chá»n ${serviceLabel}.`);
                    scrollToPet(i);
                    return false;
                }

                const isRoomRequired = svc.isRequiredRoom === true;
                if (isRoomRequired) {
                    const dateFrom = "dateFrom" in base ? base.dateFrom : (base as BookingPetServiceForm).dateFrom;
                    const dateTo = "dateTo" in base ? base.dateTo : (base as BookingPetServiceForm).dateTo;
                    // Trong UI, NgÃ y gá»­i cho cÃ¡c dá»‹ch vá»¥ Ä‘Æ°á»£c láº¥y tá»« "NgÃ y gá»­i chung" (globalDateFrom).
                    // CÃ³ trÆ°á»ng há»£p state dateFrom cá»§a service/pet bá»‹ rá»—ng trong khi UI váº«n hiá»ƒn thá»‹ tá»« globalDateFrom,
                    // dáº«n tá»›i validate bá»‹ bÃ¡o sai dÃ¹ user Ä‘Ã£ chá»n ngÃ y tráº£.
                    const effectiveDateFrom = dateFrom || globalDateFrom;
                    const selectedRoomId =
                        "selectedRoomId" in base ? base.selectedRoomId : (base as BookingPetServiceForm).selectedRoomId;

                    if (!effectiveDateFrom || !dateTo || !dayjs(dateTo).isAfter(dayjs(effectiveDateFrom))) {
                        const petErr = nextErrors[pet.id] ?? {};
                        const svcDateErrors = { ...(petErr.serviceDateErrors ?? {}) };
                        svcDateErrors[serviceKey] = "Vui lÃ²ng chá»n NgÃ y gá»­i/NgÃ y tráº£ há»£p lá»‡.";
                        nextErrors[pet.id] = { ...petErr, serviceDateErrors: svcDateErrors };
                        setPetErrors(nextErrors);

                        toast.error(`Vui lÃ²ng chá»n NgÃ y gá»­i/NgÃ y tráº£ há»£p lá»‡ cho ${serviceLabel}.`);
                        scrollToPet(i, `pet-${pet.id}-${serviceKey}-dates`);
                        return false;
                    }
                    if (!selectedRoomId) {
                        const petErr = nextErrors[pet.id] ?? {};
                        const svcRoomErrors = { ...(petErr.serviceRoomErrors ?? {}) };
                        svcRoomErrors[serviceKey] = "Vui lÃ²ng chá»n phÃ²ng cho dá»‹ch vá»¥ nÃ y.";
                        nextErrors[pet.id] = { ...petErr, serviceRoomErrors: svcRoomErrors };
                        setPetErrors(nextErrors);

                        toast.error(`Vui lÃ²ng chá»n phÃ²ng cho ${serviceLabel}.`);
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

                    // UI cÃ³ thá»ƒ hiá»ƒn thá»‹ ngÃ y gá»­i tá»« globalDateFrom (readOnly/disabled),
                    // nhÆ°ng state sessionDate váº«n rá»—ng -> validate sáº½ sai.
                    // Fallback sang globalDateFrom Ä‘á»ƒ validate Ä‘Ãºng theo quy táº¯c "NgÃ y gá»­i chung".
                    const effectiveSessionDate = sessionDate || globalDateFrom;

                    const sessionSlotLabel =
                        "sessionSlotLabel" in base
                            ? (base as BookingPetForm | BookingPetServiceForm).sessionSlotLabel
                            : (base as BookingPetServiceForm).sessionSlotLabel;

                    // Má»™t sá»‘ trÆ°á»ng há»£p UI Ä‘Ã£ chá»n "Khung giá»" nhÆ°ng sessionTimeSlotId chÆ°a Ä‘Æ°á»£c set Ä‘Ãºng,
                    // trong khi sessionSlotLabel váº«n cÃ³. Cho validate pass theo label Ä‘á»ƒ trÃ¡nh bÃ¡o sai.
                    const hasTimeSlot = !!sessionTimeSlotId || !!sessionSlotLabel;

                    if (!effectiveSessionDate || !hasTimeSlot) {
                        toast.error(`Vui lÃ²ng chá»n NgÃ y gá»­i vÃ  Khung giá» cho ${serviceLabel}.`);
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
        const priceText = price != null ? ` â€” ${Number(price).toLocaleString("vi-VN")}Ä‘` : "";
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
                name.includes("lÆ°u trÃº") ||
                name.includes("khÃ¡ch sáº¡n") ||
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
                        // Dá»‹ch vá»¥ khÃ´ng cáº§n phÃ²ng: ngÃ y gá»­i = globalDateFrom (khÃ´ng phá»¥ thuá»™c pricingModel)
                        if (asvc.serviceId) {
                            const svc = services.find((s) => s.serviceId === asvc.serviceId);
                            if (svc && svc.isRequiredRoom === false) {
                                return { ...asvc, sessionDate: next };
                            }
                        }
                        return asvc;
                    }) ?? p.additionalServices;

                // Dá»‹ch vá»¥ chÃ­nh khÃ´ng cáº§n phÃ²ng (per_session): tá»± fill ngÃ y gá»­i theo globalDateFrom
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

                        // Náº¿u service má»›i:
                        // - isRequiredRoom=false: tá»± fill sessionDate theo globalDateFrom
                        // - isRequiredRoom=true : tá»± fill dateFrom theo globalDateFrom (Ä‘á»ƒ summary "NgÃ y gá»­i" khÃ´ng bá»‹ â€”)
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
                        // DateFrom cá»§a dá»‹ch vá»¥ "per_day" nÃªn Ä‘Æ°á»£c Ä‘á»“ng bá»™ tá»« globalDateFrom.
                        // Má»™t sá»‘ luá»“ng trÆ°á»›c Ä‘Ã³ cÃ³ thá»ƒ reset next.dateFrom vá» "" nÃªn khi user chá»‰ chá»n dateTo
                        // thÃ¬ numberOfNights sáº½ khÃ´ng Ä‘Æ°á»£c tÃ­nh vÃ  room diagram cÅ©ng khÃ´ng má»Ÿ.
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

                // Náº¿u thay Ä‘á»•i petType hoáº·c weight thÃ¬ reset dá»‹ch vá»¥ vÃ  cÃ¡c field phá»¥ thuá»™c
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
                    // DateFrom cá»§a booking "per_day" Ä‘Æ°á»£c Ã¡p dá»¥ng tá»« globalDateFrom phÃ­a trÃªn.
                    // Náº¿u pet.dateFrom Ä‘ang rá»—ng (do reset á»Ÿ cÃ¡c luá»“ng trÆ°á»›c), thÃ¬ cáº§n Ä‘á»“ng bá»™ khi user chá»n dateTo
                    // Ä‘á»ƒ hiá»ƒn thá»‹ sá»‘ Ä‘Ãªm vÃ  má»Ÿ sÆ¡ Ä‘á»“ chá»n phÃ²ng.
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
                    // Náº¿u service:
                    // - isRequiredRoom=false: tá»± fill sessionDate theo globalDateFrom
                    // - isRequiredRoom=true : tá»± fill dateFrom theo globalDateFrom (Ä‘á»ƒ summary "NgÃ y gá»­i" khÃ´ng bá»‹ â€”)
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
        setIsBankInfoOpen(true);
        // Pre-fill bank form theo email khÃ¡ch Ä‘Ã£ lÆ°u (khi guest hoáº·c Ä‘ang thÃªm má»›i)
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
            const payload = buildCreateBookingPayload(step1Data, pets);
            // Attach bank info if provided (guest or newly added)
            const finalPayload = bankPayload
                ? { ...payload, bankInformation: bankPayload }
                : payload;
            const res = await createBookingDepositIntent(finalPayload);
            if (res?.success && res?.data?.depositId && res?.data?.bookingCode) {
                // Náº¿u cÃ³ bank info (khÃ¡ch vÃ£ng lai hoáº·c thÃªm má»›i), lÆ°u vÃ o bank_information gáº¯n vá»›i booking
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
                        // Náº¿u lÆ°u bank info tháº¥t báº¡i, váº«n cho khÃ¡ch tiáº¿p tá»¥c nhÆ°ng log/toast nháº¹
                        console.error("Failed to create guest bank information", e);
                    }
                }
                toast.success("ÄÆ¡n Ä‘áº·t lá»‹ch cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n, vui lÃ²ng thanh toÃ¡n cá»c Ä‘á»ƒ giá»¯ chá»—.");
                navigate(`/dat-lich/chi-tiet-don/${res.data.bookingCode}`, {
                    replace: true,
                    state: { openPayment: true }
                });
                return;
            }
            toast.error(res?.message ?? "KhÃ´ng thá»ƒ giá»¯ chá»—. Vui lÃ²ng thá»­ láº¡i.");
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { message?: string; data?: { errorCode?: string; petIndex?: number; serviceIndex?: number; roomId?: number } } } })?.response?.data;
            const message = data?.message ?? (err instanceof Error ? err.message : "KhÃ´ng thá»ƒ giá»¯ chá»—. Vui lÃ²ng thá»­ láº¡i.");
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
            // Logged-in user selected an existing account â€” no need to send bankPayload
            await handleProceedToPayment();
        } else {
            // Guest or adding new: validate form
            if (!bankForm.accountNumber.trim()) {
                toast.error("Vui lÃ²ng nháº­p sá»‘ tÃ i khoáº£n.");
                return;
            }
            if (!bankForm.accountHolderName.trim()) {
                toast.error("Vui lÃ²ng nháº­p tÃªn chá»§ tÃ i khoáº£n.");
                return;
            }
            if (!bankForm.bankCode) {
                toast.error("Vui lÃ²ng chá»n ngÃ¢n hÃ ng.");
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
                                {rawState?.bookingCodeForEdit ? "Chá»‰nh sá»­a Ä‘Æ¡n Ä‘áº·t lá»‹ch" : "Äáº·t lá»‹ch chi tiáº¿t"}
                            </p>
                            <h2 className="text-[3.125rem] text-[#181818] leading-[1.2] font-third mb-[20px]">
                                ThÃ´ng tin lá»‹ch háº¹n cho thÃº cÆ°ng
                            </h2>
                            {rawState?.bookingCodeForEdit && (
                                <p className="mt-[8px] text-[0.9375rem] text-[#c45a3a] font-[600]">
                                    MÃ£ Ä‘áº·t lá»‹ch: <span className="font-[800]">{rawState.bookingCodeForEdit}</span>
                                </p>
                            )}
                            <p className="text-[#505050] font-[500] text-[1.125rem] inline-block mt-[15px]">
                                ThÃªm thÃº cÆ°ng, chá»n dá»‹ch vá»¥ vÃ  thá»i gian phÃ¹ há»£p vá»›i tá»«ng loáº¡i hÃ¬nh dá»‹ch vá»¥.
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
                        <h2 className="text-[1.5rem] font-third text-[#181818] mb-[24px]">ThÃ´ng tin</h2>
                        <div className="space-y-[20px]">
                            <div className="flex gap-3">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#afe2e5]/40 flex items-center justify-center shrink-0">
                                    <EditLocationAltIcon sx={{ fontSize: 22, color: "#0d7c82" }} />
                                </div>
                                <div>
                                    <div className="font-[700] text-[#181818] text-[0.9375rem]">Äá»‹a Ä‘iá»ƒm</div>
                                    <p className="text-[#505050] text-[0.875rem]">64 Ung VÄƒn KhiÃªm, Pleiku, Gia Lai</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#cfecbc]/40 flex items-center justify-center shrink-0">
                                    <ScheduleIcon sx={{ fontSize: 22, color: "#2e7d32" }} />
                                </div>
                                <div>
                                    <div className="font-[700] text-[#181818] text-[0.9375rem]">Giá» lÃ m viá»‡c</div>
                                    <p className="text-[#505050] text-[0.875rem]">T2 - T7: 7:00 - 16:00</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-[40px] h-[40px] rounded-full bg-[#ffbaa0]/30 flex items-center justify-center shrink-0">
                                    <RocketLaunchIcon sx={{ fontSize: 22, color: "#c45a3a" }} />
                                </div>
                                <div>
                                    <div className="font-[700] text-[#181818] text-[0.9375rem]">ChÄƒm sÃ³c di Ä‘á»™ng</div>
                                    <p className="text-[#505050] text-[0.875rem]">Theo dÃµi qua camera trÃªn Ä‘iá»‡n thoáº¡i.</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="w-full max-w-[800px]">
                        {/* ========== PHáº¦N 1: ThÃ´ng tin cÆ¡ báº£n khÃ¡ch ========== */}
                        <section className="mb-[40px]">
                            <div className="flex items-center gap-2 mb-[16px]">
                                <span className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffbaa0] text-[#181818] font-[700] text-[0.875rem]">1</span>
                                <h3 className="text-[1.25rem] font-[700] text-[#181818]">ThÃ´ng tin khÃ¡ch hÃ ng</h3>
                            </div>
                            <div className="bg-white rounded-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#eee] overflow-hidden">
                                <div className="bg-gradient-to-r from-[#ffbaa0]/12 to-[#e67e2010] px-[24px] py-[16px] border-b border-[#eee] flex items-center gap-3">
                                    <PersonOutlineOutlinedIcon sx={{ fontSize: 26, color: "#c45a3a" }} />
                                    <span className="text-[1rem] font-[600] text-[#181818]">ThÃ´ng tin liÃªn há»‡</span>
                                </div>
                                <div className="p-[24px] grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[16px] text-[0.9375rem]">
                                    <div>
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Há» vÃ  tÃªn</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.fullName || "â€”"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Email</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.email || "â€”"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Sá»‘ Ä‘iá»‡n thoáº¡i</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.phone || "â€”"}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Äá»‹a chá»‰</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.address || "â€”"}</span>
                                    </div>
                                    {step1Data.message ? (
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[4px] text-[0.8125rem]">Lá»i nháº¯n</span>
                                            <span className="text-[#181818] font-[500]">{step1Data.message}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        {/* ========== PHáº¦N 2: Sá»‘ lÆ°á»£ng thÃº cÆ°ng + thÃ´ng tin tá»«ng thÃº + dá»‹ch vá»¥ + ngÃ y/slot ========== */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <section className="mb-[40px]">
                                <div className="flex items-center justify-between gap-4 mb-[16px]">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffbaa0] text-[#181818] font-[700] text-[0.875rem]">2</span>
                                        <h3 className="text-[1.25rem] font-[700] text-[#181818]">ThÃº cÆ°ng & dá»‹ch vá»¥</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addPet}
                                        className="flex items-center gap-2 py-[10px] px-[20px] rounded-[12px] bg-[#ffbaa0]/20 text-[#c45a3a] font-[600] text-[0.875rem] hover:bg-[#ffbaa0]/35 transition-colors"
                                    >
                                        <AddIcon sx={{ fontSize: 20 }} /> ThÃªm thÃº cÆ°ng
                                    </button>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Hiá»ƒn thá»‹ 3 tab thÃº cÆ°ng, tab Ä‘ang xem á»Ÿ giá»¯a vÃ  ná»•i báº­t; chuyá»ƒn báº±ng 2 nÃºt mÅ©i tÃªn */}
                                    <div className="flex items-center justify-center gap-2 flex-shrink-0">
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
                                                                {pet.petName.trim() || `ThÃº cÆ°ng ${idx + 1}`}
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
                                    </div>

                                    {/* Form thÃº cÆ°ng Ä‘ang chá»n (chá»‰ 1 card hiá»ƒn thá»‹, chuyá»ƒn qua láº¡i nhÆ° story) */}
                                    <div className="flex-1 min-w-0 relative">
                                        {pets.map((pet, index) => index !== activePetIndex ? null : (
                                            <div key={pet.id} className="booking-pet-card-enter">
                                                <div
                                                    className="bg-white rounded-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#eee]"
                                                >
                                                    <div className="bg-[#f8f9fa] px-[24px] py-[14px] border-b border-[#eee] flex items-center justify-between flex-wrap gap-2">
                                                        <span className="flex items-center gap-2 text-[0.9375rem] font-[600] text-[#181818]">
                                                            <PetsIcon sx={{ fontSize: 22, color: "#c45a3a" }} />
                                                            {pet.petName.trim() || `ThÃº cÆ°ng ${index + 1}`}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {pets.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePet(pet.id)}
                                                                    className="p-[6px] rounded-[8px] text-[#888] hover:bg-[#eee] hover:text-[#e53935] transition-colors"
                                                                    aria-label="XÃ³a thÃº cÆ°ng"
                                                                >
                                                                    <DeleteOutlineIcon sx={{ fontSize: 22 }} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="p-[24px] space-y-[24px] overflow-visible">
                                                        {/* ThÃ´ng tin thÃº cÆ°ng */}
                                                        <div className="space-y-[16px]">
                                                            {/* Row 1: TÃªn thÃº cÆ°ng + Loáº¡i (ngang hÃ ng) */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">TÃªn thÃº cÆ°ng *</label>
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
                                                                        placeholder="VÃ­ dá»¥: Milu"
                                                                        required
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Loáº¡i *</label>
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

                                                            {/* Row 2: CÃ¢n náº·ng + LiÃªn há»‡ kháº©n cáº¥p + SÄT kháº©n cáº¥p */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">CÃ¢n náº·ng (kg)</label>
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
                                                                        placeholder="VÃ­ dá»¥: 5"
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">LiÃªn há»‡ kháº©n cáº¥p</label>
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
                                                                        placeholder="Há» tÃªn ngÆ°á»i liÃªn há»‡"
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">SÄT kháº©n cáº¥p</label>
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
                                                                        placeholder="Sá»‘ Ä‘iá»‡n thoáº¡i"
                                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* NgÃ y gá»­i chung cho toÃ n bá»™ Ä‘Æ¡n (hiá»ƒn thá»‹ má»™t láº§n dÆ°á»›i thÃº cÆ°ng Ä‘áº§u tiÃªn) */}
                                                            {index === 0 && (
                                                                <div className="mt-[16px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
                                                                    <div>
                                                                        <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">
                                                                            NgÃ y gá»­i (Ã¡p dá»¥ng cho táº¥t cáº£ dá»‹ch vá»¥) *
                                                                        </label>
                                                                        <DatePicker
                                                                            value={globalDateFrom ? dayjs(globalDateFrom) : null}
                                                                            onChange={(d: Dayjs | null) => {
                                                                                const next = d ? d.format("YYYY-MM-DD") : "";
                                                                                setGlobalDateFrom(next);
                                                                                applyGlobalDateFromToAll(next);
                                                                            }}
                                                                            minDate={minGlobalDateFrom}
                                                                            format="DD/MM/YYYY"
                                                                            slotProps={{
                                                                                textField: {
                                                                                    placeholder: "DD/MM/YYYY",
                                                                                    required: true,
                                                                                    fullWidth: true,
                                                                                    color: "warning",
                                                                                    sx: bookingDatePickerTextFieldSx,
                                                                                    helperText:
                                                                                        maxAdvanceBookingHours > 0
                                                                                            ? `NgÃ y gá»­i tá»‘i thiá»ƒu = hÃ´m nay + ${maxAdvanceBookingHours} giá» (theo yÃªu cáº§u Ä‘áº·t trÆ°á»›c cá»§a cÃ¡c dá»‹ch vá»¥).`
                                                                                            : "NgÃ y gá»­i nÃ y sáº½ Ã¡p dá»¥ng cho táº¥t cáº£ dá»‹ch vá»¥ cá»§a má»i thÃº cÆ°ng trong Ä‘Æ¡n.",
                                                                                },
                                                                                popper: { sx: bookingDatePickerPopperSx },
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Row 3: Ghi chÃº */}
                                                            <div>
                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Ghi chÃº (bá»‡nh, dá»‹ á»©ng...)</label>
                                                                <input
                                                                    type="text"
                                                                    value={pet.notes}
                                                                    onChange={(e) => updatePet(pet.id, { notes: e.target.value })}
                                                                    placeholder="TÃ¹y chá»n"
                                                                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[0.9375rem]"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Chá»n dá»‹ch vá»¥ + cÃ¡c tuá»³ chá»n phá»¥ thuá»™c */}
                                                        <div className="mt-[8px]">
                                                            <ServiceSelectField
                                                                label="Chá»n dá»‹ch vá»¥ *"
                                                                displayValue={getServiceDisplayLabel(pet) || "â€” Chá»n dá»‹ch vá»¥ â€”"}
                                                                disabled={!pet.weight || !pet.petType}
                                                                disabledPlaceholder="Vui lÃ²ng chá»n loáº¡i thÃº cÆ°ng vÃ  cÃ¢n náº·ng trÆ°á»›c"
                                                                isOpen={openServicePetId === pet.id}
                                                                onToggle={() => setOpenServicePetId((prev) => (prev === pet.id ? null : pet.id))}
                                                                dropdownContent={
                                                                    openServicePetId === pet.id && pet.weight && pet.petType ? (
                                                                        <ServiceDropdownContent
                                                                            categories={categories}
                                                                            services={services.filter((s) => {
                                                                                if (!s.isActive) return false;
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
                                                                            })}
                                                                            selectedServiceId={pet.serviceId}
                                                                            petWeight={pet.weight}
                                                                            petType={pet.petType}
                                                                            getServicePriceForWeight={getServicePriceForWeight}
                                                                            onSelect={(serviceId) => {
                                                                                updatePet(pet.id, { serviceId });
                                                                                setOpenServicePetId(null);
                                                                            }}
                                                                        />
                                                                    ) : null
                                                                }
                                                            />
                                                        </div>

                                                        {/* Dá»‹ch vá»¥ add-on kÃ¨m theo: luÃ´n hiá»ƒn thá»‹ Ã´ input khi Ä‘Ã£ chá»n dá»‹ch vá»¥ chÃ­nh; add-on cÃ¹ng category vá»›i dá»‹ch vá»¥ Ä‘ang chá»n */}
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
                                                                    <label className="block mb-3 text-[0.875rem] font-[600] text-[#181818]">Dá»‹ch vá»¥ add-on kÃ¨m theo (tÃ¹y chá»n)</label>
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
                                                                                                    {Number(price).toLocaleString("vi-VN")}Ä‘
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
                                                                                            aria-label="XÃ³a"
                                                                                        >
                                                                                            Ã—
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
                                                                                                    {Number(price).toLocaleString("vi-VN")}Ä‘
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
                                                                                ? "KhÃ´ng cÃ³ dá»‹ch vá»¥ add-on cho nhÃ³m nÃ y."
                                                                                : "ÄÃ£ chá»n háº¿t dá»‹ch vá»¥ add-on kháº£ dá»¥ng."}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Mang theo thá»©c Äƒn (danh sÃ¡ch má»¥c â†’ báº£ng PetFoodBrought) */}
                                                        {pet.serviceId && isHotelCategory(getCategoryByServiceId(pet.serviceId)) && (
                                                            <div className="mt-[16px] space-y-[20px]">
                                                                <div>
                                                                    <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">Mang theo thá»©c Äƒn</label>
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
                                                                            CÃ³
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePet(pet.id, { foodBrought: false, foodItems: [] })}
                                                                            className={`py-[12px] px-[24px] rounded-[10px] font-[600] text-[0.9375rem] transition-colors ${(pet.foodItems?.length ?? 0) === 0
                                                                                ? "bg-[#ffbaa0] text-[#181818] border-2 border-[#ffbaa0]"
                                                                                : "bg-white text-[#888] border-2 border-[#ddd] hover:border-[#ffbaa0]/50"
                                                                                }`}
                                                                        >
                                                                            KhÃ´ng
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
                                                                                    <span className="text-[0.8438rem] font-[600] text-[#555]">Má»¥c thá»©c Äƒn {pet.foodItems!.length > 1 ? idx + 1 : ""}</span>
                                                                                    {pet.foodItems!.length > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const next = pet.foodItems!.filter((_, i) => i !== idx);
                                                                                                updatePet(pet.id, { foodItems: next });
                                                                                            }}
                                                                                            className="p-[6px] rounded-[8px] text-[#888] hover:bg-[#eee] hover:text-[#e53935] transition-colors"
                                                                                            aria-label="XÃ³a má»¥c"
                                                                                        >
                                                                                            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block mb-[6px] text-[0.8438rem] font-[600] text-[#181818]">Loáº¡i thá»©c Äƒn mang theo</label>
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
                                                                                        <label className="block mb-[4px] text-[0.8125rem] font-[500] text-[#555]">NhÃ£n hiá»‡u</label>
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
                                                                                        <label className="block mb-[4px] text-[0.8125rem] font-[500] text-[#555]">Sá»‘ lÆ°á»£ng</label>
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
                                                                                            placeholder="TÃ¹y chá»n"
                                                                                            className="input-booking w-full py-[10px] px-[14px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] outline-none text-[0.875rem]"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block mb-[4px] text-[0.8125rem] font-[500] text-[#555]">HÆ°á»›ng dáº«n cho Äƒn</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={item.feedingInstructions ?? ""}
                                                                                        onChange={(e) => {
                                                                                            const next = [...(pet.foodItems ?? [])];
                                                                                            next[idx] = { ...next[idx], feedingInstructions: e.target.value };
                                                                                            updatePet(pet.id, { foodItems: next });
                                                                                        }}
                                                                                        placeholder="VÃ­ dá»¥: 2 bá»¯a/ngÃ y, má»—i bá»¯a 200g"
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
                                                                            <AddIcon sx={{ fontSize: 20 }} /> ThÃªm má»¥c thá»©c Äƒn
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Theo pricingModel: per_day hoáº·c per_session */}
                                                        {pet.pricingModel === "per_day" && (
                                                            <div
                                                                id={`pet-${pet.id}-main-dates`}
                                                                className="p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce] scroll-mt-[120px]"
                                                            >
                                                                {/** Min NgÃ y gá»­i dá»±a trÃªn advanceBookingHours cá»§a cÃ¡c dá»‹ch vá»¥ cáº§n phÃ²ng (main + additional). */}
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
                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">NgÃ y gá»­i *</label>
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
                                                                                                "NgÃ y gá»­i Ä‘Æ°á»£c láº¥y tá»« Ã´ NgÃ y gá»­i chung phÃ­a trÃªn.",
                                                                                        },
                                                                                        popper: { sx: bookingDatePickerPopperSx },
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">NgÃ y tráº£ *</label>
                                                                                <DatePicker
                                                                                    value={pet.dateTo ? dayjs(pet.dateTo) : null}
                                                                                    onChange={(d: Dayjs | null) => updatePet(pet.id, { dateTo: d ? d.format("YYYY-MM-DD") : "" })}
                                                                                    format="DD/MM/YYYY"
                                                                                    minDate={
                                                                                        (pet.dateFrom || globalDateFrom)
                                                                                            ? dayjs(pet.dateFrom || globalDateFrom).add(1, "day")
                                                                                            : dayjs().add(1, "day")
                                                                                    }
                                                                                    slotProps={{
                                                                                        textField: {
                                                                                            placeholder: "DD/MM/YYYY",
                                                                                            required: true,
                                                                                            fullWidth: true,
                                                                                            color: "warning",
                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                            helperText:
                                                                                                pet.dateFrom && !pet.dateTo
                                                                                                    ? "NgÃ y tráº£ pháº£i sau ngÃ y gá»­i (Ã­t nháº¥t 1 Ä‘Ãªm)"
                                                                                                    : undefined,
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
                                                                            Sá»‘ Ä‘Ãªm: {nights} Ä‘Ãªm
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
                                                            bookingDatePickerPopperSx={bookingDatePickerPopperSx}
                                                            getServicePriceForWeight={getServicePriceForWeight}
                                                            // id Ä‘á»ƒ scroll tá»›i pháº§n session
                                                            // @ts-ignore
                                                            id={`pet-${pet.id}-main-session`}
                                                        />

                                                        {/* Dá»‹ch vá»¥ thÃªm (nhiá»u booking_pet_services, khÃ´ng trÃ¹ng dá»‹ch vá»¥) */}
                                                        <div className="border-t border-[#eee] pt-[20px]">
                                                            <div className="flex flex-col gap-3 mb-6">
                                                                <span className="text-[0.875rem] font-[600] text-[#181818]">Dá»‹ch vá»¥ thÃªm</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addAdditionalService(pet.id)}
                                                                    className="flex items-center justify-center gap-2 py-[12px] px-[24px] rounded-[12px] border-2 border-dashed border-[#ffbaa0] bg-[#fff7f3] text-[#c45a3a] font-[700] text-[0.875rem] hover:bg-[#ffbaa0]/10 hover:border-[#c45a3a] transition-all duration-200"
                                                                >
                                                                    <AddIcon sx={{ fontSize: 22 }} /> ThÃªm dá»‹ch vá»¥
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
                                                                        // ÄÃ£ cÃ³ dá»‹ch vá»¥ is_required_room á»Ÿ chÃ­nh hoáº·c dá»‹ch vá»¥ thÃªm khÃ¡c thÃ¬ khÃ´ng cho chá»n thÃªm dá»‹ch vá»¥ is_required_room á»Ÿ Ã´ nÃ y (trá»« Ä‘ang giá»¯ chá»n dá»‹ch vá»¥ hiá»‡n táº¡i)
                                                                        const mainSvc = pet.serviceId ? services.find((s) => s.serviceId === pet.serviceId) : undefined;
                                                                        const mainIsRoomRequired = mainSvc?.isRequiredRoom === true;
                                                                        const roomRequiredInOtherAdditional = (pet.additionalServices ?? []).some(
                                                                            (ad) => ad.id !== asvc.id && ad.serviceId != null && services.find((s) => s.serviceId === ad.serviceId)?.isRequiredRoom === true
                                                                        );
                                                                        const roomRequiredElsewhere = mainIsRoomRequired || roomRequiredInOtherAdditional;
                                                                        const allowService = (s: ServiceClient) =>
                                                                            canSelect(s.serviceId) &&
                                                                            (!s.isRequiredRoom || s.serviceId === asvc.serviceId || !roomRequiredElsewhere);
                                                                        // Dá»‹ch vá»¥ thÃªm: dÃ¹ng cÃ¹ng logic vá»›i pháº§n Chá»n dá»‹ch vá»¥ chÃ­nh
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
                                                                                if (!svc) return `Dá»‹ch vá»¥ #${asvc.serviceId}`;
                                                                                if (svc.isRequiredRoom === true) return svc.serviceName;
                                                                                const price = getServicePriceForWeight(svc, pet.weight, pet.petType);
                                                                                const priceText = price != null ? ` â€” ${Number(price).toLocaleString("vi-VN")}Ä‘` : "";
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
                                                                                            <span>Chá»n dá»‹ch vá»¥ {index + 1}</span>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => removeAdditionalService(pet.id, asvc.id)}
                                                                                                className="p-1 rounded-[6px] text-[#e53935] hover:bg-[#fef2f2] transition-colors"
                                                                                                aria-label="XÃ³a dá»‹ch vá»¥ thÃªm"
                                                                                            >
                                                                                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                                                                            </button>
                                                                                        </div>
                                                                                    }
                                                                                    displayValue={additionalServiceDisplayLabel || "â€” Chá»n dá»‹ch vá»¥ â€”"}
                                                                                    isOpen={openServicePetId === `add-${pet.id}-${asvc.id}`}
                                                                                    onToggle={() => setOpenServicePetId(openServicePetId === `add-${pet.id}-${asvc.id}` ? null : `add-${pet.id}-${asvc.id}`)}
                                                                                    dropdownContent={
                                                                                        openServicePetId === `add-${pet.id}-${asvc.id}` ? (
                                                                                            <ServiceDropdownContent
                                                                                                categories={categories}
                                                                                                services={catServicesForAdditional.flatMap(({ catServices }) => catServices)}
                                                                                                selectedServiceId={asvc.serviceId}
                                                                                                petWeight={pet.weight}
                                                                                                petType={pet.petType}
                                                                                                getServicePriceForWeight={getServicePriceForWeight}
                                                                                                onSelect={(serviceId) => {
                                                                                                    updateAdditionalService(pet.id, asvc.id, { serviceId });
                                                                                                    setOpenServicePetId(null);
                                                                                                }}
                                                                                            />
                                                                                        ) : null
                                                                                    }
                                                                                />
                                                                                {/* Dá»‹ch vá»¥ add-on kÃ¨m theo: danh sÃ¡ch Ä‘Ã£ chá»n á»Ÿ trÃªn, dropdown á»Ÿ dÆ°á»›i; add-on cÃ¹ng category vá»›i dá»‹ch vá»¥ Ä‘ang chá»n */}
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
                                                                                                    <label className="block mb-3 text-[0.875rem] font-[600] text-[#181818]">Dá»‹ch vá»¥ add-on kÃ¨m theo (tÃ¹y chá»n)</label>
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
                                                                                                                                    {Number(price).toLocaleString("vi-VN")}Ä‘
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                        </span>
                                                                                                                        <button
                                                                                                                            type="button"
                                                                                                                            onClick={() => updateAdditionalService(pet.id, asvc.id, {
                                                                                                                                addonServiceIds: selectedIdsAdd.filter(id => id !== s.serviceId)
                                                                                                                            })}
                                                                                                                            className="p-0.5 rounded hover:bg-[#ffbaa0]/40 text-[#888] hover:text-[#e53935] transition-colors duration-200"
                                                                                                                            aria-label="XÃ³a"
                                                                                                                        >
                                                                                                                            Ã—
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
                                                                                                                                    {Number(price).toLocaleString("vi-VN")}Ä‘
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    </button>
                                                                                                                );
                                                                                                            })}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        selectedIdsAdd.length > 0 && availableToAddAdd.length === 0 ? (
                                                                                                            <p className="text-[0.8438rem] text-[#888] py-2">KhÃ´ng cÃ²n dá»‹ch vá»¥ add-on Ä‘á»ƒ chá»n.</p>
                                                                                                        ) : null
                                                                                                    )}
                                                                                                </div>
                                                                                            )}

                                                                                            {isAdditionalRoom && (
                                                                                                <>
                                                                                                    <div id={`pet-${pet.id}-${asvc.id}-dates`} className="p-[16px] bg-[#fff7f3] rounded-[12px] border border-[#ffe0ce] scroll-mt-[120px] mt-4">
                                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                                                                                            <div>
                                                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">NgÃ y gá»­i *</label>
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
                                                                                                                            helperText: "NgÃ y gá»­i Ä‘Æ°á»£c láº¥y tá»« Ã´ NgÃ y gá»­i chung phÃ­a trÃªn.",
                                                                                                                        },
                                                                                                                        popper: { sx: bookingDatePickerPopperSx },
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                <label className="block mb-[6px] text-[0.875rem] font-[600] text-[#181818]">NgÃ y tráº£ *</label>
                                                                                                                <DatePicker
                                                                                                                    value={asvc.dateTo ? dayjs(asvc.dateTo) : null}
                                                                                                                    onChange={(d: Dayjs | null) => updateAdditionalService(pet.id, asvc.id, { dateTo: d ? d.format("YYYY-MM-DD") : "" })}
                                                                                                                    format="DD/MM/YYYY"
                                                                                                                    minDate={
                                                                                        (asvc.dateFrom || globalDateFrom || pet.dateFrom)
                                                                                            ? dayjs(asvc.dateFrom || globalDateFrom || pet.dateFrom).add(1, "day")
                                                                                            : dayjs().add(1, "day")
                                                                                    }
                                                                                                                    slotProps={{
                                                                                                                        textField: {
                                                                                                                            placeholder: "DD/MM/YYYY",
                                                                                                                            required: true,
                                                                                                                            fullWidth: true,
                                                                                                                            sx: bookingDatePickerTextFieldSx,
                                                                                                                            helperText: asvc.dateFrom && !asvc.dateTo ? "NgÃ y tráº£ pháº£i sau ngÃ y gá»­i (Ã­t nháº¥t 1 Ä‘Ãªm)" : undefined,
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
                                                    Sá»‘ Ä‘Ãªm: {nights} Ä‘Ãªm
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

                            {/* ========== PHáº¦N 3: NÃºt hÃ nh Ä‘á»™ng ========== */}
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
                                    Quay láº¡i
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
                                        {isHolding ? "Äang giá»¯ chá»—..." : "Tiáº¿p tá»¥c thanh toÃ¡n"}
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
                                    <h3 className="text-[1.3125rem] font-[800] text-[#181818]">XÃ¡c nháº­n thÃ´ng tin Ä‘áº·t lá»‹ch</h3>
                                    <p className="text-[0.875rem] text-[#6b7280] mt-0.5">
                                        Vui lÃ²ng kiá»ƒm tra láº¡i thÃ´ng tin trÆ°á»›c khi tiáº¿p tá»¥c thanh toÃ¡n cá»c.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSummaryOpen(false)}
                                    className="text-[1.25rem] leading-none px-2 text-[#888] hover:text-[#e53935]"
                                    aria-label="ÄÃ³ng"
                                >
                                    Ã—
                                </button>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h4 className="text-[1rem] font-[700] text-[#181818] mb-2">ThÃ´ng tin chá»§ thÃº cÆ°ng</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-[12px] gap-x-[24px] text-[0.875rem]">
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[2px]">Há» vÃ  tÃªn</span>
                                            <span className="font-[600] text-[#181818]">{step1Data.fullName || "â€”"}</span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[2px]">Sá»‘ Ä‘iá»‡n thoáº¡i</span>
                                            <span className="font-[600] text-[#181818]">{step1Data.phone || "â€”"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#888] block mb-[2px]">Email</span>
                                            <span className="font-[500] text-[#181818]">{step1Data.email || "â€”"}</span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-[#888] block mb-[2px]">Äá»‹a chá»‰</span>
                                            <span className="font-[500] text-[#181818]">{step1Data.address || "â€”"}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[1rem] font-[700] text-[#181818] mb-3">ThÃº cÆ°ng & dá»‹ch vá»¥</h4>
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
                                                    // Resolve theo quy táº¯c admin: roomType + petType + cÃ¢n náº·ng.
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
                                                    // Resolve theo quy táº¯c admin: roomType + petType + cÃ¢n náº·ng.
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
                                                                ThÃº cÆ°ng {idx + 1}: {pet.petName || "ChÆ°a Ä‘áº·t tÃªn"}
                                                            </div>
                                                            <div className="space-y-[2px] text-[0.8125rem] text-[#6b7280]">
                                                                <div>
                                                                    Loáº¡i: {pet.petType || "â€”"}{" "}
                                                                    {pet.weight ? `â€¢ CÃ¢n náº·ng: ${pet.weight}kg` : ""}
                                                                </div>
                                                                {(pet.emergencyContactName || pet.emergencyContactPhone) && (
                                                                    <div>
                                                                        LiÃªn há»‡ kháº©n cáº¥p:{" "}
                                                                        <span className="font-[500]">
                                                                            {pet.emergencyContactName || "â€”"}
                                                                        </span>
                                                                        {pet.emergencyContactPhone && (
                                                                            <>
                                                                                {" "}
                                                                                â€¢{" "}
                                                                                <span className="font-[500]">
                                                                                    {pet.emergencyContactPhone}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {pet.notes && (
                                                                    <div>
                                                                        Ghi chÃº tÃ¬nh tráº¡ng:{" "}
                                                                        <span className="font-[500]">
                                                                            {pet.notes}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {showFoodDetails && (
                                                                    <div>
                                                                        Thá»©c Äƒn mang theo:{" "}
                                                                        {foodItems.length === 0 ? (
                                                                            <span className="font-[500]">CÃ³</span>
                                                                        ) : (
                                                                            <ul className="list-disc list-inside mt-[1px] space-y-[1px]">
                                                                                {foodItems.map((fi, fiIdx) => (
                                                                                    <li key={fiIdx}>
                                                                                        <span className="font-[500]">
                                                                                            {fi.foodBroughtType || "Thá»©c Äƒn"}
                                                                                        </span>
                                                                                        {fi.foodBrand && ` â€” ${fi.foodBrand}`}
                                                                                        {fi.quantity != null && ` â€¢ SL: ${fi.quantity}`}
                                                                                        {fi.feedingInstructions && ` â€¢ ${fi.feedingInstructions}`}
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
                                                                Tá»•ng táº¡m tÃ­nh: {grandTotal.toLocaleString("vi-VN")}Ä‘
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4">
                                                        <div className="space-y-2 text-[0.8438rem] text-[#374151]">
                                                            {(!mainService && additionalItems.length === 0) ? (
                                                                <div className="text-[#9ca3af] text-[0.8125rem]">
                                                                    ChÆ°a chá»n dá»‹ch vá»¥ nÃ o.
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {mainService && (
                                                                        <div className="border border-[#ffe0ce] rounded-[10px] px-3 py-2 bg-white">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="font-[600] text-[#111827]">
                                                                                    Dá»‹ch vá»¥ 1: {mainService.serviceName}
                                                                                </div>
                                                                                {mainPrices.total != null && (
                                                                                    <div className="text-[0.8125rem] font-[700] text-[#c45a3a] whitespace-nowrap">
                                                                                        {mainPrices.total.toLocaleString("vi-VN")}Ä‘
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="mt-[2px] text-[0.7812rem] text-[#4b5563]">
                                                                                {mainService.isRequiredRoom ? (
                                                                                    <>
                                                                                        <div>
                                                                                            NgÃ y gá»­i:{" "}
                                                                                            <span className="font-[500]">
                                                                                                {pet.dateFrom || "â€”"}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            NgÃ y tráº£:{" "}
                                                                                            <span className="font:[500]">
                                                                                                {pet.dateTo || "â€”"}
                                                                                            </span>
                                                                                        </div>
                                                                                        {pet.numberOfNights != null && (
                                                                                            <div>
                                                                                                Sá»‘ Ä‘Ãªm:{" "}
                                                                                                <span className="font-[500]">
                                                                                                    {pet.numberOfNights}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                        {mainPrices.unit != null && mainPrices.total != null && (
                                                                                            <div>
                                                                                                GiÃ¡ 1 Ä‘Ãªm:{" "}
                                                                                                <span className="font-[500]">
                                                                                                    {mainPrices.unit.toLocaleString("vi-VN")}Ä‘
                                                                                                </span>{" "}
                                                                                                â€¢ Tá»•ng:{" "}
                                                                                                <span className="font-[500]">
                                                                                                    {mainPrices.total.toLocaleString("vi-VN")}Ä‘
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <div>
                                                                                            NgÃ y sá»­ dá»¥ng:{" "}
                                                                                            <span className="font-[500]">
                                                                                                {pet.sessionDate || "â€”"}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            Khung giá»:{" "}
                                                                                            <span className="font-[500]">
                                                                                                {pet.sessionSlotLabel || pet.sessionSlot || "â€”"}
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
                                                                                        KhÃ´ng cÃ³
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
                                                                                                            Ä‘
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
                                                                                            Dá»‹ch vá»¥ {mainService ? aIdx + 2 : aIdx + 1}
                                                                                            :{" "}
                                                                                            {item.svc
                                                                                                ? item.svc.serviceName
                                                                                                : "ChÆ°a chá»n dá»‹ch vá»¥"}
                                                                                        </div>
                                                                                        {item.prices.total != null && (
                                                                                            <div className="text-[0.8125rem] font-[700] text-[#c45a3a] whitespace-nowrap">
                                                                                                {item.prices.total.toLocaleString("vi-VN")}Ä‘
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="mt-[2px] text-[0.7812rem] text-[#4b5563]">
                                                                                        {item.svc?.isRequiredRoom ? (
                                                                                            <>
                                                                                                <div>
                                                                                                    NgÃ y gá»­i:{" "}
                                                                                                    <span className="font-[500]">
                                                                                                        {item.asvc.dateFrom || "â€”"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    NgÃ y tráº£:{" "}
                                                                                                    <span className="font-[500]">
                                                                                                        {item.asvc.dateTo || "â€”"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {item.asvc.numberOfNights != null && (
                                                                                                    <div>
                                                                                                        Sá»‘ Ä‘Ãªm:{" "}
                                                                                                        <span className="font-[500]">
                                                                                                            {item.asvc.numberOfNights}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {item.prices.unit != null && item.prices.total != null && (
                                                                                                    <div>
                                                                                                        GiÃ¡ 1 Ä‘Ãªm:{" "}
                                                                                                        <span className="font-[500]">
                                                                                                            {item.prices.unit.toLocaleString("vi-VN")}Ä‘
                                                                                                        </span>{" "}
                                                                                                        â€¢ Tá»•ng:{" "}
                                                                                                        <span className="font-[500]">
                                                                                                            {item.prices.total.toLocaleString("vi-VN")}Ä‘
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <div>
                                                                                                    NgÃ y sá»­ dá»¥ng:{" "}
                                                                                                    <span className="font-[500]">
                                                                                                        {item.asvc.sessionDate || "â€”"}
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
                                                                                                KhÃ´ng cÃ³
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
                                                                                                                    Ä‘
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
                                                                Báº£ng giÃ¡ táº¡m tÃ­nh
                                                            </div>
                                                            <div className="space-y-1">
                                                                {mainPrices.total != null && (
                                                                    <div className="flex justify-between">
                                                                        <span>Dá»‹ch vá»¥ 1</span>
                                                                        <span className="font-[600]">
                                                                            {mainPrices.total.toLocaleString("vi-VN")}Ä‘
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {additionalItems.length > 0 &&
                                                                    additionalItems.map((item, aIdx) =>
                                                                        item.prices.total != null ? (
                                                                            <div key={item.asvc.id} className="flex justify-between">
                                                                                <span>
                                                                                    Dá»‹ch vá»¥ {mainService ? aIdx + 2 : aIdx + 1}
                                                                                </span>
                                                                                <span className="font-[600]">
                                                                                    {item.prices.total.toLocaleString("vi-VN")}Ä‘
                                                                                </span>
                                                                            </div>
                                                                        ) : null
                                                                    )}
                                                                {mainAddonTotal > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span>Add-on dá»‹ch vá»¥ 1</span>
                                                                        <span className="font-[600]">
                                                                            {mainAddonTotal.toLocaleString("vi-VN")}Ä‘
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
                                                                                <span>Add-on dá»‹ch vá»¥ {index}</span>
                                                                                <span className="font-[600]">
                                                                                    {addonTotal.toLocaleString("vi-VN")}Ä‘
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                            {grandTotal > 0 && (
                                                                <div className="mt-2 border-t border-dashed border-[#e5e7eb] pt-2 flex justify-between text-[0.875rem]">
                                                                    <span className="font-[700]">Tá»•ng cá»™ng</span>
                                                                    <span className="font-[800] text-[#c45a3a]">
                                                                        {grandTotal.toLocaleString("vi-VN")}Ä‘
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
                                    Quay láº¡i chá»‰nh sá»­a
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
                                    Tiáº¿p tá»¥c thanh toÃ¡n
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
                                    <h3 className="text-[1.25rem] font-[800] text-[#181818]">ThÃ´ng tin tÃ i khoáº£n ngÃ¢n hÃ ng</h3>
                                    <p className="text-[0.8125rem] text-[#6b7280] mt-1">
                                        {isLoggedIn
                                            ? "Chá»n tÃ i khoáº£n Ä‘á»ƒ hoÃ n tiá»n cá»c náº¿u cáº§n, hoáº·c thÃªm tÃ i khoáº£n má»›i."
                                            : "Cung cáº¥p tÃ i khoáº£n Ä‘á»ƒ hoÃ n tiá»n cá»c náº¿u cáº§n."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBankInfoOpen(false)}
                                    className="text-[1.25rem] leading-none px-2 text-[#888] hover:text-[#e53935]"
                                    aria-label="ÄÃ³ng"
                                >
                                    Ã—
                                </button>
                            </div>

                            {/* Logged-in: show existing accounts */}
                            {isLoggedIn && myBankAccounts.length > 0 && bankFormMode === "select" && (
                                <div className="space-y-4">
                                    <div className="text-[0.875rem] font-[700] text-[#374151] mb-2">TÃ i khoáº£n Ä‘Ã£ lÆ°u</div>
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
                                                                {acc.accountNumber} â€” {acc.accountHolderName}
                                                            </div>
                                                            {acc.note && (
                                                                <div className="text-[0.75rem] text-[#9ca3af] mt-[2px]">
                                                                    {acc.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {acc.isDefault && (
                                                            <span className="shrink-0 text-[0.6875rem] font-[700] text-[#c45a3a] bg-[#ffedd5] px-2 py-1 rounded-full">
                                                                Máº·c Ä‘á»‹nh
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
                                        <span className="text-[1rem]">+</span> ThÃªm tÃ i khoáº£n ngÃ¢n hÃ ng má»›i
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
                                            â† Quay láº¡i danh sÃ¡ch tÃ i khoáº£n
                                        </button>
                                    )}

                                    <div className="space-y-4">
                                        {/* Bank select */}
                                        <div>
                                            <label className="block text-[0.875rem] font-[600] text-[#181818] mb-[8px]">
                                                NgÃ¢n hÃ ng <span className="text-[#e67e20]">*</span>
                                            </label>
                                            <select
                                                value={bankForm.bankCode}
                                                onChange={(e) => setBankForm((prev) => ({ ...prev, bankCode: e.target.value }))}
                                                className="w-full py-[13px] px-[16px] text-[0.9062rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all rounded-[12px] bg-white"
                                            >
                                                <option value="">â€” Chá»n ngÃ¢n hÃ ng â€”</option>
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
                                                Sá»‘ tÃ i khoáº£n <span className="text-[#e67e20]">*</span>
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
                                                TÃªn chá»§ tÃ i khoáº£n <span className="text-[#e67e20]">*</span>
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
                                                Ghi chÃº <span className="text-[0.75rem] text-[#9ca3af] font-[400]">(tuá»³ chá»n)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: TÃ i khoáº£n MB Bank cÃ¡ nhÃ¢n"
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
                                        Báº¡n chÆ°a cÃ³ tÃ i khoáº£n ngÃ¢n hÃ ng nÃ o.
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
                                        <span className="text-[1.1rem]">+</span> ThÃªm má»›i
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
                                    Quay láº¡i
                                </button>
                                <button
                                    type="button"
                                    disabled={isHolding || (isLoggedIn && bankFormMode === "select" && selectedBankAccountId === null && myBankAccounts.length > 0)}
                                    onClick={handleBankInfoConfirm}
                                    className="py-[11px] px-[26px] rounded-[12px] bg-[#ffbaa0] hover:bg-[#e6a890] text-[#181818] text-[0.9375rem] font-[700] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isHolding ? "Äang xá»­ lÃ½..." : "XÃ¡c nháº­n & Tiáº¿n hÃ nh Ä‘áº·t lá»‹ch"}
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
                                    <div className="text-[1.375rem] font-[800] text-[#181818] mb-[12px]">Äá»‹a chá»‰</div>
                                    <p className="text-[#181818]">64 Ung VÄƒn KhiÃªm, Pleiku, Gia Lai</p>
                                </div>
                            </div>
                            <div className="flex mb-[32px]">
                                <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                                    <PhoneEnabledOutlinedIcon style={{ fontSize: "2.5rem" }} />
                                </div>
                                <div className="pl-[20px]">
                                    <div className="text-[1.375rem] font-[800] text-[#181818] mb-[12px]">Sá»‘ Ä‘iá»‡n thoáº¡i</div>
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




