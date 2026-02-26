// assets/src/fgui-global.d.ts
import * as _fgui from "fairygui-cc";

declare global {
    /** 告诉编译器全局环境下存在 fgui 变量，且类型与 fairygui-cc 包一致 */
    const fgui: typeof _fgui;
}