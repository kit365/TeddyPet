import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/entities/order/order_entity.dart';
import '../../../data/models/request/feedback/feedback_request.dart';
import '../../../data/models/response/feedback/feedback_token_response.dart';
import '../../../data/models/response/feedback/feedback_item_response.dart';
import '../../providers/cart/cart_provider.dart';
import '../../providers/feedback/feedback_provider.dart';
import '../../providers/order/order_provider.dart';
import '../../../core/routes/app_routes.dart';
import 'models/order_review_arguments.dart';

class OrderDetailPage extends StatefulWidget {
  final OrderEntity? order;
  final String? orderId; // Để load từ API nếu cần

  const OrderDetailPage({super.key, this.order, this.orderId});

  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  bool _isAddressExpanded = false;
  bool _isOrderInfoExpanded = false;
  String? _currentOrderId;
  bool _isReordering = false;
  bool _isAllReviewed = false;
  bool _isCheckingReviewStatus = false;

  @override
  void initState() {
    super.initState();
    // Lưu orderId để tracking
    _currentOrderId = widget.order?.id ?? widget.orderId;
    
    // Fetch từ API để có data mới nhất
    if (_currentOrderId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final orderProvider = context.read<OrderProvider>();
        orderProvider.fetchOrderDetail(_currentOrderId!);
        _checkReviewStatus();
      });
    }
  }

  Future<void> _checkReviewStatus() async {
    final orderId = widget.order?.id ?? widget.orderId;
    if (orderId == null) return;

    if (mounted) {
      setState(() => _isCheckingReviewStatus = true);
    }
    try {
      final feedbackProvider = context.read<FeedbackProvider>();
      final allReviewed = await feedbackProvider.isOrderAllReviewed(orderId);
      if (mounted) {
        setState(() {
          _isAllReviewed = allReviewed;
        });
      }
    } catch (e) {
      debugPrint("Lỗi khi kiểm tra trạng thái đánh giá: $e");
    } finally {
      if (mounted) {
        setState(() => _isCheckingReviewStatus = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OrderProvider>(
      builder: (context, orderProvider, child) {
        // Ưu tiên data từ provider (mới nhất), fallback về widget.order
        final displayOrder = orderProvider.currentOrderDetail ?? widget.order;
        
        // Loading state
        if (displayOrder == null && orderProvider.isLoadingDetail) {
          return Scaffold(
            backgroundColor: const Color(0xFFF8F9FA),
            appBar: AppBar(
              title: const Text(
                'Thông tin đơn hàng',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              elevation: 0,
              centerTitle: true,
            ),
            body: const Center(
              child: CircularProgressIndicator(color: AppColors.secondary),
            ),
          );
        }

        // Error or no data
        if (displayOrder == null) {
          return Scaffold(
            backgroundColor: const Color(0xFFF8F9FA),
            appBar: AppBar(
              title: const Text(
                'Thông tin đơn hàng',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              elevation: 0,
              centerTitle: true,
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 60, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    orderProvider.errorMessage ?? 'Không thể tải đơn hàng',
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF8F9FA),
          appBar: AppBar(
            title: const Text(
              'Thông tin đơn hàng',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            elevation: 0,
            centerTitle: true,
          ),
          body: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildStatusSection(displayOrder),
                _buildAddressSection(displayOrder),
                _buildProductList(displayOrder),
                _buildOrderInfo(displayOrder, context),
                _buildSupportSection(displayOrder),
                const SizedBox(height: 20),
              ],
            ),
          ),
          bottomNavigationBar: _buildBottomAction(displayOrder, context, orderProvider),
        );
      },
    );
  }

  Widget _buildStatusSection(OrderEntity order) {
    Color statusColor;
    String statusText;

    switch (order.status) {
      case 'PENDING':
        statusColor = Colors.orange;
        statusText = 'Chờ xác nhận';
        break;
      case 'PROCESSING':
        statusColor = Colors.orange;
        statusText = 'Chờ lấy hàng';
        break;
      case 'DELIVERING':
        statusColor = AppColors.primary;
        statusText = 'Đang giao hàng';
        break;
      case 'DELIVERED':
        statusColor = const Color(0xFF2D937C);
        statusText = 'Đã giao hàng';
        break;
      case 'COMPLETED':
        statusColor = const Color(0xFF2D937C);
        statusText = 'Đơn hàng đã hoàn thành';
        break;
      case 'CANCELLED':
        statusColor = Colors.red;
        statusText = 'Đơn hàng đã hủy';
        break;
      case 'RETURNED':
        statusColor = Colors.red;
        statusText = 'Đã trả hàng';
        break;
      case 'RETURN_REQUESTED':
        statusColor = Colors.orange;
        statusText = 'Đang yêu cầu trả hàng';
        break;
      default:
        statusColor = Colors.grey;
        statusText = 'Đang xử lý';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
      decoration: BoxDecoration(
        color: statusColor,
      ),
      child: Text(
        statusText,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildAddressSection(OrderEntity order) {
    return Container(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Địa chỉ nhận hàng',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.location_on_outlined, size: 20, color: Colors.grey),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Colors.black, fontSize: 15),
                        children: [
                          TextSpan(
                            text: order.shippingName ?? 'Người nhận',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          TextSpan(
                            text: ' (${order.shippingPhone ?? 'SĐT'})',
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            order.shippingAddress ?? 'Địa chỉ',
                            style: const TextStyle(color: Colors.grey, height: 1.4, fontSize: 14),
                            maxLines: _isAddressExpanded ? null : 1,
                            overflow: _isAddressExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _isAddressExpanded = !_isAddressExpanded;
                            });
                          },
                          child: Text(
                            _isAddressExpanded ? 'Thu gọn' : 'Xem thêm',
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProductList(OrderEntity order) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.symmetric(vertical: 12),
      color: Colors.white,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                const Icon(Icons.shop_outlined, size: 20, color: Colors.grey),
                const SizedBox(width: 8),
                const Text(
                  'Sản phẩm',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const Spacer(),
                Text(
                  '${order.items.length} mặt hàng',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ...order.items.map((item) => _buildProductItem(item)).toList(),
          const Divider(height: 1),
        ],
      ),
    );
  }

  Widget _buildProductItem(OrderItemEntity item) {
    return InkWell(
      onTap: () {
        if (item.productId != null) {
          Navigator.pushNamed(
            context,
            AppRoutes.productDetail,
            arguments: item.productId,
          );
        }
      },
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
                image: DecorationImage(
                  image: NetworkImage(item.imageUrl ?? 'https://placehold.co/100x100'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.productName,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.variantName,
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'x${item.quantity}',
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                      ),
                      Text(
                        '${NumberFormat("#,###", "vi_VN").format(item.unitPrice)}đ',
                        style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderInfo(OrderEntity order, BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Mã đơn hàng',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const Spacer(),
              Text(order.orderCode, style: const TextStyle(color: Colors.black54, fontSize: 14)),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: order.orderCode));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Đã sao chép mã đơn hàng'),
                      duration: Duration(seconds: 1),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                child: const Text(
                  'SAO CHÉP',
                  style: TextStyle(
                    color: AppColors.secondary,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoRow('Phương thức thanh toán', order.paymentMethod ?? 'Thanh toán khi nhận hàng'),
          
          if (_isOrderInfoExpanded) ...[
            const SizedBox(height: 12),
            _buildInfoRow('Thời gian đặt hàng', order.createdAt ?? 'Vừa xong'),
            if (order.completedAt != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow('Thời gian hoàn thành', order.completedAt!),
            ],
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),
            _buildPriceRow('Tổng tiền hàng', order.subtotal),
            _buildPriceRow('Phí vận chuyển', order.shippingFee),
            if (order.discountAmount > 0)
              _buildPriceRow('Giảm giá', -order.discountAmount),
          ],
          
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Thành tiền',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Text(
                '${NumberFormat("#,###", "vi_VN").format(order.finalAmount)}đ',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Center(
            child: TextButton(
              onPressed: () {
                setState(() {
                  _isOrderInfoExpanded = !_isOrderInfoExpanded;
                });
              },
              child: Text(
                _isOrderInfoExpanded ? 'Thu gọn' : 'Xem thêm',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildPriceRow(String label, double amount) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(
            '${amount > 0 ? "" : "-"}${NumberFormat("#,###", "vi_VN").format(amount.abs())}đ',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildSupportSection(OrderEntity order) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bạn cần hỗ trợ?',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          // Chỉ hiện nút trả hàng nếu đơn đã COMPLETED
          if (order.status == 'COMPLETED')
            _buildSupportItem(
              Icons.replay_circle_filled_outlined, 
              'Gửi yêu cầu Trả hàng/Hoàn tiền',
              onTap: () => _showReturnDialog(context, order),
            ),
          _buildSupportItem(Icons.chat_bubble_outline, 'Liên hệ Shop'),
          _buildSupportItem(Icons.help_outline, 'Trung tâm Hỗ trợ'),
        ],
      ),
    );
  }

  Widget _buildSupportItem(IconData icon, String title, {VoidCallback? onTap}) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: Colors.grey),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
      onTap: onTap ?? () {},
    );
  }

  Widget _buildBottomAction(OrderEntity order, BuildContext context, OrderProvider orderProvider) {
    // Hiện button khác nhau tùy theo status
    switch (order.status) {
      case 'PENDING':
        // Chờ xác nhận (đơn vừa đặt) - có thể hủy
        return _buildActionButtons([
          _ActionButton(
            label: 'HỦY ĐƠN',
            isPrimary: false,
            onPressed: () => _showCancelDialog(context, order, orderProvider),
          ),
        ]);
      case 'PROCESSING':
        // Chờ lấy hàng (đã xác nhận) - không thể hủy nữa
        return const SizedBox.shrink();
      case 'DELIVERED':
        // Đã giao - xác nhận đã nhận hàng
        return _buildActionButtons([
          _ActionButton(
            label: 'ĐÃ NHẬN HÀNG',
            isPrimary: true,
            onPressed: () => _confirmReceived(context, order, orderProvider),
          ),
        ]);
      case 'COMPLETED':
        // Hoàn thành - đánh giá + mua lại
        return _buildActionButtons([
          if (!_isAllReviewed && !_isCheckingReviewStatus)
            _ActionButton(
              label: 'ĐÁNH GIÁ',
              isPrimary: true,
              isReview: true,
              onPressed: () => _showReviewDialog(context, order),
            ),
          _ActionButton(
            label: 'MUA LẠI',
            isPrimary: false,
            isLoading: _isReordering,
            onPressed: () => _handleBuyAgain(context, order),
          ),
        ]);
      case 'CANCELLED':
      case 'RETURNED':
        // Đã hủy hoặc trả hàng - mua lại
        return _buildActionButtons([
          _ActionButton(
            label: 'MUA LẠI',
            isPrimary: false,
            isLoading: _isReordering,
            onPressed: () => _handleBuyAgain(context, order),
          ),
        ]);
      default:
        // Đang giao hoặc trạng thái khác
        return const SizedBox.shrink();
    }
  }

  Widget _buildActionButtons(List<_ActionButton> buttons) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: buttons.map((btn) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  left: buttons.indexOf(btn) > 0 ? 8 : 0,
                ),
                child: btn.isPrimary
                    ? ElevatedButton(
                        onPressed: btn.onPressed,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: btn.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                btn.label,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                      )
                    : OutlinedButton(
                        onPressed: btn.onPressed,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          btn.label,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  // ========== Action Dialogs ==========

  void _handleBuyAgain(BuildContext context, OrderEntity order) async {
    setState(() => _isReordering = true);
    
    final cartProvider = context.read<CartProvider>();
    final success = await cartProvider.buyAgain(order.items);
    
    if (mounted) {
      setState(() => _isReordering = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã thêm sản phẩm vào giỏ hàng!'),
            backgroundColor: AppColors.secondary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Có lỗi xảy ra khi mua lại sản phẩm')),
        );
      }
    }
  }

  void _showReviewDialog(BuildContext context, OrderEntity order) async {
    final feedbackProvider = context.read<FeedbackProvider>();
    
    // Tải thông tin đánh giá (để xem đã đánh giá chưa)
    await feedbackProvider.fetchOrderFeedbackDetails(order.id);
    
    if (!mounted) return;
    
    if (feedbackProvider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(feedbackProvider.errorMessage!)),
      );
      return;
    }

    final details = feedbackProvider.feedbackDetails;
    if (details == null || details.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không có sản phẩm nào để đánh giá')),
      );
      return;
    }

    // Điều hướng sang trang đánh giá mới thay vì hiện dialog
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.orderReview,
      arguments: OrderReviewArguments(
        orderId: order.id,
        feedbackDetails: details,
      ),
    );

    if (result == true && mounted) {
      // Nếu đánh giá thành công, tải lại chi tiết đơn hàng để cập nhật trạng thái nút
      final orderProvider = context.read<OrderProvider>();
      orderProvider.fetchOrderDetail(order.id);
      _checkReviewStatus(); // Cập nhật trạng thái ẩn nút đánh giá
    }
  }

  void _showCancelDialog(BuildContext context, OrderEntity order, OrderProvider provider) {
    // ... (unchanged)
    final TextEditingController reasonController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hủy đơn hàng'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bạn có chắc muốn hủy đơn hàng này?'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Lý do hủy đơn',
                hintText: 'Nhập lý do hủy đơn...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (reasonController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Vui lòng nhập lý do hủy đơn')),
                );
                return;
              }
              Navigator.pop(ctx);
              
              final success = await provider.cancelOrder(order.id, reasonController.text.trim());
              if (success && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã hủy đơn hàng thành công')),
                );
                Navigator.pop(context); // Quay lại trang trước
              } else if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(provider.errorMessage ?? 'Không thể hủy đơn hàng')),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Hủy đơn', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _confirmReceived(BuildContext context, OrderEntity order, OrderProvider provider) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận đã nhận hàng'),
        content: const Text('Bạn đã nhận được hàng và hài lòng với sản phẩm?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Chưa'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Đã nhận', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final success = await provider.confirmReceived(order.id);
      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cảm ơn bạn đã xác nhận!')),
        );
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.errorMessage ?? 'Có lỗi xảy ra')),
        );
      }
    }
  }

  void _showReturnDialog(BuildContext context, OrderEntity order) {
    final TextEditingController reasonController = TextEditingController();
    final provider = context.read<OrderProvider>();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Yêu cầu trả hàng'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Vui lòng cho chúng tôi biết lý do bạn muốn trả hàng:'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Lý do trả hàng',
                hintText: 'Mô tả lý do...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (reasonController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Vui lòng nhập lý do trả hàng')),
                );
                return;
              }
              Navigator.pop(ctx);
              
              final success = await provider.requestReturn(order.id, reasonController.text.trim());
              if (success && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã gửi yêu cầu trả hàng. Vui lòng chờ Admin xử lý.')),
                );
              } else if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(provider.errorMessage ?? 'Không thể gửi yêu cầu')),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Gửi yêu cầu', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _ActionButton {
  final String label;
  final bool isPrimary;
  final bool isReview;
  final bool isLoading;
  final VoidCallback onPressed;

  _ActionButton({
    required this.label,
    required this.isPrimary,
    this.isReview = false,
    this.isLoading = false,
    required this.onPressed,
  });
}

class _FeedbackListDialog extends StatefulWidget {
  final String orderId;
  final List<dynamic> items; // List<FeedbackItemResponse>
  final VoidCallback onSubmitted;

  const _FeedbackListDialog({
    required this.orderId,
    required this.items,
    required this.onSubmitted,
  });

  @override
  State<_FeedbackListDialog> createState() => _FeedbackListDialogState();
}

class _FeedbackListDialogState extends State<_FeedbackListDialog> {
  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Đánh giá sản phẩm',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const Divider(),
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  children: widget.items.map((item) {
                    return _FeedbackItemWidget(
                      orderId: widget.orderId,
                      item: item,
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('ĐÓNG'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedbackItemWidget extends StatefulWidget {
  final String orderId;
  final dynamic item; // FeedbackItemResponse

  const _FeedbackItemWidget({required this.orderId, required this.item});

  @override
  State<_FeedbackItemWidget> createState() => _FeedbackItemWidgetState();
}

class _FeedbackItemWidgetState extends State<_FeedbackItemWidget> {
  int _rating = 5;
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmitted = false;

  @override
  void initState() {
    super.initState();
    _isSubmitted = widget.item.isSubmitted;
    if (_isSubmitted) {
      _rating = widget.item.rating ?? 5;
      _commentController.text = widget.item.comment ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  image: DecorationImage(
                    image: NetworkImage(widget.item.imageUrl ?? 'https://placehold.co/50x50'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.item.productName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      widget.item.variantName,
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (!_isSubmitted) ...[
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (index) {
                  return IconButton(
                    onPressed: () => setState(() => _rating = index + 1),
                    icon: Icon(
                      index < _rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 28,
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              decoration: InputDecoration(
                hintText: 'Chia sẻ trải nghiệm của bạn...',
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.all(12),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            Center(
              child: Consumer<FeedbackProvider>(
                builder: (context, provider, _) {
                  return SizedBox(
                    width: 120,
                    child: ElevatedButton(
                      onPressed: provider.isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: provider.isLoading
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Gửi đánh giá', style: TextStyle(fontSize: 12)),
                    ),
                  );
                },
              ),
            ),
          ] else ...[
            const SizedBox(height: 8),
            Row(
              children: List.generate(5, (index) {
                return Icon(
                  index < _rating ? Icons.star : Icons.star_border,
                  color: Colors.amber,
                  size: 20,
                );
              }),
            ),
            const SizedBox(height: 8),
            Text(
              _commentController.text,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            const Text(
              'Đã gửi đánh giá',
              style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ],
        ],
      ),
    );
  }

  void _submit() async {
    if (_commentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập bình luận')),
      );
      return;
    }

    final provider = context.read<FeedbackProvider>();
    final success = await provider.submitFeedback(
      FeedbackRequest(
        orderId: widget.orderId,
        productId: widget.item.productId,
        variantId: widget.item.variantId,
        rating: _rating,
        comment: _commentController.text.trim(),
      ),
    );

    if (success && mounted) {
      setState(() => _isSubmitted = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã gửi đánh giá thành công!')),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Có lỗi xảy ra khi gửi đánh giá')),
      );
    }
  }
}
