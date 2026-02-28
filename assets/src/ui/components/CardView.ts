import { tween } from "cc";
import * as fgui from "fairygui-cc";
import UI_comp_Card from "../../fgui/Package1/UI_comp_Card";
import { AudioManager } from "../../manager/AudioManager";

/**
 * 卡牌视图：继承 FairyGUI 导出的 comp_Card，扩展牌面数字、正反面、入场/消除/晃动等动画
 */
export class CardView extends UI_comp_Card {
	/** 对应 cardCfg 的 key（如 card1），用于布局与覆盖关系查询 */
	cfgKey: string;
	/** 卡牌数字 1-13，用于消除判定 */
	value: number = 0;
	/** 花色：spade 黑桃 / heart 红心，用于显示与手牌同步 */
	suit: "spade" | "heart" = "spade";
	/** 是否已被消除（飞向手牌后设为 true，用于 checkSide 与胜利判定） */
	isClear: boolean = false;

	/**
	 * 从 UI 包创建卡牌实例（由 FairyGUI 工厂使用）
	 * @returns 卡牌组件实例
	 */
	public static createInstance(): CardView {
		return fgui.UIPackage.createObject("Package1", "comp_Card") as CardView;
	}

	/**
	 * 为 typeLoader 设置卡牌数字贴图，随机黑桃/红心（供手牌等任意带 m_typeLoader 的组件复用）
	 * @param loader FairyGUI GLoader
	 * @param value 牌面 1-13
	 * @param suit 可选花色，不传则随机
	 */
	static setDigitalLoader(loader: fgui.GLoader, value: number, suit?: "spade" | "heart"): void {
		if (!suit) {
			suit = Math.random() < 0.5 ? "spade" : "heart";
		}
		loader.url = fgui.UIPackage.getItemURL("Package1", `${suit}_${value}`);
	}

	/**
	 * 设置本卡牌的牌面数字与花色，并刷新 typeLoader 显示
	 * @param value 1-13
	 * @param suit 可选，不传则随机
	 */
	setDigital(value: number, suit?: "spade" | "heart") {
		this.value = value;
		this.suit = suit ?? (Math.random() < 0.5 ? "spade" : "heart");
		CardView.setDigitalLoader(this.m_typeLoader, value, this.suit);
	}

	/**
	 * 从屏幕上方飘落到目标位置，带旋转，easing 先快后慢（quartOut）
	 * @param endX 目标 x
	 * @param endY 目标 y
	 * @param delay 延迟秒数，用于错开多张牌入场
	 */
	public playDropIn(endX: number, endY: number, delay: number = 0) {
		const startY = -700;
		const startRotation = -360;

		const state = { x: endX, y: startY, rotation: startRotation };
		this.setPosition(state.x, state.y);
		this.rotation = state.rotation;

		tween(state)
			.delay(delay)
			.to(0.7, { x: endX, y: endY, rotation: 0 }, {
				easing: "quartOut",
				onUpdate: () => {
					this.setPosition(state.x, state.y);
					this.rotation = state.rotation;
				},
			})
			.start();
	}

	/** 设为正面（显示牌面、可点击） */
	setFront() {
		this.m_ctrlSide.selectedIndex = 0;
		this.touchable = true;
	}

	/** 设为背面（牌背、不可点击） */
	setBack() {
		this.m_ctrlSide.selectedIndex = 1;
		this.touchable = false;
	}

	/**
	 * 向上抛出后抛物线落向目标位置，带大幅度旋转（模拟落体）
	 * @param endX 手牌中心对齐后的 x
	 * @param endY 手牌中心对齐后的 y
	 * @param onComplete 动画结束回调
	 */
	playThrowToHand(endX: number, endY: number, onComplete?: () => void) {
		const startX = this.x;
		const startY = this.y;

		const T = 0.9;
		const g = 4000;
		const vy0 = (endY - startY - 0.5 * g * T * T) / T;
		const rotSpeed = 720;

		const state = { t: 0 };
		tween(state)
			.to(T, { t: 1 }, {
				onUpdate: () => {
					const t = state.t * T;
					const x = startX + (endX - startX) * state.t;
					const y = startY + vy0 * t + 0.5 * g * t * t;
					const rotation = rotSpeed * t;
					this.setPosition(x, y);
					this.rotation = rotation;
				},
			})
			.call(() => onComplete?.())
			.start();
	}

	/**
	 * 反面翻到正面并平移到目标位置；翻面过程中在收拢时切正面，展开时即可看到数字
	 * @param endX 目标 x
	 * @param endY 目标 y
	 * @param onComplete 动画结束回调
	 */
	playFlipToHand(endX: number, endY: number, onComplete?: () => void) {
		const startX = this.x;
		const startY = this.y;
		const flipInDuration = 0.1;   // 反面收拢
		const flipOutDuration = 0.15; // 正面展开（此时数值可见）
		const slideDuration = 0.25;

		const state = { scaleX: 1, x: startX, y: startY };
		tween(state)
			.to(flipInDuration, { scaleX: 0 }, {
				easing: "sineIn",
				onUpdate: () => {
					this.scaleX = state.scaleX;
					this.setPosition(state.x, state.y);
				},
			})
			.call(() => {
				this.setFront();
				AudioManager.inst.playSFXByName("Package1", "move");
			})
			.to(flipOutDuration, { scaleX: 1 }, {
				easing: "backOut",
				onUpdate: () => {
					this.scaleX = state.scaleX;
					this.setPosition(state.x, state.y);
				},
			})
			.to(slideDuration, { x: endX, y: endY }, {
				easing: "sineInOut",
				onUpdate: () => {
					this.setPosition(state.x, state.y);
				},
			})
			.call(() => {
				this.scaleX = 1;
				onComplete?.();
			})
			.start();
	}

	/**
	 * 旋转式轻微摇晃（点击不能消除时播放，或提示计时到点）
	 * @param onComplete 动画结束回调，可选
	 */
	playShake(onComplete?: () => void) {
		const baseRotation = this.rotation;
		const amplitude = 8;
		const duration = 0.04;

		const state = { rotation: baseRotation };
		tween(state)
			.to(duration, { rotation: baseRotation - amplitude }, { easing: "sineInOut", onUpdate: () => (this.rotation = state.rotation) })
			.to(duration * 2, { rotation: baseRotation + amplitude }, { easing: "sineInOut", onUpdate: () => (this.rotation = state.rotation) })
			.to(duration * 2, { rotation: baseRotation - amplitude }, { easing: "sineInOut", onUpdate: () => (this.rotation = state.rotation) })
			.to(duration, { rotation: baseRotation }, { easing: "sineInOut", onUpdate: () => (this.rotation = state.rotation) })
			.call(() => onComplete?.())
			.start();
	}
}
