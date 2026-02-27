import { _decorator, AudioClip, Component, ResolutionPolicy, view, screen } from 'cc';
import * as fgui from 'fairygui-cc';
import { UIManager } from './manager/UIManager';
import Package1Binder from './fgui/Package1/Package1Binder';
import UI_comp_Card from './fgui/Package1/UI_comp_Card';
import { CardView } from './ui/components/CardView';
import { GameWindow } from './ui/GameWindow';
import { AudioManager } from './manager/AudioManager';

const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    
		@property(AudioClip)
		public bgmClip: AudioClip = null!;

    async onLoad() {
				this.fitScreen();
        // 1. 初始化 FGUI 根节点
        UIManager.inst.initRoot();
				AudioManager.inst;
				AudioManager.inst.playMusic(this.bgmClip);

        try {
            // 2. 加载 Package1 资源包（路径：resources/fgui/Package1）
            await UIManager.inst.loadPackage("Package1");
            // 3. 绑定 comp_Game 等组件类
            Package1Binder.bindAll();
            // 4. 用 CardView 替换 comp_Card 的默认实现
            fgui.UIObjectFactory.setExtension(UI_comp_Card.URL, CardView);

            this.enterGame();
        } catch (e) {
            console.error("启动失败", e);
        }
    }

		fitScreen() {
			// 动态适配逻辑
			let designSize = view.getDesignResolutionSize();
			let frameSize = screen.windowSize;

			// 计算当前屏幕的宽高比
			let designRatio = designSize.width / designSize.height;
			let frameRatio = frameSize.width / frameSize.height;

			if (frameRatio > designRatio) {
					// 屏幕更宽（如 PC 宽屏）：固定高度，宽度自适应
					view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
			} else {
					// 屏幕更窄（如 手机长屏）：固定宽度，高度自适应
					view.setResolutionPolicy(ResolutionPolicy.FIXED_WIDTH);
			}
		}


    enterGame() {
			const gameWin = new GameWindow();
    	gameWin.show();
    }
}