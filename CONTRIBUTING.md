# Contributing to Smriti

Any and all contributions are welcome, though we have a handful of strict rules and security standards that must be followed.

Smriti is a Secret and Context Manager. When dealing with encryption, credentials, and access control, code quality is not just a preference; it is a critical security requirement.

---

## The Elephant in the Room: LLM and AI Policy

To get this out of the way immediately:

**Unattended "AI" agents and unreviewed LLM code dumps are expressly forbidden.** 

Do not use an AI tool to generate your entire PR, invent architecture, or produce massive amounts of boilerplate that you do not personally understand. 

- **Allowed:** Developer assistance tools like IDE autocompletion, Copilot inline suggestions, and syntax lookups.
- **Forbidden:** Generating full PRs via autonomous agents, committing hallucinated code, or submitting changes where you cannot defend and explain every single line.

This stance exists because LLMs frequently hallucinate security assumptions, generate fragile regex patterns, and leak decrypted data in error logs. If you submit a PR, **you** are responsible for the code, not the model.

---

## The Cardinal Rules of a Secret Manager

Any contribution that violates these rules will be rejected immediately:

### 1. Zero Secret Leakage in Logs
Never log, print, or serialize plaintext secret values. 
- Do not use `System.out.println` or standard logger statements with secret values.
- In exception handlers, return generic, safe messages. Never include raw user inputs or keys in error traces.
- In CLI commands, secret values go strictly to standard output (`stdout`) when pulled; all informational logs, warnings, and errors must go to standard error (`stderr`).

### 2. Encryption at Rest is Enforced
All secret values must be encrypted using `AesEncryptionUtil` (AES-256-GCM) before touching the PostgreSQL database. Plaintext secrets must never exist in database columns.

### 3. Audit Trails are Mandatory
Every operation that touches a secret (Created, Viewed, Updated, Deleted, Exported, Rolled Back) must trigger an audit log event via `AuditLogService`. There are no silent operations in Smriti.

### 4. Zero Decrypted Secrets to LLMs
Smriti integrates with Google Gemini for smart metadata search and note categorization. **Decrypted secrets must never be passed into an LLM prompt.** Gemini receives only sanitized user queries, service tags, and non-sensitive notes.

---

## General Design Principles

### 1. Stateless Architecture
The backend must remain completely stateless. Authentication is handled exclusively through JWT tokens and hashed Personal Access Tokens (PAT). Do not introduce server-side HTTP sessions or in-memory session stores.

### 2. Backward Compatibility for CLI
Developers use `smriti` in CI/CD pipelines and automated deployment scripts.
- Never make breaking changes to existing CLI commands (`smriti pull`, `smriti run`, `smriti login`).
- Keep command outputs predictable. `smriti pull` must output clean, parseable `.env` lines.

### 3. Non-Destructive Versioning
When a user updates a secret, the system must archive the previous state into a historical version record before applying the change. Never overwrite historical records in place.

### 4. Minimal Dependency Footprint
Every dependency added is a potential supply-chain attack surface. Do not introduce new third-party libraries for trivial tasks that can be accomplished with standard Java 21 or Node.js built-ins.

---

## Structuring New Features: Architecture Pattern

When adding a new feature or modifying existing business logic, follow Smriti's layered structure strictly.

```
Request (Controller)
   │
   ▼
Validation (DTO Record)
   │
   ▼
Business Logic (Service)
   ├── Encryption Layer (AesEncryptionUtil)
   ├── Audit Event (AuditLogService)
   └── Persistence (Repository)
```

### Example: Handling Secret Actions

#### The Bad Way (Anti-pattern):
Placing encryption, logging, and database operations directly in the Controller or skipping the audit trail:

```java
// BAD: Logic in controller, no audit trail, no DTO validation
@PostMapping("/secret")
public Secret saveSecret(@RequestBody Map<String, String> body) {
    Secret secret = new Secret();
    secret.setValue(aesUtil.encrypt(body.get("val")));
    return repository.save(secret); // Missing audit log!
}
```

#### The Smriti Way:
Keep the Controller thin, validate inputs via immutable records, encrypt inside the Service, and emit an audit event:

```java
// 1. Controller receives immutable, validated DTO
@PostMapping
public ResponseEntity<ApiResponse<SecretResponse>> createSecret(
        @PathVariable UUID projectId,
        @Valid @RequestBody SecretCreateRequest request,
        @AuthenticationPrincipal UserDetails userDetails) {

    User user = resolveUser(userDetails);
    SecretResponse response = secretService.createSecret(projectId, request, user);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
}

// 2. Service orchestrates encryption, persistence, and audit logging
@Transactional
public SecretResponse createSecret(UUID projectId, SecretCreateRequest request, User user) {
    Project project = getProjectWithWriteAccess(projectId, user);

    // Encrypt at rest
    String encryptedValue = aesEncryptionUtil.encrypt(request.value());

    Secret secret = Secret.builder()
            .project(project)
            .name(request.name())
            .encryptedValue(encryptedValue)
            .environment(request.environment())
            .build();

    Secret saved = secretRepository.save(secret);

    // Mandatory audit log
    auditLogService.log(project, user, ActionType.SECRET_CREATED, saved.getName());

    return SecretResponse.fromEntity(saved);
}
```

---

## Code Formatting and Standards

### Java (Backend)
- **Indentation:** 4 spaces.
- **DTOs:** Use Java 21 `record` types for all request and response bodies.
- **Lombok:** Permitted for entities and service injection (`@RequiredArgsConstructor`, `@Getter`, `@Setter`, `@Builder`).
- **Null Safety:** Avoid returning raw nulls; use `Optional<T>` in service and repository lookup methods.

### JavaScript / React (Frontend)
- **Indentation:** 2 spaces.
- **Components:** Functional components with React hooks.
- **Styling:** Tailwind CSS utility classes. Always verify both Light and Dark mode styling.
- **Mobile First:** Verify responsive layouts down to 360px screen width.

### Node.js (CLI)
- **Indentation:** 2 spaces.
- **Style:** Modern ES Modules (`import`/`export`).
- **Exit Codes:** Clean POSIX exit codes (`0` on success, `1` on error).

---

## Pull Request Checklist

Before submitting a PR, ensure you have completed the following:

1. **Branch from `alpha`:** All PRs must target the `alpha` branch.
2. **Verify Frontend Build:** Run `npm run build` inside `frontend/` and confirm zero build errors.
3. **Verify Backend Build:** Run `./gradlew bootJar -x test` inside `backend/` and verify the JAR compiles cleanly.
4. **Clean Commits:** Follow standard conventional commit prefixes:
   - `feat: add cli token expiry notification`
   - `fix: resolve mobile overflow in audit logs`
   - `refactor: simplify project membership check`
   - `docs: update setup documentation`
5. **Explain Your Choices:** In the PR description, explain what problem you are solving and why you chose this specific implementation.

---

## Quick Local Setup Reference

### Backend
```bash
cd backend
cp .env.example .env     # Configure DB and keys
./gradlew bootRun        # (or .\gradlew.bat bootRun on Windows)
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### CLI
```bash
cd cli
npm install
npm link                 # Test globally with `smriti login`
```

---

## Security Disclosures

If you discover a security vulnerability or potential credential leak mechanism in Smriti, please do not open a public issue. 

Email the author directly at: `support@tinexus.in`.
