import { DataManager } from "../../DataManager";
import { Str2Number } from "../../Tools";

export class ValueInputer extends fgui.GComponent {
    protected m_Value: string | number = "";
    protected m_ValueType = "string";
    protected m_BindObject: any;
    protected m_BindMember = "";

    protected m_txValue: fgui.GTextInput;

    protected m_onChange: Function;
    protected m_Text2Value: Function;
    protected m_Value2Text: Function;


    protected onConstruct(): void {
        this.m_txValue = this.getChild("txValue") as fgui.GTextInput;

        this.m_txValue.text = this.m_Value.toString();

        this.m_txValue.on(Laya.Event.BLUR, this, this.OnLostFocus);
        this.m_txValue.on(Laya.Event.KEY_UP, this, this.OnKeyUp)
    }
    protected OnLostFocus() {
        let Value;
        if (this.m_Text2Value) {
            Value = this.m_Text2Value(this.m_txValue.text);
            if (this.m_Value2Text)
                this.m_txValue.text = this.m_Value2Text(Value);
        }
        else if (this.m_ValueType == "number") {
            Value = Str2Number(this.m_txValue.text);
            this.m_txValue.text = Value.toString();
        }
        else {
            Value = this.m_txValue.text;
        }
        if (Value !== this.m_Value) {
            this.m_Value = Value;
            if (this.m_onChange)
                this.m_onChange(this.m_Value);
            if (this.m_BindObject && this.m_BindObject[this.m_BindMember] !== this.m_Value) {
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
    public onChange(This: any, Callback: (Value: string | number) => void) {
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
        if (this.m_Text2Value)
            this.m_Value = this.m_Text2Value(v);
        else if (this.m_ValueType == "number")
            this.m_Value = Str2Number(v);
        else
            this.m_Value = v;
    }

    public get value(): string | number {        
        return this.m_Value;
    }
    public set value(v: string | number) {
        if (this.m_Value !== v) {
            this.m_Value = v;
            this.m_ValueType = typeof v;
            if (this.m_Value2Text)
                this.m_txValue.text = this.m_Value2Text(this.m_Value);
            else
                this.m_txValue.text = this.m_Value.toString();
            if (this.m_BindObject && this.m_BindObject[this.m_BindMember] != this.m_Value) {
                this.m_BindObject[this.m_BindMember] = this.m_Value;
                this.m_BindObject.SetModified();
            }
                
        }        
    }
    public get singleLine(): boolean {
        return this.m_txValue.singleLine;
    }
    public set singleLine(v: boolean) {
        this.m_txValue.singleLine = v;
    }
    public get align(): fgui.AlignType {
        return this.m_txValue.align;
    }
    public set align(v: fgui.AlignType) {
        this.m_txValue.align = v;
    }
    public get valign(): fgui.VertAlignType {
        return this.m_txValue.valign;
    }
    public set valign(v: fgui.VertAlignType) {
        this.m_txValue.valign = v;
    }

    public Bind(Obj: any, Member: string, ValueType?: string): boolean {
        if (typeof Obj[Member] == "string" || typeof Obj[Member] == "number" || ValueType) {
            this.m_BindObject = Obj;
            this.m_BindMember = Member;
            this.m_ValueType = ValueType ? ValueType : typeof Obj[Member];
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
            if (this.m_Value === undefined) {
                if (this.m_ValueType == "number")
                    this.m_Value = 0;
                else
                    this.m_Value = "";
            }
            if (this.m_Value2Text)
                this.m_txValue.text = this.m_Value2Text(this.m_Value);
            else
                this.m_txValue.text = this.m_Value.toString();
        }
    }
    public SetValueTranslater(This: object, Text2Value: (Text: string) => string | number, Value2Text: (Value: string | number) => string) {
        if (This) {
            this.m_Text2Value = Text2Value.bind(This);
            this.m_Value2Text = Value2Text.bind(This);
        }
        else {
            this.m_Text2Value = Text2Value;
            this.m_Value2Text = Value2Text;
        }
    }
}