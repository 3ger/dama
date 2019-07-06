import { Message } from "./Message";
import { MessageType } from "./MessageType";

export class OKMessage extends Message {
   readonly MessageType: MessageType = MessageType.OK;
}