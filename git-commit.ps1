git add .gitignore README.md LICENSE
git commit -m "docs: Add README, License, and gitignore"

git add backend/build.gradle backend/settings.gradle backend/gradlew backend/gradlew.bat backend/gradle/ backend/src/main/resources/ backend/src/main/java/com/tinexus/smriti/SmritiApplication.java backend/src/main/java/com/tinexus/smriti/config/ backend/src/main/java/com/tinexus/smriti/util/ backend/src/main/java/com/tinexus/smriti/exception/
git commit -m "chore(backend): Initialize Spring Boot backend configuration and utilities"

git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/tailwind.config.js frontend/postcss.config.js frontend/index.html frontend/src/main.jsx frontend/src/App.jsx frontend/src/index.css frontend/src/components/ui/ frontend/.oxlintrc.json
git commit -m "chore(frontend): Initialize React frontend with Vite, Tailwind, and core UI components"

git add backend/src/main/java/com/tinexus/smriti/model/ backend/src/main/java/com/tinexus/smriti/repository/
git commit -m "feat(backend): Implement core domain models and JPA repositories"

git add backend/src/main/java/com/tinexus/smriti/security/ backend/src/main/java/com/tinexus/smriti/service/AuthService.java backend/src/main/java/com/tinexus/smriti/controller/AuthController.java backend/src/main/java/com/tinexus/smriti/dto/
git commit -m "feat(backend): Add JWT Authentication, Security Config, and DTOs"

git add backend/src/main/java/com/tinexus/smriti/service/ProjectService.java backend/src/main/java/com/tinexus/smriti/service/SecretService.java backend/src/main/java/com/tinexus/smriti/service/EncryptionService.java backend/src/main/java/com/tinexus/smriti/controller/ProjectController.java backend/src/main/java/com/tinexus/smriti/controller/SecretController.java backend/src/main/java/com/tinexus/smriti/controller/UserController.java
git commit -m "feat(backend): Implement Project and Secret management services and APIs"

git add backend/src/main/java/com/tinexus/smriti/service/ backend/src/main/java/com/tinexus/smriti/controller/
git commit -m "feat(backend): Add AI integration, Magic Links (2FA), and Audit Logging"

git add frontend/src/pages/ frontend/src/components/ frontend/src/services/ frontend/src/utils/ frontend/src/context/ frontend/src/assets/
git commit -m "feat(frontend): Implement application pages, API integration, and business logic"

git add cli/
git commit -m "feat(cli): Build Smriti terminal CLI for secret fetching and env injection"

git add .
git commit -m "chore: Finalize remaining files and structural glue"
