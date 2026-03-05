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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getServiceCategories, getServices } from "../../../api/service.api";
import type { BookingPetForm } from "../../../types/booking.type";
import type { ServiceCategoryClient, ServiceClient } from "../../../types/booking.type";
import { SESSION_SLOTS, PET_TYPES } from "./constants";
import type { IServicePricing } from "../../../admin/pages/service/configs/types";
import { getServicePricingsByServiceId } from "../../../admin/api/service-pricing.api";

const defaultStep1Data: BookingStep1FormData = {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    message: "",
};

function createEmptyPet(step1: BookingStep1FormData): BookingPetForm {
    return {
        id: crypto.randomUUID?.() ?? `pet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        petName: "",
        petType: "dog",
        weight: "",
        notes: "",
        emergencyContactName: step1.fullName,
        emergencyContactPhone: step1.phone,
        foodBrought: false,
        foodBroughtType: [],
        feedingInstructions: "",
        serviceId: null,
        pricingModel: null,
        dateFrom: "",
        dateTo: "",
        sessionDate: "",
        sessionSlot: SESSION_SLOTS[0] ?? "08:00",
    };
}

export const BookingDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const step1Data: BookingStep1FormData = (location.state as BookingStep1FormData) ?? defaultStep1Data;

    const [pets, setPets] = useState<BookingPetForm[]>(() => [createEmptyPet(step1Data)]);
    const [openServicePetId, setOpenServicePetId] = useState<string | null>(null);
    /** Ids of pet cards that are collapsed (ẩn bớt thông tin) */
    const [collapsedPetIds, setCollapsedPetIds] = useState<Set<string>>(new Set());

    const togglePetCollapsed = (id: string) => {
        setCollapsedPetIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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

    const normalizePetType = (v?: string | null) => v?.toString().trim().toLowerCase() || "";

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
            const list = r.suitablePetTypes
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);
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

    const getServiceDisplayLabel = (pet: BookingPetForm): string => {
        if (!pet.serviceId) return "";
        const svc = services.find((s) => s.serviceId === pet.serviceId);
        if (!svc) return "";
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

    const addPet = () => setPets((prev) => [...prev, createEmptyPet(step1Data)]);
    const removePet = (id: string) => {
        if (pets.length <= 1) return;
        setPets((prev) => prev.filter((p) => p.id !== id));
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
                    next.sessionDate = "";
                    next.sessionSlot = SESSION_SLOTS[0] ?? "08:00";
                    next.foodBrought = false;
                    next.foodBroughtType = [];
                    next.feedingInstructions = "";
                }
                if (updates.serviceId !== undefined) {
                    const cat = updates.serviceId != null ? getCategoryByServiceId(updates.serviceId) : null;
                    const pricingModel = cat?.pricingModel === "per_day" ? "per_day" : cat?.pricingModel === "per_session" ? "per_session" : null;
                    next.pricingModel = pricingModel ?? null;
                    if (!pricingModel) {
                        next.dateFrom = "";
                        next.dateTo = "";
                        next.sessionDate = "";
                        next.sessionSlot = SESSION_SLOTS[0] ?? "08:00";
                    }
                    if (cat && !isHotelCategory(cat)) {
                        next.foodBrought = false;
                        next.foodBroughtType = [];
                        next.feedingInstructions = "";
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: gửi API tạo booking khi BE sẵn sàng
        console.log("Booking payload:", { customer: step1Data, pets });
    };

    return (
        <>
            <div className="relative">
                <div className="app-container flex py-[100px] bg-white">
                    <div className="px-[20px] w-[42%] z-[10]">
                        <p className="uppercase text-client-secondary text-[1.7rem] font-[700] mb-[15px]">
                            Đặt lịch chi tiết
                        </p>
                        <h2 className="text-[5.0rem] text-[#181818] leading-[1.2] font-third mb-[20px]">
                            Thông tin lịch hẹn cho thú cưng
                        </h2>
                        <p className="text-[#505050] font-[500] text-[1.8rem] inline-block mt-[15px]">
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
                    <h2 className="text-[2.4rem] font-third text-[#181818] mb-[24px]">Thông tin</h2>
                    <div className="space-y-[20px]">
                        <div className="flex gap-3">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#afe2e5]/40 flex items-center justify-center shrink-0">
                                <EditLocationAltIcon sx={{ fontSize: 22, color: "#0d7c82" }} />
                            </div>
                            <div>
                                <div className="font-[700] text-[#181818] text-[1.5rem]">Địa điểm</div>
                                <p className="text-[#505050] text-[1.4rem]">64 Ung Văn Khiêm, Pleiku, Gia Lai</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#cfecbc]/40 flex items-center justify-center shrink-0">
                                <ScheduleIcon sx={{ fontSize: 22, color: "#2e7d32" }} />
                            </div>
                            <div>
                                <div className="font-[700] text-[#181818] text-[1.5rem]">Giờ làm việc</div>
                                <p className="text-[#505050] text-[1.4rem]">T2 - T7: 7:00 - 16:00</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#ffbaa0]/30 flex items-center justify-center shrink-0">
                                <RocketLaunchIcon sx={{ fontSize: 22, color: "#c45a3a" }} />
                            </div>
                            <div>
                                <div className="font-[700] text-[#181818] text-[1.5rem]">Chăm sóc di động</div>
                                <p className="text-[#505050] text-[1.4rem]">Theo dõi qua camera trên điện thoại.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="w-full max-w-[800px]">
                    {/* ========== PHẦN 1: Thông tin cơ bản khách ========== */}
                    <section className="mb-[40px]">
                        <div className="flex items-center gap-2 mb-[16px]">
                            <span className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffbaa0] text-[#181818] font-[700] text-[1.4rem]">1</span>
                            <h3 className="text-[2rem] font-[700] text-[#181818]">Thông tin khách hàng</h3>
                        </div>
                        <div className="bg-white rounded-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#eee] overflow-hidden">
                            <div className="bg-gradient-to-r from-[#ffbaa0]/12 to-[#e67e2010] px-[24px] py-[16px] border-b border-[#eee] flex items-center gap-3">
                                <PersonOutlineOutlinedIcon sx={{ fontSize: 26, color: "#c45a3a" }} />
                                <span className="text-[1.6rem] font-[600] text-[#181818]">Thông tin liên hệ</span>
                            </div>
                            <div className="p-[24px] grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-[16px] text-[1.5rem]">
                                <div>
                                    <span className="text-[#888] block mb-[4px] text-[1.3rem]">Họ và tên</span>
                                    <span className="text-[#181818] font-[500]">{step1Data.fullName || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-[#888] block mb-[4px] text-[1.3rem]">Email</span>
                                    <span className="text-[#181818] font-[500]">{step1Data.email || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-[#888] block mb-[4px] text-[1.3rem]">Số điện thoại</span>
                                    <span className="text-[#181818] font-[500]">{step1Data.phone || "—"}</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-[#888] block mb-[4px] text-[1.3rem]">Địa chỉ</span>
                                    <span className="text-[#181818] font-[500]">{step1Data.address || "—"}</span>
                                </div>
                                {step1Data.message ? (
                                    <div className="sm:col-span-2">
                                        <span className="text-[#888] block mb-[4px] text-[1.3rem]">Lời nhắn</span>
                                        <span className="text-[#181818] font-[500]">{step1Data.message}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    {/* ========== PHẦN 2: Số lượng thú cưng + thông tin từng thú + dịch vụ + ngày/slot ========== */}
                    <form onSubmit={handleSubmit}>
                        <section className="mb-[40px]">
                            <div className="flex items-center justify-between gap-4 mb-[16px]">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffbaa0] text-[#181818] font-[700] text-[1.4rem]">2</span>
                                    <h3 className="text-[2rem] font-[700] text-[#181818]">Thú cưng & dịch vụ</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={addPet}
                                    className="flex items-center gap-2 py-[10px] px-[20px] rounded-[12px] bg-[#ffbaa0]/20 text-[#c45a3a] font-[600] text-[1.4rem] hover:bg-[#ffbaa0]/35 transition-colors"
                                >
                                    <AddIcon sx={{ fontSize: 20 }} /> Thêm thú cưng
                                </button>
                            </div>

                            <div className="space-y-[28px]">
                                {pets.map((pet, index) => (
                                    <div
                                        key={pet.id}
                                        className="bg-white rounded-[16px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-[#eee]"
                                    >
                                        <div className="bg-[#f8f9fa] px-[24px] py-[14px] border-b border-[#eee] flex items-center justify-between flex-wrap gap-2">
                                            <span className="flex items-center gap-2 text-[1.5rem] font-[600] text-[#181818]">
                                                <PetsIcon sx={{ fontSize: 22, color: "#c45a3a" }} />
                                                {pet.petName.trim() || `Thú cưng ${index + 1}`}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePetCollapsed(pet.id)}
                                                    className="flex items-center gap-1 py-[6px] px-[12px] rounded-[8px] text-[1.35rem] font-[500] text-[#555] hover:bg-[#eee] transition-colors"
                                                >
                                                    {collapsedPetIds.has(pet.id) ? (
                                                        <>
                                                            <ExpandLessIcon sx={{ fontSize: 20 }} />
                                                            Hiện thông tin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ExpandMoreIcon sx={{ fontSize: 20 }} />
                                                            Ẩn bớt thông tin
                                                        </>
                                                    )}
                                                </button>
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

                                        <div
                                            className={`transition-[max-height,opacity] duration-300 ease-out ${
                                                collapsedPetIds.has(pet.id)
                                                    ? "max-h-0 opacity-0 pointer-events-none"
                                                    : "max-h-[2000px] opacity-100"
                                            }`}
                                        >
                                            <div className="p-[24px] space-y-[24px]">
                                            {/* Thông tin thú cưng */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
                                                <div className="sm:col-span-2">
                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Tên thú cưng *</label>
                                                    <input
                                                        type="text"
                                                        value={pet.petName}
                                                        onChange={(e) => updatePet(pet.id, { petName: e.target.value })}
                                                        placeholder="Ví dụ: Milu"
                                                        required
                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[1.5rem]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Loại</label>
                                                    <select
                                                        value={pet.petType}
                                                        onChange={(e) => updatePet(pet.id, { petType: e.target.value })}
                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] outline-none text-[1.5rem] bg-white"
                                                    >
                                                        {petTypeOptions.map((v) => (
                                                            <option key={v} value={v}>
                                                                {renderPetTypeLabel(v)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Cân nặng (kg)</label>
                                                    <input
                                                        type="text"
                                                        value={pet.weight}
                                                        onChange={(e) => updatePet(pet.id, { weight: e.target.value })}
                                                        placeholder="Ví dụ: 5"
                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[1.5rem]"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 lg:col-span-4">
                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Ghi chú (bệnh, dị ứng...)</label>
                                                    <input
                                                        type="text"
                                                        value={pet.notes}
                                                        onChange={(e) => updatePet(pet.id, { notes: e.target.value })}
                                                        placeholder="Tùy chọn"
                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[1.5rem]"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Liên hệ khẩn cấp</label>
                                                    <input
                                                        type="text"
                                                        value={pet.emergencyContactName ?? ""}
                                                        onChange={(e) => updatePet(pet.id, { emergencyContactName: e.target.value })}
                                                        placeholder="Họ tên người liên hệ"
                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[1.5rem]"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">SĐT khẩn cấp</label>
                                                    <input
                                                        type="tel"
                                                        value={pet.emergencyContactPhone ?? ""}
                                                        onChange={(e) => updatePet(pet.id, { emergencyContactPhone: e.target.value })}
                                                        placeholder="Số điện thoại"
                                                        className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[1.5rem]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Chọn dịch vụ + các tuỳ chọn phụ thuộc */}
                                            {/* Chọn dịch vụ */}
                                            <div className="mt-[8px] relative">
                                                <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Chọn dịch vụ *</label>
                                                <button
                                                    type="button"
                                                    disabled={!pet.weight || !pet.petType}
                                                    onClick={() => {
                                                        if (!pet.weight || !pet.petType) return;
                                                        setOpenServicePetId((prev) => (prev === pet.id ? null : pet.id));
                                                    }}
                                                    className={`w-full flex items-center justify-between py-[12px] px-[16px] rounded-[10px] border text-left text-[1.5rem] transition-colors ${
                                                        !pet.weight || !pet.petType
                                                            ? "border-[#ddd] bg-[#f5f5f5] text-[#999] cursor-not-allowed"
                                                            : "border-[#ddd] bg-white text-[#181818] hover:border-[#ffbaa0] cursor-pointer"
                                                    }`}
                                                >
                                                    <span className="truncate">
                                                        {!pet.weight || !pet.petType
                                                            ? "Vui lòng chọn loại thú cưng và cân nặng trước"
                                                            : getServiceDisplayLabel(pet) || "— Chọn dịch vụ —"}
                                                    </span>
                                                    <span className="ml-3 text-[#999] text-[1.3rem]">{openServicePetId === pet.id ? "▲" : "▼"}</span>
                                                </button>

                                                {openServicePetId === pet.id && pet.weight && pet.petType && (
                                                    <div className="absolute left-0 right-0 mt-[6px] z-30 bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_12px_30px_rgba(15,23,42,0.18)] max-h-[360px] overflow-y-auto">
                                                        <div className="py-[8px]">
                                                            {categories.map((cat) => {
                                                                const catServices = services.filter((s) => {
                                                                    if (s.serviceCategoryId !== cat.categoryId || !s.isActive)
                                                                        return false;

                                                                    // 1) Dịch vụ phải hỗ trợ loại thú cưng (service-level suitablePetTypes)
                                                                    const petTypeNorm = normalizePetType(pet.petType);
                                                                    const serviceSupportsPetType =
                                                                        !s.suitablePetTypes || s.suitablePetTypes.length === 0
                                                                            ? true
                                                                            : s.suitablePetTypes.some(
                                                                                  (t) => normalizePetType(t) === petTypeNorm
                                                                              );
                                                                    if (!serviceSupportsPetType) return false;

                                                                    // 2) Phải có ít nhất 1 quy tắc giá match loại thú cưng + cân nặng
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
                                                                        <div className="text-[1.3rem] font-[600] text-[#6b7280] mb-[4px]">
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
                                                                                        className={`w-full text-left rounded-[10px] px-[10px] py-[8px] border transition-colors ${
                                                                                            isSelected
                                                                                                ? "border-[#ffbaa0] bg-[#fff7f3]"
                                                                                                : "border-transparent hover:border-[#ffe0ce] hover:bg-[#fff7f3]"
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                            <span className="text-[1.45rem] font-[600] text-[#181818]">{s.serviceName}</span>
                                                                                            {price != null && (
                                                                                                <span className="text-[1.4rem] font-[600] text-[#c45a3a] whitespace-nowrap">
                                                                                                    {Number(price).toLocaleString("vi-VN")}đ
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
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mang theo thức ăn & hướng dẫn (chỉ khi dịch vụ thuộc nhóm hotel) */}
                                            {pet.serviceId && isHotelCategory(getCategoryByServiceId(pet.serviceId)) && (
                                                        <div className="mt-[16px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
                                                            <div className="sm:col-span-2 lg:col-span-4">
                                                                <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Mang theo thức ăn</label>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updatePet(pet.id, { foodBrought: true })}
                                                                        className={`py-[12px] px-[24px] rounded-[10px] font-[600] text-[1.5rem] transition-colors ${
                                                                            pet.foodBrought
                                                                                ? "bg-[#ffbaa0] text-[#181818] border-2 border-[#ffbaa0]"
                                                                                : "bg-white text-[#888] border-2 border-[#ddd] hover:border-[#ffbaa0]/50"
                                                                        }`}
                                                                    >
                                                                        Có
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updatePet(pet.id, { foodBrought: false, foodBroughtType: [] })}
                                                                        className={`py-[12px] px-[24px] rounded-[10px] font-[600] text-[1.5rem] transition-colors ${
                                                                            !pet.foodBrought
                                                                                ? "bg-[#ffbaa0] text-[#181818] border-2 border-[#ffbaa0]"
                                                                                : "bg-white text-[#888] border-2 border-[#ddd] hover:border-[#ffbaa0]/50"
                                                                        }`}
                                                                    >
                                                                        Không
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {pet.foodBrought && (
                                                                <div className="sm:col-span-2 lg:col-span-4">
                                                                    <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Loại thức ăn mang theo</label>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {[
                                                                            { value: "hat", label: "Hạt" },
                                                                            { value: "sup_thuong", label: "Súp thưởng" },
                                                                            { value: "pate", label: "Pate" },
                                                                            { value: "khac", label: "Khác" },
                                                                        ].map((opt) => {
                                                                            const current = pet.foodBroughtType ?? [];
                                                                            const selected = current.includes(opt.value as any);
                                                                            return (
                                                                                <button
                                                                                    key={opt.value}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const next = selected
                                                                                            ? current.filter((x) => x !== opt.value)
                                                                                            : [...current, opt.value];
                                                                                        updatePet(pet.id, { foodBroughtType: next });
                                                                                    }}
                                                                                    className={`py-[10px] px-[18px] rounded-[999px] text-[1.4rem] font-[600] border-2 transition-colors ${
                                                                                        selected
                                                                                            ? "bg-[#ffbaa0] text-[#181818] border-[#ffbaa0]"
                                                                                            : "bg-white text-[#888] border-[#ddd] hover:border-[#ffbaa0]/60"
                                                                                    }`}
                                                                                >
                                                                                    {opt.label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="sm:col-span-2 lg:col-span-4">
                                                                <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Hướng dẫn cho ăn</label>
                                                                <input
                                                                    type="text"
                                                                    value={pet.feedingInstructions ?? ""}
                                                                    onChange={(e) => updatePet(pet.id, { feedingInstructions: e.target.value })}
                                                                    placeholder="Ví dụ: 2 bữa/ngày, mỗi bữa 200g"
                                                                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 outline-none text-[1.5rem]"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                            {/* Theo pricingModel: per_day hoặc per_session */}
                                            {pet.pricingModel === "per_day" && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] p-[16px] bg-[#f0f9ff] rounded-[12px] border border-[#bae6fd]">
                                                            <div>
                                                                <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Ngày gửi *</label>
                                                                <input
                                                                    type="date"
                                                                    value={pet.dateFrom}
                                                                    onChange={(e) => updatePet(pet.id, { dateFrom: e.target.value })}
                                                                    required
                                                                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#7dd3fc] focus:border-[#0ea5e9] outline-none text-[1.5rem] bg-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Ngày trả *</label>
                                                                <input
                                                                    type="date"
                                                                    value={pet.dateTo}
                                                                    onChange={(e) => updatePet(pet.id, { dateTo: e.target.value })}
                                                                    required
                                                                    className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#7dd3fc] focus:border-[#0ea5e9] outline-none text-[1.5rem] bg-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                            {pet.pricingModel === "per_session" && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] p-[16px] bg-[#f0fdf4] rounded-[12px] border border-[#bbf7d0]">
                                                    <div>
                                                        <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Ngày hẹn *</label>
                                                        <input
                                                            type="date"
                                                            value={pet.sessionDate}
                                                            onChange={(e) => updatePet(pet.id, { sessionDate: e.target.value })}
                                                            required
                                                            className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#86efac] focus:border-[#22c55e] outline-none text-[1.5rem] bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block mb-[6px] text-[1.4rem] font-[600] text-[#181818]">Khung giờ *</label>
                                                        <select
                                                            value={pet.sessionSlot}
                                                            onChange={(e) => updatePet(pet.id, { sessionSlot: e.target.value })}
                                                            required
                                                            className="input-booking w-full py-[12px] px-[16px] rounded-[10px] border border-[#86efac] focus:border-[#22c55e] outline-none text-[1.5rem] bg-white"
                                                        >
                                                            {SESSION_SLOTS.map((slot) => (
                                                                <option key={slot} value={slot}>
                                                                    {slot}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ========== PHẦN 3: Nút hành động ========== */}
                    <section className="flex flex-wrap items-center justify-between gap-4 pt-[8px]">
                        <button
                            type="button"
                            onClick={() => navigate("/dat-lich", { state: step1Data })}
                            className="py-[14px] px-[28px] rounded-[12px] border border-[#ddd] text-[#181818] font-[600] text-[1.5rem] hover:bg-[#f5f5f5] transition-colors"
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="py-[14px] px-[36px] rounded-[12px] bg-[#ffbaa0] hover:bg-[#e6a890] text-[#181818] font-[600] text-[1.5rem] transition-colors shadow-sm hover:shadow-md"
                        >
                            Hoàn tất đặt lịch
                        </button>
                    </section>
                </form>
            </main>
        </div>

        <div className="app-container flex gap-[30px] pb-[100px]">
            <div className="w-[413px] px-[20px]">
                <div className="w-full h-[206px]">
                    <img src="https://pawsitive.bold-themes.com/coco/wp-content/uploads/sites/3/2019/08/inner_image_maps_02.png" alt="" width={413} height={206} className="w-full h-full object-cover rounded-t-[50px]" />
                </div>
                <div className="bg-[#e67e2026] px-[30px] pt-[32px] pb-[40px] rounded-b-[50px]">
                    <div className="flex mb-[32px]">
                        <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                            <EditLocationAltIcon style={{ fontSize: "4rem" }} />
                        </div>
                        <div className="pl-[20px]">
                            <div className="text-[2.2rem] font-[800] text-[#181818] mb-[12px]">Địa chỉ</div>
                            <p className="text-[#181818]">64 Ung Văn Khiêm, Pleiku, Gia Lai</p>
                        </div>
                    </div>
                    <div className="flex mb-[32px]">
                        <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                            <PhoneEnabledOutlinedIcon style={{ fontSize: "4rem" }} />
                        </div>
                        <div className="pl-[20px]">
                            <div className="text-[2.2rem] font-[800] text-[#181818] mb-[12px]">Số điện thoại</div>
                            <p className="text-[#181818]">+84346587796</p>
                        </div>
                    </div>
                    <div className="flex mb-[32px]">
                        <div className="w-[45px] h-[45px] text-[#ffbaa0]">
                            <MailOutlineOutlinedIcon style={{ fontSize: "4rem" }} />
                        </div>
                        <div className="pl-[20px]">
                            <div className="text-[2.2rem] font-[800] text-[#181818] mb-[12px]">E-mail</div>
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
);
};
