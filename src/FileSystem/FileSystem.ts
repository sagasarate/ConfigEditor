import JSZip from "jszip";
import { Encoding } from "../DOSSystem/Encoding/Encoding";
import { Str2StrArray, StrTrim } from "../Tools";
import { electronAPI } from "./ElectronAPI";
import { FileSystem_Electron } from "./FileSystem_Electron";
import { FileSystem_Web } from "./FileSystem_Web";

export enum CODE_PAGE {
    NONE = 0,
    GBK = 936,
    UTF8 = 65001,
    UCS2 = 1200
};



export class FolderInfo {
    Name: string = "";
    PathName: string = "";
    IsFetched = false;
    Parent: FolderInfo;
    ChildFolders = new Map<string, FolderInfo>();
    Files = new Map<string, FileInfo>();
    constructor(PathName?: string) {
        if (PathName) {
            this.PathName = PathName;
            this.Name = Path.GetPathFileName(this.PathName);
        }
    }
    public static CloneFrom(Value: any) {
        let Info = new FolderInfo();
        Info.PathName = Path.NormalizePath(Value.Path);
        Info.Name = Path.GetPathFileName(Info.PathName);
        return Info;
    }
    public CloneFrom(Value: any) {
        if (Value instanceof FolderInfo) {
            this.PathName = Value.PathName;
            this.Name = Value.Name;
        }
        else {
            this.PathName = Path.NormalizePath(Value.Path);
            this.Name = Path.GetPathFileName(this.PathName);
        }
    } public Clear() {
        this.ChildFolders.clear();
        this.Files.clear();
    }
    public AddChild(Child: FolderInfo | FileInfo | any): FolderInfo | FileInfo {
        if (Child instanceof FolderInfo) {
            let Info = this.ChildFolders.get(Child.Name.toLowerCase());
            if (Info) {
                Info.CloneFrom(Child);
                Child = Info;
            }
            else {
                Child.Parent = this;
                this.ChildFolders.set(Child.Name.toLowerCase(), Child);
            }
            return Child;
        }
        else if (Child instanceof FileInfo) {
            let Info = this.Files.get(Child.Name.toLowerCase());
            if (Info) {
                Info.CloneFrom(Child);
                Child = Info;
            }
            else {
                Child.Parent = this;
                this.Files.set(Child.Name.toLowerCase(), Child);
            }
            return Child;
        }
        else {
            if (Child.IsDir) {
                return this.AddChild(FolderInfo.CloneFrom(Child));
            }
            else {
                return this.AddChild(FileInfo.CloneFrom(Child));
            }
        }
    }
    public RemoveChild(Child: FolderInfo | FileInfo | string): boolean {
        if (typeof Child == "string") {
            if (this.ChildFolders.delete(Child.toLowerCase()))
                return true;
            else
                return this.Files.delete(Child.toLowerCase());
        }
        else if (Child instanceof FolderInfo) {
            return this.ChildFolders.delete(Child.Name.toLowerCase());
        }
        else {
            return this.Files.delete(Child.Name.toLowerCase());
        }
    }

    public FindFolder(FolderPath: string): FolderInfo {
        let Root: FolderInfo = this;
        if (FolderPath && FolderPath.length > 0) {
            let Dirs = FolderPath.split('/');
            for (let Dir of Dirs) {
                if (Dir.length) {
                    let Info = Root.ChildFolders.get(Dir.toLowerCase());
                    if (Info)
                        Root = Info;
                    else
                        return null;
                }
            }
        }
        return Root;
    }

    public FindFile(FilePath: string): FileInfo {
        let Root: FolderInfo = this;
        FilePath = FilePath.trim();
        let Pos = FilePath.lastIndexOf('/');
        if (Pos >= 0) {
            Root = Root.FindFolder(FilePath.substr(0, Pos));
            FilePath = FilePath.substr(Pos + 1);
        }
        if (Root) {
            return Root.Files.get(FilePath.toLowerCase());
        }
        return null;
    }
    public RebuildPath(): string {
        if (this.Parent)
            this.PathName = `${this.Parent.RebuildPath()}/${this.Name}`;
        return this.PathName;
    }
    public GetPath(): string {
        return this.PathName;
    }
    public GetRoot(): FolderInfo {
        if (this.Parent)
            return this.Parent.GetRoot();
        else
            return this;
    }
    public UpdateChildsPath() {
        for (let File of this.Files.values()) {
            File.RebuildPath();
        }
        for (let Folder of this.ChildFolders.values()) {
            Folder.UpdateChildsPath();
        }
        if (this.Files.size == 0 && this.ChildFolders.size == 0)
            this.RebuildPath();
    }
    public GetRelativePath(FilePath: string) {
        FilePath = Path.NormalizePath(FilePath).toLowerCase();
        let SelfPath = Path.NormalizePath(this.PathName).toLowerCase();
        if (FilePath.startsWith(SelfPath))
            return FilePath.slice(SelfPath.length + 1);
        return Path;
    }
    public async CreateFile(FileName: string, Content: string | ArrayBuffer): Promise<FileInfo> {
        let Folder: FolderInfo = this;
        FileName = Path.NormalizePath(FileName);
        let Pos = FileName.lastIndexOf("/")
        if (Pos >= 0) {
            let Dir = FileName.substr(0, Pos);
            FileName = FileName.substr(Pos + 1);
            Folder = this.FindFolder(Dir);
            if (!Folder)
                Folder = await this.CreateFolder(Dir);
        }
        if (Folder)
            return await FileSystem.Instance.CreateFile(Folder, FileName, Content);
        else
            return null;
    }
    public async CreateFolder(FolderName: string): Promise<FolderInfo> {
        return await FileSystem.Instance.CreateFolder(this, FolderName);
    }
};

export class FileInfo {
    GUID: string = "";
    Name: string = "";
    PathName: string = "";
    NameWithoutExt: string = "";
    ExtName: string = "";
    Alias: string = "";
    Size: number = 0;
    CreateTime: number = 0;
    LastWriteTime: number = 0;
    Parent: FolderInfo;
    public static CloneFrom(Value: any) {
        let Info = new FileInfo();
        Info.CloneFrom(Value);
        return Info;
    }
    public CloneFrom(Value: any) {
        if (Value instanceof FileInfo) {
            this.GUID = Value.GUID;
            this.PathName = Value.PathName;
            this.Alias = Value.Alias;
            this.Size = Value.Size;
            this.CreateTime = Value.CreateTime;
            this.LastWriteTime = Value.LastWriteTime;
            this.Name = Value.Name;
            this.NameWithoutExt = Value.NameWithoutExt;
            this.ExtName = Value.ExtName;
        }
        else {
            this.GUID = Value.GUID;
            this.PathName = Path.NormalizePath(Value.Path);
            this.Alias = Value.Alias;
            this.Size = Value.Size;
            this.CreateTime = Value.CreateTime;
            this.LastWriteTime = Value.LastWriteTime;
            this.Name = Path.GetPathFileName(this.PathName);
            this.NameWithoutExt = Path.GetPathFileTitle(this.Name);
            this.ExtName = Path.GetFileExt(this.Name);
        }
    }
    public RebuildPath(): string {
        if (this.Parent)
            this.PathName = `${this.Parent.RebuildPath()}/${this.Name}`;
        return this.PathName;
    }
    public GetPath(): string {
        return this.PathName;
    }

    public async Read(ContentType: XMLHttpRequestResponseType = "arraybuffer"): Promise<any> {
        return FileSystem.Instance.ReadFile(this, ContentType);
    }
    public async Write(Content?: string | ArrayBuffer): Promise<boolean> {
        return FileSystem.Instance.WriteFile(this, Content);
    }
    public GetRoot(): FolderInfo {
        if (this.Parent)
            return this.Parent.GetRoot();
        return null;
    }
};

export class SelectedFileData {
    FileName: string;
    Data: ArrayBuffer;
    constructor(FileName: string, Data: ArrayBuffer) {
        this.FileName = FileName;
        this.Data = Data;
    }
}

export class Path {
    public static NormalizePath(Path: string, EncloseInSlash?: boolean): string {
        Path = Path.trim().replace(/\\/g, "/");
        Path = StrTrim(Path, "/");
        if (EncloseInSlash)
            if (Path)
                return `/${Path}/`;
            else
                return "/";
        else
            return Path;
    }
    public static GetPathTitle(FilePath: string): string {
        FilePath = Path.NormalizePath(FilePath);
        let Pos = FilePath.lastIndexOf('.');
        if (Pos >= 0)
            return FilePath.substr(0, Pos);
        else
            return FilePath;
    }

    public static GetPathFileName(FilePath: string): string {
        FilePath = Path.NormalizePath(FilePath);
        let Pos = FilePath.lastIndexOf('/');
        if (Pos >= 0)
            return FilePath.slice(Pos + 1);
        else
            return FilePath;
    }

    public static GetPathFileTitle(FilePath: string): string {
        FilePath = Path.NormalizePath(FilePath);
        let Pos = FilePath.lastIndexOf('/');
        let FileName: string;
        if (Pos >= 0)
            FileName = FilePath.slice(Pos + 1);
        else
            FileName = FilePath;
        Pos = FileName.lastIndexOf('.');
        if (Pos >= 0)
            return FileName.substr(0, Pos);
        else
            return FileName;
    }
    public static GetFileExt(FileName: string): string {
        let Pos = FileName.lastIndexOf('.');
        if (Pos >= 0)
            return FileName.substr(Pos + 1);
        return "";
    }

    public static GetPathDir(FilePath: string): string {
        FilePath = Path.NormalizePath(FilePath);
        let Pos = FilePath.lastIndexOf('/');
        if (Pos >= 0)
            return FilePath.slice(0, Pos);
        else
            return "";
    }    
    public static GetRelativePath(SrcPath: string, Root: string): string {
        SrcPath = Path.NormalizePath(SrcPath);
        Root = Path.NormalizePath(Root);
        if (Root && SrcPath.toLowerCase().startsWith(Root.toLowerCase()))
            return SrcPath.slice(Root.length + 1);
        else
            return SrcPath;
    }
}

export interface BaseFileSystem {   

    LoadFolder(FolderPath: string): Promise<FolderInfo>;
    FetchFolderFiles(Root: FolderInfo, Recursion: boolean, ForceRefresh: boolean): Promise<boolean>;
    CreateFolder(Parent: FolderInfo, FolderName: string): Promise<FolderInfo>;
    RemoveFolder(Folder: FolderInfo): Promise<boolean>;
    RemoveFile(File: FileInfo): Promise<boolean>;
    MoveFile(Info: FileInfo | FolderInfo, NewPath: string): Promise<boolean>;
    ZipFolder(zip: JSZip, Dir: string, Folder: FolderInfo, Recursion?: boolean): Promise<boolean>;
    ReadFile(Info: FileInfo | string, ContentType?: XMLHttpRequestResponseType): Promise<any>;
    WriteFile(Info: FileInfo | string, Content: string | ArrayBuffer): Promise<boolean>;
    CreateFile(Folder: FolderInfo, FileName: string, Content: string | ArrayBuffer): Promise<FileInfo>;
    SelectFile(Filter?: string, IsMulti?: boolean): Promise<SelectedFileData[]>;
    SaveFile(FileName: string, FileData: ArrayBuffer | FileInfo): Promise<boolean>;
    SaveFolder(Folder: FolderInfo, Recursion?: boolean): Promise<boolean>;
}

export class FileSystem {
    protected static m_Instance: BaseFileSystem;
    public static get Instance(): BaseFileSystem {
        if (!FileSystem.m_Instance) {
            if (electronAPI)
                FileSystem.m_Instance = new FileSystem_Electron();
            else
                FileSystem.m_Instance = new FileSystem_Web();
        }
        return FileSystem.m_Instance;
    }
}