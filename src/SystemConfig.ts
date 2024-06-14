import { JSON_INT64 } from "./DOSSystem/JSON_INT64";

export class MAIN_CONFIG {
    IsModified = false;
    ConfigDataPath = "GameData";
    EditorDataPath = "Editor";

    public FromJson(Obj: any) {
        if (Obj.ConfigDataPath && typeof Obj.ConfigDataPath == "string")
            this.ConfigDataPath = Obj.ConfigDataPath;
        if (Obj.EditorDataPath && typeof Obj.EditorDataPath == "string")
            this.EditorDataPath = Obj.EditorDataPath;
    }

    public SetModified() {
        this.IsModified = true;
    }
}

export class SystemConfig {
    protected static m_Instance: SystemConfig;
    public static get Instance(): SystemConfig {
        if (!SystemConfig.m_Instance) {
            SystemConfig.m_Instance = new SystemConfig();
        }

        return SystemConfig.m_Instance;
    }

    public MainConfig = new MAIN_CONFIG();

    public LoadConfig() {

        let JsonStr = Laya.LocalStorage.getItem("MainConfig") as string;
        if (JsonStr) {
            let Obj = JSON_INT64.parse(JsonStr);
            this.MainConfig.FromJson(Obj);
            this.MainConfig.IsModified = false;
        }
    }

    public SaveConfig(bForce?: boolean) {                
        if (this.MainConfig.IsModified) {
            let JsonStr = JSON_INT64.stringify(this.MainConfig);
            Laya.LocalStorage.setItem("MainConfig", JsonStr);
            this.MainConfig.IsModified = false;
        }
    }
}