import { connect, ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { WLog } from '../WLog.js';
import { Logger } from 'winston';
import { AbstractQueueMessageHandler } from './AbstractQueueMessageHandler.js';
import { Message } from '../types/Message.js';

export class RabbitQueueHandler implements AbstractQueueMessageHandler {
    private static instance: RabbitQueueHandler | null = null;

    private connection!: AmqpConnectionManager;
    private channelWrapper!: ChannelWrapper;
    private log: Logger;

    private constructor() {
        this.log = WLog.getLogger();
    }
    /**
     * Gets instance of singleton class
     * @param knownQueueNames what Queue Names the service is aware of and should be asserted for
     * @returns singleton instance
     */
    static async getInstance(knownQueueNames: string[]): Promise<RabbitQueueHandler> {
        if (this.instance) {
            return this.instance;
        } else {
            this.instance = await this.establishConnection(knownQueueNames);
            return this.instance;
        }
    }
    /**
     * Establishs connection to the RabbitMQ Instance
     * @param knownQueueNames what Queue Names the service is aware of and should be asserted for
     * @returns rabbitMQ connection object
     */
    static async establishConnection(knownQueueNames: string[]): Promise<RabbitQueueHandler> {
        const handler = new RabbitQueueHandler();
        handler.connection = connect(['amqp://admin:022618Admin~8097@localhost:5672']);

        // Create and setup the channel
        handler.channelWrapper = handler.connection.createChannel({
            json: true,
            setup: async (channel: any) => {
                for (let queuename of knownQueueNames) {
                    await channel.assertQueue(queuename, { durable: true });
                }
                handler.log.info('Channel setup complete and queue declared');
            },
        });

        // Wait for initial connection to finish before returning
        await new Promise<void>((resolve, reject) => {
            handler.channelWrapper.once('connect', () => resolve());
            handler.channelWrapper.once('error', reject);
        });

        handler.connection.on('connect', () => handler.log.info('RabbitQueueHandler connected to RabbitMQ!'));
        handler.connection.on('disconnect', (err) => handler.log.error('RabbitQueueHandler disconnected from RabbitMQ!', err));

        return handler;
    }
    /**
     * Sends provided message to a provided queue
     * @param queueName name of the queue to send the message to
     * @param message The message to be sent in Message format
     */
    async sendMessage(queueName: string, message: Message): Promise<void> {
        if (!this.verifyConnetion()) {
            return;
        }

        await this.channelWrapper.sendToQueue(queueName, message);
        this.log.info(`Sent message to "${queueName}"`, message);
    }
    /**
     * Subscribes to queue and sets up the provided callback to be ran when a message is consumed from that queue
     * @param queueName Name of the queue to subscribe to
     * @param callback Callback to be called when a message is consumed
     */
    async subscribeToQueue(queueName: string, callback: Function): Promise<any> {
        if (!this.verifyConnetion()) {
            return;
        }

        await this.channelWrapper.addSetup(async (channel: any) => {
            await channel.assertQueue(queueName, { durable: true });

            // Here is your subscription
            await channel.consume(queueName, async (message: any) => {
                if (!message) return; // In case of cancellation

                try {
                    //process using provided callback
                    await callback(message.content.toString());

                    // Acknowledge successful processing
                    channel.ack(message);
                } catch (err) {
                    console.error('Error handling message:', err);
                }
            });
        });
    };

    /**
     * Verifys connetion with RabbitMQ
     */
    verifyConnetion() {
        if (!this.connection) {
            this.log.error("Connection Verification Failed within RabbitMQ Queue Handler!");
            return false;
        }
        return true;
    }

    /**
     * Closes connection with Rabbit MQ
     */
    closeConnection() {
        this.connection.close();
    };
}
