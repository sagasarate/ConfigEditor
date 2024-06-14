
export enum UI_COLOR {
    WHITE = "#FFFFFF",
    BLACK = "#000000",    
    TRANSPARENT = "rgba(0,0,0,0)",
    GRAY = "#808080",
    RED = "#FF0000",
    GREEN = "#00FF00",
    BLUE = "#0000FF",
    YELLOW = "#FFEB04",
    ORANGE = "#FF7F00",
    CYAN = "#00FFFF",
    MAGENTA = "#FF00FF",
};

export class BaseUI extends fgui.Window {
    public constructor() {
        super();
    }
    protected onInit(): void {
        
        //this.on(Input.EventType.KEY_DOWN, this.OnWndKeyUp, this);
        //this.on(Input.EventType.KEY_UP, this.OnWndKeyDown, this);
        // this.on(fgui.Event.MOUSE_WHEEL, this.OnWndMouseWheel, this);
        // this.on(fgui.Event.TOUCH_BEGIN, this.OnWndTouchBegin, this);
        // this.on(fgui.Event.TOUCH_MOVE, this.OnWndTouchMove, this);
        // this.on(fgui.Event.TOUCH_END, this.OnWndTouchEnd, this);
        // this.on(fgui.Event.CLICK, this.OnWndClick, this);
    }
    protected initDragArea() {
        const dragArea:fgui.GComponent = this.GetComponent<fgui.GComponent>("dragArea");
        dragArea.draggable = true;
        // dragArea.on(fgui.Event.DRAG_START, this.onDragStart, this);
        dragArea.on(fgui.Events.DRAG_START, this, (evt: Laya.Event) => {
            let obj: fgui.GObject = fgui.GObject.cast(evt.currentTarget);
            obj.stopDrag();
            this.startDrag();
        });
        dragArea.on(fgui.Events.DROP, this, () => { });
    }
    // onDragStart(evt:fgui.Event)
    // {
    //     let obj:fgui.GObject = fgui.GObject.cast(evt.currentTarget);
    //     obj.stopDrag(); 
    //     this.startDrag();
    // }
    //组织冒泡，防止点击穿透等
    //protected OnWndKeyUp(ent: EventKeyboard): void {
    //    console.info("OnKey"); 
    //    ent.propagationStopped = true;
    //}
    //protected OnWndKeyDown(ent: EventKeyboard): void {
    //    ent.propagationStopped = true;
    //}
    protected OnWndMouseWheel(ent: Laya.Event): void {
        ent.stopPropagation();
    }
    protected OnWndTouchBegin(ent: Laya.Event): void {
        ent.stopPropagation();
    }
    protected OnWndTouchMove(ent: Laya.Event): void {
        ent.stopPropagation();
    }
    protected OnWndTouchEnd(ent: Laya.Event): void {
        ent.stopPropagation();
    }
    protected OnWndClick(ent: Laya.Event): void {
        ent.stopPropagation();
    }

    protected GetComponent<T extends fgui.GObject>(ComponentName: string): T {
        let Child = this.contentPane.getChild(ComponentName);
        if (!Child)
            console.error(`${ComponentName} not found`);
        return Child as T;
    }

    protected RegisterOnClick(ComponentName: string, target: any, callback: (evt?: Event) => void): boolean {
        let Child = this.GetComponent<fgui.GComponent>(ComponentName);
        if (Child instanceof fgui.GComponent) {
            Child.onClick(target, callback);
            return true;
        }
        else {
            console.error(`${ComponentName} can not be click`);
        }
        return false;
    }
    public static GetWindows(Name: string): fgui.Window {
        return fgui.GRoot.inst.getChild(Name) as fgui.Window;
    }
    public static GetVisibleWindows(Name: string): fgui.Window {
        let Wnd = this.GetWindows(Name);
        if (Wnd != null && Wnd.visible)
            return Wnd;
        return null;
    }
}