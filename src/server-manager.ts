export class ServerManager {
    private static _instance: ServerManager;
    public serverUUID!: string;
    public clientKillTimeout!: number;

    public static getInstance(): ServerManager {
        if (!ServerManager._instance) ServerManager._instance = new ServerManager();
        return ServerManager._instance;
    }

    private constructor() {
        this.serverUUID = new Date().getTime().toString() + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
