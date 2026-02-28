import { CardView } from "../ui/components/CardView";

/** 单张牌布局配置（仅 checkSide 需要的字段：被哪些牌覆盖） */
export type CardLayoutCfg = { cover?: string[] };

/**
 * 根据覆盖关系更新每张牌的正反面：无 cover 或 cover 已全部消除则正面，否则反面
 * @param cardMap 主牌 key -> CardView 的映射
 * @param cardCfg 主牌配置（至少含 cover 字段），用于查询每张牌被谁覆盖
 */
export function checkSide(
	cardMap: Map<string, CardView>,
	cardCfg: Record<string, CardLayoutCfg>
): void {
	for (const [cfgKey, cardView] of cardMap) {
		const cfg = cardCfg[cfgKey];
		// 无覆盖列表：始终正面朝上
		if (!cfg?.cover || cfg.cover.length === 0) {
			cardView.setFront();
			continue;
		}
		// 覆盖列表中的牌若全部已消除，则当前牌翻为正面，否则背面
		const allCoverCleared = cfg.cover.every((coverKey) => {
			const coverCard = cardMap.get(coverKey);
			return coverCard ? coverCard.isClear : false;
		});
		if (allCoverCleared) {
			cardView.setFront();
		} else {
			cardView.setBack();
		}
	}
}
