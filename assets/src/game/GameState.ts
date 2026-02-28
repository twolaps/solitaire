import { CardView } from "../ui/components/CardView";
import { GameConfig } from "../config/GameConfig";

/**
 * 游戏状态与规则：手牌值、消除判定、僵局、胜利条件等纯逻辑
 * 不依赖 UI，便于单测与复用
 */
export class GameState {
	/** 当前手牌数字（1-13），与主牌相邻即可消除 */
	handValue: number = 0;
	/** 连续 shuffle 导致僵局的次数，达到 DEADLOCK_THRESHOLD 时下一次 shuffle 必定可消除 */
	shuffleDeadlockCount: number = 0;
	/** 第一次点击时开始计时（毫秒时间戳），用于“时间到过关”判定 */
	gameStartTime: number | null = null;
	/** 是否已游戏成功（过关），过关后不再响应点击 */
	gameSuccess: boolean = false;
	/** 是否尚未进行第一次消除，用于控制标题滑出时机（首次消除后滑出） */
	isFirstEliminate: boolean = true;

	/**
	 * 判断某张牌当前能否与手牌消除（规则：点数相邻，含 1-13 连通）
	 * @param cardValue 牌面数字 1-13
	 * @returns 能否消除
	 */
	canEliminate(cardValue: number): boolean {
		return (
			Math.abs(cardValue - this.handValue) === 1 ||
			(cardValue === 1 && this.handValue === 13) ||
			(cardValue === 13 && this.handValue === 1)
		);
	}

	/**
	 * 是否所有主牌都已消除（游戏胜利条件之一）
	 * @param cardMap 主牌 key -> CardView 的映射
	 * @returns 全部消除为 true
	 */
	isAllCleared(cardMap: Map<string, CardView>): boolean {
		for (const [, cardView] of cardMap) {
			if (!cardView.isClear) return false;
		}
		return true;
	}

	/**
	 * 是否没有任何可消除的牌（僵局：需洗牌或时间到结束）
	 * @param cardMap 主牌映射
	 * @returns 正面朝上且未消除的牌中，没有一张能与 handValue 相邻则为 true
	 */
	isDeadlock(cardMap: Map<string, CardView>): boolean {
		for (const [, cardView] of cardMap) {
			if (cardView.isClear) continue;
			if (cardView.m_ctrlSide.selectedIndex !== 0) continue; // 0 = 正面
			if (this.canEliminate(cardView.value)) return false;
		}
		return true;
	}

	/**
	 * 任选一张当前可消除的主牌（正面、未消除），用于提示晃动
	 * @param cardMap 主牌映射
	 * @returns 可消除的一张牌，若无则 null
	 */
	getOneEliminable(cardMap: Map<string, CardView>): CardView | null {
		for (const [, cardView] of cardMap) {
			if (cardView.isClear) continue;
			if (cardView.m_ctrlSide.selectedIndex !== 0) continue;
			if (this.canEliminate(cardView.value)) return cardView;
		}
		return null;
	}

	/**
	 * 返回一个与某张可见牌相邻的手牌数值，用于保证 shuffle 后必定可消除（防连续僵局）
	 * @param cardMap 主牌映射
	 * @returns 满足与某张正面牌相邻的 handValue 之一，随机；若无则 null
	 */
	getGuaranteedHandValue(cardMap: Map<string, CardView>): number | null {
		const goodValues: number[] = [];
		for (const [, cardView] of cardMap) {
			if (cardView.isClear) continue;
			if (cardView.m_ctrlSide.selectedIndex !== 0) continue;
			const v = cardView.value;
			if (v > 1) goodValues.push(v - 1);
			if (v < 13) goodValues.push(v + 1);
			if (v === 1) goodValues.push(13);
			if (v === 13) goodValues.push(1);
		}
		if (goodValues.length === 0) return null;
		return goodValues[Math.floor(Math.random() * goodValues.length)];
	}

	/**
	 * 是否已满足“时间到过关”条件（游戏开始后超过 SUCCESS_TIMEOUT_MS）
	 * @returns 已超时则 true
	 */
	isWinByTime(): boolean {
		if (this.gameStartTime == null) return false;
		const elapsed = Date.now() - this.gameStartTime;
		return elapsed >= GameConfig.SUCCESS_TIMEOUT_MS;
	}
}
