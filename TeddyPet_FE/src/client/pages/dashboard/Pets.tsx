import { Plus, PawPrint, Edit2 } from "lucide-react";
import { DashboardLayout } from "./sections/DashboardLayout";
import { useEffect, useState } from "react";
import { getMyPetProfiles, deletePetProfile } from "../../../api/petProfile.api";
import { PetProfileResponse } from "../../../types/petProfile.type";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const DEFAULT_AVATAR_DOG = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60";
const DEFAULT_AVATAR_CAT = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60";

// ListGroup Components
const ListGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden">
        {children}
    </div>
);

interface ListGroupItemProps {
    children: React.ReactNode;
    border?: boolean;
}

const ListGroupItem = ({ children, border = false }: ListGroupItemProps) => (
    <div className={`px-[1rem] py-[0.8rem] ${border ? "border-b border-slate-50" : ""}`}>
        {children}
    </div>
);

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
    const type = pet.petType === "DOG" ? "Chó" : pet.petType === "CAT" ? "Mèo" : "Khác";
    const breed = pet.breed?.trim() || "";
    return breed ? `${breed}` : type;
}

export const PetsPage = () => {
    const navigate = useNavigate();
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Hồ sơ thú cưng", to: "/dashboard/pets" },
    ];

    const [pets, setPets] = useState<PetProfileResponse[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="max-w-[50rem]">
                {/* HEADER */}
                <div className="flex items-center justify-between gap-4 mb-[2rem]">
                    <h1 className="text-[1.5rem] font-bold text-slate-800">Các bé của tôi</h1>
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/pets/create")}
                        className="inline-flex items-center gap-[0.5rem] px-[1.25rem] py-[0.7rem] bg-client-primary text-white rounded-[0.85rem] font-semibold text-[0.9rem] hover:bg-client-secondary hover:shadow-lg hover:shadow-client-primary/30 transition-all duration-200 shadow-sm shadow-client-primary/20 active:scale-95"
                    >
                        <Plus size={16} />
                        Đăng ký bé
                    </button>
                </div>

                {/* LOADING STATE */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="h-[7rem] rounded-[1.25rem] bg-slate-100 animate-pulse border border-slate-200" />
                        ))}
                    </div>
                ) : pets.length === 0 ? (
                    <ListGroup>
                        <ListGroupItem>
                            <div className="flex flex-col items-center justify-center gap-4 py-12">
                                <PawPrint size={48} className="text-slate-300" />
                                <p className="text-slate-500 font-medium text-center">Bạn chưa đăng ký thú cưng nào</p>
                            </div>
                        </ListGroupItem>
                    </ListGroup>
                ) : (
                    <div className="space-y-[1.5rem]">
                        {pets.map((pet) => (
                            <ListGroup key={pet.id}>
                                <ListGroupItem>
                                    <div className="flex gap-4">
                                        {/* Pet Avatar */}
                                        <div className="shrink-0">
                                            <img
                                                src={getAvatar(pet)}
                                                alt={pet.name}
                                                className="w-[5rem] h-[5rem] rounded-xl object-cover shadow-sm"
                                            />
                                        </div>

                                        {/* Pet Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            {/* Name & Breed */}
                                            <div>
                                                <h3 className="text-[1.125rem] font-bold text-slate-800 truncate">
                                                    {pet.name}
                                                </h3>
                                                <p className="text-[0.75rem] font-bold text-client-primary uppercase tracking-wider mt-0.5">
                                                    {formatBreed(pet)}
                                                </p>
                                            </div>

                                            {/* Age & Weight */}
                                            <div className="flex gap-6 pt-2">
                                                <div>
                                                    <p className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider">Tuổi</p>
                                                    <p className="text-[0.9rem] font-medium text-slate-800 mt-0.5">{formatAge(pet.birthDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[0.75rem] font-bold uppercase text-slate-500 tracking-wider">Cân nặng</p>
                                                    <p className="text-[0.9rem] font-medium text-slate-800 mt-0.5">{pet.weight != null ? `${pet.weight}kg` : "—"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Edit Button */}
                                        <div className="shrink-0 flex flex-col items-end justify-between">
                                            <Link
                                                to={`/dashboard/pets/edit/${pet.id}`}
                                                className="inline-flex items-center gap-[0.4rem] px-[0.75rem] py-[0.6rem] bg-white text-slate-700 border border-slate-200 rounded-[0.75rem] font-semibold text-[0.85rem] hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-200 active:scale-95"
                                            >
                                                <Edit2 size={14} />
                                                Sửa
                                            </Link>
                                        </div>
                                    </div>
                                </ListGroupItem>
                            </ListGroup>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                {!loading && pets.length > 0 && (
                    <div className="mt-[2rem] flex items-start gap-3 px-[1rem] py-[1rem] bg-slate-50 rounded-[1rem] border border-slate-100">
                        <PawPrint size={16} className="text-client-primary mt-0.5 shrink-0" />
                        <p className="text-[0.85rem] font-medium text-slate-600">
                            Thông tin thú cưng giúp TeddyPet hiểu rõ hơn về các bé để cung cấp dịch vụ phù hợp nhất.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
