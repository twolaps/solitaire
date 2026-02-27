import { tween } from "cc";
import * as fgui from "fairygui-cc";
import UI_comp_Card from "../../fgui/Package1/UI_comp_Card";

export class CardView extends UI_comp_Card {

	cfgKey: string;
	isClear: boolean = false;

	public static createInstance(): CardView {
			return fgui.UIPackage.createObject("Package1", "comp_Card") as CardView;
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
}