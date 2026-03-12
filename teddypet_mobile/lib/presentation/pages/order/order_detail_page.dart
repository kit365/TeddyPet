import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/entities/order/order_entity.dart';

class OrderDetailPage extends StatefulWidget {
  final OrderEntity? order;

  const OrderDetailPage({super.key, this.order});

  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  bool _isAddressExpanded = false;
  bool _isOrderInfoExpanded = false;

  @override
  Widget build(BuildContext context) {
    // For preview, if order is null, use a mockup
    final displayOrder = widget.order ?? _createMockOrder();

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
            _buildShippingSection(displayOrder),
            _buildAddressSection(displayOrder),
            _buildProductList(displayOrder),
            _buildOrderInfo(displayOrder, context),
            _buildSupportSection(),
            const SizedBox(height: 20), // Reduced bottom space
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomAction(displayOrder, context),
    );
  }

  Widget _buildStatusSection(OrderEntity order) {
    Color statusColor;
    String statusText;

    switch (order.status) {
      case 'COMPLETED':
        statusColor = const Color(0xFF2D937C); // Teal/Green from image
        statusText = 'Đơn hàng đã hoàn thành';
        break;
      case 'CANCELLED':
        statusColor = Colors.red;
        statusText = 'Đơn hàng đã hủy';
        break;
      case 'DELIVERING':
        statusColor = AppColors.primary;
        statusText = 'Đơn hàng đang giao';
        break;
      default:
        statusColor = Colors.orange;
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

  Widget _buildShippingSection(OrderEntity order) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Text(
                'Thông tin vận chuyển',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Spacer(),
              Icon(Icons.chevron_right, color: Colors.grey, size: 20),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'TeddyPet Instant: ${order.orderCode}',
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.local_shipping_outlined, color: Colors.grey, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Giao hàng thành công',
                      style: TextStyle(
                        color: Color(0xFF2D937C),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      order.completedAt ?? order.deliveredAt ?? 'Vừa xong',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
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

  Widget _buildAddressSection(OrderEntity order) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
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
    return Padding(
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

  Widget _buildSupportSection() {
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
          _buildSupportItem(Icons.replay_circle_filled_outlined, 'Gửi yêu cầu Trả hàng/Hoàn tiền'),
          _buildSupportItem(Icons.chat_bubble_outline, 'Liên hệ Shop'),
          _buildSupportItem(Icons.help_outline, 'Trung tâm Hỗ trợ'),
        ],
      ),
    );
  }

  Widget _buildSupportItem(IconData icon, String title) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: Colors.grey),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
      onTap: () {},
    );
  }

  Widget _buildBottomAction(OrderEntity order, BuildContext context) {
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
        child: ElevatedButton(
          onPressed: () {},
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.secondary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Text(
            'MUA LẠI',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      ),
    );
  }

  OrderEntity _createMockOrder() {
    return OrderEntity(
      id: 'mock-id',
      orderCode: '2602062CJC9EF0',
      subtotal: 150000,
      shippingFee: 30000,
      discountAmount: 84000,
      finalAmount: 96000,
      orderType: 'SHOPPING',
      status: 'COMPLETED',
      shippingName: 'Tuấn Kiệt',
      shippingPhone: '(+84) 123 456 789',
      shippingAddress: '123 Đường Cách Mạng, Phường 10, Quận Tân Bình, TP. Hồ Chí Minh',
      paymentMethod: 'SPayLater',
      createdAt: '06-02-2026 20:03',
      completedAt: '08-02-2026 22:06',
      items: [
        OrderItemEntity(
          variantId: 1,
          productName: '[TRAVEL SIZE] Dầu gội làm phồng tóc Fanftcy 110ml',
          variantName: '110ml',
          unitPrice: 150000,
          quantity: 1,
          totalPrice: 150000,
          imageUrl: 'https://placehold.co/150/png?text=Fanftcy',
        ),
      ],
    );
  }
}
