import { BaseUI } from "./BaseUI"
import { ListView} from "./Components/ListView"
import { PropertyGrid, PropertyGridNode } from "./Components/PropertyGrid"
import { DataManager} from "../DataManager"
import { MessageBox, MESSAGE_BOX_SHOW_TYPE, MESSAGE_BOX_RESULT_CODE } from "./Dialogs/MessageBox"
import { DlgFileExplorer, FILE_EXPLORER_MODE } from "./Dialogs/DlgFileExplorer"
import Long from "long";

import { EditorExtend, EditorUIInfo, StructDescInfo } from "../EditorExtend";
import { PopupMenuEx } from "./Components/PopupMenuEx";
import { WinSplitter } from "./Components/WinSplitter";
import { DlgDebugState } from "./Dialogs/DlgDebugState"
import { DlgSetting } from "./Dialogs/DlgSetting"
import { electronAPI } from "../FileSystem/ElectronAPI"
import { IsArray } from "../Tools"




export class MenuItem extends fgui.GButton {

    public ChildMenu: PopupMenuEx;

    protected onConstruct(): void {
        this.onClick(this, this.OnClick);
    }
    OnClick() {
        if (this.ChildMenu)
            this.ChildMenu.show(this, fgui.PopupDirection.Down);
    }
    public AddMenu(Name: string, target?: any, ClickCallback?: Function): MenuItem {
        if (!this.ChildMenu)
            this.ChildMenu = new PopupMenuEx;
        let Item = fgui.UIPackage.createObjectFromURL(fgui.UIPackage.getItemURL("MainUI", "MenuItem"), MenuItem) as MenuItem;
        Item.text = Name;
        if (ClickCallback)
            Item.onClick(target, ClickCallback);
        this.ChildMenu.list.addChild(Item);
        return Item;
    }
    public AddSeperator() {
        if (!this.ChildMenu)
            this.ChildMenu = new PopupMenuEx;
        this.ChildMenu.addSeperator();
    }
};

export class LogListItem extends fgui.GButton {
    public Content: fgui.GTextField;
    protected onConstruct(): void {
        this.Content = this.getChild("title") as fgui.GTextField;
    }
}

class MainTreeNode extends fgui.GTreeNode {
    public Name: string;
    public DataType: string;

    constructor(Name: string, Data: any, DataType: string) {
        super();
        this.Name = Name;
        this.data = Data;
        this.DataType = DataType;
    }
}


export class MainUI extends BaseUI {

    protected m_spHSplitter: WinSplitter;
    protected m_lvList: ListView;
    protected m_pdProperty: PropertyGrid;
    protected m_lvLog: fgui.GList;
    protected m_tvTree: fgui.GTree;
    protected m_CurTreeNode: MainTreeNode;
    protected m_ListViewMenu: PopupMenuEx;

    protected m_btnData: fgui.GButton;
    protected m_btnExport: fgui.GButton;
    protected m_btnRefresh: fgui.GButton;

    protected m_DataMenu: PopupMenuEx;
    protected m_ExportMenu: PopupMenuEx;
    protected m_RefreshMenu: PopupMenuEx;
    

    public constructor() {
        super();
    }

    protected static m_Instance: MainUI;
    public static get Instance(): MainUI {
        if (!MainUI.m_Instance) {
            MainUI.m_Instance = new MainUI();
        }

        return MainUI.m_Instance;
    }

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "Main").asCom;
        this.makeFullScreen();
        this.contentPane.addRelation(fgui.GRoot.inst, fgui.RelationType.Size);        
        this.bringToFontOnClick = false;

        this.name = "MainUI";
        let MenuView = this.GetComponent("MenuView") as fgui.GComponent;
        let btn: fgui.GButton = MenuView.getChild("btnSave");
        btn.onClick(this, this.OnMenuSave);
        this.m_btnData = btn = MenuView.getChild("btnData");
        btn.onClick(this, this.OnMenuData);
        this.m_btnExport = btn = MenuView.getChild("btnExport");
        btn.onClick(this, this.OnMenuExport);
        this.m_btnRefresh = btn = MenuView.getChild("btnRefresh");
        btn.onClick(this, this.OnMenuRefresh);
        btn = MenuView.getChild("btnSetting");
        btn.onClick(this, this.OnMenuSetting);
        btn = MenuView.getChild("btnProfiler");
        btn.onClick(this, this.OnMenuProfiler);
        btn = MenuView.getChild("btnExplorer");
        btn.onClick(this, this.OnMenuExplorer);
        btn.enabled = (!electronAPI);


        this.m_spHSplitter = this.GetComponent<WinSplitter>("spHSplitter");
        //this.m_gpMid = this.GetComponent<fgui.GGroup>("gpMid");
        //this.m_gpRight = this.GetComponent<fgui.GGroup>("gpRight");
        //this.m_gpBottom = this.GetComponent<fgui.GGroup>("gpBottom");
        let ConfigItemView = this.GetComponent<fgui.GComponent>("ConfigItemView");
        this.m_tvTree = ConfigItemView.getChild("tvTree");

        let ConfigListView = this.GetComponent<fgui.GComponent>("ConfigListView");
        this.m_lvList = ConfigListView.getChild("lvList");

        let ConfigPropertyView = this.GetComponent<fgui.GComponent>("ConfigPropertyView");
        this.m_pdProperty = ConfigPropertyView.getChild("pdProperty");

        let LogView = this.GetComponent<fgui.GComponent>("LogView");
        this.m_lvLog = LogView.getChild("lvLog");
        

        this.m_lvList.on(ListView.EVENT_CLICK_ITEM, this, this.OnClickListItem);
        this.m_lvList.on(Laya.Event.RIGHT_MOUSE_UP, this, this.OnMouseUp);

        this.m_tvTree.treeNodeRender = MainUI.RenderTreeItem;
        this.m_tvTree.on(fgui.Events.CLICK_ITEM, this, this.OnClickTreeItem);

        this.m_pdProperty.onValueChange(this, this.OnPropertyValueChange);
        this.m_pdProperty.onNodeExpand(this, this.OnPropertyNeedAutoSize);
        this.m_pdProperty.onNodeCollapse(this, this.OnPropertyNeedAutoSize);
        this.m_pdProperty.onChildChange(this, this.OnPropertyNeedAutoSize);

        for (let i = 0; i < DataManager.MAX_LOG_COUNT; i++)
            this.m_lvLog.addItemFromPool();
        this.m_lvLog.removeChildrenToPool();


        this.m_lvLog.setVirtual();
        this.m_lvLog.itemRenderer = this.LogRender.bind(this);


        

        this.InitMenus();        

        fgui.GRoot.inst.showModalWait();
        DataManager.Instance.Init().then((Succeed) => {
            fgui.GRoot.inst.closeModalWait();
            if (Succeed)
                this.Refresh();
            else
                MessageBox.Instance.Show("数据加载错误");
        });
        
    }

    public OnDataManagerInited(Succeed: boolean) {
        if (Succeed) {
            DataManager.Instance.LoadDatas().then(this.OnDataLoaded.bind(this));
        }
        else {
            fgui.GRoot.inst.closeModalWait();            
        }
    }

    protected OnDataLoaded(Succeed: boolean) {
        if (Succeed) {
            fgui.GRoot.inst.closeModalWait();
            this.FillTreeItems();
        }
    }

    InitMenus(): void {
        this.m_DataMenu = new PopupMenuEx;
        this.m_DataMenu.addItem("浏览配置文件", this.OnExplorerConfigDatas.bind(this));
        this.m_DataMenu.addItem("浏览编辑器扩展文件", this.OnEditorExtendManager.bind(this));
        this.m_DataMenu.AdjustSize();

        this.m_ExportMenu = new PopupMenuEx;
        this.m_ExportMenu.addItem("导出所有配置(Json)", this.OnExportAllJson.bind(this));
        this.m_ExportMenu.AdjustSize();

        this.m_RefreshMenu = new PopupMenuEx;
        this.m_RefreshMenu.addItem("刷新ID名称映射", this.OnRefreshNameMap.bind(this));
        this.m_RefreshMenu.addSeperator();
        this.m_RefreshMenu.addItem("刷新显示", this.OnRefresh.bind(this));
        this.m_RefreshMenu.addSeperator();
        this.m_RefreshMenu.addItem("重新加载所有数据", this.OnRefreshAll.bind(this));
        this.m_RefreshMenu.AdjustSize();

        this.m_ListViewMenu = new PopupMenuEx;
        this.m_ListViewMenu.addItem("新建", this.OnNewData.bind(this));
        this.m_ListViewMenu.addItem("插入", this.OnInsertData.bind(this));
        this.m_ListViewMenu.addItem("删除", this.OnRemoveData.bind(this));
        this.m_ListViewMenu.addItem("上移", this.OnMoveUpData.bind(this));
        this.m_ListViewMenu.addItem("下移", this.OnMoveDownData.bind(this));
        this.m_ListViewMenu.AdjustSize();

    }
    protected FillTreeItems(): void {
        this.m_tvTree.rootNode.removeChildren();
        for (let ConfigData of DataManager.Instance.ConfigDatas.values()) {            
            let UIInfo = EditorExtend.Instance.GetEditUIInfo(ConfigData.TypeName);
            if (UIInfo) {
                if (UIInfo.Enable) {
                    let StructInfo = EditorExtend.Instance.GetStructInfo(ConfigData.TypeName);
                    if (StructInfo) {
                        let Node = new MainTreeNode(UIInfo.Name, null, ConfigData.TypeName);
                        this.m_tvTree.rootNode.addChild(Node);
                        for (let Entry of UIInfo.EditorEntrys) {
                            let EntryStructInfo = StructInfo.GetChildInfoByDataSource(Entry.DataSource);
                            if (EntryStructInfo && EntryStructInfo instanceof StructDescInfo) {
                                let EntryData = EditorExtend.GetChildDataByDataSource(ConfigData.Data, Entry.DataSource);
                                if (EntryData) {
                                    let ChildNode = new MainTreeNode(Entry.Name, EntryData, EntryStructInfo.Name);
                                    Node.addChild(ChildNode);
                                    if (Entry.IsTreeItem && EntryData instanceof Array) {
                                        for (let Child of EntryData) {
                                            let ChildName = Child[Entry.TreeNameMember];
                                            let ChildData = Child[Entry.TreeDataMember];
                                            let ChildStruct = EntryStructInfo.GetChildInfoByDataSource(Entry.TreeDataMember);
                                            if (ChildName && ChildData && ChildStruct && ChildStruct instanceof StructDescInfo) {
                                                ChildNode.addChild(new MainTreeNode(ChildName, ChildData, ChildStruct.Name));
                                            }
                                        }
                                    }
                                }
                                else {
                                    DataManager.Instance.LogError(`数据[${ConfigData.TypeName}]中不存在成员${Entry.DataSource},正在处理项[${Entry.Name}]`);
                                }
                            }
                            else {
                                DataManager.Instance.LogError(`结构[${ConfigData.TypeName}]中不存在成员${Entry.DataSource},正在处理项[${Entry.Name}]`);
                            }
                        }
                        Node.expanded = true;
                    }
                    else {
                        DataManager.Instance.LogError(`未能找到结构[${ConfigData.TypeName}]的描述`);
                    }
                    
                }
            }
            else {
                DataManager.Instance.LogError(`未能找到数据[${ConfigData.TypeName}]对应的编辑器UI信息`);
            }
        }
    }   

    //protected FillDataTree(RootNode: MainTreeNode, TypeName: string) {
    //    let EditUIInfo = EditorExtend.Instance.GetEditUIInfo(TypeName);
    //    if (EditUIInfo) {
    //        if (EditUIInfo.Enable) {
    //            let Node = new MainTreeNode(EditUIInfo.Name, "");
    //            RootNode.addChild(Node);
    //            for (let Entry of EditUIInfo.EditorEntrys) {
    //                let ChildNode = new MainTreeNode(Entry.Name, TypeName);
    //                ChildNode.data = Entry.DataSource;
    //                Node.addChild(ChildNode);
    //                if (Entry.IsTreeItem) {
                        
    //                }
    //            }
    //            Node.expanded = true;
    //        }            
    //    }
    //    else {
    //        DataManager.Instance.LogError(`未能找到数据[${TypeName}]对应的编辑器UI信息`);
    //    }
    //}   

    public Refresh() {
        this.FillTreeItems();
        this.m_lvList.DeleteAllColumn();
        this.m_pdProperty.DeleteAllItem();
    }
    

    public show(): void {
        super.show();
        DataManager.Instance.SetLogView(this.m_lvLog);
        fgui.GRoot.inst.setChildIndex(this, 0);        
    }

   
       

    protected LogRender(index: number, item: LogListItem) {
        item.text = DataManager.Instance.GetLog(index);
        item.Content.ensureSizeCorrect();
    }

    protected OnMenuSave() {
        DataManager.Instance.SaveDatas().then((SaveCount: number) => {
            if (SaveCount>0)
                MessageBox.Instance.Show("保存完毕");
            else
                MessageBox.Instance.Show("没有数据需要保存");
        });
    }

    protected OnMenuData() {
        this.m_DataMenu.show(this.m_btnData, fgui.PopupDirection.Down);
    }

    protected OnMenuExport() {
        this.m_ExportMenu.show(this.m_btnExport, fgui.PopupDirection.Down);
    }

    protected OnMenuRefresh() {
        this.m_RefreshMenu.show(this.m_btnRefresh, fgui.PopupDirection.Down);
    }

    protected OnMenuSetting() {
        DlgSetting.Instance.show();
    }

    protected OnMenuProfiler() {
        if (DlgDebugState.Instance.isShowing)
            DlgDebugState.Instance.hide();
        else
            DlgDebugState.Instance.show();
    }

    protected OnMenuExplorer() {
        DlgFileExplorer.Instance.show(FILE_EXPLORER_MODE.EXPLORER_ALL_FILE);
    }
    

    protected OnRefreshNameMap() {
        DataManager.Instance.RebuildAllMap();
    }

    protected OnExplorerConfigDatas() {
        DlgFileExplorer.Instance.show(FILE_EXPLORER_MODE.CONFIG_DATA_MANAGER);
    }

    protected OnExportAllJson() {
        DataManager.Instance.ExportJson();
    }    
    

    protected OnEditorExtendManager() {
        DlgFileExplorer.Instance.show(FILE_EXPLORER_MODE.EXITOR_EXTEND_MANAGER);
    }
    protected OnRefresh() {
        this.Refresh();
    }
    protected OnRefreshAll() {
        if (DataManager.Instance.IsModified()) {
            MessageBox.Instance.Show("有未保存的数据，是否丢弃这些数据？", MESSAGE_BOX_SHOW_TYPE.OK_CANCEL, this, (Result) => {
                if (Result == MESSAGE_BOX_RESULT_CODE.OK) {
                    fgui.GRoot.inst.showModalWait();
                    DataManager.Instance.ReloadAllData().then((Succeed) => {
                        fgui.GRoot.inst.closeModalWait();
                        if (Succeed)
                            this.Refresh();
                        else
                            MessageBox.Instance.Show("数据加载错误");
                    })
                }
            })
        }
        else {
            fgui.GRoot.inst.showModalWait();
            DataManager.Instance.ReloadAllData().then((Succeed) => {
                fgui.GRoot.inst.closeModalWait();
                if (Succeed)
                    this.Refresh();
                else
                    MessageBox.Instance.Show("数据加载错误");
            })
        }
    }

    protected SetDataModified(Node: MainTreeNode) {
        if (Node instanceof MainTreeNode) {
            if (!Node.data)
                DataManager.Instance.SetModify(Node.DataType);
            else
                this.SetDataModified(Node.parent as MainTreeNode);
        }
    }
    
    protected OnNewData() {
        if (IsArray(this.m_CurTreeNode.data)) {
            EditorExtend.Instance.NewArrayElement(this.m_CurTreeNode.data, this.m_CurTreeNode.DataType, "", -1);
            this.SetDataModified(this.m_CurTreeNode);
            this.FillList(this.m_CurTreeNode);
            this.m_lvList.scrollToView(this.m_lvList.RowCount - 1, 0);
        }
        else {
            MessageBox.Instance.Show("当前数据不可新增");
        }
    }

    protected OnInsertData() {
        if (IsArray(this.m_CurTreeNode.data)) {
            EditorExtend.Instance.NewArrayElement(this.m_CurTreeNode.data, this.m_CurTreeNode.DataType, "", this.m_lvList.selectedIndex);
            this.SetDataModified(this.m_CurTreeNode);
            this.FillList(this.m_CurTreeNode);
        }
        else {
            MessageBox.Instance.Show("当前数据不可新增");
        }
    }

    protected OnRemoveData() {
        if (this.m_lvList.selectedIndex < 0) {
            MessageBox.Instance.Show("请选择一条数据");
            return;
        }
        else {
            if (IsArray(this.m_CurTreeNode.data)) {
                let Index = this.m_lvList.selectedIndex;
                let Data = this.m_CurTreeNode.data as any[];
                if (Index < Data.length) {
                    MessageBox.Instance.Show(`是否要删除选中的数据?`, MESSAGE_BOX_SHOW_TYPE.OK_CANCEL, this,
                        (Result: MESSAGE_BOX_RESULT_CODE) => {
                            if (Result == MESSAGE_BOX_RESULT_CODE.OK) {
                                Data.splice(Index, 1);
                                this.SetDataModified(this.m_CurTreeNode);
                                this.FillList(this.m_CurTreeNode);
                            }
                        });
                }
                else {
                    MessageBox.Instance.Show("数据不存在");
                }
            }
            else {
                MessageBox.Instance.Show("数据不可删除");
            }
        }
    }
    protected OnMoveUpData() {
        if (this.m_lvList.selectedIndex < 0) {
            MessageBox.Instance.Show("请选择一条数据");
            return;
        }
        else {
            if (IsArray(this.m_CurTreeNode.data)) {
                let Index = this.m_lvList.selectedIndex;
                let Data = this.m_CurTreeNode.data as any[];
                if (Index < Data.length) {
                    if (Index > 0) {
                        let Temp = Data[Index];
                        Data.splice(Index, 1);
                        Data.splice(Index - 1, 0, Temp);
                        this.SetDataModified(this.m_CurTreeNode);
                        this.FillList(this.m_CurTreeNode);
                    }
                }
                else {
                    MessageBox.Instance.Show("数据不存在");
                }
            }
            else {
                MessageBox.Instance.Show("数据不可移动");
            }
        }
    }

    protected OnMoveDownData() {
        if (this.m_lvList.selectedIndex < 0) {
            MessageBox.Instance.Show("请选择一条数据");
            return;
        }
        else {
            if (IsArray(this.m_CurTreeNode.data)) {
                let Index = this.m_lvList.selectedIndex;
                let Data = this.m_CurTreeNode.data as any[];
                if (Index < Data.length) {
                    if (Index < Data.length - 1) {
                        let Temp = Data[Index];
                        Data.splice(Index, 1);
                        Data.splice(Index + 1, 0, Temp);
                        this.SetDataModified(this.m_CurTreeNode);
                        this.FillList(this.m_CurTreeNode);
                    }
                }
                else {
                    MessageBox.Instance.Show("数据不存在");
                }
            }
            else {
                MessageBox.Instance.Show("数据不存在或不可移动");
            }
        }
    }

    static RenderTreeItem(Node: MainTreeNode, Obj: fgui.GComponent) {
        Node.text = Node.Name;
    }

    protected OnClickTreeItem(Item: fgui.GComponent): void {
        let Node = Item.treeNode as MainTreeNode;
        if (Node != this.m_CurTreeNode) {
            this.m_CurTreeNode = Node;
            this.FillList(Node);
        }
    }
    protected FillList(Node: MainTreeNode) {
        this.m_lvList.DeleteAllColumn();
        this.m_pdProperty.DeleteAllItem();
        if (Node.DataType && Node.data) {
            this.FillConfigList(Node.data, Node.DataType);
        }
    
    }
    public RefreshList() {
        if (this.m_CurTreeNode) {
            this.FillList(this.m_CurTreeNode);
        }
    }
    protected OnClickListItem(Row: number, Col: number) {
        let Data = this.m_lvList.GetRowData(Row);
        this.FillPropertyGrid(Data);
    }

    protected OnMouseUp(evt: Laya.Event) {
        this.m_ListViewMenu.show();
        this.m_ListViewMenu.contentPane.setXY(evt.stageX, evt.stageY);
    }

    protected OnPropertyValueChange(Node: PropertyGridNode) {
        let index = this.m_lvList.selectedIndex;
        if (index >= 0) {
            let Data = this.m_lvList.GetRowData(index);
            if (typeof Data == "object" && Data.Data && Data.Type && Data.UIInfo) {
                Data.UIInfo.FillListViewItem(this.m_lvList, index, Data.Type, Data.Data);
            }
            this.SetDataModified(this.m_CurTreeNode);
            DataManager.ProcessPropertyValueChange(Node);
        }
    }

    protected OnPropertyNeedAutoSize(Node: PropertyGridNode) {
        let Width = this.m_pdProperty.NameSizeAutoFit();
        this.AdjustPropertyGridSize(Width);
    }

    

    //EqualOrChildClass(ClassID1:number, ClassID2:number): boolean {
    //    if ((ClassID1 == 0) || (ClassID1 == ClassID2))
    //        return true;
    //    for (let Class of DataManager.Instance.ItemClassList) {
    //        if (Class.ParentClassID == ClassID1) {
    //            return this.EqualOrChildClass(Class.ClassID, ClassID2);
    //        }
    //    }
    //    return false;
    //}

    //FillItemConfig(ClassCode: number) {
    //    this.m_lvList.DeleteAllColumn();
    //    this.m_lvList.Redraw = false;
    //    let EditUIInfo = EditorExtend.Instance.GetEditUIInfo("ITEM_CONFIG_LIST");
    //    if (EditUIInfo) {
    //        EditUIInfo.InitListView(this.m_lvList, "ItemConfigList");
    //        let StructInfo = EditorExtend.Instance.GetStructInfo("ITEM_CONFIG");
    //        if (StructInfo) {
    //            for (let i = 0; i < DataManager.Instance.ItemConfigList.length; i++) {
    //                let Config = DataManager.Instance.ItemConfigList[i];
    //                if (this.EqualOrChildClass(ClassCode, Config.ClassCode)) {
    //                    let Item = this.m_lvList.InsertItem();
    //                    EditUIInfo.FillListViewItem(this.m_lvList, Item, StructInfo, Config);
    //                    this.m_lvList.SetItemData(Item, i);
    //                }
    //            }
    //        }            
    //    }
    //    this.m_lvList.AllColumnSizeAutoFit();
    //    this.m_lvList.Redraw = true;
    //}

    

    protected FillConfigList(Data: any, DataType: string) {
        this.m_lvList.DeleteAllColumn();
        this.m_lvList.Redraw = false;
        EditorUIInfo.InitListView(this.m_lvList, DataType);
        EditorUIInfo.FillListView(this.m_lvList, Data, DataType);
        for (let i = 0; i < this.m_lvList.ColCount; i++)
            this.m_lvList.EnableSortOnClickHeader(i, true);
        this.m_lvList.AllColumnSizeAutoFit();
        this.m_lvList.Redraw = true;
    }
    protected FillPropertyGrid(Data: any) {
        this.m_pdProperty.DeleteAllItem();
        if (typeof Data == "object" && Data.Data && Data.Type)
            this.m_pdProperty.SetObject(Data.Data, Data.Type);
    }
   
    protected AdjustPropertyGridSize(Width: number) {
        let CurWidth = this.contentPane.width - this.m_spHSplitter.x - this.m_spHSplitter.width;
        let x = this.contentPane.width - this.m_spHSplitter.width - Width;
        if (x < 100)
            x = 100;
        this.m_spHSplitter.x = x;
    }
}


