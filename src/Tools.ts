import { DOSSystem } from "./DOSSystem/DOSSystem";
import { Encoding } from "./DOSSystem/Encoding/Encoding";

export function Str2Bool(Str: string): boolean {
    if (Str.toLowerCase() == "true")
        return true;
    else
        return Str2Number(Str) != 0;
};

export function Str2Number(Str: string, Default = 0): number {
    try {
        let Value = Number(Str);
        if (Object.is(Value, NaN))
            Value = Default;
        return Value;
    }
    catch {

    }
    if (Default)
        return Default;
    return 0;
}

export function StrTrim(Str: string, Target: string): string {
    var re = new RegExp(`(^(${Target})+)|(${Target}+$)`, "g");
    return Str.replace(re, "");
}

export function Str2StrArray(Str: string, Splitter: string): string[] {
    if (Str.length > 0) {
        return Str.split(Splitter);
    }
    return [];
}
export function Str2NumberArray(Str: string, Splitter: string, Default = 0): number[] {
    let Strs = Str2StrArray(Str, Splitter);
    let Numbers = [];
    for (let Value of Strs) {
        if (Value) {
            Numbers.push(Str2Number(Value, Default));
        }
        else {
            if (Default != undefined)
                Numbers.push(Default);
            else
                Numbers.push(0);
        }
    }
    return Numbers;
}

export function ParserStringFile(FileData: ArrayBuffer): string {
    let dv = new DataView(FileData);
    if (FileData.byteLength >= 2 && dv.getUint8(0) == 0xFF && dv.getUint8(1) == 0xFE) {
        let StrData = new Uint8Array(FileData, 2);
        return Encoding.UCS2.GetString(StrData);
    }
    else if (FileData.byteLength >= 2 && dv.getUint8(0) == 0xFE && dv.getUint8(1) == 0xFF) {
        let StrData = new Uint8Array(FileData, 2);
        return Encoding.UCS2.GetString(StrData);
    }
    else if (FileData.byteLength >= 3 && dv.getUint8(0) == 0xEF && dv.getUint8(1) == 0xBB && dv.getUint8(2) == 0xBF) {
        let StrData = new Uint8Array(FileData, 3);
        return Encoding.UTF8.GetString(StrData);
    }
    else {
        let StrData = new Uint8Array(FileData, 0);
        return Encoding.GBK.GetString(StrData);
    }
}

export function MakeStringFile(Str: string): ArrayBuffer {
    let BinDataLen = Encoding.UTF8.GetBytes(Str);
    let BinData = new Uint8Array(BinDataLen + 3);
    BinData[0] = 0xEF;
    BinData[1] = 0xBB;
    BinData[2] = 0xBF;
    Encoding.UTF8.GetBytes(Str, BinData, 3, BinDataLen);
    return BinData;
}

export function NormalizeColorStr(Color: string, IsFullColor?: boolean): string {
    if (!Color) {
        if (IsFullColor)
            return "#ffffffff";
        else
            return "#ffffff";
    }
    Color = Color.trim().toLowerCase();
    let Value = 0;
    if (Color.startsWith("rgba")) {
        let Values = Str2NumberArray(Color.substring(5, Color.lastIndexOf(")")), ",");
        for (let i = 0; i < Values.length && i < 3; i++) {
            Value = (Value | (Values[i] << ((2 - i) * 8))) >>> 0;
        }
        if (Values.length >= 4) {
            IsFullColor = true;
            Value = (Value | (Values[3] << 24)) >>> 0;
        }
    }
    else {
        if (Color.startsWith("#"))
            Color = Color.slice(1);
        if (IsFullColor == undefined)
            IsFullColor = (Color.length > 6);
        Value = Str2Number("0x" + Color);
        if (IsFullColor) {
            if (Color.length <= 6)
                Value = (Value | 0xFF000000) >>> 0;
        }
        else {
            Value = (Value & 0xFFFFFF) >>> 0;
        }
    }
    if (IsFullColor)
        return `#${DOSSystem.FormatHex(Value, 8)}`;
    else
        return `#${DOSSystem.FormatHex(Value, 6)}`;
}
export function GetColorStrFromFullColor(FullColor: string): string {
    FullColor = FullColor.trim().toLowerCase();
    if (FullColor.startsWith("#"))
        FullColor = FullColor.slice(1);
    let Value = Str2Number("0x" + FullColor);
    Value = Value & 0xFFFFFF;
    return `#${DOSSystem.FormatHex(Value, 6)}`;
}

export function GetAlphaFromFullColor(FullColor: string): number {
    FullColor = FullColor.trim().toLowerCase();
    if (FullColor.startsWith("#"))
        FullColor = FullColor.slice(1);
    if (FullColor.length <= 6)
        return 255;
    let Value = Str2Number("0x" + FullColor);
    Value = ((Value >> 24) & 0xFF);
    return Value;
}

export function ColorStr2Number(Color: string): number {
    Color = Color.trim().toLowerCase();
    if (Color.startsWith("#"))
        Color = Color.slice(1);
    let Value = Str2Number("0x" + Color) >>> 0;
    if (Color.length <= 6) {
        Value = (0xFF000000 | Value) >>> 0;
    }
    return Value;
}

export function DecomposeColor(Color: string): number[] {
    let Values = [];
    let Value = ColorStr2Number(Color);
    Values[0] = (Value >> 16) & 0xFF;
    Values[1] = (Value >> 8) & 0xFF;
    Values[2] = Value & 0xFF;
    Values[3] = (Value >> 24) & 0xFF;
    return Values;
}

export function MakeFullColor(Color: string, Alpha: number) {
    Color = Color.trim().toLowerCase();
    if (Color.startsWith("#"))
        Color = Color.slice(1);
    let Value = Str2Number("0x" + Color);
    Value = ((Value & 0xFFFFFF) | (Saturate(Math.round(Alpha * 0xFF), 0, 255) << 24)) >>> 0;
    return `#${DOSSystem.FormatHex(Value, 8)}`;
}

export function MakeColor(Red: number, Green: number, Blue: number, Alpha?: number) {
    if (Alpha == undefined) {
        let Value = (((Red & 0xFF) << 16) | ((Green & 0xFF) << 8) | (Blue & 0xFF)) >>> 0;
        return `#${DOSSystem.FormatHex(Value, 6)}`;
    }
    else {
        let Value = (((Alpha & 0xFF) << 24) | ((Red & 0xFF) << 16) | ((Green & 0xFF) << 8) | (Blue & 0xFF)) >>> 0;
        return `#${DOSSystem.FormatHex(Value, 8)}`;
    }
}

export function IsFullColor(Color: string) {
    return Color.trim().length > 7;
}

export function MakeRGBAColor(Color: string): string {
    if (IsFullColor) {
        let Values = DecomposeColor(Color);
        return `rgba(${Values[0]},${Values[1]},${Values[2]},${Values[3] / 255})`;
    }
    return Color;
}

export function Saturate(Value: number, Min: number, Max: number): number {
    if (Value < Min)
        return Min;
    if (Value > Max)
        return Max;
    return Value;
}

export function IsArray(Obj: any): boolean {
    return typeof Obj == "object" && Obj instanceof Array;
}