import { useState, useRef, useEffect } from "react";
import { Upload, ImageIcon, PawPrint } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import type { PetProfileRequest } from "../../../types/petProfile.type";
import { uploadImage } from "../../../api/upload.api";
import { createPetProfile, updatePetProfile, deletePetProfile, getMyPetProfiles } from "../../../api/petProfile.api";
import { toast } from "react-toastify";
import { DashboardLayout } from "./sections/DashboardLayout";

type PetTypeEnum = PetProfileRequest["petType"];
type GenderEnum = PetProfileRequest["gender"];

const PET_TYPES: { value: PetTypeEnum; label: string }[] = [
    { value: "DOG", label: "Chó" },
    { value: "CAT", label: "Mèo" },
    { value: "OTHER", label: "Khác" },
];

const GENDERS: { value: GenderEnum; label: string }[] = [
    { value: "MALE", label: "Đực" },
    { value: "FEMALE", label: "Cái" },
    { value: "OTHER", label: "Khác" },
];

export const PetCreatePage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(isEdit);
    const [name, setName] = useState("");
    const [petType, setPetType] = useState<PetTypeEnum>("DOG");
    const [breed, setBreed] = useState("");
    const [gender, setGender] = useState<GenderEnum | "">("");
    const [birthDate, setBirthDate] = useState("");
    const [weight, setWeight] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isNeutered, setIsNeutered] = useState(false);
    const [healthNote, setHealthNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load pet data when editing
        const loadPetData = async () => {
            if (isEdit && id) {
                try {
                    setLoading(true);
                    const res = await getMyPetProfiles();
                    const pet = res.data?.find((p: any) => p.id === id);
                    if (pet) {
                        setName(pet.name);
                        setPetType(pet.petType);
                        setBreed(pet.breed || "");
                        setGender(pet.gender || "");
                        setBirthDate(pet.birthDate ? pet.birthDate.slice(0, 10) : "");
                        setWeight(pet.weight != null ? String(pet.weight) : "");
                        setAvatarUrl(pet.avatarUrl || "");
                        setIsNeutered(pet.isNeutered || false);
                        setHealthNote(pet.healthNote || "");
                    } else {
                        toast.error("Không tìm thấy thú cưng");
                        navigate("/dashboard/pets");
                    }
                } catch (error) {
                    toast.error("Không thể tải thông tin thú cưng");
                    navigate("/dashboard/pets");
                } finally {
                    setLoading(false);
                }
            }
        };

        loadPetData();
    }, [id, isEdit, navigate]);

    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn file ảnh (JPG, PNG, ...).");
            return;
        }
        const maxSizeMB = 10;
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Ảnh không được quá ${maxSizeMB}MB. Bạn có thể nén ảnh hoặc chọn ảnh nhỏ hơn.`);
            return;
        }
        const prevObjectUrl = avatarPreview;
        setAvatarPreview(URL.createObjectURL(file));
        if (prevObjectUrl) URL.revokeObjectURL(prevObjectUrl);

        setUploadingAvatar(true);
        try {
            const url = await uploadImage(file);
            setAvatarUrl(url);
            setAvatarPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Tải ảnh lên thất bại.";
            toast.error(msg);
            setAvatarPreview(null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const clearAvatar = () => {
        setAvatarUrl("");
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Vui lòng nhập tên thú cưng");
            return;
        }

        try {
            setSubmitting(true);
            const payload: PetProfileRequest = {
                name: name.trim(),
                petType,
                breed: breed.trim() || undefined,
                gender: gender || undefined,
                birthDate: birthDate || undefined,
                weight: weight ? Number(weight) : undefined,
                avatarUrl: avatarUrl.trim() || undefined,
                isNeutered,
                healthNote: healthNote.trim() || undefined,
            };
            
            if (isEdit && id) {
                await updatePetProfile(parseInt(id), payload);
                toast.success("Cập nhật hồ sơ thành công!");
            } else {
                await createPetProfile(payload);
                toast.success("Thêm thú cưng thành công!");
            }
            navigate("/dashboard/pets");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!isEdit || !id) return;
        if (!confirm(`Bạn có chắc muốn xóa hồ sơ này?`)) return;
        
        try {
            await deletePetProfile(parseInt(id));
            toast.success("Đã xóa hồ sơ thú cưng.");
            navigate("/dashboard/pets");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể xóa.");
        }
    };

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Hồ sơ thú cưng", to: "/dashboard/pets" },
        { label: isEdit ? "Chỉnh sửa" : "Thêm mới", to: "#" },
    ];

    if (loading) {
        return (
            <DashboardLayout pageTitle="Đang tải..." breadcrumbs={breadcrumbs}>
                <div className="max-w-[56rem] space-y-4">
                    <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            pageTitle={isEdit ? "Chỉnh sửa thú cưng" : "Thêm thú cưng mới"}
            breadcrumbs={breadcrumbs}
        >
            <div className="max-w-[56rem] space-y-4 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[1.5rem] font-bold text-slate-800 flex items-center gap-2.5">
                            <PawPrint className="text-client-primary" size={24} />
                            {isEdit ? "Chỉnh sửa thú cưng" : "Thêm thú cưng mới"}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {isEdit ? "Cập nhật thông tin hồ sơ của thú cưng" : "Tạo hồ sơ mới cho thú cưng của bạn"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tên & Loại (2 columns) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Tên thú cưng *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                maxLength={100}
                                className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="Misa, Lu, ..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Loại *
                            </label>
                            <select
                                value={petType}
                                onChange={(e) => setPetType(e.target.value as PetTypeEnum)}
                                className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            >
                                {PET_TYPES.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Giới tính & Giống (2 columns) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Giới tính
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender((e.target.value || "") as GenderEnum | "")}
                                className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            >
                                <option value="">— Chọn —</option>
                                {GENDERS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Giống
                            </label>
                            <input
                                type="text"
                                value={breed}
                                onChange={(e) => setBreed(e.target.value)}
                                maxLength={100}
                                className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="Poodle, British Shorthair, ..."
                            />
                        </div>
                    </div>

                    {/* Ngày sinh & Cân nặng (2 columns) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Ngày sinh
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Cân nặng (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="Ví dụ: 4.5"
                            />
                        </div>
                    </div>

                    {/* Triệt sân & (2 columns - triệt sản để bên trái) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center pt-1">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isNeutered}
                                    onChange={(e) => setIsNeutered(e.target.checked)}
                                    className="w-4 h-4 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Đã triệt sản
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Ảnh đại diện */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Ảnh đại diện
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                        />
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                {(avatarUrl || avatarPreview) ? (
                                    <img
                                        src={avatarPreview || avatarUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold text-xs hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                                >
                                    <Upload size={14} />
                                    {uploadingAvatar ? "Đang tải lên..." : "Chọn ảnh"}
                                </button>
                                {(avatarUrl || avatarPreview) && (
                                    <button
                                        type="button"
                                        onClick={clearAvatar}
                                        className="text-slate-500 text-xs hover:text-red-600 transition-colors"
                                    >
                                        Xóa ảnh
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs mt-2">JPG, PNG hoặc WebP, tối đa 10MB</p>
                    </div>

                    {/* Ghi chú sức khỏe */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Ghi chú sức khỏe
                        </label>
                        <textarea
                            value={healthNote}
                            onChange={(e) => setHealthNote(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all resize-none"
                            placeholder="Dị ứng, bệnh nền, thuốc đang dùng..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? "Đang xử lý..." : isEdit ? "Cập nhật hồ sơ" : "Thêm thú cưng"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard/pets")}
                            className="px-6 py-2 bg-slate-50 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                            Hủy
                        </button>
                        {isEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-6 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 ml-auto transition-colors"
                            >
                                Xóa hồ sơ
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};
