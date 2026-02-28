import { GRoot, UIPackage } from "fairygui-cc";

/**
 * UI 管理器：单例，负责 FairyGUI 根节点创建与 UI 包加载
 */
export class UIManager {
	private static _instance: UIManager;

	/** 单例访问 */
	public static get inst(): UIManager {
		if (!this._instance) this._instance = new UIManager();
		return this._instance;
	}

	/**
	 * 加载 UI 包（从 resources/fgui/ 下加载）
	 * @param pkgName 包名，对应 resources 下的文件夹名（如 Package1）
	 * @returns Promise，成功 resolve，失败 reject
	 */
	public loadPackage(pkgName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			UIPackage.loadPackage(`fgui/${pkgName}`, (err) => {
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

	/** 创建全屏 UI 根节点（FairyGUI 全局 GRoot），后续窗口将添加到此根下 */
	public initRoot(): void {
		GRoot.create();
	}
}
