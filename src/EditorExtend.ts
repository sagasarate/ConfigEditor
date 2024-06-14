import ExcelJS from "exceljs";
import Long from "long";
import { JSON_INT64 } from "./DOSSystem/JSON_INT64"
import { ListView } from "./UI/Components/ListView"
import { DataManager } from "./DataManager"
import { DOSSystem } from "./DOSSystem/DOSSystem";
import { sprintf } from "sprintf-js"
import { IsArray, Str2Number } from "./Tools";



export class EnumMemberDescInfo {
    Name: string;
    protected Value: number | Long;
    protected StrValue = "";
    HideInPropertyGrid = false;
    BindType = "";
    Description = "";
    public static CloneFrom(Value: any, Is64Bit: boolean) {
        let Info = new EnumMemberDescInfo();
        Info.Name = Value.Name;
        if (typeof Value.Value == "number") {
            if (Is64Bit)
                Info.Value = Long.fromNumber(Value.Value);
            else
                Info.Value = Value.Value;            
        }
        else if (typeof Value.Value == "object" && Value.Value instanceof Long) {
            if (Is64Bit)
                Info.Value = Value.Value;
            else
                Info.Value = Value.Value.toNumber();
        }
        Info.Value = Value.Value;
        if (Value.StrValue !== undefined)
            Info.StrValue = Value.StrValue;
        if (Value.HideInPropertyGrid !== undefined)
            Info.HideInPropertyGrid = Value.HideInPropertyGrid;
        if (Value.BindType !== undefined)
            Info.BindType = Value.BindType;
        if (Value.Description !== undefined)
            Info.Description = Value.Description;
        return Info;
    }
    public Compare(Target: EnumMemberDescInfo): number {
        if (typeof this.Value == "number") {
            if (typeof Target.Value == "number") {
                return this.Value - Target.Value;
            }
            else {
                return -Target.Value.compare(this.Value);
            }
        }
        else {
            return this.Value.compare(Target.Value);           
        }
    }
    public GetValue(Is64Bit: boolean): number | Long {
        if (Is64Bit) {
            if (typeof this.Value == "number") {
                return Long.fromNumber(this.Value);
            }
            else {
                return this.Value;
            }
        }
        else {
            if (typeof this.Value == "number") {
                return this.Value;
            }
            else {
                return this.Value.toNumber();
            }
        }
    }
    public GetValueStr(): string {
        return this.Value.toString();
    }
    public IsValid(): boolean {
        return this.Name !== undefined && this.Value !== undefined;
    }
    public ToString(): string {
        if (this.StrValue.length)
            return this.StrValue;
        else
            return this.Name;
    }
    public IsMatch(Str: string): boolean {
        if (this.StrValue.length)
            return this.StrValue == Str;
        else
            return this.Name == Str;
    }    
}
export class EnumDescInfo {
    Name: string;
    ShowName = "";
    Description = "";
    IsFlag = false;
    Is64Bit = false;
    Members = new Array<EnumMemberDescInfo>();
    public static CloneFrom(Value: any) {
        let Info = new EnumDescInfo();
        Info.Name = Value.Name;
        if (Value.ShowName !== undefined)
            Info.ShowName = Value.ShowName;
        if (Value.Descroption !== undefined)
            Info.Description = Value.Descroption;
        if (Value.IsFlag !== undefined)
            Info.IsFlag = Value.IsFlag;
        if (Value.Is64Bit !== undefined)
            Info.Is64Bit = Value.Is64Bit;
        if (Value.Members && typeof Value.Members == "object" && Value.Members instanceof Array) {
            for (let Member of Value.Members) {
                let M = EnumMemberDescInfo.CloneFrom(Member, Info.Is64Bit);
                if (M.IsValid()) {
                    Info.Members.push(M);
                }
                else {
                    Info.Name = undefined;
                    return Info;
                }
                    
            }
        }
        Info.Check();
        Info.Sort();
        return Info;
    }
    public Check() {
        if (!this.IsFlag) {
            for (let i = 0; i < this.Members.length; i++) {
                for (let j = i + 1; j < this.Members.length; j++) {
                    let Member1 = this.Members[i];
                    let Member2 = this.Members[j];
                    if (Member1.Compare(Member2) == 0)
                        DataManager.Instance.LogError(`枚举[${this.Name}]的项[${Member1.Name}(${Member1.GetValueStr()})]与项[${Member2.Name}](${Member2.GetValueStr()})的值相同`);
                }
            }
        }        
    }
    public Sort() {
        this.Members.sort((a, b) => {
            return a.Compare(b);
        });
    }
    public Merge(Value: EnumDescInfo) {
        for (let Member of Value.Members) {
            let IsExist = false;
            for (let i = 0; i < this.Members.length; i++) {
                if (this.Members[i].Name == Member.Name) {
                    this.Members[i] = Member;
                    IsExist = true;
                    break;
                }                    
            }
            if (!IsExist)
                this.Members.push(Member);
        }
        this.Check();
        this.Sort();
    }
    public IsValid(): boolean {
        return this.Name !== undefined;
    }
    public GetMemberByValue(Value: number | Long): EnumMemberDescInfo {
        for (let Member of this.Members) {
            let MemberValue = Member.GetValue(this.Is64Bit);
            if (this.Is64Bit) {
                if ((MemberValue as Long).equals(Value))
                    return Member;
            }
            else {
                if (typeof Value != "number")
                    Value = Value.toNumber();
                if (MemberValue === Value)
                    return Member;
            }
        }
        return null;
    }
    public ToString(Value: number | Long): string {
        if (this.IsFlag) {
            let Str = [];
            if (this.Is64Bit) {
                if (typeof Value == "number") {
                    Value = Long.fromNumber(Value);
                }
                for (let Member of this.Members) {
                    if (Value.and(Member.GetValue(this.Is64Bit)))
                        Str.push(Member.ToString());
                }
            }
            else {
                if (typeof Value != "number") {
                    Value = Value.toNumber();
                }
                for (let Member of this.Members) {
                    if (Value & (Member.GetValue(this.Is64Bit) as number))
                        Str.push(Member.ToString());
                }
            }
            return Str.join('|');
        }
        else {
            if (this.Is64Bit) {
                if (typeof Value == "number") {
                    Value = Long.fromNumber(Value);
                }
            }
            else {
                if (typeof Value != "number") {
                    Value = Value.toNumber();
                }
            }
            for (let Member of this.Members) {
                if (Member.GetValue(this.Is64Bit) == Value)
                    return Member.ToString();
            }
            return "UNKNOW";
        }        
    }
    public FromString(Str: string): number | Long {
        if (this.IsFlag) {            
            if (this.Is64Bit) {
                let Value = Long.ZERO;
                for (let Member of this.Members) {
                    if (Member.IsMatch(Str))
                        Value = Value.or(Member.GetValue(true));
                }
                return Value;
            }
            else {
                let Value = 0;
                for (let Member of this.Members) {
                    if (Member.IsMatch(Str))
                        Value = Value | (Member.GetValue(false) as number);
                }
                return Value;
            }
        }
        else {            
            for (let Member of this.Members) {
                if (Member.IsMatch(Str))
                    return Member.GetValue(this.Is64Bit);
            }
            return this.Members[this.Members.length - 1].GetValue(this.Is64Bit);
        }
    }
    public GetStringList(): string[] {
        let List = [];
        for (let Member of this.Members) {
            List.push(Member.ToString());
        }
        return List;
    }
    public GetDescs(Strs: string[]) {
        Strs.push(this.Description);
        Strs.push(":\n");
        for (let Member of this.Members) {
            Strs.push(`${Member.GetValue(this.Is64Bit).toString()}=${Member.ToString()}\n`)
        }
    }
}

export class StructMemberDescInfo {
    Name: string;
    Type: string;
    ExtendType = "";
    ShowName = "";
    Description = "";
    BindData = "";
    IsArray = false;
    HideInEditorList = false;
    HideInPropertyGrid = false;
    HideInXls = false;
    IsKey = false;
    public static CloneFrom(Value: any) {
        let Info = new StructMemberDescInfo();
        Info.Name = Value.Name;
        Info.Type = Value.Type;
        if (Value.ExtendType !== undefined)
            Info.ExtendType = Value.ExtendType;
        if (Value.ShowName !== undefined)
            Info.ShowName = Value.ShowName;
        if (Value.Description !== undefined)
            Info.Description = Value.Description;
        if (Value.BindData !== undefined)
            Info.BindData = Value.BindData;
        if (Value.IsArray !== undefined)
            Info.IsArray = Value.IsArray;
        if (Value.HideInEditorList !== undefined)
            Info.HideInEditorList = Value.HideInEditorList;
        if (Value.HideInPropertyGrid !== undefined)
            Info.HideInPropertyGrid = Value.HideInPropertyGrid;
        if (Value.HideInXls !== undefined)
            Info.HideInXls = Value.HideInXls;
        if (Value.IsKey !== undefined)
            Info.IsKey = Value.IsKey;
        return Info;
    }
    public IsValid(): boolean {
        return this.Name !== undefined && this.Type !== undefined;
    }
}

export class StructDescInfo {
    Name: string;
    ShowName = "";
    Description = "";
    Members = new Array<StructMemberDescInfo>();
    public static CloneFrom(Value: any) {
        let Info = new StructDescInfo();
        Info.Name = Value.Name;
        if (Value.ShowName !== undefined)
            Info.ShowName = Value.ShowName;
        if (Value.Descroption !== undefined)
            Info.Description = Value.Descroption;
        if (Value.Members && typeof Value.Members == "object" && Value.Members instanceof Array) {
            for (let Member of Value.Members) {
                let M = StructMemberDescInfo.CloneFrom(Member);
                if (M.IsValid()) {
                    Info.Members.push(M);
                }
                else {
                    Info.Name = undefined;
                    return Info;
                }
            }
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.Name !== undefined;
    }

    public GetMember(MemberName: string): StructMemberDescInfo {
        for (let Member of this.Members) {
            if (Member.Name == MemberName)
                return Member;
        }
        return null;
    }
    public GetChildInfoByDataSource(DataSource: string, StartPos?: number, OnlyMemberInfo?: boolean): StructDescInfo | StructMemberDescInfo {
        let PosList = DataSource.split('.');
        return this.GetChildInfo(PosList, StartPos, OnlyMemberInfo);
    }
    public GetChildInfo(PosList: string[], StartPos?: number, OnlyMemberInfo?: boolean): StructDescInfo | StructMemberDescInfo {
        if (StartPos) {
            if (StartPos >= PosList.length) {
                return null;
            }
        }
        else {
            if (PosList.length == 0)
                return this;
            StartPos = 0;
        }
        let MemberName = PosList[StartPos];
        if (MemberName.length > 0) {
            let Member = this.GetMember(MemberName);
            if (Member) {
                if (StartPos == PosList.length - 1) {
                    if (OnlyMemberInfo) {
                        return Member;
                    }
                    else {
                        let StructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                        if (StructInfo) {
                            return StructInfo;
                        }
                        else {
                            return Member;
                        }
                    }
                }
                else {
                    let StructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                    if (StructInfo) {
                        return StructInfo.GetChildInfo(PosList, StartPos + 1, OnlyMemberInfo);
                    }                   
                }
            }            
        }
        else {
            if (StartPos == PosList.length - 1) {
                return this;
            }
            else {
                return this.GetChildInfo(PosList, StartPos + 1, OnlyMemberInfo);
            }
        }
        return null;
    }
    public CompleteObject(Obj: any, Recursion?: boolean): number {
        if (Recursion === undefined)
            Recursion = true;
        let CompleteCount = 0;
        for (let Member of this.Members) {
            if (Obj[Member.Name] === undefined) {
                DataManager.Instance.LogError(`结构[${this.Name}]的成员[${Member.Name}]不存在`);
                if (Member.IsArray) {
                    Obj[Member.Name] = [];
                }
                else {
                    Obj[Member.Name] = EditorExtend.Instance.CreateObject(Member.Type, Member.ExtendType, Member.IsArray);
                }
                CompleteCount++;
            }
            else {
                let MemberData = Obj[Member.Name];
                if (Member.IsArray && (typeof MemberData != "object" || !MemberData || !(MemberData instanceof Array))) {
                    DataManager.Instance.LogError(`结构[${this.Name}]应该是数组的成员[${Member.Name}]不是数组`);
                    Obj[Member.Name] = [];
                    CompleteCount++;
                }
                else {
                    let StructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                    if (StructInfo && typeof MemberData != "object") {
                        DataManager.Instance.LogError(`结构[${this.Name}]应该是对象的成员[${Member.Name}]不是对象`);
                        Obj[Member.Name] = EditorExtend.Instance.CreateObject(Member.Type, Member.ExtendType, Member.IsArray);
                        CompleteCount++;
                    }
                }
            }
        }
        if (Recursion) {
            for (let Member of this.Members) {
                let MemberData = Obj[Member.Name];
                let StructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                if (StructInfo) {
                    if (Member.IsArray) {
                        if (typeof MemberData == "object" && MemberData && MemberData instanceof Array) {
                            for (let Child of MemberData) {
                                CompleteCount += StructInfo.CompleteObject(Child, Recursion);
                            }
                        }                        
                    }
                    else {
                        CompleteCount += StructInfo.CompleteObject(MemberData, Recursion);
                    }                    
                }
            }
        }

        return CompleteCount;
    }
    public GetStructMemberCount(Recursion?: boolean): number {
        let Count = 0;
        for (let Info of this.Members) {
            if (!Info.IsArray && Recursion) {
                let StructInfo = EditorExtend.Instance.GetStructInfo(Info.Type);
                if (StructInfo)
                    Count += StructInfo.GetStructMemberCount(Recursion);
                else
                    Count++;
            }
            else {
                Count++;
            }
        }
        return Count;
    }
}

export class PresetTypeInfo {
    public StructName = "";
    public Description = "";
    public static CloneFrom(Value: any) {
        let Info = new PresetTypeInfo();
        Info.StructName = Value.StructName;
        Info.Description = Value.Description;
        return Info;
    }
    public IsValid(): boolean {
        return Boolean(this.StructName) && Boolean(this.Description);
    }
}

//export class StructStringer {
//    StructName: string;
//    Format: string;
//    public static CloneFrom(Value: any) {
//        let Info = new StructStringer();
//        Info.StructName = Value.StructName;
//        Info.Format = Value.Format;
//        return Info;
//    }
//    public IsValid(): boolean {
//        return this.StructName !== undefined && this.Format !== undefined;
//    }
//    public ToString(Value: any): string {
//        let StructInfo = EditorExtend.Instance.GetStructInfo(this.StructName);
//		if (StructInfo) {
//			let Str = this.Format;
//			for (let Member of StructInfo.Members) {
//				let Key = `\${${Member.Name}}`;
//				let Data = EditorExtend.Instance.StructToString(Value[Member.Name], Member.Type);
//				Str.replace(Key, Data);
//			}
//			return Str;
//        }
//        return this.StructName;
//    }
//    public FromString(Str: string): any {
//        let StructInfo = EditorExtend.Instance.GetStructInfo(this.StructName);
//        if (StructInfo) {
            
//        }
//        return null;
//    }
//}

export class FormatDescInfo {
    TypeName: string;
    Description: string;
    UsedEnumList = new Array<string>();
    public static CloneFrom(Value: any) {
        let Info = new FormatDescInfo();
        Info.TypeName = Value.TypeName;
        Info.Description = Value.Description;
        if (Value.UsedEnumList && typeof Value.UsedEnumList == "object" && Value.UsedEnumList instanceof Array) {
            Info.UsedEnumList = Value.UsedEnumList.slice();
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.TypeName !== undefined && this.Description !== undefined;
    }

    public GetDesc(Strs: string[], IsArray: boolean) {
        Strs.push('格式:\n');
        if (IsArray) {
            Strs.push('[')
            Strs.push(this.Description);
            Strs.push(',')
            Strs.push(this.Description);
            Strs.push('...]')
        }
        else {
            Strs.push(this.Description);
        }        
        Strs.push('\n');        
        for (let EnumName of this.UsedEnumList) {
            let EnumInfo = EditorExtend.Instance.GetEnumInfo(EnumName);
            if (EnumInfo) {
                EnumInfo.GetDescs(Strs);
                Strs.push('\n');
            }
        }
    }
}

export class XlsAdditionalColumnInfo{
    Name: string;
    DataSource: string;
    public static CloneFrom(Value: any) {
        let Info = new XlsAdditionalColumnInfo();
        Info.Name = Value.Name;
        Info.DataSource = Value.DataSource;
        return Info;
    }
    public IsValid(): boolean {
        return this.Name !== undefined && this.DataSource !== undefined;
    }
}

export class XlsSheetInfo{
    SheetName: string;
    DataSource: string;
    AdditionalColumns = new Array<XlsAdditionalColumnInfo>();
    public static CloneFrom(Value: any) {
        let Info = new XlsSheetInfo();
        Info.SheetName = Value.SheetName;
        Info.DataSource = Value.DataSource;
        if (Value.AdditionalColumns && typeof Value.AdditionalColumns == "object" && Value.AdditionalColumns instanceof Array) {
            for (let Column of Value.AdditionalColumns) {
                let Col = XlsAdditionalColumnInfo.CloneFrom(Column);
                if (Col.IsValid()) {
                    Info.AdditionalColumns.push(Col);
                }
                else {
                    Info.SheetName = undefined;
                    return Info;
                }
            }
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.SheetName !== undefined && this.DataSource !== undefined;
    }
}

export class XlsSheetFromListInfo {
    SheetDataSource: string;
    SheetNameMember: string;
    DataMember: string;
    AdditionalColumns = new Array<XlsAdditionalColumnInfo>();
    public static CloneFrom(Value: any) {
        let Info = new XlsSheetFromListInfo();
        Info.SheetDataSource = Value.SheetDataSource;
        Info.SheetNameMember = Value.SheetNameMember;
        Info.DataMember = Value.DataMember;
        if (Value.AdditionalColumns && typeof Value.AdditionalColumns == "object" && Value.AdditionalColumns instanceof Array) {
            for (let Column of Value.AdditionalColumns) {
                let Col = XlsAdditionalColumnInfo.CloneFrom(Column);
                if (Col.IsValid()) {
                    Info.AdditionalColumns.push(Col);
                }
                else {
                    Info.SheetDataSource = undefined;
                    return Info;
                }
            }
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.SheetDataSource !== undefined && this.SheetNameMember !== undefined && this.DataMember !== undefined;
    }
}

class AdditionalColInfo{
    Name: string;
    PosList: string[];
    Member: StructMemberDescInfo;
    Deep: number;
    Value: any;
    constructor(n: string | AdditionalColInfo, p?: string[], m?: StructMemberDescInfo, d?: number) {
        if (typeof n == "string") {
            this.Name = n;
            this.PosList = p;
            this.Member = m;
            this.Deep = d;
        }
        else {
            this.Name = n.Name;
            this.PosList = n.PosList;
            this.Member = n.Member;
            this.Deep = n.Deep;
            this.Value = n.Value;
        }
    }
}

export class XlsTranslater {
    StructName: string;
    XlsName: string;
    Sheets = new Array<XlsSheetInfo>();
    SheetsFromList: XlsSheetFromListInfo;
    public static CloneFrom(Value: any) {
        let Info = new XlsTranslater();
        Info.StructName = Value.StructName;
        Info.XlsName = Value.XlsName;
        if (Value.Sheets && typeof Value.Sheets == "object" && Value.Sheets instanceof Array) {
            for (let Data of Value.Sheets) {
                let Sheet = XlsSheetInfo.CloneFrom(Data);
                if (Sheet.IsValid()) {
                    Info.Sheets.push(Sheet);
                }
                else {
                    Info.StructName = undefined;
                    return Info;
                }
            }
        }
        if (Value.SheetsFromList) {
            Info.SheetsFromList = XlsSheetFromListInfo.CloneFrom(Value.SheetsFromList);
            if (!Info.SheetsFromList.IsValid())
                Info.SheetsFromList = undefined;
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.StructName !== undefined && this.XlsName !== undefined && (this.Sheets.length > 0 || Boolean(this.SheetsFromList));
    }
    protected FormatSheetHeader(Sheet: ExcelJS.Worksheet) {
        Sheet.getRow(1).eachCell(function (cell, col) {
            cell.font = { bold: true };
        });
        Sheet.getRow(2).eachCell(function (cell, col) {
            cell.font = { bold: true };
        });
        Sheet.getRow(3).eachCell(function (cell, col) {
            cell.font = { bold: true };
            cell.alignment = { wrapText: true };
        });
    }
    protected PushSheetHeader(Headers: string[][], Name: string, Type: StructMemberDescInfo, Description: string) {        
        Headers[0].push(Name);
        if (Type.IsArray)
            Headers[1].push(Type.Type + '[]');
        else
            Headers[1].push(Type.Type);
        let Descs = [];
        Descs.push(Description);
        let ExdDesc = EditorExtend.Instance.GetFormatDescInfo(Type.Type);
        if (ExdDesc) {
            Descs.push('\n');
            ExdDesc.GetDesc(Descs, Type.IsArray);
        }
        let EnumInfo = EditorExtend.Instance.GetEnumInfo(Type.Type);
        if (EnumInfo) {
            Descs.push('\n');
            EnumInfo.GetDescs(Descs);
        }
        else {
            let StructInfo = EditorExtend.Instance.GetStructInfo(Type.Type);
            if (StructInfo) {
                for (let Member of StructInfo.Members) {
                    let EnumInfo = EditorExtend.Instance.GetEnumInfo(Member.Type);
                    if (EnumInfo) {
                        Descs.push('\n');
                        EnumInfo.GetDescs(Descs);                        
                    }
                }
            }
        }              
        Headers[2].push(Descs.join(''));
    }
    protected PushSheetData(Row: any[], Data: any, StructInfo: StructDescInfo) {
        for (let Member of StructInfo.Members) {
            if (!Member.HideInXls) {
                let MemberData = Data[Member.Name];
                if (typeof MemberData == "object" || Member.Type == "Variant") {
                    Row.push(EditorExtend.Instance.StructToString(MemberData, Member.Type, Member.ExtendType, true));
                }
                else {
                    Row.push(MemberData);
                }
            }
        }
    }
    
    
    protected AddDataToSheet(Data: any, StructInfo: StructDescInfo, PosList: string[], AddColInfoList: AdditionalColInfo[], AddColList: any[], Sheet: ExcelJS.Worksheet): boolean {
        if (PosList.length) {
            if (Data instanceof Array) {
                for (let SubData of Data) {
                    let SubPosList = PosList.slice();
                    let SubAddColInfoList = new Array<AdditionalColInfo>();
                    for (let Col of AddColInfoList)
                        SubAddColInfoList.push(new AdditionalColInfo(Col));
                    let SubAddColList = AddColList.slice();
                    if (!this.AddDataToSheet(SubData, StructInfo, SubPosList, SubAddColInfoList, SubAddColList, Sheet))
                        return false;
                }
                return true;
            }
            else {
                for (let i = 0; i < AddColInfoList.length; i++) {
                    let Col = AddColInfoList[i];
                    if (Col.Deep > 0) {
                        Col.Deep--;
                    }
                    else if (Col.Deep == 0) {
                        let Member = Data[Col.Member.Name];
                        if (typeof Member == "object" || Member.Type == "Variant") {
                            AddColList.push(EditorExtend.Instance.StructToString(Member, Col.Member.Type, Col.Member.ExtendType, true));
                        }
                        else {
                            AddColList.push(Member);
                        }
                        Col.Deep = -1;
                    }
                }
                if (PosList[0].length > 0) {
                    Data = Data[PosList[0]];
                    if (Data) {
                        let Member = StructInfo.GetMember(PosList[0]);
                        if (Member) {
                            StructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                            if (StructInfo)
                                return this.AddDataToSheet(Data, StructInfo, PosList.slice(1), AddColInfoList, AddColList, Sheet);
                        }
                        else {
                            DataManager.Instance.LogError(`结构[${StructInfo.Name}]中不存在成员[${PosList[0]}]`);
                        }
                    }
                    else {
                        DataManager.Instance.LogError(`类型为[${StructInfo.Name}]的对象中不存在成员[${PosList[0]}]`);
                    }
                }
                else {
                    return this.AddDataToSheet(Data, StructInfo, PosList.slice(1), AddColInfoList, AddColList, Sheet);
                }
                    
                return false;
            }
        }
        else {
            if (Data instanceof Array) {
                for (let SubData of Data) {
                    let Row = AddColList.slice();
                    this.PushSheetData(Row, SubData, StructInfo);                    
                    Sheet.addRow(Row);
                }                
            }
            else {
                this.PushSheetData(AddColList, Data, StructInfo);                
                Sheet.addRow(AddColList);
            }            
            return true;
        }
    }
    protected ObjectToSheet(Data: any, StructInfo: StructDescInfo, DataSource: string, AdditionalColumns: XlsAdditionalColumnInfo[], Sheet: ExcelJS.Worksheet): boolean {
        let Headers = [[], [], []];
        let PosList = DataSource.split('.');
        let TargetInfo = StructInfo.GetChildInfo(PosList);
        if (!(TargetInfo instanceof StructDescInfo)) {
            DataManager.Instance.LogError(`结构[${StructInfo.Name}]中不存在数据路径[${PosList}]`);
            return false;
        }
        let ColList = new Array<AdditionalColInfo>();
        for (let Col of AdditionalColumns) {
            let ColPos = Col.DataSource.split('.');
            let ColInfo = StructInfo.GetChildInfo(ColPos);
            if (ColInfo && ColInfo instanceof StructMemberDescInfo) {
                this.PushSheetHeader(Headers, Col.Name, ColInfo, ColInfo.Description);
                ColList.push(new AdditionalColInfo(Col.Name, null, ColInfo, ColPos.length - 1));
            }
            else {
                DataManager.Instance.LogError(`结构[${StructInfo.Name}]中不存在数据路径[${ColPos}]`);
                return false;
            }
        }
        for (let Member of TargetInfo.Members) {
            if (!Member.HideInXls)
                this.PushSheetHeader(Headers, Member.Name, Member, Member.Description);
        }
        Sheet.addRows(Headers);
        this.FormatSheetHeader(Sheet);
        return this.AddDataToSheet(Data, StructInfo, PosList, ColList, [], Sheet);
    }

    protected ListToSheets(Data: any, StructInfo: StructDescInfo, SheetInfo: XlsSheetFromListInfo, Book: ExcelJS.Workbook): number {
        let PosList = SheetInfo.SheetDataSource.split('.');
        let TargetInfo = StructInfo.GetChildInfo(PosList);
        if (!(TargetInfo instanceof StructDescInfo)) {
            DataManager.Instance.LogError(`结构[${StructInfo.Name}]中不存在数据路径[${PosList}]`);
            return 0;
        }
        let DataList = EditorExtend.GetChildData(Data, PosList);        
        if (typeof DataList == "object" && DataList instanceof Array) {
            let SheetDataStruct = TargetInfo.GetChildInfo([SheetInfo.DataMember]);
            if (SheetDataStruct instanceof StructDescInfo) {
                let SheetIndex = 1;
                for (let Entry of DataList) {
                    let SheetData = Entry[SheetInfo.DataMember]
                    if (SheetData) {
                        let SheetName = Entry[SheetInfo.SheetNameMember];
                        let Sheet: ExcelJS.Worksheet;
                        if (SheetName != null)
                            Sheet = Book.addWorksheet(SheetName.toString());
                        else
                            Sheet = Book.addWorksheet(`Sheet${SheetIndex++}`);
                        this.ObjectToSheet(SheetData, SheetDataStruct, "", SheetInfo.AdditionalColumns, Sheet);
                    }
                    else {
                        DataManager.Instance.LogError(`数据[${TargetInfo.Name}]中不存在成员[${SheetInfo.DataMember}]`);
                    }
                }
            }
            else {
                DataManager.Instance.LogError(`结构[${TargetInfo.Name}]中不存在数据路径[${SheetInfo.DataMember}]`);
            }
        }
        else {
            DataManager.Instance.LogError(`数据[${StructInfo.Name}]中不存在成员[${PosList}]`);
        }
    }

    public ObjectToXls(Data: any, TypeName: string): ExcelJS.Workbook {
        let StructInfo = EditorExtend.Instance.GetStructInfo(TypeName);
        if (StructInfo) {
            let Book = new ExcelJS.Workbook();

            for (let SheetInfo of this.Sheets) {
                let Sheet = Book.addWorksheet(SheetInfo.SheetName);
                if (!this.ObjectToSheet(Data, StructInfo, SheetInfo.DataSource, SheetInfo.AdditionalColumns, Sheet))
                    return null;
            }
            if (this.SheetsFromList)
                this.ListToSheets(Data, StructInfo, this.SheetsFromList, Book);
            return Book;
        }
        else {
            DataManager.Instance.LogError(`结构[${TypeName}]的描述信息不存在`);
        }
        return null;
    }

    protected ParserXlsColumns(Sheet: ExcelJS.Worksheet): boolean {
        if (Sheet.rowCount >= 3) {
            let Row = Sheet.getRow(1);
            Row.eachCell(function (cell: ExcelJS.Cell, Col: number) {
                Sheet.setColumnKey(cell.text.trim(), Sheet.getColumn(Col));
            });
            return true;
        }
        else {
            DataManager.Instance.LogError(`${this.XlsName}的${Sheet.name}缺少表头`);
        }
        return false;
    }
    protected CheckSheetHeader(Sheet: ExcelJS.Worksheet, DataSource: string, AdditionalColumns: XlsAdditionalColumnInfo[], StructInfo: StructDescInfo): boolean {
        for (let AddCol of AdditionalColumns) {
            if (!Sheet.getColumnKey(AddCol.Name)) {
                DataManager.Instance.LogError(`${this.XlsName}的${Sheet.name}中缺少列[${AddCol.Name}]`);
                return false;
            }
        }
        let PosList = DataSource.split('.');
        let TargetInfo = StructInfo.GetChildInfo(PosList);
        if (TargetInfo instanceof StructDescInfo) {
            for (let Member of TargetInfo.Members) {
                if (!Member.HideInXls) {
                    if (!Sheet.getColumnKey(Member.Name)) {
                        DataManager.Instance.LogError(`${this.XlsName}的${Sheet.name}中缺少列[${Member.Name}]`);
                        return false;
                    }
                }
            }
        }
        else {
            DataManager.Instance.LogError(`${this.XlsName}的结构[${StructInfo.Name}]中不存在数据路径[${PosList}]`);
            return false;
        }
        return true;
    }
    protected FindObject(Data: any, AddColList: AdditionalColInfo[]): any {
        let Layer = 0;
        while (true) {
            let LayerName = undefined;
            let Keys = new Array<AdditionalColInfo>();
            for (let Col of AddColList) {
                if (Col.PosList.length - Layer > 1) {
                    if (LayerName) {
                        if (LayerName != Col.PosList[Layer]) {
                            DataManager.Instance.LogError(`${this.XlsName}的扩展列层次有冲突`);
                            return undefined;
                        }
                    }
                    else {
                        LayerName = Col.PosList[Layer];
                    }
                }
                else if (Col.PosList.length - Layer == 1) {
                    Keys.push(Col);
                }
            }            
            if (Keys.length) {
                if (typeof Data == "object" && Data instanceof Array) {
                    let FindedData;
                    for (let SubData of Data) {
                        let IsMatch = true;
                        for (let Col of Keys) {
                            if (SubData[Col.PosList[Col.PosList.length - 1]] != Col.Value)
                                IsMatch = false;
                        }
                        if (IsMatch) {
                            FindedData = SubData;
                            break;
                        }                        
                    }
                    if (FindedData) {
                        Data = FindedData;
                    }
                    else {
                        DataManager.Instance.LogWarning(`${this.XlsName}：找不到匹配的数据，创建一个`);
                        FindedData = {};
                        for (let Col of Keys) {
                            FindedData[Col.PosList[Col.PosList.length - 1]] = Col.Value;
                        }
                        Data.push(FindedData);
                        Data = FindedData;
                    }
                }
                else {
                    DataManager.Instance.LogError(`${this.XlsName}：当前数据不是数组`);
                    return undefined;
                }
            }
            if (LayerName) {
                let SubData = Data[LayerName];
                if (SubData) {
                    Data = SubData;
                }
                else{
                    DataManager.Instance.LogWarning(`${this.XlsName}的数据中不存在成员[${LayerName}]，创建一个`);
                    Data[LayerName] = [];
                    Data = Data[LayerName];
                }
            }
            else {
                break;
            }
            Layer++;
        }
        return Data;
    }
    protected TranslateSheetData(Sheet: ExcelJS.Worksheet, Row: ExcelJS.Row, StructInfo: StructDescInfo, Data: any): boolean {
        for (let Member of StructInfo.Members) {
            if (!Member.HideInXls) {
                let Item = EditorExtend.Instance.StringToStruct(Row.getCell(Member.Name).text, Member.Type, Member.ExtendType, Member.IsArray);
                if (Item === undefined) {
                    DataManager.Instance.LogError(`${this.XlsName}的表[${Sheet.name}]的列[${Member.Name}]数据解析失败`);
                    return false;
                }
                else {
                    Data[Member.Name] = Item;
                }
            }
            else {
                Data[Member.Name] = EditorExtend.Instance.CreateObject(Member.Type, Member.ExtendType, Member.IsArray);
            }
        }
        return true;
    }
    protected SheetToObject(Sheet: ExcelJS.Worksheet, DataSource: string, AdditionalColumns: XlsAdditionalColumnInfo[], StructInfo: StructDescInfo, Data: any): boolean {
        let AddColList = new Array<AdditionalColInfo>();
        for (let Col of AdditionalColumns) {
            let PosList = Col.DataSource.split('.');
            let Member = StructInfo.GetChildInfo(PosList);
            if (Member instanceof StructMemberDescInfo) {
                AddColList.push(new AdditionalColInfo(Col.Name, PosList, Member));
            }
            else {
                DataManager.Instance.LogError(`结构[${StructInfo.Name}]中不存在成员[${Col.DataSource}]`);
            }                
        }
        let ParentData;
        let IsArray = false;
        let MemberName = "";
        let CurStructInfo = StructInfo;
        if (DataSource.length > 0) {
            let PosList = DataSource.split('.');
            MemberName = PosList[PosList.length - 1];
            PosList = PosList.slice(0, PosList.length - 1);
            CurStructInfo = StructInfo.GetChildInfo(PosList) as StructDescInfo;
            if (CurStructInfo && CurStructInfo instanceof StructDescInfo) {
                let Member = CurStructInfo.GetMember(MemberName);
                if (Member) {
                    IsArray = Member.IsArray;
                    CurStructInfo = EditorExtend.Instance.GetStructInfo(Member.Type);
                    if (!CurStructInfo) {
                        DataManager.Instance.LogError(`缺少[${Member.Type}]的结构描述信息`);
                        return false;
                    }                    
                }
                else {
                    DataManager.Instance.LogError(`结构[${CurStructInfo.Name}]中不存在成员[${MemberName}]`);
                    return false;
                }
            }
            else {
                DataManager.Instance.LogError(`结构[${StructInfo.Name}]中不存在成员[${PosList.join('.')}]`);
                return false;
            }
            if (AddColList.length == 0) {
                ParentData = EditorExtend.GetChildData(Data, PosList);
                if (ParentData === undefined) {
                    DataManager.Instance.LogError(`数据中中不存在成员[${PosList.join('.')}]`);
                    return false;
                }
            }
            if (IsArray && ParentData) {
                if (ParentData[MemberName] === undefined) {
                    ParentData[MemberName] = [];
                }
            }
        }

        
        
        for (let i = 4; i <= Sheet.rowCount; i++) {
            let Row = Sheet.getRow(i);           
            if (AddColList.length) {
                for (let Col of AddColList) {
                    Col.Value = EditorExtend.Instance.StringToStruct(Row.getCell(Col.Name).text, Col.Member.Type, Col.Member.ExtendType, Col.Member.IsArray);
                    if (Col.Value === undefined) {
                        DataManager.Instance.LogError(`${this.XlsName}的表[${Sheet.name}]的列[${Col.Name}]数据解析失败`);
                        return false;
                    }
                }
                ParentData = this.FindObject(Data, AddColList);
                if (!ParentData) {
                    return false;
                }
            }
            let SheetData;
            if (ParentData) {
                SheetData = {};
                if (IsArray) {
                    if (ParentData[MemberName] === undefined) {
                            ParentData[MemberName] = [];
                    }
                    ParentData[MemberName].push(SheetData);
                }
                else {
                    ParentData[MemberName] = SheetData;
                }
            }
            else {
                SheetData = Data;
            }          
            if (!this.TranslateSheetData(Sheet, Row, CurStructInfo, SheetData))
                return false;
            if (!IsArray)
                break;            
        }
        return true;
    }
    public XlsToObject(Book: ExcelJS.Workbook, TypeName: string): any {
        let StructInfo = EditorExtend.Instance.GetStructInfo(TypeName);
        if (StructInfo) {
            let Data = {};
            for (let SheetInfo of this.Sheets) {
                let Sheet = Book.getWorksheet(SheetInfo.SheetName);
                if (Sheet) {
                    if (this.ParserXlsColumns(Sheet)) {
                        if (this.CheckSheetHeader(Sheet, SheetInfo.DataSource, SheetInfo.AdditionalColumns, StructInfo)) {
                            if (!this.SheetToObject(Sheet, SheetInfo.DataSource, SheetInfo.AdditionalColumns, StructInfo, Data))
                                return null;
                        }
                    }
                }                
                else {
                    DataManager.Instance.LogError(`${this.XlsName}的Sheet表[${SheetInfo.SheetName}]不存在`);
                    return null;
                }
            }
            if (this.SheetsFromList) {
                let PosList = this.SheetsFromList.SheetDataSource.split('.');
                let TargetInfo = StructInfo.GetChildInfo(PosList);                
                if (TargetInfo instanceof StructDescInfo) {
                    let TargetData;
                    if (PosList.length > 0) {
                        let DataName = PosList[PosList.length - 1];
                        PosList = PosList.slice(0, PosList.length - 1);
                        TargetData = EditorExtend.GetChildData(Data, PosList);
                        if (TargetData) {
                            TargetData[DataName] = [];
                            TargetData = TargetData[DataName];
                        }
                        else {
                            DataManager.Instance.LogError(`数据${TypeName}中不存在成员[${PosList}]`);
                        }
                    }
                    else {
                        TargetData = Data = [];
                    }
                    if (TargetData && TargetData instanceof Array) {
                        for (let Sheet of Book.worksheets) {
                            if (this.Sheets.find((Info) => { return Sheet.name == Info.SheetName; }))
                                continue;
                            if (this.ParserXlsColumns(Sheet)) {
                                if (this, this.CheckSheetHeader(Sheet, this.SheetsFromList.DataMember, this.SheetsFromList.AdditionalColumns, TargetInfo)) {
                                    let EntryData = {};
                                    EntryData[this.SheetsFromList.SheetNameMember] = Sheet.name;
                                    //EntryData[this.SheetsFromList.DataMember] = [];
                                    if (this.SheetToObject(Sheet, this.SheetsFromList.DataMember, this.SheetsFromList.AdditionalColumns, TargetInfo, EntryData)) {
                                        TargetData.push(EntryData);
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    DataManager.Instance.LogError(`结构${TypeName}中不存在成员[${PosList}]`);
                }
            }            
            return Data;
        }
        else {
            DataManager.Instance.LogError(`${this.XlsName}的结构[${TypeName}]的描述信息不存在`);
            return null;
        }
    }
    public XlsToStruct<T>(Book: ExcelJS.Workbook, C: { new(): T }): T {
        let Data = new C();        
        return Data;
    }
}

export class EditorEntryInfo {
    Name: string;
    DataSource: string;
    IsTreeItem = false;
    TreeNameMember: string;
    TreeDataMember: string;
    public static CloneFrom(Value: any) {
        let Info = new EditorEntryInfo();
        Info.Name = Value.Name;
        Info.DataSource = Value.DataSource;
        if (Value.IsTreeItem)
            Info.IsTreeItem = true;
        if (Info.IsTreeItem) {
            Info.TreeNameMember = Value.TreeNameMember;
            Info.TreeDataMember = Value.TreeDataMember;
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.Name !== undefined && this.DataSource !== undefined && ((!this.IsTreeItem) || (this.TreeNameMember !== undefined && this.TreeDataMember !== undefined));
    }
}

export class EditorUIInfo {
    Name: string;
    StructName: string;
    Enable: boolean;
    EditorEntrys = new Array<EditorEntryInfo>();
    public static CloneFrom(Value: any) {
        let Info = new EditorUIInfo();
        Info.Name = Value.Name;
        Info.StructName = Value.StructName;
        Info.Enable = Value.Enable;
        if (Value.EditorEntrys && typeof Value.EditorEntrys == "object" && Value.EditorEntrys instanceof Array) {
            for (let Data of Value.EditorEntrys) {
                let Entry = EditorEntryInfo.CloneFrom(Data);
                if (Entry.IsValid()) {
                    Info.EditorEntrys.push(Entry);
                }
                else {
                    Info.StructName = undefined;
                    return Info;
                }
            }
        }
        return Info;
    }
    public IsValid(): boolean {
        return this.Name !== undefined && this.StructName !== undefined;
    }
    //protected GetEntryByDataSource(DataSource: string): EditorEntryInfo {
    //    for (let Entry of this.EditorEntrys) {
    //        if (Entry.DataSource == DataSource)
    //            return Entry;
    //    }
    //    return null;
    //}
    //protected static CreateListViewHeader(lvList: ListView, StructInfo: StructDescInfo): void {
    //    for (let Member of StructInfo.Members) {
    //        if (!Member.HideInEditorList) {
    //            lvList.AddColumn(Member.ShowName);
    //        }
    //    }
    //}
    public static InitListView(lvList: ListView, DataType: string): boolean {
        let StructInfo = EditorExtend.Instance.GetStructInfo(DataType);
        if (StructInfo) {
            for (let Member of StructInfo.Members) {
                if (!Member.HideInEditorList) {
                    lvList.AddColumn(Member.ShowName);
                }
            }
            return true;
        }
        else {
            DataManager.Instance.LogError(`结构[${DataType}]的描述信息不存在`);
        }
        return false;
    }
    public static FillListViewItem(lvList: ListView, Item: number, StructInfo: StructDescInfo | string, Data: any): void {
        let Col = 0;
        if (typeof StructInfo == "string") {
            let TypeName = StructInfo;
            StructInfo = EditorExtend.Instance.GetStructInfo(TypeName);
            if (!StructInfo) {
                DataManager.Instance.LogError(`结构[${TypeName}]的描述信息不存在`);
                return;
            }
        }
        for (let Member of StructInfo.Members) {
            if (!Member.HideInEditorList) {
                let ItemData = Data[Member.Name];
                if (ItemData !== undefined) {
                    lvList.SetItem(Item, Col, EditorExtend.Instance.StructToString(ItemData, Member.Type, Member.ExtendType));
                }
                Col++;
            }
        }
    }
    public static FillListView(lvList: ListView, Data: any, DataType: string): boolean {
        let StructInfo = EditorExtend.Instance.GetStructInfo(DataType);
        if (StructInfo) {
            if (Data instanceof Array) {
                for (let i = 0; i < Data.length; i++) {
                    let Item = lvList.InsertRow();
                    EditorUIInfo.FillListViewItem(lvList, Item, StructInfo, Data[i]);
                    lvList.SetRowData(Item, { Data: Data[i], Type: StructInfo.Name, UIInfo: this });
                }
            }
            else {
                let Item = lvList.InsertRow();
                EditorUIInfo.FillListViewItem(lvList, Item, StructInfo, Data);
                lvList.SetRowData(Item, { Data: Data, Type: StructInfo.Name, UIInfo: this });
            }
            return true;
        }
        else {
            DataManager.Instance.LogError(`结构[${DataType}]的描述信息不存在`);
        }
        return false;
    }
}


export class DisplayTranslaterInfo {
    TypeName: string;
    DataSource: string[] = [];
    KeyName: string;
    KeyType: string;
    DataName: string;
    NextTranslater: string = "";
    DisplayMap = new Map<number | Long | string, string>();
    public static CloneFrom(Value: any) {
        let Info = new DisplayTranslaterInfo();
        if (typeof Value.TypeName == "string")
            Info.TypeName = Value.TypeName;
        if (typeof Value.DataSource == "string" && Value.DataSource.length > 0) {
            Info.DataSource = Value.DataSource.split(".");
        }
        if (typeof Value.KeyName == "string")
            Info.KeyName = Value.KeyName;
        if (typeof Value.DataName == "string")
            Info.DataName = Value.DataName;
        if (Value.NextTranslater)
            Info.NextTranslater = Value.NextTranslater;
        return Info;
    }
    public IsValid(): boolean {
        return this.TypeName !== undefined && this.DataSource.length > 0 &&
            this.KeyName !== undefined && this.DataName !== undefined;
    }
    public FillMap(Data: any, DataSource: string[]) {
        if (Data && typeof Data == "object") {
            if (DataSource.length > 0) {
                let Member = DataSource[0];
                DataSource = DataSource.slice(1);
                if (Data instanceof Array) {
                    for (let Entry of Data) {
                        this.FillMap(Entry[Member], DataSource);
                    }
                }
                else {
                    this.FillMap(Data[Member], DataSource);
                }
            }
            else {
                if (Data instanceof Array) {
                    for (let Child of Data) {
                        let Key = Child[this.KeyName];
                        let Value = Child[this.DataName];
                        if (Key !== undefined && Value !== undefined)
                            this.AddKeyValue(Key, Value.toString());
                    }
                }
                else {
                    let Key = Data[this.KeyName];
                    let Value = Data[this.DataName];
                    if (Key !== undefined && Value !== undefined)
                        this.AddKeyValue(Key, Value.toString());
                }
            }
        }
    }
    protected AddKeyValue(Key: any, Value: string) {
        if (this.KeyType === undefined) {
            this.KeyType = typeof Key;
            if (this.KeyType == "object") {
                if (Key instanceof Long) {
                    this.KeyType = "Long";
                }
                else {
                    DataManager.Instance.LogError(`类型[${this.TypeName}]的类型转换器的Key(${Key})类型不支持`);
                    return;
                }
            }
            else if (this.KeyType != "number" && this.KeyType != "string") {
                DataManager.Instance.LogError(`类型[${this.TypeName}]的类型转换器的Key(${Key})类型不支持`);
                return;
            }
        }
        this.DisplayMap.set(Key, Value);
    }
}


export class EditorExtend {
    protected static m_Instance: EditorExtend;
    public static get Instance(): EditorExtend {
        if (!EditorExtend.m_Instance) {
            EditorExtend.m_Instance = new EditorExtend();
        }
        return EditorExtend.m_Instance;
    }

    protected m_Title = "配置编辑器";
    protected m_EnumDescMap = new Map<string, EnumDescInfo>();
    protected m_StructDescMap = new Map<string, StructDescInfo>();
    protected m_FormatDescMap = new Map<string, FormatDescInfo>();
    protected m_XlsTranslaterMap = new Map<string, XlsTranslater>();
    protected m_EditorUIMap = new Map<string, EditorUIInfo>();
    protected m_PresetTypeList = new Array<PresetTypeInfo>();
    protected m_DisplayTranslaterList = new Map<string, DisplayTranslaterInfo>();

    public get Title() {
        return this.m_Title;
    }

    public AddEditorExtend(Data: any) {
        if (Data.EditorConfig && typeof Data.EditorConfig == "object") {
            if (Data.EditorConfig.Title)
                this.m_Title = Data.EditorConfig.Title;
        }
        if (Data.EnumList && typeof Data.EnumList == "object" && Data.EnumList instanceof Array) {
            let Count = 0;
            let MergeCount = 0;
            for (let Item of Data.EnumList) {
                let Info = EnumDescInfo.CloneFrom(Item);
                if (Info.IsValid()) {
                    let ExistInfo = this.m_EnumDescMap.get(Info.Name);
                    if (ExistInfo) {
                        ExistInfo.Merge(Info);
                        MergeCount++;
                    }
                    else {
                        this.m_EnumDescMap.set(Info.Name, Info);
                        Count++;
                    }
                    
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个枚举，合并了${MergeCount}个枚举`);
        }
        if (Data.StructList && typeof Data.StructList == "object" && Data.StructList instanceof Array) {
            let Count = 0;
            for (let Item of Data.StructList) {
                let Info = StructDescInfo.CloneFrom(Item);
                if (Info.IsValid()) {
                    this.m_StructDescMap.set(Info.Name, Info);
                    Count++;
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个结构`);
        }
        if (Data.FormatDescList && typeof Data.FormatDescList == "object" && Data.FormatDescList instanceof Array) {
            let Count = 0;
            for (let Item of Data.FormatDescList) {
                let Info = FormatDescInfo.CloneFrom(Item);
                if (Info.IsValid()) {
                    this.m_FormatDescMap.set(Info.TypeName, Info);
                    Count++;
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个格式说明`);
        }
        if (Data.XlsTranslaterList && typeof Data.XlsTranslaterList == "object" && Data.XlsTranslaterList instanceof Array) {
            let Count = 0;
            for (let Item of Data.XlsTranslaterList) {
                let Info = XlsTranslater.CloneFrom(Item);
                if (Info.IsValid()) {
                    this.m_XlsTranslaterMap.set(Info.StructName, Info);
                    Count++;
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个Xls转换器`);
        }
        if (Data.EditorUIList && typeof Data.EditorUIList == "object" && Data.EditorUIList instanceof Array) {
            let Count = 0;
            for (let Item of Data.EditorUIList) {
                let Info = EditorUIInfo.CloneFrom(Item);
                if (Info.IsValid()) {
                    this.m_EditorUIMap.set(Info.StructName, Info);
                    Count++;
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个编辑器UI信息`);
        }
        if (Data.PresetTypeList && typeof Data.PresetTypeList == "object" && Data.PresetTypeList instanceof Array) {
            let Count = 0;
            for (let Item of Data.PresetTypeList) {
                let Info = PresetTypeInfo.CloneFrom(Item);
                if (Info.IsValid()) {
                    this.m_PresetTypeList.push(Info);
                    Count++;
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个预置结构类型`);
        }
        if (Data.DisplayTranslaterList && typeof Data.DisplayTranslaterList == "object" && Data.DisplayTranslaterList instanceof Array) {
            let Count = 0;
            for (let Item of Data.DisplayTranslaterList) {
                let Info = DisplayTranslaterInfo.CloneFrom(Item);
                if (Info.IsValid()) {
                    this.m_DisplayTranslaterList.set(Info.TypeName, Info);
                    Count++;
                }
            }
            DataManager.Instance.LogInfo(`已加载${Count}个显示转换器`);
        }
    }

    

    public RebuildDisplayTranslater(DataType?: string) {
        for (let Info of this.m_DisplayTranslaterList.values()) {
            if ((!DataType) || DataType == Info.DataSource[0]) {
                Info.DisplayMap.clear();
                let DataSource = Info.DataSource;
                let Data = DataManager.Instance.GetConfigData(DataSource[0]);
                if (Data)
                    Info.FillMap(Data, DataSource.slice(1));
            }
        }
    }

    public GetEnumInfo(EnumName: string): EnumDescInfo {
        return this.m_EnumDescMap.get(EnumName);
    }
    public GetStructInfo(StructName: string): StructDescInfo {
        return this.m_StructDescMap.get(StructName);
    }
    public GetFormatDescInfo(TypeName: string): FormatDescInfo {
        return this.m_FormatDescMap.get(TypeName);
    }
    public GetXlsTranslater(TypeName: string): XlsTranslater {
        return this.m_XlsTranslaterMap.get(TypeName);
    }
    public GetXlsTranslaterByXlsName(XlsName: string): XlsTranslater {
        for (let pair of this.m_XlsTranslaterMap) {
            if (pair[1].XlsName.toLowerCase() == XlsName.toLowerCase())
                return pair[1];
        }
        return null;
    }
    public GetEditUIInfo(TypeName: string): EditorUIInfo {
        return this.m_EditorUIMap.get(TypeName);
    }
    public get PresetTypeList(): PresetTypeInfo[] {
        return this.m_PresetTypeList;
    }
    public static GetChildData(Data: any, PosList: string[]): any {
        for (let i = 0; i < PosList.length; i++) {
            if (PosList[i].length > 0) {
                let MemberName = PosList[i];
                Data = Data[MemberName];
                if (!Data) {
                    DataManager.Instance.LogError(`对象中不存在成员[${MemberName}]`);
                    return null;
                }
            }            
        }
        return Data;
    }
    public static GetChildDataByDataSource(Data: any, DataSource: string): any {
        if (typeof DataSource == "string" && DataSource.length > 0) {
            let PosList = DataSource.split('.');
            return EditorExtend.GetChildData(Data, PosList);
        }
        else {
            return Data;
        }        
    }
    public StructToString(Value: any, TypeName: string, ExtendType: string, OrginValue?: boolean): string {
        switch (typeof Value) {
            case "boolean":
                return Value ? "true" : "false";
            case "number":
                if (OrginValue) {
                    return Value.toString();
                }
                else {
                    return this.DisplayTranslate(Value, ExtendType);
                }                
            case "string":
                if (OrginValue) {
                    if (TypeName == "Variant")
                        return `\"${Value}\"`;
                    else
                        return Value;
                }
                else {
                    return this.DisplayTranslate(Value, ExtendType);
                }                
            case "object":
                if (TypeName == "Variant") {
                    return JSON_INT64.stringify(Value);
                }
                else {
                    if (Value instanceof Array) {
                        let StrArray = [];
                        for (let e of Value) {
                            StrArray.push(EditorExtend.Instance.StructToString(e, TypeName, ExtendType, OrginValue));
                        }
                        return `[${StrArray.join(',')}]`;
                    }
                    else if (Value instanceof Long) {
                        if (OrginValue) {
                            return Value.toString();
                        }
                        else {
                            return this.DisplayTranslate(Value, ExtendType);
                        }                        
                    }
                    else {
                        let StructInfo = EditorExtend.Instance.GetStructInfo(TypeName);
                        if (StructInfo) {
                            let Strs = [];
                            for (let Member of StructInfo.Members) {
                                Strs.push(EditorExtend.Instance.StructToString(Value[Member.Name], Member.Type, Member.ExtendType, OrginValue));
                            }
                            return `{${Strs.join('|')}}`;
                        }
                    }
                }
                break;
        }
        return `${TypeName}=${ExtendType}`;
    }
    public static SplitStr(Str: string, Splitter: string, BracketLeft: string, BracketRight: string): string[] {
        let StrArray = [];
        Str = Str.trim();
        if (Str.startsWith(BracketLeft)) {
            if (!Str.endsWith(BracketRight))
                return undefined;
            Str = Str.slice(1, Str.length - 1);
        }
        let Header = 0;
        let SBCount = 0;
        let BCount = 0;
        for (let i = 0; i < Str.length; i++) {
            if (SBCount > 0) {
                if (Str[i] == ']')
                    SBCount--;
            }
            if (BCount > 0) {
                if (Str[i] == '}')
                    BCount--;
            }

            switch (Str[i]) {
                case '[':
                    SBCount++;
                    break;
                case '{':
                    BCount++;
                    break;
                case Splitter:
                    if (SBCount <= 0 && BCount <= 0) {
                        StrArray.push(Str.slice(Header, i));
                        Header = i + 1;
                        break;
                    }
            }
        }
        if (SBCount > 0 || BCount > 0)
            return undefined;
        if (Header < Str.length)
            StrArray.push(Str.slice(Header));
        return StrArray
    }
    public StringToStruct(Str: string, TypeName: string, ExtendType: string, IsArray: boolean): any {
        if (IsArray) {
            let StrArray = EditorExtend.SplitStr(Str, ",", "[", "]");
            if (!StrArray)
                return undefined;			
			let ValueArray = [];
            for (let SubStr of StrArray) {
                let Element = EditorExtend.Instance.StringToStruct(SubStr, TypeName, ExtendType, false);
				if (Element !== undefined) {
					ValueArray.push(Element);
				}
				else {
					DataManager.Instance.LogError(`数组${Str}解析失败`);
					return undefined;
				}
			}
			return ValueArray;
		}
        else {
            try {
                switch (TypeName) {
                    case "bool":
                    case "boolean":
                        return Str.toLowerCase().trim() == "true";
                    case "char":
                        return parseInt(Str);
                    case "BYTE":
                        if (Str.length)
                            return Long.fromString(Str, true).toNumber();
                        else
                            return 0;
                    case "short":
                        return parseInt(Str);
                    case "WORD":
                        if (Str.length)
                            return Long.fromString(Str, true).toNumber();
                        else
                            return 0;
                    case "int":
                        return parseInt(Str);
                    case "UINT":
                        if (Str.length)
                            return Long.fromString(Str, true).toNumber();
                        else
                            return 0;
                    case "INT64":
                        if (Str.length)
                            return Long.fromString(Str, false);
                        else
                            return Long.ZERO;
                    case "UINT64":
                        if (Str.length)
                            return Long.fromString(Str, true);
                        else
                            return Long.ZERO;
                    case "float":
                    case "double":
                        return parseFloat(Str);
                    case "number":
                        Str = Str.toLowerCase();
                        if (Str.indexOf('.') || Str.indexOf('e'))
                            return parseFloat(Str);
                        else
                            return parseInt(Str);
                    case "String":
                    case "string":
                        return Str;
                    case "Long":
                        if (Str.length)
                            return Long.fromString(Str);
                        else
                            return Long.ZERO;
                    case "Variant":
                        Str = Str.trim();
                        if (Str.startsWith('[') || Str.startsWith('{')) {
                            return JSON_INT64.parse(Str);
                        }
                        else if (Str.startsWith('\"')) {
                            Str = Str.slice(1, Str.length - 1);
                            return Str;
                        }
                        else if (Str.toLowerCase() == "true") {
                            return true;
                        }
                        else if (Str.toLowerCase() == "false") {
                            return false;
                        }
                        else if (Str.toLowerCase() == "null") {
                            return null;
                        }
                        else {
                            Str = Str.toLowerCase();
                            if (Str.indexOf('.') || Str.indexOf('e'))
                                return parseFloat(Str);
                            else
                                return parseInt(Str);
                        }
                        break;
                    default:
                        {
                            let EnumInfo = EditorExtend.Instance.GetEnumInfo(TypeName);
                            if (EnumInfo) {
                                if (EnumInfo.Is64Bit)
                                    return this.StringToStruct(Str, "UINT64", "", IsArray);
                                else
                                    return this.StringToStruct(Str, "UINT", "", IsArray);
                            }
                            let StructInfo = EditorExtend.Instance.GetStructInfo(TypeName);
                            if (StructInfo) {                               
                                let Strs = EditorExtend.SplitStr(Str, "|", "{", "}");
                                if (Strs && Strs.length >= StructInfo.Members.length) {
                                    let Value = {};
                                    for (let i = 0; i < StructInfo.Members.length; i++) {
                                        let Member = StructInfo.Members[i];
                                        let Data = EditorExtend.Instance.StringToStruct(Strs[i], Member.Type, Member.ExtendType, Member.IsArray);
                                        if (Data !== undefined)
                                            Value[Member.Name] = Data;
                                        else
                                            return undefined;
                                    }
                                    return Value;
                                }
                            }
                        }
                        break;
                }
            }
            catch (e) {
                DataManager.Instance.LogError(`${e}`);
                return undefined;
            }            
		}
		return undefined;
    }
    
    public CreateObject(TypeName: string, ExtendType: string, IsArray: boolean): any {
        if (IsArray)
            return [];
        switch (TypeName) {
            case "bool":
            case "boolean":
                return false;
            case "char":
            case "BYTE":
            case "short":
            case "WORD":
            case "int":
            case "UINT":
            case "float":
            case "double":
            case "number":
                return 0;
            case "INT64":
                return Long.ZERO;
            case "UINT64":
                return Long.ZERO;
            case "String":
            case "string":
                return "";
            case "any":
            case "Variant":
                if (ExtendType.length) {
                    if (ExtendType.endsWith("[]")) {
                        return [];
                    }
                    else {
                        return this.CreateObject(ExtendType, "", IsArray);
                    }
                }
                return 0;
            default:
                {
                    let EnumInfo = this.GetEnumInfo(TypeName);
                    if (EnumInfo) {
                        if (EnumInfo.IsFlag)
                            return 0;
                        else
                            return EnumInfo.Members[0].GetValue(EnumInfo.Is64Bit);
                    }
                    let StructInfo = this.GetStructInfo(TypeName);
                    if (StructInfo) {
                        let Obj = {};
                        for (let Member of StructInfo.Members) {
                            let MemberValue = this.CreateObject(Member.Type, Member.ExtendType, Member.IsArray);
                            if (MemberValue !== undefined) {
                                Obj[Member.Name] = MemberValue;
                            }
                            else {
                                return undefined;
                            }
                        }
                        return Obj;
                    }
                }
                break;
        }
        return undefined;
    }

    public CorrectValueType(Value: any, TypeName: string, ExtendType: string, IsArray: boolean): any {
        if (IsArray) {
            if (typeof Value != "object" || !(Value instanceof Array)) {
                return [];
            }
            else {
                for (let i = 0; i < Value.length; i++) {
                    Value[i] = this.CorrectValueType(Value[i], TypeName, ExtendType, false);
                }
            }
        }
        else {
            switch (TypeName) {
                case "bool":
                case "boolean":
                    if (typeof Value != "boolean") {
                        DataManager.Instance.LogError(`值与要求类型[${TypeName}]不符，已强制转换`);
                        if (typeof Value == "number")
                            return Boolean(Value);
                        else
                            return false;
                    }
                    break;
                case "char":
                case "BYTE":
                case "short":
                case "WORD":
                case "int":
                case "UINT":
                case "float":
                case "double":
                case "number":
                    if (typeof Value != "number") {
                        DataManager.Instance.LogError(`值与要求类型[${TypeName}]不符，已强制转换`);
                        if (typeof Value == "string")
                            return Number(Value);
                        else
                            return 0;
                    }
                    break;
                case "INT64":
                case "UINT64":
                    if (typeof Value != "object" || !(Value instanceof Long)) {
                        DataManager.Instance.LogError(`值与要求类型[${TypeName}]不符，已强制转换`);
                        if (typeof Value == "string")
                            return Long.fromString(Value);
                        else if (typeof Value == "number")
                            return Long.fromNumber(Value);
                        else
                            return 0;

                    }
                    break;
                case "String":
                case "string":
                    if (typeof Value != "string") {
                        DataManager.Instance.LogError(`值与要求类型[${TypeName}]不符，已强制转换`);
                        return String(Value);
                    }
                    break;
                default:
                    {
                        let EnumInfo = this.GetEnumInfo(TypeName);
                        if (EnumInfo) {
                            if (EnumInfo.Is64Bit)
                                return this.CorrectValueType(Value, "UINT64", ExtendType, false);
                            else
                                return this.CorrectValueType(Value, "UINT", ExtendType, false);
                        }
                        let StructInfo = this.GetStructInfo(TypeName);
                        if (StructInfo) {
                            if (typeof Value != "object") {
                                DataManager.Instance.LogError(`值与要求类型[${TypeName}]不符，已强制转换`);
                                return this.CreateObject(TypeName, ExtendType, IsArray);
                            }
                            else {
                                for (let Member of StructInfo.Members) {
                                    if (Value[Member.Name] === undefined) {
                                        Value[Member.Name] = this.CreateObject(Member.Type, Member.ExtendType, Member.IsArray);
                                    }
                                    else {
                                        Value[Member.Name] = this.CorrectValueType(Value[Member.Name], Member.Type, Member.ExtendType, Member.IsArray);
                                    }
                                }
                            }                            
                        }
                    }
                    break;
            }
        }
        
        return Value;
    }
    public CheckValue(Obj: any, TypeName: string, ExtendType: string, IsArray: boolean): boolean {
        if (IsArray) {
            if (typeof Obj == "object" && Obj instanceof Array) {
                for (let Child of Obj) {
                    if (!this.CheckValue(Child, TypeName, ExtendType, false))
                        return false;
                }
            }
        }
        else {
            switch (TypeName) {
                case "bool":
                case "boolean":
                    return typeof Obj == "boolean";
                case "char":
                case "BYTE":
                case "short":
                case "WORD":
                case "int":
                case "UINT":
                case "float":
                case "double":
                case "number":
                    return typeof Obj == "number";
                case "INT64":
                case "UINT64":
                    return typeof Obj == "object" && Obj instanceof Long;
                case "String":
                case "string":
                    return typeof Obj == "string";
                case "any":
                case "Variant":
                    if (ExtendType) {
                        return this.CheckValue(Obj, ExtendType, "", IsArray);
                    }
                    else {
                        return true;
                    }
                default:
                    if (typeof Obj == "object") {
                        let StructInfo = this.GetStructInfo(TypeName);
                        if (StructInfo) {
                            for (let Member of StructInfo.Members) {
                                if (Obj[Member.Name] === undefined)
                                    return false;
                            }
                            return true;
                        }
                    }
            }
        }        
        return false;
    }
    public NewArrayElement(array: any[], ElementType: string, ExtendType: string, NewPos: number): any {
        let NewElement = undefined;
        switch (ElementType) {
            case "bool":
            case "boolean":
                NewElement = false;
                break;
            case "char":
            case "BYTE":
            case "short":
            case "WORD":
            case "int":
            case "UINT":
            case "float":
            case "double":
            case "number":
                NewElement = 0;
                break;
            case "INT64":
            case "UINT64":
                NewElement = Long.ZERO;
                break;
            case "String":
            case "string":
                NewElement = "";
                break;
            case "any":
            case "Variant":
                NewElement = 0;
                break;
            default:
                {
                    NewElement = this.CreateObject(ElementType, ExtendType, false);
                    if (NewElement !== undefined) {
                        let StructInfo = this.GetStructInfo(ElementType);
                        if (StructInfo) {
                            let KeyMember = StructInfo.Members.find(function (Member) { return Member.IsKey; });
                            if (KeyMember) {
                                if (typeof NewElement[KeyMember.Name] == "number") {
                                    let NewID = 0;
                                    for (let SubData of array) {
                                        if (SubData[KeyMember.Name] > NewID)
                                            NewID = SubData[KeyMember.Name];
                                    }
                                    NewElement[KeyMember.Name] = NewID + 1;
                                }
                                else if (typeof NewElement[KeyMember.Name] == "object" && NewElement[KeyMember.Name] instanceof Long) {
                                    let NewID = Long.ZERO;
                                    for (let SubData of array) {
                                        if (SubData[KeyMember.Name].greaterThan(NewID))
                                            NewID = SubData[KeyMember.Name];
                                    }
                                    NewElement[KeyMember.Name] = NewID.add(1);
                                }
                            }
                        }
                    }
                }
                break;
        }
        if (NewElement !== undefined) {
            if (NewPos < 0 || NewPos >= array.length) {
                array.push(NewElement);
            }
            else {
                array.splice(NewPos, 0, NewElement);
            }
        }
        return NewElement;
    }

    public ResizeArray(array: any[], ElementType: string, ExtendType: string, NewSize: number): boolean {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === undefined || array[i] == null)
                array[i] = this.NewArrayElement(array, ElementType, ExtendType, array.length);
        }
        if (array.length >= NewSize)
            return true;
        let AddSize = NewSize - array.length;
        for (let i = 0; i < AddSize; i++) {
            let NewElement = this.NewArrayElement(array, ElementType, ExtendType, array.length);
            if (NewElement == undefined)
                return false;
        }
        return true;
    }
    public CompleteObject(Obj: any, TypeName: string, Recursion?: boolean): number {
        let StructInfo = this.GetStructInfo(TypeName);
        if (StructInfo) {
            return StructInfo.CompleteObject(Obj, Recursion);
        }
        return 0;
    }

    public GetStructMemberCount(TypeName: string, Recursion?: boolean): number {
        let StructInfo = this.GetStructInfo(TypeName);
        if (StructInfo)
            return StructInfo.GetStructMemberCount(Recursion);
        else
            return 0;
    }

    public DisplayTranslate(Value: number | string | Long, ExtendType: string, Deep = 10) {
        if (Deep == 0) {
            DataManager.Instance.LogError(`对于类型[${ExtendType}]的转换递归层数过多`);
            return Value.toString();
        }
        if (typeof Value != "string") {
            switch (ExtendType) {
                case "TIME_SPAN":
                    return DOSSystem.FormatTimeSpan((typeof Value == "number") ? Value : Value.toNumber());
                case "PERCENT":
                    return sprintf("%0.2f%%", ((typeof Value == "number") ? Value : Value.toNumber()) * 100);
                case "PERCENT_100":
                    return sprintf("%0.2f%%", ((typeof Value == "number") ? Value : Value.toNumber()));
                case "PERCENT_1000":
                    return sprintf("%0.2f%%", ((typeof Value == "number") ? Value : Value.toNumber()) / 10);
                case "DATE":
                    {
                        let date = new Date((typeof Value == "number") ? Value : Value.toNumber());
                        return date.toLocaleDateString("zh-CN", { hour12: false, timeZone: "Asia/beijing" })
                    }
                case "TIME":
                    return DOSSystem.FormatTimeSpan((typeof Value == "number") ? Value : Value.toNumber());
                case "DATE_TIME":
                    {
                        let date = new Date((typeof Value == "number") ? Value : Value.toNumber());
                        return date.toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/beijing" })
                    }
            }
        }
        let Translater = this.m_DisplayTranslaterList.get(ExtendType);
        if (Translater) {
            let Key;
            switch (Translater.KeyType) {
                case "number":
                    if (typeof Value == "number")
                        Key = Value;
                    else if (typeof Value == "string")
                        Key = Str2Number(Value);
                    else
                        Key = Value.toNumber();
                    break;
                case "string":
                    Key = Value.toString();
                    break;
                case "Long":
                    if (typeof Value == "number")
                        Key = Long.fromNumber(Value);
                    else if (typeof Value == "string")
                        Key = Long.fromString(Value);
                    else
                        Key = Value;
                    break;
            }
            if (Key !== undefined) {
                let Data = Translater.DisplayMap.get(Key);
                if (Data != undefined) {
                    if (Translater.NextTranslater)
                        return this.DisplayTranslate(Data, Translater.NextTranslater, Deep - 1);
                    else
                        return Data;
                }
            }
        }
        return Value.toString();
    }

//    public static CloneObject(Obj: any): any {
//        let JsonStr = JSON_INT64.stringify(Obj);
//        return JSON_INT64.parse(JsonStr);
//    }
}
