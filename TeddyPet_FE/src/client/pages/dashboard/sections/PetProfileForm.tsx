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
                <div className="flex justify-between items-center border-b border-slate-100 px-8 py-6">
                    <h3 className="text-[1.125rem] font-black text-slate-800">
                        {initial ? "Chỉnh sửa thú cưng" : "Đăng ký bé mới"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Tên thú cưng *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={100}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                            placeholder="Ví dụ: Misa, Lu"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Loại *
                            </label>
                            <select
                                value={petType}
                                onChange={(e) => setPetType(e.target.value as PetTypeEnum)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                            >
                                {PET_TYPES.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Giống
                            </label>
                            <input
                                type="text"
                                value={breed}
                                onChange={(e) => setBreed(e.target.value)}
                                maxLength={100}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                placeholder="Ví dụ: Poodle, British Shorthair"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Giới tính
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender((e.target.value || "") as GenderEnum | "")}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
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
                            <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Ngày sinh
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Cân nặng (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                placeholder="Ví dụ: 4.5"
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isNeutered}
                                    onChange={(e) => setIsNeutered(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-[0.5938rem] font-bold text-slate-600">Đã triệt sản</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                {(avatarUrl || avatarPreview) ? (
                                    <img
                                        src={avatarPreview || avatarUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-slate-300" />
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 disabled:opacity-50"
                                >
                                    <Upload size={16} />
                                    {uploadingAvatar ? "Đang tải lên..." : "Chọn ảnh từ thiết bị"}
                                </button>
                                {(avatarUrl || avatarPreview) && (
                                    <button
                                        type="button"
                                        onClick={clearAvatar}
                                        className="text-slate-500 text-sm hover:text-red-600"
                                    >
                                        Xóa ảnh
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">JPG, PNG hoặc WebP, tối đa 10MB</p>
                    </div>

                    <div>
                        <label className="block text-[0.5938rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Ghi chú sức khỏe
                        </label>
                        <textarea
                            value={healthNote}
                            onChange={(e) => setHealthNote(e.target.value)}
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                            placeholder="Dị ứng, bệnh nền, thuốc đang dùng..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Đang xử lý..." : initial ? "Cập nhật" : "Đăng ký"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                        >
                            Hủy
                        </button>
                        {initial && onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-8 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 ml-auto"
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
