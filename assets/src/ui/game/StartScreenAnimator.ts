import UI_comp_Game from "../../fgui/Package1/UI_comp_Game";
import { createScaleLoop, createPingPongLoop, createSlideTween } from "./TweenHelpers";

import type { LoopTweenHandle } from "./TweenHelpers";

/**
 * 负责开始界面与下载按钮的循环/入场动画，并统一管理 tween 便于 onHide 时清理
 */
export class StartScreenAnimator {
	/** 主游戏 UI 根组件 */
	private _compGame: UI_comp_Game;
	/** 开始牌呼吸缩放循环 tween 句柄 */
	private _startCardScaleTween: LoopTweenHandle | null = null;
	/** 手指左右摆动循环 tween 句柄 */
	private _imgFingerSwayTween: LoopTweenHandle | null = null;
	/** 下载按钮呼吸缩放循环 tween 句柄 */
	private _downloadScaleTween: LoopTweenHandle | null = null;

	constructor(compGame: UI_comp_Game) {
		this._compGame = compGame;
	}

	/** 停止所有由本类创建的循环动画（窗口隐藏时调用） */
	stopAll(): void {
		this._startCardScaleTween?.stop();
		this._startCardScaleTween = null;
		this._imgFingerSwayTween?.stop();
		this._imgFingerSwayTween = null;
		this._downloadScaleTween?.stop();
		this._downloadScaleTween = null;
	}

	/** 开始界面中央牌的循环放大缩小（呼吸效果） */
	playStartCardLoop(): void {
		const card = this._compGame.m_comStart.m_startCard;
		const state = { scale: 1 };
		this._startCardScaleTween = createScaleLoop(
			state,
			{ duration: 0.5 },
			() => card.setScale(state.scale, state.scale)
		).start();
	}

	/** 开始界面手指图标的循环左右摆动，引导点击 */
	playFingerSwayLoop(): void {
		const finger = this._compGame.m_comStart.m_imgFinger;
		const amplitude = 12;
		const state = { rotation: -amplitude } as { rotation: number };
		finger.rotation = -amplitude;
		this._imgFingerSwayTween = createPingPongLoop(
			state,
			"rotation",
			-amplitude,
			amplitude,
			1.2,
			() => {
				finger.rotation = state.rotation;
			}
		).start();
	}

	/** 过关后下载按钮从屏幕左侧滑入到中间，到达后开始呼吸缩放 */
	playDownloadSlideIn(): void {
		const btn = this._compGame.m_btnDownload;
		btn.visible = true;

		const startX = -btn.width / 2;
		const centerX = this._compGame.width / 2;
		const baseY = btn.y;
		btn.setPosition(startX, baseY);

		const state = { x: startX };
		createSlideTween(state, startX, centerX, 0.5, "backOut", () => btn.setPosition(state.x, baseY), () =>
			this.playDownloadScaleLoop()
		).start();
	}

	/** 下载按钮到达中间后的循环缩放（呼吸效果），缩放时保持中心不变 */
	playDownloadScaleLoop(): void {
		const btn = this._compGame.m_btnDownload;
		const centerX = this._compGame.width / 2;
		const baseY = btn.y;
		const state = { scale: 1 };
		this._downloadScaleTween = createScaleLoop(
			state,
			{ duration: 0.4 },
			() => {
				btn.setScale(state.scale, state.scale);
				btn.setPosition(centerX, baseY);
			}
		).start();
	}
}
