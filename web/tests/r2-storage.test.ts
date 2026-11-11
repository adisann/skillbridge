import { test } from "node:test";
import { equal, rejects } from "node:assert/strict";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

process.env.R2_ACCOUNT_ID = "11111111111111111111111111111111";
process.env.R2_ACCESS_KEY_ID = "test-access-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
process.env.R2_BUCKET_NAME = "test-resumes";
const { uploadToR2, deleteFromR2 } = await import("../src/lib/r2.ts");

test("Unggahan R2 yang gagal tidak menghasilkan referensi berkas sukses", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(S3Client.prototype, "send", async () => { throw new Error("TLS handshake failed"); });
  await rejects(uploadToR2(Buffer.from("test"), "resumes/test/cv.pdf", "application/pdf"), /belum berhasil disimpan/);
});

test("Penghapusan R2 mengirim key berkas yang diminta", async (t) => {
  const send = t.mock.method(S3Client.prototype, "send", async (command: DeleteObjectCommand) => {
    equal(command instanceof DeleteObjectCommand, true);
    equal(command.input.Bucket, "test-resumes");
    equal(command.input.Key, "resumes/test/cv.pdf");
    return {};
  });
  equal(await deleteFromR2("resumes/test/cv.pdf"), true);
  equal(send.mock.callCount(), 1);
});

test("Berkas R2 yang sudah tidak ada tetap dianggap berhasil dihapus", async (t) => {
  t.mock.method(S3Client.prototype, "send", async () => {
    throw Object.assign(new Error("Not found"), { name: "NoSuchKey", $metadata: { httpStatusCode: 404 } });
  });
  equal(await deleteFromR2("resumes/test/cv.pdf"), true);
});

test("Kegagalan R2 tidak dilaporkan sebagai penghapusan sukses", async (t) => {
  t.mock.method(console, "error", () => {});
  const send = t.mock.method(S3Client.prototype, "send", async () => { throw new Error("Connection failed"); });
  equal(await deleteFromR2("resumes/test/cv.pdf"), false);
  equal(send.mock.callCount(), 2);
});
