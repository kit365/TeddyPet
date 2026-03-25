import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/booking/booking_provider.dart';
import '../../providers/media/media_provider.dart';
import 'package:image_picker/image_picker.dart';
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
                    if (booking.status.toUpperCase() == 'COMPLETED' || booking.status.toUpperCase() == 'CHECKED_OUT')
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (svc.customerRating != null)
                              Row(
                                children: [
                                  const Icon(Icons.star, color: Colors.amber, size: 16),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${svc.customerRating}/5',
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton(
                                    onPressed: () => _showReviewDialog(context, booking.bookingCode, svc),
                                    child: const Text('Sửa đánh giá', style: TextStyle(fontSize: 12)),
                                  ),
                                ],
                              )
                            else
                              ElevatedButton(
                                onPressed: () => _showReviewDialog(context, booking.bookingCode, svc),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text('Đánh giá', style: TextStyle(fontSize: 12)),
                              ),
                          ],
                        ),
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

  void _showReviewDialog(BuildContext context, String bookingCode, ClientBookingPetServiceDetailResponse svc) {
    final reviewController = TextEditingController(text: svc.customerReview);
    int rating = svc.customerRating ?? 5;
    List<String> photos = svc.customerReviewPhotos?.split(',').where((p) => p.isNotEmpty).toList() ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Đánh giá dịch vụ: ${svc.serviceName}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text('Bạn thấy dịch vụ này thế nào?'),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    onPressed: () => setState(() => rating = index + 1),
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 36,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: reviewController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Nhập cảm nhận của bạn...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.grey[100],
                ),
              ),
              const SizedBox(height: 16),
              const Text('Hình ảnh thực tế', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              SizedBox(
                height: 80,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    ...photos.map((photo) => Stack(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(image: NetworkImage(photo), fit: BoxFit.cover),
                              ),
                            ),
                            Positioned(
                              top: 0,
                              right: 8,
                              child: GestureDetector(
                                onTap: () => setState(() => photos.remove(photo)),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, size: 12, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        )),
                    if (photos.length < 5)
                      GestureDetector(
                        onTap: () async {
                          final urls = await context.read<MediaProvider>().pickAndUploadMultipleImages();
                          if (urls.isNotEmpty) {
                            setState(() => photos.addAll(urls));
                          }
                        },
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: const Icon(Icons.add_a_photo, color: Colors.grey),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () async {
                    if (context.read<BookingProvider>().isLoading) return;
                    
                    try {
                      await context.read<BookingProvider>().upsertServiceReview(
                            bookingCode,
                            svc.id,
                            rating,
                            reviewController.text,
                            photos,
                          );
                      if (mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Cảm ơn bạn đã đánh giá!')),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Lỗi khi gửi đánh giá: $e')),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: context.watch<BookingProvider>().isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Gửi đánh giá', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
