import { Message } from "./Message";
import { ErrorCode } from "./ErrorCode";
import { MessageType } from "./MessageType";

export class ErrorMessage extends Message {
   readonly MessageType: MessageType = MessageType.Error;
   readonly ErrorCode: ErrorCode;
}