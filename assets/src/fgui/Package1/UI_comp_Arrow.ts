/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import * as fgui from "fairygui-cc";
export default class UI_comp_Arrow extends fgui.GComponent {

	public m_move:fgui.Transition;
	public static URL:string = "ui://1yx7aoel1149i1d";

	public static createInstance():UI_comp_Arrow {
		return <UI_comp_Arrow>(fgui.UIPackage.createObject("Package1", "comp_Arrow"));
	}

	protected onConstruct():void {
		this.m_move = this.getTransition("move");
	}
}