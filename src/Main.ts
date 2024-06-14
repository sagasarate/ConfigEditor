const { regClass, property } = Laya;
import { LogListItem, MainUI } from "./UI/MainUI"
import { ListView, ListViewHeaderItem, ListViewItem } from "./UI/Components/ListView"
import { PropertyGrid, PropertyGridItem } from "./UI/Components/PropertyGrid"
import { DataManager } from "./DataManager"
import { ConfirmListItem } from "./UI/Dialogs/DlgConfirmWithList"
import { WinSplitter } from "./UI/Components/WinSplitter";
import { FlowChart, FlowChartNode } from "./UI/Components/FlowChart";
import { SystemConfig } from "./SystemConfig";
import { BoolInputer } from "./UI/Inputer/BoolInputer";
import { EnumInputer } from "./UI/Inputer/EnumInputer";
import { ValueInputer } from "./UI/Inputer/ValueInputer";
import { TextInputer } from "./UI/Inputer/TextInputer";
import { ColorInputer } from "./UI/Inputer/ColorInputer";
import { ColorListItem } from "./UI/PopupPanel/ColorSelectorPanel";



@regClass()
export default class Main extends Laya.Script {

    onStart() {
        //设置Laya提供的worker.js路径
        //Laya.WorkerLoader.workerPath = "libs/worker.js";
        //开启worker线程
        Laya.WorkerLoader.enable = true;

        //Laya.Stat.show(0, 0)

        SystemConfig.Instance.LoadConfig();
        this.InitUI();
        window.addEventListener("beforeunload", this.OnClose.bind(this));
    }
    OnClose(ev: BeforeUnloadEvent) {
        SystemConfig.Instance.SaveConfig();
        if (DataManager.Instance.IsModified())
            ev.returnValue = "还有数据改动未保存，真的要关闭此窗口吗?";
    }   

    InitUI() {
        Laya.stage.addChild(fgui.GRoot.inst.displayObject);
        fgui.UIConfig.popupMenu = "ui://MainUI/PopupMenu";
        fgui.UIConfig.popupMenu_seperator = "ui://MainUI/PopupMenuSeperator";
        fgui.UIConfig.modalLayerColor = "rgba(0,0,0,0.5)";
        fgui.UIConfig.globalModalWaiting = "ui://MainUI/DlgWaiting";
        fgui.UIConfig.defaultScrollBounceEffect = false;
        fgui.UIConfig.defaultFont = "SimSun";//'Microsoft YaHei';
        fgui.UIConfig.bringWindowToFrontOnClick = false;
        fgui.UIConfig.tooltipsWin = "ui://MainUI/ToolTips"

        fgui.UIPackage.loadPackage("resources/MainUI", Laya.Handler.create(this, this.onUIPacckageLoaded));
        window.addEventListener("beforeunload", this.OnClose.bind(this));
    }
   
    onUIPacckageLoaded(err, assets) {
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "CheckBox"), BoolInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ComboBox"), EnumInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ValueInputer"), ValueInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ValueInputerLight"), ValueInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ValueInputerNoBorder"), ValueInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "TextInputer"), TextInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ColorInputer"), ColorInputer);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ColorListItem"), ColorListItem);

        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ListView"), ListView);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ListViewHeaderItem"), ListViewHeaderItem);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ListViewItem"), ListViewItem);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "PropertyGridItem"), PropertyGridItem);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "PropertyGrid"), PropertyGrid);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "ConfirmListItem"), ConfirmListItem);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "WinSplitter"), WinSplitter);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "FlowChartNode"), FlowChartNode);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "FlowChart"), FlowChart);
        fgui.UIObjectFactory.setExtension(fgui.UIPackage.getItemURL("MainUI", "LogListItem"), LogListItem);


        //electronAPI.OpenFile({ properties: ['openDirectory'] }).then((Files) => {
        //    if (Files) {
        //        electronAPI.ReadDir(Files[0], { recursive: true}).then((Info) => { console.info(Info); });
        //    }
                
        //});
        //console.info(dialog);
        //dialog.showOpenDialog({
        //    properties: ['openFile', 'openDirectory']
        //}).then((Value) => { console.info(Value) });

        MainUI.Instance.show();        

    }
}

