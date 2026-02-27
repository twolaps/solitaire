/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as fgui from "fairygui-cc";
export default class UI_comp_Card extends fgui.GComponent {

	public m_ctrlSide:fgui.Controller;
	public m_typeLoader:fgui.GLoader;
	public static URL:string = "ui://1yx7aoelmi1b7";

	public static createInstance():UI_comp_Card {
		return <UI_comp_Card>(fgui.UIPackage.createObject("Package1", "comp_Card"));
	}

	protected onConstruct():void {
		this.m_ctrlSide = this.getController("ctrlSide");
		this.m_typeLoader = <fgui.GLoader>(this.getChild("typeLoader"));
	}
}