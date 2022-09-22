import { RabbitMQMessage } from '../main-interface';
import { ClientInstanceManager } from './clear-client';
import { DownStreamManager } from './downstream-manager';

export class RabbitMq {
    private static _instance: RabbitMq;

    private constructor() {
        this.listenToIncomingMessages();
        this.listenClientDead();
        this.listenClientAlive();
    }

    public static getInstance(): RabbitMq {
        if (!RabbitMq._instance) RabbitMq._instance = new RabbitMq();
        return RabbitMq._instance;
    }
    /**
     *
     *
     *
     *
     */

    private async listenToIncomingMessages() {
        // TODO : listen for the incoming medication node , using rabbitmq
        EventEmitterManager.getInstance().on('rabbitmq', (msg: string) => {
            this.handleIncomingMessage(JSON.parse(msg));
        });
    }

    private async listenClientDead() {
        // TODO : listen for the client dead event , using rabbitmq
        EventEmitterManager.getInstance().on('clientDead', (clientInstanceUUID: string) => {
            this.handleClientDead(clientInstanceUUID);
        });
    }

    private listenClientAlive() {
        // TODO : listen for the client alive event , using rabbitmq
        EventEmitterManager.getInstance().on('clientAlive', (clientInstanceUUID: string) => {
            this.handleClientAlive(clientInstanceUUID);
        });
    }

    /**
     *
     *
     *
     *
     */
    private async handleIncomingMessage(msg: RabbitMQMessage) {
        DownStreamManager.getInstance().modificationNodeReceived(msg);
    }

    private async handleClientDead(clientInstanceUUID: string) {
        DownStreamManager.getInstance().removeDownStreamClient(clientInstanceUUID);
    }

    private async handleClientAlive(clientInstanceUUID: string) {
        // tell the appropriate client instance that it is alive , if it exists
        const clientInstance = await ClientInstanceManager.getInstance().getClientInstance(clientInstanceUUID);
        if (clientInstance) {
            clientInstance.clientIsAlive();
        }
    }

    /**
     *
     *
     *
     *
     */
    // emit to all the server instances
    public async emitToAllServerInstances(msg: RabbitMQMessage) {
        // TODO : send to all the server instances that modification node is received , using rabbitmq
        EventEmitterManager.getInstance().emit('rabbitmq', JSON.stringify(msg));
    }

    // emit client dead event
    public async emitClientDead(clientInstanceUUID: string) {
        // TODO : send to all the server instances that this client is dead , using rabbitmq
        EventEmitterManager.getInstance().emit('clientDead', clientInstanceUUID);
    }

    // emit client alive event
    public async emitClientAlive(clientInstanceUUID: string) {
        // TODO : send to all the server instances that this client is alive , using rabbitmq
        EventEmitterManager.getInstance().emit('clientAlive', clientInstanceUUID);
    }
}

// nodejs event emitter

class EventEmitterManager {
    private static _instance: EventEmitterManager;
    private eventEmitter: any;

    private constructor() {
        const EventEmitter = require('events');
        this.eventEmitter = new EventEmitter();
    }

    public static getInstance(): EventEmitterManager {
        if (!EventEmitterManager._instance) EventEmitterManager._instance = new EventEmitterManager();
        return EventEmitterManager._instance;
    }

    public emit(event: string, data: any) {
        this.eventEmitter.emit(event, data);
    }

    public on(event: string, callback: any) {
        this.eventEmitter.on(event, callback);
    }

    public removeListener(event: string, callback: any) {
        this.eventEmitter.removeListener(event, callback);
    }

    public removeAllListeners(event: string) {
        this.eventEmitter.removeAllListeners(event);
    }
}
