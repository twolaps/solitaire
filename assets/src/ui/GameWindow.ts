import { tween, screen, sys } from "cc";
import * as fgui from "fairygui-cc";
import { cardCfg, handCardCfg } from "../config/CardConfig";
import UI_comp_Game from "../fgui/Package1/UI_comp_Game";
import { CardView } from "./components/CardView";
import { BaseWindow } from "../manager/BaseWindow";
import { AudioManager } from "../manager/AudioManager";
import { GameState } from "../game/GameState";
import { GameConfig } from "../config/GameConfig";
import { checkSide } from "../game/BoardLayout";
import type { CardLayoutCfg } from "../game/BoardLayout";
import { GameGuide } from "./game/GameGuide";
import { TitleAnimator } from "./game/TitleAnimator";
import { StartScreenAnimator } from "./game/StartScreenAnimator";

/**
 * 游戏主窗口：绑定 comp_Game 组件，负责组装游戏 UI 与各子模块（状态、引导、动画）
 * 生命周期：onInit -> onShown -> [用户操作] -> onHide，在 onHide 中统一清理事件与定时器
 */
export class GameWindow extends BaseWindow {
	/** 主游戏 UI 根组件（FairyGUI 导出的 comp_Game），可访问牌桌、手牌、洗牌区、标题等 */
	public compGame!: UI_comp_Game;
	/** 主牌 key（如 card1）-> CardView 的映射，用于点击判定与正反面更新 */
	public cardMap!: Map<string, CardView>;
	/** 洗牌区卡牌数组，最后一张为当前可点击的 top 牌 */
	public shuffleCardViews: CardView[] = [];

	/** 游戏状态与规则（手牌值、消除判定、僵局、胜利） */
	private _gameState!: GameState;
	/** 引导与提示（首次消除引导、箭头、5秒晃动计时） */
	private _guide!: GameGuide;
	/** 标题滑入滑出与抖动 */
	private _titleAnimator!: TitleAnimator;
	/** 开始界面与下载按钮的循环/入场动画 */
	private _startScreenAnimator!: StartScreenAnimator;

	/** 窗口 resize 回调（绑定 this，便于 removeEventListener） */
	private _onResize = () => this.onWindowResize();
	/** 开始界面全屏点击回调（点击后开始游戏） */
	private _onStartClick = () => this.onStartScreenClick();

	/** 窗口已隐藏时置为 true，延迟回调中检查以避免在隐藏后继续执行逻辑 */
	private _hidden = false;

	protected onInit(): void {
		this.compGame = UI_comp_Game.createInstance();
		this.contentPane = this.compGame;
		this.compGame.makeFullScreen();

		this._gameState = new GameState();
		this._guide = new GameGuide(this.compGame);
		this._titleAnimator = new TitleAnimator(this.compGame);
		this._startScreenAnimator = new StartScreenAnimator(this.compGame);
	}

	protected onShown(): void {
		super.onShown();
		this._hidden = false;
		// 初始隐藏标题、下载按钮、箭头、遮罩
		this.compGame.m_imgTitle.visible = false;
		this.compGame.m_btnDownload.visible = false;
		this.compGame.m_compArrow.m_move.stop();
		this.compGame.m_compArrow.visible = false;
		this.compGame.m_mask.visible = false;

		this.updateBgVisibility();
		// 非移动端监听 resize，Web 用 window，其它用 screen
		if (!sys.isMobile) {
			if (sys.isBrowser && typeof window !== "undefined") {
				window.addEventListener("resize", this._onResize);
			} else {
				screen.on("window-resize", this.onWindowResize, this);
			}
		}

		// 显示开始界面：红心 1 牌 + 呼吸与手指摆动，全屏点击进入游戏
		this.compGame.m_comStart.visible = true;
		this.compGame.m_comStart.m_startCard.m_typeLoader.url =
			fgui.UIPackage.getItemURL("Package1", "heart_1");
		this._startScreenAnimator.playStartCardLoop();
		this._startScreenAnimator.playFingerSwayLoop();
		this.contentPane.on(fgui.Event.CLICK, this._onStartClick, this);
	}

	/** 开始界面点击：移除点击监听、停止动画、开始界面向上飞出后调用 startGame */
	private onStartScreenClick(): void {
		this.contentPane.off(fgui.Event.CLICK, this._onStartClick, this);
		this._startScreenAnimator.stopAll();
		this.compGame.m_comStart.m_imgFinger.visible = false;

		const comStart = this.compGame.m_comStart;
		const startY = comStart.y;
		const endY = -comStart.height - 150;

		const state = { y: startY };
		tween(state)
			.to(0.3, { y: endY }, {
				easing: "backIn",
				onUpdate: () => {
					comStart.y = state.y;
				},
			})
			.call(() => this.startGame())
			.start();
	}

	/** 点击后正式开始：隐藏开始界面、发牌、绑定下载按钮点击 */
	private startGame(): void {
		this._startScreenAnimator.stopAll();
		this.contentPane.off(fgui.Event.CLICK, this._onStartClick, this);
		this.compGame.m_comStart.visible = false;
		this.compGame.m_comStart.m_imgFinger.visible = true;
		this.compGame.m_comStart.y = 0;
		this.showCard();
		this.compGame.m_btnDownload.on(fgui.Event.CLICK, this.onBtnDownloadClick, this);
	}

	protected onHide(): void {
		super.onHide();
		this._hidden = true;
		this._guide.stopHintTimer();
		this._titleAnimator.stopJitter();
		this.contentPane.off(fgui.Event.CLICK, this._onStartClick, this);
		this.compGame.m_btnDownload.off(fgui.Event.CLICK, this.onBtnDownloadClick, this);
		// 移除主牌与洗牌区每张牌的点击监听
		if (this.cardMap) {
			for (const [, cardView] of this.cardMap) {
				cardView.off(fgui.Event.CLICK, this.onCardClick, this);
			}
		}
		for (const card of this.shuffleCardViews) {
			card.off(fgui.Event.CLICK, this.onShuffleCardClick, this);
		}
		this._startScreenAnimator.stopAll();
		if (!sys.isMobile) {
			if (sys.isBrowser && typeof window !== "undefined") {
				window.removeEventListener("resize", this._onResize);
			} else {
				screen.off("window-resize", this.onWindowResize, this);
			}
		}
	}

	/** 窗口尺寸变化时根据宽高比更新背景显示（竖屏/横屏） */
	private onWindowResize(): void {
		this.updateBgVisibility();
	}

	/**
	 * 获取当前可见区域尺寸（Web 端 screen.windowSize 可能不随 resize 更新）
	 * @returns { width, height }
	 */
	private getViewportSize(): { width: number; height: number } {
		if (sys.isBrowser && typeof window !== "undefined") {
			return { width: window.innerWidth, height: window.innerHeight };
		}
		return screen.windowSize;
	}

	/** 根据屏幕宽高比切换 bg（竖屏）/ bg2（横屏），并水平居中 */
	private updateBgVisibility(): void {
		const { width, height } = this.getViewportSize();
		const isLandscape = height / width < GameConfig.PORTRAIT_ASPECT;
		this.compGame.m_bg.visible = !isLandscape;
		this.compGame.m_bg2.visible = isLandscape;

		const parentW = this.compGame.width;
		this.compGame.m_bg.setPosition((parentW - this.compGame.m_bg.width) / 2, this.compGame.m_bg.y);
		this.compGame.m_bg2.setPosition((parentW - this.compGame.m_bg2.width) / 2, this.compGame.m_bg2.y);
	}

	/** 下载按钮点击（当前仅打 log，可扩展为跳转商店等） */
	private onBtnDownloadClick(_event: fgui.Event): void {
		console.log("点击下载");
	}

	/**
	 * 发牌：按配置创建主牌并飘落、初始化手牌与洗牌区、播发牌音效；
	 * 根据 cover 更新正反面；入场动画结束后滑入标题，若有可消除牌则显示首次引导或启动提示计时
	 */
	private showCard(): void {
		this.contentPane.touchable = false;
		this.cardMap = new Map<string, CardView>();
		this.initHandCards();
		this.initShuffleCards();

		let index = 0;
		for (const key in cardCfg) {
			const cfg = cardCfg[key];
			const cardView = CardView.createInstance();
			cardView.setDigital(cfg.value);
			this.cardMap.set(key, cardView);
			cardView.cfgKey = key;
			cardView.on(fgui.Event.CLICK, this.onCardClick, this);
			this.compGame.m_cardCon.addChild(cardView);
			cardView.playDropIn(cfg.pos[0], cfg.pos[1], index * 0.1);
			index++;
		}
		AudioManager.inst.playSFXByName("Package1", "deal", 1, 2);
		checkSide(this.cardMap, cardCfg as Record<string, CardLayoutCfg>);

		// 最后一张牌入场结束时间 = (n-1)*0.1 + 0.7
		const cardCount = index;
		const cardAnimEndTime = (cardCount - 1) * 0.1 + 0.7;
		this._titleAnimator.playTitleSlideIn(cardAnimEndTime);
		tween({}).delay(cardAnimEndTime).call(() => {
			if (this._hidden) return;
			this.contentPane.touchable = true;
			const guideCard = this._gameState.getOneEliminable(this.cardMap);
			if (guideCard) {
				this._guide.showFirstGuide(guideCard);
			} else {
				this.startHintTimer();
			}
		}).start();
	}

	/**
	 * 主牌点击：若已过关或未开始计时则忽略；若与手牌相邻则消除并飞向手牌，否则播错误音效并晃动
	 */
	private onCardClick(event: fgui.Event): void {
		if (this._gameState.gameSuccess) return;
		if (this._gameState.gameStartTime === null) this._gameState.gameStartTime = Date.now();

		const cardView = event.sender as CardView;
		if (this._gameState.canEliminate(cardView.value)) {
			this.playCardEliminate(cardView);
			AudioManager.inst.playSFXByName("Package1", "move");
		} else {
			this.contentPane.touchable = false;
			AudioManager.inst.playSFXByName("Package1", "error");
			cardView.playShake(() => {
				if (!this._hidden) this.contentPane.touchable = true;
			});
		}
	}

	/**
	 * 洗牌区点击：仅最上面一张可点；若连续僵局达到阈值则保证下一张必可消除（改牌面）；然后执行洗牌到手牌动画
	 */
	private onShuffleCardClick(event: fgui.Event): void {
		if (this._gameState.gameSuccess) return;
		if (this._gameState.gameStartTime === null) this._gameState.gameStartTime = Date.now();

		const cardView = event.sender as CardView;
		if (this.shuffleCardViews.length === 0 || cardView !== this.shuffleCardViews[this.shuffleCardViews.length - 1]) {
			return;
		}
		if (this._gameState.shuffleDeadlockCount >= GameConfig.DEADLOCK_THRESHOLD) {
			const guaranteedValue = this._gameState.getGuaranteedHandValue(this.cardMap);
			if (guaranteedValue != null) {
				cardView.setDigital(guaranteedValue);
			}
		}
		this.playShuffleToHand(cardView);
	}

	/**
	 * 播放主牌消除动画：牌抛物线飞向手牌，结束后更新手牌值、标记已消除、刷新正反面；
	 * 若全部消除或时间到则过关；否则若僵局则切到洗牌引导并滑入标题，最后恢复点击与提示计时
	 * @param cardView 被点击消除的那张主牌
	 */
	private playCardEliminate(cardView: CardView): void {
		this.contentPane.touchable = false;
		this._guide.stopHintTimer();
		if (cardView === this._guide.getGuideCard()) {
			this._guide.dismissFirstGuide();
		}

		// 首次消除时滑出标题并隐藏首次引导
		if (this._gameState.isFirstEliminate) {
			this._gameState.isFirstEliminate = false;
			this._titleAnimator.playTitleSlideOut(() => {
				this.compGame.m_ctrlGuide.selectedIndex = 0;
				this.compGame.m_imgTitle.visible = false;
				this._guide.hideCompArrow();
			});
		}

		const handCard = this.compGame.m_handCard;
		const cardCon = this.compGame.m_cardCon;
		const compGame = this.compGame;

		// 计算牌当前在 compGame 下的坐标（可能在 cardCon 或已在 compGame）
		let startInRoot: { x: number; y: number };
		if (cardView.parent === compGame) {
			startInRoot = { x: cardView.x, y: cardView.y };
		} else {
			const cardGlobalStart = cardCon.localToGlobal(cardView.x, cardView.y);
			startInRoot = compGame.globalToLocal(cardGlobalStart.x, cardGlobalStart.y);
		}
		const handCenterGlobal = handCard.localToGlobal(handCard.width / 2, handCard.height / 2);
		const endInRoot = compGame.globalToLocal(handCenterGlobal.x, handCenterGlobal.y);
		const endX = endInRoot.x - cardView.width / 2;
		const endY = endInRoot.y - cardView.height / 2;

		// 移到 compGame 下并置顶，避免被裁剪
		const parent = cardView.parent;
		if (parent) parent.removeChild(cardView);
		compGame.addChild(cardView);
		cardView.setPosition(startInRoot.x, startInRoot.y);
		cardView.sortingOrder = GameConfig.CARD_FLY_ORDER;

		cardView.playThrowToHand(endX, endY, () => {
			if (this._hidden) return;
			this._gameState.handValue = cardView.value;
			CardView.setDigitalLoader(handCard.m_typeLoader, this._gameState.handValue, cardView.suit);
			cardView.isClear = true;
			cardView.visible = false;
			this._gameState.shuffleDeadlockCount = 0;
			checkSide(this.cardMap, cardCfg as Record<string, CardLayoutCfg>);

			const isSuccess =
				!this._gameState.gameSuccess &&
				(this._gameState.isAllCleared(this.cardMap) || this._gameState.isWinByTime());
			if (isSuccess) {
				this._gameState.gameSuccess = true;
				this.onGameSuccess();
			} else {
				// 僵局时切换到洗牌引导（标题滑入、箭头指洗牌区）
				if (this._gameState.isDeadlock(this.cardMap) && this.compGame.m_ctrlGuide.selectedIndex !== 1) {
					this.compGame.m_ctrlGuide.selectedIndex = 1;
					this._guide.showArrowAboveShuffle(this.shuffleCardViews);
					this._titleAnimator.playTitleSlideIn(0);
				}
				this.contentPane.touchable = true;
				this.startHintTimer();
			}
		});
	}

	/**
	 * 洗牌区顶牌飞向手牌：翻面+平移动画，结束后更新手牌、从洗牌区移除、刷新正反面与僵局计数；
	 * 若僵局则切洗牌引导，若本在洗牌引导且已有牌可消则滑出标题；最后恢复点击与提示计时
	 * @param cardView 洗牌区被点击的那张牌
	 */
	private playShuffleToHand(cardView: CardView): void {
		this.contentPane.touchable = false;
		this._guide.hideCompArrow();
		this._guide.stopHintTimer();

		const shuffleArea = this.compGame.m_shuffleArea;
		const handCard = this.compGame.m_handCard;
		const compGame = this.compGame;

		const cardGlobalStart = shuffleArea.localToGlobal(cardView.x, cardView.y);
		const startInRoot = compGame.globalToLocal(cardGlobalStart.x, cardGlobalStart.y);
		const handCenterGlobal = handCard.localToGlobal(handCard.width / 2, handCard.height / 2);
		const endInRoot = compGame.globalToLocal(handCenterGlobal.x, handCenterGlobal.y);
		const endX = endInRoot.x - cardView.width / 2;
		const endY = endInRoot.y - cardView.height / 2;

		shuffleArea.removeChild(cardView);
		compGame.addChild(cardView);
		cardView.setPosition(startInRoot.x, startInRoot.y);
		cardView.sortingOrder = GameConfig.CARD_FLY_ORDER;

		cardView.playFlipToHand(endX, endY, () => {
			if (this._hidden) return;
			this._gameState.handValue = cardView.value;
			CardView.setDigitalLoader(handCard.m_typeLoader, this._gameState.handValue, cardView.suit);
			compGame.removeChild(cardView);

			const idx = this.shuffleCardViews.indexOf(cardView);
			if (idx >= 0) this.shuffleCardViews.splice(idx, 1);
			if (this.shuffleCardViews.length > 0) {
				for (let i = 0; i < this.shuffleCardViews.length; i++) {
					this.shuffleCardViews[i].touchable = i === this.shuffleCardViews.length - 1;
				}
			} else {
				this.initShuffleCards();
			}

			checkSide(this.cardMap, cardCfg as Record<string, CardLayoutCfg>);
			if (this._gameState.isDeadlock(this.cardMap)) {
				this._gameState.shuffleDeadlockCount++;
			} else {
				this._gameState.shuffleDeadlockCount = 0;
			}

			if (this._gameState.isDeadlock(this.cardMap) && this.compGame.m_ctrlGuide.selectedIndex !== 1) {
				this.compGame.m_ctrlGuide.selectedIndex = 1;
				this._guide.showArrowAboveShuffle(this.shuffleCardViews);
				this._titleAnimator.playTitleSlideIn(0);
			} else if (this.compGame.m_ctrlGuide.selectedIndex === 1 && !this._gameState.isDeadlock(this.cardMap)) {
				this._guide.hideCompArrow();
				this._titleAnimator.playTitleSlideOut(() => {
					this.compGame.m_ctrlGuide.selectedIndex = 0;
					this.compGame.m_imgTitle.visible = false;
					this._guide.hideCompArrow();
				});
			}
			this.contentPane.touchable = true;
			this.startHintTimer();
		});
	}

	/** 根据 handCardCfg 初始化手牌显示的数字 */
	private initHandCards(): void {
		const handCard = this.compGame.m_handCard;
		if (!handCard) return;
		this._gameState.handValue = handCardCfg.initialValue;
		CardView.setDigitalLoader(handCard.m_typeLoader, this._gameState.handValue);
	}

	/** 在未过关、非僵局、无首次引导时，启动 5 秒提示计时（到点晃动一张可消除牌） */
	private startHintTimer(): void {
		this._guide.startHintTimer(
			() =>
				!this._gameState.gameSuccess &&
				!this._gameState.isDeadlock(this.cardMap) &&
				this._guide.getGuideCard() == null,
			() => this._gameState.getOneEliminable(this.cardMap)
		);
	}

	/** 过关后：禁用所有卡牌与洗牌区点击、隐藏引导与标题、停止提示计时、播下载按钮滑入 */
	private onGameSuccess(): void {
		this.compGame.m_cardCon.touchable = false;
		for (const [, cardView] of this.cardMap) {
			cardView.touchable = false;
		}
		this.compGame.m_shuffleArea.touchable = false;
		for (const card of this.shuffleCardViews) {
			card.touchable = false;
		}

		this._titleAnimator.stopJitter();
		this.compGame.m_imgTitle.visible = false;
		this.compGame.m_ctrlGuide.selectedIndex = 0;
		this._guide.hideCompArrow();
		this._guide.stopHintTimer();

		this._startScreenAnimator.playDownloadSlideIn();
		this.contentPane.touchable = true;
	}

	/** 初始化洗牌区：创建 SHUFFLE_PILE_SIZE 张随机牌，仅最上面一张可点 */
	private initShuffleCards(): void {
		this.shuffleCardViews = [];
		for (let i = 0; i < GameConfig.SHUFFLE_PILE_SIZE; i++) {
			const cardView = CardView.createInstance();
			const value = Math.floor(Math.random() * 13) + 1;
			cardView.setDigital(value);
			this.shuffleCardViews.push(cardView);
			this.compGame.m_shuffleArea.addChild(cardView);
			cardView.setBack();
			cardView.x = GameConfig.SHUFFLE_START_X + i * GameConfig.SHUFFLE_OFFSET_X;
			cardView.y = GameConfig.SHUFFLE_Y;
			cardView.on(fgui.Event.CLICK, this.onShuffleCardClick, this);
		}
		for (let i = 0; i < this.shuffleCardViews.length; i++) {
			this.shuffleCardViews[i].touchable = i === this.shuffleCardViews.length - 1;
		}
	}
}
