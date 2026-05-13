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

/**
 * IP 주소 마스킹 (한국 법률 준수)
 * IPv4: 17~24비트 영역(3번째 마디) 마스킹
 */
export function maskIp(ip) {
    if (!ip) return "unknown";
    
    // IPv4
    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.***.${parts[3]}`;
        }
    }
    
    // IPv6 (보통 앞 2마디 유지)
    if (ip.includes(':')) {
        const parts = ip.split(':');
        if (parts.length > 2) {
            return `${parts[0]}:${parts[1]}:****:****`;
        }
    }
    
    return ip;
}
