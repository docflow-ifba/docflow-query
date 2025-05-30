import { MessageRequestDTO } from "./message-request.dto";

export class AskQuestionMessageDTO {
    question: string;
    docflow_notice_id: string;
    conversation_id: string;
    messages?: MessageRequestDTO[];
}