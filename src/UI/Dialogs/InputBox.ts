import { BaseUI } from "../BaseUI"

export class InputBox extends BaseUI {

    public constructor() {
        super();
    }

    protected static m_Instance: InputBox;
    public static get Instance(): InputBox {
        if (!InputBox.m_Instance) {
            InputBox.m_Instance = new InputBox();
            InputBox.m_Instance.show();
            InputBox.m_Instance.hideImmediately();
        }

        return InputBox.m_Instance;
    }

    protected m_edContent: fgui.GLabel;
    protected m_btnOk: fgui.GButton;
    protected m_btnCancel: fgui.GButton;
    protected m_Frame: fgui.GLabel;
    protected m_Callback: Function;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgInputBox").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "InputBox";
        this.m_edContent = this.GetComponent<fgui.GLabel>("edContent");
        this.m_btnOk = this.GetComponent<fgui.GButton>("btnOk");
        this.m_btnCancel = this.GetComponent<fgui.GButton>("btnCancel");
        this.m_Frame = this.GetComponent<fgui.GLabel>("frame");

        this.m_btnOk.onClick(this, this.OnOK);
        this.m_btnCancel.onClick(this, this.OnCancel);
        this.modal = true;

    }
    public set Title(value: string) {
        this.m_Frame.text = value;
    }
    public get Title(): string {
        return this.m_Frame.text;
    }
    protected OnOK(): void {
        this.hide();
        if (this.m_Callback != null)
            this.m_Callback(this.m_edContent.text);
    }
    protected OnCancel(): void {
        this.hide();
        if (this.m_Callback != null)
            this.m_Callback(undefined);
    }

    public Show(Title: string, Content: string, This:any,CallBack: (Input: string, Param: any) => void): void {
        if (CallBack)
            this.m_Callback = CallBack.bind(This);
        else
            this.m_Callback = CallBack;
        this.Title = Title;
        this.m_edContent.text = Content;
        this.show();
        this.m_edContent.requestFocus();
    }
};