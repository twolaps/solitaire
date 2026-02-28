/**
 * 游戏全局配置与常量
 */
export const GameConfig = {
	/** 竖屏判定：高/宽 >= 该比例时用竖屏背景 */
	PORTRAIT_ASPECT: 1280 / 720,
	/** 提示晃动间隔（毫秒） */
	HINT_SHAKE_MS: 5000,
	/** 游戏开始后超过该时长（毫秒）视为成功（时间到过关） */
	SUCCESS_TIMEOUT_MS: 30000,
	/** 连续 shuffle 僵局达到此次数后，下一次 shuffle 必定可消除 */
	DEADLOCK_THRESHOLD: 2,
	/** 洗牌区每次补充的牌数量 */
	SHUFFLE_PILE_SIZE: 10,
	/** 洗牌区卡牌横向间距 */
	SHUFFLE_OFFSET_X: 25,
	/** 洗牌区卡牌起始 x */
	SHUFFLE_START_X: 50,
	/** 洗牌区卡牌 y */
	SHUFFLE_Y: 72,
	/** 卡牌飞行时 sortingOrder，保证在 handCard 之上 */
	CARD_FLY_ORDER: 1000,
} as const;
