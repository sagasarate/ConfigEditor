import { DataManager} from "../../DataManager";
import { UI_COLOR } from "../BaseUI";

export enum FLOW_CHART_ARRANGE_TYPE{
    HORIZONTAL,//水平排列
    VERTICAL//垂直排列
}
export class FlowChartNode extends fgui.GButton{
    protected m_BG: fgui.GGraph;
    protected m_Drager: fgui.GGraph;    
    protected m_DropPoint: fgui.GGraph;
    protected m_txFlow: fgui.GTextField;
    protected m_txContent: fgui.GTextField;

    protected m_DownLine: fgui.GGraph;
    protected m_MidLine: fgui.GGraph;
    protected m_UpLine: fgui.GGraph;
    public Owner: FlowChart;
    public ID = 0;
    public ChildIDs = new Array<number>();
    public ParentNode: FlowChartNode;
    public ChildNodes = new Array<FlowChartNode>();
    

    protected onConstruct(): void {
        this.m_BG = this.getChild("bg") as fgui.GGraph;
        this.m_Drager = this.getChild("Dragger") as fgui.GGraph;
        this.m_Drager.draggable = true;
        this.m_Drager.on(fgui.Events.DRAG_START, this, this.OnDragStart);
        this.m_DropPoint = this.getChild("DropPoint") as fgui.GGraph;
        this.m_DropPoint.draggable = true;
        this.m_DropPoint.on(fgui.Events.DRAG_START, this, this.OnDropStart);
        this.m_txFlow = this.getChild("txFlow") as fgui.GTextField;
        this.m_txContent = this.getChild("txContent") as fgui.GTextField;
    }
    protected OnDragStart(evt: Laya.Event) {
        let Obj = fgui.GObject.cast(evt.currentTarget);
        Obj.stopDrag();
        this.startDrag();
    }
    protected OnDropStart(evt: Laya.Event) {
        let Obj = fgui.GObject.cast(evt.currentTarget);
        Obj.stopDrag();
        let url = fgui.UIPackage.getItemURL("MainUI", "DropPoint");
        fgui.DragDropManager.inst.startDrag(this, url, this);

    }
    public get color(): string {
        return this.m_BG.color;
    }
    public set color(value: string) {
        this.m_BG.color = value;
    }
    public get Drager(): fgui.GGraph {
        return this.m_Drager;
    }
    public get FlowText(): string {
        return this.m_txFlow.text;
    }
    public set FlowText(value: string) {
        this.m_txFlow.text = value;
    }
    public get Content(): string {
        return this.m_txContent.text;
    }
    public set Content(value: string) {
        this.m_txContent.text = value;
    }
    public BuildLines() {
        let LineWidth = 1;
        if (this.ChildNodes.length > 1) {
            if (!this.m_DownLine) {
                this.m_DownLine = new fgui.GGraph();
                this.addChild(this.m_DownLine);
            }
            if (!this.m_MidLine) {
                this.m_MidLine = new fgui.GGraph();
                this.addChild(this.m_MidLine);
            }
            let FirstChild = this.ChildNodes[0];
            let LastChild = this.ChildNodes[this.ChildNodes.length - 1];

            let FromPos = new Laya.Point();
            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                FromPos.x = Math.round(this.x + this.width / 2);
                FromPos.y = this.y + this.height;
            }
            else {
                FromPos.x = this.x + this.width;
                FromPos.y = Math.round(this.y + this.height/2);
            }
            let MidPos1 = new Laya.Point();
            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                MidPos1.x = Math.round(FirstChild.x + FirstChild.width / 2);
                MidPos1.y = Math.round((FirstChild.y + LastChild.y) / 2);
            }
            else {
                MidPos1.x = Math.round((FirstChild.x + LastChild.x) / 2);
                MidPos1.y = Math.round(FirstChild.y + FirstChild.height / 2);
            }            
            let MidPos2 = new Laya.Point();
            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                MidPos2.x = Math.round(LastChild.x + LastChild.width / 2);
                MidPos2.y = Math.round((FirstChild.y + LastChild.y) / 2);
            }
            else {
                MidPos2.x = Math.round((FirstChild.x + LastChild.x) / 2);
                MidPos2.y = Math.round(LastChild.y + LastChild.height / 2);
            }            
            //转换坐标空间
            FromPos = this.parent.localToGlobal(FromPos.x, FromPos.y);
            MidPos1 = this.parent.localToGlobal(MidPos1.x, MidPos1.y);
            MidPos2 = this.parent.localToGlobal(MidPos2.x, MidPos2.y);

            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                this.MakeLine(this.m_DownLine, FromPos.x, FromPos.y, FromPos.x, (FromPos.y + MidPos1.y) / 2, LineWidth, this);
                this.MakeLine(this.m_MidLine, MidPos1.x, (FromPos.y + MidPos1.y) / 2, MidPos2.x, (FromPos.y + MidPos1.y) / 2, LineWidth, this);
            }
            else {
                this.MakeLine(this.m_DownLine, FromPos.x, FromPos.y, (FromPos.x + MidPos1.x) / 2, FromPos.y, LineWidth, this);
                this.MakeLine(this.m_MidLine, (FromPos.x + MidPos1.x) / 2, MidPos1.y, (FromPos.x + MidPos1.x) / 2, MidPos2.y, LineWidth, this);
            }

            for (let ChildNode of this.ChildNodes) {
                if (!ChildNode.m_UpLine) {
                    ChildNode.m_UpLine = new fgui.GGraph();
                    ChildNode.addChild(ChildNode.m_UpLine);
                }
                let ToPos = new Laya.Point();
                if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                    ToPos.x = Math.round(ChildNode.x + ChildNode.width / 2);
                    ToPos.y = ChildNode.y;
                }
                else {
                    ToPos.x = ChildNode.x;
                    ToPos.y = Math.round(ChildNode.y + ChildNode.height / 2);
                }
                ToPos = this.parent.localToGlobal(ToPos.x, ToPos.y);

                if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
                    this.MakeLine(ChildNode.m_UpLine, ToPos.x, (MidPos1.y + FromPos.y) / 2, ToPos.x, ToPos.y, LineWidth, ChildNode);
                else
                    this.MakeLine(ChildNode.m_UpLine, (MidPos1.x + FromPos.x) / 2, ToPos.y, ToPos.x, ToPos.y, LineWidth, ChildNode);
            }
            
        }
        else if (this.ChildNodes.length) {
            let ChildNode = this.ChildNodes[0];
            let FromPos = new Laya.Point();
            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                FromPos.x = Math.round(this.x + this.width / 2);
                FromPos.y = this.y + this.height;
            }
            else {
                FromPos.x = this.x + this.width;
                FromPos.y = Math.round(this.y + this.height / 2);
            }
            let ToPos = new Laya.Point();
            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                ToPos.x = Math.round(ChildNode.x + ChildNode.width / 2);
                ToPos.y = ChildNode.y;
            }
            else {
                ToPos.x = ChildNode.x;
                ToPos.y = Math.round(ChildNode.y + ChildNode.height / 2);
            }
                  
            //转换坐标空间
            FromPos = this.parent.localToGlobal(FromPos.x, FromPos.y);
            ToPos = this.parent.localToGlobal(ToPos.x, ToPos.y);

            //判断是否对齐
            let OneLine = false;
            if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                if (Math.abs(ToPos.x - FromPos.x) < ChildNode.width / 4) {
                    ToPos.x = FromPos.x;
                    OneLine = true;
                }
            }
            else {
                if (Math.abs(ToPos.y - FromPos.y) < ChildNode.height / 4) {
                    ToPos.y = FromPos.y;
                    OneLine = true;
                }
            }            
            
            if (!this.m_DownLine) {
                this.m_DownLine = new fgui.GGraph();
                this.addChild(this.m_DownLine);
            }
            if (OneLine) {
                //位置能对上，只需要一根连线
                if (this.m_MidLine) {
                    this.m_MidLine.dispose();
                    this.m_MidLine = null;
                }
                if (ChildNode.m_UpLine) {
                    ChildNode.m_UpLine.dispose();
                    ChildNode.m_UpLine = null;
                }
                this.MakeLine(this.m_DownLine, FromPos.x, FromPos.y, ToPos.x, ToPos.y, LineWidth, this);                
            }
            else {
                //错位的，需要3根线
                if (!this.m_MidLine) {
                    this.m_MidLine = new fgui.GGraph();
                    this.addChild(this.m_MidLine);
                }
                if (!ChildNode.m_UpLine) {
                    ChildNode.m_UpLine = new fgui.GGraph();
                    ChildNode.addChild(ChildNode.m_UpLine);
                }
                if (this.Owner.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                    this.MakeLine(this.m_DownLine, FromPos.x, FromPos.y, FromPos.x, (FromPos.y + ToPos.y) / 2, LineWidth, this);
                    this.MakeLine(this.m_MidLine, FromPos.x, (FromPos.y + ToPos.y) / 2, ToPos.x, (FromPos.y + ToPos.y) / 2, LineWidth, this);
                    this.MakeLine(ChildNode.m_UpLine, ToPos.x, (FromPos.y + ToPos.y) / 2, ToPos.x, ToPos.y, LineWidth, ChildNode);
                }
                else {
                    this.MakeLine(this.m_DownLine, FromPos.x, FromPos.y, (FromPos.x + ToPos.x) / 2, FromPos.y, LineWidth, this);
                    this.MakeLine(this.m_DownLine, (FromPos.x + ToPos.x) / 2, FromPos.y, (FromPos.x + ToPos.x) / 2, ToPos.y, LineWidth, this);
                    this.MakeLine(ChildNode.m_UpLine, (FromPos.x + ToPos.x) / 2, ToPos.y, ToPos.x, ToPos.y, LineWidth, ChildNode);
                }
            }
        }
        else {
            if (this.m_DownLine) {
                this.m_DownLine.dispose();
                this.m_DownLine = null;
            }
            if (this.m_MidLine) {
                this.m_MidLine.dispose();
                this.m_MidLine = null;
            }            
        }
        if (!this.ParentNode) {
            if (this.m_UpLine) {
                this.m_UpLine.dispose();
                this.m_UpLine = null;
            }
        }
    }
    protected MakeLine(Line: fgui.GGraph, x1: number, y1: number, x2: number, y2: number, Width: number, Parent: fgui.GObject) {
        let LineRect: Laya.Rectangle;
        if (x1 == x2) {
            //竖线            
            if (y2 > y1)
                LineRect = Parent.globalToLocalRect(x1 - Width, y1, Width * 2 + 1, y2 - y1);
            else
                LineRect = Parent.globalToLocalRect(x1 - Width, y2, Width * 2 + 1, y1 - y2);
            
        }
        else if (y1 == y2) {
            //横线
            if (x2 > x1)
                LineRect = Parent.globalToLocalRect(x1, y1 - Width, x2 - x1, Width * 2 + 1);
            else
                LineRect = Parent.globalToLocalRect(x2, y1 - Width, x1 - x2, Width * 2 + 1);
        }
        if (LineRect) {
            Line.x = Math.round(LineRect.x);
            Line.y = Math.round(LineRect.y);
            Line.width = Math.round(LineRect.width);
            Line.height = Math.round(LineRect.height);
            Line.drawRect(0, UI_COLOR.BLACK, UI_COLOR.BLACK);
        }        
    }
    public OnNodeMove(Node: FlowChartNode) {
        this.BuildLines();
    }

    public IsChild(Node: FlowChartNode, Recursion: boolean): boolean {
        for (let Child of this.ChildNodes) {
            if (Child.ID == Node.ID)
                return true;
        }
        if (Recursion) {
            for (let Child of this.ChildNodes) {
                if (Child.IsChild(Node, Recursion))
                    return true;
            }
        }        
        return false;
    }
}



export class FlowChart extends fgui.GComponent {
    protected m_BG: fgui.GGraph;
    protected m_Nodes: fgui.GComponent;
    protected m_CurSelectIndex = -1;
    protected m_CurSelectNode: FlowChartNode;
    protected m_OnNodeLink: Function;
    protected m_cArrange: fgui.Controller;

    public ArrangeType = FLOW_CHART_ARRANGE_TYPE.VERTICAL;
    public HorizontalGap = 20;
    public VerticalGap = 40;

    protected onConstruct(): void {
        this.m_BG = this.getChild("bg") as fgui.GGraph;
        this.m_cArrange = this.getController("cArrange");
        this.m_cArrange.selectedIndex = 0;
        this.m_cArrange.on(fgui.Events.STATE_CHANGED, this, this.OnArrangeChanged);

        this.m_Nodes = new fgui.GComponent;
        this.addChild(this.m_Nodes);
        this.m_Nodes.width = this.width;
        this.m_Nodes.height = this.height;
        this.m_BG.addRelation(this.m_Nodes, fgui.RelationType.Size);
        this.on(fgui.Events.SIZE_CHANGED, this, this.OnSizeChanged);
        this.on(fgui.Events.DROP, this, this.OnDrop);
    }

    public get CurSelectIndex(): number {
        return this.m_CurSelectIndex;
    }
    public get CurSelectNode(): FlowChartNode {
        return this.m_CurSelectNode;
    }

    public AddNode(NodeID: number, Name: string, Color: string, Data: any, ChildIDs?: number[]): FlowChartNode {
        let Node = this.GetNode(NodeID);
        if (!Node) {
            Node = fgui.UIPackage.createObject("MainUI", "FlowChartNode") as FlowChartNode;
            Node.Owner = this;
            Node.ID = NodeID;
            Node.text = Name;
            Node.color = Color;
            Node.data = Data;
            if (ChildIDs)
                Node.ChildIDs = ChildIDs.slice();
            Node.selected = false;
            Node.changeStateOnClick = false;
            Node.onClick(this, this.OnClickNode);
            Node.on(fgui.Events.DROP, this, this.OnNodeDrop);
            this.m_Nodes.addChild(Node);
        }
        return Node;
    }
    public GetNode(NodeID: number): FlowChartNode {
        return this.m_Nodes._children.find(function (a: FlowChartNode) { return a.ID == NodeID; }) as FlowChartNode;
    }

    public DeleteAllNode() {
        this.m_Nodes.removeChildren();
    }

    protected OnClickNode(evt: Laya.Event) {
        if (this._scrollPane && this._scrollPane.isDragged)
            return;

        var item: fgui.GObject = fgui.GObject.cast(evt.currentTarget);
        if (item instanceof FlowChartNode) {
            this.setSelectionOnEvent(item, evt);
            this.displayObject.event(fgui.Events.CLICK_ITEM, [item, evt]);
        }
    }

    protected OnNodeDrop(TargetNode: FlowChartNode, SrcNode: FlowChartNode) {
        if (TargetNode && SrcNode) {
            if (this.m_OnNodeLink)
                this.m_OnNodeLink(TargetNode, SrcNode);
        }
    }

    protected OnDrop(Target: any, SrcNode: FlowChartNode) {
        if (Target == this && SrcNode) {
            if (this.m_OnNodeLink)
                this.m_OnNodeLink(null, SrcNode);
        }
    }

    protected OnSizeChanged() {
        if (this.m_Nodes.width < this.width)
            this.m_Nodes.width = this.width;
        if (this.m_Nodes.height < this.height)
            this.m_Nodes.height = this.height;
    }

    private setSelectionOnEvent(item: FlowChartNode, evt: Laya.Event): void {

        var dontChangeLastIndex: boolean = false;
        var index: number = this.m_Nodes.getChildIndex(item);

        if (!item.selected) {
            this.clearSelectionExcept(item);
            item.selected = true;
            this.m_CurSelectIndex = index;
            this.m_CurSelectNode = item;
        }
    }

    private clearSelectionExcept(g: FlowChartNode): void {
        var i: number;

        var cnt: number = this.m_Nodes._children.length;
        for (i = 0; i < cnt; i++) {
            var obj = this.m_Nodes._children[i] as FlowChartNode;
            if (obj != g)
                obj.selected = false;
        }
    }

    protected AdjustSizeByNode() {
        let MaxX = 0;
        let MaxY = 0;
        for (let Node of this.m_Nodes._children as FlowChartNode[]) {
            if (MaxX < Node.x + Node.width)
                MaxX = Node.x + Node.width;
            if (MaxY < Node.y + Node.height)
                MaxY = Node.y + Node.height;
        }
        MaxX += 20;
        MaxY += 20;
        if (MaxX < this.width)
            MaxX = this.width;
        if (MaxY < this.height)
            MaxY = this.height;
        this.m_Nodes.width = MaxX;
        this.m_Nodes.height = MaxY;
    }

    public BuildChart() {
        if (this.m_Nodes._children.length == 0)
            return;
        let NodeList = this.m_Nodes._children.slice() as FlowChartNode[];
        for (let Node of NodeList) {
            Node.offAll(fgui.Events.XY_CHANGED);
        }
        //构建父子关系
        for (let Node of NodeList) {
            Node.ChildNodes.splice(0);
            for (let NodeID of Node.ChildIDs) {
                let ChildNode = this.GetNode(NodeID);
                if (ChildNode) {
                    ChildNode.ParentNode = Node;
                    Node.ChildNodes.push(ChildNode);
                }
                else {
                    DataManager.Instance.LogError(`子节点[${NodeID}不存在]`);
                }
            }
        }

        //图构建
        let RootNode = this.PickRootNode(NodeList);
        let Offset = 0;
        while (RootNode) {
            let NodeGrid = new Array<FlowChartNode[]>();
            this.BuildNodeGrid([RootNode], NodeGrid, NodeList);
            //排布位置                      
            this.CaculateNodePos(RootNode, 0);
            let Size = this.CaculateBound(RootNode);
            this.MoveNodes(RootNode, Offset);

            Offset += this.HorizontalGap + Size[0];
            RootNode = this.PickRootNode(NodeList);
        }
        for (let Node of this.m_Nodes._children as FlowChartNode[]) {
            Node.x += Math.min(this.HorizontalGap, this.VerticalGap);
            Node.y += Math.min(this.HorizontalGap, this.VerticalGap);
        }
        for (let Node of this.m_Nodes._children as FlowChartNode[]) {
            Node.BuildLines();
        }
        this.AdjustSizeByNode();

        NodeList = this.m_Nodes._children.slice() as FlowChartNode[];
        //注册事件
        for (let Node of NodeList) {
            Node.on(fgui.Events.XY_CHANGED, Node, Node.OnNodeMove);
            for (let ChildNode of Node.ChildNodes)
                ChildNode.on(fgui.Events.XY_CHANGED, Node, Node.OnNodeMove);
        }
    }

    protected PickRootNode(NodeList: FlowChartNode[]): FlowChartNode {
        for (let i = 0; i < NodeList.length; i++) {
            let Node = NodeList[i];
            if (!Node.ParentNode) {
                NodeList.splice(i, 1);
                return Node;
            }
        }
        return null;
    }
    protected PickNode(NodeList: FlowChartNode[], NodeID: number): FlowChartNode {
        for (let i = 0; i < NodeList.length; i++) {
            let Node = NodeList[i];
            if (Node.ID == NodeID) {
                NodeList.splice(i, 1);
                return Node;
            }
        }
        return null;
    }
    protected BuildNodeGrid(NodeLine: FlowChartNode[], NodeGrid: FlowChartNode[][], SrcNodeList: FlowChartNode[]) {
        NodeGrid.push(NodeLine);
        let NewLine = [];
        for (let Node of NodeLine) {
            for (let ChildNode of Node.ChildNodes) {
                if (this.PickNode(SrcNodeList, ChildNode.ID)) {
                    NewLine.push(ChildNode);
                }
                else {
                    DataManager.Instance.LogError(`子节点[${ChildNode.ID}已被使用]`);
                }
            }
        }
        if (NewLine.length) {
            this.BuildNodeGrid(NewLine, NodeGrid, SrcNodeList);
        }
    }
    //递归求左边界
    protected CaculateLeftBounds(Node: FlowChartNode, LeftBounds: number[], Depth: number): void {
        if (Node.ChildNodes.length) {
            let left;
            if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
                left = Node.ChildNodes[0].x;
            else
                left = Node.ChildNodes[0].y;
            if (typeof LeftBounds[Depth + 1] === "undefined") {
                LeftBounds[Depth + 1] = left;
            } else {
                if (left < LeftBounds[Depth + 1]) {
                    LeftBounds[Depth + 1] = left;
                }
            }
            for (let ChildNode of Node.ChildNodes) {
                this.CaculateLeftBounds(ChildNode, LeftBounds, Depth + 1);
            }
        }
    }
    //递归求右边界
    protected CaculateRightBounds(Node: FlowChartNode, RightBounds: number[], Depth: number): void {
        if (Node.ChildNodes.length) {
            let right;
            if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
                right = Node.ChildNodes[Node.ChildNodes.length - 1].x + Node.width;
            else
                right = Node.ChildNodes[Node.ChildNodes.length - 1].y + Node.height;
            if (typeof RightBounds[Depth + 1] === "undefined") {
                RightBounds[Depth + 1] = right;
            } else {
                if (right > RightBounds[Depth + 1]) {
                    RightBounds[Depth + 1] = right;
                }
            }
            for (let ChildNode of Node.ChildNodes) {
                this.CaculateRightBounds(ChildNode, RightBounds, Depth + 1);
            }
        }
    }

    //求左边界，返回新的数组。
    protected GetLeftBounds(Node: FlowChartNode): number[] {
        var Bounds = [];
        if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
            Bounds[0] = Node.x;
        else
            Bounds[0] = Node.y;
        this.CaculateLeftBounds(Node, Bounds, 0);
        return Bounds;
    }

    //求右边界，在旧数组上修改。
    protected GetRightBounds(Node: FlowChartNode, Bounds: number[]): void {
        if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
            Bounds[0] = Node.x + Node.width;
        else
            Bounds[0] = Node.y + Node.height;
        this.CaculateRightBounds(Node, Bounds, 0);
    }

    //通过左右边界计算偏移量
    protected CaculateOffsetByBound(RightBound: number[], LeftBound: number[]): number {
        var number = LeftBound.length < RightBound.length ? LeftBound.length : RightBound.length;
        var depth = LeftBound.length > RightBound.length ? LeftBound.length : RightBound.length;
        var offset = RightBound[0] - LeftBound[0];
        for (var i = 1; i < number; i++) {
            if (RightBound[i] - LeftBound[i] > offset) {
                offset = RightBound[i] - LeftBound[i];
            }
        }
        return offset + 1 + (depth - 1) * 0.2;
    }

    //平移所有节点
    protected MoveNodes(Node: FlowChartNode, Offset: number) {
        if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
            Node.x += Offset;
        else
            Node.y += Offset;
        if (Node.ChildNodes.length) {
            for (let ChildNode of Node.ChildNodes) {
                this.MoveNodes(ChildNode, Offset);
            }
        }
    }

    //计算所有节点横向虚拟位置，稍后根据画布尺寸以及横竖要求计算所有节点真实位置。
    protected CaculateNodePos(Node: FlowChartNode, Depth: number): void {        
        if (Node.ChildNodes.length) {
            var right = [];                                                 //右边界
            for (let i = 0; i < Node.ChildNodes.length; i++) {                          //
                let ChildNode = Node.ChildNodes[i];
                this.CaculateNodePos(ChildNode, Depth + 1);                                      //
                if (i > 0) {                                                    //
                    this.GetRightBounds(Node.ChildNodes[i - 1], right);                         //把前面所有子树当做整体，更新这个整体的右边界。
                    var left = this.GetLeftBounds(ChildNode);                       //取这个子树的左边界
                    var offset = this.CaculateOffsetByBound(right, left) + (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL ? this.HorizontalGap : this.VerticalGap);                      //左右边界比较，求这个子树的偏移量
                    this.MoveNodes(ChildNode, offset);                          //整体移动这个子树
                }
            }
            //父节点在第一个子节点和最后一个子节点的中间。            
            if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
                Node.x = (Node.ChildNodes[0].x + Node.ChildNodes[Node.ChildNodes.length - 1].x + Node.width) / 2 - Node.width / 2;
            else
                Node.y = (Node.ChildNodes[0].y + Node.ChildNodes[Node.ChildNodes.length - 1].y + Node.height) / 2 - Node.height / 2;
        }
        else {
            if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
                Node.x = 0;
            else
                Node.y = 0;
        }
        if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL)
            Node.y = Depth * (Node.height + this.VerticalGap);
        else
            Node.x = Depth * (Node.width + this.HorizontalGap);
    }
    //计算总深度和总宽度
    protected CaculateBound(Node: FlowChartNode): number[] {
        var right = [];
        this.GetRightBounds(Node, right);
        var maxW = right[0];
        for (var i = 1; i < right.length; i++) {
            if (maxW < right[i]) {
                maxW = right[i];
            }
        }
        return [maxW, right.length - 1];
    }

    ////根据画布位置和尺寸以及横竖布局来确定所有节点的最终位置
    //protected CaculateNodeFinalPos(Node: FlowChartNode, Depth: number, OffsetX: number, OffsetY: number, RatioW: number, RatioH: number, Horizontal: boolean) {
    //    if (Horizontal) {
    //        Node.y = Math.round(Depth * RatioH + OffsetY);
    //        Node.x = Math.round(Node.x * RatioW + OffsetX);
    //    } else {
    //        Node.y = Math.round(Node.x * RatioH + OffsetY);
    //        Node.x = Math.round(Depth * RatioW + OffsetX);
    //    }
    //    if (Node.ChildNodes.length) {
    //        for (let ChildNode of Node.ChildNodes) {
    //            this.CaculateNodeFinalPos(ChildNode, Depth + 1, OffsetX, OffsetY, RatioW, RatioH, Horizontal);
    //        }
    //    }
    //}

    ////横向布局
    //protected LayoutHorizontal(Node: FlowChartNode, x: number, y: number, w: number, h: number) {
    //    this.CaculateNodePos(Node, 0);
    //    var size = this.CaculateBound(Node);
    //    this.CaculateNodeFinalPos(Node, 0, x, y, w / size[0], h / size[1], true);
    //}

    ////竖向布局
    //protected LayoutVertical(Node: FlowChartNode, x: number, y: number, w: number, h: number) {
    //    this.CaculateNodePos(Node, 0);
    //    var size = this.CaculateBound(Node);
    //    this.CaculateNodeFinalPos(Node, 0, x, y, w / size[1], h / size[0], false);
    //}

    public onNodeLink(Callback: (TargetNode: FlowChartNode, SrcNode: FlowChartNode) => void, Target?: any) {
        if (Target)
            this.m_OnNodeLink = Callback.bind(Target);
        else
            this.m_OnNodeLink = Callback;
    }

    public SwitchArrange() {
        if (this.m_cArrange.selectedIndex == 0) {
            this.m_cArrange.selectedIndex = 1;
        }
        else {
            this.m_cArrange.selectedIndex = 0;
        }
    }
    protected OnArrangeChanged() {
        if (this.m_cArrange.selectedIndex) {
            if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.VERTICAL) {
                this.ArrangeType = FLOW_CHART_ARRANGE_TYPE.HORIZONTAL;
                let temp = this.HorizontalGap;
                this.HorizontalGap = this.VerticalGap;
                this.VerticalGap = temp;
                this.BuildChart();
            }
        }
        else {
            if (this.ArrangeType == FLOW_CHART_ARRANGE_TYPE.HORIZONTAL) {
                this.ArrangeType = FLOW_CHART_ARRANGE_TYPE.VERTICAL;
                let temp = this.HorizontalGap;
                this.HorizontalGap = this.VerticalGap;
                this.VerticalGap = temp;
                this.BuildChart();
            }
        }
    }
}

