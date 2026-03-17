import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/request/feedback/feedback_request.dart';
import '../../../data/models/response/feedback/feedback_item_response.dart';
import '../../../data/models/response/feedback/feedback_token_response.dart';
import '../../providers/feedback/feedback_provider.dart';

import 'models/order_review_arguments.dart';

class OrderReviewPage extends StatefulWidget {
  final OrderReviewArguments args;

  const OrderReviewPage({
    super.key,
    required this.args,
  });

  @override
  State<OrderReviewPage> createState() => _OrderReviewPageState();
}

class _OrderReviewPageState extends State<OrderReviewPage> {
  final Map<int, int> _ratings = {};
  final Map<int, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    for (var i = 0; i < widget.args.feedbackDetails.items.length; i++) {
      final item = widget.args.feedbackDetails.items[i];
      _ratings[i] = item.rating ?? 5;
      _controllers[i] = TextEditingController(text: item.comment ?? '');
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submitAll() async {
    final provider = context.read<FeedbackProvider>();
    bool allSuccess = true;

    for (var i = 0; i < widget.args.feedbackDetails.items.length; i++) {
      final item = widget.args.feedbackDetails.items[i];
      if (item.isSubmitted) continue;

      final request = FeedbackRequest(
        orderId: widget.args.orderId,
        productId: item.productId,
        variantId: item.variantId,
        rating: _ratings[i]!,
        comment: _controllers[i]!.text,
        token: widget.args.feedbackDetails.token,
      );

      final success = await provider.submitFeedback(request);
      if (!success) {
        allSuccess = false;
      }
    }

    if (mounted) {
      if (allSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi tất cả đánh giá thành công!')),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Có lỗi xảy ra khi gửi một số đánh giá.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          'Đánh giá sản phẩm',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: widget.args.feedbackDetails.items.length,
              itemBuilder: (context, index) {
                final item = widget.args.feedbackDetails.items[index];
                return _buildReviewItem(item, index);
              },
            ),
          ),
          _buildSubmitButton(),
        ],
      ),
    );
  }

  Widget _buildReviewItem(FeedbackItemResponse item, int index) {
    final bool isSubmitted = item.isSubmitted;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  item.imageUrl ?? '',
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 60,
                    height: 60,
                    color: Colors.grey[200],
                    child: const Icon(Icons.pets, color: Colors.grey),
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
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (item.variantName.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'Phân loại: ${item.variantName}',
                          style: TextStyle(color: Colors.grey[600], fontSize: 13),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          const Text(
            'Chất lượng sản phẩm',
            style: TextStyle(fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (starIndex) {
              return IconButton(
                onPressed: isSubmitted
                    ? null
                    : () {
                        setState(() {
                          _ratings[index] = starIndex + 1;
                        });
                      },
                icon: Icon(
                  starIndex < _ratings[index]! ? Icons.star : Icons.star_border,
                  color: starIndex < _ratings[index]! ? Colors.orange : Colors.grey,
                  size: 32,
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controllers[index],
            enabled: !isSubmitted,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Hãy chia sẻ cảm nhận của bạn về sản phẩm nhé...',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              filled: true,
              fillColor: isSubmitted ? Colors.grey[50] : Colors.grey[100],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          if (isSubmitted)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    'Đã đánh giá',
                    style: TextStyle(color: Colors.green[700], fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    final provider = context.watch<FeedbackProvider>();
    final bool hasUnsubmitted = widget.args.feedbackDetails.items.any((item) => !item.isSubmitted);

    if (!hasUnsubmitted) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: provider.isLoading ? null : _submitAll,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectanglePlatform.borderRadius(8),
              elevation: 0,
            ),
            child: provider.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : const Text(
                    'Gửi đánh giá',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
          ),
        ),
      ),
    );
  }
}

class RoundedRectanglePlatform {
  static RoundedRectangleBorder borderRadius(double radius) {
    return RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius));
  }
}
