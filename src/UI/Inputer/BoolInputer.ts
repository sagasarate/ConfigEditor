import { DataManager } from "../../DataManager";
import { Str2Bool } from "../../Tools";

export class BoolInputer extends fgui.GButton {
    protected m_BindObject: any;
    protected m_BindMember = "";
    protected m_Flag = 0;
    protected m_Reverse = false;

    protected onConstruct(): void {
        super.onConstruct();

        this.onClick(this, this.OnClick);
    }

    protected OnClick() {
        if (this.m_BindObject) {
            let OldValue: boolean;
            if (typeof this.m_BindObject[this.m_BindMember] == "boolean") {
                OldValue = this.m_BindObject[this.m_BindMember];
            }
            else if (typeof this.m_BindObject[this.m_BindMember] == "string") {
                OldValue = Str2Bool(this.m_BindObject[this.m_BindMember]);
            }
            else {
                OldValue = (this.m_BindObject[this.m_BindMember] & this.m_Flag) != 0;;
            }
            if (this.m_Reverse) {
                if (this.selected != !OldValue) {
                    if (typeof this.m_BindObject[this.m_BindMember] == "boolean")
                        this.m_BindObject[this.m_BindMember] = !this.selected;
                    else if (typeof this.m_BindObject[this.m_BindMember] == "string")
                        this.m_BindObject[this.m_BindMember] = this.selected ? "0" : "1";
                    else if (this.selected)
                        this.m_BindObject[this.m_BindMember] &= ~this.m_Flag;
                    else
                        this.m_BindObject[this.m_BindMember] |= this.m_Flag;
                    this.m_BindObject.SetModified();
                }
            }
            else {
                if (this.selected != OldValue) {
                    if (typeof this.m_BindObject[this.m_BindMember] == "boolean")
                        this.m_BindObject[this.m_BindMember] = this.selected;
                    else if (typeof this.m_BindObject[this.m_BindMember] == "string")
                        this.m_BindObject[this.m_BindMember] = this.selected ? "1" : "0";
                    else if (this.selected)
                        this.m_BindObject[this.m_BindMember] |= this.m_Flag;
                    else
                        this.m_BindObject[this.m_BindMember] &= ~this.m_Flag;
                    this.m_BindObject.SetModified();
                }
            }
            
        }        
    }

    public Bind(Obj: any, Member: string, Reverse?: boolean): boolean {

        if (typeof Obj[Member] == "boolean" || typeof Obj[Member] == "string") {
            this.m_BindObject = Obj;
            this.m_BindMember = Member;
            if (Reverse !== undefined)
                this.m_Reverse = Reverse;
            this.RefreshData();
            return true;
        }
        else {
            DataManager.Instance.LogError(`${Obj}的${Member}类型不匹配，无法绑定`);
        }
        return false;
    }
    public BindFlag(Obj: any, Member: string, Flag: number, Reverse?: boolean): boolean {
        if (typeof Obj[Member] == "number") {
            this.m_BindObject = Obj;
            this.m_BindMember = Member;
            this.m_Flag = Flag;
            if (Reverse !== undefined)
                this.m_Reverse = Reverse;
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
            if (typeof this.m_BindObject[this.m_BindMember] == "boolean") {
                if (this.m_Reverse)
                    this.selected = !this.m_BindObject[this.m_BindMember];
                else
                    this.selected = this.m_BindObject[this.m_BindMember];
            }
            else if (typeof this.m_BindObject[this.m_BindMember] == "string") {
                if (this.m_Reverse)
                    this.selected = !Str2Bool(this.m_BindObject[this.m_BindMember]);
                else
                    this.selected = Str2Bool(this.m_BindObject[this.m_BindMember]);
            }
            else {
                if (this.m_Reverse)
                    this.selected = (this.m_BindObject[this.m_BindMember] & this.m_Flag) == 0;
                else
                    this.selected = (this.m_BindObject[this.m_BindMember] & this.m_Flag) != 0;
            }
        }
    }
}