import { Link } from "react-router-dom";
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
        <ul className="py-[10px]">
            {categories.map((cat) => {
                const isSelected = selectedSlugs.includes(cat.slug);
                return (
                    <li
                        key={cat.slug}
                        className="mb-[10px] flex items-center relative group cursor-pointer"
                        onClick={(e) => {
                            if (onSelect) {
                                e.preventDefault();
                                onSelect(cat.slug);
                            }
                        }}
                    >
                        <div
                            className={`w-full px-[30px] py-[15px] pr-[60px] rounded-[40px] 
                            flex items-center transition-default 
                            ${isSelected
                                    ? "bg-client-primary text-white"
                                    : "bg-[#fff0f066] text-client-secondary hover:bg-client-secondary hover:text-white"
                                }`}
                        >
                            <PetsIcon sx={{ fontSize: "2rem", marginRight: "10px" }} />
                            {cat.name}
                        </div>
                        <span className={`absolute right-[30px] top-[50%] translate-y-[-50%] transition-default ${isSelected ? 'text-white' : 'text-client-text group-hover:text-white'}`}>
                            ({cat.count})
                        </span>
                    </li>
                );
            })}
        </ul>
    );
});
