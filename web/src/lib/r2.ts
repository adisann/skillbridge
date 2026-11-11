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
    // AWS SDK v3 baru menambahkan checksum otomatis yang tidak selalu didukung R2.
    // Rekomendasi Cloudflare: kirim checksum hanya bila operasi memang mewajibkannya.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
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
  if (!s3Client || !isR2Configured) {
    throw new Error("Penyimpanan CV belum dikonfigurasi. Hubungi admin untuk mengaktifkan unggahan CV.");
  }
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
    const failure = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    console.error("[R2 Upload Error]", failure.name, failure.$metadata?.httpStatusCode);
    throw new Error("Berkas CV belum berhasil disimpan. Coba unggah kembali atau hubungi admin jika masalah berlanjut.");
  }
}

/**
 * Hapus dokumen secara permanen dari Cloudflare R2 bucket privat.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!s3Client || !isR2Configured) return false;
  // Dicoba dua kali: kegagalan jaringan sesaat tidak boleh membuat CV "tidak bisa dihapus"
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      return true;
    } catch (err) {
      const e = err as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
      // Berkas sudah tidak ada = tujuan penghapusan sudah tercapai
      if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) return true;
      console.error(`[R2 Delete Error] percobaan ${attempt}:`, e.name, e.$metadata?.httpStatusCode);
    }
  }
  return false;
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
