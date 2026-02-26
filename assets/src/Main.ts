import './fgui-global';
import { _decorator, Component } from 'cc';
import { UIManager } from './manager/UIManager';

const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {
    
    async onLoad() {
        // 1. 初始化 FGUI 根节点
        UIManager.inst.initRoot();

        try {
            // 3. 加载资源包（假设你已经在 resources/ui 目录下放了包文件）
            // await UIManager.inst.loadPackage("Common");
            
            this.enterGame();
        } catch (e) {
            console.error("启动失败", e);
        }
    }

    enterGame() {
        console.log("框架搭建完成，进入游戏逻辑");
        // 在这里实例化并显示你的第一个窗口
        // let win = new MyMainMenu();
        // win.show();
    }
}