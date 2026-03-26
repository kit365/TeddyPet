import '../../application/media/media_app_service.dart';

class MediaController {
  final MediaAppService _appService;

  MediaController(this._appService);

  Future<String?> uploadImage(String filePath) async {
    return await _appService.uploadImage(filePath);
  }
}
