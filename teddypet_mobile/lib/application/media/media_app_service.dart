import '../data/repositories/media/media_repository.dart';

abstract class MediaAppService {
  Future<String?> uploadImage(String filePath);
}

class MediaAppServiceImpl implements MediaAppService {
  final MediaRepository _repository;

  MediaAppServiceImpl(this._repository);

  @override
  Future<String?> uploadImage(String filePath) async {
    return await _repository.uploadImage(filePath);
  }
}
