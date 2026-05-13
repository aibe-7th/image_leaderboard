import sharp from "sharp";

export async function optimizeImage(fileBuffer) {
    // 이미지 최적화 (1MB 이하로 맞추기 위해 리사이징 및 WebP 변환)
    const optimizedImageBuffer = await sharp(fileBuffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    // 1MB 제한 체크
    if (optimizedImageBuffer.length > 1024 * 1024) {
        throw new Error("최적화 후에도 이미지가 1MB를 초과합니다.");
    }

    const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}.webp`;

    return { optimizedImageBuffer, fileName };
}
