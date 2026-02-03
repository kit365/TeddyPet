import { Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Select, MenuItem } from "@mui/material";
import { useProductAttributes } from "../../product-attribute/hooks/useProductAttribute";
import { useState, useMemo, useEffect } from "react";
import { CollapsibleCard } from "../../../components/ui/CollapsibleCard";
import { DeleteIcon } from "../../../assets/icons";

import { ProductVariant as Variant } from "../../../../types/products.type";

export const ProductVariants = ({
    expanded,
    onToggle,
    variants,
    onVariantsChange,
    availableImages = []
}: {
    expanded: boolean,
    onToggle: () => void,
    variants: Variant[],
    onVariantsChange: (variants: Variant[]) => void,
    availableImages?: any[]
}) => {
    const { data: attributes = [] as any[] } = useProductAttributes();

    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, Set<string>>>({});

    const [openAttributeDialog, setOpenAttributeDialog] = useState(false);
    const [currentAttribute, setCurrentAttribute] = useState<any | null>(null);
    const [tempSelectedValues, setTempSelectedValues] = useState<Set<string>>(new Set());

    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const [previewVariants, setPreviewVariants] = useState<Variant[]>([]);

    const handleOpenAttribute = (attribute: any) => {
        setCurrentAttribute(attribute);
        const attrId = String(attribute.attributeId || attribute.id);
        setTempSelectedValues(new Set(selectedAttributes[attrId] || []));
        setOpenAttributeDialog(true);
    };

    const handleToggleTempValue = (value: string) => {
        const newSet = new Set(tempSelectedValues);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            newSet.add(value);
        }
        setTempSelectedValues(newSet);
    };

    const handleToggleAllTemp = () => {
        if (!currentAttribute) return;
        if (tempSelectedValues.size === currentAttribute.values.length) {
            setTempSelectedValues(new Set());
        } else {
            setTempSelectedValues(new Set(currentAttribute.values.map((v: any) => v.value)));
        }
    };

    const handleSaveSelection = () => {
        if (!currentAttribute) return;
        const attrId = String(currentAttribute.attributeId || currentAttribute.id);

        setSelectedAttributes(prev => {
            const next = { ...prev };
            if (tempSelectedValues.size === 0) {
                delete next[attrId];
            } else {
                next[attrId] = tempSelectedValues;
            }
            return next;
        });
        setOpenAttributeDialog(false);
    };

    const handleRemoveAttribute = (attrId: string) => {
        setSelectedAttributes(prev => {
            const next = { ...prev };
            delete next[attrId];
            return next;
        });
    };

    const validAttributes = useMemo(() => attributes.filter((attr: any) => attr.values && attr.values.length > 0), [attributes]);

    // Reset selectedAttributes khi variants được clear từ parent
    useEffect(() => {
        if (variants.length === 0) {
            setSelectedAttributes({});
        }
    }, [variants]);

    const handlePreviewVariants = () => {
        const activeAttributeIds = Object.keys(selectedAttributes);

        if (activeAttributeIds.length === 0) {
            setPreviewVariants([]);
            return;
        }

        const attributeGroups = activeAttributeIds.map(attrId => {
            const attr = attributes.find((a: any) => String(a.attributeId || a.id) === attrId);
            const selectedValues = Array.from(selectedAttributes[attrId]);
            return selectedValues.map(val => {
                const valueObj = attr.values.find((v: any) => v.value === val);
                return {
                    attributeId: attr.id || attr.attributeId,
                    name: attr.name,
                    value: val,
                    id: valueObj?.id || valueObj?.attributeValueId
                };
            });
        });

        // Cartesian product function
        const cartesian = (arrays: any[][]) => {
            return arrays.reduce((acc, curr) => {
                return acc.flatMap(a => curr.map(c => [...a, c]));
            }, [[]] as any[][]);
        };

        const combinations = cartesian(attributeGroups);

        // 1. Identify all attribute values currently existing in the variants list
        const existingAttributeValues = new Set<string>();
        variants.forEach(v => {
            v.attributes.forEach(a => {
                existingAttributeValues.add(`${a.name}:${a.value}`);
            });
        });

        const hasExistingVariants = variants.length > 0;

        const newVariants: Variant[] = combinations.map((combo, index) => {
            // Check if this combination already exists in current variants to preserve data
            const existing = variants.find(v =>
                v.attributes.length === combo.length &&
                v.attributes.every(va => combo.some(c => c.name === va.name && c.value === va.value))
            );

            if (existing) {
                return { ...existing, active: true }; // Mark as active/selected for preview
            }

            // Smart "Active" Logic
            let isActive = true;
            if (hasExistingVariants) {
                // If we have existing variants, and this combo is NEW (not existing),
                // we check if it looks like a "deleted" item (i.e., its parts are known).
                const allPartsKnown = combo.every(c => existingAttributeValues.has(`${c.name}:${c.value}`));
                if (allPartsKnown) {
                    // It's a combination of known values that is NOT in the list -> Likely deleted by user
                    isActive = false;
                }
                // Else: Contains partially new values -> New addition -> Active
            }

            return {
                id: `preview-${Date.now()}-${index}`,
                attributes: combo,
                sku: "",
                originalPrice: 0,
                price: 0,
                stock: 0,
                status: "ACTIVE",
                active: isActive,
            };
        });

        setPreviewVariants(newVariants);
        setOpenPreviewDialog(true);
    };

    const handleConfirmVariants = () => {
        // Only take active variants from preview
        const selectedVariants = previewVariants.filter(v => v.active).map(v => {
            const isPreviewId = v.id.startsWith('preview-');
            return {
                ...v,
                id: isPreviewId ? `variant-${Date.now()}-${Math.random()}` : v.id
            };
        });

        onVariantsChange(selectedVariants);
        setOpenPreviewDialog(false);
    };

    const handleRemoveVariant = (index: number) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        onVariantsChange(newVariants);
    };

    return (
        <CollapsibleCard
            title="Biến thể sản phẩm"
            subheader="Tạo các biến thể từ thuộc tính (Màu sắc, kích cỡ...)"
            expanded={expanded}
            onToggle={onToggle}
        >
            <Stack spacing={3} p="24px">
                {/* 1. Attribute List & Selection */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.6rem', fontWeight: 600, color: '#637381' }}>
                        Chọn thuộc tính
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {validAttributes.map((attr: any) => {
                            const attrId = String(attr.attributeId || attr.id);
                            const isSelected = !!selectedAttributes[attrId];
                            const selectedCount = selectedAttributes[attrId]?.size || 0;

                            return (
                                <Card
                                    key={attrId}
                                    variant="outlined"
                                    sx={{
                                        minWidth: 200,
                                        cursor: 'pointer',
                                        bgcolor: isSelected ? 'rgba(0, 184, 217, 0.08)' : 'transparent',
                                        borderColor: isSelected ? '#00a764' : 'divider',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: '#00a764',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        },
                                        position: 'relative'
                                    }}
                                    onClick={() => handleOpenAttribute(attr)}
                                >
                                    <CardContent sx={{ p: '16px !important' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', color: isSelected ? '#00a764' : '#1C2524' }}>
                                                {attr.name}
                                            </Typography>
                                            {isSelected && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveAttribute(attrId);
                                                    }}
                                                    sx={{
                                                        color: '#FF5630',
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8
                                                    }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: '1.6rem', marginRight: "0px" }} />
                                                </IconButton>
                                            )}
                                        </Box>

                                        <Typography variant="body2" sx={{ fontSize: '1.3rem', color: 'text.secondary', mt: 1 }}>
                                            {isSelected ? `Đã chọn ${selectedCount} giá trị` : 'Chưa chọn giá trị nào'}
                                        </Typography>

                                        {isSelected && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                                                {Array.from(selectedAttributes[attrId]).slice(0, 3).map(val => (
                                                    <Chip
                                                        key={val}
                                                        label={val}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            fontSize: '1.2rem',
                                                            bgcolor: '#fff',
                                                            border: '1px solid #919eab33'
                                                        }}
                                                    />
                                                ))}
                                                {selectedAttributes[attrId].size > 3 && (
                                                    <Chip
                                                        label={`+${selectedAttributes[attrId].size - 3}`}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            fontSize: '1.2rem',
                                                            bgcolor: '#fff',
                                                            border: '1px solid #919eab33'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>

                {/* 2. Action */}
                <Box sx={{ ml: "auto !important" }}>
                    <Button
                        variant="contained"
                        color="inherit"
                        onClick={handlePreviewVariants}
                        disabled={Object.keys(selectedAttributes).length === 0}
                        sx={{
                            fontSize: '1.4rem',
                            textTransform: 'none',
                            bgcolor: '#1C252E',
                            color: '#fff',
                            py: 1.2,
                            px: 3,
                            borderRadius: '8px',
                            '&:hover': { bgcolor: '#454F5B' },
                        }}
                    >
                        Cập nhật danh sách biến thể
                    </Button>
                </Box>

                {/* 3. Variants Table */}
                {variants.length > 0 && (
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" sx={{ fontSize: '1.6rem', fontWeight: 600 }}>
                                Danh sách biến thể ({variants.length})
                            </Typography>
                            <Button
                                color="error"
                                onClick={() => onVariantsChange([])}
                                sx={{ fontSize: '1.4rem', textTransform: 'none' }}
                            >
                                Xóa tất cả
                            </Button>
                        </Stack>

                        <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', maxHeight: '500px' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f4f6f8' }}>
                                        {/* Dynamic Attribute Headers */}
                                        {Object.keys(selectedAttributes).map(attrId => {
                                            const attr = attributes.find((a: any) => String(a.attributeId || a.id) === attrId);
                                            return (
                                                <TableCell key={attrId} sx={{ minWidth: 100, fontSize: '1.4rem', fontWeight: 600 }}>
                                                    {attr?.name || 'Thuộc tính'}
                                                </TableCell>
                                            );
                                        })}

                                        <TableCell width={80} sx={{ fontSize: '1.4rem', fontWeight: 600 }}>Ảnh</TableCell>
                                        <TableCell width={120} sx={{ fontSize: '1.4rem', fontWeight: 600 }}>Trạng thái</TableCell>
                                        <TableCell width={150} sx={{ fontSize: '1.4rem', fontWeight: 600 }}>Giá cũ</TableCell>
                                        <TableCell width={150} sx={{ fontSize: '1.4rem', fontWeight: 600 }}>Giá mới</TableCell>
                                        <TableCell width={120} sx={{ fontSize: '1.4rem', fontWeight: 600 }}>Tồn kho</TableCell>
                                        <TableCell width={50} align="center"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {variants.map((variant, index) => (
                                        <TableRow key={variant.id} hover>

                                            {/* Dynamic Attribute Values */}
                                            {Object.keys(selectedAttributes).map(attrId => {
                                                const attr = attributes.find((a: any) => String(a.attributeId || a.id) === attrId);
                                                const variantAttr = variant.attributes.find(a => a.name === attr?.name);

                                                return (
                                                    <TableCell key={attrId}>
                                                        <Typography variant="body2" sx={{ fontSize: '1.4rem', color: '#1C252E' }}>
                                                            {variantAttr?.value}
                                                        </Typography>
                                                    </TableCell>
                                                );
                                            })}

                                            <TableCell>
                                                <Select
                                                    size="small"
                                                    value={variant.featuredImage || ''}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].featuredImage = e.target.value;
                                                        onVariantsChange(newVariants);
                                                    }}
                                                    displayEmpty
                                                    renderValue={(selected) => {
                                                        if (!selected) return <Box sx={{ width: 44, height: 44, bgcolor: '#f4f6f8', borderRadius: '8px', border: '1px dashed #919eab52' }} />;
                                                        return <Box component="img" src={String(selected)} sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '8px', border: '1px solid #919eab29' }} />;
                                                    }}
                                                    sx={{
                                                        minWidth: 80,
                                                        '& .MuiSelect-select': { padding: '8px !important', display: 'flex', justifyContent: 'center' },
                                                        '& fieldset': { borderColor: 'transparent !important' },
                                                        '&:hover fieldset': { borderColor: '#919eab52 !important' }
                                                    }}
                                                >
                                                    <MenuItem value=""><em>None</em></MenuItem>
                                                    {availableImages.map((img: any, i: number) => {
                                                        const imgSrc = typeof img === 'string' ? img : img.preview;
                                                        return (
                                                            <MenuItem key={i} value={imgSrc}>
                                                                <Box component="img" src={imgSrc} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px', mr: 1 }} />
                                                                Ảnh {i + 1}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small"
                                                    value={variant.status || "ACTIVE"}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].status = e.target.value as any;
                                                        onVariantsChange(newVariants);
                                                    }}
                                                    sx={{
                                                        minWidth: 100, fontSize: '1.3rem',
                                                        color: variant.status === "ACTIVE" ? '#00A76F' : (variant.status === "DRAFT" ? '#637381' : '#FF5630'),
                                                        bgcolor: variant.status === "ACTIVE" ? 'rgba(0, 167, 111, 0.08)' : (variant.status === "DRAFT" ? 'rgba(99, 115, 129, 0.08)' : 'rgba(255, 86, 48, 0.08)'),
                                                        fontWeight: 600,
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                                                    }}
                                                >
                                                    <MenuItem value="ACTIVE" sx={{ color: '#00A76F', fontWeight: 600 }}>Active</MenuItem>
                                                    <MenuItem value="DRAFT" sx={{ color: '#637381', fontWeight: 600 }}>Draft</MenuItem>
                                                    <MenuItem value="HIDDEN" sx={{ color: '#FF5630', fontWeight: 600 }}>Hidden</MenuItem>
                                                </Select>
                                            </TableCell>

                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    placeholder="0"
                                                    value={variant.originalPrice}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].originalPrice = Number(e.target.value);
                                                        // Auto-update Sale Price to match if 0 to show it's default
                                                        if (Number(e.target.value) === 0) {
                                                            newVariants[index].price = 0;
                                                        }
                                                        onVariantsChange(newVariants);
                                                    }}
                                                    fullWidth
                                                    helperText={variant.originalPrice === 0 ? "Nhập 0 = Không sale" : ""}
                                                    InputProps={{ sx: { fontSize: '1.4rem' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    placeholder="0"
                                                    value={variant.price}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].price = Number(e.target.value);
                                                        onVariantsChange(newVariants);
                                                    }}
                                                    fullWidth
                                                    InputProps={{ sx: { fontSize: '1.4rem' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    placeholder="0"
                                                    value={variant.stock}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].stock = Number(e.target.value);
                                                        onVariantsChange(newVariants);
                                                    }}
                                                    fullWidth
                                                    InputProps={{ sx: { fontSize: '1.4rem' } }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={() => handleRemoveVariant(index)}
                                                    sx={{ color: '#FF5630' }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: '2rem' }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Stack>

            {/* Attribute Selection Dialog */}
            <Dialog
                open={openAttributeDialog}
                onClose={() => setOpenAttributeDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '12px' }
                }}
            >
                <DialogTitle sx={{ fontSize: '2rem', fontWeight: 700, pb: 1 }}>
                    Chọn {currentAttribute?.name}
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 400, mt: 0.5, fontSize: '1.4rem' }}>
                        Vui lòng chọn các giá trị bạn muốn tạo biến thể
                    </Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 2 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={!!currentAttribute && tempSelectedValues.size === currentAttribute.values.length && currentAttribute.values.length > 0}
                                    indeterminate={!!currentAttribute && tempSelectedValues.size > 0 && tempSelectedValues.size < currentAttribute.values.length}
                                    onChange={handleToggleAllTemp}
                                />
                            }
                            label={<Typography sx={{ fontSize: '1.5rem', fontWeight: 600 }}>Tất cả</Typography>}
                        />
                        <Typography sx={{ fontSize: '1.4rem', color: 'text.secondary' }}>
                            {tempSelectedValues.size} đã chọn
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                        {currentAttribute?.values.map((val: any) => (
                            <Box key={val.value}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={tempSelectedValues.has(val.value)}
                                            onChange={() => handleToggleTempValue(val.value)}
                                        />
                                    }
                                    label={<Typography sx={{ fontSize: '1.5rem' }}>{val.value}</Typography>}
                                    sx={{ width: '100%', mr: 0 }}
                                />
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setOpenAttributeDialog(false)}
                        sx={{ fontSize: '1.4rem', color: 'text.secondary', fontWeight: 600 }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSaveSelection}
                        variant="contained"
                        sx={{ fontSize: '1.4rem', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: '#1C252E', '&:hover': { bgcolor: '#454F5B' } }}
                    >
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Variant Preview Dialog */}
            <Dialog
                open={openPreviewDialog}
                onClose={() => setOpenPreviewDialog(false)}
                maxWidth="md"
                fullWidth
                scroll="body"
                slotProps={{
                    paper: {
                        sx: { borderRadius: '12px', minWidth: '700px', overflow: 'hidden' },
                    }
                }}
            >
                <DialogTitle sx={{ fontSize: '2rem', fontWeight: 700, pb: 1 }}>
                    Xác nhận danh sách biến thể
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 400, mt: 0.5, fontSize: '1.4rem' }}>
                        Bỏ chọn những biến thể bạn không muốn tạo
                    </Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 0, px: 0 }}>
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell width={60} align="center">
                                        <Checkbox
                                            size="medium"
                                            checked={previewVariants.length > 0 && previewVariants.every(v => v.active)}
                                            indeterminate={previewVariants.some(v => v.active) && !previewVariants.every(v => v.active)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setPreviewVariants(prev => prev.map(v => ({ ...v, active: checked })));
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '1.5rem', fontWeight: 600 }}>Biến thể</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {previewVariants.map((variant, index) => (
                                    <TableRow key={variant.id} hover onClick={() => {
                                        const newVariants = [...previewVariants];
                                        newVariants[index].active = !newVariants[index].active;
                                        setPreviewVariants(newVariants);
                                    }} sx={{ cursor: 'pointer' }}>
                                        <TableCell align="center">
                                            <Checkbox checked={variant.active} size="medium" />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {variant.attributes.map((attr, i) => (
                                                    <Chip key={i} label={`${attr.name}: ${attr.value}`} size="small" sx={{ fontSize: '1.3rem' }} />
                                                ))}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '1.4rem', color: 'text.secondary', ml: 1 }}>
                        Đã chọn: {previewVariants.filter(v => v.active).length} / {previewVariants.length}
                    </Typography>
                    <Box>
                        <Button
                            onClick={() => setOpenPreviewDialog(false)}
                            sx={{ fontSize: '1.4rem', color: 'text.secondary', fontWeight: 600, mr: 1 }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirmVariants}
                            variant="contained"
                            disabled={previewVariants.filter(v => v.active).length === 0}
                            sx={{ fontSize: '1.4rem', fontWeight: 600, px: 3, borderRadius: '8px', bgcolor: '#1C252E', '&:hover': { bgcolor: '#454F5B' } }}
                        >
                            Tạo biến thể
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </CollapsibleCard>
    );
};
