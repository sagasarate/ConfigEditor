import { DataManager } from "../DataManager";
import { JSON_INT64 } from "../DOSSystem/JSON_INT64"
import JSZip from "jszip"
import { electronAPI} from "./ElectronAPI";
import { BaseFileSystem, FileInfo, FileSystem, FolderInfo, Path, SelectedFileData } from "./FileSystem";
import { MakeStringFile, ParserStringFile, Str2StrArray } from "../Tools";



export class FileFilter {
    name: string;
    extensions: string[];
    constructor(Name: string, Ext: string) {
        this.name = Name;
        this.extensions = [Ext];
    }    
    public static ListFromStr(FilterStr: string): FileFilter[] {
        let List: FileFilter[] = [];
        let StrList = Str2StrArray(FilterStr, "|");
        for (let i = 0; i < StrList.length - 1; i += 2) {
            List.push(new FileFilter(StrList[i], Path.GetFileExt(StrList[i + 1])));
        }
        return List;
    }
}

export class FileSystem_Electron implements BaseFileSystem{

    public async LoadFolder(FolderPath: string): Promise<FolderInfo> {
        let Folder = new FolderInfo(FolderPath);
        if (await this.FetchFolderFiles(Folder, true, false))
            return Folder;
        return null;
    }

    public async FetchFolderFiles(Root: FolderInfo, Recursion: boolean, ForceRefresh: boolean): Promise<boolean> {
        if (ForceRefresh || !Root.IsFetched) {
            if (Root.IsFetched) {
                Recursion = true;
                Root.Clear();
            }
            let Files = await electronAPI.ReadDir(Root.PathName, { recursive: false });
            if (Files) {               
                for (let FilePath of Files) {
                    FilePath = `${Root.PathName}/${FilePath}`;
                    let Info = await electronAPI.FileState(FilePath);
                    if (Info) {
                        if (Info.IsDirectory) {
                            Root.AddChild(new FolderInfo(FilePath));
                        }
                        else {
                            let File = new FileInfo;
                            File.GUID = Info.uid.toString();
                            File.PathName = Path.NormalizePath(FilePath);
                            File.Name = Path.GetPathFileName(File.PathName);
                            File.NameWithoutExt = Path.GetPathFileTitle(File.Name);
                            File.ExtName = Path.GetFileExt(File.Name);
                            File.Size = Info.size;
                            File.CreateTime = Math.floor(Info.birthtimeMs / 1000);
                            File.LastWriteTime = Math.floor(Info.mtimeMs / 1000);
                            Root.AddChild(File);
                        }
                    }
                }
                Root.IsFetched = true;
                if (Recursion) {
                    for (let Child of Root.ChildFolders.values()) {
                        await this.FetchFolderFiles(Child, Recursion, ForceRefresh);
                    }
                }
                return true;
            }
            else {
                DataManager.Instance.LogError(`请求目录${Root.PathName}内容失败`);
            }
            return false;
        }
        return true;
    }
    public async CreateFolder(Parent: FolderInfo, FolderName: string): Promise<FolderInfo> {
        if (Parent)
            FolderName = `${Parent.PathName}/${FolderName}`;
        FolderName = Path.NormalizePath(FolderName);
        if (await electronAPI.MakeDir(FolderName)) {
            let Folder = new FolderInfo(FolderName);
            if (Parent)
                Parent.AddChild(Folder);
            return Folder;
        }
        return null;
    }    
    
    public async RemoveFolder(Folder: FolderInfo): Promise<boolean> {
        DataManager.Instance.LogInfo(`请求删除目录${Folder.PathName}`);
        if (await electronAPI.RemoveDir(Folder.PathName)) {
            if (Folder.Parent)
                Folder.Parent.RemoveChild(Folder);
            DataManager.Instance.LogInfo(`目录${Folder.PathName}已删除`);
            return true;
        }
        else {
            DataManager.Instance.LogError(`删除目录${Folder.PathName}失败`);
        }
        return false;
    }

    public async RemoveFile(File: FileInfo): Promise<boolean> {
        DataManager.Instance.LogInfo(`请求删除文件${File.PathName}`);
        if (await electronAPI.RemoveFile(File.PathName)) {
            if (File.Parent)
                File.Parent.RemoveChild(File);
            DataManager.Instance.LogInfo(`文件${File.PathName}已删除`);
            return true;
        }
        else {
            DataManager.Instance.LogError(`删除文件${File.PathName}失败`);
        }
        return false;
    }

    public async MoveFile(Info: FileInfo | FolderInfo, NewPath: string): Promise<boolean> {
        DataManager.Instance.LogInfo(`请求移动文件${Info.PathName}到${NewPath}`);
        let OldName = Info.Name;
        NewPath = Path.NormalizePath(NewPath);
        if (await electronAPI.RenameFile(Info.PathName, NewPath)) {
            NewPath = Path.NormalizePath(NewPath);
            let OldParent = Info.Parent;
            let NewParent: FolderInfo;
            let Root = OldParent.GetRoot();
            if (Root)
                NewParent = Root.FindFolder(Path.GetPathDir(NewPath));
            if (OldParent && NewParent) {
                Info.PathName = NewPath;
                Info.Name = Path.GetPathFileName(NewPath);
                if (OldParent.RemoveChild(OldName))
                    NewParent.AddChild(Info);
                else
                    DataManager.Instance.LogError("未能正确修改目录数据");
                if (Info instanceof FolderInfo) {
                    Info.UpdateChildsPath();
                }
            }
            DataManager.Instance.LogInfo(`文件${Info.PathName}已移动到${NewPath}`);
            return true;
        }
        else {
            DataManager.Instance.LogError(`移动文件${Info.PathName}失败`);
        }
        return false;
    }

    public async ZipFolder(zip: JSZip, Dir: string, Folder: FolderInfo, Recursion?: boolean): Promise<boolean> {
        for (let Info of Folder.Files.values()) {
            let FilePath;
            if (Dir.length)
                FilePath = `${Dir}/${Info.Name}`;
            else
                FilePath = Info.Name;
            let FileData = await this.ReadFile(Info);
            if (FileData && FileData instanceof ArrayBuffer) {
                zip.file(FilePath, FileData);
            }
            else {
                DataManager.Instance.LogError(`读取文件[${Info.PathName}]失败`);
            }
        }
        if (Recursion) {
            for (let pair of Folder.ChildFolders) {
                let SubDir;
                if (Dir.length)
                    SubDir = `${Dir}/${pair[1].Name}`;
                else
                    SubDir = pair[1].Name;
                await this.ZipFolder(zip, SubDir, pair[1], Recursion);
            }
        }
        return true;
    }

    



    public async ReadFile(Info: FileInfo | string, ContentType?: XMLHttpRequestResponseType): Promise<any> {
        let FilePath = (typeof Info == "string") ? Info : Info.PathName;
        let Data = await electronAPI.ReadFile(FilePath);
        if (Data && Data instanceof Uint8Array) {
            switch (ContentType) {
                case "text":
                    return ParserStringFile(Data.buffer);
                case "json":
                    try {
                        let JsonStr = ParserStringFile(Data.buffer);
                        return JSON_INT64.parse(JsonStr);
                    }
                    catch (e) {
                        DataManager.Instance.LogError(`文件[${FilePath}]解析json失败:${e}`);
                        return null;
                    }
                    break;
                default:
                    return Data.buffer;
            }
        }
        else {
            DataManager.Instance.LogError(`读取文件[${FilePath}]失败`);
        }
        return null
    }

    public async WriteFile(Info: FileInfo | string, Content: string | ArrayBuffer): Promise<boolean> {
        let FileData: ArrayBuffer;
        if (typeof Content == "string") {
            FileData = MakeStringFile(Content);
        }
        else {
            FileData = Content;
        }
        return await electronAPI.WriteFile((typeof Info == "string") ? Info : Info.PathName, new Uint8Array(FileData));
    }

    public async CreateFile(Folder: FolderInfo, FileName: string, Content: string | ArrayBuffer): Promise<FileInfo> {
        let FileData: ArrayBuffer;
        if (typeof Content == "string") {
            FileData = MakeStringFile(Content);
        }
        else {
            FileData = Content;
        }
        let FilePath = Path.NormalizePath(`${Folder.PathName}/${FileName}`);
        if (await electronAPI.WriteFile(FilePath, new Uint8Array(FileData))) {
            let Info = await electronAPI.FileState(FilePath);
            if (Info) {
                let File = new FileInfo;
                File.GUID = Info.uid.toString();
                File.PathName = Path.NormalizePath(FilePath);
                File.Name = Path.GetPathFileName(File.PathName);
                File.NameWithoutExt = Path.GetPathFileTitle(File.Name);
                File.ExtName = Path.GetFileExt(File.Name);
                File.Size = Info.size;
                File.CreateTime = Math.floor(Info.birthtimeMs / 1000);
                File.LastWriteTime = Math.floor(Info.mtimeMs / 1000);
                Folder.AddChild(File);
                return File;
            }
            return null;
        }
    }
    public async SelectFile(Filter?: string, IsMulti?: boolean): Promise<SelectedFileData[]> {
        let Option = { filters: [], properties: ["openFile"] };
        if (Filter) {
            Option.filters = FileFilter.ListFromStr(Filter);
        }
        if (IsMulti)
            Option.properties.push("multiSelections");
        let Files = await electronAPI.OpenFile(Option);
        if (Files) {
            let FileDatas: SelectedFileData[] = [];
            for (let FilePath of Files) {
                let Data = await electronAPI.ReadFile(FilePath);
                if (Data && Data instanceof Uint8Array) {
                    FileDatas.push(new SelectedFileData(Path.GetPathFileName(FilePath), Data.buffer));
                }
            }
            return FileDatas;
        }
        return null;
    }
    public async SaveFile(FileName: string, FileData: ArrayBuffer | FileInfo): Promise<boolean> {
        let Data: ArrayBuffer;
        if (FileData instanceof FileInfo) {
            FileName = FileData.Name;
            Data = await this.ReadFile(FileData);
        }
        else {
            Data = FileData;
        }
        if (FileData) {
            let Option = {
                defaultPath: FileName, properties: ["createDirectory", "showOverwriteConfirmation"]
            };
            let FilePath = await electronAPI.SaveFile(Option);
            if (FilePath) {
                return await FileSystem.Instance.WriteFile(FilePath, Data);
            }
        }        
        return false;
    }
    public async SaveFolder(Folder: FolderInfo, Recursion?: boolean): Promise<boolean> {
        let zip = new JSZip();
        await FileSystem.Instance.ZipFolder(zip, "", Folder, Recursion);

        let ZipData = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
        DataManager.Instance.LogInfo("已完成文件打包压缩");
        let CurDate = new Date(Date.now());
        let DateStr = `${CurDate.getFullYear()}-${CurDate.getMonth().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getDay().toLocaleString('zh', { minimumIntegerDigits: 2 })}.`
            + `${CurDate.getHours().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getMinutes().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getSeconds().toLocaleString('zh', { minimumIntegerDigits: 2 })}`;
        return await this.SaveFile(`${Folder.Name}.${DateStr}.zip`, ZipData);
    }
}