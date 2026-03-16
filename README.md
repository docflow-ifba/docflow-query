# docflow-query

Backend NestJS responsável pela **API REST**, **autenticação JWT** e **comunicação em tempo real** via WebSocket. Atua como orquestrador entre o frontend e o microsserviço de IA (docflow-core) através do Kafka. Parte da arquitetura DOC:FLOW.

---

## Funcionalidades

- Autenticação JWT com dois papéis: `ADMIN` (dashboard completo) e `USER` (apenas chat)
- RBAC com `RolesGuard` + decorator `@Roles()` — criação de admins protegida por role
- CRUD de editais (upload de PDF → publica no Kafka `docflow-embed`)
- CRUD de organizações e usuários
- Gateway WebSocket (`/socket.io`) para chat em tempo real
- Produtor Kafka de perguntas e consumidor de respostas em streaming
- Timeout de resposta sem polling — baseado em `Map` + `setTimeout`
- Banco SQLite via TypeORM (sincronização automática em dev)

---

## Estrutura

```
src/
├── constants/                       # Constantes globais (timeouts, limites, mensagens)
├── controller/                      # auth, notice, organization, user, conversation
├── decorator/                       # @CurrentUser(), @Roles()
├── dto/
│   ├── request/                     # DTOs de entrada (validados com class-validator)
│   └── response/                    # DTOs de saída
├── entity/                          # TypeORM: User, Organization, Notice, Conversation
├── enum/                            # NoticeStatus, Sender, UserRole
├── gateway/
│   └── conversation.gateway.ts      # WebSocket ↔ Kafka bridge
├── guard/                           # JwtAuthGuard, JwtWsGuard, RolesGuard
├── service/                         # Lógica de negócio + KafkaService
├── strategy/                        # Passport JWT strategy
├── types/                           # JwtPayload, AuthenticatedUser
├── main.ts                          # Bootstrap + prefixo /api
└── app.module.ts                    # Módulo raiz — DB, JWT, Kafka
```

---

## Endpoints REST

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/v1/auth/login` | Público | Login, retorna JWT |
| POST | `/api/v1/auth/register` | Público | Cadastro de usuário (role USER) |
| POST | `/api/v1/auth/register/admin` | ADMIN | Cadastro de admin (requer JWT de admin) |
| GET | `/api/v1/users/:id` | JWT | Busca usuário por ID |
| PUT | `/api/v1/users/:id` | JWT | Atualiza nome/email do usuário |
| GET | `/api/v1/organizations` | JWT | Lista organizações (`?query=nome`) |
| GET | `/api/v1/organizations/:id` | JWT | Busca organização por ID |
| POST | `/api/v1/organizations` | JWT | Cria organização |
| PUT | `/api/v1/organizations/:id` | JWT | Atualiza organização |
| DELETE | `/api/v1/organizations/:id` | JWT | Remove organização |
| GET | `/api/v1/notices` | JWT | Lista editais com filtros opcionais |
| GET | `/api/v1/notices/:id` | JWT | Busca edital por ID |
| POST | `/api/v1/notices` | JWT | Cria edital (PDF em base64) |
| PUT | `/api/v1/notices/:id` | JWT | Atualiza edital |
| DELETE | `/api/v1/notices/:id` | JWT | Remove edital |
| POST | `/api/v1/notices/embed/:id` | JWT | Inicia embedding do PDF via Kafka |
| GET | `/api/v1/conversations` | JWT | Lista conversas (`?noticeId=...`) |
| DELETE | `/api/v1/conversations/clear/:noticeId` | JWT | Limpa histórico de conversa |

---

## WebSocket

Conecte-se em `ws://localhost:3001` com `auth: { token: "Bearer <jwt>" }`.

**Evento de entrada:**
```json
{ "event": "question", "data": { "noticeId": "uuid", "prompt": "Qual o prazo?" } }
```

**Eventos de saída** (nome do evento = `docflowNoticeId` do edital):
```json
{ "conversation": { ... }, "done": false }
{ "conversation": { ... }, "done": true }
```

---

## Fluxo Kafka

| Tópico | Direção | Propósito |
|--------|---------|-----------|
| `docflow-embed` | Produz | Envia PDF para processamento no `docflow-core` |
| `docflow-embed-result` | Consome | Recebe resultado do embedding (markdown + chunks) |
| `docflow-question` | Produz | Envia pergunta do usuário |
| `docflow-answer` | Consome | Recebe chunks da resposta da IA |

---

## Pré-requisitos

- Node.js 20+
- Kafka rodando em `localhost:9092` (via `docker-compose up` no `docflow-core`)

---

## Instalação e configuração

```bash
cd docflow-query
npm install
```

Crie `.env` na raiz de `docflow-query/`:

```env
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=docflow-query-producer
KAFKA_GROUP_ID=docflow-query-consumer
KAFKA_EMBED_TOPIC=docflow-embed
KAFKA_QUESTION_TOPIC=docflow-question
KAFKA_ANSWER_TOPIC=docflow-answer

JWT_SECRET=<string-hex-aleatória>
JWT_EXPIRES_IN=24h
```

---

## Execução

```bash
npm run start:dev          # Desenvolvimento com hot reload
npm run build              # Compila TypeScript
npm run start:prod         # Executa dist/main.js
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
| Passport + JWT | Autenticação stateless |
| Socket.IO | WebSocket para chat em tempo real |
| KafkaJS | Comunicação assíncrona com docflow-core |
| bcryptjs | Hash de senhas |
| class-validator | Validação de DTOs |

---

## Decisões de arquitetura

- **Timeout sem polling** — `ConversationService` registra um `setTimeout` por conversa pendente em um `Map<conversationId, cancelFn>`. Quando o `docflow-core` responde com `done: true`, o timer é cancelado. Se estoura o timeout (3min), uma mensagem de fallback é enviada via WebSocket — sem nenhum loop de polling no banco.
- **RBAC simples** — `RolesGuard` + `@Roles()` protegem rotas sensíveis sem acoplamento ao Passport.
- **`@CurrentUser()`** — decorator de parâmetro que extrai o usuário autenticado do request, substituindo casts manuais de `req.user`.
- **Sem vazamento de dados** — `pdfBase64` é excluído via destructuring antes de retornar o DTO do `POST /notices`.
- **TypeScript estrito** — `strictNullChecks` e `noImplicitAny` habilitados.

---

## Licença

MIT License © 2025
