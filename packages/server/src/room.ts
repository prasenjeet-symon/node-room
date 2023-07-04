import { NodeConfig } from './main-interface';

export class RoomManager {
    private static _instance: RoomManager;
    private rooms: Map<string, RoomClient> = new Map();

    public static getInstance(): RoomManager {
        if (!RoomManager._instance) RoomManager._instance = new RoomManager();
        return RoomManager._instance;
    }

    private constructor() {}
    /**
     * Add new room to the manager
     * @param roomName : Name of the room
     * @param RoomClient : RoomClient instance
     */
    public addRoom(roomName: string, RoomClient: RoomClient) {
        this.rooms.set(roomName, RoomClient);
    }
    /**
     * Get the node of the given room by name
     * @param roomName : Name of the room
     * @param nodeName : Name of the node
     * @returns
     */
    public getNode(roomName: string, nodeName: string) {
        return this.rooms.get(roomName)?.getNode(nodeName);
    }

    /**
     * Get node config
     */
    public getNodeConfig(roomName: string, nodeName: string): NodeConfig {
        const node = this.getNode(roomName, nodeName);
        const instanceNode = new node();
        return instanceNode.nodeConfig;
    }
}

export class RoomClient {
    constructor(private roomInstance: any) {}

    /**
     * Get the name of the room
     * @returns : Name of the room
     */
    public getRoomName(): string {
        return this.roomInstance.getRoomName();
    }
    /**
     * Get the node of the given room by name
     * @param nodeName : Name of the node
     * @returns : Node class
     */
    public getNode(nodeName: string): any {
        return this.roomInstance.getNode(nodeName);
    }

    /**
     *
     * Get the room type
     *
     */
    public nodeRoomType(): string {
        return this.roomInstance.nodeRoomType();
    }
}
