/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

export default class UI_comp_Game extends fgui.GComponent {

	public m_bg:fgui.GImage;
	public static URL:string = "ui://1yx7aoelt01j2";

	public static createInstance():UI_comp_Game {
		return <UI_comp_Game>(fgui.UIPackage.createObject("Package1", "comp_Game"));
	}

	protected onConstruct():void {
		this.m_bg = <fgui.GImage>(this.getChild("bg"));
	}
}