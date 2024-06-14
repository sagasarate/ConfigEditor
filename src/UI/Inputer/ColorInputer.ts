import { GetAlphaFromFullColor, GetColorStrFromFullColor, NormalizeColorStr } from "../../Tools";
import { ColorSelectorPanel } from "../PopupPanel/ColorSelectorPanel";

export class ColorInputer extends fgui.GComponent {    
    protected m_Color: string;
    protected m_BindObject: any;
    protected m_BindMember = "";

    protected m_ghColor: fgui.GGraph;
    protected m_OnSetColor: Function;

    protected onConstruct(): void {
        this.m_ghColor = this.getChild("ghColor") as fgui.GGraph;

        this.m_ghColor.onClick(this, this.OnClick);
    }

    protected OnClick() {
        ColorSelectorPanel.Instance.Show(this.m_Color, this, this.OnSelectColor, this);
    }

    public get color(): string {
        return this.m_Color;
    }
    public set color(value: string) {
        this.m_Color = NormalizeColorStr(value);
        
        if (this.m_Color.length > 7) {
            this.m_ghColor.color = GetColorStrFromFullColor(this.m_Color);
            this.m_ghColor.alpha = GetAlphaFromFullColor(this.m_Color) / 255;
        }
        else {
            this.m_ghColor.color = this.m_Color;
            this.m_ghColor.alpha = 1;
        }
            
        if (this.m_BindObject && this.m_BindObject[this.m_BindMember] != this.m_Color) {
            this.m_BindObject[this.m_BindMember] = this.m_Color;
            this.m_BindObject.SetModified();
        }
    }
    protected OnSelectColor(Color: string) {
        this.color = Color;
        if (this.m_OnSetColor)
            this.m_OnSetColor(this.m_Color);
    }
    public onSetColor(This: any, Callback: (Color: string) => void) {
        if (This)
            this.m_OnSetColor = Callback.bind(This);
        else
            this.m_OnSetColor = Callback;
    }
    public Bind(Obj: any, Member: string): boolean {
        if (typeof Obj[Member] == "string") {
            this.m_BindObject = Obj;
            this.m_BindMember = Member;
            this.RefreshData();
            return true;
        }
        return false;
    }
    public Unbind() {
        this.m_BindObject = null;
    }
    public RefreshData() {
        if (this.m_BindObject) {
            this.m_Color = NormalizeColorStr(this.m_BindObject[this.m_BindMember]);
            if (this.m_Color.length > 7) {
                this.m_ghColor.color = GetColorStrFromFullColor(this.m_Color);
                this.m_ghColor.alpha = GetAlphaFromFullColor(this.m_Color) / 255;
            }
            else {
                this.m_ghColor.color = this.m_Color;
                this.m_ghColor.alpha = 1;
            }
        }
    }
}
