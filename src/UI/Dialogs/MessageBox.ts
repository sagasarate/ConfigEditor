import { BaseUI } from "../BaseUI"

export enum MESSAGE_BOX_RESULT_CODE {
   CANCEL,
   OK,
};

export enum  MESSAGE_BOX_SHOW_TYPE {
    OK,
    OK_CANCEL,
};

export class MessageBox extends BaseUI {

    public constructor() {
        super();
    }

    protected static m_Instance: MessageBox;
    public static get Instance(): MessageBox {
        if (!MessageBox.m_Instance) {
            MessageBox.m_Instance = new MessageBox();
            MessageBox.m_Instance.show();
            MessageBox.m_Instance.hideImmediately();
        }

        return MessageBox.m_Instance;
    }

    protected m_tvContent: fgui.GLabel;
    protected m_btnOk: fgui.GButton;
    protected m_btnCancel: fgui.GButton;
    protected m_Frame: fgui.GLabel;
    protected m_Callback: Function;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgMessageBox").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "MessageBox";
        this.m_tvContent = this.GetComponent<fgui.GLabel>("tvContent");
        this.m_btnOk = this.GetComponent<fgui.GButton>("btnOk");
        this.m_btnCancel = this.GetComponent<fgui.GButton>("btnCancel");
        this.m_Frame = this.GetComponent<fgui.GLabel>("frame");

        this.m_btnOk.onClick(this, this.OnOK);
        this.m_btnCancel.onClick(this, this.OnCancel);
        this.modal = true;

    }

    public SetShowType(ShowType: MESSAGE_BOX_SHOW_TYPE): void {
        if (ShowType == MESSAGE_BOX_SHOW_TYPE.OK_CANCEL) {
            this.m_btnCancel.visible = true;
            this.m_btnOk.visible = true;
            this.m_btnCancel.x = (this.contentPane.width - this.m_btnCancel.width - this.m_btnOk.width - this.m_btnCancel.width) / 2;
            this.m_btnOk.x = this.m_btnCancel.x + this.m_btnCancel.width * 2;

        }
        else {
            this.m_btnCancel.visible = false;
            this.m_btnOk.visible = true;
            this.m_btnOk.x = (this.contentPane.width - this.m_btnOk.width) / 2;
        }
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
            this.m_Callback(MESSAGE_BOX_RESULT_CODE.OK);
    }
    protected OnCancel(): void {
        this.hide();
        if (this.m_Callback != null)
            this.m_Callback(MESSAGE_BOX_RESULT_CODE.CANCEL);
    }

    public Show(Content: string, ShowType?: MESSAGE_BOX_SHOW_TYPE, Target?: any,  CallBack?: (Result: MESSAGE_BOX_RESULT_CODE) => void): void {
        if (Target && CallBack)
            this.m_Callback = CallBack.bind(Target);
        else
            this.m_Callback = CallBack;
        this.SetShowType(ShowType);
        if (this.isShowing) {
            this.m_tvContent.text += `\r\n${Content}`;
        }
        else {
            this.m_tvContent.text = Content;
        }
        this.show();
        this.requestFocus();
    }

    public ShowAsync(Content: string, ShowType?: MESSAGE_BOX_SHOW_TYPE): Promise<MESSAGE_BOX_RESULT_CODE> {
        return new Promise<MESSAGE_BOX_RESULT_CODE>(function (resolve, reject) {
            this.Show(Content, ShowType, this, (Result: MESSAGE_BOX_RESULT_CODE) => {
                resolve(Result);
            })           
        }.bind(this));
    }
};