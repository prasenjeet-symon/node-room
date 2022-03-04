import { ChangesType } from './base-class/dao-transaction-base';
import { SocketNetworkManager } from './network/socket-manager';
import { SocketSelectManager } from './select-managers/socket-select-manager';

export class ChangeDetector {
    private static _changeDetector: ChangeDetector;

    public static getInstance(): ChangeDetector {
        if (!ChangeDetector._changeDetector) {
            ChangeDetector._changeDetector = new ChangeDetector();
        }
        return ChangeDetector._changeDetector;
    }

    private constructor() {}

    public changeDetected(change: ChangesType) {
        // emit the change to events functions

        // emit to local change event
        const socketSelectManager = SocketSelectManager.getInstance();
        socketSelectManager
            .getAllDelta(change.tables[0].table_name)
            .then((delta) => {
                const socketNetworkManager = SocketNetworkManager.getInstance();
                delta.forEach((d) => {
                    const socketClient = socketNetworkManager.getSocketClient(d.socketID);
                    if (socketClient) {
                        socketClient.sendDelta(d.allDelta);
                    }
                });
            })
            .catch((err) => {
                console.error(err);
            });
    }
}
