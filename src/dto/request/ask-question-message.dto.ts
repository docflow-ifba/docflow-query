import { MessageRequestDTO } from "./message-request.dto";

export class AskQuestionMessageDTO {
    prompt: string;
    docflow_notice_id: string;
    user_id?: string;
    answer_conversation_id?: string;
    messages?: MessageRequestDTO[];
}