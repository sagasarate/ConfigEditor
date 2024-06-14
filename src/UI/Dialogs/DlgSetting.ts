import { electronAPI } from "../../FileSystem/ElectronAPI";
import { FolderInfo, Path } from "../../FileSystem/FileSystem";
import { SystemConfig } from "../../SystemConfig";
import { BaseUI } from "../BaseUI";
import { ValueInputer } from "../Inputer/ValueInputer";
import { DlgFileExplorer, FILE_EXPLORER_MODE } from "./DlgFileExplorer";

export class DlgSetting extends BaseUI {

    protected static m_Instance: DlgSetting;
    public static get Instance(): DlgSetting {
        if (!DlgSetting.m_Instance) {
            DlgSetting.m_Instance = new DlgSetting();
        //    DlgSetting.m_Instance.show();
        //    DlgSetting.m_Instance.hideImmediately();
        }

        return DlgSetting.m_Instance;
    }

    protected m_txConfigDataPath: ValueInputer;
    protected m_txEditorDataPath: ValueInputer;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgSetting").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "DlgSetting";
        this.m_txConfigDataPath = this.GetComponent("txConfigDataPath");
        this.m_txEditorDataPath = this.GetComponent("txEditorDataPath");

        this.RegisterOnClick("btnSelectConfigDataPath", this, this.OnSelectConfigDataPath);
        this.RegisterOnClick("btnSelectEditorDataPath", this, this.OnSelectEditorDataPath);

        this.modal = true;
    }

    protected onHide(): void {
        SystemConfig.Instance.SaveConfig();
    }


    protected OnSelectConfigDataPath() {
        if (electronAPI) {
            let ShowPath = Path.GetPathDir(this.m_txConfigDataPath.value.toString());
            ShowPath = ShowPath.replace(new RegExp("/", "g"), "\\");
            electronAPI.OpenFile({ defaultPath: ShowPath, properties: ["openDirectory"] }).then((Paths) => {
                if (Paths && Paths.length > 0) {
                    this.m_txConfigDataPath.value = Path.NormalizePath(Paths[0]);
                }
            });
        }
        else {
            DlgFileExplorer.Instance.show(FILE_EXPLORER_MODE.EXPLORER_SELECT_DIR, this, (Folder) => {
                if (Folder && Folder instanceof FolderInfo) {
                    this.m_txConfigDataPath.value = Folder.PathName;
                }
            });
        }
    }
    protected OnSelectEditorDataPath() {
        if (electronAPI) {
            let ShowPath = Path.GetPathDir(this.m_txEditorDataPath.value.toString());
            ShowPath = ShowPath.replace(new RegExp("/", "g"), "\\");
            electronAPI.OpenFile({ defaultPath: ShowPath, properties: ["openDirectory"] }).then((Paths) => {
                if (Paths && Paths.length > 0) {
                    this.m_txEditorDataPath.value = Path.NormalizePath(Paths[0]);
                }
            });
        }
        else {
            DlgFileExplorer.Instance.show(FILE_EXPLORER_MODE.EXPLORER_SELECT_DIR, this, (Folder) => {
                if (Folder && Folder instanceof FolderInfo) {
                    this.m_txEditorDataPath.value = Folder.PathName;
                }
            });
        }
    }

    public show() {
        super.show();
        this.m_txConfigDataPath.Bind(SystemConfig.Instance.MainConfig, "ConfigDataPath");
        this.m_txEditorDataPath.Bind(SystemConfig.Instance.MainConfig, "EditorDataPath");
    }
}