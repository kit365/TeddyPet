import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

abstract class MediaRepository {
  Future<String?> uploadImage(String filePath);
}

class MediaRepositoryImpl implements MediaRepository {
  final ApiClient _apiClient;

  MediaRepositoryImpl(this._apiClient);

  @override
  Future<String?> uploadImage(String filePath) async {
    final fileName = filePath.split('/').last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _apiClient.post(
      'media/upload',
      data: formData,
    );

    if (response.success && response.data != null) {
      return response.data; // The backend returns the URL as a string
    }
    return null;
  }
}
