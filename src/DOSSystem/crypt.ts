import { Encoding } from "./Encoding/Encoding"
import { DOSSystem } from "./DOSSystem"

export class CRCMaker
{
    protected m_chCRCHi: number = 0;
    protected m_chCRCLo: number = 0;
    protected m_wIndex: number = 0;

    // CRC 高位字节值表
    protected static chCRCHTalbe: number[] =
        [
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
            0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
            0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
            0x00, 0xC1, 0x81, 0x40
            ];
    // CRC 低位字节值表
    protected static chCRCLTalbe: number[] =
        [
            0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06, 0x07, 0xC7,
            0x05, 0xC5, 0xC4, 0x04, 0xCC, 0x0C, 0x0D, 0xCD, 0x0F, 0xCF, 0xCE, 0x0E,
            0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09, 0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9,
            0x1B, 0xDB, 0xDA, 0x1A, 0x1E, 0xDE, 0xDF, 0x1F, 0xDD, 0x1D, 0x1C, 0xDC,
            0x14, 0xD4, 0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
            0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3, 0xF2, 0x32,
            0x36, 0xF6, 0xF7, 0x37, 0xF5, 0x35, 0x34, 0xF4, 0x3C, 0xFC, 0xFD, 0x3D,
            0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A, 0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38,
            0x28, 0xE8, 0xE9, 0x29, 0xEB, 0x2B, 0x2A, 0xEA, 0xEE, 0x2E, 0x2F, 0xEF,
            0x2D, 0xED, 0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
            0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60, 0x61, 0xA1,
            0x63, 0xA3, 0xA2, 0x62, 0x66, 0xA6, 0xA7, 0x67, 0xA5, 0x65, 0x64, 0xA4,
            0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F, 0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB,
            0x69, 0xA9, 0xA8, 0x68, 0x78, 0xB8, 0xB9, 0x79, 0xBB, 0x7B, 0x7A, 0xBA,
            0xBE, 0x7E, 0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
            0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71, 0x70, 0xB0,
            0x50, 0x90, 0x91, 0x51, 0x93, 0x53, 0x52, 0x92, 0x96, 0x56, 0x57, 0x97,
            0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C, 0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E,
            0x5A, 0x9A, 0x9B, 0x5B, 0x99, 0x59, 0x58, 0x98, 0x88, 0x48, 0x49, 0x89,
            0x4B, 0x8B, 0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
            0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42, 0x43, 0x83,
            0x41, 0x81, 0x80, 0x40
            ];

    constructor()
    {
        this.CRC16_Fast_Init();
    }
    public CRC16_Fast_Init(): void
    {
        this.m_chCRCHi = 0xFF; // 高CRC字节初始化
        this.m_chCRCLo = 0xFF; // 低CRC字节初始化
        this.m_wIndex = 0; // CRC循环中的索引
    }
    public CRC16_Fast_Append(Data: Uint8Array, StartIndex: number, DataLen: number): void
    {
        for (let i = 0; i < DataLen; i++)
        {
            // 计算CRC
            this.m_wIndex = this.m_chCRCLo ^ Data[StartIndex + i];
            this.m_chCRCLo = this.m_chCRCHi ^ CRCMaker.chCRCHTalbe[this.m_wIndex];
            this.m_chCRCHi = CRCMaker.chCRCLTalbe[this.m_wIndex];
        }
    }

    public CRC16_Fast_Final(): number
    {
        return (this.m_chCRCHi << 8) | this.m_chCRCLo;
    }
};

export class CryptTools
{
    public static readonly DES_BLOCK_SIZE: number = 8;
    public static readonly AES_BLOCK_SIZE: number = 16;

    public static readonly TEA_BLOCK_SIZE: number = 8;
    public static readonly TEA_KEY_SIZE: number = 16;
    public static readonly DEFAULT_TEA_CYCLE: number = 16;

    public static GetUint32Bytes(Num: number): Uint8Array
    {
        let Bytes = new Uint8Array(4);
        Bytes[0] = (Num & 0xFF);
        Bytes[1] = ((Num >>> 8) & 0xFF);
        Bytes[2] = ((Num >>> 16) & 0xFF);
        Bytes[3] = ((Num >>> 24) & 0xFF);
        return Bytes;
    }

    public static MakeCRC(Data: Uint8Array, StartIndex: number, DataLen: number, Key: Uint8Array, MsgSequence: number): number
    {
        let CRC: CRCMaker = new CRCMaker();
        CRC.CRC16_Fast_Init();
        if (Data != null)
            CRC.CRC16_Fast_Append(Data, StartIndex, DataLen);
        if (Key != null)
            CRC.CRC16_Fast_Append(Key, 0, Key.length);
        
        let Temp = CryptTools.GetUint32Bytes(MsgSequence);
        CRC.CRC16_Fast_Append(Temp, 0, Temp.length);
        return CRC.CRC16_Fast_Final();
    }
    static tea_encrypt(Data: Uint32Array, k: Uint32Array, Cycle: number): void
    {
        let sum: number = 0;
        let delta: number = 0x9e3779b9;
        while (Cycle-- > 0)
        {
            sum += delta;
            Data[0] += (Data[1] << 4) + k[0] ^ Data[1] + sum ^ (Data[1] >>> 5) + k[1];
            Data[1] += (Data[0] << 4) + k[2] ^ Data[0] + sum ^ (Data[0] >>> 5) + k[3];
        }
    }
    static tea_decrypt(Data: Uint32Array, k: Uint32Array, Cycle: number): void
    {
        let sum: number;
        let delta: number = 0x9e3779b9;

        if (Cycle == 32)
            sum = 0xC6EF3720; /* delta << 5*/
        else if (Cycle == 16)
            sum = 0xE3779B90; /* delta << 4*/
        else
            sum = delta * Cycle;

        while (Cycle-- > 0) {
            Data[1] -= (Data[0] << 4) + k[2] ^ Data[0] + sum ^ (Data[0] >>> 5) + k[3];
            Data[0] -= (Data[1] << 4) + k[0] ^ Data[1] + sum ^ (Data[1] >>> 5) + k[1];
            sum -= delta;
        }
    }

    static BytesToUints(Bytes: Uint8Array, StartIndex: number, Uints: Uint32Array, WordCount: number): boolean
    {
        if ((Bytes.length - StartIndex >= WordCount * 4) && (Uints.length >= WordCount)) {
            for (let i = 0; i < WordCount; i++)
            {
                let j:number = i * 4 + StartIndex;
                Uints[i] = (Bytes[j]) | (Bytes[j + 1] << 8) | (Bytes[j + 2] << 16) | (Bytes[j + 3] << 24);
            }
            return true;
        }
        return false;
    }

    static UintsToBytes(Uints: Uint32Array, Bytes: Uint8Array, StartIndex: number, WordCount: number)
    {
        if ((Bytes.length - StartIndex >= WordCount * 4) && (Uints.length >= WordCount)) {
            for (let i = 0; i < WordCount; i++)
            {
                let j:number = i * 4 + StartIndex;
                Bytes[j] = (Uints[i] & 0xFF);
                Bytes[j + 1] = ((Uints[i] >>> 8) & 0xFF);
                Bytes[j + 2] = ((Uints[i] >>> 16) & 0xFF);
                Bytes[j + 3] = ((Uints[i] >>> 24) & 0xFF);
            }
            return true;
        }
        return false;
    }

    public static MakeTEAKey(Key: string): Uint32Array
    {
        let Len = Encoding.UTF8.GetBytes(Key);
        if (Len >= CryptTools.TEA_KEY_SIZE) {
            let KeyBytes: Uint8Array = new Uint8Array(Len);
            Encoding.UTF8.GetBytes(Key, KeyBytes);
            let KeyWords: Uint32Array = new Uint32Array(Math.floor(CryptTools.TEA_KEY_SIZE / 4));
            CryptTools.BytesToUints(KeyBytes, 0, KeyWords, Math.floor(CryptTools.TEA_KEY_SIZE / 4));

            return KeyWords;
        }
        return null;
    }
    public static TEAEncryptECB(KeyWords: Uint32Array, Cycle: number, Data: Uint8Array, StartIndex: number, DataLen: number): number
    {
        if (KeyWords == null || KeyWords.length < Math.floor(CryptTools.TEA_KEY_SIZE / 4))
        {
            return 0;
        }

        if (Data == null || Data.length < StartIndex + DataLen)
        {
            return 0;
        }

        let BlockCount: number = Math.floor(DataLen / CryptTools.TEA_BLOCK_SIZE) + 1;
        if (Data.length - StartIndex < BlockCount * CryptTools.TEA_BLOCK_SIZE)
        {
            return 0;
        }
        if (DataLen < BlockCount * CryptTools.TEA_BLOCK_SIZE)
        {
            //需要填充
            let Padding: number = (BlockCount * CryptTools.TEA_BLOCK_SIZE - DataLen) & 0xFF;
            for (let i = 0; i < Padding; i++)
            {
                Data[StartIndex + DataLen + i] = Padding;
            }
        }

        let Words: Uint32Array = new Uint32Array(2);
        for (let i = 0; i < BlockCount; i++)
        {
            CryptTools.BytesToUints(Data, StartIndex + i * CryptTools.TEA_BLOCK_SIZE, Words, CryptTools.TEA_BLOCK_SIZE / 4);
            CryptTools.tea_encrypt(Words, KeyWords, Cycle);
            CryptTools.UintsToBytes(Words, Data, StartIndex + i * CryptTools.TEA_BLOCK_SIZE, CryptTools.TEA_BLOCK_SIZE / 4);
        }
        return BlockCount * CryptTools.TEA_BLOCK_SIZE;
    }

    public static TEADecryptECB(KeyWords: Uint32Array, Cycle: number, Data: Uint8Array, StartIndex: number, DataLen: number)
    {
        if (KeyWords == null || KeyWords.length < Math.floor(CryptTools.TEA_KEY_SIZE / 4)) {
            return 0;
        }

        if (Data == null || Data.length < StartIndex + DataLen) {
            return 0;
        }

        let BlockCount: number = Math.floor(DataLen / CryptTools.TEA_BLOCK_SIZE);
        if (DataLen != BlockCount * CryptTools.TEA_BLOCK_SIZE) {
            return 0;
        }

        let Words: Uint32Array = new Uint32Array(2);
        for (let i = 0; i < BlockCount; i++)
        {
            CryptTools.BytesToUints(Data, StartIndex + i * CryptTools.TEA_BLOCK_SIZE, Words, Math.floor(CryptTools.TEA_BLOCK_SIZE / 4));
            CryptTools.tea_decrypt(Words, KeyWords, Cycle);
            CryptTools.UintsToBytes(Words, Data, StartIndex + i * CryptTools.TEA_BLOCK_SIZE, Math.floor(CryptTools.TEA_BLOCK_SIZE / 4));
        }

        let Padding: number = Data[StartIndex + DataLen - 1] & 0xFF;

        return DataLen - Padding;
    }

    public static GetTEAEncryptECBSize(DataLen: number): number
    {
        return (Math.floor(DataLen / CryptTools.TEA_BLOCK_SIZE) + 1) * CryptTools.TEA_BLOCK_SIZE;
    }
}

export class Base64Maker {

    protected static readonly bstr: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    protected static readonly rstr: number[] = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 63,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 0, 0, 0, 0, 0, 0,
        0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 0, 0, 0, 0, 0,
        0, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 0, 0, 0, 0, 0
    ];

    public static GetEncodeLen(InLen: number): number {
        return Math.floor((InLen + (InLen % 3 == 0 ? 0 : (3 - InLen % 3))) / 3) * 4;
    }

    public static GetDecodeLen(szInData: string): number {
        if (szInData == undefined || szInData == null || szInData.length == 0 || (szInData.length % 4) != 0)
            return 0;
        let l = 3 * (Math.floor(szInData.length / 4) - 1) + 1;
        if (szInData[szInData.length - 2] != '=')
            l++;
        if (szInData[szInData.length - 1] != '=')
            l++;
        return l;
    }

    public static Encode(pInData: Uint8Array, AddCRLF: boolean): string {
        let i = 0;
        let o = 0;
        let OutBuff = [];

        while (i < pInData.length) {            
            let remain = pInData.length - i;
            if (AddCRLF && o && (o % 76 == 0)) {
                OutBuff.push('\n');
            }
            switch (remain) {
                case 1:
                    OutBuff.push(Base64Maker.bstr[((pInData[i] >> 2) & 0x3f)]);
                    OutBuff.push(Base64Maker.bstr[((pInData[i] << 4) & 0x30)]);
                    OutBuff.push('=');
                    OutBuff.push('=');
                    break;
                case 2:
                    OutBuff.push(Base64Maker.bstr[((pInData[i] >> 2) & 0x3f)]);
                    OutBuff.push(Base64Maker.bstr[((pInData[i] << 4) & 0x30) + ((pInData[i + 1] >> 4) & 0x0f)]);
                    OutBuff.push(Base64Maker.bstr[((pInData[i + 1] << 2) & 0x3c)]);
                    OutBuff.push('=');
                    break;
                default:
                    OutBuff.push(Base64Maker.bstr[((pInData[i] >> 2) & 0x3f)]);
                    OutBuff.push(Base64Maker.bstr[((pInData[i] << 4) & 0x30) + ((pInData[i + 1] >> 4) & 0x0f)]);
                    OutBuff.push(Base64Maker.bstr[((pInData[i + 1] << 2) & 0x3c) + ((pInData[i + 2] >> 6) & 0x03)]);
                    OutBuff.push(Base64Maker.bstr[(pInData[i + 2] & 0x3f)]);
            }
            o += 4;
            i += 3;
        }
        //return String.fromCharCode.apply(String, OutBuff);
        return OutBuff.join("");
    }

    public static DecodeToBuffer(szInData: string, OutBuffer: Uint8Array, StartIndex: number, BufferLen: number): number {
        let i = 0;
        let l = szInData.length;
        let j = StartIndex;
        let OutEnd = StartIndex + BufferLen;

        if (l == 0 || (l % 4) != 0)
            return 0;

        while (i < l) {
            while (i < l && (szInData.charCodeAt(i) == 13 || szInData.charCodeAt(i) == 10))
                i++;
            if (i < l) {
                let b1 = ((Base64Maker.rstr[szInData.charCodeAt(i)] << 2) & 0xfc) +
                    ((Base64Maker.rstr[szInData.charCodeAt(i + 1)] >> 4) & 0x03);
                if (j < OutEnd)
                    OutBuffer[j] = b1;
                j++;
                if (szInData[i + 2] != '=') {
                    let b2 = ((Base64Maker.rstr[szInData.charCodeAt(i + 1)] << 4) & 0xf0) +
                        ((Base64Maker.rstr[szInData.charCodeAt(i + 2)] >> 2) & 0x0f);
                    if (j < OutEnd)
                        OutBuffer[j] = b2;
                    j++;
                }
                if (szInData[i + 3] != '=') {
                    let b3 = ((Base64Maker.rstr[szInData.charCodeAt(i + 2)] << 6) & 0xc0) +
                        Base64Maker.rstr[szInData.charCodeAt(i + 3)];
                    if (j < OutEnd)
                        OutBuffer[j] = b3;
                    j++;
                }
                i += 4;
            }
        }
        return j - StartIndex;
    }
    public static Decode(szInData: string): Uint8Array {
        let Len = Base64Maker.GetDecodeLen(szInData);
        if (Len) {
            let Buffer = new Uint8Array(Len);
            if (Base64Maker.DecodeToBuffer(szInData, Buffer, 0, Buffer.length) == Len)
                return Buffer;
        }
        return null;
    }
}

export class MD5Maker {
    protected static PADDING: Uint8Array = new Uint8Array(
        [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    protected static S11 = 7;
    protected static S12 = 12;
    protected static S13 = 17;
    protected static S14 = 22;
    protected static S21 = 5;
    protected static S22 = 9;
    protected static S23 = 14;
    protected static S24 = 20;
    protected static S31 = 4;
    protected static S32 = 11;
    protected static S33 = 16;
    protected static S34 = 23;
    protected static S41 = 6;
    protected static S42 = 10;
    protected static S43 = 15;
    protected static S44 = 21;

    protected m_mdContext = {
        I: new Uint32Array(2),                   /* number of _bits_ handled mod 2^64 */
        Buf: new Uint32Array(4),              /* scratch buffer */
        In: new Uint8Array(64),              /* input buffer */
        digest: new Uint8Array(16),          /* actual digest after MD5Final call */
    };

    constructor() {
        this.Init();
    }

    public Init(): void {
        this.m_mdContext.I[0] = 0;
        this.m_mdContext.I[1] = 0;

        /* Load magic initialization constants.
        */
        this.m_mdContext.Buf[0] = 0x67452301;
        this.m_mdContext.Buf[1] = 0xefcdab89;
        this.m_mdContext.Buf[2] = 0x98badcfe;
        this.m_mdContext.Buf[3] = 0x10325476;
    }

    public AddData(Data: Uint8Array, StartIndex: number = 0, DataLen: number = 0): void {
        if (Data == null)
            return;

        if (DataLen == 0)
            DataLen = Data.length;

        if (Data.length < StartIndex + DataLen)
            return;

        let In = new Uint32Array(16);
        let mdi = 0x0;
        let i = 0x0, ii = 0x0;

        /* compute number of bytes mod 64 */
        mdi = ((this.m_mdContext.I[0] >>> 3) & 0x3F);

        /* update number of bits */
        if ((this.m_mdContext.I[0] + ((DataLen << 3) >>> 0)) < this.m_mdContext.I[0])
            this.m_mdContext.I[1]++;
        this.m_mdContext.I[0] += (DataLen << 3) >>> 0;
        this.m_mdContext.I[1] += (DataLen >>> 29);

        for (let j = 0; j < DataLen; j++) {
            /* add new character to buffer, increment mdi */
            this.m_mdContext.In[mdi++] = Data[j + StartIndex];

            /* transform if necessary */
            if (mdi == 0x40) {
                for (i = 0, ii = 0; i < 16; i++, ii += 4)
                    In[i] = (((this.m_mdContext.In[ii + 3]) << 24) |
                        ((this.m_mdContext.In[ii + 2]) << 16) |
                        ((this.m_mdContext.In[ii + 1]) << 8) |
                        (this.m_mdContext.In[ii])) >>> 0;
                MD5Maker.Transform(this.m_mdContext.Buf, In);
                mdi = 0;
            }
        }
    }

    public MD5Final(): void {
        let In = new Uint32Array(16);
        let mdi = 0;
        let i = 0, ii = 0;
        let padLen = 0;

        /* save number of bits */
        In[14] = this.m_mdContext.I[0];
        In[15] = this.m_mdContext.I[1];

        /* compute number of bytes mod 64 */
        mdi = ((this.m_mdContext.I[0] >>> 3) & 0x3F);

        /* pad out to 56 mod 64 */
        padLen = (mdi < 56) ? (56 - mdi) : (120 - mdi);
        this.AddData(MD5Maker.PADDING, 0, padLen);

        /* append length in bits and transform */
        for (i = 0, ii = 0; i < 14; i++, ii += 4) {
            In[i] = (((this.m_mdContext.In[ii + 3]) << 24) |
                ((this.m_mdContext.In[ii + 2]) << 16) |
                ((this.m_mdContext.In[ii + 1]) << 8) |
                (this.m_mdContext.In[ii])) >>> 0;
        }

        MD5Maker.Transform(this.m_mdContext.Buf, In);

        /* store buffer in digest */
        for (i = 0, ii = 0; i < 4; i++, ii += 4) {
            this.m_mdContext.digest[ii] = (this.m_mdContext.Buf[i] & 0xFF) >>> 0;
            this.m_mdContext.digest[ii + 1] =
                ((this.m_mdContext.Buf[i] >>> 8) & 0xFF) >>> 0;
            this.m_mdContext.digest[ii + 2] =
                ((this.m_mdContext.Buf[i] >>> 16) & 0xFF) >>> 0;
            this.m_mdContext.digest[ii + 3] =
                ((this.m_mdContext.Buf[i] >>> 24) & 0xFF) >>> 0;
        }
    }

    public GetMD5CodeString(): string {
        let HashCode = "";

        for (let i = 0; i < 16; i++) {
            HashCode += DOSSystem.FormatHex(this.m_mdContext.digest[i], 2, false, false);
        }
        return HashCode;
    }
    public GetMD5Code(): Uint8Array {
        return this.m_mdContext.digest;
    }

    protected static Transform(Buf: Uint32Array, In: Uint32Array): void {
        let a = Buf[0], b = Buf[1], c = Buf[2], d = Buf[3];

        /* Round 1 */

        a = MD5Maker.FF(a, b, c, d, In[0],  MD5Maker.S11, 3614090360); /* 1 */
        d = MD5Maker.FF(d, a, b, c, In[1],  MD5Maker.S12, 3905402710); /* 2 */
        c = MD5Maker.FF(c, d, a, b, In[2],  MD5Maker.S13, 606105819); /* 3 */
        b = MD5Maker.FF(b, c, d, a, In[3],  MD5Maker.S14, 3250441966); /* 4 */
        a = MD5Maker.FF(a, b, c, d, In[4],  MD5Maker.S11, 4118548399); /* 5 */
        d = MD5Maker.FF(d, a, b, c, In[5],  MD5Maker.S12, 1200080426); /* 6 */
        c = MD5Maker.FF(c, d, a, b, In[6],  MD5Maker.S13, 2821735955); /* 7 */
        b = MD5Maker.FF(b, c, d, a, In[7],  MD5Maker.S14, 4249261313); /* 8 */
        a = MD5Maker.FF(a, b, c, d, In[8],  MD5Maker.S11, 1770035416); /* 9 */
        d = MD5Maker.FF(d, a, b, c, In[9],  MD5Maker.S12, 2336552879); /* 10 */
        c = MD5Maker.FF(c, d, a, b, In[10], MD5Maker.S13, 4294925233); /* 11 */
        b = MD5Maker.FF(b, c, d, a, In[11], MD5Maker.S14, 2304563134); /* 12 */
        a = MD5Maker.FF(a, b, c, d, In[12], MD5Maker.S11, 1804603682); /* 13 */
        d = MD5Maker.FF(d, a, b, c, In[13], MD5Maker.S12, 4254626195); /* 14 */
        c = MD5Maker.FF(c, d, a, b, In[14], MD5Maker.S13, 2792965006); /* 15 */
        b = MD5Maker.FF(b, c, d, a, In[15], MD5Maker.S14, 1236535329); /* 16 */

        /* Round 2 */

        a = MD5Maker.GG(a, b, c, d, In[1], MD5Maker.S21, 4129170786); /* 17 */
        d = MD5Maker.GG(d, a, b, c, In[6], MD5Maker.S22, 3225465664); /* 18 */
        c = MD5Maker.GG(c, d, a, b, In[11], MD5Maker.S23, 643717713); /* 19 */
        b = MD5Maker.GG(b, c, d, a, In[0], MD5Maker.S24, 3921069994); /* 20 */
        a = MD5Maker.GG(a, b, c, d, In[5], MD5Maker.S21, 3593408605); /* 21 */
        d = MD5Maker.GG(d, a, b, c, In[10], MD5Maker.S22, 38016083); /* 22 */
        c = MD5Maker.GG(c, d, a, b, In[15], MD5Maker.S23, 3634488961); /* 23 */
        b = MD5Maker.GG(b, c, d, a, In[4], MD5Maker.S24, 3889429448); /* 24 */
        a = MD5Maker.GG(a, b, c, d, In[9], MD5Maker.S21, 568446438); /* 25 */
        d = MD5Maker.GG(d, a, b, c, In[14], MD5Maker.S22, 3275163606); /* 26 */
        c = MD5Maker.GG(c, d, a, b, In[3], MD5Maker.S23, 4107603335); /* 27 */
        b = MD5Maker.GG(b, c, d, a, In[8], MD5Maker.S24, 1163531501); /* 28 */
        a = MD5Maker.GG(a, b, c, d, In[13], MD5Maker.S21, 2850285829); /* 29 */
        d = MD5Maker.GG(d, a, b, c, In[2], MD5Maker.S22, 4243563512); /* 30 */
        c = MD5Maker.GG(c, d, a, b, In[7], MD5Maker.S23, 1735328473); /* 31 */
        b = MD5Maker.GG(b, c, d, a, In[12], MD5Maker.S24, 2368359562); /* 32 */

        /* Round 3 */

        a = MD5Maker.HH(a, b, c, d, In[5], MD5Maker.S31, 4294588738); /* 33 */
        d= MD5Maker.HH(d, a, b, c, In[8],  MD5Maker.S32, 2272392833); /* 34 */
        c= MD5Maker.HH(c, d, a, b, In[11], MD5Maker.S33, 1839030562); /* 35 */
        b= MD5Maker.HH(b, c, d, a, In[14], MD5Maker.S34, 4259657740); /* 36 */
        a= MD5Maker.HH(a, b, c, d, In[1],  MD5Maker.S31, 2763975236); /* 37 */
        d= MD5Maker.HH(d, a, b, c, In[4],  MD5Maker.S32, 1272893353); /* 38 */
        c= MD5Maker.HH(c, d, a, b, In[7],  MD5Maker.S33, 4139469664); /* 39 */
        b= MD5Maker.HH(b, c, d, a, In[10], MD5Maker.S34, 3200236656); /* 40 */
        a= MD5Maker.HH(a, b, c, d, In[13], MD5Maker.S31, 681279174); /* 41 */
        d= MD5Maker.HH(d, a, b, c, In[0],  MD5Maker.S32, 3936430074); /* 42 */
        c= MD5Maker.HH(c, d, a, b, In[3],  MD5Maker.S33, 3572445317); /* 43 */
        b= MD5Maker.HH(b, c, d, a, In[6],  MD5Maker.S34, 76029189); /* 44 */
        a= MD5Maker.HH(a, b, c, d, In[9],  MD5Maker.S31, 3654602809); /* 45 */
        d= MD5Maker.HH(d, a, b, c, In[12], MD5Maker.S32, 3873151461); /* 46 */
        c= MD5Maker.HH(c, d, a, b, In[15], MD5Maker.S33, 530742520); /* 47 */
        b= MD5Maker.HH(b, c, d, a, In[2],  MD5Maker.S34, 3299628645); /* 48 */

        /* Round 4 */

        a = MD5Maker.II(a, b, c, d, In[0], MD5Maker.S41, 4096336452); /* 49 */
        d= MD5Maker.II(d, a, b, c, In[7],  MD5Maker.S42, 1126891415); /* 50 */
        c= MD5Maker.II(c, d, a, b, In[14], MD5Maker.S43, 2878612391); /* 51 */
        b= MD5Maker.II(b, c, d, a, In[5],  MD5Maker.S44, 4237533241); /* 52 */
        a= MD5Maker.II(a, b, c, d, In[12], MD5Maker.S41, 1700485571); /* 53 */
        d= MD5Maker.II(d, a, b, c, In[3],  MD5Maker.S42, 2399980690); /* 54 */
        c= MD5Maker.II(c, d, a, b, In[10], MD5Maker.S43, 4293915773); /* 55 */
        b= MD5Maker.II(b, c, d, a, In[1],  MD5Maker.S44, 2240044497); /* 56 */
        a= MD5Maker.II(a, b, c, d, In[8],  MD5Maker.S41, 1873313359); /* 57 */
        d= MD5Maker.II(d, a, b, c, In[15], MD5Maker.S42, 4264355552); /* 58 */
        c= MD5Maker.II(c, d, a, b, In[6],  MD5Maker.S43, 2734768916); /* 59 */
        b= MD5Maker.II(b, c, d, a, In[13], MD5Maker.S44, 1309151649); /* 60 */
        a= MD5Maker.II(a, b, c, d, In[4],  MD5Maker.S41, 4149444226); /* 61 */
        d= MD5Maker.II(d, a, b, c, In[11], MD5Maker.S42, 3174756917); /* 62 */
        c= MD5Maker.II(c, d, a, b, In[2],  MD5Maker.S43, 718787259); /* 63 */
        b= MD5Maker.II(b, c, d, a, In[9],  MD5Maker.S44, 3951481745); /* 64 */

        Buf[0] += a;
        Buf[1] += b;
        Buf[2] += c;
        Buf[3] += d;
    }

    protected static F(x: number, y: number, z: number): number {
        return (((x) & (y)) | ((~x) & (z))) >>> 0;
    }
    protected static G(x: number, y: number, z: number): number {
        return (((x) & (z)) | ((y) & (~z))) >>> 0;
    }
    protected static H(x: number, y: number, z: number): number {
        return ((x) ^ (y) ^ (z)) >>> 0;
    }
    protected static I(x: number, y: number, z: number): number {
        return ((y) ^ ((x) | (~z))) >>> 0;
    }

    protected static FF(a: number, b: number, c: number, d: number, mj: number, s: number, ti: number):number {
        a = a + MD5Maker.F(b, c, d) + mj + ti;
        a = (a << s | a >>> (32 - s)) >>> 0;
        a += b;
        return a;
    }
    protected static GG(a: number, b: number, c: number, d: number, mj: number, s: number, ti: number): number {
        a = a + MD5Maker.G(b, c, d) + mj + ti;
        a = (a << s | a >>> (32 - s)) >>> 0;
        a += b;
        return a;
    }
    protected static HH(a: number, b: number, c: number, d: number, mj: number, s: number, ti: number): number {
        a = a + MD5Maker.H(b, c, d) + mj + ti;
        a = (a << s | a >>> (32 - s))>>>0;
        a += b;
        return a;
    }
    protected static II(a: number, b: number, c: number, d: number, mj: number, s: number, ti: number): number {
        a = a + MD5Maker.I(b, c, d) + mj + ti;
        a = (a << s | a >>> (32 - s)) >>> 0;
        a += b;
        return a;
    }
}