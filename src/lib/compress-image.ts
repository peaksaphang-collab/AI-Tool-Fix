// ย่อรูปในเครื่องผู้ใช้ก่อนส่ง
//
// จำเป็นเพราะ Server Actions จำกัด request body ไว้ 1MB โดยดีฟอลต์
// (และ Vercel จำกัดที่ ~4.5MB ตายตัวอยู่แล้ว) ขณะที่รูปจากกล้องมือถือ
// ปกติ 2-6MB — ถ้าไม่ย่อ ผู้ใช้จริงจะส่งไม่ผ่านแทบทุกครั้ง
//
// ผลพลอยได้: อัปโหลดเร็วขึ้นมากบนเน็ตมือถือ ประหยัดพื้นที่เก็บ
// และลดค่าวิเคราะห์ภาพของ AI เพราะภาพเล็กลง

const MAX_EDGE = 1600; // ด้านยาวสุด — พอให้ AI เห็นรายละเอียดอุปกรณ์ที่ชำรุด
const QUALITY = 0.82;
const SKIP_UNDER_BYTES = 600 * 1024; // เล็กอยู่แล้วก็ไม่ต้องเสียเวลาเข้ารหัสใหม่

export async function compressImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= SKIP_UNDER_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // ย่อไม่สำเร็จ (เช่นเบราว์เซอร์ถอดรหัสไฟล์ไม่ได้) — ส่งไฟล์เดิมไป
    // ให้ฝั่งเซิร์ฟเวอร์เป็นคนตัดสินแทนที่จะบล็อกผู้ใช้ตรงนี้
    return file;
  }
}
