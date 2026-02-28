/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as fgui from "fairygui-cc";
import UI_comp_Card from "./UI_comp_Card";

export default class UI_comp_Start extends fgui.GComponent {

	public m_startCard:UI_comp_Card;
	public m_imgFinger:fgui.GImage;
	public static URL:string = "ui://1yx7aoelfjen1c";

	public static createInstance():UI_comp_Start {
		return <UI_comp_Start>(fgui.UIPackage.createObject("Package1", "comp_Start"));
	}

	protected onConstruct():void {
		this.m_startCard = <UI_comp_Card>(this.getChild("startCard"));
		this.m_imgFinger = <fgui.GImage>(this.getChild("imgFinger"));
	}
}