import { MessageType } from "./MessageType";

export class Message {
   readonly MessageType: MessageType;
   readonly MessageId: string;
   readonly Info: string | null;
}