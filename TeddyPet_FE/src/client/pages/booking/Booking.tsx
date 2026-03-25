import { FooterSub } from "../../components/layouts/FooterSub";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PhoneEnabledOutlinedIcon from "@mui/icons-material/PhoneEnabledOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { prefixAdmin } from "../../../admin/constants/routes";
import Cookies from "js-cookie";
import { getMe } from "../../../api/auth.api";
import { getAllAddresses } from "../../../api/address.api";
import type { UserAddressResponse } from "../../../types/address.type";

type BookingPageMode = "client" | "admin-counter";

export interface BookingStep1FormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    message: string;
}

const defaultFormData: BookingStep1FormData = {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    message: "",
};

type BookingPageProps = {
    mode?: BookingPageMode;
    nextPath?: string;
};

/** Chỉ điền form đặt lịch từ hồ sơ khi đúng role khách (USER). Tránh dùng useAuthStore.user vì AdminGuard có adminLoginSync → store có thể đang là admin/staff. */
function isBookingPrefillRole(role?: string | null): boolean {
    return (role ?? "").trim().toUpperCase() === "USER";
}

export const BookingPage = ({ mode = "client", nextPath }: BookingPageProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isCounterBooking = mode === "admin-counter";
    // Preserve existing draft data if user navigates back from step 2
    const rawState = location.state as (BookingStep1FormData & { bookingDraft?: any; bookingCodeForEdit?: string }) | undefined;

    const [formData, setFormData] = useState<BookingStep1FormData>(() => {
        if (isCounterBooking) {
            const fromDraft = rawState?.bookingDraft?.step1Data as BookingStep1FormData | undefined;
            // Màn hình đặt tại quầy không tự điền data admin;
            // chỉ giữ lại dữ liệu khi quay lại từ bước chi tiết.
            return fromDraft
                ? {
                    fullName: fromDraft.fullName ?? "",
                    email: fromDraft.email ?? "",
                    phone: fromDraft.phone ?? "",
                    address: fromDraft.address ?? "",
                    message: fromDraft.message ?? "",
                }
                : defaultFormData;
        }
        return rawState && typeof rawState === "object"
            ? {
                fullName: rawState.fullName ?? "",
                email: rawState.email ?? "",
                phone: rawState.phone ?? "",
                address: rawState.address ?? "",
                message: rawState.message ?? "",
            }
            : defaultFormData;
    });
    const [savedAddresses, setSavedAddresses] = useState<UserAddressResponse[]>([]);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const addressDropdownRef = useRef<HTMLDivElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const formSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    /**
     * Điền form & địa chỉ từ API /me với cookie `token` (phiên khách), không dùng user trong Zustand
     * (có thể bị ghi đè khi mở trang admin cùng trình duyệt).
     */
    useEffect(() => {
        if (isCounterBooking) {
            setSavedAddresses([]);
            setShowAddressDropdown(false);
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            setSavedAddresses([]);
            setShowAddressDropdown(false);
            return;
        }

        let mounted = true;

        (async () => {
            try {
                const meRes = await getMe(token);
                const me = meRes?.data;
                if (!mounted) return;

                if (me && isBookingPrefillRole(me.role)) {
                    const profileFullName = `${me.lastName ?? ""} ${me.firstName ?? ""}`.trim();
                    setFormData((prev) => ({
                        ...prev,
                        fullName: prev.fullName || profileFullName,
                        email: prev.email || me.email || "",
                        phone: prev.phone || me.phoneNumber || "",
                    }));
                }

                if (!me || !isBookingPrefillRole(me.role)) {
                    setSavedAddresses([]);
                    return;
                }

                const addrRes = await getAllAddresses();
                if (!mounted) return;
                const list = Array.isArray(addrRes?.data) ? addrRes.data : [];
                setSavedAddresses(list);

                const defaultAddress = list.find((addr) => addr.isDefault)?.address?.trim();
                if (defaultAddress) {
                    setFormData((prev) => (prev.address.trim() ? prev : { ...prev, address: defaultAddress }));
                }
            } catch {
                if (mounted) setSavedAddresses([]);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [isCounterBooking]);

    useEffect(() => {
        if (!showAddressDropdown) return;
        const onClickOutside = (event: MouseEvent) => {
            if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
                setShowAddressDropdown(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, [showAddressDropdown]);

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(nextPath ?? "/dat-lich/chi-tiet", {
            state: {
                ...formData,
                bookingDraft: rawState?.bookingDraft,
                bookingCodeForEdit: rawState?.bookingCodeForEdit,
                bookingMode: mode,
            }
        });
    };

    const step1ContactForm = (
        <form
            onSubmit={handleNext}
            className="w-full max-w-[520px] bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#eee] overflow-hidden"
        >
            <div className="bg-gradient-to-r from-[#ffbaa0]/20 to-[#e67e2026] px-[32px] py-[24px] border-b border-[#eee]">
                <div className="flex items-center gap-3">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#ffbaa0]/30 flex items-center justify-center">
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 28, color: "#c45a3a" }} />
                    </div>
                    <div>
                        <h3 className="text-[1.25rem] font-[700] text-[#181818]">Thông tin liên hệ</h3>
                        <p className="text-[0.875rem] text-[#505050] mt-[4px]">Phần 1/3 — Thông tin cơ bản khách hàng</p>
                    </div>
                </div>
            </div>

            <div className="p-[32px] space-y-[24px]">
                <div>
                    <label htmlFor="fullname" className="block text-[0.875rem] font-[600] text-[#181818] mb-[10px]">
                        Họ và tên <span className="text-[#e67e20]">*</span>
                    </label>
                    <input
                        id="fullname"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full py-[14px] px-[20px] text-[0.9375rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all duration-200 rounded-[12px]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-[20px]">
                    <div>
                        <label htmlFor="email" className="block text-[0.875rem] font-[600] text-[#181818] mb-[10px]">
                            Email <span className="text-[#e67e20]">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full py-[14px] px-[20px] text-[0.9375rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all duration-200 rounded-[12px]"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-[0.875rem] font-[600] text-[#181818] mb-[10px]">
                            Số điện thoại <span className="text-[#e67e20]">*</span>
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            placeholder="0900 000 000"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full py-[14px] px-[20px] text-[0.9375rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all duration-200 rounded-[12px]"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-[10px]">
                        <label htmlFor="address" className="block text-[0.875rem] font-[600] text-[#181818]">
                            Địa chỉ
                        </label>
                        {!isCounterBooking && savedAddresses.length > 0 && (
                            <div className="relative" ref={addressDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddressDropdown((prev) => !prev)}
                                    className="px-[12px] py-[7px] text-[0.75rem] font-[600] rounded-[10px] border border-[#ffbaa0] text-[#c45a3a] hover:bg-[#fff4ef] transition-colors"
                                >
                                    Chọn địa chỉ cũ
                                </button>
                                {showAddressDropdown && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] z-[20] w-[320px] max-h-[240px] overflow-y-auto bg-white border border-[#eee] rounded-[12px] shadow-[0_10px_24px_rgba(0,0,0,0.12)] p-[6px]">
                                        {savedAddresses.map((addr) => (
                                            <button
                                                key={addr.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev) => ({ ...prev, address: addr.address || "" }));
                                                    setShowAddressDropdown(false);
                                                }}
                                                className="w-full text-left px-[10px] py-[8px] rounded-[10px] hover:bg-[#fff4ef] transition-colors"
                                            >
                                                <p className="text-[0.8125rem] text-[#181818] font-[600] line-clamp-2">{addr.address}</p>
                                                <p className="text-[0.6875rem] text-[#888] mt-[2px]">{addr.fullName} - {addr.phone}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        id="address"
                        type="text"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full py-[14px] px-[20px] text-[0.9375rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all duration-200 rounded-[12px]"
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-[0.875rem] font-[600] text-[#181818] mb-[10px]">
                        Lời nhắn
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        maxLength={2000}
                        placeholder="Ghi chú hoặc yêu cầu đặc biệt (nếu có)..."
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full py-[14px] px-[20px] text-[0.9375rem] text-[#181818] outline-none border border-[#ddd] focus:border-[#ffbaa0] focus:ring-2 focus:ring-[#ffbaa0]/20 transition-all duration-200 rounded-[12px] resize-none"
                    />
                    <p className="text-[0.75rem] text-[#888] mt-[6px]">{formData.message.length}/2000</p>
                </div>

                <div className="pt-[8px]">
                    <button
                        type="submit"
                        className="w-full py-[16px] rounded-[12px] bg-[#ffbaa0] hover:bg-[#e6a890] text-[#181818] font-[600] text-[1rem] transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        Tiếp theo
                    </button>
                </div>
            </div>
        </form>
    );

    if (mode === "admin-counter") {
        return (
            <div className="min-h-screen bg-[#fbfbf9]">
                <div className="app-container px-4 sm:px-6 lg:px-8 pt-6 pb-16">
                    <Link
                        to={`/${prefixAdmin}/booking/list`}
                        className="inline-flex items-center gap-2 text-[0.9375rem] font-[600] text-[#c45a3a] hover:text-[#a04330] transition-colors"
                    >
                        <ArrowBackIosNewIcon sx={{ fontSize: 18 }} aria-hidden />
                        Quay lại danh sách đặt lịch
                    </Link>
                    <div ref={formSectionRef} className="flex justify-center pt-8">
                        {step1ContactForm}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="relative">
                <div className="app-container flex py-[100px] bg-white">
                    <div className="px-[20px] w-[42%] z-[10]">
                        <p className="uppercase text-client-secondary text-[1.0625rem] font-[700] mb-[15px]">
                            Dịch vụ cao cấp
                        </p>
                        <h2 className="text-[3.5625rem] 2xl:text-[3.5625rem] 2xl:font-[500] text-[#181818] leading-[1.2] font-third mb-[20px]">
                            Hãy để chúng tôi chăm sóc bé cưng của bạn
                        </h2>
                        <p className="text-[#505050] font-[500] text-[1.125rem] inline-block mt-[15px]">
                            Hãy mang bé cưng đến với chúng tôi – nơi đội ngũ chuyên viên sẽ
                            chăm sóc tận tâm và chuyên nghiệp nhất.
                        </p>
                    </div>
                </div>
                <img
                    className="absolute right-[0%] max-w-[58%] top-[-20%] 2xl:top-[-17%]"
                    src="https://pawsitive.bold-themes.com/coco/wp-content/uploads/sites/3/2019/08/hero_image_13-1.png"
                    alt=""
                />
            </div>

            <div className="app-container flex py-[100px]">
                <div className="w-[50%] px-[30px]">
                    <h2 className="text-[2.9375rem] font-third text-[#181818] mb-[64px]">
                        Liên hệ chúng tôi
                    </h2>

                    <div className="flex gap-[16px] mb-[32px] group">
                        <div className="w-[45px] h-[45px] text-[#181818] flex items-center justify-center shadow-[0_0_72px_#afe2e5_inset] group-hover:shadow-[0_0_4px_#afe2e5_inset] transition-all duration-200 ease rounded-full">
                            <EditLocationAltIcon style={{ fontSize: "1.75rem" }} />
                        </div>
                        <div>
                            <div className="text-[1.25rem] font-[700] mb-[10px] group-hover:text-[#ffbaa0] cursor-pointer transition-default">
                                Địa điểm
                            </div>
                            <p>99/45, Nguyễn Văn Linh, Tân Thuận Tây, Quận 7, Ho Chi Minh City, Vietnam</p>
                        </div>
                    </div>

                    <div className="flex gap-[16px] mb-[32px] group">
                        <div className="w-[45px] h-[45px] text-[#181818] flex items-center justify-center shadow-[0_0_72px_#cfecbc_inset] group-hover:shadow-[0_0_4px_#cfecbc_inset] transition-all duration-200 ease rounded-full">
                            <EditLocationAltIcon style={{ fontSize: "1.75rem" }} />
                        </div>
                        <div>
                            <div className="text-[1.25rem] font-[700] mb-[10px] group-hover:text-[#ffbaa0] cursor-pointer transition-default">
                                Thời gian
                            </div>
                            <p>Thứ 2 - Thứ 7: 7:00 sáng - 4:00 chiều</p>
                        </div>
                    </div>

                    <div className="flex gap-[16px] mb-[32px] group">
                        <div className="w-[45px] h-[45px] text-[#181818] flex items-center justify-center shadow-[0_0_72px_#ffbaa0_inset] group-hover:shadow-[0_0_4px_#ffbaa0_inset] transition-all duration-300 ease rounded-full">
                            <RocketLaunchIcon style={{ fontSize: "1.75rem" }} />
                        </div>
                        <div>
                            <div className="text-[1.25rem] font-[700] mb-[10px] group-hover:text-[#ffbaa0] cursor-pointer transition-default">
                                Chăm sóc di động
                            </div>
                            <p>
                                Bạn có thể theo dõi thú cưng của mình qua camera ngay trên điện
                                thoại.
                            </p>
                        </div>
                    </div>

                    <div className="w-[335px] h-[190px]">
                        <img src="file:///Users/ngotuankiet/.gemini/antigravity/brain/3ee94048-3cb0-4052-aa9d-7ba527439328/phone_bone_updated_1773903974469.png" alt="" width={335} height={190} className="image-phone-booking cursor-pointer" />
                    </div>
                </div>

                <div ref={formSectionRef} className="w-[50%] px-[30px] py-[50px] flex justify-start">
                    {step1ContactForm}
                </div>
            </div>

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
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.610010397031!2d106.809883!3d10.841127599999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2sFPT%20University%20HCMC!5e0!3m2!1sen!2s!4v1761230475278!5m2!1sen!2s" width="100%" height="100%" loading="lazy"></iframe>
                </div>
            </div>

            <FooterSub />
        </>
    );
};
