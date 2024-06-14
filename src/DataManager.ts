//import { MMO } from "./MMOAllDefines";
import { MainUI } from "./UI/MainUI"
import JSZip from "jszip"
import ExcelJS from "exceljs";
import { Encoding } from "./DOSSystem/Encoding/Encoding"
import Long from "long";
import { JSON_INT64 } from "./DOSSystem/JSON_INT64"
import { DlgConfirmWithList, ConfirmListItem } from "./UI/Dialogs/DlgConfirmWithList"
import { MessageBox, MESSAGE_BOX_RESULT_CODE, MESSAGE_BOX_SHOW_TYPE } from "./UI/Dialogs/MessageBox";
import Main from "./Main";
import { EnumMemberDescInfo, EnumDescInfo, StructMemberDescInfo, StructDescInfo, EditorExtend } from "./EditorExtend"
import * as pako from "pako";
import { PropertyGridNode } from "./UI/Components/PropertyGrid";
import { FileInfo, FolderInfo, Path, FileSystem } from "./FileSystem/FileSystem";
import { SystemConfig } from "./SystemConfig";
import { MakeStringFile } from "./Tools";


enum LOG_COLOR {
    WARNING = '#FF7F00',
    ERROR = '#FF0000'
};

class ConfigData {
    public IsModify = true;
    public DataName: string;
    public TypeName: string;
    public Data: any;
    public FilePath: string;

    constructor(Name: string, Type: string, Obj: any, Path: string) {
        this.DataName = Name;
        this.TypeName = Type;
        this.Data = Obj;
        this.FilePath = Path;
    }
}



export class DataManager {
    protected static m_Instance: DataManager;
    public static get Instance(): DataManager {
        if (!DataManager.m_Instance) {
            DataManager.m_Instance = new DataManager();
        }

        return DataManager.m_Instance;
    }

    public static MAX_LOG_COUNT = 100;
    protected m_Logs = new Array<string>();
    protected m_lvLog: fgui.GList;
        
    protected m_DataRoot: FolderInfo;
    protected m_EditorExtendFolder: FolderInfo;

    
    protected m_ConfigDataMap = new Map<string, ConfigData>();

    public async Init(): Promise<boolean> {
        

        this.m_DataRoot = await FileSystem.Instance.LoadFolder(SystemConfig.Instance.MainConfig.ConfigDataPath);
        if (!this.m_DataRoot) {
            this.m_DataRoot = await FileSystem.Instance.CreateFolder(null, SystemConfig.Instance.MainConfig.ConfigDataPath);
            
        }

        this.m_EditorExtendFolder = await FileSystem.Instance.LoadFolder(SystemConfig.Instance.MainConfig.EditorDataPath);
        if (!this.m_EditorExtendFolder) {
            this.m_EditorExtendFolder = await FileSystem.Instance.CreateFolder(null, SystemConfig.Instance.MainConfig.EditorDataPath);

        }

        if (this.m_DataRoot && this.m_EditorExtendFolder) {
            return await this.LoadDatas();
        }
        return false;
    }

    public async ReloadAllData(): Promise<boolean> {
        if (this.m_DataRoot && this.m_EditorExtendFolder) {
            return await this.LoadDatas();
        }
        return false;
    }

    public GetLog(Index: number): string {
        return this.m_Logs[Index];
    }

    protected OutputLog(Content: string, LogColor?: string) {
        let CurDate = new Date(Date.now());
        let H = CurDate.getHours();
        let M = CurDate.getMinutes();
        let S = CurDate.getSeconds();
        let MS = CurDate.getMilliseconds();

        if (LogColor)
            Content = `[${H > 10 ? H : "0" + H}:${M > 10 ? M : "0" + M}:${S > 10 ? S : "0" + S}](${MS.toLocaleString('zh', { minimumIntegerDigits: 3 })}):[color=${LogColor}]${Content}[/color]`;
        else
            Content = `[${H > 10 ? H : "0" + H}:${M > 10 ? M : "0" + M}:${S > 10 ? S : "0" + S}](${MS.toLocaleString('zh', { minimumIntegerDigits: 3 })}):${Content}`;

        this.m_Logs.push(Content);

        if (this.m_lvLog) {
            this.m_lvLog.numItems = this.m_Logs.length;
            this.m_lvLog.scrollPane.percY = 1;
        }        
    }

    public LogError(Content: string) {
        this.OutputLog(Content, LOG_COLOR.ERROR);
    }
    public LogWarning(Content: string) {
        this.OutputLog(Content, LOG_COLOR.WARNING);
    }
    public LogInfo(Content: string) {
        this.OutputLog(Content);
    }

    public SetLogView(lvLogList: fgui.GList) {
        this.m_lvLog = lvLogList;
        this.m_lvLog.numItems = this.m_Logs.length;
        this.m_lvLog.scrollPane.percY = 1;
    }

    public get ConfigDataFolder(): FolderInfo {
        return this.m_DataRoot;
    }

    public get EditorExtendFolder(): FolderInfo {
        return this.m_EditorExtendFolder;
    }

   
   

    public async LoadDatas(): Promise<boolean> {
        await this.LoadEditorExtend(this.m_EditorExtendFolder);
        await this.LoadConfigDatas(this.m_DataRoot);
        this.RebuildAllMap();
        DataManager.Instance.LogInfo("加载完毕");
        return true;
    }
       
    protected AddConfigData(FilePath: string, Data: any, NeedModified: boolean) {
        let DataName = Path.GetPathTitle(Path.GetRelativePath(FilePath, this.m_DataRoot.PathName));
        let TypeName = Path.GetPathFileTitle(DataName);
        let Config = this.m_ConfigDataMap.get(DataName);
        if (!Config) {
            Config = new ConfigData(DataName, TypeName, Data, FilePath);
            this.m_ConfigDataMap.set(DataName, Config);
        }
        else {
            Config.Data = Data;
        }
        if (EditorExtend.Instance.CompleteObject(Data, TypeName, true)) {
            Config.IsModify = true;
        }
        else if (NeedModified) {
            Config.IsModify = true;
        }
        else {
            Config.IsModify = false;
        }
        DataManager.Instance.LogInfo(`数据[${DataName}]已加载`);
    }
    

    public GetConfigData(DataName: string): any {
        let Data = this.m_ConfigDataMap.get(DataName);
        if (Data)
            return Data.Data;
        return null;
    }

    public get ConfigDatas(): Map<string, ConfigData> {
        return this.m_ConfigDataMap;
    }

    protected async LoadConfigDatas(Folder: FolderInfo): Promise<boolean> {
        if (Folder) {
            for (let File of Folder.Files.values()) {
                if (File.ExtName.toLowerCase() == "json") {
                    let Obj = await File.Read("json");
                    if (Obj) {
                        this.AddConfigData(File.PathName, Obj, false);
                    }
                    else {
                        DataManager.Instance.LogError(`加载文件[${File.PathName}]失败`);
                    }
                }
            }
            for (let Info of Folder.ChildFolders.values()) {
                this.LoadConfigDatas(Info);
            }
        }
        else {
            DataManager.Instance.LogError(`系统未正确初始化`);
        }
        return false;
    }

   

    protected async LoadEditorExtend(Folder: FolderInfo): Promise<boolean> {       
        if (Folder) {
            for (let Info of Folder.Files.values()) {
                let Obj = await Info.Read("json");
                if (Obj) {
                    try {
                        EditorExtend.Instance.AddEditorExtend(Obj);
                        DataManager.Instance.LogInfo(`编辑器扩展[${Info.PathName}]已加载`);
                    }
                    catch (e) {
                        DataManager.Instance.LogError(`编辑器扩展数据[${Info.PathName}]解析时出现异常：${e}`);
                    }
                }
                else {
                    DataManager.Instance.LogError(`读取文件[${Info.PathName}]失败`);
                }
            }
            for (let Info of Folder.ChildFolders.values()) {
                await this.LoadEditorExtend(Info);
            }
            document.title = EditorExtend.Instance.Title;
            return true;
        }       
        return false;
    }

    

    public IsModified(DataName?: string): boolean {
        if (DataName) {
            let Data = this.m_ConfigDataMap.get(DataName);
            if (Data)
                return Data.IsModify;           
        }
        else {
            for (let Data of this.m_ConfigDataMap.values()) {
                if (Data.IsModify)
                    return true;
            }           
        }        
        return false;
    }

    public SetModify(DataName: string): boolean {
        let Data = this.m_ConfigDataMap.get(DataName);
        if (Data) {
            Data.IsModify = true;
            return true;
        }                
        return false;
    }    

    protected ClearModify(DataName: string): boolean {
        let Data = this.m_ConfigDataMap.get(DataName);
        if (Data) {
            Data.IsModify = false;
            return true;
        }        
        return false;
    }

    protected ClearAllModify() {
        for (let Data of this.m_ConfigDataMap.values()) {
            Data.IsModify = false;
        }       
    }

    public async SaveDatas(ForceSaveAll?: boolean): Promise<number> {
        DlgConfirmWithList.Instance.RemoveAllItem();
        for (let Data of this.m_ConfigDataMap.values()) {
            if (ForceSaveAll || Data.IsModify) {
                let Item = DlgConfirmWithList.Instance.AddItem();
                Item.text = Data.DataName;
                Item.checked = true;
                Item.data = Data;
            }
        }       
        if (DlgConfirmWithList.Instance.numItems > 0) {
            if (await DlgConfirmWithList.Instance.ShowAsync()) {
                fgui.GRoot.inst.showModalWait();
                let SaveCount = 0;
                for (let i = 0; i < DlgConfirmWithList.Instance.numItems; i++) {
                    let Item = DlgConfirmWithList.Instance.GetItem(i);
                    if (Item.checked) {
                        await this.SaveData(Item.data);
                    }
                }
                DataManager.Instance.LogInfo(`保存完毕,已保存${SaveCount}个数据`);
                fgui.GRoot.inst.closeModalWait();
            }
        }
        return DlgConfirmWithList.Instance.numItems;
    }

    protected async SaveData(Data: ConfigData): Promise<boolean> {
        DataManager.Instance.LogInfo(`开始保存${Data.FilePath}`);
        let FilePath = Path.GetRelativePath(Data.FilePath, this.m_DataRoot.PathName);
        let File = this.m_DataRoot.FindFile(FilePath)
        if (File) {
            let JsonData = JSON_INT64.stringify(Data.Data, null, '\t');
            let BinData = MakeStringFile(JsonData)
            if (await File.Write(BinData)) {
                Data.IsModify = false;
                return true;
            }
        }
        else {
            DataManager.Instance.LogError(`文件[${Data.FilePath}]不存在`);
        }
        return false;
    }
   
   
    protected RebuildMaps(DataName: string) {
        EditorExtend.Instance.RebuildDisplayTranslater(DataName);
    }

    public RebuildAllMap() {
        EditorExtend.Instance.RebuildDisplayTranslater();
    }
   

    public async ExportJson(): Promise<boolean> {
        let zip = new JSZip();

        for (let pair of this.m_ConfigDataMap) {
            let Data = pair[1];
            let JsonData = JSON_INT64.stringify(Data.Data, null, '\t');
            let BinData = MakeStringFile(JsonData)
            zip.file(Data.FilePath, BinData);
            DataManager.Instance.LogInfo(`已完成文件${Data.FilePath}的生成`);
        }

        let ZipData = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
        DataManager.Instance.LogInfo("已完成文件打包压缩");
        let CurDate = new Date(Date.now());
        let DateStr = `${CurDate.getFullYear()}-${CurDate.getMonth().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getDay().toLocaleString('zh', { minimumIntegerDigits: 2 })}.`
            + `${CurDate.getHours().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getMinutes().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getSeconds().toLocaleString('zh', { minimumIntegerDigits: 2 })}`;

        FileSystem.Instance.SaveFile(`配置.${DateStr}.json.zip`, ZipData);
        DataManager.Instance.LogInfo("已提交文件下载");
        return true;
    }

    //public static ParserStringFile(FileData: ArrayBuffer): string {
    //    let dv = new DataView(FileData);
    //    if (FileData.byteLength >= 2 && dv.getUint8(0) == 0xFF && dv.getUint8(1) == 0xFE) {
    //        let StrData = new Uint8Array(FileData, 2);
    //        return Encoding.UCS2.GetString(StrData);
    //    }
    //    else if (FileData.byteLength >= 2 && dv.getUint8(0) == 0xFE && dv.getUint8(1) == 0xFF) {
    //        let StrData = new Uint8Array(FileData, 2);
    //        return Encoding.UCS2.GetString(StrData);
    //    }
    //    else if (FileData.byteLength >= 3 && dv.getUint8(0) == 0xEF && dv.getUint8(1) == 0xBB && dv.getUint8(2) == 0xBF) {
    //        let StrData = new Uint8Array(FileData, 3);
    //        return Encoding.UTF8.GetString(StrData);
    //    }
    //    else {
    //        let StrData = new Uint8Array(FileData, 0);
    //        return Encoding.GBK.GetString(StrData);
    //    }
    //}
    //public static MakeStringFile(Str: string): ArrayBuffer {
    //    let BinDataLen = Encoding.UTF8.GetBytes(Str);
    //    let BinData = new Uint8Array(BinDataLen + 3);
    //    BinData[0] = 0xEF;
    //    BinData[1] = 0xBB;
    //    BinData[2] = 0xBF;
    //    Encoding.UTF8.GetBytes(Str, BinData, 3, BinDataLen);
    //    return BinData;
    //}

    //public async ImportConfigJson(): Promise<boolean> {
    //    let files = await WebSystem.LoadFile(".json", true);
    //    if (files && files.length) {
    //        DlgConfirmWithList.Instance.RemoveAllItem();
    //        for (let i = 0; i < files.length; i++) {
    //            let file = files[i];
    //            let Item: ConfirmListItem;
    //            for (let Data of this.m_ConfigDataMap.values()) {
    //                if (file.name.toLowerCase() == Data.FilePath.toLowerCase()) {
    //                    Item = DlgConfirmWithList.Instance.AddItem();
    //                    Item.text = file.name;
    //                    Item.checked = true;
    //                    Item.data = { DataFile: file, FilePath: Data.FilePath };
    //                }                    
    //            }                
    //        }
    //        if (DlgConfirmWithList.Instance.numItems > 0) {
    //            if (await DlgConfirmWithList.Instance.ShowAsync()) {
    //                fgui.GRoot.inst.showModalWait();
    //                let ImportCount = 0;
    //                for (let i = 0; i < DlgConfirmWithList.Instance.numItems; i++) {
    //                    let Item = DlgConfirmWithList.Instance.GetItem(i);
    //                    if (Item.checked) {
    //                        let DataBuffer = await Item.data.DataFile.arrayBuffer();
    //                        let JsonStr = DataManager.ParserStringFile(DataBuffer);
    //                        try {
    //                            let JsonData = JSON_INT64.parse(JsonStr);
    //                            let DataName = Path.GetPathFileTitle(Item.data.FilePath);
    //                            this.AddConfigData(DataName, JsonData, true);
    //                            DataManager.Instance.PrintLog(`${Item.data.DataFile.name}已导入`, LOG_COLOR.WARNING);
    //                            ImportCount++;
    //                        }
    //                        catch (e) {
    //                            DataManager.Instance.PrintLog(`${Item.data.DataFile.name}解析时出现异常：${e}`, LOG_COLOR.ERROR);
    //                        }                            
    //                    }
    //                }
    //                DataManager.Instance.PrintLog(`导入完毕,已导入${ImportCount}个文件`);
    //                fgui.GRoot.inst.closeModalWait();
    //                return true;
    //            }                
    //        }
    //        else {
    //            MessageBox.Instance.Show("没有可导入的文件");
    //        }
    //    }
    //    return false;
    //}

    //protected static FormatSheetHeader(Sheet: ExcelJS.Worksheet) {
    //    Sheet.getRow(1).eachCell(function (cell, col) {
    //        cell.font = {
    //            bold: true
    //        };
    //    });
    //    Sheet.getRow(2).eachCell(function (cell, col) {
    //        cell.font = {
    //            bold: true
    //        };
    //    });
    //    Sheet.getRow(3).eachCell(function (cell, col) {
    //        cell.font = {
    //            bold: true
    //        };           
    //    });
    //}

   

    protected async ConfigDataToXls(Data: any, TypeName: string): Promise<{ XlsName: string, Buffer: ExcelJS.Buffer }> {
        let Translater = EditorExtend.Instance.GetXlsTranslater(TypeName);
        if (Translater) {
            let Book = Translater.ObjectToXls(Data, TypeName);
            if (Book) {
                return { XlsName: Translater.XlsName, Buffer: await Book.xlsx.writeBuffer() };
            }
        }
        else {
            DataManager.Instance.LogError(`无法找到数据[${TypeName}]的Xls转换器`);
        }
        return null;
    }

    //public async ExportConfigXlsx(): Promise<boolean>  {
    //    let zip = new JSZip();

    //    for (let Data of this.m_ConfigDataMap.values()) {
    //        switch (Data.DataName) {
    //            case "STORAGE_STRING_TABLE":
    //                await this.StorageStringTableToXls(zip);
    //                break;
    //            default:
    //                await this.ConfigDataToXls(Data.Data, Data.TypeName, zip);
    //                break;
    //        }
    //    }

    //    let ZipData = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
    //    DataManager.Instance.LogInfo("已完成文件打包压缩");
    //    let CurDate = new Date(Date.now());
    //    let DateStr = `${CurDate.getFullYear()}-${CurDate.getMonth().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getDay().toLocaleString('zh', { minimumIntegerDigits: 2 })}.`
    //        + `${CurDate.getHours().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getMinutes().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getSeconds().toLocaleString('zh', { minimumIntegerDigits: 2 })}`;
    //    WebSystem.SaveToLocalFile(`配置.${DateStr}.xls.zip`, ZipData);
    //    DataManager.Instance.PrintLog("已提交文件下载");
    //    return true;
    //}

    public async ExportConfigDataToXls(File: FileInfo): Promise<boolean> {
        let DataName = Path.GetPathTitle(Path.GetRelativePath(File.PathName, this.m_DataRoot.PathName));
        let Data = this.m_ConfigDataMap.get(DataName);
        if (Data) {

            let Xls = await this.ConfigDataToXls(Data.Data, Data.TypeName);
            if (Xls) {
                DataManager.Instance.LogInfo(`已完成文件${Xls.XlsName}的生成`);
                FileSystem.Instance.SaveFile(`${Xls.XlsName}.xlsx`, Xls.Buffer);
                DataManager.Instance.LogInfo("已提交文件下载");
            }
            else {
                DataManager.Instance.LogError(`无法找到配置数据[${Data.TypeName}]的Xls转换器`);
                return false;
            }
        }
        else {
            DataManager.Instance.LogError(`配置数据[${DataName}不存在]`);
            return false;
        }
    }

    //protected static ParserXlsColumns(Sheet: ExcelJS.Worksheet, MsgPrefix: string): boolean {
    //    if (Sheet.rowCount >= 3) {
    //        let Row = Sheet.getRow(1);
    //        Row.eachCell(function (cell: ExcelJS.Cell, Col: number) {
    //            Sheet.setColumnKey(cell.text.trim(), Sheet.getColumn(Col));
    //        });
    //        return true;
    //    }
    //    else {
    //        DataManager.Instance.LogError(`${MsgPrefix}的${Sheet.name}缺少表头`);
    //    }
    //    return false;
    //}
        

    //protected static XlsToStorageStringTable(Book: ExcelJS.Workbook, MsgPrefix: string): any {
    //    let ConfigList = EditorExtend.Instance.CreateObject("STORAGE_STRING_TABLE", "", false);
    //    let Result = false;
    //    Book.eachSheet((function (Sheet: ExcelJS.Worksheet, ID: number) {
    //        if (!DataManager.ParserXlsColumns(Sheet, MsgPrefix))
    //            return;            
    //        for (let i = 4; i <= Sheet.rowCount; i++) {
    //            let Row = Sheet.getRow(i);
    //            let Str = EditorExtend.Instance.CreateObject("STORAGE_STRING", "", false);
    //            Row.findCell
    //            if (Sheet.getColumnKey("StrID")) {
    //                Str.StrID = Row.getCell("StrID").text;
    //            }
    //            else {
    //                DataManager.Instance.LogError(`${MsgPrefix}的[${Sheet.name}]的列[StrID]不存在`);
    //                return;
    //            }
    //            let EnumInfo = EditorExtend.Instance.GetEnumInfo("LANGUAGE_TYPE");
    //            for (let Member of EnumInfo.Members) {
    //                let ColName = Member.Name;
    //                if (Sheet.getColumnKey(ColName)) {
    //                    Str.StrValue.Values.push(Row.getCell(ColName).text);
    //                }
    //                else {
    //                    DataManager.Instance.LogError(`${MsgPrefix}的表[${Sheet.name}]的列[${ColName}]不存在`);
    //                    return;
    //                }
    //            }
    //            ConfigList.StorageStringList.push(Str);
    //        }
    //        Result = true;
    //    }));
    //    if (Result)
    //        return ConfigList;
    //    return null;
    //}
    

    //public async ImportConfigXlsx(): Promise<boolean> {
    //    let files = await WebSystem.LoadFile(".xlsx", true);
    //    if (files && files.length) {
    //        DlgConfirmWithList.Instance.RemoveAllItem();
    //        let Item: ConfirmListItem;
    //        for (let i = 0; i < files.length; i++) {
    //            let file = files[i];
    //            if (file.name.toLowerCase() == STORAGE_STRING_TABLE_XLS_FILE_NAME) {
    //                let DataBuffer = await file.arrayBuffer();
    //                let Book = new ExcelJS.Workbook;
    //                await Book.xlsx.load(DataBuffer);
    //                Item = DlgConfirmWithList.Instance.AddItem();
    //                Item.text = file.name;
    //                Item.checked = true;
    //                Item.data = { DataFile: file, XlsBook: Book, Translater: DataManager.XlsToStorageStringTable, DataType: "STORAGE_STRING_TABLE" };
    //            }
    //            else {
    //                let XlsTranslater = EditorExtend.Instance.GetXlsTranslaterByXlsName(file.name);
    //                if (XlsTranslater) {
    //                    if (this.GetConfigData(XlsTranslater.StructName)) {
    //                        let DataBuffer = await file.arrayBuffer();
    //                        let Book = new ExcelJS.Workbook;
    //                        await Book.xlsx.load(DataBuffer);
    //                        Item = DlgConfirmWithList.Instance.AddItem();
    //                        Item.text = file.name;
    //                        Item.checked = true;
    //                        Item.data = { DataFile: file, XlsBook: Book, Translater: XlsTranslater, DataType: XlsTranslater.StructName };
    //                    }
    //                }
    //            }                                 
    //        }
    //        if (DlgConfirmWithList.Instance.numItems > 0) {
    //            if (await DlgConfirmWithList.Instance.ShowAsync()) {
    //                fgui.GRoot.inst.showModalWait();
    //                let FailedCount = 0;
    //                for (let i = 0; i < DlgConfirmWithList.Instance.numItems; i++) {
    //                    let Item = DlgConfirmWithList.Instance.GetItem(i);
    //                    if (Item.checked) {
    //                        if (Item.data.Translater) {
    //                            if (typeof Item.data.Translater == "function") {
    //                                Item.data.Data = Item.data.Translater(Item.data.XlsBook, Item.data.DataFile.name);                                    
    //                                if (Item.data.Data) {
    //                                    DataManager.Instance.PrintLog(`${Item.data.DataFile.name}解析完毕`, LOG_COLOR.WARNING);
    //                                }
    //                                else {
    //                                    DataManager.Instance.PrintLog(`${Item.data.DataFile.name}导入失败`, LOG_COLOR.WARNING);
    //                                    FailedCount++;
    //                                }
    //                            }
    //                            else {
    //                                Item.data.Data = Item.data.Translater.XlsToObject(Item.data.XlsBook, Item.data.Translater.StructName);
    //                                if (Item.data.Data) {
    //                                    DataManager.Instance.PrintLog(`${Item.data.DataFile.name}解析完毕`, LOG_COLOR.WARNING);
    //                                }
    //                                else {
    //                                    DataManager.Instance.PrintLog(`${Item.data.DataFile.name}导入失败`, LOG_COLOR.WARNING);
    //                                    FailedCount++;
    //                                }
    //                            }
                                
    //                        }                            
    //                    }
    //                }
    //                if (FailedCount == 0) {
    //                    let ImportCount = 0;
    //                    for (let i = 0; i < DlgConfirmWithList.Instance.numItems; i++) {
    //                        let Item = DlgConfirmWithList.Instance.GetItem(i);
    //                        if (Item.checked) {
    //                            this.AddCoreData(Item.data.DataType, Item.data.Data, true);
    //                            ImportCount++;
    //                        }
    //                    }
    //                    DataManager.Instance.PrintLog(`导入完毕,已导入${ImportCount}个文件`);
    //                }
    //                else {
    //                    DataManager.Instance.PrintLog("导入过程中出现错误", LOG_COLOR.ERROR);
    //                }
    //                fgui.GRoot.inst.closeModalWait();
    //                return true;
    //            }
    //        }
    //        else {
    //            MessageBox.Instance.Show("没有可导入的文件");
    //        }
    //    }
    //    return false;
    //}

    public async ImportConfigXlsx(SaveFolder: FolderInfo): Promise<number> {
        let Files = await FileSystem.Instance.SelectFile("Excel Files|*.xlsx|All Files|*.*", true);
        if (Files && Files.length) {
            DlgConfirmWithList.Instance.RemoveAllItem();
            let OverWritePrompt = false;            
            for (let i = 0; i < Files.length; i++) {
                let file = Files[i];
                let XlsTranslater = EditorExtend.Instance.GetXlsTranslaterByXlsName(Path.GetPathFileTitle(file.FileName));
                if (XlsTranslater) {
                    let Item = DlgConfirmWithList.Instance.AddItem();
                    let DataBuffer = file.Data;
                    let Book = new ExcelJS.Workbook;
                    await Book.xlsx.load(DataBuffer);
                    Item.text = file.FileName;
                    Item.checked = true;
                    Item.data = { DataFile: file, XlsBook: Book, Translater: XlsTranslater, DataType: XlsTranslater.StructName };
                    if (this.IsModified(Item.data.DataType))
                        OverWritePrompt = true;
                }
            }
            
            if (DlgConfirmWithList.Instance.numItems > 0) {
                if (OverWritePrompt) {
                    let Result = await MessageBox.Instance.ShowAsync("存在未保存的数据，是否丢弃？", MESSAGE_BOX_SHOW_TYPE.OK_CANCEL);
                    if (Result == MESSAGE_BOX_RESULT_CODE.CANCEL) {
                        DlgConfirmWithList.Instance.RemoveAllItem();
                        return 0;
                    }                        
                }
                if (await DlgConfirmWithList.Instance.ShowAsync()) {
                    fgui.GRoot.inst.showModalWait();
                    let FailedCount = 0;
                    let ImportCount = 0;
                    for (let i = 0; i < DlgConfirmWithList.Instance.numItems; i++) {
                        let Item = DlgConfirmWithList.Instance.GetItem(i);
                        if (Item.checked) {
                            if (typeof Item.data.Translater == "function") {
                                Item.data.Data = Item.data.Translater(Item.data.XlsBook, Item.data.DataFile.name);
                                if (Item.data.Data) {
                                    
                                }
                                else {
                                    DataManager.Instance.LogError(`${Item.data.DataFile.name}导入失败`);
                                    FailedCount++;
                                }
                            }
                            else {
                                Item.data.Data = Item.data.Translater.XlsToObject(Item.data.XlsBook, Item.data.Translater.StructName);
                                if (Item.data.Data) {
                                    
                                }
                                else {
                                    DataManager.Instance.LogError(`${Item.data.DataFile.name}导入失败`);
                                    FailedCount++;
                                }
                            }
                            if (Item.data.Data) {
                                let JsonStr = JSON_INT64.stringify(Item.data.Data, null, '\t');
                                let BinData = MakeStringFile(JsonStr)
                                let FileName = `${Item.data.DataType}.json`;
                                let File = await SaveFolder.CreateFile(FileName, BinData);
                                if (File) {
                                    this.AddConfigData(File.PathName, Item.data.Data, false);
                                    DataManager.Instance.LogInfo(`导入${Item.text}到${File.PathName}成功`);
                                    ImportCount++;
                                }
                            }
                        }
                    }
                    MainUI.Instance.Refresh();
                    DlgConfirmWithList.Instance.RemoveAllItem();
                    fgui.GRoot.inst.closeModalWait();
                    return ImportCount;
                }
            }
            else {
                MessageBox.Instance.Show("没有可导入的文件");
            }
        }
        return 0;
    }

    //public NewData(DataType: string, DataSource: string, Index: number): any {
    //    let Data = this.GetConfigData(DataType);
    //    if (Data) {
    //        let NewElement;
    //        let StructInfo = EditorExtend.Instance.GetStructInfo(DataType);
    //        if (StructInfo)
    //            StructInfo = StructInfo.GetChildInfoByDataSource(DataSource) as StructDescInfo;
    //        Data = EditorExtend.GetChildDataByDataSource(Data, DataSource);
    //        if (Data && StructInfo && StructInfo instanceof StructDescInfo) {
    //            NewElement = EditorExtend.Instance.NewArrayElement(Data, StructInfo.Name, "", Index);
    //            this.SetModify(DataType);
    //            return NewElement;
    //        }
    //        else {
    //            this.LogError(`配置数据${DataType}的成员${DataSource}不存在`);
    //        }
    //    }
    //    else {
    //        this.LogError(`配置数据类型${DataType}不存在`);
    //    }
    //    return null;
    //}

    //public RemoveData(DataType: string, DataSource: string, Index: number): boolean {
    //    let Data = this.GetConfigData(DataType);
    //    if (Data) {
    //        Data = EditorExtend.GetChildDataByDataSource(Data, DataSource);
    //        if (Data && typeof Data == "object" && Data instanceof Array) {
    //            if (Index < Data.length) {
    //                MessageBox.Instance.Show(`是否要删除选中的数据?`, MESSAGE_BOX_SHOW_TYPE.OK_CANCEL, this,
    //                    function (Result: MESSAGE_BOX_RESULT_CODE) {
    //                        if (Result == MESSAGE_BOX_RESULT_CODE.OK) {
    //                            Data.splice(Index, 1);
    //                            this.SetModify(DataType);
    //                            MainUI.Instance.RefreshList();
    //                        }
    //                    });
    //                return true;
    //            }
    //            else {
    //                this.LogError(`配置数据${DataType}的成员${DataSource}的下标${Index}超出范围`);
    //            }
    //        }
    //        else {
    //            this.LogError(`配置数据${DataType}的成员${DataSource}不存在`);
    //        }
    //    }
    //    else {
    //        this.LogError(`配置数据类型${DataType}不存在`);
    //    }
    //    return false;
    //}
    //public MoveUpData(DataType: string, DataSource: string, Index: number): boolean {
    //    let Data = this.GetConfigData(DataType);
    //    if (Data) {
    //        Data = EditorExtend.GetChildDataByDataSource(Data, DataSource);
    //        if (Data && typeof Data == "object" && Data instanceof Array) {
    //            if (Index < Data.length) {
    //                if (Index > 0) {
    //                    let Temp = Data[Index];
    //                    Data.splice(Index, 1);
    //                    Data.splice(Index - 1, 0, Temp);
    //                    this.SetModify(DataType);
    //                    MainUI.Instance.RefreshList();
    //                }
    //                return true;
    //            }
    //            else {
    //                this.LogError(`配置数据${DataType}的成员${DataSource}的下标${Index}超出范围`);
    //            }
    //        }
    //        else {
    //            this.LogError(`配置数据${DataType}的成员${DataSource}不存在`);
    //        }
    //    }
    //    else {
    //        this.LogError(`配置数据类型${DataType}不存在`);
    //    }
    //    return false;
    //}
    //public MoveDownData(DataType: string, DataSource: string, Index: number): boolean {
    //    let Data = this.GetConfigData(DataType);
    //    if (Data) {
    //        Data = EditorExtend.GetChildDataByDataSource(Data, DataSource);
    //        if (Data && typeof Data == "object" && Data instanceof Array) {
    //            if (Index < Data.length) {
    //                if (Index < Data.length - 1) {
    //                    let Temp = Data[Index];
    //                    Data.splice(Index, 1);
    //                    Data.splice(Index + 1, 0, Temp);
    //                    this.SetModify(DataType);
    //                    MainUI.Instance.RefreshList();
    //                }
    //                return true;
    //            }
    //            else {
    //                this.LogError(`配置数据${DataType}的成员${DataSource}的下标${Index}超出范围`);
    //            }
    //        }
    //        else {
    //            this.LogError(`配置数据${DataType}的成员${DataSource}不存在`);
    //        }
    //    }
    //    else {
    //        this.LogError(`配置数据类型${DataType}不存在`);
    //    }
    //    return false;
    //}
      

    public static ProcessPropertyValueChange(Node: PropertyGridNode) {
    //    switch (Node.Member) {
    //        case "SceneResName":
    //            {
    //                let Parent = Node.Parent;
    //                if (Parent.ValueType == "SCENE_CONFIG") {
    //                    let Config = Parent.Value as MMO.SCENE_CONFIG;
    //                    let Uid = parseInt(Config.SceneResName);
    //                    ResManager.Instance.GetSceneSizeByUid(Uid).then(function (Size: Laya.Size) {
    //                        if (Size) {
    //                            Config.Width = Size.width;
    //                            Config.Height = Size.height;
    //                            Parent.RefreshChild();
    //                        }
    //                    });
    //                }
    //            }
    //            break;
    //    }
    }
}
