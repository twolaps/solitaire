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
	}

	private showCard() {
		this.cardMap = new Map<string, CardView>();
		this.initHandCards();
		this.initShuffleCards();

		let index = 0;
		for (const key in cardCfg) {
			const cfg = cardCfg[key];
			const cardView: CardView = CardView.createInstance();
			cardView.setDigital(cfg.value);
			this.cardMap.set(key, cardView);
			cardView.cfgKey = key;
			this.compGame.m_cardCon.addChild(cardView);
			// 起始位置在上方，通过动画飘落到目标位置
			cardView.playDropIn(cfg.pos[0], cfg.pos[1], index * 0.1);
			index++;
		} 
		this.checkSide();
		// 卡牌入场动画结束后，imgTitle 从屏幕左侧移动到中间
		const cardCount = index;
		const cardAnimEndTime = (cardCount - 1) * 0.1 + 0.7;
		this.playTitleSlideIn(cardAnimEndTime);
	}

	/** 根据配置初始化手牌上显示的数字 */
	private initHandCards() {
		const handCard = this.compGame.m_handCard;
		if (!handCard) return;

		CardView.setDigitalLoader(handCard.m_typeLoader, handCardCfg.initialValue);
	}

	/** imgTitle 从屏幕左侧滑入到中间，到达后持续上下小幅度抖动 */
	private playTitleSlideIn(delay: number) {
		const img = this.compGame.m_imgTitle;
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
	private playTitleJitter(img: fgui.GImage, centerX: number, baseY: number) {
		const amplitude = 4;
		const state = { y: baseY };
		const updatePos = () => img.setPosition(centerX, state.y);

		tween(state)
			.to(0.3, { y: baseY + amplitude }, { easing: "sineInOut", onUpdate: updatePos })
			.to(0.3, { y: baseY - amplitude }, { easing: "sineInOut", onUpdate: updatePos })
			.union()
			.repeatForever()
			.start();
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

		for (let i = 0; i < 2; i++) {
			const cardView: CardView = CardView.createInstance();
			const value: number = Math.floor(Math.random() * 13) + 1;
			cardView.setDigital(value);
			this.shuffleCardViews.push(cardView);
			this.compGame.m_shuffleArea.addChild(cardView);
			cardView.setBack();
			cardView.x = 50 + i * 50;
			cardView.y = 72;
		}
	}
}