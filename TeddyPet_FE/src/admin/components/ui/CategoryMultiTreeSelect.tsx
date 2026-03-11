import {
    Box,
    Checkbox,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
} from "@mui/material";
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useMemo, useCallback } from "react";

export interface CategoryNode {
    categoryId: number | null;
    name: string;
    children: CategoryNode[];
}

interface FlatCategory {
    id: number;
    name: string;
    level: number;
    parentId: number | null;
    allDescendantIds: number[]; // All children, grandchildren, etc.
}

interface Props {
    categories: CategoryNode[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
}

export const CategoryMultiTreeSelect = ({
    categories,
    selectedIds,
    onChange,
    disabled = false,
}: Props) => {

    // Flatten all categories and build parent-child relationships
    const flatCategories = useMemo(() => {
        let autoId = 1;
        const result: FlatCategory[] = [];
        const idMap = new Map<CategoryNode, number>(); // Map node to its assigned ID

        // First pass: assign IDs to all nodes
        const assignIds = (nodes: CategoryNode[]) => {
            nodes.forEach((node) => {
                const id = node.categoryId ?? autoId++;
                idMap.set(node, id);
                if (node.children?.length) {
                    assignIds(node.children);
                }
            });
        };
        assignIds(categories);

        // Helper to get all descendant IDs recursively
        const getAllDescendantIds = (node: CategoryNode): number[] => {
            const ids: number[] = [];
            if (node.children?.length) {
                node.children.forEach((child) => {
                    const childId = idMap.get(child)!;
                    ids.push(childId);
                    ids.push(...getAllDescendantIds(child));
                });
            }
            return ids;
        };

        // Second pass: build flat list with all info
        const flatten = (nodes: CategoryNode[], level: number, parentId: number | null) => {
            nodes.forEach((node) => {
                const id = idMap.get(node)!;
                const allDescendantIds = getAllDescendantIds(node);

                result.push({
                    id,
                    name: node.name,
                    level,
                    parentId,
                    allDescendantIds
                });

                if (node.children?.length) {
                    flatten(node.children, level + 1, id);
                }
            });
        };

        flatten(categories, 0, null);
        return result;
    }, [categories]);

    // Get all ancestor IDs of a category
    const getAllAncestorIds = useCallback((categoryId: number): number[] => {
        const result: number[] = [];
        let current = flatCategories.find(c => c.id === categoryId);
        while (current && current.parentId !== null) {
            result.push(current.parentId);
            current = flatCategories.find(c => c.id === current!.parentId);
        }
        return result;
    }, [flatCategories]);

    // Check if all direct children of a category are selected
    const areAllDirectChildrenSelected = useCallback((categoryId: number, currentSelected: number[]): boolean => {
        const cat = flatCategories.find(c => c.id === categoryId);
        if (!cat) return false;

        // Get direct children (categories whose parentId is this categoryId)
        const directChildIds = flatCategories
            .filter(c => c.parentId === categoryId)
            .map(c => c.id);

        if (directChildIds.length === 0) return false;
        return directChildIds.every(childId => currentSelected.includes(childId));
    }, [flatCategories]);

    // Handle item click
    const handleItemClick = (categoryId: number) => {
        let newSelected = [...selectedIds];
        const isCurrentlySelected = newSelected.includes(categoryId);
        const cat = flatCategories.find(c => c.id === categoryId);

        if (!cat) return;

        if (isCurrentlySelected) {
            // DESELECT: remove this item and ALL its descendants
            const idsToRemove = new Set([categoryId, ...cat.allDescendantIds]);
            newSelected = newSelected.filter(id => !idsToRemove.has(id));

            // Also deselect all ancestors (since their children are no longer all selected)
            const ancestorIds = getAllAncestorIds(categoryId);
            newSelected = newSelected.filter(id => !ancestorIds.includes(id));
        } else {
            // SELECT: add this item and ALL its descendants
            const idsToAdd = [categoryId, ...cat.allDescendantIds];
            idsToAdd.forEach(id => {
                if (!newSelected.includes(id)) {
                    newSelected.push(id);
                }
            });

            // Check ancestors: if all their children are now selected, select parent too
            const checkAndSelectAncestors = (catId: number) => {
                const category = flatCategories.find(c => c.id === catId);
                if (category && category.parentId !== null) {
                    if (areAllDirectChildrenSelected(category.parentId, newSelected)) {
                        if (!newSelected.includes(category.parentId)) {
                            newSelected.push(category.parentId);
                        }
                        // Recursively check grandparent
                        checkAndSelectAncestors(category.parentId);
                    }
                }
            };
            checkAndSelectAncestors(categoryId);
        }

        onChange(newSelected);
    };

    const selectedCount = selectedIds.length;

    return (
        <FormControl fullWidth>
            <InputLabel shrink>Danh mục sản phẩm</InputLabel>
            <Select
                multiple
                displayEmpty
                value={selectedIds}
                onChange={() => { }} // Handled by MenuItem onClick
                input={<OutlinedInput label="Danh mục sản phẩm" notched />}
                disabled={disabled}
                renderValue={() => {
                    if (selectedCount === 0) {
                        return <Box sx={{ color: "#919EAB" }}>Chọn danh mục...</Box>;
                    }
                    return <Box sx={{ color: "#1C252E" }}>{selectedCount} danh mục đã chọn</Box>;
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            maxHeight: 350,
                            '& .Mui-selected': {
                                backgroundColor: '#00A76F14 !important',
                            },
                        }
                    }
                }}
            >
                {flatCategories.map((cat, index) => {
                    const isSelected = selectedIds.includes(cat.id);
                    return (
                        <MenuItem
                            key={`menu-${cat.id}-${index}`}
                            value={cat.id}
                            onClick={(e) => {
                                e.preventDefault();
                                handleItemClick(cat.id);
                            }}
                            sx={{
                                pl: 2 + cat.level * 3,
                                py: '8px',
                                fontSize: '1.4rem',
                                fontWeight: cat.level === 0 ? 600 : 400,
                                gap: '8px'
                            }}
                        >
                            <Checkbox
                                checked={isSelected}
                                size="small"
                                sx={{
                                    p: 0,
                                    color: '#919EAB',
                                    '&.Mui-checked': { color: '#00A76F' }
                                }}
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                {cat.level > 0 && (
                                    <SubdirectoryArrowRightIcon
                                        sx={{ fontSize: '1.6rem', color: '#919EAB', mr: 1, opacity: 0.5 }}
                                    />
                                )}
                                {cat.level === 0 ? (
                                    <FolderIcon sx={{ fontSize: '1.8rem', mr: 1, color: '#FFAB00' }} />
                                ) : (
                                    <FolderOpenIcon sx={{ fontSize: '1.8rem', mr: 1, color: '#919EAB' }} />
                                )}
                                <ListItemText
                                    primary={cat.name}
                                    slotProps={{
                                        primary: {
                                            sx: {
                                                fontSize: '1.4rem',
                                                fontWeight: 'inherit',
                                                color: cat.level === 0 ? "#1C252E" : "#637381"
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    );
};
