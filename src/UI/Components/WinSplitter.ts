

export class WinSplitter extends fgui.GComponent {
    protected onConstruct(): void {
        this.draggable = true;
        this.on(fgui.Events.DRAG_START, this, this.OnDragStart);
        this.on(Laya.Event.DISPLAY, this, this.OnDisplay);
    }
    protected OnDisplay() {
        this.offAll(Laya.Event.MOUSE_OVER);
        this.offAll(Laya.Event.MOUSE_OUT);
        this.on(Laya.Event.MOUSE_OVER, this, (e: Laya.Event) => {
            if (this.data == "horizontal")
                Laya.Mouse.cursor = "e-resize";
            else
                Laya.Mouse.cursor = "n-resize";
        })
        this.on(Laya.Event.MOUSE_OUT, this, (e: Laya.Event) => {
            Laya.Mouse.cursor = "default"
        })
    }
    protected OnDragStart() {
        if (this.data == "horizontal") {
            let Bound = this.parent.localToGlobal(0, this.y);
            this.dragBounds = new Laya.Rectangle(Bound.x, Bound.y, this.parent.width, 0);
        }
        else {
            let Bound = this.parent.localToGlobal(this.x, 0);            
            this.dragBounds = new Laya.Rectangle(Bound.x, Bound.y, 0, this.parent.height);
        }
    }
}