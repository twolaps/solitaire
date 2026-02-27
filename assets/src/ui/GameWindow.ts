import { cardCfg } from "../config/CardConfig";
import UI_comp_Game from "../fgui/Package1/UI_comp_Game";
import { CardView } from "./components/CardView";
import { BaseWindow } from "../manager/BaseWindow";

/**
 * 绑定 comp_Game 组件的窗口
 */
export class GameWindow extends BaseWindow {
    /** comp_Game 组件引用，可在 onShown 后访问子控件 */
    public compGame: UI_comp_Game;
		public cardMap: Map<string, CardView>;
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

			let index = 0;
			for (const key in cardCfg) {
				const cfg = cardCfg[key];
				const cardView = CardView.createInstance();
				this.cardMap.set(key, cardView);
				cardView.cfgKey = key;
				this.compGame.m_cardCon.addChild(cardView);
				// 起始位置在上方，通过动画飘落到目标位置
				cardView.playDropIn(cfg.pos[0], cfg.pos[1], index * 0.1);
				index++;
			}
			this.checkSide();
		}

		private checkSide() {
			for (const [cfgKey, cardView] of this.cardMap) {
				const cfg = cardCfg[cfgKey];
				// cover 为空：正面 (0)
				if (!cfg.cover || cfg.cover.length === 0) {
					cardView.m_ctrlSide.selectedIndex = 0;
					continue;
				}
				// cover 有值：仅当 cover 中所有牌都 isClear 才正面，否则反面
				const allCoverCleared = cfg.cover.every(coverKey => {
					const coverCard = this.cardMap.get(coverKey);
					return coverCard ? coverCard.isClear : false;
				});
				cardView.m_ctrlSide.selectedIndex = allCoverCleared ? 0 : 1;
			}
		}
}