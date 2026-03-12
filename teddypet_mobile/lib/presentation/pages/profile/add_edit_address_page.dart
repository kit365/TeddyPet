import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/application/common/vietnam_location_service.dart';
import 'package:teddypet_mobile/core/theme/app_colors.dart';
import 'package:teddypet_mobile/data/models/request/user/user_address_request.dart';
import 'package:teddypet_mobile/data/models/response/user/user_address_response.dart';
import 'package:teddypet_mobile/presentation/common/widgets/custom_text_field.dart';
import 'package:teddypet_mobile/presentation/common/widgets/primary_button.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_address_provider.dart';

class AddEditAddressPage extends StatefulWidget {
  final UserAddressResponse? address;

  const AddEditAddressPage({super.key, this.address});

  @override
  State<AddEditAddressPage> createState() => _AddEditAddressPageState();
}

class _AddEditAddressPageState extends State<AddEditAddressPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _fullNameController;
  late TextEditingController _phoneController;
  late TextEditingController _streetController;
  bool _isDefault = false;

  final _locationService = VietnamLocationService();
  List<VietnamLocationResponse> _provinces = [];
  List<VietnamLocationResponse> _districts = [];
  List<VietnamLocationResponse> _wards = [];

  VietnamLocationResponse? _selectedProvince;
  VietnamLocationResponse? _selectedDistrict;
  VietnamLocationResponse? _selectedWard;

  bool _loadingLocations = false;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController(
      text: widget.address?.fullName ?? '',
    );
    _phoneController = TextEditingController(text: widget.address?.phone ?? '');
    _streetController = TextEditingController();
    _isDefault = widget.address?.isDefault ?? false;

    _initAddressData();
  }

  Future<void> _initAddressData() async {
    // 1. Load danh sách tỉnh trước
    await _loadProvinces();

    // 2. Nếu là Edit, parse chuỗi địa chỉ từ DB
    if (widget.address != null && widget.address!.address.isNotEmpty) {
      try {
        final parts = widget.address!.address
            .split(',')
            .map((e) => e.trim())
            .toList();

        // Quy tắc: [Số nhà], [Xã/Phường], [Quận/Huyện], [Tỉnh/TP]
        // Chúng ta sẽ lấy từ cuối lên
        if (parts.length >= 3) {
          final provinceName = parts.last;
          final districtName = parts[parts.length - 2];
          final wardName = parts[parts.length - 3];

          // Lấy phần còn lại làm số nhà/tên đường
          final streetParts = parts.sublist(0, parts.length - 3);
          _streetController.text = streetParts.join(', ');

          // Bắt đầu mapping Province -> District -> Ward
          final matchedProvince = _provinces.firstWhere(
            (p) => p.name.toLowerCase() == provinceName.toLowerCase(),
            orElse: () => _provinces.first, // Fallback nếu không khớp chính xác
          );

          setState(() => _selectedProvince = matchedProvince);
          await _loadDistricts(matchedProvince.code);

          final matchedDistrict = _districts.firstWhere(
            (d) => d.name.toLowerCase() == districtName.toLowerCase(),
            orElse: () => _districts.first,
          );

          setState(() => _selectedDistrict = matchedDistrict);
          await _loadWards(matchedDistrict.code);

          final matchedWard = _wards.firstWhere(
            (w) => w.name.toLowerCase() == wardName.toLowerCase(),
            orElse: () => _wards.first,
          );

          setState(() => _selectedWard = matchedWard);
        } else {
          // Nếu địa chỉ cũ nhập linh tinh (không đủ 3 dấu phẩy), ném hết vào ô street
          _streetController.text = widget.address!.address;
        }
      } catch (e) {
        debugPrint("Error parsing address: $e");
        _streetController.text = widget.address!.address;
      }
    }
  }

  Future<void> _loadProvinces() async {
    setState(() => _loadingLocations = true);
    try {
      _provinces = await _locationService.getProvinces();
    } catch (e) {
      debugPrint('Error loading provinces: $e');
    } finally {
      setState(() => _loadingLocations = false);
    }
  }

  Future<void> _loadDistricts(int code) async {
    setState(() {
      _loadingLocations = true;
      _districts = [];
      _wards = [];
      _selectedDistrict = null;
      _selectedWard = null;
    });
    try {
      _districts = await _locationService.getDistricts(code);
    } catch (e) {
      debugPrint('Error loading districts: $e');
    } finally {
      setState(() => _loadingLocations = false);
    }
  }

  Future<void> _loadWards(int code) async {
    setState(() {
      _loadingLocations = true;
      _wards = [];
      _selectedWard = null;
    });
    try {
      _wards = await _locationService.getWards(code);
    } catch (e) {
      debugPrint('Error loading wards: $e');
    } finally {
      setState(() => _loadingLocations = false);
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedProvince == null ||
        _selectedDistrict == null ||
        _selectedWard == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn đầy đủ Tỉnh/Huyện/Xã'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Gộp địa chỉ thành 1 string để lưu vào db như cũ
    final fullAddress =
        "${_streetController.text.trim()}, ${_selectedWard!.name}, ${_selectedDistrict!.name}, ${_selectedProvince!.name}";

    final request = UserAddressRequest(
      fullName: _fullNameController.text.trim(),
      phone: _phoneController.text.trim(),
      address: fullAddress,
      isDefault: _isDefault,
    );

    final provider = context.read<UserAddressProvider>();
    bool success;

    if (widget.address == null) {
      success = await provider.create(request);
    } else {
      success = await provider.update(widget.address!.id, request);
    }

    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.address == null
                ? 'Thêm địa chỉ thành công!'
                : 'Cập nhật địa chỉ thành công!',
          ),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.address != null;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          isEditing ? 'Cập nhật địa chỉ' : 'Địa chỉ mới',
          style: const TextStyle(
            color: Color(0xFF2C3E50),
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Color(0xFF2C3E50),
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Thông tin liên hệ'),
                  const SizedBox(height: 15),
                  CustomTextField(
                    controller: _fullNameController,
                    label: 'Họ và tên',
                    placeholder: 'Nhập họ và tên người nhận',
                    prefixIcon: Icons.person_outline,
                    validator: (value) => (value == null || value.isEmpty)
                        ? 'Vui lòng nhập họ tên'
                        : null,
                  ),
                  const SizedBox(height: 15),
                  CustomTextField(
                    controller: _phoneController,
                    label: 'Số điện thoại',
                    placeholder: 'Nhập số điện thoại nhận hàng',
                    prefixIcon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    validator: (value) => (value == null || value.isEmpty)
                        ? 'Vui lòng nhập số điện thoại'
                        : null,
                  ),
                  const SizedBox(height: 30),
                  _buildSectionTitle('Địa chỉ nhận hàng'),
                  const SizedBox(height: 15),

                  // Tỉnh / Thành phố
                  _buildLocationSelector(
                    label: 'Tỉnh / Thành phố',
                    value: _selectedProvince?.name,
                    hint: 'Chọn Tỉnh / Thành phố',
                    onTap: () => _showLocationSearchBottomSheet(
                      title: 'Chọn Tỉnh / Thành phố',
                      items: _provinces,
                      onSelected: (val) {
                        setState(() => _selectedProvince = val);
                        if (val != null) _loadDistricts(val.code);
                      },
                    ),
                  ),
                  const SizedBox(height: 15),

                  // Quận / Huyện
                  _buildLocationSelector(
                    label: 'Quận / Huyện',
                    value: _selectedDistrict?.name,
                    hint: _selectedProvince == null
                        ? 'Vui lòng chọn Tỉnh trước'
                        : 'Chọn Quận / Huyện',
                    onTap: _selectedProvince == null
                        ? null
                        : () => _showLocationSearchBottomSheet(
                            title: 'Chọn Quận / Huyện',
                            items: _districts,
                            onSelected: (val) {
                              setState(() => _selectedDistrict = val);
                              if (val != null) _loadWards(val.code);
                            },
                          ),
                  ),
                  const SizedBox(height: 15),

                  // Phường / Xã
                  _buildLocationSelector(
                    label: 'Phường / Xã',
                    value: _selectedWard?.name,
                    hint: _selectedDistrict == null
                        ? 'Vui lòng chọn Huyện trước'
                        : 'Chọn Phường / Xã',
                    onTap: _selectedDistrict == null
                        ? null
                        : () => _showLocationSearchBottomSheet(
                            title: 'Chọn Phường / Xã',
                            items: _wards,
                            onSelected: (val) =>
                                setState(() => _selectedWard = val),
                          ),
                  ),
                  const SizedBox(height: 15),

                  CustomTextField(
                    controller: _streetController,
                    label: 'Số nhà, tên đường',
                    placeholder: 'Ví dụ: 123 Đường ABC...',
                    prefixIcon: Icons.home_outlined,
                    validator: (value) => (value == null || value.isEmpty)
                        ? 'Vui lòng nhập số nhà/tên đường'
                        : null,
                  ),
                  const SizedBox(height: 30),
                  SwitchListTile(
                    title: const Text('Đặt làm địa chỉ mặc định'),
                    value: _isDefault,
                    onChanged: (val) => setState(() => _isDefault = val),
                    activeColor: AppColors.primary,
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 50),
                  Consumer<UserAddressProvider>(
                    builder: (context, provider, child) {
                      return PrimaryButton(
                        text: isEditing ? 'CẬP NHẬT' : 'THÊM MỚI',
                        onPressed: _handleSave,
                        isLoading: provider.isLoading,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          if (_loadingLocations)
            Container(
              color: Colors.black.withValues(alpha: 0.1),
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: Colors.grey,
      ),
    );
  }

  Widget _buildLocationSelector({
    required String label,
    required String? value,
    required String hint,
    required VoidCallback? onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: onTap == null ? Colors.grey[50] : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDDD0D0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    value ?? hint,
                    style: TextStyle(
                      color: value == null
                          ? Colors.grey[400]
                          : const Color(0xFF2C3E50),
                      fontSize: 16,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(
                  Icons.keyboard_arrow_down,
                  color: onTap == null ? Colors.grey[300] : Colors.grey[600],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showLocationSearchBottomSheet({
    required String title,
    required List<VietnamLocationResponse> items,
    required ValueChanged<VietnamLocationResponse> onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _LocationPickerBottomSheet(
          title: title,
          items: items,
          onSelected: onSelected,
        );
      },
    );
  }
}

class _LocationPickerBottomSheet extends StatefulWidget {
  final String title;
  final List<VietnamLocationResponse> items;
  final ValueChanged<VietnamLocationResponse> onSelected;

  const _LocationPickerBottomSheet({
    required this.title,
    required this.items,
    required this.onSelected,
  });

  @override
  State<_LocationPickerBottomSheet> createState() =>
      _LocationPickerBottomSheetState();
}

class _LocationPickerBottomSheetState
    extends State<_LocationPickerBottomSheet> {
  late List<VietnamLocationResponse> _filteredItems;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _filteredItems = widget.items;
  }

  void _filter(String query) {
    setState(() {
      _filteredItems = widget.items
          .where(
            (item) => item.name.toLowerCase().contains(query.toLowerCase()),
          )
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              widget.title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C3E50),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextField(
              controller: _searchController,
              onChanged: _filter,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Tìm kiếm nhanh...',
                prefixIcon: const Icon(
                  Icons.search,
                  color: AppColors.secondary,
                ),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: _filteredItems.isEmpty
                ? Center(
                    child: Text(
                      'Không tìm thấy kết quả nào!',
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                  )
                : ListView.builder(
                    itemCount: _filteredItems.length,
                    itemBuilder: (context, index) {
                      final item = _filteredItems[index];
                      return ListTile(
                        title: Text(item.name),
                        onTap: () {
                          widget.onSelected(item);
                          Navigator.pop(context);
                        },
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 25,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
