import 'package:flutter/material.dart';
import '../../../data/models/response/product/brand_response.dart';
import '../../../data/repositories/brand/brand_repository.dart';

class FilterProvider extends ChangeNotifier {
  final BrandRepository _brandRepository;

  FilterProvider(this._brandRepository);

  List<BrandResponse> _brands = [];
  List<BrandResponse> get brands => _brands;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  final List<String> _petTypes = ['DOG', 'CAT', 'OTHER'];
  List<String> get petTypes => _petTypes;

  Future<void> fetchFilterOptions() async {
    _isLoading = true;
    notifyListeners();

    try {
      _brands = await _brandRepository.getAllBrands();
    } catch (e) {
      debugPrint("Error fetching brands: \$e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
