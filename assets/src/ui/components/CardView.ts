import { tween } from "cc";
import * as fgui from "fairygui-cc";
import UI_comp_Card from "../../fgui/Package1/UI_comp_Card";


export class CardView extends UI_comp_Card {

	cfgKey: string;
	/** 卡牌数字（1-13） */
	value: number = 0;
	isClear: boolean = false;

	public static createInstance(): CardView {
			return fgui.UIPackage.createObject("Package1", "comp_Card") as CardView;
	}

	/** 为 typeLoader 设置卡牌数字，随机黑桃/红心（供任意带 m_typeLoader 的卡牌组件复用） */
	static setDigitalLoader(loader: fgui.GLoader, value: number): void {
		const r = Math.random();
		if (r < 0.5) {
			loader.url = fgui.UIPackage.getItemURL("Package1", `spade_${value}`);
		} else {
			loader.url = fgui.UIPackage.getItemURL("Package1", `heart_${value}`);
		}
	}

	setDigital(value: number) {
		this.value = value;
		CardView.setDigitalLoader(this.m_typeLoader, value);
	}

	/** 从屏幕上方飘落到目标位置，带旋转，先快后慢 */
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
				}
			})
			.start();
	}

	setFront() {
		this.m_ctrlSide.selectedIndex = 0;
		this.touchable = true;
	}

	setBack() {
		this.m_ctrlSide.selectedIndex = 1;
		this.touchable = false;
	}

	/** 向上抛出后抛物线落向目标位置，带大幅度旋转，符合落体运动规律 */
	playThrowToHand(endX: number, endY: number, onComplete?: () => void) {
		const startX = this.x;
		const startY = this.y;

		const T = 0.9;
		const vy0 = -450;
		const g = 1400;
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
				}
			})
			.call(() => onComplete?.())
			.start();
	}

	/** 旋转式轻微摇晃（点击不能消除时播放） */
	playShake() {
		const baseRotation = this.rotation;
		const amplitude = 8;
		const duration = 0.04;

		const state = { rotation: baseRotation };
		tween(state)
			.to(duration, { rotation: baseRotation - amplitude }, { easing: "sineInOut", onUpdate: () => this.rotation = state.rotation })
			.to(duration * 2, { rotation: baseRotation + amplitude }, { easing: "sineInOut", onUpdate: () => this.rotation = state.rotation })
			.to(duration * 2, { rotation: baseRotation - amplitude }, { easing: "sineInOut", onUpdate: () => this.rotation = state.rotation })
			.to(duration, { rotation: baseRotation }, { easing: "sineInOut", onUpdate: () => this.rotation = state.rotation })
			.start();
	}
}