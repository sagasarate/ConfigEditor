import { DataManager } from "../DataManager";
import { Encoding } from "../DOSSystem/Encoding/Encoding"
import { JSON_INT64 } from "../DOSSystem/JSON_INT64"
import JSZip from "jszip"
import { BaseFileSystem, FileInfo, FileSystem, FolderInfo, Path, SelectedFileData } from "./FileSystem";
import { MakeStringFile, Str2StrArray, StrTrim } from "../Tools";


const HOST_ADDRESS = "http://192.168.1.85:9500/index.php?s=FileSysV2/";
//const HOST_ADDRESS = "http://127.0.0.1:9500/index.php?s=FileSysV2/";



export class WebSystem {
    public static HTTPGet(url: string, NoCache?: boolean, ResponseType?: XMLHttpRequestResponseType): Promise<XMLHttpRequest> {
        return new Promise<XMLHttpRequest>(function (resolve, reject) {
            DataManager.Instance.LogInfo(`HTTPGet=${url}`);
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            let UrlToLow = url.toLowerCase();
            if (ResponseType)
                xhr.responseType = ResponseType;
            xhr.timeout = 10000;
            if (NoCache)
                xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.onload = function (ev: ProgressEvent) {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr);
                }
                else {
                    resolve(null);
                }
            };
            xhr.ontimeout = function (ev: ProgressEvent) {
                DataManager.Instance.LogError(`请求超时`);
                resolve(null);
            };
            xhr.onerror = function (ev: ProgressEvent) {
                DataManager.Instance.LogError(`请求失败Status=${xhr.status}:${xhr.statusText}`);
                resolve(null);
            };
            xhr.send();
        });
    }
    public static HTTPPost(url: string, Data: string | ArrayBuffer, NoCache?: boolean, ResponseType?: XMLHttpRequestResponseType): Promise<XMLHttpRequest> {
        return new Promise<XMLHttpRequest>(function (resolve, reject) {
            DataManager.Instance.LogInfo(`HTTPPost=${url}`);
            let xhr = new XMLHttpRequest();
            xhr.open("Post", url, true);
            if (typeof Data == "string") {
                if (ResponseType)
                    xhr.responseType = ResponseType;
            }
            if (NoCache)
                xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.timeout = 10000;
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr);
                }
                else {
                    resolve(null);
                }
            };
            xhr.ontimeout = function () {
                DataManager.Instance.LogError(`请求超时`);
                resolve(null);
            };
            xhr.onerror = function () {
                DataManager.Instance.LogError(`请求失败Status=${xhr.status}:${xhr.statusText}`);
                resolve(null);
            };
            xhr.send(Data);
        });
    }

    public static HTTPPostForm(url: string, Data: FormData): Promise<XMLHttpRequest> {
        return new Promise<XMLHttpRequest>(function (resolve, reject) {
            DataManager.Instance.LogInfo(`HTTPPostForm=${url}`);
            let xhr = new XMLHttpRequest();
            xhr.open("Post", url, true);
            xhr.timeout = 10000;
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr);
                }
                else {
                    resolve(null);
                }
            };
            xhr.ontimeout = function () {
                DataManager.Instance.LogError(`请求超时`);
                resolve(null);
            };
            xhr.onerror = function () {
                DataManager.Instance.LogError(`请求失败Status=${xhr.status}:${xhr.statusText}`);
                resolve(null);
            };
            xhr.send(Data);
        });
    }

    public static async UploadFile(FilePath: string, FileData?: string | Uint8Array | ArrayBuffer): Promise<FileInfo> {
        let file;
        
        if (typeof FileData == "string") {
            file = new File([MakeStringFile(FileData)], Path.GetPathFileName(FilePath));
        }
        else {
            file = new File([FileData], Path.GetPathFileName(FilePath));
        }
       
        let form = new FormData();
        form.append("file", file);
        DataManager.Instance.LogInfo(`请求上传文件${file.name}`);
        let URL = `${HOST_ADDRESS}UploadFile&FolderPath=${Path.GetPathDir(FilePath)}`;
        let xhr = await WebSystem.HTTPPostForm(URL, form);
        if (xhr) {
            let Result = JSON_INT64.parse(xhr.responseText);
            if (Result.code == 0) {
                DataManager.Instance.LogInfo(`上传文件${FilePath}成功`);
                if (Result.data && Result.data instanceof Array && Result.data.length >= 1) {
                    let Info = FileInfo.CloneFrom(Result.data[0]);
                    return Info;
                }
                else {
                    DataManager.Instance.LogError(`上传文件${FilePath}返回数据结构错误`);
                    return null
                }
            }
            else {
                DataManager.Instance.LogError(`上传文件${FilePath}失败,code=${Result.code},msg=${Result.data}`);
            }
        }
        else {
            DataManager.Instance.LogError(`上传文件${FilePath}失败`);
        }
        return null;
    }

    public static SaveToLocalFile(FileName: string, Data: Uint8Array | ArrayBuffer | string) {
        let downloadLink = document.createElement("a");
        downloadLink.download = FileName;
        downloadLink.innerHTML = "Download File";
        if (window.webkitURL != null)
            downloadLink.href = window.webkitURL.createObjectURL(new Blob([Data], { type: 'application/octet-stream' }));
        else
            downloadLink.href = window.URL.createObjectURL(new Blob([Data], { type: 'application/octet-stream' }));
        downloadLink.style.display = 'hidden';
        downloadLink.style.width = '0px';
        downloadLink.style.height = '0px';
        downloadLink.click();
    }

    public static LoadFile(AcceptExts?: string, Multi?: boolean): Promise<FileList> {
        return new Promise<FileList>(function (resolve, reject) {
            let inputEl: HTMLInputElement = <HTMLInputElement>document.getElementById('file_input');
            if (!inputEl) {
                inputEl = document.createElement('input');
                inputEl.id = 'file_input';
                inputEl.setAttribute('id', 'file_input');
                inputEl.setAttribute('type', 'file');
                inputEl.setAttribute('class', 'fileToUpload');
                if (AcceptExts)
                    inputEl.setAttribute('accept', AcceptExts);
                if (Multi)
                    inputEl.setAttribute('multiple', 'true');
                inputEl.style.display = 'hidden';
                inputEl.style.width = '0px';
                inputEl.style.height = '0px';
                document.body.appendChild(inputEl);
            }
            inputEl.onchange = (event) => {
                resolve(inputEl.files);
                inputEl.remove();
            }
            inputEl.oncancel = (event) => {
                resolve(null);
                inputEl.remove();
            }
            inputEl.click();
        });
    }

    //public static async SaveFolderToLocal(Folder: FolderInfo, Recursion?: boolean): Promise<boolean> {
    //    let zip = new JSZip();
    //    await FileSystem.Instance.ZipFolder(zip, "", Folder, Recursion);

    //    let ZipData = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
    //    DataManager.Instance.LogInfo("已完成文件打包压缩");
    //    let CurDate = new Date(Date.now());
    //    let DateStr = `${CurDate.getFullYear()}-${CurDate.getMonth().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getDay().toLocaleString('zh', { minimumIntegerDigits: 2 })}.`
    //        + `${CurDate.getHours().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getMinutes().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getSeconds().toLocaleString('zh', { minimumIntegerDigits: 2 })}`;
    //    WebSystem.SaveToLocalFile(`${Folder.Name}.${DateStr}.zip`, ZipData);
    //    DataManager.Instance.LogInfo("已提交文件下载");
    //    return true;
    //}
    //public static async UploadFileToFolder(Folder: FolderInfo, AcceptExts?: string, Multi?: boolean): Promise<boolean> {
    //    let files = await WebSystem.LoadFile(AcceptExts, Multi);
    //    if (files && files.length) {
    //        for (let i = 0; i < files.length; i++) {
    //            await WebSystem.UploadFile(Folder, files[i], undefined);
    //        }
    //        //await FileSystem.FetchFolderFiles(Folder, false, true);
    //        return true;
    //    }
    //    return false;
    //}

    public static async SaveFileToLocal(Info: FileInfo): Promise<boolean> {
        let URL = `${HOST_ADDRESS}DownloadFile&Path=${encodeURIComponent(Info.PathName)}`;
        let xhr = await WebSystem.HTTPGet(URL, true, "arraybuffer");
        if (xhr) {
            WebSystem.SaveToLocalFile(Info.Name, xhr.response);
        }
        else {
            DataManager.Instance.LogError(`下载文件[${Info.PathName}]失败`);
        }
        return false;
    }
    public static ToWebFileFilter(Filter: string): string {
        let Filters = Str2StrArray(Filter, "|");
        let WebFilters = [];
        for (let i = 1; i < Filters.length; i += 2) {
            let Ext = Filters[i].toLowerCase();
            switch (Ext) {
                case "*.txt":
                    WebFilters.push("text/plain");
                    break;
                case "*.png":
                    WebFilters.push("image/png");
                    break;
                case "*.jpg":
                    WebFilters.push("image/jpeg");
                    break;
                case "*.json":
                    WebFilters.push("application/json");
                    break;                    
            }
        }
        return WebFilters.join(",");
    }
}

export class FileSystem_Web implements BaseFileSystem {

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
            let URL = `${HOST_ADDRESS}GetFiles&path=${encodeURIComponent(Root.PathName)}&Recu=${Recursion ? 1 : 0}`;
            let xhr = await WebSystem.HTTPGet(URL, false);
            if (xhr) {
                let Data = JSON_INT64.parse(xhr.responseText);
                if (Data.code == 0) {
                    for (let Info of Data.data) {
                        let Dir = Path.GetPathDir(Path.GetRelativePath(Info.Path, Root.PathName));
                        let Folder = Root.FindFolder(Dir);
                        if (Folder) {
                            Folder.AddChild(Info);
                        }
                        else {
                            DataManager.Instance.LogError(`无法将[${Info.Path}]加入目录树${Dir}`);
                        }
                    }
                    return true;
                }
                else {
                    DataManager.Instance.LogError(`请求目录${Root.PathName}的内容失败`);
                }
            }
            return false;
        }
        return true;
    }
    public async CreateFolder(Parent: FolderInfo, FolderName: string): Promise<FolderInfo> {
        FolderName.replace("\\", "/");
        FolderName = StrTrim(FolderName, "/");
        let Dirs = Str2StrArray(FolderName, "/");
        for (let Dir of Dirs) {
            Parent = await this.CreateOneFolder(Parent, Dir);
            if (!Parent)
                break;
        }
        return Parent;
    }
    protected async CreateOneFolder(Parent: FolderInfo, FolderName: string): Promise<FolderInfo> {
        let FullPath = FolderName;
        let Folder: FolderInfo;
        if (Parent) {            
            Folder = Parent.ChildFolders.get(FolderName.toLowerCase());
            if (Folder) {
                DataManager.Instance.LogInfo(`目录${FullPath}已存在`);
                return Folder;
            }
            FullPath = `${Parent.PathName}/${FolderName}`;
        }
            
        DataManager.Instance.LogInfo(`请求创建目录${FullPath}`);
        let URL = `${HOST_ADDRESS}CreateFolder&Path=${encodeURIComponent(FullPath)}`;
        let xhr = await WebSystem.HTTPGet(URL, false);
        if (xhr) {
            let Result = JSON_INT64.parse(xhr.responseText);
            if (Result.code == 0) {
                if (Parent)
                    Folder = Parent.AddChild(Result.data) as FolderInfo;
                else
                    Folder = FolderInfo.CloneFrom(Result.data);
                DataManager.Instance.LogInfo(`目录${Folder.PathName}已创建`);
                return Folder
            }
            else {
                DataManager.Instance.LogError(`创建目录${FolderName}失败,code=${Result.code},msg=${Result.data}`);
            }
        }
        else {
            DataManager.Instance.LogError(`创建目录${FolderName}失败`);
        }
        return null;
    }
    
    public async RemoveFolder(Folder: FolderInfo): Promise<boolean> {
        DataManager.Instance.LogInfo(`请求删除目录${Folder.PathName}`);
        let URL = `${HOST_ADDRESS}RemoveFile&Path=${encodeURIComponent(Folder.PathName)}`;
        let xhr = await WebSystem.HTTPGet(URL, false);
        if (xhr) {
            let Result = JSON_INT64.parse(xhr.responseText);
            if (Result.code == 0) {
                if (Folder.Parent)
                    Folder.Parent.RemoveChild(Folder);                
                DataManager.Instance.LogInfo(`目录${Folder.PathName}已删除`);
                return true;
            }
            else {
                DataManager.Instance.LogError(`删除目录${Folder.PathName}失败,code=${Result.code},msg=${Result.data}`);
            }
        }
        else {
            DataManager.Instance.LogError(`删除目录${Folder.PathName}失败`);
        }
        return false;
    }

    public async RemoveFile(File: FileInfo): Promise<boolean> {
        DataManager.Instance.LogInfo(`请求删除文件${File.PathName}`);
        let URL = `${HOST_ADDRESS}RemoveFile&Path=${encodeURIComponent(File.PathName)}`;
        let xhr = await WebSystem.HTTPGet(URL, false);
        if (xhr) {
            let Result = JSON_INT64.parse(xhr.responseText);
            if (Result.code == 0) {
                if (File.Parent)
                    File.Parent.RemoveChild(File);
                DataManager.Instance.LogInfo(`文件${File.PathName}已删除`);
                return true;
            }
            else {
                DataManager.Instance.LogError(`删除文件${File.PathName}失败,code=${Result.code},msg=${Result.data}`);
            }
        }
        else {
            DataManager.Instance.LogError(`删除文件${File.PathName}失败`);
        }
        return false;
    }

    public async MoveFile(Info: FileInfo | FolderInfo, NewPath: string): Promise<boolean> {
        DataManager.Instance.LogInfo(`请求移动文件${Info.PathName}到${NewPath}`);
        let OldName = Info.Name;
        let URL = `${HOST_ADDRESS}MoveFile&Path=${encodeURIComponent(Info.PathName)}&TargetPath=${NewPath}`;
        let xhr = await WebSystem.HTTPGet(URL, false);
        if (xhr) {
            let Result = JSON_INT64.parse(xhr.responseText);
            if (Result.code == 0) {
                NewPath = Path.NormalizePath(Result.data.Path);
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
                DataManager.Instance.LogError(`移动文件${Info.PathName}失败,code=${Result.code},msg=${Result.data}`);
            }
        }
        else {
            DataManager.Instance.LogError(`移动文件${Info.PathName}失败`);
        }
        return false;
    }

    public async ZipFolder(zip: JSZip, Dir: string, Folder: FolderInfo, Recursion?: boolean): Promise<boolean> {
        for (let pair of Folder.Files) {
            let Info = pair[1];
            let FilePath;
            if (Dir.length)
                FilePath = `${Dir}/${Info.Name}`;
            else
                FilePath = Info.Name;
            let URL = `${HOST_ADDRESS}DownloadFile&Path=${encodeURIComponent(Info.PathName)}`;
            let xhr = await WebSystem.HTTPGet(URL, true, "arraybuffer");
            if (xhr) {
                zip.file(FilePath, xhr.response);
            }
            else {
                DataManager.Instance.LogError(`下载文件[${Info.PathName}]失败`);
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
        if (!ContentType)
            ContentType = "arraybuffer";
        let FilePath = (typeof Info == "string") ? Info : Info.PathName;
        let URL = `${HOST_ADDRESS}DownloadFile&Path=${encodeURIComponent(FilePath)}`;
        let xhr = await WebSystem.HTTPGet(URL, true, ContentType);
        if (xhr) {
            return xhr.response;
        }
        else {
            DataManager.Instance.LogError(`下载文件[${FilePath}]失败`);
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
        return await WebSystem.UploadFile((typeof Info == "string") ? Info : Info.PathName, FileData) != null;
    }

    public async CreateFile(Folder: FolderInfo, FileName: string, Content: string | ArrayBuffer): Promise<FileInfo> {
        let FileData: ArrayBuffer;
        if (typeof Content == "string") {
            FileData = MakeStringFile(Content);
        }
        else {
            FileData = Content;
        }
        let Info = await WebSystem.UploadFile(`${Folder.PathName}/${FileName}`, FileData);
        if (Info) {
            Folder.AddChild(Info);
        }
        return Info;
    }

    public async SelectFile(Filter?: string, IsMulti?: boolean): Promise<SelectedFileData[]> {
        let Files = await WebSystem.LoadFile(WebSystem.ToWebFileFilter(Filter), IsMulti);
        if (Files) {
            let FileDatas: SelectedFileData[] = [];
            for (let File of Files) {
                FileDatas.push(new SelectedFileData(File.name, await File.arrayBuffer()));
            }
            return FileDatas;
        }
        return null;
    }

    public async SaveFile(FileName: string, FileData: ArrayBuffer | FileInfo): Promise<boolean> {
        if (FileData instanceof FileInfo) {
            WebSystem.SaveFileToLocal(FileData);            
        }
        else {
            WebSystem.SaveToLocalFile(FileName, FileData);
        }        
        return true;
    }

    public async SaveFolder(Folder: FolderInfo, Recursion?: boolean): Promise<boolean> {
        let zip = new JSZip();
        await FileSystem.Instance.ZipFolder(zip, "", Folder, Recursion);

        let ZipData = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
        DataManager.Instance.LogInfo("已完成文件打包压缩");
        let CurDate = new Date(Date.now());
        let DateStr = `${CurDate.getFullYear()}-${CurDate.getMonth().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getDay().toLocaleString('zh', { minimumIntegerDigits: 2 })}.`
            + `${CurDate.getHours().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getMinutes().toLocaleString('zh', { minimumIntegerDigits: 2 })}-${CurDate.getSeconds().toLocaleString('zh', { minimumIntegerDigits: 2 })}`;
        WebSystem.SaveToLocalFile(`${Folder.Name}.${DateStr}.zip`, ZipData);
        DataManager.Instance.LogInfo("已提交文件下载");
        return true;
    }
}