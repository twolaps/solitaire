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
		UIManager.inst.initRoot();
		this.fitScreen();
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
	 * 更加健壮的适配逻辑：
	 * 1. 监听 view 的 resize 事件
	 * 2. 动态切换 FIXED_WIDTH 和 FIXED_HEIGHT
	 */
	fitScreen() {
		const designSize = view.getDesignResolutionSize();
		// 监听窗口尺寸变化
		view.on('view-resize', () => {
				this.applyAdaptation(designSize);
				// 这一步确保 fgui 的坐标系与 cocos 视图对齐
				fgui.GRoot.inst.setSize(view.getVisibleSize().width, view.getVisibleSize().height);
		});
		// 初始执行一次
		this.applyAdaptation(designSize);
		
	}

	private applyAdaptation(designSize: { width: number, height: number }) {
		const frameSize = screen.windowSize;
		const designRatio = designSize.width / designSize.height;
		const frameRatio = frameSize.width / frameSize.height;

		// 如果屏幕比设计分辨率更“宽”（如 PC 宽屏），固定高度，左右留白（或扩展）
		// 如果屏幕比设计分辨率更“窄”（如 手机长屏），固定宽度，上下留白（或扩展）
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
