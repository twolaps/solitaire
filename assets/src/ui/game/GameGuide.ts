import * as fgui from "fairygui-cc";
import UI_comp_Game from "../../fgui/Package1/UI_comp_Game";
import { CardView } from "../components/CardView";
import { GameConfig } from "../../config/GameConfig";

/**
 * 负责首次消除引导、箭头指向、5 秒提示晃动计时
 * 不直接依赖 GameWindow，通过回调和 compGame 操作 UI
 */
export class GameGuide {
	/** 主游戏 UI 根组件，用于访问 mask、箭头等 */
	private _compGame: UI_comp_Game;
	/** 首次消除引导时高亮的那张可消除牌，消除后置空 */
	private _firstGuideCardView: CardView | null = null;
	/** 5 秒提示晃动的 setTimeout 句柄，用于清除 */
	private _hintTimerId: ReturnType<typeof setTimeout> | null = null;

	constructor(compGame: UI_comp_Game) {
		this._compGame = compGame;
	}

	/**
	 * 获取当前首次引导指向的卡牌（若有）
	 * @returns 引导牌或 null
	 */
	getGuideCard(): CardView | null {
		return this._firstGuideCardView;
	}

	/**
	 * 首次消除新手引导：显示 mask，将可消除牌提到 mask 上方，显示箭头并播放动画
	 * @param cardView 要引导玩家点击的那张可消除牌
	 */
	showFirstGuide(cardView: CardView): void {
		const compGame = this._compGame;
		const cardCon = compGame.m_cardCon;
		compGame.m_mask.visible = true;
		// 将牌从牌容器坐标转到 compGame 坐标，以便移到 mask 上方后位置不变
		const cardGlobal = cardCon.localToGlobal(cardView.x, cardView.y);
		const inComp = compGame.globalToLocal(cardGlobal.x, cardGlobal.y);
		cardCon.removeChild(cardView);
		const maskIndex = compGame.getChildIndex(compGame.m_mask);
		compGame.addChildAt(cardView, maskIndex + 1);
		cardView.setPosition(inComp.x, inComp.y);
		this._firstGuideCardView = cardView;
		this.showArrowAboveCard(cardView);
	}

	/** 关闭首次消除引导：隐藏 mask、隐藏箭头并停止动画，清空引导牌引用 */
	dismissFirstGuide(): void {
		this._compGame.m_mask.visible = false;
		this.hideCompArrow();
		this._firstGuideCardView = null;
	}

	/**
	 * 将箭头定位到指定卡牌（已在 compGame 内）上方并显示、播放 move 动画
	 * @param cardView 目标卡牌
	 */
	showArrowAboveCard(cardView: CardView): void {
		const arrow = this._compGame.m_compArrow;
		const gap = 30;
		const centerX = cardView.x;
		const arrowY = cardView.y - arrow.height - gap;
		arrow.setPosition(centerX - arrow.width / 2, arrowY);
		arrow.visible = true;
		arrow.m_move.play(null, -1, 0);
	}

	/**
	 * 将箭头定位到洗牌区最右边一张牌上方并显示、播放 move 动画（引导玩家点洗牌）
	 * @param shuffleCardViews 洗牌区卡牌数组，取最后一张为参考位置
	 */
	showArrowAboveShuffle(shuffleCardViews: CardView[]): void {
		if (shuffleCardViews.length === 0) return;
		const arrow = this._compGame.m_compArrow;
		const shuffleArea = this._compGame.m_shuffleArea;
		const compGame = this._compGame;
		const gap = 15;
		const rightmostCard = shuffleCardViews[shuffleCardViews.length - 1];
		const cardCenterX = rightmostCard.x;
		const cardTopY = rightmostCard.y;
		const global = shuffleArea.localToGlobal(cardCenterX, cardTopY);
		const inComp = compGame.globalToLocal(global.x, global.y);
		arrow.setPosition(inComp.x - arrow.width / 2, inComp.y - arrow.height - gap);
		arrow.visible = true;
		arrow.m_move.play(null, -1, 0);
	}

	/** 隐藏箭头并停止 move 动画 */
	hideCompArrow(): void {
		this._compGame.m_compArrow.m_move.stop();
		this._compGame.m_compArrow.visible = false;
	}

	/** 停止 5 秒提示晃动计时，清除定时器 */
	stopHintTimer(): void {
		if (this._hintTimerId != null) {
			clearTimeout(this._hintTimerId);
			this._hintTimerId = null;
		}
	}

	/**
	 * 若应显示提示则启动 5 秒计时，到点后晃动一张可消除牌并重复
	 * @param isActive 是否应运行提示（如未成功、非僵局、无首次引导）
	 * @param getCard 获取一张可消除的牌，用于晃动
	 */
	startHintTimer(isActive: () => boolean, getCard: () => CardView | null): void {
		this.stopHintTimer();
		if (!isActive()) return;
		this._hintTimerId = setTimeout(() => this._onHintTick(isActive, getCard), GameConfig.HINT_SHAKE_MS);
	}

	/**
	 * 提示计时到点：晃动一张可消除牌，并再次预约下一次
	 * @param isActive 是否仍应运行提示
	 * @param getCard 获取可消除牌
	 */
	private _onHintTick(isActive: () => boolean, getCard: () => CardView | null): void {
		this._hintTimerId = null;
		if (!isActive()) return;
		const card = getCard();
		if (card) card.playShake();
		this._hintTimerId = setTimeout(() => this._onHintTick(isActive, getCard), GameConfig.HINT_SHAKE_MS);
	}
}
