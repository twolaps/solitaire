import * as fgui from "fairygui-cc";
import UI_comp_Game from "../../fgui/Package1/UI_comp_Game";
import { createPingPongLoop, createSlideTween } from "./TweenHelpers";
import type { LoopTweenHandle } from "./TweenHelpers";

/**
 * 负责标题（imgTitle）滑入、滑出与到达后的持续抖动
 */
export class TitleAnimator {
	/** 主游戏 UI 根组件 */
	private _compGame: UI_comp_Game;
	/** 标题到达中心后的上下抖动循环 tween，用于 stop */
	private _titleJitterTween: LoopTweenHandle | null = null;

	constructor(compGame: UI_comp_Game) {
		this._compGame = compGame;
	}

	/** 停止当前抖动动画（滑出或重新滑入前调用，避免重复） */
	stopJitter(): void {
		this._titleJitterTween?.stop();
		this._titleJitterTween = null;
	}

	/**
	 * 标题从屏幕左侧滑入到中间，到达后持续上下小幅度抖动
	 * @param delay 延迟多少秒后开始滑入
	 */
	playTitleSlideIn(delay: number): void {
		this.stopJitter();

		const img = this._compGame.m_imgTitle;
		img.visible = true;
		const startX = -img.width;
		const centerX = (this._compGame.width - img.width) / 2;
		const baseY = img.y;
		img.setPosition(startX, baseY);

		const state = { x: startX };
		createSlideTween(state, startX, centerX, 0.5, "backOut", () => img.setPosition(state.x, baseY))
			.delay(delay)
			.call(() => this._playTitleJitter(img, centerX, baseY))
			.start();
	}

	/**
	 * 标题到达中心后持续的上下小幅度抖动（ping-pong Y）
	 * @param img 标题 GObject
	 * @param centerX 中心 x，不变
	 * @param baseY 基准 y，在 baseY±amplitude 之间往复
	 */
	private _playTitleJitter(img: fgui.GObject, centerX: number, baseY: number): void {
		const amplitude = 4;
		const state = { y: baseY };
		this._titleJitterTween = createPingPongLoop(
			state,
			"y",
			baseY + amplitude,
			baseY - amplitude,
			0.3,
			() => img.setPosition(centerX, state.y)
		).start();
	}

	/**
	 * 标题从中心向右飘出，完成后调用 onComplete
	 * @param onComplete 动画结束回调（如隐藏标题、隐藏箭头、重置引导）
	 */
	playTitleSlideOut(onComplete?: () => void): void {
		this.stopJitter();

		const img = this._compGame.m_imgTitle;
		const centerX = (this._compGame.width - img.width) / 2;
		const endX = this._compGame.width;
		const baseY = img.y;
		img.setPosition(centerX, baseY);

		const state = { x: centerX };
		createSlideTween(state, centerX, endX, 0.5, "backIn", () => img.setPosition(state.x, baseY), onComplete).start();
	}
}
