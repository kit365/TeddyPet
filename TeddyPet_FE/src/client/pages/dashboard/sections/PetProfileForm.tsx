import { useState, useEffect, useRef } from "react";
import { X, Upload, ImageIcon } from "lucide-react";
import type { PetProfileResponse, PetProfileRequest } from "../../../../types/petProfile.type";
import { uploadImage } from "../../../../api/upload.api";
import { toast } from "react-toastify";

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

interface PetProfileFormProps {
    initial?: PetProfileResponse;
    onSubmit: (payload: PetProfileRequest) => Promise<void>;
    onClose: () => void;
    submitting: boolean;
    onDelete?: (pet: PetProfileResponse) => void;
}

export function PetProfileForm({ initial, onSubmit, onClose, submitting, onDelete }: PetProfileFormProps) {
    const [name, setName] = useState("");
    const [petType, setPetType] = useState<PetTypeEnum>("DOG");
    const [breed, setBreed] = useState("");
    const [gender, setGender] = useState<GenderEnum | "">("");
    const [birthDate, setBirthDate] = useState("");
    const [weight, setWeight] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // object URL khi chọn file mới (trước khi upload)
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isNeutered, setIsNeutered] = useState(false);
    const [healthNote, setHealthNote] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initial) {
            setName(initial.name);
            setPetType(initial.petType);
            setBreed(initial.breed ?? "");
            setGender(initial.gender ?? "");
            setBirthDate(initial.birthDate ? initial.birthDate.slice(0, 10) : "");
            setWeight(initial.weight != null ? String(initial.weight) : "");
            setAvatarUrl(initial.avatarUrl ?? "");
            setAvatarPreview(null);
            setIsNeutered(initial.isNeutered ?? false);
            setHealthNote(initial.healthNote ?? "");
        } else {
            setName("");
            setPetType("DOG");
            setBreed("");
            setGender("");
            setBirthDate("");
            setWeight("");
            setAvatarUrl("");
            setAvatarPreview(null);
            setIsNeutered(false);
            setHealthNote("");
        }
    }, [initial]);

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
        if (!name.trim()) return;
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
        await onSubmit(payload);
    };

    const handleDelete = () => {
        if (initial && onDelete && confirm(`Bạn có chắc muốn xóa hồ sơ "${initial.name}"?`)) {
            onDelete(initial);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-[1.25rem] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-slate-100 px-6 py-5">
                    <h3 className="text-[1.0625rem] font-bold text-slate-800">
                        {initial ? "Chỉnh sửa thú cưng" : "Thêm thú cưng mới"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Tên thú cưng (Full width) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Tên thú cưng *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={100}
                            className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            placeholder="Ví dụ: Misa, Lu"
                        />
                    </div>

                    {/* Loại & Giới tính (2 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Loại *
                            </label>
                            <select
                                value={petType}
                                onChange={(e) => setPetType(e.target.value as PetTypeEnum)}
                                className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            >
                                {PET_TYPES.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Giới tính
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender((e.target.value || "") as GenderEnum | "")}
                                className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            >
                                <option value="">— Chọn —</option>
                                {GENDERS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Giống (Full width) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Giống
                        </label>
                        <input
                            type="text"
                            value={breed}
                            onChange={(e) => setBreed(e.target.value)}
                            maxLength={100}
                            className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            placeholder="Ví dụ: Poodle, British Shorthair"
                        />
                    </div>

                    {/* Ngày sinh & Cân nặng (2 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Ngày sinh
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Cân nặng (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="Ví dụ: 4.5"
                            />
                        </div>
                    </div>

                    {/* Đã triệt sản */}
                    <div className="flex items-center">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isNeutered}
                                onChange={(e) => setIsNeutered(e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-bold text-slate-600">Đã triệt sản</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 disabled:opacity-50 transition-colors"
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

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Ghi chú sức khỏe
                        </label>
                        <textarea
                            value={healthNote}
                            onChange={(e) => setHealthNote(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/10 outline-none transition-all resize-none"
                            placeholder="Dị ứng, bệnh nền, thuốc đang dùng..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3">
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? "Đang xử lý..." : initial ? "Cập nhật hồ sơ" : "Thêm thú cưng"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-50 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                            Hủy
                        </button>
                        {initial && onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-6 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 ml-auto transition-colors"
                            >
                                Xóa hồ sơ
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
