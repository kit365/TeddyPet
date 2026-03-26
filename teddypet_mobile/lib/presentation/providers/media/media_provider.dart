import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../controllers/media/media_controller.dart';

class MediaProvider extends ChangeNotifier {
  final MediaController _controller;
  final ImagePicker _picker = ImagePicker();

  MediaProvider(this._controller);

  bool _isUploading = false;
  bool get isUploading => _isUploading;

  Future<String?> pickAndUploadImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 70,
      );

      if (image == null) return null;

      _isUploading = true;
      notifyListeners();

      final url = await _controller.uploadImage(image.path);
      return url;
    } catch (e) {
      debugPrint('Error picking/uploading image: $e');
      return null;
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }

  Future<List<String>> pickAndUploadMultipleImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        imageQuality: 70,
      );

      if (images.isEmpty) return [];

      _isUploading = true;
      notifyListeners();

      List<String> urls = [];
      for (var image in images) {
        final url = await _controller.uploadImage(image.path);
        if (url != null) urls.add(url);
      }
      return urls;
    } catch (e) {
      debugPrint('Error picking/uploading multiple images: $e');
      return [];
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }
}
