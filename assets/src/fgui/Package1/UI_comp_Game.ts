/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as fgui from "fairygui-cc";
import UI_comp_Card from "./UI_comp_Card";
import UI_comp_Shuffle from "./UI_comp_Shuffle";

export default class UI_comp_Game extends fgui.GComponent {

	public m_ctrlGuide:fgui.Controller;
	public m_bg:fgui.GImage;
	public m_cardCon:fgui.GComponent;
	public m_handCard:UI_comp_Card;
	public m_shuffleArea:UI_comp_Shuffle;
	public m_imgTitle:fgui.GLoader;
	public m_btnDownload:fgui.GLoader;
	public static URL:string = "ui://1yx7aoelt01j2";

	public static createInstance():UI_comp_Game {
		return <UI_comp_Game>(fgui.UIPackage.createObject("Package1", "comp_Game"));
	}

	protected onConstruct():void {
		this.m_ctrlGuide = this.getController("ctrlGuide");
		this.m_bg = <fgui.GImage>(this.getChild("bg"));
		this.m_cardCon = <fgui.GComponent>(this.getChild("cardCon"));
		this.m_handCard = <UI_comp_Card>(this.getChild("handCard"));
		this.m_shuffleArea = <UI_comp_Shuffle>(this.getChild("shuffleArea"));
		this.m_imgTitle = <fgui.GLoader>(this.getChild("imgTitle"));
		this.m_btnDownload = <fgui.GLoader>(this.getChild("btnDownload"));
	}
}