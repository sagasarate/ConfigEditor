// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')

let mainWindow = undefined;



async function handleFileOpen(evt, options) {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options);
    if (!canceled) {
        return filePaths
    }
}

async function handleFileSave(evt, options) {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, options);
    if (!canceled) {
        return filePath
    }
}

async function handleReadDir(evt, Path, options) {
    try {
        return await fs.readdir(Path, options);
    }
    catch {
        return null;
    }
}

async function handleMakeDir(evt, Path, options) {
    try {
        await fs.mkdir(Path, options);
        return true;
    }
    catch (e) {
        console.info(e);
        return false;
    }
}

async function handleRemoveDir(evt, Path, options) {
    try {
        await fs.rmdir(Path, options);
        return true;
    }
    catch {
        return false;
    }
}

async function handleReadFile(evt, Path, options) {
    try {
        return await fs.readFile(Path, options);
    }
    catch {
        return null;
    }
}

async function handleWriteFile(evt, Path, Data, options) {
    try {
        await fs.writeFile(Path, Data, options);
        return true;
    }
    catch {
        return false;
    }
}

async function handleRemoveFile(evt, Path, options) {
    try {
        await fs.rm(Path, options);
        return true;
    }
    catch {
        return false;
    }
}

async function handleRenameFile(evt, OldPath, NewPath) {
    try {
        await fs.rename(OldPath, NewPath);
        return true;
    }
    catch {
        return false;
    }
}

async function handleFileState(evt, Path, options) {
    try {
        let stat = await fs.lstat(Path, options);
        stat.IsDirectory = stat.isDirectory();
        return stat;
    }
    catch {
        return null;
    }
}

function createWindow() {
    // Create the browser window.

    

    mainWindow = new BrowserWindow({
        devTools: true,
        width: 1440,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.webContents.on('will-prevent-unload', (event) => {
        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['是', '否'],
            title: '提示',
            message: '还有数据未保存，是否丢弃并关闭？',
            defaultId: 0,
            cancelId: 1,
        });
        if (choice === 0) {
            event.preventDefault(); // 忽略 beforeunload 事件
        }
    });


    ipcMain.handle('dialog:openFile', handleFileOpen);
    ipcMain.handle('dialog:saveFile', handleFileSave);
    ipcMain.handle('fs:readDir', handleReadDir);
    ipcMain.handle('fs:makeDir', handleMakeDir);
    ipcMain.handle('fs:removeDir', handleRemoveDir);
    ipcMain.handle('fs:readFile', handleReadFile);
    ipcMain.handle('fs:writeFile', handleWriteFile);
    ipcMain.handle('fs:removeFile', handleRemoveFile);
    ipcMain.handle('fs:renameFile', handleRenameFile);
    ipcMain.handle('fs:fileState', handleFileState);

    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: "菜单",
            submenu: [
                {
                    label: "重新加载",
                    role: "forcereload",
                    accelerator: ""
                },
                {
                    type: "separator"
                    
                },
                {
                    label: "开发者工具",
                    role: "toggledevtools",
                    accelerator: "F12"
                }
            ]
        }
    ]));
    // and load the index.html of the app.
    //mainWindow.maximize();
    mainWindow.loadFile('release/web/index.html')
    //mainWindow.webContents.openDevTools();
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
