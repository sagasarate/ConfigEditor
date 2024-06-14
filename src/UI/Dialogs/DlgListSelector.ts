import { BaseUI } from "../BaseUI"



export class DlgListSelector extends BaseUI {

    protected static m_Instance: DlgListSelector;
    public static get Instance(): DlgListSelector {
        if (!DlgListSelector.m_Instance) {
            DlgListSelector.m_Instance = new DlgListSelector();
            DlgListSelector.m_Instance.show();
            DlgListSelector.m_Instance.hideImmediately();
        }

        return DlgListSelector.m_Instance;
    }

    protected m_lvContent: fgui.GList;
    protected m_btnOk: fgui.GButton;
    protected m_Callback: Function;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgListSelector").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "DlgListSelector";
        this.m_lvContent = this.GetComponent<fgui.GList>("lvContent");
        this.m_btnOk = this.GetComponent<fgui.GButton>("btnOk");
        this.m_btnOk.onClick(this, this.OnOK);

        this.modal = true;
    }
    protected onHide(): void {
        if (this.m_Callback) {
            this.m_Callback(false);
            this.m_Callback = null;
        }

    }
    public RemoveAllItem() {
        this.m_lvContent.removeChildrenToPool();
    }

    public get numItems(): number {
        return this.m_lvContent.numChildren;
    }

    public GetItem(Index: number): fgui.GButton {
        return this.m_lvContent.getChildAt(Index) as fgui.GButton;
    }

    public AddItem(): fgui.GButton {
        return this.m_lvContent.addItemFromPool() as fgui.GButton;
    }
    public get SelectedItem(): fgui.GButton {
        if (this.m_lvContent.selectedIndex >= 0) {
            return this.m_lvContent.getChildAt(this.m_lvContent.selectedIndex) as fgui.GButton;
        }
        return null;
    }
    protected OnOK() {
        if (this.m_Callback) {
            this.m_Callback(true);
            this.m_Callback = null;
        }
        this.hide();
    }
    public Show(Title: string, This: any, Callback: (Succeed: boolean) => void) {
        this.frame.text = Title;
        if (Callback)
            this.m_Callback = Callback.bind(This);
        this.show();
    }
};