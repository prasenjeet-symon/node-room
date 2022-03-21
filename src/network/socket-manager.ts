import { Socket } from 'socket.io';
import { DatabaseManager } from '../database';
import { SocketSelectManager } from '../select-managers/socket-select-manager';

export class SocketNetworkManager {
    private socketClients: Map<string, SocketClient> = new Map();

    private static instance: SocketNetworkManager;

    public static getInstance(): SocketNetworkManager {
        if (!SocketNetworkManager.instance) {
            SocketNetworkManager.instance = new SocketNetworkManager();
        }
        return SocketNetworkManager.instance;
    }

    private constructor() {}

    public removeSocketClient(socketId: string) {
        if (this.socketClients.has(socketId)) {
            // disconnect socket
            this.socketClients.get(socketId)?.disconnect();
            this.socketClients.delete(socketId);
        }
    }

    public addSocketClient(socketId: string, socketClient: SocketClient) {
        this.socketClients.set(socketId, socketClient);
    }

    public getSocketClient(socketId: string): SocketClient | undefined {
        return this.socketClients.get(socketId);
    }
}

// socket client
export class SocketClient {
    private socket: Socket;
    private socketID: string;

    constructor(socket: Socket) {
        this.socket = socket;
        this.socketID = socket.id;

        this.socket.on('run_dao', async (data: any) => {
            const database_name: string = data.database_name;
            const name: string = data.name;
            const param_object: any = data.data;
            const dao_call_uuid: string = data.dao_call_uuid;

            const database = DatabaseManager.getInstance();
            const daoClass = database.getDao(database_name, name);
            const daoIns = new daoClass();

            // set the dao ins config
            daoIns.dao_name = name;
            daoIns.requested_by = 'client';
            daoIns.runMode = 'socket';
            daoIns.httpRunConfig = undefined;
            daoIns.socketRunConfig = { socketID: this.socketID };
            daoIns.param_object = param_object;

            const result = await daoIns.fetch();
            const query_type: any = daoIns.query_type;
            const mutation_tables: string[] = daoIns.mutationTables;
            const dao_type = query_type !== 'SELECT' ? 'M' : 'Q';

            if (query_type !== 'SELECT') {
                this.sendData({   dao_call_uuid: dao_call_uuid, data: result, is_cached: false, dao_type: dao_type, delta: null });
            } else {
                this.sendData({   dao_call_uuid: dao_call_uuid, data: result, is_cached: true, dao_type: dao_type, delta: null });
            }
        });

        // listen to remove the dao listning
        this.socket.on('remove_dao_listning', (data: any) => {
            const database_name = data.database_name;
            const dao_name = data.dao_name;

            const socketSelectManager = SocketSelectManager.getInstance();
            socketSelectManager.removeSelect(this.socketID, database_name, dao_name);

            // if there is no select anymore, remove the socket client
            if (socketSelectManager.getAllSelectsOfSocket(this.socketID) === 0) {
                socketSelectManager.removeAllSelects(this.socketID);

                const socketNetworkManager = SocketNetworkManager.getInstance();
                socketNetworkManager.removeSocketClient(this.socketID);
            }
        });

        // listen for disconnect
        this.socket.on('disconnect', () => {
            const socketSelectManager = SocketSelectManager.getInstance();
            socketSelectManager.removeAllSelects(this.socketID);

            const socketNetworkManager = SocketNetworkManager.getInstance();
            socketNetworkManager.removeSocketClient(this.socketID);
        });
    }

    public getSocketID(): string {
        return this.socketID;
    }

    public disconnect() {
        this.socket.disconnect();
    }

    public sendData(data: any) {
        this.socket.emit('dao_result', data);
    }

    public sendDelta(data: any) {
        this.socket.emit('dao_delta', data);
    }
}
