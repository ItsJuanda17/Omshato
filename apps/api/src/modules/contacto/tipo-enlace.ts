export const TIPOS_ENLACE = ["WHATSAPP", "INSTAGRAM", "TIKTOK"] as const;
export type TipoEnlace = (typeof TIPOS_ENLACE)[number];
