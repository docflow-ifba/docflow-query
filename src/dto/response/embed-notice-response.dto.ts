export class EmbedNoticeResponseDTO {
    docflow_notice_id: string;
    content_md: string;
    clean_md: string;
    tables_md: string[];
    error?: string;
}