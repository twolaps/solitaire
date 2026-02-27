import { _decorator, Component } from 'cc';
import * as fgui from 'fairygui-cc';
import { UIManager } from './manager/UIManager';
import Package1Binder from './fgui/Package1/Package1Binder';
import UI_comp_Card from './fgui/Package1/UI_comp_Card';
import { CardView } from './ui/components/CardView';
import { GameWindow } from './ui/GameWindow';

const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {
    
    async onLoad() {
        // 1. 初始化 FGUI 根节点
        UIManager.inst.initRoot();

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

    enterGame() {
			const gameWin = new GameWindow();
    	gameWin.show();
    }
}