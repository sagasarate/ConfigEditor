
interface ElectronAPI {
	OpenFile(options?: object): Promise<string[]>;
	SaveFile(options?: object): Promise<string>;
	ReadDir(Path: string, options?: object): Promise<string[]>;
	MakeDir(Path: string, options?: object): Promise<boolean>;
	RemoveDir(Path: string, options?: object): Promise<boolean>;
	ReadFile(Path: string, options?: object): Promise<Uint8Array | string>;
	WriteFile(Path: string, Data: string | Uint8Array, options?: object): Promise<boolean>;
	RemoveFile(Path: string, options?: object): Promise<boolean>;
	RenameFile(OldPath: string, NewPath: string): Promise<boolean>;
	FileState(Path: string, options?: object): Promise<FileStateInfo>;
}

export interface FileStateInfo {
	dev: number,
	ino: number,
	mode: number,
	nlink: number,
	uid: number,
	gid: number,
	rdev: number,
	size: number,
	blksize: number,
	blocks: number,
	atimeMs: number,
	mtimeMs: number,
	ctimeMs: number,
	birthtimeMs: number,
	atime: Date,
	mtime: Date,
	ctime: Date,
	birthtime: Date
	IsDirectory:boolean,
}




export const electronAPI: ElectronAPI = (window as any).electronAPI;