import { Message } from "./Message";
import { MessageType } from "./MessageType";
import { Project } from "../core/Project";

export class ProjectInfoMessage extends Message {
   readonly MessageType: MessageType = MessageType.ProjectInfo;
   readonly Project: Project;
}

export class ProjectListMessage extends Message {
   readonly MessageType: MessageType = MessageType.ProjectInfo;
   readonly Projects: Project[];
}

export class RequestProjectInfoMessage extends Message {
   readonly MessageType: MessageType = MessageType.ProjectInfo;
   readonly Name: string;
}

export class RequestProjectListMessage extends Message {
   readonly MessageType: MessageType = MessageType.ProjectList;
}

export class RequestProjectCreateMessage extends RequestProjectInfoMessage {
   readonly MessageType: MessageType = MessageType.ProjectCreate;
}

export class RequestProjectDeleteMessage extends RequestProjectInfoMessage {
   readonly MessageType: MessageType = MessageType.ProjectDelete;
}

export class RequestProjectUpdateMessage extends RequestProjectInfoMessage {
   readonly MessageType: MessageType = MessageType.ProjectUpdate;
}