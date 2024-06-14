import { BaseUI } from "../BaseUI"
import { ListView } from "../Components/ListView"
import { DataManager} from "../../DataManager"
import { MessageBox, MESSAGE_BOX_RESULT_CODE, MESSAGE_BOX_SHOW_TYPE } from "./MessageBox";
import { InputBox } from "./InputBox";
import { FileInfo, FolderInfo, FileSystem } from "../../FileSystem/FileSystem";
import JSZip from "jszip";

export enum FILE_EXPLORER_MODE {
    EXPLORER_ALL_FILE,
    CONFIG_DATA_MANAGER,
    EXITOR_EXTEND_MANAGER,
    EXPLORER_SELECT_DIR,
}

class FolderTreeNode extends fgui.GTreeNode {
    public Info: FolderInfo;

    constructor(Info: FolderInfo) {
        super();
        this.Info = Info;
    }
//    public FindChild(ID: number) {
//        if (this.Info.id == ID)
//            return this;
//        for (let i = 0; i < this.numChildren; i++) {
//            let Node = this.getChildAt(i) as FolderTreeNode;
//            Node = Node.FindChild(ID);
//            if (Node)
//                return Node;
//        }
//        return null;
//    }
}

export class DlgFileExplorer extends BaseUI {

    public constructor() {
        super();
    }

    protected static m_Instance: DlgFileExplorer;
    public static get Instance(): DlgFileExplorer {
        if (!DlgFileExplorer.m_Instance) {
            DlgFileExplorer.m_Instance = new DlgFileExplorer();
        }

        return DlgFileExplorer.m_Instance;
    }

    protected m_Mode = FILE_EXPLORER_MODE.EXPLORER_ALL_FILE;
    protected m_Callback: Function;

    protected m_RootNode: FolderTreeNode;

    protected m_tvFolders: fgui.GTree;
    protected m_lvFiles: ListView;
    protected m_lvOperateButtons: fgui.GList;
    

    

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgFileExplorer").asCom;
        this.center();
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        this.name = "DlgFileExplorer";
        this.m_tvFolders = this.GetComponent("tvFolders");
        this.m_lvFiles = this.GetComponent("lvFiles");
        this.m_lvOperateButtons = this.GetComponent("lvOperateButtons");


        this.m_lvFiles.on(ListView.EVENT_CLICK_ITEM, this, this.OnClickFileItem);

        let rootNode = new FolderTreeNode(null);
        rootNode._setTree(this.m_tvFolders);
        rootNode.expanded = true;
        this.m_tvFolders.rootNode = rootNode;
        this.m_tvFolders.treeNodeRender = DlgFileExplorer.RenderTreeItem;
        this.m_tvFolders.on(fgui.Events.CLICK_ITEM, this, this.OnClickFolderItem);

        this.m_lvFiles.AddColumn("文件名", 100);
        this.m_lvFiles.AddColumn("大小", 60);
        this.m_lvFiles.AddColumn("创建时间", 60);
        this.m_lvFiles.AddColumn("更新时间", 60);
        this.m_lvFiles.AddColumn("别名", 60);
        this.m_lvFiles.AllColumnSizeAutoFit();

        this.modal = true;
    }
        

    protected OnExport() {
        let Node = this.m_tvFolders.getSelectedNode() as FolderTreeNode;
        if (Node) {
            if (this.m_lvFiles.selectedIndex >= 0) {
                let Info = this.m_lvFiles.GetRowData(this.m_lvFiles.selectedIndex) as FileInfo;
                if (Info) {
                    FileSystem.Instance.SaveFile(Info.Name, Info);
                }
            }
            else {
                FileSystem.Instance.SaveFolder(Node.Info, true);
            }
        }
        else {
            MessageBox.Instance.Show("请选择要导出的文件或目录");
        }
    }
    protected async DoImport(Filter: string) {
        let Node = this.m_tvFolders.getSelectedNode() as FolderTreeNode;
        if (Node) {
            fgui.GRoot.inst.showModalWait();
            let Files = await FileSystem.Instance.SelectFile(Filter, true);
            if (Files) {
                for (let File of Files) {
                    if (await FileSystem.Instance.CreateFile(Node.Info, File.FileName, File.Data) == null) {
                        DataManager.Instance.LogError(`保存文件[${File.FileName}]到[${Node.Info.PathName}]失败`);
                    }
                }
            }
            fgui.GRoot.inst.closeModalWait();
        }
        else {
            MessageBox.Instance.Show("请选择一个目录来导入");
        }
    }
    protected OnImport() {
        this.DoImport("AllFiles|*.*");
    }
    protected OnImportJson() {
        this.DoImport("Json Files|*.json");
    }
    protected OnCreateFolder() {        
        let Node = this.m_tvFolders.getSelectedNode() as FolderTreeNode;
        if (Node) {
            InputBox.Instance.Show("请输入目录名", "新目录",this, function (Input: string, Param: any) {
                if (Input && Input.length > 0) {
                    fgui.GRoot.inst.showModalWait();
                    FileSystem.Instance.CreateFolder(Node.Info, Input).then((function (Succeed: boolean) {
                        fgui.GRoot.inst.closeModalWait();
                        if (Succeed) {
                            this.Refresh();
                        }                            
                    }).bind(this));
                }
            });

        }
        else {
            MessageBox.Instance.Show("请选择要创建目录的父目录");
        }
    }
    protected OnRemove() {
        if (this.m_lvFiles.selectedIndex >= 0) {
            let Info = this.m_lvFiles.GetRowData(this.m_lvFiles.selectedIndex) as FileInfo;
            if (Info) {
                MessageBox.Instance.Show(`是否要删除文件[${Info.Name}]`, MESSAGE_BOX_SHOW_TYPE.OK_CANCEL, this,
                    (Result: MESSAGE_BOX_RESULT_CODE) => {
                        if (Result == MESSAGE_BOX_RESULT_CODE.OK) {
                            fgui.GRoot.inst.showModalWait();
                            FileSystem.Instance.RemoveFile(Info).then((Succeed: boolean) => {
                                fgui.GRoot.inst.closeModalWait();
                                if (Succeed)
                                    this.m_lvFiles.DeleteItem(this.m_lvFiles.selectedIndex);
                            });
                        }
                    });
            }
            else {
                MessageBox.Instance.Show("数据错误");
            }
        }
        else {
            let Node = this.m_tvFolders.getSelectedNode() as FolderTreeNode;
            if (Node && Node.Info) {
                MessageBox.Instance.Show(`是否要删除目录[${Node.Info.Name}]`, MESSAGE_BOX_SHOW_TYPE.OK_CANCEL, this,
                    (Result: MESSAGE_BOX_RESULT_CODE) => {
                        if (Result == MESSAGE_BOX_RESULT_CODE.OK) {
                            fgui.GRoot.inst.showModalWait();
                            FileSystem.Instance.RemoveFolder(Node.Info).then((function (Succeed: boolean) {
                                fgui.GRoot.inst.closeModalWait();
                                if (Succeed)
                                    this.FillFolders();
                            }));
                        }
                    });
            }
            else {
                MessageBox.Instance.Show("请选择一个要删除的文件或者目录");
            }
        }
    }
    protected OnExportXls() {
        let Info: FileInfo;
        if (this.m_lvFiles.selectedIndex >= 0)
            Info = this.m_lvFiles.GetRowData(this.m_lvFiles.selectedIndex) as FileInfo;
        if (Info) {
            fgui.GRoot.inst.showModalWait();
            DataManager.Instance.ExportConfigDataToXls(Info).then(function (Succeed: boolean) {
                fgui.GRoot.inst.closeModalWait();
            });
        }
        else {
            MessageBox.Instance.Show("请选择要导出的数据文件");
        }
    }
    protected OnImportXls() {
        let Node = this.m_tvFolders.getSelectedNode() as FolderTreeNode;
        if (Node && Node.Info) {
            DataManager.Instance.ImportConfigXlsx(Node.Info).then(function (Count: number) {
            });
        }
        else {
            MessageBox.Instance.Show("请选择一个要存放导入文件的目录");
        }
    }
    protected OnRefresh() {        
        this.Refresh();
    }

    protected OnSelectFolder() {
        let Node = this.m_tvFolders.getSelectedNode() as FolderTreeNode;
        if (Node && Node.Info) {
            if (this.m_Callback) {
                this.m_Callback(Node.Info);
                this.m_Callback = null;
            }
            this.hide();
        }
        else {
            MessageBox.Instance.Show("请选择一个要删除的文件或者目录");
        }
    }

    static RenderTreeItem(Node: FolderTreeNode, Obj: fgui.GComponent) {
        Node.text = Node.Info.Name;
    }

    protected OnClickFolderItem(Item: fgui.GComponent): void {
        let Node = Item.treeNode as FolderTreeNode;
        if (Node) {
            this.FillFiles(Node.Info);
        }
    }
    protected OnClickFileItem(Row: number, Col: number) {
    }

    public show(Mode?: FILE_EXPLORER_MODE, Target?: any, CallBack?: (FileInfo: FileInfo | FolderInfo) => void): void {
        super.show();
        if (Mode)
            this.m_Mode = Mode;
        else
            this.m_Mode = FILE_EXPLORER_MODE.EXPLORER_ALL_FILE;
        if (CallBack)
            this.m_Callback = CallBack.bind(Target);       
        this.FillFolders();
    }

    protected onHide(): void {
        if (this.m_Callback) {
            this.m_Callback(null);
            this.m_Callback = null;
        }
    }

    protected Refresh(): void {
        this.FillFolders();
    }

    protected async FillFolders() {
        this.m_tvFolders.rootNode.removeChildren();
        this.m_lvFiles.DeleteAllItems();
        this.m_lvOperateButtons.removeChildrenToPool();        
        let RootFolder;
        let Item: fgui.GButton;
        switch (this.m_Mode) {
            case FILE_EXPLORER_MODE.CONFIG_DATA_MANAGER:
                RootFolder = DataManager.Instance.ConfigDataFolder;

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导入Xls";
                Item.resetClick();
                Item.onClick(this, this.OnImportXls);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导出为Xls";
                Item.resetClick();
                Item.onClick(this, this.OnExportXls);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "删除文件";
                Item.resetClick();
                Item.onClick(this, this.OnRemove);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "新建目录";
                Item.resetClick();
                Item.onClick(this, this.OnCreateFolder);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导入文件";
                Item.resetClick();
                Item.onClick(this, this.OnImport);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导出文件";
                Item.resetClick();
                Item.onClick(this, this.OnExport);
                break;
            case FILE_EXPLORER_MODE.EXITOR_EXTEND_MANAGER:
                RootFolder = DataManager.Instance.ConfigDataFolder;

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "删除文件";
                Item.resetClick();
                Item.onClick(this, this.OnRemove);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "新建目录";
                Item.resetClick();
                Item.onClick(this, this.OnCreateFolder);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导入文件";
                Item.resetClick();
                Item.onClick(this, this.OnImport);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导出文件";
                Item.resetClick();
                Item.onClick(this, this.OnExport);
                break;
            case FILE_EXPLORER_MODE.EXPLORER_ALL_FILE:
                RootFolder = await FileSystem.Instance.LoadFolder("");
                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "删除文件";
                Item.resetClick();
                Item.onClick(this, this.OnRemove);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "新建目录";
                Item.resetClick();
                Item.onClick(this, this.OnCreateFolder);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导入文件";
                Item.resetClick();
                Item.onClick(this, this.OnImport);

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "导出文件";
                Item.resetClick();
                Item.onClick(this, this.OnExport);
                break;
            case FILE_EXPLORER_MODE.EXPLORER_SELECT_DIR:
                RootFolder = await FileSystem.Instance.LoadFolder("");

                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "新建目录";
                Item.resetClick();
                Item.onClick(this, this.OnCreateFolder);
                
                Item = this.m_lvOperateButtons.addItemFromPool() as fgui.GButton;
                Item.text = "选择目录";
                Item.resetClick();
                Item.onClick(this, this.OnSelectFolder);
                break;
        }
        if (RootFolder) {
            this.m_RootNode = new FolderTreeNode(RootFolder);
            this.m_RootNode.expanded = true;
            this.m_tvFolders.rootNode.addChild(this.m_RootNode);
            this.FillFolder(this.m_RootNode.Info, this.m_RootNode);
        }        
    }
   
    protected FillFiles(Folder: FolderInfo) {
        this.m_lvFiles.DeleteAllItems();
        for (let File of Folder.Files) {
            let Item = this.m_lvFiles.InsertRow();
            this.m_lvFiles.SetItem(Item, 0, File[1].Name);
            this.m_lvFiles.SetItem(Item, 1, File[1].Size.toString());
            let CreateTime = new Date(File[1].CreateTime * 1000);
            this.m_lvFiles.SetItem(Item, 2, CreateTime.toLocaleString("zh"));
            let LastWriteTime = new Date(File[1].LastWriteTime * 1000);
            this.m_lvFiles.SetItem(Item, 3, LastWriteTime.toLocaleString("zh"));
            this.m_lvFiles.SetItem(Item, 4, File[1].Alias);
            this.m_lvFiles.SetRowData(Item, File[1]);
        }
        this.m_lvFiles.AllColumnSizeAutoFit();
    }   

    protected FillFolder(Root: FolderInfo, Node: FolderTreeNode) {
        for (let Folder of Root.ChildFolders.values()) {
            let Item = new FolderTreeNode(Folder);
            Node.addChild(Item);
            this.FillFolder(Folder, Item);
        }
    }
}