import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/booking/booking_provider.dart';
import '../../../data/models/response/booking/booking_response.dart';

class BookingDetailPage extends StatefulWidget {
  final String? bookingCode;
  const BookingDetailPage({super.key, this.bookingCode});

  @override
  State<BookingDetailPage> createState() => _BookingDetailPageState();
}

class _BookingDetailPageState extends State<BookingDetailPage> {
  @override
  void initState() {
    super.initState();
    if (widget.bookingCode != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<BookingProvider>().fetchBookingDetail(widget.bookingCode!);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết đặt lịch'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Consumer<BookingProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final booking = provider.currentBookingDetail;
          if (booking == null) {
            return const Center(child: Text('Không tìm thấy thông tin đặt lịch'));
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildStatusCard(booking),
              const SizedBox(height: 16),
              _buildPetInfo(booking),
              const SizedBox(height: 16),
              _buildServiceDetails(booking),
              const SizedBox(height: 16),
              _buildPaymentInfo(booking),
              const SizedBox(height: 24),
              if (booking.status.toUpperCase() == 'PENDING')
                ElevatedButton(
                  onPressed: () => _showCancelDialog(context, booking.bookingCode),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: AppColors.error),
                    foregroundColor: AppColors.error,
                  ),
                  child: const Text('Hủy đặt lịch'),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(ClientBookingDetailResponse booking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Trạng thái', style: TextStyle(color: Colors.grey)),
                Text(
                  booking.status.toUpperCase(),
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Mã đặt lịch', style: TextStyle(color: Colors.grey)),
                Text(booking.bookingCode, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPetInfo(ClientBookingDetailResponse booking) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Thú cưng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 8),
        ...?booking.pets?.map((pet) => Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.pets)),
            title: Text(pet.petName, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('${pet.petType} - ${pet.weightAtBooking}kg'),
          ),
        )),
      ],
    );
  }

  Widget _buildServiceDetails(ClientBookingDetailResponse booking) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Dịch vụ đã chọn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 8),
        ...?booking.pets?.expand((pet) => pet.services?.map((svc) => Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${pet.petName}: ${svc.serviceName ?? "Dịch vụ"}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    if (svc.roomName != null)
                      Text('Phòng: ${svc.roomName} (${svc.roomNumber})', style: const TextStyle(fontSize: 12)),
                    if (svc.timeSlotName != null)
                      Text('Khung giờ: ${svc.timeSlotName}', style: const TextStyle(fontSize: 12)),
                    if (svc.estimatedCheckInDate != null)
                      Text(
                        'Ngày: ${DateFormat('dd/MM/yyyy').format(svc.estimatedCheckInDate!)}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      )
                    else if (svc.scheduledStartTime != null)
                      Text(
                        'Ngày: ${DateFormat('dd/MM/yyyy').format(svc.scheduledStartTime!)}',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tạm tính', style: TextStyle(fontSize: 12)),
                        Text(
                          NumberFormat.currency(locale: 'vi_VN', symbol: '₫').format(svc.subtotal),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            )) ?? []),
      ],
    );
  }

  Widget _buildPaymentInfo(ClientBookingDetailResponse booking) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    return Card(
      color: Colors.grey[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildPriceRow('Tổng cộng', currencyFormat.format(booking.totalAmount), isBold: true),
            _buildPriceRow('Đã thanh toán', currencyFormat.format(booking.paidAmount)),
            _buildPriceRow('Còn lại', currencyFormat.format(booking.remainingAmount), 
              color: AppColors.primary, isBold: true),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: color,
          )),
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context, String code) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy đặt lịch'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(hintText: 'Lý do hủy...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              try {
                await context.read<BookingProvider>().cancelBooking(code, reasonController.text);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Hủy đặt lịch thành công')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi khi hủy: $e')),
                  );
                }
              } finally {
                navigator.pop();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Xác nhận hủy'),
          ),
        ],
      ),
    );
  }
}
