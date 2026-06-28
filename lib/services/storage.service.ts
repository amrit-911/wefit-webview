/**
 * Generic file storage layer. Backed by Cloudinary for now (direct signed
 * browser upload — files never pass through our server, so there's no
 * Vercel request-body-size limit on large videos).
 *
 * Swapping providers later (Firebase Storage, S3, etc.) only requires
 * rewriting this file — call sites just use uploadFile()/deleteFile().
 */

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface UploadOptions {
  /** Pin the asset to a fixed id (e.g. a user's uid) so re-uploads overwrite instead of piling up. */
  publicId?: string;
  onProgress?: (percent: number) => void;
}

export async function uploadFile(
  file: File,
  folder: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { publicId, onProgress } = options;

  const sigRes = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, publicId }),
  });
  if (!sigRes.ok) throw new Error("Failed to get upload signature");
  const { signature, timestamp, apiKey, cloudName } = await sigRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  if (publicId) {
    formData.append("public_id", publicId);
    formData.append("overwrite", "true");
  }

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, publicId: data.public_id });
      } else {
        reject(new Error(`Cloudinary upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Cloudinary upload failed"));
    xhr.send(formData);
  });
}

export async function deleteFile(publicId: string): Promise<void> {
  await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
}
