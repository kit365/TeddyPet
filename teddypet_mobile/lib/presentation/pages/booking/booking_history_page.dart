import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../../data/models/response/booking/booking_response.dart';
import '../../providers/booking/booking_provider.dart';

class BookingHistoryPage extends StatefulWidget {
  const BookingHistoryPage({super.key});

  @override
  State<BookingHistoryPage> createState() => _BookingHistoryPageState();
}

class _BookingHistoryPageState extends State<BookingHistoryPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final List<String> _bookingTabs = [
    'Tất cả',
    'Chờ xác nhận',
    'Đã xác nhận',
    'Đang diễn ra',
    'Hoàn thành',
    'Đã hủy',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _bookingTabs.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().fetchMyBookings();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _getStatusInVietnamese(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'READY':
        return 'Sẵn sàng';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.orange;
      case 'CONFIRMED':
      case 'READY':
        return Colors.blue;
      case 'IN_PROGRESS':
        return Colors.purple;
      case 'COMPLETED':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.error;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Lịch sử đặt lịch',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<BookingProvider>(
        builder: (context, provider, child) {
          return Column(
            children: [
              Container(
                color: Colors.white,
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  padding: EdgeInsets.zero,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
                  labelPadding: const EdgeInsets.symmetric(horizontal: 20),
                  indicatorColor: AppColors.primary,
                  indicatorSize: TabBarIndicatorSize.label,
                  indicatorWeight: 3,
                  indicator: const UnderlineTabIndicator(
                    borderSide: BorderSide(width: 3, color: AppColors.primary),
                    insets: EdgeInsets.symmetric(horizontal: 4),
                  ),
                  tabs: _bookingTabs.map((tab) => Tab(text: tab)).toList(),
                ),
              ),
              Expanded(
                child: provider.isLoading && provider.myBookings.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : provider.error != null && provider.myBookings.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Lỗi: ${provider.error}'),
                                ElevatedButton(
                                  onPressed: () => provider.fetchMyBookings(),
                                  child: const Text('Thử lại'),
                                ),
                              ],
                            ),
                          )
                        : TabBarView(
                            controller: _tabController,
                            children: _orderStatusFilters().map((statusFilter) {
                              final filteredBookings = statusFilter.isEmpty
                                  ? provider.myBookings
                                  : provider.myBookings
                                      .where((b) => statusFilter.contains(b.status.toUpperCase()))
                                      .toList();

                              if (filteredBookings.isEmpty) {
                                return const Center(child: Text('Không có đơn đặt lịch nào'));
                              }

                              return ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: filteredBookings.length,
                                itemBuilder: (context, index) {
                                  final booking = filteredBookings[index];
                                  return _buildBookingItem(booking);
                                },
                              );
                            }).toList(),
                          ),
              ),
            ],
          );
        },
      ),
    );
  }

  List<String> _orderStatusFilters() {
    return [
      '', // Tất cả
      'PENDING',
      'CONFIRMED,READY',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ];
  }

  Widget _buildBookingItem(ClientBookingDetailResponse booking) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
        onTap: () => Navigator.pushNamed(
          context,
          AppRoutes.bookingDetail,
          arguments: booking.bookingCode,
        ),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Mã: ${booking.bookingCode}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(booking.status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _getStatusInVietnamese(booking.status),
                      style: TextStyle(
                        color: _getStatusColor(booking.status),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    'Ngày đặt: ${DateFormat('dd/MM/yyyy HH:mm').format(booking.createdAt)}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.pets, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    'Thú cưng: ${booking.pets?.map((p) => p.petName).join(", ") ?? "N/A"}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tổng cộng:', style: TextStyle(fontWeight: FontWeight.bold)),
                  Text(
                    currencyFormat.format(booking.totalAmount),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
}
extension on List {
  int get size => length;
}
