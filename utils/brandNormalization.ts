export type BrandSource = {
    brand?: string;
    title?: string;
    summary?: string;
    url?: string;
    source?: string;
    model?: string;
};

const META_PATTERNS = [
    /\bother\b/i,
    /\bpolicy\b/i,
    /政策/,
    /鏀跨瓥/,
    /\brta\b/i,
    /\bdewa\b/i,
];

const BRAND_RULES: Array<{ label: string; patterns: RegExp[] }> = [
    { label: 'Changan 长安', patterns: [/\bchangan\b/i, /长安/, /闀垮畨/] },
    { label: 'Changan Deepal 深蓝', patterns: [/\bdeepal\b/i, /深蓝/] },
    { label: 'Changan AVATR 阿维塔', patterns: [/\bavatr\b/i, /阿维塔/] },
    { label: 'BYD 比亚迪', patterns: [/\bbyd\b/i, /比亚迪/, /姣斾簹杩/] },
    { label: 'BYD DENZA 腾势', patterns: [/\bdenza\b/i, /腾势/] },
    { label: 'Geely Zeekr 极氪', patterns: [/\bzeekr\b/i, /极氪/, /鏋佹蔼/] },
    { label: 'Geely Lynk & Co 领克', patterns: [/\blink\s*&\s*co\b/i, /\blynk\b/i, /领克/] },
    { label: 'Geely 吉利', patterns: [/\bgeely\b/i, /吉利/, /鍚夊埄/] },
    { label: 'Chery iCAUR', patterns: [/\bicaur\b/i, /奇瑞.*icaur/i, /iCaur/i] },
    { label: 'Chery Exeed 星途', patterns: [/\bexeed\b/i, /星途/] },
    { label: 'Chery 奇瑞', patterns: [/\bchery\b/i, /奇瑞/, /濂囩憺/] },
    { label: 'Omoda & Jaecoo', patterns: [/\bomoda\b/i, /\bjaecoo\b/i, /欧萌达/, /捷途?达/] },
    { label: 'GWM 长城', patterns: [/\bgwm\b/i, /\bhaval\b/i, /\btank\b/i, /长城/, /坦克/] },
    { label: 'Jetour 捷途', patterns: [/\bjetour\b/i, /捷途/, /鎹烽/] },
    { label: 'SAIC MG 名爵', patterns: [/\bmg\b/i, /名爵/] },
    { label: 'GAC 广汽', patterns: [/\bgac\b/i, /\baion\b/i, /广汽/, /埃安/] },
    { label: 'Toyota 丰田', patterns: [/\btoyota\b/i, /丰田/, /涓扮敯/] },
    { label: 'Nissan 日产', patterns: [/\bnissan\b/i, /日产/, /鏃ヤ骇/] },
    { label: 'Hyundai 现代', patterns: [/\bhyundai\b/i, /现代/] },
    { label: 'Kia 起亚', patterns: [/\bkia\b/i, /起亚/, /璧蜂簹/] },
    { label: 'Ford 福特', patterns: [/\bford\b/i, /福特/, /绂忕壒/] },
    { label: 'Chevrolet 雪佛兰', patterns: [/\bchevrolet\b/i, /\bchevy\b/i, /雪佛兰/] },
    { label: 'Lexus 雷克萨斯', patterns: [/\blexus\b/i, /雷克萨斯/] },
    { label: 'BMW 宝马', patterns: [/\bbmw\b/i, /宝马/] },
    { label: 'Audi 奥迪', patterns: [/\baudi\b/i, /奥迪/] },
    { label: 'Tesla 特斯拉', patterns: [/\btesla\b/i, /特斯拉/] },
    { label: 'Volvo 沃尔沃', patterns: [/\bvolvo\b/i, /沃尔沃/] },
    { label: 'Lotus 路特斯', patterns: [/\blotus\b/i, /路特斯/] },
    { label: 'Mitsubishi 三菱', patterns: [/\bmitsubishi\b/i, /三菱/] },
    { label: 'JAC 江淮', patterns: [/\bjac\b/i, /江淮/] },
    { label: 'MHERO 猛士', patterns: [/\bmhero\b/i, /猛士/] },
];

export function normalizeNewsBrand(item: BrandSource): string {
    const rawBrand = item.brand?.trim() || '';
    const haystack = [
        item.brand,
        item.title,
        item.summary,
        item.model,
        item.source,
        item.url,
    ].filter(Boolean).join(' ');

    const isMeta = !rawBrand || META_PATTERNS.some((pattern) => pattern.test(rawBrand));
    const matchedRule = BRAND_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(haystack)));
    if (matchedRule) return matchedRule.label;
    if (isMeta) return rawBrand.includes('政策') || rawBrand.includes('Policy') ? '政策相关' : 'Other 其他品牌';
    return rawBrand;
}

export const CANONICAL_BRANDS = BRAND_RULES.map((rule) => rule.label);
