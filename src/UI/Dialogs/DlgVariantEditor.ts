import { EditorExtend } from "../../EditorExtend";
import { BaseUI } from "../BaseUI"
import { DlgListSelector } from "./DlgListSelector";

export class DlgVariantEditor extends BaseUI {

    public constructor() {
        super();
    }

    protected static m_Instance: DlgVariantEditor;
    public static get Instance(): DlgVariantEditor {
        if (!DlgVariantEditor.m_Instance) {
            DlgVariantEditor.m_Instance = new DlgVariantEditor();
            DlgVariantEditor.m_Instance.show();
            DlgVariantEditor.m_Instance.hideImmediately();
        }

        return DlgVariantEditor.m_Instance;
    }

    protected m_Value: any;
    protected m_edContent: fgui.GLabel;
    protected m_btnOk: fgui.GButton;
    protected m_btnPresetType: fgui.GButton;
    protected m_Frame: fgui.GLabel;
    protected m_Callback: Function;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgVariantEditor").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "DlgVariantEditor";
        this.m_edContent = this.GetComponent<fgui.GLabel>("edContent");
        this.m_btnOk = this.GetComponent<fgui.GButton>("btnOk");
        this.m_btnPresetType = this.GetComponent<fgui.GButton>("btnPresetType");
        this.m_Frame = this.GetComponent<fgui.GLabel>("frame");

        this.m_btnOk.onClick(this, this.OnOK);
        this.m_btnPresetType.onClick(this, this.OnPresetType);
        this.modal = true;

    }
    public set Title(value: string) {
        this.m_Frame.text = value;
    }
    public get Title(): string {
        return this.m_Frame.text;
    }
    protected onHide(): void {
        if (this.m_Callback != null) {
            this.m_Callback(undefined);
            this.m_Callback = null;
        }
            
    }
    protected OnOK(): void {
        if (this.m_Callback != null) {
            this.m_Value = EditorExtend.Instance.StringToStruct(this.m_edContent.text, "Variant", "", false);
            let ValueType = this.m_Value["$StructName"];
            if (ValueType && typeof ValueType == "string")
                EditorExtend.Instance.CompleteObject(this.m_Value, ValueType);
            this.m_Callback(this.m_Value);
            this.m_Callback = null;
        }
        this.hide();
    }
    protected OnPresetType(): void {
        DlgListSelector.Instance.RemoveAllItem();
        for (let Info of EditorExtend.Instance.PresetTypeList) {
            let Item = DlgListSelector.Instance.AddItem();
            Item.text = Info.Description;
            Item.data = Info.StructName;
        }
        DlgListSelector.Instance.Show("选择预置类型", this, (Succeed) => {
            if (Succeed) {
                let Item = DlgListSelector.Instance.SelectedItem;
                if (Item) {
                    let ValueType = Item.data;
                    this.m_Value = EditorExtend.Instance.CreateObject(ValueType, "", false);
                    this.m_Value["$StructName"] = ValueType;
                    this.m_edContent.text = EditorExtend.Instance.StructToString(this.m_Value, "Variant", "", false);
                }
            }
        });
    }
    public Show(Title: string, Value:any,ValueType: string, Target?: any, CallBack?: (Value: any) => void): void {
        if (CallBack)
            this.m_Callback = CallBack.bind(Target);

        this.Title = Title;
        this.m_Value = Value;
        this.m_edContent.text = EditorExtend.Instance.StructToString(this.m_Value, "Variant", "", false);
        this.show();
        this.m_edContent.requestFocus();
    }
};