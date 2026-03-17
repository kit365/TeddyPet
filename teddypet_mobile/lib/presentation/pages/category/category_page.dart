import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/category/category_provider.dart';
import '../../providers/product/product_list_provider.dart';
import '../../providers/common/filter_provider.dart';
import '../home/widgets/main_header.dart';
import '../product/product_detail_page.dart';

class CategoryPage extends StatefulWidget {
  const CategoryPage({super.key});

  @override
  State<CategoryPage> createState() => _CategoryPageState();
}

class _CategoryPageState extends State<CategoryPage> {
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
  String? _selectedSubCategoryId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final categoryProvider = context.read<CategoryProvider>();
      final filterProvider = context.read<FilterProvider>();
      
      await Future.wait([
        categoryProvider.fetchCategories(),
        filterProvider.fetchFilterOptions(),
      ]);
      
      if (categoryProvider.categories.isNotEmpty) {
        final firstCategoryId = int.tryParse(categoryProvider.categories[0].id);
        if (mounted) {
          context.read<ProductListProvider>().fetchByCategoryId(firstCategoryId);
        }
      }
    });
  }

  void _onParentCategorySelect(int index, String id) {
    setState(() => _selectedSubCategoryId = null);
    context.read<CategoryProvider>().selectCategory(index);
    final categoryId = int.tryParse(id);
    context.read<ProductListProvider>().resetFilters();
    context.read<ProductListProvider>().fetchByCategoryId(categoryId);
  }

  void _onSubCategorySelect(String? id) {
    setState(() => _selectedSubCategoryId = id);
    final categoryId = int.tryParse(id ?? context.read<CategoryProvider>().categories[context.read<CategoryProvider>().selectedIndex].id);
    context.read<ProductListProvider>().fetchByCategoryId(categoryId);
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _FilterBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainHeader(),
      body: Consumer2<CategoryProvider, ProductListProvider>(
        builder: (context, catProvider, prodProvider, child) {
          if (catProvider.isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          if (catProvider.categories.isEmpty) {
            return const Center(child: Text("Không có danh mục nào"));
          }

          final selectedCat = catProvider.categories[catProvider.selectedIndex];
          final subCategories = selectedCat.items ?? [];

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cột bên trái: Danh sách các Category (Sidebar)
              Container(
                width: 90,
                decoration: BoxDecoration(
                  color: const Color(0xFFF7F8FA),
                  border: Border(
                    right: BorderSide(color: Colors.grey.withOpacity(0.15), width: 0.5),
                  ),
                ),
                child: ListView.builder(
                  padding: EdgeInsets.zero,
                  itemCount: catProvider.categories.length,
                  itemBuilder: (context, index) {
                    final category = catProvider.categories[index];
                    final isSelected = index == catProvider.selectedIndex;

                    return GestureDetector(
                      onTap: () => _onParentCategorySelect(index, category.id),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        height: 80,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.white : Colors.transparent,
                        ),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 3.5,
                              height: isSelected ? 30 : 0,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: const BorderRadius.horizontal(right: Radius.circular(4)),
                              ),
                            ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: isSelected ? AppColors.primary.withOpacity(0.1) : Colors.transparent,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        isSelected ? Icons.pets : Icons.pets_outlined,
                                        size: 18,
                                        color: isSelected ? AppColors.primary : Colors.grey[400],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      category.name,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                        color: isSelected ? AppColors.primary : Colors.black54,
                                        height: 1.2,
                                      ),
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              // Cột bên phải: Header, Chips và Sản phẩm
              Expanded(
                child: Column(
                  children: [
                    // Header của cột phải
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border(bottom: BorderSide(color: Colors.grey.withOpacity(0.1))),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              selectedCat.name.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.secondary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: _showFilterBottomSheet,
                            child: Row(
                              children: [
                                Text(
                                  "Bộ lọc",
                                  style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.filter_list_rounded, size: 18, color: Colors.grey[600]),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Sub-category Chips
                    if (subCategories.isNotEmpty)
                      Container(
                        height: 45,
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          scrollDirection: Axis.horizontal,
                          itemCount: subCategories.length + 1,
                          itemBuilder: (context, index) {
                            final isAll = index == 0;
                            final subCat = isAll ? null : subCategories[index - 1];
                            final subCatId = subCat?.id;
                            final isSelected = isAll ? _selectedSubCategoryId == null : _selectedSubCategoryId == subCatId;

                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(isAll ? "Tất cả" : subCat!.name),
                                selected: isSelected,
                                showCheckmark: false,
                                onSelected: (_) => _onSubCategorySelect(subCatId),
                                selectedColor: AppColors.primary.withOpacity(0.15),
                                backgroundColor: Colors.grey[100],
                                labelStyle: TextStyle(
                                  fontSize: 11,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  color: isSelected ? AppColors.primary : Colors.black87,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                  side: BorderSide(color: isSelected ? AppColors.primary.withOpacity(0.3) : Colors.transparent),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                pressElevation: 0,
                                visualDensity: VisualDensity.compact,
                              ),
                            );
                          },
                        ),
                      ),
                    
                    Expanded(
                      child: prodProvider.isLoading
                          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                          : prodProvider.products.isEmpty
                              ? const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey),
                                      SizedBox(height: 12),
                                      Text("Chưa có sản phẩm nào", style: TextStyle(color: Colors.grey)),
                                    ],
                                  ),
                                )
                              : GridView.builder(
                                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    crossAxisSpacing: 10,
                                    mainAxisSpacing: 12,
                                    childAspectRatio: 0.7,
                                  ),
                                  itemCount: prodProvider.products.length,
                                  itemBuilder: (context, index) {
                                    final product = prodProvider.products[index];
                                    return _ProductCard(product: product, currencyFormat: _currencyFormat);
                                  },
                                ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final dynamic product;
  final NumberFormat currencyFormat;

  const _ProductCard({required this.product, required this.currencyFormat});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailPage(slug: product.slug),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.withOpacity(0.1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                child: product.firstImage != null
                    ? Image.network(
                        product.firstImage!,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildPlaceholder(),
                      )
                    : _buildPlaceholder(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    currencyFormat.format(product.minPrice),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.pets, size: 28, color: AppColors.primary.withOpacity(0.2)),
            const SizedBox(height: 4),
            Text(
              'TeddyPet',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: AppColors.primary.withOpacity(0.2),
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterBottomSheet extends StatefulWidget {
  const _FilterBottomSheet();

  @override
  State<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<_FilterBottomSheet> {
  int? _tempBrandId;
  final List<String> _tempPetTypes = [];
  String? _tempSortKey;
  String? _tempSortDirection;

  @override
  void initState() {
    super.initState();
    final provider = context.read<ProductListProvider>();
    _tempBrandId = provider.selectedBrandId;
    _tempPetTypes.addAll(provider.selectedPetTypes);
    _tempSortKey = provider.sortKey;
    _tempSortDirection = provider.sortDirection;
  }

  @override
  Widget build(BuildContext context) {
    final filterOptions = context.watch<FilterProvider>();
    
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Bộ lọc sản phẩm",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.secondary),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Sắp xếp
          const _FilterTitle(title: "Sắp xếp theo"),
          Wrap(
            spacing: 10,
            children: [
              _FilterChip(
                label: "Mới nhất",
                isSelected: _tempSortKey == 'createdAt',
                onSelected: (val) => setState(() {
                  _tempSortKey = val ? 'createdAt' : null;
                  _tempSortDirection = val ? 'DESC' : null;
                }),
              ),
              _FilterChip(
                label: "Giá thấp đến cao",
                isSelected: _tempSortKey == 'minPrice' && _tempSortDirection == 'ASC',
                onSelected: (val) => setState(() {
                  _tempSortKey = val ? 'minPrice' : null;
                  _tempSortDirection = val ? 'ASC' : null;
                }),
              ),
              _FilterChip(
                label: "Giá cao đến thấp",
                isSelected: _tempSortKey == 'minPrice' && _tempSortDirection == 'DESC',
                onSelected: (val) => setState(() {
                  _tempSortKey = val ? 'minPrice' : null;
                  _tempSortDirection = val ? 'DESC' : null;
                }),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Loại thú cưng
          const _FilterTitle(title: "Loại thú cưng"),
          Wrap(
            spacing: 10,
            children: filterOptions.petTypes.map((type) {
              final label = type == 'DOG' ? 'Chó' : type == 'CAT' ? 'Mèo' : 'Khác';
              return _FilterChip(
                label: label,
                isSelected: _tempPetTypes.contains(type),
                onSelected: (val) {
                  setState(() {
                    if (val) {
                      _tempPetTypes.add(type);
                    } else {
                      _tempPetTypes.remove(type);
                    }
                  });
                },
              );
            }).toList(),
          ),
          
          const SizedBox(height: 20),
          
          // Thương hiệu
          const _FilterTitle(title: "Thương hiệu"),
          if (filterOptions.isLoading)
            const Center(child: LinearProgressIndicator())
          else
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: filterOptions.brands.length,
                itemBuilder: (context, index) {
                  final brand = filterOptions.brands[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: _FilterChip(
                      label: brand.name,
                      isSelected: _tempBrandId == brand.id,
                      onSelected: (val) => setState(() => _tempBrandId = val ? brand.id : null),
                    ),
                  );
                },
              ),
            ),
          
          const SizedBox(height: 30),
          
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _tempBrandId = null;
                      _tempPetTypes.clear();
                      _tempSortKey = null;
                      _tempSortDirection = null;
                    });
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppColors.primary),
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Thiết lập lại", style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    context.read<ProductListProvider>().updateFilters(
                      brandId: _tempBrandId,
                      petTypes: _tempPetTypes,
                      sortKey: _tempSortKey,
                      sortDirection: _tempSortDirection,
                    );
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Áp dụng"),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FilterTitle extends StatelessWidget {
  final String title;
  const _FilterTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final ValueChanged<bool> onSelected;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: onSelected,
      showCheckmark: false,
      selectedColor: AppColors.primary.withOpacity(0.15),
      checkmarkColor: AppColors.primary,
      backgroundColor: Colors.grey[100],
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? AppColors.primary : Colors.black87,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent),
      ),
    );
  }
}
