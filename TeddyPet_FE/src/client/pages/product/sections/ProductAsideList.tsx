import PetsIcon from "@mui/icons-material/Pets";
import { memo } from "react";

interface CategoryItem {
    name: string;
    count: number;
    slug: string; // Changed from 'to' to 'slug' to match ProductAside
}

interface ProductAsideListProps {
    categories: CategoryItem[];
    selectedSlugs?: string[];
    onSelect?: (slug: string) => void;
}

export const ProductAsideList = memo(({ categories, selectedSlugs = [], onSelect }: ProductAsideListProps) => {
    return (
        <div className="flex flex-wrap gap-[10px] mt-[15px] p-[20px] bg-[#fff0f066] rounded-[20px]">
            {categories.map((cat) => {
                const isSelected = selectedSlugs.includes(cat.slug);
                return (
                    <button
                        key={cat.slug}
                        onClick={(e) => {
                            if (onSelect) {
                                e.preventDefault();
                                onSelect(cat.slug);
                            }
                        }}
                        className={`transition-default flex items-center gap-[6px] py-[8px] px-[16px] text-[1.4rem] border rounded-[35px] ${isSelected
                            ? "bg-client-primary text-white border-client-primary"
                            : "bg-white text-client-secondary border-[#10293726] hover:bg-client-primary hover:text-white"
                            }`}
                    >
                        <PetsIcon sx={{ fontSize: "1.4rem" }} className="flex-shrink-0" />
                        <span className="leading-none">{cat.name}</span>
                        <span className={`text-[1.1rem] opacity-60`}>
                            ({cat.count})
                        </span>
                    </button>
                );
            })}
        </div>
    );
});
