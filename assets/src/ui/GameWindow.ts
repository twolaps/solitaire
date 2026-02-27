import { tween } from "cc";
import * as fgui from "fairygui-cc";
import { cardCfg, handCardCfg } from "../config/CardConfig";
import UI_comp_Game from "../fgui/Package1/UI_comp_Game";
import { CardView } from "./components/CardView";
import { BaseWindow } from "../manager/BaseWindow";
import UI_comp_Shuffle from "../fgui/Package1/UI_comp_Shuffle";

/**
 * 绑定 comp_Game 组件的窗口
 */
export class GameWindow extends BaseWindow {
	/** comp_Game 组件引用，可在 onShown 后访问子控件 */
	public compGame: UI_comp_Game;
	public cardMap: Map<string, CardView>;
	public shuffleCardViews: CardView[] = [];
	private handValue: number = 0;
	private _titleJitterTween: { stop: () => void } | null = null;
	private _btnDownloadScaleTween: { stop: () => void } | null = null;
	private _isFirstEliminate = true;
	/** 连续 shuffle 导致僵局的次数，达到 2 时下一次 shuffle 必定可消除 */
	private _consecutiveShuffleDeadlockCount = 0;
	/** 第一次点击时开始计时 */
	private _gameStartTime: number | null = null;
	private _gameSuccess = false;
	protected onInit(): void {
			// 创建 comp_Game 实例并设置为窗口内容
			this.compGame = UI_comp_Game.createInstance();
			this.contentPane = this.compGame;
			// 让内容铺满窗口显示区域（适配不同分辨率）
			this.compGame.makeFullScreen();
	}

	protected onShown(): void {
		super.onShown();
		this.showCard();
		this.compGame.m_btnDownload.on(fgui.Event.CLICK, this.onBtnDownloadClick, this);
	}

	private onBtnDownloadClick(event: fgui.Event) {
		console.log("点击下载");
	}

	private showCard() {
		this.contentPane.touchable = false;

		this.cardMap = new Map<string, CardView>();
		this.initHandCards();
		this.initShuffleCards();
		this.compGame.m_imgTitle.visible = false;
		this.compGame.m_btnDownload.visible = false;

		let index = 0;
		for (const key in cardCfg) {
			const cfg = cardCfg[key];
			const cardView: CardView = CardView.createInstance();
			cardView.setDigital(cfg.value);
			this.cardMap.set(key, cardView);
			cardView.cfgKey = key;
			cardView.on(fgui.Event.CLICK, this.onCardClick, this);
			this.compGame.m_cardCon.addChild(cardView);
			// 起始位置在上方，通过动画飘落到目标位置
			cardView.playDropIn(cfg.pos[0], cfg.pos[1], index * 0.1);
			index++;
		} 
		this.checkSide();
		// 卡牌入场动画结束后，imgTitle 从屏幕左侧移动到中间，并允许全屏点击
		const cardCount = index;
		const cardAnimEndTime = (cardCount - 1) * 0.1 + 0.7;
		this.playTitleSlideIn(cardAnimEndTime);
		tween({}).delay(cardAnimEndTime).call(() => {
			this.contentPane.touchable = true;
		}).start();
	}

	private onCardClick(event: fgui.Event) {
		if (this._gameSuccess) return;
		if (this._gameStartTime === null) this._gameStartTime = Date.now();

		const cardView: CardView = event.sender as CardView;
		//可以消除
		if (Math.abs(cardView.value - this.handValue) === 1 ||
			(cardView.value === 1 && this.handValue === 13) ||
			(cardView.value === 13 && this.handValue === 1)) {

			this.playCardEliminate(cardView);
		}
		//不能消除
		else {
			this.contentPane.touchable = false;
			cardView.playShake(() => {
				this.contentPane.touchable = true;
			});
		}
	}

	private onShuffleCardClick(event: fgui.Event) {
		if (this._gameSuccess) return;
		if (this._gameStartTime === null) this._gameStartTime = Date.now();

		const cardView = event.sender as CardView;
		// 仅最上面一张（数组最后一个）可点击
		if (this.shuffleCardViews.length === 0 || cardView !== this.shuffleCardViews[this.shuffleCardViews.length - 1]) {
			return;
		}
		// 连续 2 次 shuffle 僵局后，下一次 shuffle 必定可消除
		if (this._consecutiveShuffleDeadlockCount >= 2) {
			const guaranteedValue = this.getGuaranteedEliminableHandValue();
			if (guaranteedValue != null) {
				cardView.setDigital(guaranteedValue);
			}
		}
		this.playShuffleCardToHand(cardView);
	}

	/** 播放卡牌消除动画：抛物线飞到 handCard，结束后隐藏并刷新布局 */
	private playCardEliminate(cardView: CardView) {
		this.contentPane.touchable = false;

		if (this._isFirstEliminate) {
			this._isFirstEliminate = false;
			this.playTitleSlideOut();
		}

		const handCard = this.compGame.m_handCard;
		const cardCon = this.compGame.m_cardCon;
		const compGame = this.compGame;

		// 将卡牌移到 compGame 根容器，避免 cardCon 裁剪导致飞行动画途中突然消失
		const cardGlobalStart = cardCon.localToGlobal(cardView.x, cardView.y);
		const startInRoot = compGame.globalToLocal(cardGlobalStart.x, cardGlobalStart.y);
		const handCenterGlobal = handCard.localToGlobal(handCard.width / 2, handCard.height / 2);
		const endInRoot = compGame.globalToLocal(handCenterGlobal.x, handCenterGlobal.y);
		const endX = endInRoot.x - cardView.width / 2;
		const endY = endInRoot.y - cardView.height / 2;

		cardCon.removeChild(cardView);
		compGame.addChild(cardView);
		cardView.setPosition(startInRoot.x, startInRoot.y);
		cardView.sortingOrder = 1000; // 确保飞行的卡牌显示在 handCard 上方，不被遮挡

		cardView.playThrowToHand(endX, endY, () => {
			this.handValue = cardView.value;
			CardView.setDigitalLoader(handCard.m_typeLoader, this.handValue, cardView.suit);
			cardView.isClear = true;
			cardView.visible = false;
			this._consecutiveShuffleDeadlockCount = 0; // 消除主牌时重置连续僵局计数
			this.checkSide();

			const elapsed = this._gameStartTime != null ? Date.now() - this._gameStartTime : 0;
			const isSuccess = !this._gameSuccess && (this.isAllCardsCleared() || elapsed >= 30000);
			if (isSuccess) {
				this._gameSuccess = true;
				this.onGameSuccess();
			} else {
				// 检查是否都不能消除，若僵局则切换到第二个引导并播放滑入+抖动动画（若第二个引导已居中则无视）
				if (this.isNoEliminableCard() && this.compGame.m_ctrlGuide.selectedIndex !== 1) {
					this.compGame.m_ctrlGuide.selectedIndex = 1;
					this.playTitleSlideIn(0);
				}
				this.contentPane.touchable = true;
			}
		});
	}

	/** 洗牌区 top 牌：翻面 + 平移到手牌，更新手牌数值 */
	private playShuffleCardToHand(cardView: CardView) {
		this.contentPane.touchable = false;

		const shuffleArea = this.compGame.m_shuffleArea;
		const handCard = this.compGame.m_handCard;
		const compGame = this.compGame;

		// 移到根容器，避免遮挡和裁剪
		const cardGlobalStart = shuffleArea.localToGlobal(cardView.x, cardView.y);
		const startInRoot = compGame.globalToLocal(cardGlobalStart.x, cardGlobalStart.y);
		const handCenterGlobal = handCard.localToGlobal(handCard.width / 2, handCard.height / 2);
		const endInRoot = compGame.globalToLocal(handCenterGlobal.x, handCenterGlobal.y);
		const endX = endInRoot.x - cardView.width / 2;
		const endY = endInRoot.y - cardView.height / 2;

		shuffleArea.removeChild(cardView);
		compGame.addChild(cardView);
		cardView.setPosition(startInRoot.x, startInRoot.y);
		cardView.sortingOrder = 1000;

		cardView.playFlipAndSlideToHand(endX, endY, () => {
			this.handValue = cardView.value;
			CardView.setDigitalLoader(handCard.m_typeLoader, this.handValue, cardView.suit);
			compGame.removeChild(cardView);

			// 从洗牌区移除已使用的牌
			const idx = this.shuffleCardViews.indexOf(cardView);
			if (idx >= 0) this.shuffleCardViews.splice(idx, 1);
			// 新的 top 牌可点击；若洗牌区已空则重新补充
			if (this.shuffleCardViews.length > 0) {
				for (let i = 0; i < this.shuffleCardViews.length; i++) {
					this.shuffleCardViews[i].touchable = (i === this.shuffleCardViews.length - 1);
				}
			} else {
				this.initShuffleCards();
			}

			this.checkSide();
			// 更新连续 shuffle 僵局计数
			if (this.isNoEliminableCard()) {
				this._consecutiveShuffleDeadlockCount++;
			} else {
				this._consecutiveShuffleDeadlockCount = 0;
			}
			// 若僵局则切换到第二个引导（若第二个引导已居中则无视）
			if (this.isNoEliminableCard() && this.compGame.m_ctrlGuide.selectedIndex !== 1) {
				this.compGame.m_ctrlGuide.selectedIndex = 1;
				this.playTitleSlideIn(0);
			}
			// 第二个引导正在屏幕中间时，shuffle 后若查到有牌可消除，则移出引导
			else if (this.compGame.m_ctrlGuide.selectedIndex === 1 && !this.isNoEliminableCard()) {
				this.playTitleSlideOut();
			}
			this.contentPane.touchable = true;
		});
	}

	/** 返回一个与某张可见牌相邻的手牌数值，用于保证 shuffle 后必定可消除；若无可消除牌则返回 null */
	private getGuaranteedEliminableHandValue(): number | null {
		const goodValues: number[] = [];
		for (const [, cardView] of this.cardMap) {
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

	/** 根据配置初始化手牌上显示的数字 */
	private initHandCards() {
		const handCard = this.compGame.m_handCard;
		if (!handCard) return;
		this.handValue = handCardCfg.initialValue;
		CardView.setDigitalLoader(handCard.m_typeLoader, this.handValue);
	}

	/** imgTitle 从屏幕左侧滑入到中间，到达后持续上下小幅度抖动 */
	private playTitleSlideIn(delay: number) {
		this._titleJitterTween?.stop();
		this._titleJitterTween = null;

		const img = this.compGame.m_imgTitle;
		img.visible = true;
		const startX = -img.width;
		const centerX = (this.compGame.width - img.width) / 2;
		const baseY = img.y;

		img.setPosition(startX, baseY);

		const state = { x: startX };
		tween(state)
			.delay(delay)
			.to(0.5, { x: centerX }, {
				easing: "backOut",
				onUpdate: () => {
					img.setPosition(state.x, baseY);
				}
			})
			.call(() => this.playTitleJitter(img, centerX, baseY))
			.start();
	}

	/** imgTitle 到达中心后持续的上下小幅度抖动 */
	private playTitleJitter(img: fgui.GObject, centerX: number, baseY: number) {
		const amplitude = 4;
		const state = { y: baseY };
		const updatePos = () => img.setPosition(centerX, state.y);

		this._titleJitterTween = tween(state)
			.to(0.3, { y: baseY + amplitude }, { easing: "sineInOut", onUpdate: updatePos })
			.to(0.3, { y: baseY - amplitude }, { easing: "sineInOut", onUpdate: updatePos })
			.union()
			.repeatForever()
			.start();
	}

	/** imgTitle 从中心向右飘出，与 SlideIn 完全对称 */
	private playTitleSlideOut() {
		this._titleJitterTween?.stop();
		this._titleJitterTween = null;

		const img = this.compGame.m_imgTitle;
		const centerX = (this.compGame.width - img.width) / 2;
		const endX = this.compGame.width;
		const baseY = img.y;

		img.setPosition(centerX, baseY);

		const state = { x: centerX };
		tween(state)
			.to(0.5, { x: endX }, {
				easing: "backIn",
				onUpdate: () => {
					img.setPosition(state.x, baseY);
				}
			})
			.call(() => {
				this.compGame.m_ctrlGuide.selectedIndex = 0;
				this.compGame.m_imgTitle.visible = false;
			})
			.start();
	}

	/**
	 * 判断某张牌当前能否与手牌消除（相邻即可：1-2、12-13、1-13 等）
	 */
	private canEliminate(cardValue: number): boolean {
		return Math.abs(cardValue - this.handValue) === 1 ||
			(cardValue === 1 && this.handValue === 13) ||
			(cardValue === 13 && this.handValue === 1);
	}

	/** 是否所有卡牌都已消除（游戏胜利） */
	private isAllCardsCleared(): boolean {
		for (const [, cardView] of this.cardMap) {
			if (!cardView.isClear) return false;
		}
		return true;
	}

	/** 游戏成功：禁用所有卡牌和 shuffle、隐藏 guide、播放入场动效 */
	private onGameSuccess() {
		// 所有主牌禁止点击
		this.compGame.m_cardCon.touchable = false;
		for (const [, cardView] of this.cardMap) {
			cardView.touchable = false;
		}
		// 洗牌区域禁止点击
		this.compGame.m_shuffleArea.touchable = false;
		for (const card of this.shuffleCardViews) {
			card.touchable = false;
		}

		// 不显示任何 guide
		this._titleJitterTween?.stop();
		this._titleJitterTween = null;
		this.compGame.m_imgTitle.visible = false;
		this.compGame.m_ctrlGuide.selectedIndex = 0;

		this.playBtnDownloadSlideIn();
		this.contentPane.touchable = true;
	}

	/** btnDownload 从屏幕外飘入中间，到达后循环缩放（锚点为图片中心） */
	private playBtnDownloadSlideIn() {
		const btn = this.compGame.m_btnDownload;
		btn.visible = true;

		const startX = -btn.width / 2;
		const centerX = this.compGame.width / 2;
		const baseY = btn.y;

		btn.setPosition(startX, baseY);

		const state = { x: startX };
		tween(state)
			.to(0.5, { x: centerX }, {
				easing: "backOut",
				onUpdate: () => {
					btn.setPosition(state.x, baseY);
				}
			})
			.call(() => this.playBtnDownloadScaleLoop())
			.start();
	}

	/** btnDownload 到达中间后的循环缩放变大变小（锚点为中心，缩放时中心不变） */
	private playBtnDownloadScaleLoop() {
		const btn = this.compGame.m_btnDownload;
		const centerX = this.compGame.width / 2;
		const baseY = btn.y;
		const minScale = 1;
		const maxScale = 1.15;
		const duration = 0.4;

		const state = { scale: minScale };
		this._btnDownloadScaleTween = tween(state)
			.to(duration, { scale: maxScale }, {
				easing: "sineInOut",
				onUpdate: () => {
					btn.setScale(state.scale, state.scale);
					btn.setPosition(centerX, baseY);
				}
			})
			.to(duration, { scale: minScale }, {
				easing: "sineInOut",
				onUpdate: () => {
					btn.setScale(state.scale, state.scale);
					btn.setPosition(centerX, baseY);
				}
			})
			.union()
			.repeatForever()
			.start();
	}

	/**
	 * 遍历所有正面朝上且未消除的卡片，检查是否都不能消除
	 * @returns true 表示没有任何可消除的牌（游戏僵局/需洗牌或结束）
	 */
	isNoEliminableCard(): boolean {
		for (const [, cardView] of this.cardMap) {
			if (cardView.isClear) continue;
			if (cardView.m_ctrlSide.selectedIndex !== 0) continue; // 0 = 正面
			if (this.canEliminate(cardView.value)) return false;
		}
		return true;
	}

	private checkSide() {
		for (const [cfgKey, cardView] of this.cardMap) {
			const cfg = cardCfg[cfgKey];
			// cover 为空：正面 (0)
			if (!cfg.cover || cfg.cover.length === 0) {
				cardView.setFront();
				continue;
			}
			// cover 有值：仅当 cover 中所有牌都 isClear 才正面，否则反面
			const allCoverCleared = cfg.cover.every(coverKey => {
				const coverCard = this.cardMap.get(coverKey);
				return coverCard ? coverCard.isClear : false;
			});

			if (allCoverCleared) {
				cardView.setFront();
			} else {
				cardView.setBack();
			}
		}
	}

	/**
	 * 初始化洗牌区域
	 */
	private initShuffleCards() {

		this.shuffleCardViews = [];

		for (let i = 0; i < 10; i++) {
			const cardView: CardView = CardView.createInstance();
			const value: number = Math.floor(Math.random() * 13) + 1;
			cardView.setDigital(value);
			this.shuffleCardViews.push(cardView);
			this.compGame.m_shuffleArea.addChild(cardView);
			cardView.setBack();
			cardView.x = 50 + i * 25;
			cardView.y = 72;
			cardView.on(fgui.Event.CLICK, this.onShuffleCardClick, this);
		}

		// 仅最上面一张牌可点击
		for (let i = 0; i < this.shuffleCardViews.length; i++) {
			this.shuffleCardViews[i].touchable = (i === this.shuffleCardViews.length - 1);
		}
	}
}