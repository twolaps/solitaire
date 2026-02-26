import './fgui-global';
import { _decorator, Component } from 'cc';
import { GRoot } from 'fairygui-cc';
import { UIManager } from './manager/UIManager';
import Package1Binder from './fgui/Package1/Package1Binder';
import UI_comp_Game from './fgui/Package1/UI_comp_Game';

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
            
            this.enterGame();
        } catch (e) {
            console.error("启动失败", e);
        }
    }

    enterGame() {
        // 创建 comp_Game 界面并添加到根节点显示
        const comp = UI_comp_Game.createInstance();
        GRoot.inst.addChild(comp);
    }
}