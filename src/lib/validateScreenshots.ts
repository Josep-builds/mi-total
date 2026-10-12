export const MAX_FILES = 3;
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg"];

type FileLike = { type: string; size: number };

export function validateScreenshotFiles(files: FileLike[]): string[] {
  const errors: string[] = [];

  if (files.length === 0) {
    errors.push("Sube al menos una captura.");
    return errors;
  }

  if (files.length > MAX_FILES) {
    errors.push(`Máximo ${MAX_FILES} capturas.`);
  }

  if (files.some((file) => !ALLOWED_TYPES.includes(file.type))) {
    errors.push("Solo se aceptan imágenes PNG o JPEG.");
  }

  if (files.some((file) => file.size > MAX_FILE_SIZE_BYTES)) {
    errors.push("Cada imagen debe pesar 4 MB o menos.");
  }

  return errors;
}
