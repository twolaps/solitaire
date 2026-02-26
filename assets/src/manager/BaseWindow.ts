import { Window } from "fairygui-cc";

export class BaseWindow extends Window {
    public constructor() {
        super();
    }

    // 窗口初始化时触发
    protected onInit(): void {
        // 子类在这里绑定 UI 导出变量
    }

    // 窗口显示时触发
    protected onShown(): void {
        super.onShown();
    }

    // 窗口隐藏时触发
    protected onHide(): void {
        super.onHide();
    }
}