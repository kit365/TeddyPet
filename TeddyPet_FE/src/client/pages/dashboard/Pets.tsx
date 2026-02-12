import { Plus, Settings, PawPrint } from "lucide-react";
import { DashboardLayout } from "./sections/DashboardLayout";

export const PetsPage = () => {
    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/dashboard/profile" },
        { label: "Hồ sơ thú cưng", to: "/dashboard/pets" },
    ];

    const pets = [
        {
            id: 1,
            name: "Misa",
            breed: "POODLE - DOG",
            age: "2 tuổi",
            weight: "4.5kg",
            image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60",
        },
        {
            id: 2,
            name: "Lu",
            breed: "BRITISH SHORTHAIR - CAT",
            age: "1 tuổi",
            weight: "3.2kg",
            image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60",
        }
    ];

    return (
        <DashboardLayout pageTitle="Hồ sơ thú cưng" breadcrumbs={breadcrumbs}>
            <div className="space-y-12">
                {/* Header Section */}
                <div className="flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <PawPrint size={24} />
                        </div>
                        <h2 className="text-[2rem] font-black text-slate-800 tracking-tight">Các bé của tôi</h2>
                    </div>
                    <button className="flex items-center gap-3 bg-indigo-600/90 text-white px-8 py-4 rounded-[1.2rem] font-black text-[1.2rem] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-indigo-100">
                        <Plus size={18} /> Đăng ký bé mới
                    </button>
                </div>

                {/* Pets Grid */}
                <div className="grid grid-cols-2 gap-8">
                    {pets.map((pet) => (
                        <div key={pet.id} className="bg-white border border-slate-100 rounded-[3rem] p-10 flex gap-8 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all group relative ring-1 ring-slate-50">
                            {/* Pet Image */}
                            <img
                                src={pet.image}
                                alt={pet.name}
                                className="w-44 h-44 rounded-[2.5rem] object-cover group-hover:scale-105 transition-transform duration-500 shadow-sm"
                            />

                            {/* Pet Info */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start pt-2">
                                    <div>
                                        <h3 className="text-[2.4rem] font-black text-slate-800 tracking-tighter mb-1 line-height-none">{pet.name}</h3>
                                        <p className="text-[1rem] font-black text-indigo-500 uppercase tracking-[0.1em]">
                                            {pet.breed}
                                        </p>
                                    </div>
                                    <button className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                        <Settings size={20} />
                                    </button>
                                </div>

                                <div className="mt-6 flex gap-12">
                                    <div className="flex flex-col items-center">
                                        <p className="text-[0.9rem] font-black text-slate-300 uppercase tracking-widest">Tuổi</p>
                                        <p className="text-[1.8rem] font-bold text-slate-800 mt-1">{pet.age}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-[0.9rem] font-black text-slate-300 uppercase tracking-widest">Cân nặng</p>
                                        <p className="text-[1.8rem] font-bold text-slate-800 mt-1">{pet.weight}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tips section */}
                <div className="flex items-center gap-6 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                        <PawPrint size={18} />
                    </div>
                    <p className="text-[1.3rem] font-bold text-slate-400">TeddyPet luôn đồng hành cùng sức khỏe thú cưng của bạn.</p>
                </div>
            </div>
        </DashboardLayout>
    );
};
