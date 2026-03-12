import { Toolbar, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { SelectMulti } from "../../../components/ui/SelectMulti";
import { Search } from "../../../components/ui/Search";
import { STATUS_OPTIONS } from "../configs/constants";
import { toolbarStyles } from "../configs/styles.config";

import { useProductCategoryFilter } from "../context/ProductCategoryFilterContext";

export const ProductCategoryToolbar = () => {
    const filterCtx = useProductCategoryFilter();

    return (
        <Toolbar style={toolbarStyles.root}>
            <div className="flex flex-wrap items-center gap-[16px] w-full min-w-0">
                <SelectMulti label="Trạng thái" options={STATUS_OPTIONS} />
                {filterCtx && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="product-category-parent-filter-label" shrink>
                            Danh mục cha
                        </InputLabel>
                        <Select
                            labelId="product-category-parent-filter-label"
                            value={filterCtx.parentFilter === "all" ? "all" : String(filterCtx.parentFilter)}
                            label="Danh mục cha"
                            onChange={(e) => {
                                const v = e.target.value;
                                filterCtx.setParentFilter(v === "all" ? "all" : Number(v));
                            }}
                            sx={{ fontSize: "0.875rem", borderRadius: "8px" }}
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            {filterCtx.parentOptions.map(({ id, label }) => (
                                <MenuItem key={id} value={String(id)}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <div className="flex flex-1 items-center gap-[16px] min-w-0">
                    <div className="flex-1 min-w-0">
                        <Search maxWidth="100%" />
                    </div>

                </div>
            </div>
        </Toolbar>
    );
};
