import Long from "long";
import { DataManager} from "../../DataManager"
import { EnumDescInfo, StructDescInfo, EditorExtend } from "../../EditorExtend"
import { DlgVariantEditor } from "../Dialogs/DlgVariantEditor";

function GetChildCount(Data: any) {
    let Count = 0;
    if (Data && typeof Data == "object") {
        for (const [key, value] of Object.entries(Data)) {
            Count++;
            Count += GetChildCount(value);
        }
    }
    return Count;
}

export enum PROPERTY_GRID_NODE_FLAG {
    DISABLE_AUTO_EXPAND = 1,
    ADD_BUTTON = (1 << 1),
    DEL_BUTTON = (1 << 2),
    UP_BUTTON = (1 << 3),
    DOWN_BUTTON = (1 << 4),
    MENU_BUTTON = (1 << 5),
    IS_VIRTUAL_OBJ = (1 << 6),
    READONLY = (1 << 7),
};

export enum PROPERTY_GRID_CHILD_CHANGE_TYPE {
    ADD = "add",
    DEL = "del",
    MOVE = "move",
    REBUILD = "rebuild"
};

const MAX_COUNT_FOR_AUTO_EXPAND = 50;

function CheckVariantValue(Value: any, ExtendType: string, IsArray: boolean): { NewValue: any, NewType: string } {
    if (IsArray) {
        if (typeof Value != "object" || !(Value instanceof Array)) {
            return { NewValue: [], NewType: ExtendType.slice(0, ExtendType.length - 2) };
        }
        else {
            return { NewValue: undefined, NewType: ExtendType.slice(0, ExtendType.length - 2) };
        }
    }
    else {
        let StructInfo = EditorExtend.Instance.GetStructInfo(ExtendType);
        if (StructInfo && typeof Value != "object") {
            return { NewValue: EditorExtend.Instance.CreateObject(ExtendType, "", IsArray), NewType: undefined };
        }
        else {
            if (EditorExtend.Instance.CompleteObject(Value, ExtendType, true)) {
                return { NewValue: Value, NewType: undefined };
            }
            else {
                return { NewValue: undefined, NewType: undefined };
            }
        }
    }
}

export class PropertyGridItem extends fgui.GButton {
    protected m_txTitle: fgui.GTextField;
    protected m_txValue: fgui.GTextField;
    protected m_cbCheck: fgui.GButton;
    protected m_BG: fgui.GGraph;
    protected m_spName: fgui.GGraph;
    protected m_spValue: fgui.GGraph;
    protected m_btnExpand: fgui.GButton;
    protected m_Indent: fgui.GGraph;
    protected m_btnAdd: fgui.GButton;
    protected m_btnDel: fgui.GButton;
    protected m_btnUp: fgui.GButton;
    protected m_btnDown: fgui.GButton;
    protected m_btnMenu: fgui.GButton;

    protected onConstruct(): void {
        this.m_txTitle = this.getChild("title") as fgui.GTextField;
        this.m_txValue = this.getChild("value") as fgui.GTextField;
        this.m_cbCheck = this.getChild("cbCheck") as fgui.GButton;
        this.m_BG = this.getChild("BG") as fgui.GGraph;
        this.m_spName = this.getChild("spName") as fgui.GGraph;
        this.m_spValue = this.getChild("spValue") as fgui.GGraph;
        this.m_btnExpand = this.getChild("btnExpand") as fgui.GButton;
        this.m_Indent = this.getChild("indent") as fgui.GGraph;
        this.m_btnAdd = this.getChild("btnAdd") as fgui.GButton;
        this.m_btnDel = this.getChild("btnDel") as fgui.GButton;
        this.m_btnUp = this.getChild("btnUp") as fgui.GButton;
        this.m_btnDown = this.getChild("btnDown") as fgui.GButton;
        this.m_btnMenu = this.getChild("btnMenu") as fgui.GButton;

        this.m_cbCheck.width = 0;
        this.m_cbCheck.visible = false;

        this.on(fgui.Events.SIZE_CHANGED, this, this.OnSize);
    }
    public Clear() {
        this.Name = "";
        this.Value = "";
        this.CheckBox.width = 0;
        this.CheckBox.visible = false;
        this.NameColor = '#333333';
        this.ValueColor = '#444444';
        this.IndentColor = '#222222';
        this.height = this.txName.height;
        this.m_btnAdd.clearClick();
        this.m_btnAdd.onClick(this.Node, this.Node._OnClickAdd);
        this.m_btnDel.clearClick();
        this.m_btnDel.onClick(this.Node, this.Node._OnClickDel);
        this.m_btnUp.clearClick();
        this.m_btnUp.onClick(this.Node, this.Node._OnClickUp);
        this.m_btnDown.clearClick();
        this.m_btnDown.onClick(this.Node, this.Node._OnClickDown);
        this.m_btnMenu.clearClick();
        this.m_btnMenu.onClick(this.Node, this.Node._OnClickMenu);
        this.m_spValue.clearClick();
        this.m_spValue.onClick(this.Node, this.Node._OnClickValue);
        this.EnableButtons(0);
    }
    public get Name(): string {
        return this.m_txTitle.text;
    }
    public set Name(v: string) {
        this.m_txTitle.text = v;
    }   
    public get Value(): string {
        return this.m_txValue.text;
    }
    public set Value(v: string) {
        this.m_txValue.text = v;
    }
    public get tooltips(): string {
        return this.m_spName.tooltips;
    }
    public set tooltips(v: string) {
        this.m_spName.tooltips = v;
    }
    public get CheckBox(): fgui.GButton {
        return this.m_cbCheck;
    }
    public set NameColor(color: string) {
        this.m_BG.color = color;
    }
    public set ValueColor(color: string) {
        this.m_spValue.color = color;
    }
    public set IndentColor(color: string) {
        this.m_Indent.color = color;
    }
    public get txName(): fgui.GTextField {
        return this.m_txTitle;
    }    
    public get txValue(): fgui.GTextField {
        return this.m_txValue;
    }
    public get Node(): PropertyGridNode {
        return this.treeNode as PropertyGridNode;
    }
    public EnableButtons(Flag: number) {
        if (Flag & PROPERTY_GRID_NODE_FLAG.READONLY) {
            this.m_btnAdd.visible = false;
            this.m_btnDel.visible = false;
            this.m_btnUp.visible = false;
            this.m_btnDown.visible = false;
            this.m_btnMenu.visible = false;
        }
        else {
            this.m_btnAdd.visible = (Flag & PROPERTY_GRID_NODE_FLAG.ADD_BUTTON) != 0;
            this.m_btnDel.visible = (Flag & PROPERTY_GRID_NODE_FLAG.DEL_BUTTON) != 0;
            this.m_btnUp.visible = (Flag & PROPERTY_GRID_NODE_FLAG.UP_BUTTON) != 0;
            this.m_btnDown.visible = (Flag & PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON) != 0;
            this.m_btnMenu.visible = (Flag & PROPERTY_GRID_NODE_FLAG.MENU_BUTTON) != 0;
        }        
        this.UpdateButtonPos();
    }
    public UpdateButtonPos() {
        let x = this.width;
        let MinX = this.m_spValue.x;
        if (this.m_btnMenu.visible) {
            x -= this.m_btnMenu.width;
            this.m_btnMenu.x = x > MinX ? x : MinX;
        }
        if (this.m_btnDown.visible) {
            x -= this.m_btnDown.width;
            this.m_btnDown.x = x > MinX ? x : MinX;
        }
        if (this.m_btnUp.visible) {
            x -= this.m_btnUp.width;
            this.m_btnUp.x = x > MinX ? x : MinX;
        }
        if (this.m_btnDel.visible) {
            x -= this.m_btnDel.width;
            this.m_btnDel.x = x > MinX ? x : MinX;
        }
        if (this.m_btnAdd.visible) {
            x -= this.m_btnAdd.width;
            this.m_btnAdd.x = x > MinX ? x : MinX;
        }
    }
    protected OnSize() {
        this.UpdateButtonPos();
    }
};

export enum PROPERTY_GRID_PROPERTY_TYPE {
    PGPT_VALUE,
    PGPT_ENUM,
    PGPT_FLAG,
    PGPT_GROUP,
};

export class PropertyGridNode extends fgui.GTreeNode {
    protected m_PropertyGrid: PropertyGrid;
    protected m_Name: string;
    protected m_ValueType: string;
    protected m_ExtendType: string;
    protected m_Value: any;
    protected m_Description: string;
    protected m_Member: string | number;
    protected m_Flag: number = 0;

    constructor(Name: string, TypeName: string, ExtendType: string, Value: any, Member: string | number, Description: string, Flag: number) {
        super();
        this.m_Name = Name;
        this.m_ValueType = TypeName;
        this.m_ExtendType = ExtendType;
        this.m_Value = Value;
        this.m_Member = Member;
        this.m_Description = Description;
        this.m_Flag = Flag;
        if ((TypeName == "Variant" || ExtendType == "RES_NAME" || ExtendType == "ANI_NAME" || ExtendType == "SCENE_NAME" || ExtendType == "MINI_MAP_NAME") && !(this instanceof PropertyGridArrayNode))
            this.m_Flag |= PROPERTY_GRID_NODE_FLAG.MENU_BUTTON;
    }

    public get Owner(): PropertyGrid {
        return this.m_PropertyGrid;
    }

    public set Owner(value: PropertyGrid) {
        this.m_PropertyGrid = value;
    }

    public get Parent(): PropertyGridNode {
        return this.parent as PropertyGridNode;
    }

    public get Item(): PropertyGridItem {
        return this.cell as PropertyGridItem;
    }

    public get Name(): string {
        return this.m_Name;
    }

    public get ValueType(): string {
        return this.m_ValueType;
    }

    public get ExtendType(): string {
        return this.m_ExtendType;
    }

    public get Value(): any {
        return this.m_Value;
    }

    public get Description(): string {
        return this.m_Description;
    }

    public get Member(): string | number {
        return this.m_Member;
    }

    public get MemberCount(): number {
        return 1;
    }

    public get Flag(): number {
        return this.m_Flag;
    }

    public set Flag(value: number) {
        if (this.m_Flag != value) {
            let ChangedFlag = this.m_Flag;
            this.m_Flag = value;
            ChangedFlag = ChangedFlag ^ this.m_Flag;
            if ((ChangedFlag & PROPERTY_GRID_NODE_FLAG.READONLY) != 0) {
                if (this.Item) {
                    this.DrawItem(this.Item);
                    this.Item.EnableButtons(this.m_Flag);
                }
                //设置子项的只读
                for (let i = 0; i < this.numChildren; i++) {
                    let Child = this.getChildAt(i) as PropertyGridNode;
                    if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY)
                        Child.Flag |= PROPERTY_GRID_NODE_FLAG.READONLY;
                    else
                        Child.Flag &= ~PROPERTY_GRID_NODE_FLAG.READONLY;
                }
            }
            else if ((ChangedFlag & (PROPERTY_GRID_NODE_FLAG.ADD_BUTTON | PROPERTY_GRID_NODE_FLAG.DEL_BUTTON |
                PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON | PROPERTY_GRID_NODE_FLAG.UP_BUTTON)) != 0) {
                if (this.Item)
                    this.Item.EnableButtons(this.m_Flag);
            }
        }
    }


    public addChild(child: PropertyGridNode): PropertyGridNode {
        child.m_PropertyGrid = this.m_PropertyGrid;
        return super.addChild(child) as PropertyGridNode;
    }
    public addChildAt(child: PropertyGridNode, index: number): PropertyGridNode {
        child.m_PropertyGrid = this.m_PropertyGrid;
        return super.addChildAt(child, index) as PropertyGridNode;
    }

    public FindChildByMember(Member: string | number): PropertyGridNode {
        for (let i = 0; i < this.numChildren; i++) {
            let Child = this.getChildAt(i) as PropertyGridNode;
            if (Child.m_Member === Member)
                return Child;
        }
        return null;
    }
    public FindChildPosByMember(Member: string | number): number {
        for (let i = 0; i < this.numChildren; i++) {
            let Child = this.getChildAt(i) as PropertyGridNode;
            if (Child.m_Member === Member)
                return i;
        }
        return -1;
    }

    public SetObject(Value: any, TypeName: string) {
        this.m_Value = Value;
        this.m_ValueType = TypeName;
        this.m_Name = TypeName;
        this.expanded = true;
        this.RefreshChild();
        this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [this, PROPERTY_GRID_CHILD_CHANGE_TYPE.REBUILD]);
    }

    public AddChildValue(Name: string, TypeName: string, ExtendType: string, Value: any, Member: string | number, Description: string, Flag: number, Pos?: number): PropertyGridNode {
        let Node: PropertyGridNode;        
        if (!Node) {
            let EnumInfo = EditorExtend.Instance.GetEnumInfo(TypeName);
            if (EnumInfo) {
                if (EnumInfo.IsFlag) {
                    Node = new PropertyGridFlagNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
                }
                else {
                    Node = new PropertyGridEnumNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
                }
            }
            else if (typeof Value == "object") {
                if (Value instanceof Long) {
                    Node = new PropertyGridNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
                }
                else if (Value instanceof Array) {
                    Node = new PropertyGridArrayNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
                }
                else {
                    if (((!TypeName) || TypeName == "Variant") && (!ExtendType) && Value) {
                        let StructName = Value["$StructName"];
                        if (StructName && (typeof StructName == "string"))
                            ExtendType = StructName;
                    }
                    Node = new PropertyGridObjectNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
                }
            }
            else {
                Node = new PropertyGridNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
            }
        }
        
        if (Node) {
            if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND)
                Node.m_Flag |= PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND;
            if (Pos)
                this.addChildAt(Node, Pos);
            else
                this.addChild(Node);
            Node.OnInit();
        }
        return Node;
    }
    public AddChildObject(Name: string, TypeName: string, ExtendType: string, Value: any, Member: string | number, Description: string, Flag: number, Pos?: number): PropertyGridObjectNode {
        if (typeof Value == "object") {
            let Node = new PropertyGridObjectNode(Name, TypeName, ExtendType, Value, Member, Description, Flag);
            if (Node) {
                if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND)
                    Node.m_Flag |= PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND;
                if (Pos)
                    this.addChildAt(Node, Pos);
                else
                    this.addChild(Node);
                Node.OnInit();
            }
            return Node;
        }
        return null;
    }

    public OnInit(): void {

    }

    public AddBindChild(Node: PropertyGridNode) {

    }

    public RemoveAllChild(): void {
        this.removeChildren();
    }
    public RefreshChild(RefreshType?: string): void {
    }
    public SetMember(Member: string | number, Value: any): boolean {
        return false;
    }
    public RebuildChild(Node: PropertyGridNode, Value: any): boolean {
        return false;
    }
    public DrawItem(Obj: PropertyGridItem): void {
        Obj.Name = this.Name;
        if (typeof this.Member == "string")
            Obj.tooltips = this.Member;
        Obj.Value = EditorExtend.Instance.StructToString(this.Value, this.m_ValueType, this.m_ExtendType);
        if (typeof this.m_Value == "string" && Obj.Value.length > 10) {
            Obj.txValue.singleLine = false;
            Obj.txValue.autoSize = fgui.AutoSizeType.Height;
        }
        else if (typeof this.m_Value == "boolean") {
            Obj.CheckBox.width = Obj.CheckBox.height;
            Obj.CheckBox.visible = true;
            Obj.CheckBox.selected = this.Value;
            Obj.CheckBox.enabled = (this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY) == 0;
            Obj.CheckBox.resetClick();
            Obj.CheckBox.onClick(this, this._OnEditFinish);
        }
        else {
            Obj.txValue.singleLine = true;
            Obj.txValue.autoSize = fgui.AutoSizeType.Height;
        }        
        Obj.EnableButtons(this.m_Flag);
        Obj.height = Obj.txValue.height;
    }

    public _OnClickAdd() {
        if (this.m_Value instanceof Array) {
            if (this instanceof PropertyGridArrayNode)
                this.OnAddChild(-1);
        }
        else {
            let Index = this.Parent.getChildIndex(this);
            if (this.Parent instanceof PropertyGridArrayNode)
                this.Parent.OnAddChild(Index);
        }
    }
    public _OnClickDel() {
        if (this.m_Value instanceof Array) {
            if (this instanceof PropertyGridArrayNode)
                this.OnDelChild(-1);
        }
        else {
            let Index = this.Parent.getChildIndex(this);
            if (this.Parent instanceof PropertyGridArrayNode)
                this.Parent.OnDelChild(Index);
        }
    }
    public _OnClickUp() {
        if (!(this.m_Value instanceof Array)) {
            let Index = this.Parent.getChildIndex(this);
            if (this.Parent instanceof PropertyGridArrayNode)
                this.Parent.OnUpChild(Index);
        }
    }
    public _OnClickDown() {
        if (!(this.m_Value instanceof Array)) {
            let Index = this.Parent.getChildIndex(this);
            if (this.Parent instanceof PropertyGridArrayNode)
                this.Parent.OnDownChild(Index);
        }
    }
    public _OnClickMenu() {
        if (this.m_ValueType == "Variant") {
            DlgVariantEditor.Instance.Show("Variant对象编辑", this.m_Value, this.m_ValueType, this, (Value: any) => {
                if (Value !== undefined) {
                    this.Parent.RebuildChild(this, Value);
                    this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                    this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [this.Parent, PROPERTY_GRID_CHILD_CHANGE_TYPE.REBUILD]);
                }
            });
        }        
    }
   

    public _OnClickValue() {
        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY)
            return;
        if (typeof this.m_Value == "number" || typeof this.m_Value == "string" || this.m_Value instanceof Long) {
            this.Owner.edEditor.visible = true;
            fgui.GRoot.inst.showPopup(this.Owner.edEditor);
            let Pos = this.Item.localToGlobal(this.Item.txValue.x, this.Item.txValue.y);
            this.Owner.edEditor.setXY(Pos.x, Pos.y);
            this.Owner.edEditor.width = this.Item.txValue.width - 2;
            this.Owner.edEditor.height = this.Item.txValue.height;
            this.Owner.edEditor.text = EditorExtend.Instance.StructToString(this.Value, this.m_ValueType, this.m_ExtendType, true);
            this.Owner.edEditor.offAll(Laya.Event.UNDISPLAY);
            this.Owner.edEditor.on(Laya.Event.UNDISPLAY, this, this._OnEditFinish);
            (this.Owner.edEditor.getChild("title") as fgui.GTextInput).requestFocus();
        }        
    }
    protected _OnEditFinish() {
        switch (typeof this.m_Value) {
            case "number":
            case "string":
            case "object":
                {
                    let NewValue = EditorExtend.Instance.StringToStruct(this.Owner.edEditor.text, this.m_ValueType, this.m_ExtendType, false);
                    if (NewValue !== undefined) {
                        if (NewValue != this.m_Value) {
                            if (this.Owner.OnValueChanging(this, NewValue)) {
                                this.m_Value = NewValue;
                                this.Parent.SetMember(this.m_Member, this.m_Value);
                                if (this.Item)
                                    this.DrawItem(this.Item);
                                this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                            }                           
                        }
                    }
                    else {
                        DataManager.Instance.LogError(`[${this.Owner.edEditor.text}]无法被转换为[${this.m_ValueType}]`);
                    }
                }                
                break;
            case "boolean":
                if (this.Item)
                {
                    let NewValue = this.Item.CheckBox.selected;
                    if (NewValue != this.m_Value) {
                        if (this.Owner.OnValueChanging(this, NewValue)) {
                            this.m_Value = NewValue;
                            this.Parent.SetMember(this.m_Member, this.m_Value);
                            if (this.Item)
                                this.DrawItem(this.Item);
                            this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                        }
                        else {
                            if (typeof this.m_Value == "boolean") {
                                if (this.Item)
                                    this.DrawItem(this.Item);
                            }
                        }
                    }
                }               
                break;
        }

    }
}

class PropertyGridEnumNode extends PropertyGridNode {    
    protected m_BindChildList = new Array<PropertyGridNode>();

    public OnInit(): void {
        this.m_Value = EditorExtend.Instance.CorrectValueType(this.m_Value, this.m_ValueType, this.m_ExtendType, false);
    }
    public DrawItem(Obj: PropertyGridItem): void {        
        Obj.Name = this.Name;
        if (typeof this.Member == "string")
            Obj.tooltips = this.Member;
        let EnumInfo = EditorExtend.Instance.GetEnumInfo(this.m_ValueType);
        if (EnumInfo) {
            Obj.Value = EnumInfo.ToString(this.m_Value);
        }
        else {
            super.DrawItem(Obj);
        }        
    }
    public _OnClickValue() {
        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY)
            return;
        let EnumInfo = EditorExtend.Instance.GetEnumInfo(this.m_ValueType);
        if (EnumInfo) {
            this.Owner.cbEditor.visible = true;
            fgui.GRoot.inst.showPopup(this.Owner.cbEditor);
            let Pos = this.Item.localToGlobal(this.Item.txValue.x, this.Item.txValue.y);
            this.Owner.cbEditor.setXY(Pos.x, Pos.y);
            this.Owner.cbEditor.width = this.Item.txValue.width - 2;
            this.Owner.cbEditor.height = this.Item.txValue.height;
            this.Owner.cbEditor.items = EnumInfo.GetStringList();
            this.Owner.cbEditor.text = EnumInfo.ToString(this.m_Value);
            this.Owner.cbEditor.offAll(fgui.Events.STATE_CHANGED);
            this.Owner.cbEditor.on(fgui.Events.STATE_CHANGED, this, this._OnEditFinish);
        }
        else {
            super._OnClickValue();
        }     
    }
    protected _OnEditFinish() {
        let EnumInfo = EditorExtend.Instance.GetEnumInfo(this.m_ValueType);
        if (EnumInfo) {
            let NewValue = EnumInfo.FromString(this.Owner.cbEditor.text);
            if (NewValue != this.m_Value && this.Owner.OnValueChanging(this, NewValue)) {
                this.m_Value = NewValue;
                this.Parent.SetMember(this.m_Member, NewValue);
                if (this.Item)
                    this.DrawItem(this.Item);
                this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                this.RebuildAllBindChild(EnumInfo);
            }
        }            
    }
    public AddBindChild(Node: PropertyGridNode) {
        if (this.m_BindChildList.indexOf(Node) < 0) {
            this.m_BindChildList.push(Node);
            this.RebuildAllBindChild();
        }
    }
    protected RebuildAllBindChild(EnumInfo?: EnumDescInfo) {
        if (!EnumInfo) {
            EnumInfo = EditorExtend.Instance.GetEnumInfo(this.m_ValueType);
        }
        if (EnumInfo) {
            let Member = EnumInfo.GetMemberByValue(this.m_Value);
            if (Member) {
                let BindChildList = this.m_BindChildList.slice();
                this.m_BindChildList.length = 0;
                for (let Child of BindChildList) {
                    if (Child.ValueType == "Variant" && !(Child instanceof PropertyGridArrayNode)) {
                        if (EditorExtend.Instance.CheckValue(Child.Value, Child.ValueType, Member.BindType, false)) {
                            Child.RefreshChild(Member.BindType);
                            this.m_BindChildList.push(Child);
                        }
                        else {
                            let Parent = Child.Parent;
                            let Pos = Parent.getChildIndex(Child);
                            Parent.removeChild(Child);
                            let NewValue = EditorExtend.Instance.CreateObject(Child.ValueType, Member.BindType, false);
                            Parent.SetMember(Child.Member, NewValue);
                            Child = Parent.AddChildValue(Child.Name, Child.ValueType, Member.BindType, NewValue, Child.Member, Child.Description, Child.Flag, Pos);
                        }
                        this.m_BindChildList.push(Child);
                    }
                    else {
                        Child.RefreshChild(Member.BindType);
                        this.m_BindChildList.push(Child);
                    }
                    if (Member.BindType) {
                        Child.Flag &= ~PROPERTY_GRID_NODE_FLAG.READONLY;
                        Child.expanded = true;
                    }
                    else {
                        Child.Flag |= PROPERTY_GRID_NODE_FLAG.READONLY;
                        Child.expanded = false;
                    }
                    this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [Child, PROPERTY_GRID_CHILD_CHANGE_TYPE.REBUILD]);
                }
            }
        }
    }
}

class PropertyGridFlagNode extends PropertyGridNode {   
    public OnInit(): void {
        this.m_Value = EditorExtend.Instance.CorrectValueType(this.m_Value, this.m_ValueType, this.m_ExtendType, false);
        this.RefreshChild();
    }
    public DrawItem(Obj: PropertyGridItem): void {
        Obj.NameColor = '#222222';
        Obj.ValueColor = '#222222';
        Obj.IndentColor = '#222222';
        Obj.Name = this.Name;
        if (typeof this.Member == "string")
            Obj.tooltips = this.Member;
    }
    public RefreshChild(): void {
        this.RemoveAllChild();
        this.expanded = true;
        let EnumInfo = EditorExtend.Instance.GetEnumInfo(this.m_ValueType);
        if (EnumInfo) {
            for (let Member of EnumInfo.Members) {
                if (!Member.HideInPropertyGrid) {
                    let FlagValue = Member.GetValue(EnumInfo.Is64Bit);
                    let FlagSet = false;
                    if (typeof FlagValue == "number")
                        FlagSet = (FlagValue & this.m_Value) != 0;
                    else
                        FlagSet = !FlagValue.and(this.m_Value).isZero();
                    let Node = new PropertyGridFlagBitNode(Member.ToString(), FlagSet, FlagValue, Member.Description, this.m_Flag);
                    this.addChild(Node);
                }                
            }
        }        
    }
    public _OnClickValue() {
    }
    public _OnFlagChange() {
        let NewValue;
        if (this.m_Value instanceof Long) {
            NewValue = Long.ZERO;
            for (let i = 0; i < this.numChildren; i++) {
                let FlagBit = this.getChildAt(i) as PropertyGridFlagBitNode;
                if (FlagBit.Value) {
                    NewValue.or(FlagBit.BindFlag);
                }
            }
        }
        else {
            NewValue = 0;
            for (let i = 0; i < this.numChildren; i++) {
                let FlagBit = this.getChildAt(i) as PropertyGridFlagBitNode;
                if (FlagBit.Value) {
                    NewValue |= FlagBit.BindFlag as number;
                }
            }

        }
        if (NewValue != this.m_Value) {
            this.m_Value = NewValue;
            this.Parent.SetMember(this.m_Member, NewValue);
            this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
        }
    }
}

class PropertyGridFlagBitNode extends PropertyGridNode {
    protected m_BindFlag: number | Long;

    constructor(Name: string, DefaultValue: boolean, BindFlag: number | Long, Description: string, NodeFlag: number) {
        super(Name, "bool", "", DefaultValue, 0, Description, NodeFlag);
        this.m_BindFlag = BindFlag;
    }
    public get BindFlag(): number | Long {
        return this.m_BindFlag;
    }
    public DrawItem(Obj: PropertyGridItem): void {
        Obj.CheckBox.width = Obj.CheckBox.height;
        Obj.CheckBox.visible = true;
        Obj.CheckBox.selected = this.Value;
        Obj.CheckBox.enabled = (this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY) == 0;
        Obj.CheckBox.resetClick();
        Obj.CheckBox.onClick(this, this._OnCheckBox);
        Obj.Name = this.Name;
    }
    protected _OnCheckBox() {
        let NewValue = this.Item.CheckBox.selected;
        if (NewValue != this.m_Value) {
            if (this.Owner.OnValueChanging(this, NewValue)) {
                this.m_Value = NewValue;
                (this.Parent as PropertyGridFlagNode)._OnFlagChange();
            }
            else {
                if (this.Item)
                    this.DrawItem(this.Item);
            }
        }
    }
    public _OnClickValue() {
    }
}


class PropertyGridObjectNode extends PropertyGridNode {

    public get MemberCount(): number {
        return EditorExtend.Instance.GetStructMemberCount(this.m_ValueType, true);
    }
    public OnInit(): void {
        this.RefreshChild();
    }
    public RefreshChild(RefreshType?: string): void {
        this.RemoveAllChild();
        if (!this.expanded)
            this.expanded = (this.m_Flag & PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND) == 0;
        let ReadOnly = this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY;
        if (this.m_ValueType == "Variant" && this.m_ExtendType.length > 0 && typeof this.m_Value != "object") {
            this.m_Value = EditorExtend.Instance.CreateObject(this.m_ValueType, this.m_ExtendType, false);
        }
        if (typeof this.m_Value == "object") {
            if (this.m_Value) {
                if (this.expanded) {
                    let ChildCount = GetChildCount(this.m_Value);
                    if (ChildCount > MAX_COUNT_FOR_AUTO_EXPAND)
                        this.m_Flag |= PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND;
                    else
                        this.m_Flag &= ~PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND;
                }
                let Index = 0;
                if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
                    if (typeof this.m_Member == "number") {
                        Index = this.m_Member;
                        let MemberCount = EditorExtend.Instance.GetStructMemberCount(this.m_ValueType, true);
                        if (this.m_Value.length < Index + MemberCount)
                            EditorExtend.Instance.ResizeArray(this.m_Value, this.m_ValueType, this.m_ExtendType, Index + MemberCount);
                    }
                    else {
                        DataManager.Instance.LogError(`虚拟对象标识不是数字`);
                    }                    
                }
                let StructInfo: StructDescInfo;
                if (this.m_ValueType == "Variant" && this.m_ExtendType.length > 0)
                    StructInfo = EditorExtend.Instance.GetStructInfo(this.m_ExtendType);
                else
                    StructInfo = EditorExtend.Instance.GetStructInfo(this.m_ValueType);
                if (StructInfo) {
                    if (EditorExtend.Instance.CompleteObject(this.m_Value, StructInfo.Name, true))
                        this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                    let StartIndex = Index;
                    for (let Member of StructInfo.Members) {
                        let Node;                        
                        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
                            //虚拟对象
                            if (Member.IsArray) {
                                Node = this.AddChildValue(Member.ShowName, Member.Type, Member.ExtendType, this.m_Value, Index, Member.Description, PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ | ReadOnly);
                                Index++;
                            }
                            else {
                                let SubStructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                                if (SubStructInfo) {
                                    Node = this.AddChildObject(Member.ShowName, Member.Type, Member.ExtendType, this.m_Value, Index, Member.Description, PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ | ReadOnly);
                                    Index += Node.MemberCount;
                                }
                                else {
                                    let ChildValue = this.m_Value[Index];
                                    if (ChildValue == undefined) {
                                        DataManager.Instance.LogError(`[${Index}]超出数组范围`);
                                        EditorExtend.Instance.ResizeArray(this.m_Value, this.m_ValueType, this.m_ExtendType, Index + 1);
                                        ChildValue = this.m_Value[Index];
                                    }
                                    Node = this.AddChildValue(Member.ShowName, Member.Type, Member.ExtendType, ChildValue, Index, Member.Description, PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ | ReadOnly);
                                    Index++;
                                }
                            }
                            if (Node && Member.BindData.length > 0) {
                                for (let i = 0; i < StructInfo.Members.length; i++) {
                                    if (StructInfo.Members[i].Name == Member.BindData) {
                                        let BindNode = this.FindChildByMember(StartIndex + i);
                                        if (BindNode && BindNode instanceof PropertyGridEnumNode) {
                                            BindNode.AddBindChild(Node);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            let ChildValue = this.m_Value[Member.Name];
                            if (ChildValue !== undefined) {
                                Node = this.AddChildValue(Member.ShowName, Member.Type, Member.ExtendType, ChildValue, Member.Name, Member.Description, ReadOnly);
                            }
                            else {
                                DataManager.Instance.LogError(`数据[${this.m_Name}]中没有成员[${Member.Name}]`);
                            }
                            if (Node && Member.BindData.length > 0) {
                                let BindNode = this.FindChildByMember(Member.BindData);
                                if (BindNode && BindNode instanceof PropertyGridEnumNode) {
                                    BindNode.AddBindChild(Node);
                                }
                            }
                        }                        
                    }
                }
                else {
                    for (const [key, value] of Object.entries(this.m_Value)) {
                        let Type = typeof value;
                        if (typeof value == "object" && value instanceof Array && value.length > 0)
                            Type = typeof value[0];
                        this.AddChildValue(key, Type, "", value, key, "", ReadOnly);
                    }
                }
            }            
        }
        else {
            DataManager.Instance.LogError(`数据[${this.m_Name}]不是对象`);
        }
    }
    public SetMember(Member: string | number, Value: any): boolean {
        if (typeof this.m_Value == "object") {
            if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {                
                if (typeof this.m_Member == "number") {
                    return this.Parent.SetMember(Member, Value);                    
                }
                else {
                    DataManager.Instance.LogError(`虚拟对象标识不是数字`);
                }
            }
            else {
                if (typeof Member == "string") {
                    this.m_Value[Member] = Value;
                    return true;
                }
                else {
                    DataManager.Instance.LogError(`不能使用数字访问对象成员`);
                }
            }            
        }
        else {
            DataManager.Instance.LogError(`[${this.m_ValueType}]设置成员[${Member}]失败`);
        }
        return false;
    }
    public RebuildChild(Node: PropertyGridNode, Value: any): boolean {
        if (typeof this.m_Value == "object" && typeof Node.Member == "string") {
            if (this.SetMember(Node.Member, Value)) {
                let Pos = this.getChildIndex(Node);
                this.removeChildAt(Pos);
                if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
                    if (Node instanceof PropertyGridArrayNode)
                        this.AddChildValue(Node.Name, Node.ValueType, Node.ExtendType, this.m_Value, this.m_Member + Node.Member, Node.Description, Node.Flag, Pos);
                    else if (Node instanceof PropertyGridObjectNode)
                        this.AddChildObject(Node.Name, Node.ValueType, Node.ExtendType, this.m_Value, this.m_Member + Node.Member, Node.Description, Node.Flag, Pos);
                    else
                        this.AddChildValue(Node.Name, Node.ValueType, Node.ExtendType, Value, Node.Member, Node.Description, Node.Flag, Pos);
                }
                else {
                    this.AddChildValue(Node.Name, Node.ValueType, Node.ExtendType, Value, Node.Member, Node.Description, Node.Flag, Pos);
                }
                return true;
            }
        }
        else {
            DataManager.Instance.LogError(`[${this.m_ValueType}]设置成员[${Node.Member}]失败`);
        }
        return false;
    }
    public DrawItem(Obj: PropertyGridItem): void {
        Obj.NameColor = '#222222';
        Obj.ValueColor = '#222222';
        Obj.IndentColor = '#222222';
        Obj.Name = this.Name;
        if (typeof this.Member == "string")
            Obj.tooltips = this.Member;
        Obj.EnableButtons(this.m_Flag);

    }
    public _OnClickValue() {
    }
}

class PropertyGridArrayNode extends PropertyGridNode {
    protected m_VirtualObjectType = "";
    constructor(Name: string, TypeName: string, ExtendType: string, Value: any[], Member: string | number, Description: string, Flag: number) {
        super(Name, TypeName, ExtendType, Value, Member, Description,
            Flag | PROPERTY_GRID_NODE_FLAG.ADD_BUTTON | PROPERTY_GRID_NODE_FLAG.DEL_BUTTON |
            PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON | PROPERTY_GRID_NODE_FLAG.UP_BUTTON);
    }
    public OnInit(): void {
        this.RefreshChild();
    }
    public RefreshChild(RefreshType?: string): void {
        this.RemoveAllChild();
        if (!this.expanded)
            this.expanded = (this.m_Flag & PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND) == 0;
        let ReadOnly = this.m_Flag & PROPERTY_GRID_NODE_FLAG.READONLY;        
        if (typeof this.m_Value == "object" && this.m_Value instanceof Array) {            

            if (this.expanded) {
                let ChildCount = this.m_Value.length;
                for (let Element of this.m_Value)
                    ChildCount += GetChildCount(Element);
                if (ChildCount > MAX_COUNT_FOR_AUTO_EXPAND)
                    this.m_Flag |= PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND;
                else
                    this.m_Flag &= ~PROPERTY_GRID_NODE_FLAG.DISABLE_AUTO_EXPAND;
            }

            let StructInfo: StructDescInfo;
            if (RefreshType != undefined)
                this.m_VirtualObjectType = RefreshType;
            let Index = 0;
            if (this.m_VirtualObjectType)
                StructInfo = EditorExtend.Instance.GetStructInfo(this.m_VirtualObjectType);
            if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
                if (typeof this.m_Member == "number") {
                    Index = this.m_Member;
                }
                else {
                    DataManager.Instance.LogError(`虚拟对象标识不是数字`);
                }
            }
            if (StructInfo) {
                this.Flag = this.Flag & (~(PROPERTY_GRID_NODE_FLAG.ADD_BUTTON | PROPERTY_GRID_NODE_FLAG.DEL_BUTTON |
                    PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON | PROPERTY_GRID_NODE_FLAG.UP_BUTTON));

                let MemberCount = StructInfo.GetStructMemberCount(true);
                if (this.m_Value.length < Index + MemberCount)
                    EditorExtend.Instance.ResizeArray(this.m_Value, this.m_ValueType, this.m_ExtendType, Index + MemberCount);
                let StartIndex = Index;
                for (let Member of StructInfo.Members) {
                    let Node;
                    if (this.m_ValueType == "Variant")
                        this.m_Value[Index] = EditorExtend.Instance.CorrectValueType(this.m_Value[Index], Member.Type, Member.ExtendType, false);
                    if (Member.IsArray) {
                        Node = this.AddChildValue(Member.ShowName, Member.Type, Member.ExtendType, this.m_Value, Index, Member.Description, PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ | ReadOnly);
                        Index++;
                    }
                    else {
                        let SubStructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                        if (SubStructInfo) {
                            Node = this.AddChildObject(Member.ShowName, Member.Type, Member.ExtendType, this.m_Value, Index, Member.Description, PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ | ReadOnly);
                            Index += Node.MemberCount;
                        }
                        else {
                            let ChildValue = this.m_Value[Index];
                            if (ChildValue == undefined) {
                                DataManager.Instance.LogError(`[${Index}]超出数组范围`);
                                EditorExtend.Instance.ResizeArray(this.m_Value, this.m_ValueType, this.m_ExtendType, Index + 1);
                                ChildValue = this.m_Value[Index];
                            }
                            if (Member.Type == "Variant" && Member.ExtendType.length > 0) {
                                let Result = CheckVariantValue(ChildValue, Member.ExtendType, Member.IsArray);
                                if (Result.NewValue != undefined) {
                                    this.m_Value[Index] = Result.NewValue;
                                    ChildValue = this.m_Value[Index];
                                }
                                let Type = this.m_ExtendType;
                                if (Result.NewType != undefined) {
                                    Type = Result.NewType;
                                }
                                Node = this.AddChildValue(Member.ShowName, Type, "", ChildValue, Index, Member.Description, ReadOnly);
                            }
                            else {
                                Node = this.AddChildValue(Member.ShowName, Member.Type, Member.ExtendType, ChildValue, Index, Member.Description,
                                    PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ | ReadOnly);
                            }                            
                            Index++;
                        }
                    }
                    if (Node && Member.BindData.length > 0) {
                        for (let i = 0; i < StructInfo.Members.length; i++) {
                            if (StructInfo.Members[i].Name == Member.BindData) {
                                let BindNode = this.FindChildByMember(StartIndex + i);
                                if (BindNode && BindNode instanceof PropertyGridEnumNode) {
                                    BindNode.AddBindChild(Node);
                                }
                                break;
                            }
                        }
                    }
                }
            }
            else {
                this.Flag = this.Flag | (PROPERTY_GRID_NODE_FLAG.ADD_BUTTON | PROPERTY_GRID_NODE_FLAG.DEL_BUTTON |
                    PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON | PROPERTY_GRID_NODE_FLAG.UP_BUTTON);
                let i = 0;
                if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
                    i = Index;
                }
                for (; i < this.m_Value.length; i++) {
                    if (this.m_ValueType == "Variant" && this.m_ExtendType.length > 0) {
                        let Result = CheckVariantValue(this.m_Value[i], this.m_ExtendType, false);
                        if (Result.NewValue != undefined) {
                            this.m_Value[i] = Result.NewValue;
                            this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                        }
                        let Type = this.m_ExtendType;
                        if (Result.NewType != undefined) {
                            Type = Result.NewType;
                        }
                        this.AddChildValue(`${this.m_Name}[${i}]`, Type, "", this.m_Value[i], i, this.m_Description,
                            PROPERTY_GRID_NODE_FLAG.ADD_BUTTON | PROPERTY_GRID_NODE_FLAG.DEL_BUTTON |
                            PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON | PROPERTY_GRID_NODE_FLAG.UP_BUTTON | ReadOnly);
                    }
                    else {
                        this.AddChildValue(`${this.m_Name}[${i}]`, this.m_ValueType, this.m_ExtendType, this.m_Value[i], i, this.m_Description,
                            PROPERTY_GRID_NODE_FLAG.ADD_BUTTON | PROPERTY_GRID_NODE_FLAG.DEL_BUTTON |
                            PROPERTY_GRID_NODE_FLAG.DOWN_BUTTON | PROPERTY_GRID_NODE_FLAG.UP_BUTTON | ReadOnly);
                    }                    
                }
            }            
        }
        else {
            DataManager.Instance.LogError(`数据[${this.m_Name}]不是数组`);
        }
    }
    public SetMember(Member: string | number, Value: any): boolean {
        if (typeof this.m_Value == "object" && this.m_Value instanceof Array && typeof Member == "number") {                      
            this.m_Value[Member] = Value;
            return true;
        }
        else {
            DataManager.Instance.LogError(`[${this.m_ValueType}]设置成员[${Member}]失败`);
        }
        return false;
    }
    public RebuildChild(Node: PropertyGridNode, Value: any): boolean {
        if (typeof this.m_Value == "object" && this.m_Value instanceof Array && typeof Node.Member == "number") {
            this.SetMember(Node.Member, Value);            
            let Pos = this.getChildIndex(Node);
            this.removeChildAt(Pos);
            if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
                if (Node instanceof PropertyGridArrayNode) {
                    let NewNode = this.AddChildValue(Node.Name, Node.ValueType, Node.ExtendType, this.m_Value, Node.Member, Node.Description, Node.Flag, Pos);
                    if (Node.m_VirtualObjectType)
                        NewNode.RefreshChild(Node.m_VirtualObjectType);
                }
                else if (Node instanceof PropertyGridObjectNode) {
                    this.AddChildObject(Node.Name, Node.ValueType, Node.ExtendType, this.m_Value, Node.Member, Node.Description, Node.Flag, Pos);
                }
                else {
                    this.AddChildValue(Node.Name, Node.ValueType, Node.ExtendType, Value, Node.Member, Node.Description, Node.Flag, Pos);
                }
            }
            else {
                this.AddChildValue(Node.Name, Node.ValueType, Node.ExtendType, Value, Node.Member, Node.Description, Node.Flag, Pos);
            }            
            return true;
        }
        else {
            DataManager.Instance.LogError(`[${this.m_ValueType}]修改成员[${Node.Member}]失败`);
        }
        return false;
    }
    public DrawItem(Obj: PropertyGridItem): void {
        Obj.NameColor = '#222222';
        Obj.ValueColor = '#222222';
        Obj.IndentColor = '#222222';
        Obj.Name = this.Name;
        if (typeof this.Member == "string")
            Obj.tooltips = this.Member;
        Obj.EnableButtons(this.m_Flag);

    }
    public _OnClickValue() {
    }

    public OnAddChild(Index: number) {
        if (Index < 0) {
            Index = this.m_ValueType.length;
        }
        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
            if (typeof this.m_Member == "number") {
                Index += this.m_Member;
            }
            else {
                DataManager.Instance.LogError(`虚拟对象标识不是数字`);
            }
        }
        if (this.Owner.OnChildChanging(this, PROPERTY_GRID_CHILD_CHANGE_TYPE.ADD, Index, Index)) {
            let NewElement = EditorExtend.Instance.NewArrayElement(this.m_Value, this.m_ValueType, this.m_ExtendType, Index);
            if (NewElement != undefined) {
                this.RefreshChild();
                this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [this, PROPERTY_GRID_CHILD_CHANGE_TYPE.ADD]);
            }
            else {
                DataManager.Instance.LogError(`新建数组成员失败`)
            }
        }
    }
    public OnDelChild(Index: number) {
        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
            if (typeof this.m_Member == "number") {
                Index += this.m_Member;
            }
            else {
                DataManager.Instance.LogError(`虚拟对象标识不是数字`);
            }
        }
        if (this.Owner.OnChildChanging(this, PROPERTY_GRID_CHILD_CHANGE_TYPE.DEL, Index, Index)) {
            if (this.m_Value instanceof Array && Index < this.m_Value.length) {
                this.m_Value.splice(Index, 1);
                this.RefreshChild();
                this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [this, PROPERTY_GRID_CHILD_CHANGE_TYPE.DEL]);
            }
        }        
    }
    public OnUpChild(Index: number) {
        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
            if (typeof this.m_Member == "number") {
                Index += this.m_Member;
            }
            else {
                DataManager.Instance.LogError(`虚拟对象标识不是数字`);
            }
        }
        if (this.m_Value instanceof Array && Index > 0 && Index < this.m_Value.length) {
            if (this.Owner.OnChildChanging(this, PROPERTY_GRID_CHILD_CHANGE_TYPE.MOVE, Index, Index - 1)) {
                let Value = this.m_Value[Index];
                this.m_Value.splice(Index, 1);
                this.m_Value.splice(Index - 1, 0, Value);
                this.RefreshChild();
                this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [this, PROPERTY_GRID_CHILD_CHANGE_TYPE.MOVE]);
            }            
        }
    }
    public OnDownChild(Index: number) {
        if (this.m_Flag & PROPERTY_GRID_NODE_FLAG.IS_VIRTUAL_OBJ) {
            if (typeof this.m_Member == "number") {
                Index += this.m_Member;
            }
            else {
                DataManager.Instance.LogError(`虚拟对象标识不是数字`);
            }
        }
        if (this.m_Value instanceof Array && Index < this.m_Value.length - 1) {
            if (this.Owner.OnChildChanging(this, PROPERTY_GRID_CHILD_CHANGE_TYPE.MOVE, Index, Index + 1)) {
                let Value = this.m_Value[Index];
                this.m_Value.splice(Index, 1);
                this.m_Value.splice(Index + 1, 0, Value);
                this.RefreshChild();
                this.Owner.displayObject.event(PropertyGrid.EVENT_VALUE_CHANGE, this);
                this.Owner.displayObject.event(PropertyGrid.EVENT_CHILD_CHANGE, [this, PROPERTY_GRID_CHILD_CHANGE_TYPE.MOVE]);
            }            
        }
    }
}



export class PropertyGrid extends fgui.GComponent {
    protected m_tvPropertys: fgui.GTree;
    protected m_tvDescription: fgui.GLabel;
    protected m_edEditor: fgui.GLabel;
    protected m_cbEditor: fgui.GComboBox;
    protected m_ValueChangingCallback: Function;
    protected m_ChildChangingCallback: Function;


    public static EVENT_VALUE_CHANGE = "value_change";
    public static EVENT_CHILD_CHANGE = "child_change";
   

    protected onConstruct(): void {
        this.m_tvPropertys = this.getChild("tvPropertys") as fgui.GTree;
        this.m_tvDescription = this.getChild("tvDescription") as fgui.GLabel;
        this.m_edEditor = this.getChild("edEditor") as fgui.GLabel;
        this.m_cbEditor = this.getChild("cbEditor") as fgui.GComboBox;


        let rootNode = new PropertyGridObjectNode("root", "", "", 0, 0, "", 0);
        rootNode._setTree(this.m_tvPropertys);
        rootNode.Owner = this;
        rootNode.expanded = true;
        this.m_tvPropertys.rootNode = rootNode;
        this.m_tvPropertys.treeNodeRender = PropertyGrid.RenderNode;

        this.m_tvPropertys.on(fgui.Events.CLICK_ITEM, this, this.OnClickItem);
        this.m_tvPropertys.scrollPane.vtScrollBar.on(Laya.Event.DISPLAY, this, this.OnScrollBarShow);
        this.m_tvPropertys.scrollPane.vtScrollBar.on(Laya.Event.UNDISPLAY, this, this.OnScrollBarHide);
        this.m_tvPropertys.scrollPane.vtScrollBar.width = 0;
    }

    public onClickNew(target: any, listener: Function):void {
        this.getChild("btnNew").onClick(target, listener);
    }

    public onClickDel(target: any, listener: Function): void {
        this.getChild("btnDel").onClick(target, listener);
    }

    protected OnClickItem(Obj: PropertyGridItem) {
        this.m_tvDescription.text = Obj.Node.Description;
    }

    protected OnScrollBarShow() {
        this.m_tvPropertys.scrollPane.vtScrollBar.width = 17;
        this.m_tvPropertys.handleSizeChanged();
    }
    protected OnScrollBarHide() {
        this.m_tvPropertys.scrollPane.vtScrollBar.width = 0;
        this.m_tvPropertys.handleSizeChanged();
    }
    public OnValueChanging(Node: PropertyGridNode, NewValue: any): boolean {
        if (this.m_ValueChangingCallback)
            return this.m_ValueChangingCallback(Node, NewValue);
        return true;
    }
    public OnChildChanging(Node: PropertyGridNode, Type: PROPERTY_GRID_CHILD_CHANGE_TYPE, Index: number, NewIndex: number): boolean {
        if (this.m_ChildChangingCallback)
            return this.m_ChildChangingCallback(Node, Type, Index, NewIndex);
        return true;
    }
    static RenderNode(Node: PropertyGridNode, Obj: PropertyGridItem) {
        Obj.Clear();
        Node.DrawItem(Obj);
    }

    public get RootNode(): PropertyGridNode {
        return this.m_tvPropertys.rootNode as PropertyGridNode;
    }

    public get edEditor(): fgui.GLabel {
        return this.m_edEditor;
    }

    public get cbEditor(): fgui.GComboBox {
        return this.m_cbEditor;
    }

    public DeleteAllItem() {
        this.RootNode.RemoveAllChild();
        this.m_tvDescription.text = "";
        this.m_tvPropertys.scrollPane.posY = 0;
    }

    public NameSizeAutoFit(): number {
        let MaxSize = 0;
        for (let i = 0; i < this.m_tvPropertys.numChildren; i++) {
            let Item = this.m_tvPropertys.getChildAt(i) as PropertyGridItem;
            let Save = Item.txName.autoSize;
            let SaveWidth = Item.txName.width;
            Item.txName.autoSize = fgui.AutoSizeType.Both;
            let Size = Math.round(Item.txName.width + Item.txName.x);
            if (Size > MaxSize)
                MaxSize = Size;
            Item.txName.autoSize = Save;
            Item.txName.width = SaveWidth;
            Size = Item.txValue.width;
        }
        MaxSize += 5;
        for (let i = 0; i < this.m_tvPropertys.numChildren; i++) {
            let Item = this.m_tvPropertys.getChildAt(i) as PropertyGridItem;
            let Size = Math.round(Item.txName.width + Item.txName.x);
            let Diff = MaxSize - Size;
            Item.txName.width += Diff;
            Item.UpdateButtonPos();
        }
        return MaxSize + 200;
    }
   
    public onValueChange(Target: any, EventFn: (Node: PropertyGridNode) => void) {
        this.on(PropertyGrid.EVENT_VALUE_CHANGE, Target, EventFn);
    }
    public onValueChanging(Target: any, EventFn: (Node: PropertyGridNode, NewValue: any) => boolean) {
        this.m_ValueChangingCallback = EventFn.bind(Target);
    }
    public onNodeExpand(Target: any, EventFn: (Node: PropertyGridNode) => void) {
        this.m_tvPropertys.on("node_expand", Target, EventFn);
    }

    public onNodeCollapse(Target: any, EventFn: (Node: PropertyGridNode) => void) {
        this.m_tvPropertys.on("node_collapse", Target, EventFn);
    }

    public onChildChange(Target: any, EventFn: (Node: PropertyGridNode, Type: PROPERTY_GRID_CHILD_CHANGE_TYPE) => void) {
        this.on(PropertyGrid.EVENT_CHILD_CHANGE, Target, EventFn);
    }
    public onChildChanging(Target: any, EventFn: (Node: PropertyGridNode, Type: PROPERTY_GRID_CHILD_CHANGE_TYPE, Index: number, NewIndex: number) => void) {
        this.m_ChildChangingCallback = EventFn.bind(Target);
    }
    
    public SetObject(Value: any, TypeName: string) {
        this.RootNode.SetObject(Value, TypeName);
        this.m_tvPropertys.scrollPane.posY = 0;
    }
};

