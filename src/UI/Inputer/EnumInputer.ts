import { DataManager } from "../../DataManager";

export class EnumInputer extends fgui.GComboBox {
    protected m_BindObject: any;
    protected m_BindMember = "";

    protected onConstruct(): void {
        super.onConstruct();

        this.on(fgui.Events.STATE_CHANGED, this, this.OnChange);
    }

    protected OnChange() {
        if (this.m_BindObject) {
            let Value = this.value;
            if (this.m_BindObject && Value !== undefined && Value != this.m_BindObject[this.m_BindMember]) {
                this.m_BindObject[this.m_BindMember] = this.value;
                this.m_BindObject.SetModified();
            }
        }
    }

    public Bind(Obj: any, Member: string): boolean {

        if (typeof Obj[Member] == "number" || typeof Obj[Member] == "string") {
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
            this.value = this.m_BindObject[this.m_BindMember];
            if (this.selectedIndex < 0) {
                this.selectedIndex = 0;
                this.OnChange();
            }
        }
    }
}