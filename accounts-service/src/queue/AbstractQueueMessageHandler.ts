//Meant to be implemented using the singleton pattern

import { Message } from "../types/Message.js";

export class AbstractQueueMessageHandler {

    /**
     * Gets instance of singleton class
     * @param knownQueueNames what Queue Names the service is aware of and should be asserted for
     * @returns singleton instance
     */
    static async getInstance(knownQueueNames: string[]): Promise<any> { };

    /**
     * Establishs connection to the Queue Instance
     * @param knownQueueNames what Queue Names the service is aware of and should be asserted for
     * @returns Queue connection object
     */
    static async establishConnection(knownQueueNames: string[]): Promise<any> { };

    /**
     * Sends provided message to a provided queue
     * @param queueName name of the queue to send the message to
     * @param message The message to be sent in Message format
     */
    async sendMessage(queueName: string, message: Message) { };

    /**
     * Subscribes to queue and sets up the provided callback to be ran when a message is consumed from that queue
     * @param queueName Name of the queue to subscribe to
     * @param callback Callback to be called when a message is consumed
     */
    async subscribeToQueue(queueName: string, callback: Function): Promise<any> { };

    /**
     * Closes connection with Rabbit MQ
     */
    closeConnection() { };
}