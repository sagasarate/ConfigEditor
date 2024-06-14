
enum ColSortType {
    None,
    Ascend,
    Descend
}

export class ListViewHeaderItem extends fgui.GButton {
    public SortType = ColSortType.None;
    public SortFn: (Item1: { Data: string, ParentObj: any, RowData: any }, Item2: { Data: string, ParentObj: any, RowData: any }) => number;
}

export class ListViewItem extends fgui.GButton {

}

export class ListViewItemInfo {
    public Data = "";
    public ParentObj: object = null;
    public CanEdit = false;

    public get text(): string {
        if (this.ParentObj) {
            return this.ParentObj[this.Data].toString();
        }
        else {
            return this.Data;
        }
    }
}
export class ListViewRowInfo {
    protected m_Items = new Array<ListViewItemInfo>();
    public Data: any;
    public SelectMark: fgui.GComponent;

    public get ColCount(): number {
        return this.m_Items.length;
    }
    public set ColCount(Value: number) {
        this.m_Items.length = Value;
    }
    public GetItem(Col: number) {
        if (Col < this.m_Items.length) {
            let Info = this.m_Items[Col];
            if (!Info) {
                Info = new ListViewItemInfo;
                this.m_Items[Col] = Info;
            }
            return Info;
        }
        return null;
    }
    public RemoveCol(Col: number): boolean {
        if (Col < this.m_Items.length) {
            this.m_Items.splice(Col, 1);
            return true;
        }
        return false;
    }
}

export class ListView extends fgui.GComponent {
    protected m_lvHeader: fgui.GList;
    protected m_lvItems: fgui.GList;
    protected m_SelectMarkPool = new Array<fgui.GComponent>();

    public SelectionMode = fgui.ListSelectionMode.Multiple;

    protected m_Rows = new Array<ListViewRowInfo>();
    protected m_SelectedRow = -1;
    protected m_LastSelectRow = -1;
    protected m_Redraw = true;


    public static EVENT_CLICK_ITEM = "ListView_ClickItem";
    public static EVENT_RIGHT_CLICK_ITEM = "ListView_RightClickItem";

    public get Redraw(): boolean {
        return this.m_Redraw;
    }

    public set Redraw(value: boolean) {
        this.m_Redraw = value;
        if (this.m_Redraw) {
            let ItemCount = this.m_Rows.length * this.m_lvHeader.numChildren;
            if (this.m_lvItems.numItems != ItemCount)
                this.m_lvItems.numItems = ItemCount;
            else
                this.m_lvItems.refreshVirtualList();
        }
            
    }

    public EnableSortOnClickHeader(Col: number, Enable: boolean, This?: any, SortFn?: (Item1: { Data: string, ParentObj: any, RowData: any }, Item2: { Data: string, ParentObj: any, RowData: any }) => number) {
        if (Col >= 0 && Col < this.m_lvHeader.numChildren) {
            let Header = this.m_lvHeader.getChildAt(Col) as ListViewHeaderItem;
            if (Enable) {
                if (Header.SortType == ColSortType.None)
                    Header.SortType = ColSortType.Ascend;
                if (SortFn)
                    Header.SortFn = SortFn.bind(This);
            }
            else {
                if (Header.SortType != ColSortType.None)
                    Header.SortType = ColSortType.None;
            }
        }
    }    

    protected onConstruct(): void {
        this.m_lvHeader = this.getChild("lvHeader");
        this.m_lvItems = this.getChild("lvItems");
        let SelectMark = this.getChild("SelectMark") as fgui.GComponent;
        this.removeChild(SelectMark);
        this.m_SelectMarkPool.push(SelectMark);

        this.m_lvItems.setVirtual();
        this.m_lvItems.itemRenderer = this.RowRender.bind(this);
        this.m_lvHeader.on(fgui.Events.SCROLL, this, this.OnScroll);
        this.m_lvHeader.on(fgui.Events.CLICK_ITEM, this, this.OnClickHeader);
        this.m_lvItems.on(fgui.Events.SCROLL, this, this.OnScroll);
        this.m_lvItems.on(fgui.Events.CLICK_ITEM, this, this.OnClickItem);
        this.m_lvItems.on(fgui.Events.RIGHT_CLICK_ITEM, this, this.OnRightClickItem);
        this.m_lvItems.on(fgui.Events.FINISH_RENDER, this, this.UpdateSelection);        
    }
    protected OnScroll(Evt: Laya.Event) {
        let Obj = fgui.GObject.cast(Evt.target);
        if (Obj instanceof fgui.GComponent) {
            let Pos = Obj.scrollPane.posX;
            this.SyncScroll(Pos);
        }        
    }
    protected SyncScroll(Pos: number) {
        this.m_lvHeader.scrollPane.posX = Pos;
        this.m_lvItems.scrollPane.posX = Pos;
    }
    protected OnClickItem(Obj: ListViewItem, evt: Laya.Event) {
        let Index = this.m_lvItems.getChildIndex(Obj);
        if (Index >= 0)
            Index = this.m_lvItems.childIndexToItemIndex(Index);
        if (Index >= 0) {
            Index = Math.floor(Index / this.m_lvHeader.numChildren);
            let Col = Index % this.m_lvHeader.numChildren;
            this.DoClickSelection(Index, evt);
            this.displayObject.event(ListView.EVENT_CLICK_ITEM, [Index, Col]);
        }        
    }
    protected OnRightClickItem(Obj: ListViewItem, evt: Laya.Event) {
        let Index = this.m_lvItems.getChildIndex(Obj);
        if (Index >= 0)
            Index = this.m_lvItems.childIndexToItemIndex(Index);
        if (Index >= 0) {
            Index = Math.floor(Index / this.m_lvHeader.numChildren);
            let Col = Index % this.m_lvHeader.numChildren;
            this.displayObject.event(ListView.EVENT_RIGHT_CLICK_ITEM, [Index, Col]);
        }
    }

    protected OnClickHeader(Obj: ListViewHeaderItem) {
        switch (Obj.SortType) {
            case ColSortType.None:
                Obj.SortType = ColSortType.Ascend;
                break;
            case ColSortType.Ascend:
                Obj.SortType = ColSortType.Descend;
                break;
            case ColSortType.Descend:
                Obj.SortType = ColSortType.Ascend;
                break;
        }
        this.SortColumn(this.m_lvHeader.getChildIndex(Obj));
    }

    public get ColCount(): number {
        return this.m_lvHeader.numChildren;
    }
    public get RowCount(): number {
        return this.m_Rows.length;
    }
    public AddColumn(Text: string, Width?: number): void {
        let Item = this.m_lvHeader.addItemFromPool();
        Item.text = Text;
        if (Width)
            Item.width = Width;
        let ColCount = this.m_lvHeader.numChildren;
        for (let Row of this.m_Rows) {
            Row.ColCount = ColCount;
        }
        this.m_lvItems.columnCount = ColCount;
        if (this.m_Redraw)
            this.m_Rows.length * this.m_lvHeader.numChildren;
    }
    public RemoveColumn(Col: number): boolean {
        if (Col < this.m_lvHeader.numChildren) {
            this.m_lvHeader.removeChildAt(Col);
            for (let Row of this.m_Rows) {
                Row.RemoveCol(Col);
            }
            this.m_lvItems.columnCount = this.m_lvHeader.numChildren;
            if (this.m_Redraw)
                this.m_Rows.length * this.m_lvHeader.numChildren;
            return true;
        }
        return false;
    }
    public GetColumn(Col: number): fgui.GComponent {
        if (Col < this.m_lvHeader.numChildren) {
            return this.m_lvHeader.getChildAt(Col) as fgui.GComponent;
        }
        return null;
    }    
    public DeleteAllColumn() {
        this.DeleteAllItems();
        this.m_lvHeader.removeChildrenToPool();
        this.m_lvHeader.scrollPane.posX = 0;
    }
    public InsertRow(Index?: number, Data?: any): number {
        let Item = new ListViewRowInfo();
        Item.Data = Data;
        Item.ColCount = this.m_lvHeader.numChildren;
        
        if (Index && Index < this.m_Rows.length) {
            this.m_Rows.splice(Index, 0, Item);
        }
        else {
            Index = this.m_Rows.length;
            this.m_Rows.push(Item);
        }
        if (this.m_Redraw)
            this.m_lvItems.numItems = this.m_Rows.length * this.m_lvHeader.numChildren;
        return Index;

    }
    
    public SetItem(Row: number, Col: number, Data: string, ParentObj = null, CanEdit = false): boolean {
        if (Row < this.m_Rows.length) {
            let RowInfo = this.m_Rows[Row];
            let ItemInfo = RowInfo.GetItem(Col)
            if (ItemInfo) {
                ItemInfo.Data = Data;
                ItemInfo.ParentObj = ParentObj;
                ItemInfo.CanEdit = CanEdit;
                if (this.m_Redraw)
                    this.m_lvItems.refreshVirtualList();
                return true;
            }
        }
        return false;
    }
    public GetItem(Row: number, Col: number): ListViewItemInfo {
        if (Row < this.m_Rows.length) {
            let RowInfo = this.m_Rows[Row];
            return RowInfo.GetItem(Col);
        }
        return null;
    }
    public SetRowData(Row: number, data: any): boolean {
        if (Row < this.m_Rows.length) {
            this.m_Rows[Row].Data = data;
            return true;
        }
        return false;
    }
    public GetRowData(Row: number): any {
        if (Row < this.m_Rows.length) {
            return this.m_Rows[Row].Data;
        }
        return null;
    }

    public get selectedIndex(): number {
        return this.m_SelectedRow;
    }

    public set selectedIndex(Index: number) {
        if (Index != this.m_SelectedRow) {
            this.ClearSelections();
            if (this.AddSelection(Index))
                this.m_SelectedRow = Index;
        }
    }

    public DeleteAllItems(): void {
        this.selectedIndex = -1;
        for (let Row of this.m_Rows) {
            if (Row.SelectMark)
                this.RemoveSelectMark(Row.SelectMark);
        }
        this.m_Rows.length = 0;
        this.m_lvItems.numItems = 0;
        this.m_lvItems.scrollPane.posX = 0;
        this.m_lvItems.scrollPane.posY = 0;
    }
    public DeleteItem(Index: number): boolean {
        if (Index < this.m_Rows.length) {
            let Row = this.m_Rows[Index];
            if (Row.SelectMark)
                this.RemoveSelectMark(Row.SelectMark);
            this.m_Rows.splice(Index, 1);
            if (this.m_Redraw)
                this.m_Rows.length * this.m_lvHeader.numChildren;
        }
        return false;
    }
    protected GetTextSize(Item: fgui.GComponent,Text?:string): number {
        let Size = 0;
        let TextField = Item.getChild("title") as fgui.GTextField;
        if (TextField) {
            let Save = TextField.autoSize;
            let SaveWidth = TextField.width;
            if (Text) {
                let SaveText = TextField.text;
                TextField.text = Text;
                TextField.autoSize = fgui.AutoSizeType.Both;
                Size = Math.round(TextField.width);
                TextField.text = SaveText;
            }
            else {
                TextField.autoSize = fgui.AutoSizeType.Both;
                Size = Math.round(TextField.width);
            }
            TextField.autoSize = Save;
            TextField.width = SaveWidth;
        }
        return Size;
    }
    public ColumnSizeAutoFit(Col: number): boolean {
        let ColText = "";
        if (Col < this.m_lvHeader.numChildren) {
            let ColObj = this.m_lvHeader.getChildAt(Col) as fgui.GComponent;
            let Size = this.GetTextSize(ColObj);
            if (ColObj.text.length > ColText.length)
                ColText = ColObj.text;
            for (let Row of this.m_Rows) {
                let ColInfo = Row.GetItem(Col);
                if (ColInfo) {
                    let ItemText = ColInfo.text;
                    if (ItemText.length > ColText.length)
                        ColText = ItemText;
                }
            }            
            ColObj.width = this.GetTextSize(ColObj, ColText) + 10;            
            if (Col < this.m_lvItems.numChildren) {
                let Item = this.m_lvItems.getChildAt(Col) as ListViewItem;
                Item.width = ColObj.width;
            }                
            if (this.m_Redraw)
                this.m_lvItems.refreshVirtualList();
        }
        return false;
    }
    public AllColumnSizeAutoFit(): void {
        this.Redraw = false;
        for (let i = 0; i < this.m_lvHeader.numChildren; i++) {
            this.ColumnSizeAutoFit(i);
        }
        this.Redraw = true;
    }

    protected RowRender(Index: number, Item: ListViewItem) {
        let ColCount = this.m_lvHeader.numChildren;
        let Row = Math.floor(Index / ColCount);
        let Col = Index % ColCount;
        if (Row < this.m_Rows.length) {
            let RowInfo = this.m_Rows[Row];
            let ColInfo = RowInfo.GetItem(Col);
            if (ColInfo) {
                Item.text = ColInfo.text;
            }
            let Header = this.m_lvHeader.getChildAt(Col);
            if (Header && Item.width != Header.width) {
                Item.width = Header.width;
                this.m_lvItems.refreshVirtualList();
            }                
        }
    }
    protected AllocSelectMark(): fgui.GComponent {
        if (this.m_SelectMarkPool.length == 1) {
            let Mark = this.m_SelectMarkPool[0];
            if (Mark.packageItem) {
                Mark = Mark.packageItem.owner.internalCreateObject(Mark.packageItem) as fgui.GComponent;
                this.m_SelectMarkPool.push(Mark);
            }
        }
        if (this.m_SelectMarkPool.length > 1) {
            let Index = this.m_SelectMarkPool.length - 1;
            let Mark = this.m_SelectMarkPool[Index];
            this.m_SelectMarkPool.splice(Index, 1);
            return Mark;
        }
        return null;
    }
    protected RemoveSelectMark(Mark: fgui.GComponent):boolean {
        Mark.removeFromParent();
        this.m_SelectMarkPool.push(Mark);
        return true;
    }
    public ClearSelections(FullClear = true) {
        for (let Row of this.m_Rows) {
            if (Row.SelectMark) {
                this.RemoveSelectMark(Row.SelectMark);
                Row.SelectMark = null;
            }
        }
        this.m_SelectedRow = -1;
        if (FullClear)
            this.m_LastSelectRow = -1;
    }
    public AddSelection(Index: number): boolean {
        if (Index >= 0 && Index < this.m_Rows.length) {
            let Row = this.m_Rows[Index];
            if (!Row.SelectMark) {
                Row.SelectMark = this.AllocSelectMark();
                if (Row.SelectMark) {
                    let ColCount = this.m_lvHeader.numChildren;
                    Index = this.m_lvItems.itemIndexToChildIndex(Index * ColCount);
                    if (Index >= 0) {
                        let Obj = this.m_lvItems.getChildAt(Index) as fgui.GComponent;
                        if (Obj) {
                            Obj.addChildAt(Row.SelectMark, 0);
                            Row.SelectMark.setXY(0, 0);
                            let Width = Obj.width;
                            let Height = Obj.height;
                            for (let i = 1; i < ColCount; i++) {
                                Obj = this.m_lvItems.getChildAt(Index + i);
                                if (Obj)
                                    Width += Obj.width;
                            }
                            Row.SelectMark.setSize(Width, Height);
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }    
    public RemoveSelection(Index: number): boolean {
        if (Index < this.m_Rows.length) {
            let Row = this.m_Rows[Index];
            if (Row.SelectMark) {
                this.RemoveSelectMark(Row.SelectMark);
                Row.SelectMark = null;
            }                
        }
        return false;
    }
    public GetSelection(StartIndex = 0): number {
        for (let i = StartIndex; i < this.m_Rows.length; i++) {
            if (this.m_Rows[i].SelectMark)
                return i;
        }
        return -1;
    }
    protected UpdateSelection() {
        let ColCount = this.m_lvHeader.numChildren;
        for (let i = 0; i < this.m_Rows.length; i++) {
            let Row = this.m_Rows[i];
            if (Row.SelectMark) {
                let Index = this.m_lvItems.itemIndexToChildIndex(i * ColCount);
                if (Index >= 0) {
                    let Obj = this.m_lvItems.getChildAt(Index) as fgui.GComponent;
                    if (Obj) {
                        Obj.addChildAt(Row.SelectMark, 0);
                        Row.SelectMark.setXY(0, 0);
                        let Width = Obj.width;
                        let Height = Obj.height;
                        for (let i = 1; i < ColCount; i++) {
                            Obj = this.m_lvItems.getChildAt(Index + i);
                            if (Obj)
                                Width += Obj.width;
                        }
                        Row.SelectMark.setSize(Width, Height);
                    }
                    else {
                        Row.SelectMark.removeFromParent();
                    }
                }
            }
        }
    }
    protected DoClickSelection(Index: number, evt: Laya.Event) {
        if (Index >= this.m_Rows.length)
            return;
        switch (this.SelectionMode) {
            case fgui.ListSelectionMode.Single:
                this.ClearSelections();
                if (this.AddSelection(Index))
                    this.m_SelectedRow = Index;
                break;
            case fgui.ListSelectionMode.Multiple:
                if (evt.shiftKey) {
                    if (this.m_LastSelectRow < 0) {
                        this.AddSelection(Index);
                        this.m_LastSelectRow = Index;
                    }
                    else if (Index > this.m_LastSelectRow) {
                        this.ClearSelections(false);
                        for (let i = Index; i >= this.m_LastSelectRow; i--) {
                            this.AddSelection(i);
                        }
                    }
                    else {
                        this.ClearSelections(false);
                        for (let i = Index; i <= this.m_LastSelectRow; i++) {
                            this.AddSelection(i);
                        }
                    }
                }
                else if (evt.ctrlKey) {
                    if (this.m_Rows[Index].SelectMark) {
                        this.RemoveSelection(Index);
                        this.m_LastSelectRow = Index;
                    }
                    else {
                        this.AddSelection(Index);
                        this.m_LastSelectRow = Index;
                    }
                    this.m_SelectedRow = this.GetSelection(0);
                }
                else {
                    this.ClearSelections();
                    if (this.AddSelection(Index)) {
                        this.m_SelectedRow = Index;
                        this.m_LastSelectRow = Index;
                    }                        
                }
                break;
            case fgui.ListSelectionMode.Multiple_SingleClick:
                if (this.m_Rows[Index].SelectMark)
                    this.RemoveSelection(Index);
                else
                    this.AddSelection(Index);
                this.m_SelectedRow = this.GetSelection(0);
                break;
        }
    }

    public scrollToView(Row: number, Col: number) {
        if (Row < this.m_Rows.length) {
            let Index = Row * this.ColCount + Col;
            if (Index < this.m_lvItems.numItems)
                this.m_lvItems.scrollToView(Index);
        }
    }

    public SortColumn(Col: number, This?: any, SortFn?: (Item1: { Data: string, ParentObj: any, RowData: any }, Item2: { Data: string, ParentObj: any, RowData: any }) => number):boolean {
        if (Col >= 0 && Col < this.m_lvHeader.numChildren) {
            let Header = this.m_lvHeader.getChildAt(Col) as ListViewHeaderItem;
            if (Header.SortType == ColSortType.None)
                return;
            this.m_Rows.sort((Row1, Row2) => {
                let Item1 = Row1.GetItem(Col);
                let Item2 = Row2.GetItem(Col);
                let SortResult = 0;
                if (SortFn) {
                    SortResult = SortFn.apply(This, [{ Data: Item1.Data, ParentObj: Item1.ParentObj, RowData: Row1.Data }, { Data: Item2.Data, ParentObj: Item2.ParentObj, RowData: Row2.Data }]);
                }
                else if (Header.SortFn) {
                    SortResult = Header.SortFn({ Data: Item1.Data, ParentObj: Item1.ParentObj, RowData: Row1.Data }, { Data: Item2.Data, ParentObj: Item2.ParentObj, RowData: Row2.Data });
                }
                else {
                    SortResult = Item1.text.localeCompare(Item2.text);
                }
                if (Header.SortType == ColSortType.Ascend)
                    return SortResult;
                else
                    return -SortResult;
            });
            if (this, this.Redraw)
                this.m_lvItems.refreshVirtualList();
        }
        return false;
    }
};