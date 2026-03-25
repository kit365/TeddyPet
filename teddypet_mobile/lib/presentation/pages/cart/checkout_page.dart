import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/core/routes/app_routes.dart';
import 'package:teddypet_mobile/core/utils/format_utils.dart';
import 'package:teddypet_mobile/data/models/entities/cart/cart_entity.dart';
import 'package:teddypet_mobile/data/models/request/order/order_request.dart';
import 'package:teddypet_mobile/presentation/providers/cart/cart_provider.dart';
import 'package:teddypet_mobile/presentation/providers/order/order_provider.dart';
import 'package:teddypet_mobile/presentation/providers/user/user_address_provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/response/user/user_address_response.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final TextEditingController _noteController = TextEditingController();
  String _selectedPaymentMethod = 'CASH';

  late CartProvider _cartProvider;
  late OrderProvider _orderProvider;
  late UserAddressProvider _addressProvider;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserAddressProvider>().getAll();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _cartProvider = context.read<CartProvider>();
    _orderProvider = context.read<OrderProvider>();
    _addressProvider = context.read<UserAddressProvider>();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    final addressProvider = context.watch<UserAddressProvider>();
    final orderProvider = context.watch<OrderProvider>();

    final cart = cartProvider.cart;
    final addresses = addressProvider.addresses;

    UserAddressResponse? selectedAddress;
    try {
      selectedAddress = addresses.firstWhere((a) => a.isDefault);
    } catch (_) {
      if (addresses.isNotEmpty) {
        selectedAddress = addresses.first;
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text(
          'Thanh toán',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: orderProvider.isOrdering
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SingleChildScrollView(
              child: Column(
                children: [
                  _buildAddressSection(selectedAddress),
                  const SizedBox(height: 8),
                  if (cart != null) _buildProductList(cart.items),
                  const SizedBox(height: 8),
                  _buildNoteSection(),
                  const SizedBox(height: 8),
                  _buildPaymentMethodSection(),
                  const SizedBox(height: 8),
                  _buildPaymentDetailSection(cart?.totalAmount ?? 0),
                  _buildTermsSection(),
                ],
              ),
            ),
      bottomNavigationBar: _buildBottomBar(
        context,
        cart?.totalAmount ?? 0,
        selectedAddress,
      ),
    );
  }

  Widget _buildAddressSection(UserAddressResponse? address) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, AppRoutes.addressList),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(top: 2),
              child: Icon(
                Icons.location_on_outlined,
                color: AppColors.primary,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Địa chỉ nhận hàng",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (address != null) ...[
                    Text(
                      "${address.fullName} | ${address.phone}",
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      address.address,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.black87,
                      ),
                    ),
                  ] else
                    const Text(
                      "Chưa có địa chỉ. Vui lòng thiết lập địa chỉ của bạn.",
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildProductList(List<CartItemEntity> items) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Sản phẩm (${items.length})",
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            separatorBuilder: (context, index) => const Divider(height: 24),
            itemBuilder: (context, index) {
              final item = items[index];
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      item.featuredImageUrl ?? '',
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 70,
                        height: 70,
                        color: Colors.grey[100],
                        child: const Icon(
                          Icons.inventory_2_outlined,
                          color: Colors.grey,
                        ),
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
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Phân loại: ${item.variantName}",
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.black54,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              FormatUtils.formatCurrency(item.finalPrice),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                            Text(
                              "x${item.quantity}",
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNoteSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: () => _showNoteBottomSheet(),
        child: Row(
          children: [
            const Text("Lời nhắn:", style: TextStyle(fontSize: 14)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _noteController.text.isEmpty
                    ? "Lưu ý cho người bán..."
                    : _noteController.text,
                textAlign: TextAlign.end,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  color: _noteController.text.isEmpty
                      ? Colors.grey[400]
                      : Colors.black87,
                ),
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: Colors.grey, size: 16),
          ],
        ),
      ),
    );
  }

  void _showNoteBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(width: 32),
                    const Text(
                      "Lời nhắn cho Shop",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close, color: Colors.grey),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Input Field
              Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: TextField(
                    controller: _noteController,
                    maxLines: 4,
                    autofocus: true,
                    style: const TextStyle(fontSize: 14),
                    decoration: const InputDecoration(
                      hintText: "Để lại lời nhắn",
                      hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
                      contentPadding: EdgeInsets.all(12),
                      border: InputBorder.none,
                    ),
                    onChanged: (value) {
                      setModalState(() {});

                      setState(() {});
                    },
                  ),
                ),
              ),
              // Button
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      "Hoàn thành",
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () async {
              final result = await Navigator.pushNamed(
                context,
                AppRoutes.paymentMethod,
                arguments: _selectedPaymentMethod,
              );
              if (result != null && result is String) {
                setState(() {
                  _selectedPaymentMethod = result;
                });
              }
            },
            child: Row(
              children: const [
                Text(
                  "Phương thức thanh toán",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                ),
                Spacer(),
                Text(
                  "Xem tất cả",
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
                SizedBox(width: 4),
                Icon(Icons.chevron_right, color: Colors.grey, size: 16),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(
                _selectedPaymentMethod == 'CASH'
                    ? Icons.payments_outlined
                    : Icons.account_balance_outlined,
                color: _selectedPaymentMethod == 'CASH'
                    ? Colors.orange
                    : Colors.blue,
                size: 22,
              ),
              const SizedBox(width: 12),
              Text(
                _selectedPaymentMethod == 'CASH'
                    ? "Thanh toán khi nhận hàng (COD)"
                    : "Chuyển khoản ngân hàng",
                style: const TextStyle(fontSize: 14, color: Colors.black87),
              ),
              const Spacer(),
              const Icon(
                Icons.check_circle,
                color: AppColors.primary,
                size: 20,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentDetailSection(double total) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Chi tiết thanh toán",
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          _buildDetailRow("Tổng tiền hàng", FormatUtils.formatCurrency(total)),
          const SizedBox(height: 8),
          _buildDetailRow(
            "Phí vận chuyển",
            "Sẽ liên hệ sau",
            valueColor: Colors.black54,
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Tổng thanh toán",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              Text(
                FormatUtils.formatCurrency(total),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Colors.black54),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            color: valueColor ?? Colors.black87,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildTermsSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(
            fontSize: 12,
            color: Colors.black54,
            height: 1.5,
          ),
          children: [
            const TextSpan(
              text: "Nhấn 'Đặt hàng' đồng nghĩa với việc bạn đồng ý tuân theo ",
            ),
            TextSpan(
              text: "Điều khoản TeddyPet",
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(
    BuildContext context,
    double total,
    UserAddressResponse? address,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, -4),
            blurRadius: 10,
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Tổng thanh toán",
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                    Text(
                      FormatUtils.formatCurrency(total),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: (address == null || _orderProvider.isOrdering)
                      ? null
                      : () => _handlePlaceOrder(context, total, address),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    disabledBackgroundColor: Colors.grey[300],
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    "Đặt Hàng",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handlePlaceOrder(
    BuildContext context,
    double total,
    UserAddressResponse address,
  ) async {
    final request = OrderRequest(
      paymentMethod: _selectedPaymentMethod,
      userAddressId: address.id,
      receiverName: address.fullName,
      receiverPhone: address.phone,
      shippingAddress: address.address,
      note: _noteController.text,
      items: _cartProvider.cart!.items
          .map(
            (i) =>
                OrderItemRequest(variantId: i.variantId, quantity: i.quantity),
          )
          .toList(),
    );

    final success = await _orderProvider.createOrder(request);
    if (!context.mounted) return;

    if (success) {
      _cartProvider.fetchMyCart(background: true);
      final createdOrder = _orderProvider.lastCreatedOrder;
      
      if (context.mounted && createdOrder != null) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          AppRoutes.orderSuccess,
          (route) => route.isFirst,
          arguments: createdOrder,
        );
      }
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Đặt hàng thất bại, vui lòng thử lại!"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
