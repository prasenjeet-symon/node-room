import { HttpNetworkFetch, HttpSelect, LocalStorage } from '../modal';
import { HttpPagination } from '../pagination/http-pagination';
import { LocalStorageUniversal, simpleNodeUUID } from '../utils';

export class OfflineManager {
    static _instance: OfflineManager;

    private constructor() {}

    public static getInstance(): OfflineManager {
        if (!OfflineManager._instance) {
            OfflineManager._instance = new OfflineManager();
        }
        return OfflineManager._instance;
    }

    private async getLocal(roomName: string, nodeName: string, paramObject: any): Promise<LocalStorage | null> {
        const localId: string = simpleNodeUUID(roomName, nodeName, paramObject);
        const data = LocalStorageUniversal.instance.getItem(localId);
        if (data) {
            return JSON.parse(data);
        }

        return null;
    }

    public setLocal(nodeIdentifier: string, data: HttpSelect) {
        const localId: string = simpleNodeUUID(data.roomName, data.nodeName, data.paramObject);
        const localData: LocalStorage = {
            nodeIdentifier: nodeIdentifier,
            data: data,
        };

        LocalStorageUniversal.instance.setItem(localId, JSON.stringify(localData));
    }

    public async fetch(httpCall: HttpNetworkFetch) {
        const localData = await this.getLocal(httpCall.roomName, httpCall.nodeName, httpCall.paramObject);
        if (localData) {
            const localDataForPagination: HttpSelect | undefined = {
                universalUniqueUserIdentifier: localData.data.universalUniqueUserIdentifier,
                roomName: localData.data.roomName,
                nodeName: localData.data.nodeName,
                paramObject: localData.data.paramObject,
                result: localData.data.result,
            };

            HttpPagination.getInstance().sendData(localDataForPagination, localData.nodeIdentifier, httpCall.paginationID, true);
        } else {
            console.warn(`No offline data found for ${httpCall.roomName}-->${httpCall.nodeName}-->${httpCall.paramObject}`);
        }
    }
}
