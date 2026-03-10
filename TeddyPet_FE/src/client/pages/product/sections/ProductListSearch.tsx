import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useProductSort } from '../../../hooks/useProductSort';
import { useMemo } from 'react';

type OptionType = {
    value: string;
    label: string;
    sortKey?: string;
    sortDirection?: string;
};

const options: OptionType[] = [
    { value: 'default', label: 'Sắp xếp mặc định', sortKey: 'id', sortDirection: 'desc' },
    { value: 'popular', label: 'Theo độ phổ biến', sortKey: 'viewCount', sortDirection: 'desc' },
    { value: 'newest', label: 'Sản phẩm mới nhất', sortKey: 'createdAt', sortDirection: 'desc' },
    { value: 'price_asc', label: 'Giá: thấp đến cao', sortKey: 'minPrice', sortDirection: 'asc' },
    { value: 'price_desc', label: 'Giá: cao đến thấp', sortKey: 'minPrice', sortDirection: 'desc' },
];

interface ProductListSearchProps {
    totalElements?: number;
    page: number;
    size: number;
    onSortChange: (key: string, direction: string) => void;
}

export const ProductListSearch = ({ totalElements = 0, page, size, onSortChange }: ProductListSearchProps) => {
    const {
        selectedOption,
        hoveredOption,
        setHoveredOption,
        menuOpen,
        selectRef,
        filteredOptions,
        handleSelectChange,
        toggleMenu,
    } = useProductSort(options);

    // Handle sort change wrapper
    const onOptionSelect = (item: OptionType) => {
        handleSelectChange(item);
        if (item.sortKey && item.sortDirection) {
            onSortChange(item.sortKey, item.sortDirection);
        }
    };

    const start = page * size + 1;
    const end = Math.min((page + 1) * size, totalElements);

    return (
        <div className="px-[30px] py-[15px] mb-[40px] flex items-center justify-between bg-[#e67e201a] rounded-[192px]">
            <div className="text-client-secondary text-[1.4rem] font-medium">
                Showing {totalElements > 0 ? `${start}–${end} of ${totalElements}` : '0'} results
            </div>
            <div className="flex items-center">
                <div
                    className="text-client-secondary text-[1.4rem] font-medium relative cursor-pointer px-[20px] h-[50px] bg-white border border-[#1029371a] flex items-center rounded-[40px] transition-default hover:border-client-primary shadow-sm hover:shadow-md"
                    onClick={() => {
                        toggleMenu();
                    }}
                    ref={selectRef}
                >
                    {selectedOption?.label}
                    <ArrowDropDownIcon style={{
                        width: "2.2rem",
                        height: "2.2rem",
                        cursor: "pointer",
                        marginLeft: "10px",
                        transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                    }} />
                    {menuOpen && (
                        <div className="absolute z-20 bg-white left-0 top-[115%] w-full rounded-[15px] p-[10px] border border-[#1029371a] shadow-2xl overflow-hidden animate-fadeIn">
                            <ul className="max-h-[250px] overflow-auto custom-scrollbar">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((item) => (
                                        <li
                                            key={item.value}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOptionSelect(item);
                                            }}
                                            onMouseEnter={() => setHoveredOption(item.value)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            className={`px-[15px] py-[10px] rounded-[10px] transition-all cursor-pointer text-[1.4rem] font-medium mb-[2px] last:mb-0
                                                ${item.value === selectedOption.value
                                                    ? hoveredOption === item.value
                                                        ? "bg-client-primary/10 text-client-primary"
                                                        : "bg-client-primary text-white shadow-md active:scale-[0.98]"
                                                    : hoveredOption === item.value
                                                        ? "bg-client-primary/10 text-client-primary"
                                                        : "text-client-secondary hover:bg-slate-50"
                                                }`}
                                        >
                                            {item.label}
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-[10px] py-[12px] text-gray-400 text-center text-[1.3rem]">
                                        Không có kết quả
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};