import { Window } from "fairygui-cc";

/**
 * 窗口基类：封装 FairyGUI Window 生命周期
 * 子类在 onInit 中创建并设置 contentPane，在 onShown/onHide 中注册/移除事件与资源
 */
export class BaseWindow extends Window {
	public constructor() {
		super();
	}

	/**
	 * 窗口初始化时触发（创建内容、绑定 UI 引用）
	 * 子类在这里创建 comp 并赋值 contentPane
	 */
	protected onInit(): void {
		// 子类在这里绑定 UI 导出变量
	}

	/**
	 * 窗口显示时触发（注册事件、开始动画等）
	 */
	protected onShown(): void {
		super.onShown();
	}

	/**
	 * 窗口隐藏时触发（移除事件、停止动画与定时器）
	 */
	protected onHide(): void {
		super.onHide();
	}
}
