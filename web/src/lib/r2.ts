import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "skillbridge-resumes";

const isR2Configured =
  Boolean(accountId && accessKeyId && secretAccessKey) &&
  !accountId?.includes("your-") &&
  !accessKeyId?.includes("your-");

let s3Client: S3Client | null = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

/**
 * Upload berkas dokumen ke Cloudflare R2 bucket privat.
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; presignedUrl: string }> {
  if (s3Client && isR2Configured) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      // Generate signed URL privat (berlaku 2 jam)
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 7200 });

      return { key, presignedUrl };
    } catch (err) {
      console.error("[R2 Upload Error]", err);
    }
  }

  // Fallback storage signed URL bila R2 belum dikonfigurasi
  // NFR-03 & Kejujuran Data: Jangan mengembalikan URL R2 fiktif
  return { key, presignedUrl: "" };
}

/**
 * Hapus dokumen secara permanen dari Cloudflare R2 bucket privat.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (s3Client && isR2Configured) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
      return true;
    } catch (err) {
      console.error("[R2 Delete Error]", err);
      return false;
    }
  }
  return true;
}


/** Awalan key R2 yang sah untuk satu pengguna: resumes/<userId>/ */
export function resumeKeyPrefix(userId: string): string {
  return `resumes/${userId}/`;
}

/**
 * Mengembalikan key R2 hanya jika berada di folder milik pengguna tersebut.
 * Menerima key mentah ("resumes/<id>/x.pdf") atau bentuk tersimpan ("r2://resumes/<id>/x.pdf").
 * Nilai lain (milik orang lain, traversal, kosong) menghasilkan null.
 */
export function ownedResumeKey(userId: string, candidate: unknown): string | null {
  if (typeof candidate !== "string") return null;
  const key = candidate.startsWith("r2://") ? candidate.slice("r2://".length) : candidate;
  if (key.includes("..") || key.includes("//") || key.includes("\\")) return null;
  return key.startsWith(resumeKeyPrefix(userId)) && key.length > resumeKeyPrefix(userId).length ? key : null;
}
