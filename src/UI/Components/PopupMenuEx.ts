

export class PopupMenuEx extends fgui.PopupMenu {
    public AdjustSize(AddWidth?: number) {
        let MaxSize = 0;
        for (let i = 0; i < this._list.numChildren; i++) {
            let Item = this._list.getChildAt(i) as fgui.GButton;
            let title = Item.getChild("title") as fgui.GTextField;
            if (title) {
                if (MaxSize < title.textWidth)
                    MaxSize = title.textWidth;
            }
        }
        this.contentPane.width = MaxSize + (AddWidth ?? 50);
    }
    public show(target?: fgui.GObject, dir?: fgui.PopupDirection | boolean) {
        super.show(target, dir);
        this._list.selectedIndex = -1;
        for (let i = 0; i < this._list.numChildren; i++) {
            let Item = this._list.getChildAt(i) as fgui.GButton;
            if (Item instanceof fgui.GButton)
                Item.setState(fgui.GButton.UP);
        }
    }
    public AddMenu(Name: string, target?: any, ClickCallback?: Function): fgui.GButton {
        let Item: fgui.GButton;
        if (ClickCallback)
            Item = this.addItem(Name, ClickCallback.bind(target));
        else
            Item = this.addItem(Name);        
        return Item;
    }
    public GetMenuItem(Name: string): fgui.GButton {
        for (let i = 0; i < this._list.numChildren; i++) {
            let Item = this._list.getChildAt(i) as fgui.GButton;
            if (Item.text == Name)
                return Item;
        }
        return null;
    }
    public EnableMenu(Name: string, Enable: boolean) {
        for (let i = 0; i < this._list.numChildren; i++) {
            let Item = this._list.getChildAt(i) as fgui.GButton;
            if (Item.text == Name) {
                Item.enabled = Enable;
                if (!Enable)
                    Item.setState(fgui.GButton.DISABLED);
                break;
            }                
        }
    }
}