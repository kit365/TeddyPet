import { Plus, Settings, PawPrint } from "lucide-react";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useEffect, useState } from "react";
import { getMyPetProfiles, createPetProfile, updatePetProfile, deletePetProfile } from "../../../api/petProfile.api";
import { PetProfileResponse, PetProfileRequest } from "../../../types/petProfile.type";
import { toast } from "react-toastify";
import { PetProfileForm } from "./sections/PetProfileForm";

const DEFAULT_AVATAR_DOG = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60";
const DEFAULT_AVATAR_CAT = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60";

function formatAge(birthDate?: string): string {
    if (!birthDate) return "—";
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    if (years <= 0) {
        const months = Math.max(0, (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth());
        return months < 12 ? `${months} tháng` : "1 tuổi";
    }
    return `${years} tuổi`;
}

function formatBreed(pet: PetProfileResponse): string {
    const type = pet.petType === "DOG" ? "DOG" : pet.petType === "CAT" ? "CAT" : "OTHER";
    const breed = pet.breed?.trim() || "";
    return breed ? `${breed.toUpperCase()} - ${type}` : type;
}

export const PetsPage = () => {
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Hồ sơ thú cưng", to: "/dashboard/pets" },
    ];

    const [pets, setPets] = useState<PetProfileResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingPet, setEditingPet] = useState<PetProfileResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPets = async () => {
        try {
            setLoading(true);
            const res = await getMyPetProfiles();
            setPets(res.data ?? []);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Không thể tải danh sách thú cưng.");
            setPets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPets();
    }, []);

    const handleOpenCreate = () => {
        setEditingPet(null);
        setFormOpen(true);
    };

    const handleOpenEdit = (pet: PetProfileResponse) => {
        setEditingPet(pet);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingPet(null);
    };

    const handleSubmit = async (payload: PetProfileRequest) => {
        try {
            setSubmitting(true);
            if (editingPet) {
                await updatePetProfile(editingPet.id, payload);
                toast.success("Cập nhật thú cưng thành công.");
            } else {
                await createPetProfile(payload);
                toast.success("Đăng ký thú cưng thành công.");
            }
            handleCloseForm();
            fetchPets();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Có lỗi xảy ra.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (pet: PetProfileResponse) => {
        try {
            await deletePetProfile(pet.id);
            toast.success("Đã xóa hồ sơ thú cưng.");
            fetchPets();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Không thể xóa.");
        }
    };

    const getAvatar = (pet: PetProfileResponse) =>
        pet.avatarUrl || (pet.petType === "CAT" ? DEFAULT_AVATAR_CAT : DEFAULT_AVATAR_DOG);

    return (
        <DashboardLayout pageTitle="Hồ sơ thú cưng" breadcrumbs={breadcrumbs}>
            <div className="space-y-12">
                <div className="flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-client-primary rounded-2xl flex items-center justify-center">
                            <PawPrint size={24} />
                        </div>
                        <h2 className="text-[1.25rem] font-black text-slate-800 tracking-tight">Các bé của tôi</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="flex items-center gap-3 bg-client-primary text-white px-8 py-4 rounded-[0.75rem] font-black text-[0.75rem] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-red-50"
                    >
                        <Plus size={18} /> Đăng ký bé mới
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="text-slate-500 font-bold">Đang tải...</div>
                    </div>
                ) : pets.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-[1.25rem] p-12 text-center">
                        <p className="text-slate-500 text-[0.6875rem] mb-4">Bạn chưa đăng ký thú cưng nào.</p>
                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="text-client-primary font-bold hover:underline"
                        >
                            Đăng ký bé mới
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8">
                        {pets.map((pet) => (
                            <div
                                key={pet.id}
                                className="bg-white border border-slate-100 rounded-[1.875rem] p-10 flex gap-8 hover:border-red-100 hover:shadow-2xl hover:shadow-red-50/50 transition-all group relative ring-1 ring-slate-50"
                            >
                                <img
                                    src={getAvatar(pet)}
                                    alt={pet.name}
                                    className="w-44 h-44 rounded-[1.5625rem] object-cover group-hover:scale-105 transition-transform duration-500 shadow-sm"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start pt-2">
                                        <div>
                                            <h3 className="text-[1.5rem] font-black text-slate-800 tracking-tighter mb-1">
                                                {pet.name}
                                            </h3>
                                            <p className="text-[0.625rem] font-black text-client-primary uppercase tracking-[0.1em]">
                                                {formatBreed(pet)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(pet)}
                                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-client-primary hover:text-white transition-all shadow-sm"
                                                title="Chỉnh sửa"
                                            >
                                                <Settings size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-12">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[0.5625rem] font-black text-slate-300 uppercase tracking-widest">
                                                Tuổi
                                            </p>
                                            <p className="text-[1.125rem] font-bold text-slate-800 mt-1">
                                                {formatAge(pet.birthDate)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <p className="text-[0.5625rem] font-black text-slate-300 uppercase tracking-widest">
                                                Cân nặng
                                            </p>
                                            <p className="text-[1.125rem] font-bold text-slate-800 mt-1">
                                                {pet.weight != null ? `${pet.weight}kg` : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-6 p-8 bg-slate-50/50 rounded-[1.25rem] border border-slate-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-client-primary shadow-sm">
                        <PawPrint size={18} />
                    </div>
                    <p className="text-[0.8125rem] font-bold text-slate-400">
                        TeddyPet luôn đồng hành cùng sức khỏe thú cưng của bạn.
                    </p>
                </div>
            </div>

            {formOpen && (
                <PetProfileForm
                    initial={editingPet ?? undefined}
                    onSubmit={handleSubmit}
                    onClose={handleCloseForm}
                    submitting={submitting}
                    onDelete={editingPet ? handleDelete : undefined}
                />
            )}
        </DashboardLayout>
    );
};
