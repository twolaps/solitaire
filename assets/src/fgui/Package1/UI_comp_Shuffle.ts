/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as fgui from "fairygui-cc";
import UI_comp_Card from "./UI_comp_Card";

export default class UI_comp_Shuffle extends fgui.GComponent {

	public m_card2:UI_comp_Card;
	public m_card1:UI_comp_Card;
	public static URL:string = "ui://1yx7aoelc4e6c";

	public static createInstance():UI_comp_Shuffle {
		return <UI_comp_Shuffle>(fgui.UIPackage.createObject("Package1", "comp_Shuffle"));
	}

	protected onConstruct():void {
		this.m_card2 = <UI_comp_Card>(this.getChild("card2"));
		this.m_card1 = <UI_comp_Card>(this.getChild("card1"));
	}
}