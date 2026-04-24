export function getFileAccept(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    // */* даёт чистое меню: Камера + Галерея + Файлы без дублирования
    return '*/*';
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    // Конкретные MIME без расширений — iOS Safari не ломается, APK выбирается
    return [
      'image/*', 'video/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip', 'application/x-zip-compressed',
      'application/vnd.android.package-archive',
      'application/x-apple-diskimage',
      'application/octet-stream',
    ].join(',');
  }
  // PC: wildcards + расширения для подсветки установочных файлов в проводнике
  return 'application/*,image/*,video/*,text/plain,.apk,.dmg,.pkg,.exe,.msi,.deb,.rpm';
}
