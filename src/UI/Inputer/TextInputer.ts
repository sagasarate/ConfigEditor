import { InputBox } from "../Dialogs/InputBox";
import { DataManager } from "../../DataManager";

export class TextInputer extends fgui.GComponent {
    protected m_Value: string = "";
    protected m_BindObject: any;
    protected m_BindMember = "";

    protected m_txValue: fgui.GTextInput;
        
    protected m_onChange: Function;

    protected onConstruct(): void {
        this.m_txValue = this.getChild("txValue") as fgui.GTextInput;

        this.m_txValue.text = this.m_Value.toString();

        this.m_txValue.on(Laya.Event.BLUR, this, this.OnLostFocus);
        this.m_txValue.on(Laya.Event.KEY_UP, this, this.OnKeyUp)

        let Btn = this.getChild("btnEdit") as fgui.GButton;
        Btn.onClick(this, this.OnEdit);
    }
    protected OnLostFocus() {
        if (this.m_txValue.text !== this.m_Value) {
            this.m_Value = this.m_txValue.text;
            if (this.m_onChange)
                this.m_onChange(this.m_Value);
            if (this.m_BindObject && this.m_BindObject[this.m_BindMember] != this.m_Value) {
                this.m_BindObject[this.m_BindMember] = this.m_Value;
                this.m_BindObject.SetModified();
            }
        }
    }
    protected OnKeyUp(ev: Laya.Event) {
        if (ev.keyCode == Laya.Keyboard.ENTER) {
            this.OnLostFocus();
        }
    }
    protected OnEdit() {
        InputBox.Instance.Show("编辑", this.value, this, (Input: string, Param: any) => {
            if (Input !== undefined) {
                this.value = Input;
            }
        });
    }
    public onChange(This: any, Callback: (Value: string) => void) {
        if (This)
            this.m_onChange = Callback.bind(This);
        else
            this.m_onChange = Callback;
    }
    public get text(): string {
        return this.m_txValue.text;
    }
    private set text(v: string) {
        this.m_txValue.text = v;
    }

    public get value(): string {        
        return this.m_Value;
    }
    public set value(v: string) {
        if (this.m_Value !== v) {
            this.m_Value = v;
            this.m_txValue.text = this.m_Value;
            if (this.m_BindObject && this.m_BindObject[this.m_BindMember] != this.m_Value) {
                this.m_BindObject[this.m_BindMember] = this.m_Value;
                this.m_BindObject.SetModified();
            }
        }
    }

    public Bind(Obj: any, Member: string): boolean {
        if (typeof Obj[Member] == "string") {
            this.m_BindObject = Obj;
            this.m_BindMember = Member;
            this.RefreshData();
            return true;
        }
        else {
            DataManager.Instance.LogError(`${Obj}的${Member}类型不匹配，无法绑定`);
        }
        return false;
    }
    public Unbind() {
        this.m_BindObject = null;
    }
    public RefreshData() {
        if (this.m_BindObject) {
            this.m_Value = this.m_BindObject[this.m_BindMember];
            this.m_txValue.text = this.m_Value.toString();
        }
    }
}