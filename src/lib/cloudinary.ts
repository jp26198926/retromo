import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary configuration for server-side uploads.
 *
 * Requires the following environment variables in .env:
 *   CLOUDINARY_CLOUD_NAME   — your Cloudinary cloud name
 *   CLOUDINARY_API_KEY      — your Cloudinary API key
 *   CLOUDINARY_API_SECRET   — your Cloudinary API secret
 *
 * You can find these in the Cloudinary console dashboard:
 *   https://console.cloudinary.com/console
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Upload a Buffer to Cloudinary using upload_stream.
 *
 * @param buffer     The file contents as a Buffer.
 * @param options    Cloudinary upload options (folder, public_id, tags, etc.)
 * @returns          The Cloudinary upload result (includes secure_url, public_id, etc.)
 */
export async function uploadBuffer(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: "image" | "video" | "raw" | "auto";
    overwrite?: boolean;
    tags?: string[];
  } = {}
): Promise<{
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.public_id,
        resource_type: options.resource_type ?? "image",
        overwrite: options.overwrite ?? true,
        tags: options.tags,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as { secure_url: string; public_id: string; [key: string]: unknown });
        }
      }
    );
    // Write the buffer to the stream and end it
    uploadStream.end(buffer);
  });
}
