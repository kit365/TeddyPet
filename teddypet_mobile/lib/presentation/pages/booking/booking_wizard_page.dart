import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../providers/booking/booking_provider.dart';
import '../../providers/service/service_provider.dart';
import '../../providers/user/user_provider.dart';
import '../../../data/models/request/booking/create_booking_request.dart';
import '../../../data/models/response/service/service_response.dart';
import '../../../data/models/response/service/time_slot_response.dart';

class BookingWizardPage extends StatefulWidget {
  const BookingWizardPage({super.key});

  @override
  State<BookingWizardPage> createState() => _BookingWizardPageState();
}

class _BookingWizardPageState extends State<BookingWizardPage> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();
  
  // Form controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _petNameController = TextEditingController();
  
  int? _selectedCategoryId;
  int? _selectedServiceId;
  DateTime? _selectedDate; // This is checkInDate for room services
  DateTime? _selectedCheckOutDate;
  int? _selectedTimeSlotId;
  String _selectedPetType = 'DOG';
  List<TimeSlotResponse> _timeSlots = [];
  bool _isLoadingSlots = false;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userProfile = context.read<UserProvider>().userProfile;
      if (userProfile != null) {
        _nameController.text = '${userProfile.firstName} ${userProfile.lastName}';
        _emailController.text = userProfile.email;
        _phoneController.text = userProfile.phoneNumber ?? '';
      }
      
      context.read<BookingProvider>().startNewBooking();
      context.read<ServiceProvider>().fetchCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đặt lịch dịch vụ'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        onStepContinue: _onStepContinue,
        onStepCancel: _onStepCancel,
        steps: [
          _buildCustomerStep(),
          _buildPetServiceStep(),
          _buildScheduleStep(),
          _buildReviewStep(),
        ],
        controlsBuilder: (context, details) {
          return Padding(
            padding: const EdgeInsets.only(top: 32),
            child: Row(
              children: [
                if (_currentStep > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: details.onStepCancel,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                        side: const BorderSide(color: Colors.grey),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Quay lại', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                if (_currentStep > 0) const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: details.onStepContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(
                      _currentStep == 3 ? 'Xác nhận đặt lịch' : 'Tiếp tục',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Step _buildCustomerStep() {
    return Step(
      title: const Text('Thông tin'),
      isActive: _currentStep >= 0,
      content: Form(
        key: _formKey,
        child: Column(
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Họ tên *',
                prefixIcon: Icon(Icons.person_outline),
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
              validator: (v) => v?.isEmpty ?? true ? 'Vui lòng nhập họ tên' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email *',
                prefixIcon: Icon(Icons.email_outlined),
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
              validator: (v) => v?.isEmpty ?? true ? 'Vui lòng nhập email' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Số điện thoại *',
                prefixIcon: Icon(Icons.phone_outlined),
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
              validator: (v) => v?.isEmpty ?? true ? 'Vui lòng nhập số điện thoại' : null,
            ),
          ],
        ),
      ),
    );
  }

  Step _buildPetServiceStep() {
    final svcProvider = context.watch<ServiceProvider>();
    return Step(
      title: const Text('Dịch vụ'),
      isActive: _currentStep >= 1,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Thông tin thú cưng', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextFormField(
            controller: _petNameController,
            decoration: const InputDecoration(
              hintText: 'Tên thú cưng (ví dụ: Lu)',
              prefixIcon: Icon(Icons.pets),
              border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Loại thú cưng *', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildPetTypeChip('DOG', 'Chó'),
              _buildPetTypeChip('CAT', 'Mèo'),
              _buildPetTypeChip('OTHER', 'Khác'),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Chọn danh mục dịch vụ', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (svcProvider.isLoading && svcProvider.categories.isEmpty)
            const Center(child: CircularProgressIndicator())
          else
            Wrap(
              spacing: 8,
              children: svcProvider.categories.map((cat) {
                final isSelected = _selectedCategoryId == cat.categoryId;
                return ChoiceChip(
                  label: Text(cat.categoryName),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (selected) {
                    setState(() {
                      _selectedCategoryId = selected ? cat.categoryId : null;
                      _selectedServiceId = null;
                    });
                    if (selected) {
                      svcProvider.fetchServicesByCategoryId(cat.categoryId);
                    }
                  },
                );
              }).toList(),
            ),
          if (_selectedCategoryId != null) ...[
            const SizedBox(height: 24),
            Text('Chọn dịch vụ trong ${svcProvider.categories.firstWhere((c) => c.categoryId == _selectedCategoryId).categoryName}', 
              style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (svcProvider.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (svcProvider.services.isEmpty)
              const Text('Không có dịch vụ nào trong danh mục này')
            else
              Wrap(
                spacing: 8,
                children: svcProvider.services.map((svc) {
                  final isSelected = _selectedServiceId == svc.serviceId;
                  return ChoiceChip(
                    label: Text(svc.serviceName),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (selected) {
                      setState(() {
                        _selectedServiceId = selected ? svc.serviceId : null;
                      });
                    },
                  );
                }).toList(),
              ),
          ],
        ],
      ),
    );
  }

  Step _buildScheduleStep() {
    final svcProvider = context.watch<ServiceProvider>();
    final category = _selectedCategoryId != null 
        ? svcProvider.categories.where((c) => c.categoryId == _selectedCategoryId).firstOrNull
        : null;
    final isPerDay = category?.pricingModel == 'per_day';

    return Step(
      title: const Text('Lịch hẹn'),
      isActive: _currentStep >= 2,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isPerDay ? 'Chọn ngày nhận và trả' : 'Chọn ngày hẹn', 
            style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (isPerDay)
            OutlinedButton.icon(
              onPressed: _selectDateRange,
              icon: const Icon(Icons.date_range),
              label: Text(_selectedDate == null || _selectedCheckOutDate == null
                ? 'Chọn khoảng ngày' 
                : '${DateFormat('dd/MM').format(_selectedDate!)} - ${DateFormat('dd/MM').format(_selectedCheckOutDate!)}'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            )
          else
            OutlinedButton.icon(
              onPressed: _selectDate,
              icon: const Icon(Icons.calendar_today),
              label: Text(_selectedDate == null 
                ? 'Chọn ngày' 
                : DateFormat('dd/MM/yyyy').format(_selectedDate!)),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          if (!isPerDay && _selectedDate != null) ...[
            const SizedBox(height: 24),
            const Text('Chọn khung giờ', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (_isLoadingSlots)
              const Center(child: CircularProgressIndicator())
            else if (_timeSlots.isEmpty)
              const Text('Không có khung giờ nào trống')
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 2.5,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: _timeSlots.length,
                itemBuilder: (context, index) {
                  final slot = _timeSlots[index];
                  final isSelected = _selectedTimeSlotId == slot.id;
                  return ChoiceChip(
                    label: Text('${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}'),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onSelected: (selected) {
                      setState(() => _selectedTimeSlotId = selected ? slot.id : null);
                    },
                  );
                },
              ),
          ],
        ],
      ),
    );
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      initialDateRange: _selectedDate != null && _selectedCheckOutDate != null
          ? DateTimeRange(start: _selectedDate!, end: _selectedCheckOutDate!)
          : null,
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked.start;
        _selectedCheckOutDate = picked.end;
      });
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _selectedTimeSlotId = null;
        _timeSlots = [];
      });
      _fetchTimeSlots(picked);
    }
  }

  Future<void> _fetchTimeSlots(DateTime date) async {
    if (_selectedServiceId == null) return;
    setState(() => _isLoadingSlots = true);
    try {
      final slots = await context.read<ServiceProvider>().getTimeSlotsByServiceId(_selectedServiceId!);
      setState(() => _timeSlots = slots);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải khung giờ: $e')),
      );
    } finally {
      setState(() => _isLoadingSlots = false);
    }
  }

  Step _buildReviewStep() {
    final svcProvider = context.watch<ServiceProvider>();
    final selectedService = _selectedServiceId != null 
        ? svcProvider.services.firstWhere((s) => s.serviceId == _selectedServiceId)
        : null;
    final category = _selectedCategoryId != null 
        ? svcProvider.categories.where((c) => c.categoryId == _selectedCategoryId).firstOrNull
        : null;
    final isPerDay = category?.pricingModel == 'per_day';

    return Step(
      title: const Text('Xác nhận'),
      isActive: _currentStep >= 3,
      content: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildReviewRow('Khách hàng', _nameController.text),
            _buildReviewRow('Số điện thoại', _phoneController.text),
            _buildReviewRow('Thú cưng', '${_petNameController.text} (${_selectedPetType == 'DOG' ? 'Chó' : _selectedPetType == 'CAT' ? 'Mèo' : 'Khác'})'),
            const Divider(),
            _buildReviewRow('Dịch vụ', selectedService?.serviceName ?? ''),
            if (isPerDay && _selectedDate != null && _selectedCheckOutDate != null)
              _buildReviewRow(
                'Ngày hẹn', 
                '${DateFormat('dd/MM/yyyy').format(_selectedDate!)} - ${DateFormat('dd/MM/yyyy').format(_selectedCheckOutDate!)}'
              )
            else if (_selectedDate != null)
              _buildReviewRow('Ngày hẹn', DateFormat('dd/MM/yyyy').format(_selectedDate!)),
            
            if (!isPerDay && _selectedTimeSlotId != null && _timeSlots.any((t) => t.id == _selectedTimeSlotId))
              _buildReviewRow(
                'Khung giờ', 
                _timeSlots.firstWhere((t) => t.id == _selectedTimeSlotId).startTime.substring(0, 5)
              ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Tổng cộng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(
                  NumberFormat.currency(locale: 'vi_VN', symbol: '₫').format(selectedService?.basePrice ?? 0),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPetTypeChip(String type, String label) {
    final isSelected = _selectedPetType == type;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textPrimary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedPetType = type);
        }
      },
    );
  }

  Widget _buildReviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  void _onStepContinue() {
    if (_currentStep == 0) {
      if (_formKey.currentState!.validate()) {
        setState(() => _currentStep++);
      }
    } else if (_currentStep == 1) {
      if (_petNameController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng nhập tên thú cưng')),
        );
        return;
      }
      if (_selectedServiceId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn dịch vụ')),
        );
        return;
      }
      setState(() => _currentStep++);
    } else if (_currentStep == 2) {
      final svcProvider = context.read<ServiceProvider>();
      final category = _selectedCategoryId != null 
          ? svcProvider.categories.firstWhere((c) => c.categoryId == _selectedCategoryId)
          : null;
      final isPerDay = category?.pricingModel == 'per_day';

      if (_selectedDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn ngày')),
        );
        return;
      }
      if (isPerDay) {
        if (_selectedCheckOutDate == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Vui lòng chọn ngày trả')),
          );
          return;
        }
      } else {
        if (_selectedTimeSlotId == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Vui lòng chọn khung giờ')),
          );
          return;
        }
      }
      setState(() => _currentStep++);
    } else if (_currentStep < 3) {
      setState(() => _currentStep++);
    } else {
      _submitBooking();
    }
  }

  void _onStepCancel() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  void _submitBooking() async {
    final bookingProvider = context.read<BookingProvider>();
    final svcProvider = context.read<ServiceProvider>();
    
    if (_selectedServiceId == null) return;
    
    final selectedService = svcProvider.services.firstWhere((s) => s.serviceId == _selectedServiceId);
    final category = svcProvider.categories.firstWhere((c) => c.categoryId == _selectedCategoryId);
    final isPerDay = category.pricingModel == 'per_day';

    final request = CreateBookingRequest(
      customerName: _nameController.text,
      customerEmail: _emailController.text,
      customerPhone: _phoneController.text,
      bookingType: 'ONLINE',
      pets: [
        CreateBookingPetRequest(
          petName: _petNameController.text,
          petType: _selectedPetType,
          services: [
            CreateBookingPetServiceRequest(
              serviceId: _selectedServiceId!,
              requiresRoom: selectedService.isRequiredRoom ?? false,
              checkInDate: isPerDay ? _selectedDate!.toIso8601String().substring(0, 10) : null,
              checkOutDate: isPerDay ? _selectedCheckOutDate!.toIso8601String().substring(0, 10) : null,
              sessionDate: !isPerDay ? _selectedDate!.toIso8601String().substring(0, 10) : null,
              timeSlotId: !isPerDay ? _selectedTimeSlotId : null,
            ),
          ],
        ),
      ],
    );

    try {
      await bookingProvider.createBooking(request);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đặt lịch thành công!')),
        );
        Navigator.pop(context);
        Navigator.pushNamed(context, AppRoutes.bookingHistory);
      }
    } catch (e) {
      if (mounted) {
        String message = 'Đã có lỗi xảy ra';
        if (e is DioException) {
          final responseData = e.response?.data;
          if (responseData is Map && responseData['message'] != null) {
            message = responseData['message'];
          } else {
            message = e.message ?? e.toString();
          }
        } else {
          message = e.toString();
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
}
