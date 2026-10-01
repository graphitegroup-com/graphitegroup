// Static preview build only: serve images as-is from a relative path.
export default function previewImageLoader({ src }: { src: string; width: number; quality?: number }) {
  return src.startsWith("/") ? src.slice(1) : src;
}
