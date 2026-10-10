const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;

// "820 KB", "4.2 MB"
export function formatFileSize(bytes: number): string {
  if (bytes >= MEGABYTE) {
    return `${(bytes / MEGABYTE).toLocaleString('en', { maximumFractionDigits: 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / KILOBYTE)).toLocaleString('en')} KB`;
}
