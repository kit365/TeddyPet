import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/theme/app_colors.dart';
import 'package:teddypet_mobile/presentation/providers/auth/auth_provider.dart';
import 'package:teddypet_mobile/presentation/common/widgets/custom_text_field.dart';
import 'package:teddypet_mobile/presentation/common/widgets/primary_button.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_provider.dart';
import 'package:teddypet_mobile/data/models/request/user/update_profile_request.dart';
import 'package:teddypet_mobile/core/utils/date_picker_utils.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();

  String? _gender;
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _phoneNumberController;
  DateTime? _selectedDate;
  DateTime? _joinDate;
  String? _avatarUrl;

  @override
  void initState() {
    super.initState();
    final profile = context.read<UserProvider>().userProfile;

    _firstNameController = TextEditingController(text: profile?.firstName ?? '');
    _lastNameController = TextEditingController(text: profile?.lastName ?? '');
    _phoneNumberController = TextEditingController(text: profile?.phoneNumber ?? '');
    _gender = profile?.gender ?? 'MALE';
    _avatarUrl = profile?.avatarUrl ?? '';

    if (profile?.dateOfBirth != null) {
      _selectedDate = DateTime.tryParse(profile!.dateOfBirth!);
    }
    if (profile?.createdAt != null) {
      _joinDate = DateTime.tryParse(profile!.createdAt!);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneNumberController.dispose();
    super.dispose();
  }

  Widget _buildGenderOption(String label, String value) {
    bool isSelected = _gender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _gender = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.secondary.withOpacity(0.1) : Colors.white,
            border: Border.all(
              color: isSelected ? AppColors.secondary : const Color(0xFFDDD0D0),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.secondary : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleSave() async {
    if (_formKey.currentState!.validate()) {
      final request = UpdateProfileRequest(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        phoneNumber: _phoneNumberController.text.trim(),
        gender: _gender,
        dateOfBirth: _selectedDate?.toIso8601String().split('T')[0],
      );

      final success = await context.read<UserProvider>().updateProfile(request);
      if (success && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cập nhật thành công!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Chỉnh sửa thông tin',
          style: TextStyle(color: Color(0xFF2C3E50), fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFF2C3E50), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 55,
                        backgroundColor: AppColors.secondary.withOpacity(0.1),
                        child: _avatarUrl != null && _avatarUrl!.isNotEmpty
                            ? ClipOval(
                                child: Image.network(
                                  _avatarUrl!,
                                  width: 110,
                                  height: 110,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      const Icon(Icons.person, size: 60, color: AppColors.secondary),
                                ),
                              )
                            : const Icon(Icons.person, size: 60, color: AppColors.secondary),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: AppColors.secondary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),
                CustomTextField(
                  controller: _lastNameController,
                  label: 'Họ',
                  placeholder: 'Nhập họ của bạn',
                ),
                const SizedBox(height: 20),
                CustomTextField(
                  controller: _firstNameController,
                  label: 'Tên',
                  placeholder: 'Nhập tên của bạn',
                ),
                const SizedBox(height: 20),
                CustomTextField(
                  controller: _phoneNumberController,
                  label: 'Số điện thoại',
                  placeholder: 'Nhập số điện thoại',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 25),
                const Text(
                  'Giới tính',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.secondary),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildGenderOption('Nam', 'MALE'),
                    const SizedBox(width: 10),
                    _buildGenderOption('Nữ', 'FEMALE'),
                    const SizedBox(width: 10),
                    _buildGenderOption('Khác', 'OTHER'),
                  ],
                ),
                const SizedBox(height: 25),
                const Text(
                  'Ngày sinh',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.secondary),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () async {
                    final picked = await DatePickerUtils.selectDate(context, initialDate: _selectedDate);
                    if (picked != null) setState(() => _selectedDate = picked);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFDDD0D0)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedDate == null
                              ? 'Chọn ngày sinh'
                              : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                          style: const TextStyle(fontSize: 16),
                        ),
                        const Icon(Icons.calendar_month, color: AppColors.secondary),
                      ],
                    ),
                  ),
                ),
                if (_joinDate != null) ...[
                  const SizedBox(height: 30),
                  Center(
                    child: Text(
                      'Thành viên gia nhập từ: ${_joinDate!.day}/${_joinDate!.month}/${_joinDate!.year}',
                      style: TextStyle(color: Colors.grey[600], fontStyle: FontStyle.italic),
                    ),
                  ),
                ],
                const SizedBox(height: 40),
                PrimaryButton(text: 'LƯU THÔNG TIN', onPressed: _handleSave),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
