import { DOSSystem } from "../../DOSSystem/DOSSystem";
import { GetAlphaFromFullColor, GetColorStrFromFullColor, MakeFullColor, NormalizeColorStr, Saturate, Str2Number } from "../../Tools";
import { BaseUI } from "../BaseUI";

export class ColorListItem extends fgui.GComponent {
    protected m_Color: fgui.GGraph;
    protected onConstruct(): void {
        this.m_Color = this.getChild("color") as fgui.GGraph;
    }

    public get color(): string {
        return this.m_Color.color;
    }
    public set color(value: string) {
        this.m_Color.color = value;
    }
}


export class ColorSelectorPanel extends BaseUI {
    protected static m_Instance: ColorSelectorPanel;
    public static get Instance(): ColorSelectorPanel {
        if (!ColorSelectorPanel.m_Instance) {
            ColorSelectorPanel.m_Instance = new ColorSelectorPanel();
            ColorSelectorPanel.m_Instance.show();
            ColorSelectorPanel.m_Instance.hideImmediately();
        }

        return ColorSelectorPanel.m_Instance;
    }
    protected m_Color: string;
    protected m_SelectCallback: Function;
    protected m_ghColor: fgui.GGraph;
    protected m_txColor: fgui.GTextInput;
    protected m_txOpaque: fgui.GTextInput;
    protected m_lvColorList1: fgui.GList;
    protected m_lvColorList2: fgui.GList;
    protected m_lvColorList3: fgui.GList;
    protected m_lvColorList4: fgui.GList;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "ColorSelectorPanel").asCom;

        this.name = "ColorSelectorPanel";

        this.m_ghColor = this.GetComponent<fgui.GGraph>("ghColor");
        this.m_txColor = this.GetComponent<fgui.GTextInput>("txColor");
        this.m_txOpaque = this.GetComponent<fgui.GTextInput>("txOpaque");
        this.m_lvColorList1 = this.GetComponent<fgui.GList>("lvColorList1");
        this.m_lvColorList2 = this.GetComponent<fgui.GList>("lvColorList2");
        this.m_lvColorList3 = this.GetComponent<fgui.GList>("lvColorList3");
        this.m_lvColorList4 = this.GetComponent<fgui.GList>("lvColorList4");
        

        this.m_txColor.on(Laya.Event.BLUR, this, this.OnLostFocus);
        this.m_txColor.on(Laya.Event.KEY_UP, this, this.OnEnter)
        this.m_txOpaque.on(Laya.Event.BLUR, this, this.OnLostFocus);
        this.m_txOpaque.on(Laya.Event.KEY_UP, this, this.OnEnter)

        this.m_lvColorList1.on(fgui.Events.CLICK_ITEM, this, this.OnClickColor);
        this.m_lvColorList2.on(fgui.Events.CLICK_ITEM, this, this.OnClickColor);
        this.m_lvColorList3.on(fgui.Events.CLICK_ITEM, this, this.OnClickColor2);
        this.m_lvColorList4.on(fgui.Events.CLICK_ITEM, this, this.OnClickColor);
        this.m_lvColorList4.on(fgui.Events.RIGHT_CLICK_ITEM, this, this.OnRightClickColor);

        this.InitColorList();
    }

    protected OnLostFocus() {
        this.OnSetColor(this.m_txColor.text, this.m_txOpaque.text);
    }
    protected OnEnter(ev: Laya.Event) {
        if (ev.keyCode == Laya.Keyboard.ENTER) {
            this.OnSetColor(this.m_txColor.text, this.m_txOpaque.text);
        }
    }

    protected OnSetColor(Color: string, Opaque: string) {
        Color = NormalizeColorStr(Color);
        this.m_ghColor.color = Color;
        this.m_txColor.text = Color;
        if (this.m_txOpaque.visible) {
            let Alpha = Saturate(Str2Number(this.m_txOpaque.text) / 100, 0, 100);
            Color = MakeFullColor(this.m_ghColor.color, Alpha);
        }        
        if (this.m_Color != Color) {
            this.m_Color = Color;
            if (this.m_SelectCallback) {                
                this.m_SelectCallback(this.m_Color);
            }

        }
    }
    protected OnClickColor(Item: ColorListItem) {
        this.OnSetColor(Item.color, this.m_txOpaque.text);
    }
    protected OnClickColor2(Item: ColorListItem) {
        this.InitColorList2(Item.data);
    }
    protected OnRightClickColor(Item: ColorListItem) {
        
    }
    protected InitColorList() {
        this.m_lvColorList1.removeChildrenToPool();
        this.m_lvColorList3.removeChildrenToPool();
        this.m_lvColorList4.removeChildrenToPool();
        let Item: ColorListItem;
        for (let i = 0; i <= 0xffffff; i += 0x111111) {
            Item = this.m_lvColorList1.addItemFromPool() as ColorListItem;
            Item.color = `#${DOSSystem.FormatHex(i, 6)}`;
        }       
        for (let i = 0; i <= 0xff0000; i += 0x110000) {
            Item = this.m_lvColorList1.addItemFromPool() as ColorListItem;
            Item.color = `#${DOSSystem.FormatHex(i, 6)}`;
        }
        for (let i = 0; i <= 0xff00; i += 0x1100) {
            Item = this.m_lvColorList1.addItemFromPool() as ColorListItem;
            Item.color = `#${DOSSystem.FormatHex(i, 6)}`;
            Item = this.m_lvColorList3.addItemFromPool() as ColorListItem;
            Item.color = `#${DOSSystem.FormatHex(i, 6)}`;
            Item.data = i >> 8;
        }
        for (let i = 0; i <= 0xff; i += 0x11) {
            Item = this.m_lvColorList1.addItemFromPool() as ColorListItem;
            Item.color = `#${DOSSystem.FormatHex(i, 6)}`;
        }
        
        for (let i = 0; i < 48; i ++) {
            Item = this.m_lvColorList4.addItemFromPool() as ColorListItem;
            Item.color = `#ffffff`;
        }
        this.InitColorList2(0);
    }
    protected InitColorList2(Green: number) {
        this.m_lvColorList2.removeChildrenToPool();
        for (let Red = 0; Red <= 0xff; Red += 0x11) {
            for (let Blue = 0; Blue <= 0xff; Blue += 0x11) {
                let Item = this.m_lvColorList2.addItemFromPool() as ColorListItem;
                Item.color = `#${DOSSystem.FormatHex(Red << 16 | Green << 8 | Blue, 6)}`;
            }
        }
    }

    public Show(Color: string, This: any, Callback: (Color: string) => void, Parent: fgui.GObject) {
        this.m_Color = NormalizeColorStr(Color);        
        if (this.m_Color.length > 7) {
            this.m_ghColor.color = GetColorStrFromFullColor(this.m_Color);
            this.m_txColor.text = this.m_ghColor.color;
            let Opaque = Math.round(GetAlphaFromFullColor(this.m_Color) * 100 / 255);
            this.m_txOpaque.visible = true;
            this.m_txOpaque.text = Opaque.toString();
        }
        else {
            this.m_ghColor.color = this.m_Color;
            this.m_txColor.text = this.m_ghColor.color;
            this.m_txOpaque.visible = false;
        }
        if (This)
            this.m_SelectCallback = Callback.bind(This);
        else
            this.m_SelectCallback = Callback;
        fgui.GRoot.inst.showPopup(this, Parent);
    }
}