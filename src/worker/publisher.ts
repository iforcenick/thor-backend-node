import {AutoWired, Inject, Singleton} from 'typescript-ioc';
import {Config} from '../config';
import {Exchanges} from './exchanges';
import * as ampq from 'amqplib';
import {  Errors } from 'typescript-rest';


@Singleton
export class RmqConnection {
    private _connection: ampq.Connection;
    private _channel: ampq.Channel;
    @Inject config: Config;

    async connect() {
        if (!this._connection) {
            this._connection = await ampq.connect(this.config.get('rmq.hostUri'));
        }
    }

    async createChannel(): Promise<ampq.Channel> {
        if (!this._connection) {
            throw new Error('Rmq connection is not initialized, connect before creating channel');
        }

        if (!this._channel) {
            this._channel = await this._connection.createChannel();
        }
        return this._channel;
    }
}

export interface IMessage {
    readonly exchange: Exchanges;
    readonly routingKey: string;
    readonly payload: any;
}


@AutoWired
export class WorkerPublisher {
    @Inject rmqConnection: RmqConnection;

    async publish(model: IMessage): Promise<void> {
        if (!model.exchange) {
            throw new Errors.NotAcceptableError('exchange is empty');
        }
        if (!model.routingKey) {
            throw new Errors.NotAcceptableError('routingKey is empty');
        }
        if (!model.payload) {
            throw new Errors.NotAcceptableError('payload is empty');
        }
        await this.rmqConnection.connect();
        const channel = await this.rmqConnection.createChannel();
        await channel.publish(model.exchange, model.routingKey, Buffer.from(JSON.stringify(model.payload)));
    }
}

