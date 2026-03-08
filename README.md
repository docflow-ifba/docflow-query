# docflow-query

Backend NestJS responsável pela **API REST**, **autenticação JWT** e **comunicação em tempo real** via WebSocket. Atua como orquestrador entre o frontend e o microsserviço de IA (docflow-core) através do Kafka. Parte da arquitetura DOC:FLOW.

---

## Funcionalidades

- Autenticação JWT com dois papéis: `ADMIN` (dashboard completo) e `USER` (apenas chat)
- CRUD de editais (upload de PDF → publica no Kafka `docflow-embed`)
- CRUD de organizações e usuários
- Gateway WebSocket (`/socket.io`) para chat em tempo real
- Produtor Kafka de perguntas e consumidor de respostas em streaming
- Banco SQLite via TypeORM (sincronização automática em dev)

---

## Estrutura

```
src/
├── main.ts                          # Bootstrap + prefixo /api/v1
├── app.module.ts                    # Módulo raiz — DB, JWT, Kafka
├── controller/                      # auth, notice, organization, user, conversation
├── service/                         # Lógica de negócio + KafkaService
├── gateway/
│   └── conversation.gateway.ts      # WebSocket ↔ Kafka bridge
├── entity/                          # TypeORM: User, Organization, Notice, Conversation
├── guard/                           # jwt-auth.guard.ts, jwt-ws.guard.ts
├── dto/                             # DTOs de request e response
└── strategy/jwt.strategy.ts
```

---

## Pré-requisitos

- Node.js 20+
- Kafka rodando em `localhost:9092` (via `docker-compose up` no docflow-core)

---

## Instalação

```bash
cd docflow-query
npm install
```

---

## Configuração

Crie o arquivo `.env` na raiz de `docflow-query/`:

```env
KAFKA_BROKER=localhost:9092
KAFKA_EMBED_TOPIC=docflow-embed
KAFKA_EMBED_RESULT_TOPIC=docflow-embed-result
KAFKA_QUESTION_TOPIC=docflow-question
KAFKA_ANSWER_TOPIC=docflow-answer

JWT_SECRET=<string-hex-aleatória>
JWT_EXPIRES_IN=24h
```

---

## Execução

```bash
# Desenvolvimento — hot reload
npm run start:dev

# Produção
npm run build && npm run start:prod
```

API disponível em: `http://localhost:3001/api/v1`

---

## Testes

```bash
npm run test        # Unitários
npm run test:e2e    # E2E
npm run test:cov    # Cobertura
```

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| NestJS 11 | Framework principal |
| TypeORM + SQLite | Persistência de dados |
| Passport + JWT | Autenticação |
| Socket.IO | WebSocket para chat em tempo real |
| KafkaJS | Comunicação assíncrona com docflow-core |

---

## Licença

MIT License © 2025
