import { _decorator, AudioClip, Component, ResolutionPolicy, view, screen } from 'cc';
import * as fgui from 'fairygui-cc';
import { UIManager } from './manager/UIManager';
import Package1Binder from './fgui/Package1/Package1Binder';
import UI_comp_Card from './fgui/Package1/UI_comp_Card';
import { CardView } from './ui/components/CardView';
import { GameWindow } from './ui/GameWindow';
import { AudioManager } from './manager/AudioManager';

const { ccclass, property } = _decorator;

/**
 * 游戏入口：挂载在场景根节点，负责分辨率适配、FGUI 初始化、资源加载、进入游戏
 */
@ccclass('Main')
export class Main extends Component {
	/** 背景音乐片段，在编辑器中绑定 */
	@property(AudioClip)
	public bgmClip: AudioClip = null!;

	async onLoad() {
		this.fitScreen();
		UIManager.inst.initRoot();
		AudioManager.inst;
		AudioManager.inst.playMusic(this.bgmClip);

		try {
			await UIManager.inst.loadPackage("Package1");
			Package1Binder.bindAll();
			// 用 CardView 替换 comp_Card 的默认实例化，以便使用自定义动画与逻辑
			fgui.UIObjectFactory.setExtension(UI_comp_Card.URL, CardView);

			this.enterGame();
		} catch (e) {
			console.error("启动失败", e);
		}
	}

	/**
	 * 根据设计分辨率与当前窗口比例选择适配策略：宽屏固定高度，窄屏固定宽度
	 */
	fitScreen() {
		let designSize = view.getDesignResolutionSize();
		let frameSize = screen.windowSize;

		let designRatio = designSize.width / designSize.height;
		let frameRatio = frameSize.width / frameSize.height;

		if (frameRatio > designRatio) {
			view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
		} else {
			view.setResolutionPolicy(ResolutionPolicy.FIXED_WIDTH);
		}
	}

	/** 创建并显示游戏主窗口 */
	enterGame() {
		const gameWin = new GameWindow();
		gameWin.show();
	}
}
