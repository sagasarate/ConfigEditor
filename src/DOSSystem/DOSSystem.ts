import lzo from "./lzo1x.js";
import Long from "long";
import { CSmartStruct } from "./SmartStruct"
import { CryptTools} from "./crypt"
import { Encoding } from "./Encoding/Encoding"
import { sprintf } from "sprintf-js"

export namespace DOSSystem
{
    export enum DOS_SYSTEM_MESSAGE
    {
        DSM_NONE = 0,

        DSM_PROXY_REGISTER_MSG_MAP,
        DSM_PROXY_REGISTER_MSG_MAP_RESULT,
        DSM_PROXY_UNREGISTER_MSG_MAP,
        DSM_PROXY_UNREGISTER_MSG_MAP_RESULT,
        DSM_PROXY_REGISTER_GLOBAL_MSG_MAP,
        DSM_PROXY_REGISTER_GLOBAL_MSG_MAP_RESULT,
        DSM_PROXY_UNREGISTER_GLOBAL_MSG_MAP,
        DSM_PROXY_UNREGISTER_GLOBAL_MSG_MAP_RESULT,
        DSM_PROXY_DISCONNECT,
        DSM_PROXY_KEEP_ALIVE_PING,
        DSM_PROXY_KEEP_ALIVE_PONG,
        DSM_PROXY_GET_IP,
        DSM_PROXY_IP_REPORT,
        DSM_PROXY_SET_UNHANDLE_MSG_RECEIVER,
        DSM_ROUTE_LINK_LOST = 100,
        DSM_OBJECT_ALIVE_TEST = 200,
        DSM_OBJECT_FIND,
        DSM_OBJECT_REPORT,
        DSM_SYSTEM_SHUTDOWN,
        DSM_MAX,
    }

    export enum DOS_MESSAGE_FLAG
    {
        DOS_MESSAGE_FLAG_SYSTEM_MESSAGE = 1,
        DOS_MESSAGE_FLAG_COMPRESSED = 1 << 1,
        DOS_MESSAGE_FLAG_CAN_CACHE = 1 << 2,
        DOS_MESSAGE_FLAG_ENCRYPT = 1 << 3,
    }

    export enum MSG_ENCRYPT_TYPE
    {
        MSG_ENCRYPT_NONE,
        MSG_ENCRYPT_CHECK_SUM,
        MSG_ENCRYPT_DES,
        MSG_ENCRYPT_AES,
        MSG_ENCRYPT_TEA,
    }

    export enum COMMON_RESULT_CODE
    {
        COMMON_RESULT_SUCCEED = 0,
        COMMON_RESULT_MSG_PACK_ERROR = 189001,
        COMMON_RESULT_MSG_UNPACK_ERROR = 189002,
        COMMON_RESULT_MSG_ALLOC_ERROR = 189101,
        COMMON_RESULT_MSG_SEND_ERROR = 189102,
        COMMON_RESULT_MSG_HANDLER_NOT_FIND = 189103,
        COMMON_RESULT_FAILED = -2,
    }

    export interface DistributedObjectOperator
    {
        SendMessage(
            ReceiverID: Long,
            MsgID: number,
            MsgFlag: number,
            Data: Uint8Array,
            StartIndex: number,
            DataLen: number
        ): boolean;
        AllocMsgBuffer(MsgSize: number): Uint8Array;
    }

    export class MSG_HANDLER_INFO{
        ThisPtr: any;
        HandlerFN: (MsgPacket: CSmartStruct) => number;
    }

    export type MSG_MAP = Map<number, MSG_HANDLER_INFO>;

    export function MakeMsgID(
        ModuleID: number,
        InterfaceID: number,
        MethodID: number,
        IsAck: boolean
    ): number
    {
        return (
            ((ModuleID & 0x7f) << 24) |
            ((InterfaceID & 0xff) << 16) |
            (MethodID & 0xffff) |
            (IsAck ? 0x80000000 : 0)
        ) >>> 0;
    }

    export function LongOrMulti(Value: Long, ...Values: Long[]): Long {
        for (let v of Values) {
            Value = Value.or(v);
        }
        return Value
    }

    export function FormatHex(Value: number | Long, Digits?: number, Uppercase?: boolean, AddHead?: boolean): string {
        if (Digits == undefined)
            Digits = 0;
        if (Uppercase == undefined)
            Uppercase = false;
        if (AddHead == undefined)
            AddHead = false;        
        let Str = Value.toString(16);
        if (Uppercase)
            Str = Str.toUpperCase();
        if (Str.length < Digits)
            Str = "0".repeat(Digits - Str.length) + Str;
        if (AddHead)
            Str = "0x" + Str;
        return Str;
    }

    export function ExactDiv(Value: number, Divisor:number): number {
        return Math.floor(Value / Divisor)
    }

    export function FormatIntegerWithZeroHeader(Value: number, MinLen: number) {
        let Str = Value.toString();
        if (Str.length < MinLen)
            Str = "0".repeat(MinLen - Str.length) + Str;
        return Str;
    }

    export function FormatTimeSpan(TimeSpan: number): string {
        let Header = "";
        if (TimeSpan < 0) {
            TimeSpan = -TimeSpan
            Header="-"
        }            
        if (TimeSpan < 60) {
            return sprintf(`${Header}%02d`, TimeSpan)
        }
        else if (TimeSpan < 3600) {
            return sprintf(`${Header}%02d:%02d`, ExactDiv(TimeSpan, 60), TimeSpan % 60);
        }
        else if (TimeSpan < 86400) {
            return sprintf(`${Header}%02d:%02d:%02d`, ExactDiv(TimeSpan, 3600), ExactDiv((TimeSpan % 3600), 60), TimeSpan % 60);
        }
        else {
            return sprintf(`${Header}%02d天:%02d:%02d:%02d`, ExactDiv(TimeSpan, 86400), ExactDiv((TimeSpan % 86400), 3600), ExactDiv((TimeSpan % 3600), 60), TimeSpan % 60);
        }
    }

    export function DumpBinData(Data: Uint8Array, StartIndex?: number, DataLen?: number): string {
        if (StartIndex == undefined || DataLen == undefined) {
            StartIndex = 0;
            DataLen = Data.length;
        }
        let EndIndex = StartIndex + DataLen;
        let Strs = [];
        for (let i = StartIndex; i < EndIndex; i++) {
            Strs.push(FormatHex(Data[i], 2, true));
        }
        return Strs.join();
    }

    export function IsNullOrEmptyString(Str: string): boolean {
        if (Str) {
            return Str.length == 0;
        }
        return true;
    }

    export function Saturate(Value: number, Min: number, Max?: number): number {
        if (Value < Min)
            Value = Min;
        if (Max && Value > Max)
            Value = Max;
        return Value;
    }

    export class DOSClient implements DistributedObjectOperator
    {
        protected static readonly MSG_HEADER_SIZE: number = 10;
        protected static readonly DEFAULT_KEEP_ALIVE_TIME: number = 10000;
        protected static readonly CONNECT_DELAY_TIME: number = 1000;
        protected static readonly DEFAULT_MAX_KEEP_ALIVE_COUNT: number = 30;

        protected _socket: WebSocket = null; //当前的webSocket的对象

        //消息映射表
        protected m_MsgMap: MSG_MAP = new Map<number, MSG_HANDLER_INFO>();

        protected m_OnConnect: { ThisPtr: any, CallbackFN: () => void } = null;
        protected m_OnDisconnect: { ThisPtr: any, CallbackFN: (isSlient: boolean) => void } = null;
        protected m_OnError: { ThisPtr: any, CallbackFN: (ev: Event) => void } = null;

        protected m_SlientClose: boolean = false;

        protected m_KeepAliveTimer: number = 0;
        protected m_KeepAliveCount: number = 0;
        protected m_KeepAliveTime: number = DOSClient.DEFAULT_KEEP_ALIVE_TIME;
        protected m_MaxKeepAliveCount: number = DOSClient.DEFAULT_MAX_KEEP_ALIVE_COUNT;
        protected m_RecentPing: number = -1;

        protected m_MsgEncryptType:number = MSG_ENCRYPT_TYPE.MSG_ENCRYPT_NONE;        
        protected m_MsgSendCount: number = 0;
        protected m_KeyWords: Uint32Array;
        protected m_KeyBytes: Uint8Array;

        protected m_MsgBuffer: Uint8Array = new Uint8Array(10240);

        constructor()
        {
            lzo.setReturnNewBuffers(false);
        }

        public get MsgMap()
        {
            return this.m_MsgMap;
        }

        public SetConnectCallback(ThisPtr: any, CallbackFN: () => void): void {
            if (typeof (CallbackFN) == "function") {
                this.m_OnConnect = { ThisPtr: ThisPtr, CallbackFN: CallbackFN };
            }
            else {
                this.m_OnConnect = null;
            }
        }

        public SetDisconnectCallback(ThisPtr: any, CallbackFN: (isSlient: boolean) => void): void {
            if (typeof (CallbackFN) == "function") {
                this.m_OnDisconnect = { ThisPtr: ThisPtr, CallbackFN: CallbackFN };
            }
            else {
                this.m_OnDisconnect = null;
            }
        }

        public SetErrorCallback(ThisPtr: any, CallbackFN: (ev: Event) => void): void {
            if (typeof (CallbackFN) == "function") {
                this.m_OnError = { ThisPtr: ThisPtr, CallbackFN: CallbackFN };
            }
            else {
                this.m_OnError = null;
            }
        }

        public connect(URL: string)
        {
            //清空以前socket的绑定
            if (this._socket)
            {
                this._socket.onopen = undefined;
                this._socket.onmessage = undefined;
                this._socket.onclose = undefined;
                this._socket.onerror = undefined;
            }
            this.m_SlientClose = false;
            this.m_KeepAliveTimer = 0;
            this.m_KeepAliveCount = 0;
            this.m_MsgSendCount = 0;
            this.m_RecentPing = -1;

            this._socket = new WebSocket(URL);
            console.info("connect to " + URL);
            this._socket.binaryType = "arraybuffer"; // We are talking binary
            this._socket.onopen = this._onOpen.bind(this);
            this._socket.onclose = this._onClose.bind(this);
            this._socket.onerror = this._onError.bind(this);
            this._socket.onmessage = this._onMessage.bind(this);
        }

        public close(isSlient: boolean)
        {
            if (this._socket)
            {
                this.m_SlientClose = isSlient;
                this._socket.close();
                console.info("Successfully Close Connected");
            } else
            {
                console.info("NO Socket");
            }
        }

        protected _onOpen(ev: Event)
        {
            console.info("connect succeed");
            this.m_SlientClose = false;
            if (this.m_OnConnect)
            {
                this.m_OnConnect.CallbackFN.call(this.m_OnConnect.ThisPtr);
            }
        }
        protected _onClose(ev: CloseEvent)
        {
            console.info(`connect closed code=${ev.code} reason=${ev.reason} wasClean=${ev.wasClean}`);
            if (this.m_OnDisconnect)
            {
                this.m_OnDisconnect.CallbackFN.call(this.m_OnDisconnect.ThisPtr, this.m_SlientClose);
                this.m_SlientClose = false;
            }
        }

        protected _onError(ev: Event)
        {
            console.error(`connection error=${ev}`);
            if (this.m_OnError)
            {
                this.m_OnError.CallbackFN.call(this.m_OnError.ThisPtr, ev);
            }
        }

        protected _onMessage(ev: MessageEvent)
        {
            let DataBuffer: ArrayBuffer = ev.data;
            //console.info(`recv ${DataBuffer.byteLength}`);
            let Msg: DataView = new DataView(DataBuffer);

            let MsgID: number = Msg.getUint32(0, true);
            let MsgFlag: number = Msg.getUint16(4, true);
            let MsgData: Uint8Array;

            this.m_KeepAliveCount = 0;

            if ((MsgFlag & DOS_MESSAGE_FLAG.DOS_MESSAGE_FLAG_COMPRESSED) != 0) {
                //数据解压
                let OrginDataSize: number = Msg.getUint32(8, true);
                MsgData = new Uint8Array(DataBuffer, 12, DataBuffer.byteLength - 12);                
                if (OrginDataSize > lzo.getOutputEstimate()) {
                    lzo.setOutputEstimate(OrginDataSize);
                }
                let Param = { inputBuffer: MsgData, outputBuffer: null };
                let Result = lzo.decompress(Param);
                if (Result != 0) {
                    console.error("decompress error ", Result);
                    this.close(false);
                    return;
                }
                MsgData = Param.outputBuffer;
            }
            else
            {
                MsgData = new Uint8Array(DataBuffer, 8, DataBuffer.byteLength - 8);
            }
            if ((MsgFlag & DOS_MESSAGE_FLAG.DOS_MESSAGE_FLAG_SYSTEM_MESSAGE) != 0) {
                this.OnSystemMsg(MsgID, MsgData);
            }                
            else {
                let MsgPacket = new CSmartStruct(MsgData, 0, MsgData.length, false);
                this.OnMsg(MsgID, MsgPacket);
            }
                
        }

        protected OnSystemMsg(MsgID: number, MsgData: Uint8Array): void
        {
            switch (MsgID)
            {
                case DOS_SYSTEM_MESSAGE.DSM_PROXY_KEEP_ALIVE_PING:
                    if (MsgData.length >= 6)
                    {
                        let Msg: DataView = new DataView(MsgData.buffer, MsgData.byteOffset, MsgData.length);
                        this.m_RecentPing = Msg.getUint16(4, true);
                    }
                    this.SendMessage(Long.ZERO, DOS_SYSTEM_MESSAGE.DSM_PROXY_KEEP_ALIVE_PONG, DOS_MESSAGE_FLAG.DOS_MESSAGE_FLAG_SYSTEM_MESSAGE, MsgData, 0, MsgData.length);
                    break;
                case DOS_SYSTEM_MESSAGE.DSM_PROXY_KEEP_ALIVE_PONG:
                    if (MsgData.length >= 6)
                    {
                        let Msg: DataView = new DataView(MsgData.buffer, MsgData.byteOffset, MsgData.length);
                        let CurTime = new Date().getTime();
                        let PingTime = Msg.getUint32(0, true);
                        if (CurTime >= PingTime)
                        {                          
                            this.m_RecentPing = CurTime - PingTime;
                        }
                    }
                    break;
            }
        }

        public OnMsg(MsgID: number, MsgPacket: CSmartStruct): void
        {
            let Handler = this.m_MsgMap.get(MsgID);
            if (Handler)
            {
                Handler.HandlerFN.call(Handler.ThisPtr, MsgPacket);
            }
            else
            {
                console.warn(`无法找到消息${MsgID}处理函数`);
            }
        }       

        public SendMessage(
            ReceiverID: Long,
            MsgID: number,
            MsgFlag: number,
            Data: Uint8Array,
            StartIndex: number,
            DataLen: number
        ): boolean
        {
            let CRC = 0;
            if ((MsgFlag & DOS_MESSAGE_FLAG.DOS_MESSAGE_FLAG_SYSTEM_MESSAGE) == 0)
            {
                this.m_MsgSendCount++;
                //console.info(`OrginMsg(${DataLen})=${DumpBinData(Data, StartIndex, DataLen)}`)
                if (this.m_MsgEncryptType != MSG_ENCRYPT_TYPE.MSG_ENCRYPT_NONE)
                {
                    MsgFlag |= DOS_MESSAGE_FLAG.DOS_MESSAGE_FLAG_ENCRYPT;
                    CRC = CryptTools.MakeCRC(Data, StartIndex, DataLen, this.m_KeyBytes, this.m_MsgSendCount);
                    //需要加密,系统消息不加密
                    switch (this.m_MsgEncryptType)
                    {
                        case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_CHECK_SUM:
                            break;
                        case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_DES:
                            break;
                        case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_AES:
                            break;
                        case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_TEA:
                            {
                                let EncryptedSize = CryptTools.GetTEAEncryptECBSize(DataLen);
                                if (StartIndex + EncryptedSize < Data.length)
                                {
                                    //大小够，直接加密
                                    DataLen = CryptTools.TEAEncryptECB(this.m_KeyWords, CryptTools.DEFAULT_TEA_CYCLE, Data, StartIndex, DataLen);
                                    if (DataLen <= 0)
                                    {
                                        console.error("tea encrypt failed");
                                        this.close(false);
                                        return false;
                                    }
                                }
                                else
                                {
                                    //大小不够，需要另分配空间
                                    let NewData = new Uint8Array(EncryptedSize);
                                    NewData.set(Data.subarray(StartIndex, StartIndex + EncryptedSize));                                    
                                    Data = NewData;
                                    StartIndex = 0;
                                    DataLen = CryptTools.TEAEncryptECB(this.m_KeyWords, CryptTools.DEFAULT_TEA_CYCLE, Data, StartIndex, DataLen);
                                    if (DataLen <= 0)
                                    {
                                        console.error("tea encrypt failed");
                                        this.close(false);
                                        return false;
                                    }
                                }
                            }
                            break;
                    }
                }
                //console.info(`SendMsg(${DataLen})=${DumpBinData(Data, StartIndex, DataLen)} CRC=0x${FormatHex(CRC)} MsgCount=${this.m_MsgSendCount}`);
            }
            let MsgHeaderSize = 8;
            let MsgBuffer = new Uint8Array(DataLen + MsgHeaderSize);
            let Msg: DataView = new DataView(MsgBuffer.buffer);
            Msg.setUint32(0, MsgID, true);
            Msg.setUint16(4, MsgFlag, true);
            Msg.setUint16(6, CRC, true);
            MsgBuffer.set(Data.subarray(StartIndex, DataLen), 8);

            //console.info(`send ${MsgBuffer.length}`);
           
            this._socket.send(MsgBuffer);
            return true;
        }

        public Update(): void
        {
            if (this.isOpen())
            {                
                let CurTime = new Date().getTime();
                if (CurTime - this.m_KeepAliveTimer > this.m_KeepAliveTime)
                {
                    this.m_KeepAliveTimer = CurTime;

                    this.m_KeepAliveCount++;
                    if (this.m_KeepAliveCount > this.m_MaxKeepAliveCount)
                    {
                        console.error("Keep Alive Timeout Disconnect");
                        this.close(false);
                    }
                    else
                    {
                        this. SendKeepAlivePing();
                    }
                }
            }
        }

        isOpen(): boolean
        {
            if (this._socket)
            {
                return this._socket.readyState === WebSocket.OPEN;
            }
            else
            {
                return false;
            }
        }

        isConnecting(): boolean
        {
            if (this._socket)
            {
                return this._socket.readyState === WebSocket.CONNECTING;
            }
            else
            {
                return false;
            }
        }

        protected SendKeepAlivePing(): void
        {
            let MsgData = new Uint8Array(6);
            let Msg: DataView = new DataView(MsgData.buffer);

            let CurTime = new Date().getTime();
            Msg.setUint32(0, CurTime, true);
            Msg.setUint16(4, this.m_RecentPing, true);           

            this.SendMessage(Long.ZERO, DOS_SYSTEM_MESSAGE.DSM_PROXY_KEEP_ALIVE_PING, DOS_MESSAGE_FLAG.DOS_MESSAGE_FLAG_SYSTEM_MESSAGE, MsgData, 0, MsgData.length);
            //console.info("send ping");
        }

        public SetMsgEncryptType(EncryptType: MSG_ENCRYPT_TYPE, SecretKey: string): boolean
        {
            if (SecretKey)
            {
                if (SecretKey.length == 0)
                    return false;
            }
            else
            {
                return false;
            }
                
            let BufferLen: number;
            switch (EncryptType)
            {
                case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_CHECK_SUM:
                    this.m_MsgEncryptType = EncryptType;
                    BufferLen = Encoding.UTF8.GetBytes(SecretKey);
                    this.m_KeyBytes = new Uint8Array(BufferLen);
                    Encoding.UTF8.GetBytes(SecretKey, this.m_KeyBytes);
                    return true;
                case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_DES:
                    break;
                case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_AES:
                    break;
                case MSG_ENCRYPT_TYPE.MSG_ENCRYPT_TEA:
                    BufferLen = Encoding.UTF8.GetBytes(SecretKey);
                    this.m_KeyBytes = new Uint8Array(BufferLen);
                    Encoding.UTF8.GetBytes(SecretKey, this.m_KeyBytes);
                    this.m_KeyWords = CryptTools.MakeTEAKey(SecretKey);
                    if (this.m_KeyBytes && this.m_KeyWords)
                    {
                        this.m_MsgEncryptType = EncryptType;
                        return true;
                    }
                    break;
            }
            return false;
        }

        public AllocMsgBuffer(MsgSize: number): Uint8Array {
            if (MsgSize > this.m_MsgBuffer.length)
                this.m_MsgBuffer = new Uint8Array(MsgSize);
            return this.m_MsgBuffer;
        }        
    }
}

