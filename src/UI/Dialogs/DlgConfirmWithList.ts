import { BaseUI } from "../BaseUI"

export class ConfirmListItem extends fgui.GButton {

    public m_cbCheck: fgui.GButton;

    protected onConstruct(): void {
        this.m_cbCheck = this.getChild("cbCheck") as fgui.GButton;
    }

    public get checked(): boolean {
        return this.m_cbCheck.selected;
    }
    public set checked(value: boolean) {
        this.m_cbCheck.selected = value;
    }
};

export class DlgConfirmWithList extends BaseUI {

    protected static m_Instance: DlgConfirmWithList;
    public static get Instance(): DlgConfirmWithList {
        if (!DlgConfirmWithList.m_Instance) {
            DlgConfirmWithList.m_Instance = new DlgConfirmWithList();
            DlgConfirmWithList.m_Instance.show();
            DlgConfirmWithList.m_Instance.hideImmediately();
        }

        return DlgConfirmWithList.m_Instance;
    }

    protected m_lvContent: fgui.GList;
    protected m_btnOk: fgui.GButton;
    protected m_btnCancel: fgui.GButton;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgConfirmWithList").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "DlgConfirmWithList";
        this.m_lvContent = this.GetComponent<fgui.GList>("lvContent");
        this.m_btnOk = this.GetComponent<fgui.GButton>("btnOk");
        this.m_btnCancel = this.GetComponent<fgui.GButton>("btnCancel");        
    }

    public RemoveAllItem() {
        this.m_lvContent.removeChildrenToPool();
    }

    public get numItems(): number {
        return this.m_lvContent.numChildren;
    }

    public GetItem(Index: number): ConfirmListItem {
        return this.m_lvContent.getChildAt(Index) as ConfirmListItem;
    }

    public AddItem(): ConfirmListItem {
        return this.m_lvContent.addItemFromPool() as ConfirmListItem;
    }
    public ShowAsync(): Promise<boolean> {
        return new Promise<boolean>((function (resolve, reject) {
            this.m_btnOk.resetClick();
            this.m_btnCancel.resetClick();
            this.m_btnOk.onClick(this, function () {
                this.hide();
                resolve(true);
            });
            this.m_btnCancel.onClick(this, function () {
                this.hide();
                resolve(false);
            });
            this.show();
        }).bind(this));
    }
};