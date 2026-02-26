import { assetManager, AssetManager } from 'cc';
import * as fgui from "fairygui-cc";

export class UIManager {
    private static _instance: UIManager;
    public static get inst(): UIManager {
        if (!this._instance) this._instance = new UIManager();
        return this._instance;
    }

    /**
     * 加载 UI 包
     * @param pkgName 包名（对应 assets/resources 下的文件名）
     */
    public loadPackage(pkgName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // FGUI 3.x 推荐使用 resources.load 或自定义 Bundle 加载
            fgui.UIPackage.loadPackage(`ui/${pkgName}`, (err) => {
                if (err) {
                    console.error(`加载 UI 包 ${pkgName} 失败:`, err);
                    reject(err);
                } else {
                    console.log(`加载 UI 包 ${pkgName} 成功`);
                    resolve();
                }
            });
        });
    }

    /**
     * 展示全屏 UI 根节点初始化
     */
    public initRoot(): void {
        fgui.GRoot.create();
    }
}