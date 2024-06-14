import { BaseUI } from "../BaseUI"

export class DlgDebugState extends BaseUI {

    public constructor() {
        super();
    }

    protected static m_Instance: DlgDebugState;
    public static get Instance(): DlgDebugState {
        if (!DlgDebugState.m_Instance) {
            DlgDebugState.m_Instance = new DlgDebugState();
        }

        return DlgDebugState.m_Instance;
    }

    
    protected m_btnExpand: fgui.GButton;
    protected m_gpDrag: fgui.GGraph;

    protected onInit(): void {
        super.onInit();
        this.contentPane = fgui.UIPackage.createObject("MainUI", "DlgDebugState").asCom;
        this.x = 0;
        this.y = 24;

        this.name = "DlgDebugState";
        this.m_btnExpand = this.GetComponent<fgui.GButton>("btnExpand");
        this.m_gpDrag = this.GetComponent<fgui.GGraph>("gpDrag");

        this.m_btnExpand.onClick(this, this.OnExpand);

        this.m_gpDrag.draggable = true;
        this.m_gpDrag.on(fgui.Events.DRAG_START, this, this.OnDragStart);
        this.on(fgui.Events.XY_CHANGED, this, this.OnExpand);        
    }
   
    protected OnExpand(): void {
        if (this.m_btnExpand.selected) {
            Laya.Stat.show(this.x, this.y + this.height);
        }
        else {
            Laya.Stat.hide();
        }
    }

    protected OnDragStart(evt: Laya.Event) {
        let Obj = fgui.GObject.cast(evt.currentTarget);
        Obj.stopDrag();
        this.startDrag();
    }

    public show(): void {
        super.show();
        this.OnExpand();
    }
    protected onHide(): void {
        Laya.Stat.hide();
    }
};