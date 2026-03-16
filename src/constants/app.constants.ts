export const ANSWER_TIMEOUT_MS = 180_000; // 3 minutes — accounts for slow LLM inference
export const KAFKA_MAX_MESSAGE_SIZE = 50 * 1024 * 1024; // 50MB
export const KAFKA_REQUEST_TIMEOUT_MS = 180_000; // 3 minutes
export const KAFKA_MAX_RETRIES = 5;
export const KAFKA_MAX_IN_FLIGHT_REQUESTS = 5;
export const BCRYPT_ROUNDS = 10;
export const ORG_SEARCH_LIMIT = 10;
export const TIMEOUT_MESSAGE = 'Desculpe, não conseguimos gerar uma resposta no momento.';
