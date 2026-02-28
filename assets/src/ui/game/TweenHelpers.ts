import { tween } from "cc";

/** 可停止的循环 tween 句柄（调用 .start() 后得到，用于在 onHide 等时机 stop） */
export type LoopTweenHandle = { stop: () => void };

/** 缩放循环默认 min/max，与开始牌、下载按钮一致 */
const SCALE_LOOP_DEFAULT = { minScale: 1, maxScale: 1.15 } as const;

/**
 * 创建「缩放往复循环」动画：在 minScale 与 maxScale 之间来回，easing 为 sineInOut
 * @param state 驱动对象，需含 scale 字段，由 tween 修改
 * @param options 可选 minScale、maxScale、duration，不传则用默认
 * @param onUpdate 每帧回调，在此中根据 state.scale 更新节点（如 setScale）
 * @returns 带 start() 的对象，调用 start() 后返回可 stop 的句柄
 */
export function createScaleLoop(
	state: { scale: number },
	options: { minScale?: number; maxScale?: number; duration?: number },
	onUpdate: () => void
): { start: () => LoopTweenHandle } {
	const { minScale, maxScale, duration } = {
		...SCALE_LOOP_DEFAULT,
		duration: 0.5,
		...options,
	};
	const chain = tween(state)
		.to(duration, { scale: maxScale }, { easing: "sineInOut", onUpdate })
		.to(duration, { scale: minScale }, { easing: "sineInOut", onUpdate })
		.union()
		.repeatForever();
	return {
		start: () => chain.start() as unknown as LoopTweenHandle,
	};
}

/**
 * 创建「数值往复循环」动画：state[key] 在 valueA 与 valueB 之间来回，用于旋转、Y 位移等
 * @param state 驱动对象，需含 key 对应的数值
 * @param key 状态字段名，如 'rotation'、'y'
 * @param valueA 第一段终点（也是循环起点）
 * @param valueB 第二段终点
 * @param duration 单程时长（秒）
 * @param onUpdate 每帧回调，将 state 应用到节点
 * @returns 带 start() 的对象，调用后返回可 stop 的句柄
 */
export function createPingPongLoop<K extends string>(
	state: Record<K, number>,
	key: K,
	valueA: number,
	valueB: number,
	duration: number,
	onUpdate: () => void
): { start: () => LoopTweenHandle } {
	const chain = tween(state)
		.to(duration, { [key]: valueB } as Record<K, number>, { easing: "sineInOut", onUpdate })
		.to(duration, { [key]: valueA } as Record<K, number>, { easing: "sineInOut", onUpdate })
		.union()
		.repeatForever();
	return {
		start: () => chain.start() as unknown as LoopTweenHandle,
	};
}

/**
 * 创建「水平位移动画」：state.x 从 fromX 到 toX，带缓动与可选完成回调
 * @param state 驱动对象，需含 x
 * @param fromX 起始 x
 * @param toX 目标 x
 * @param duration 时长（秒）
 * @param easing 缓动名，如 "backOut"（滑入）、"backIn"（滑出）
 * @param onUpdate 每帧回调（如 setPosition(state.x, baseY)）
 * @param onComplete 动画结束回调，可选
 * @returns tween 链，可继续 .delay().call().start()
 */
export function createSlideTween(
	state: { x: number },
	fromX: number,
	toX: number,
	duration: number,
	easing: "backOut" | "backIn",
	onUpdate: () => void,
	onComplete?: () => void
): ReturnType<typeof tween> {
	let chain = tween(state).to(duration, { x: toX }, { easing, onUpdate });
	if (onComplete) chain = chain.call(onComplete);
	return chain;
}
