/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

import UI_comp_Shuffle from "./UI_comp_Shuffle";
import UI_comp_Card from "./UI_comp_Card";
import UI_comp_Game from "./UI_comp_Game";
import * as fgui from "fairygui-cc";

export default class Package1Binder {
	public static bindAll():void {
		fgui.UIObjectFactory.setExtension(UI_comp_Shuffle.URL, UI_comp_Shuffle);
		fgui.UIObjectFactory.setExtension(UI_comp_Card.URL, UI_comp_Card);
		fgui.UIObjectFactory.setExtension(UI_comp_Game.URL, UI_comp_Game);
	}
}