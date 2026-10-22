npm test -- --runInBand tests/health.test.js tests/auth.test.js

npx @redocly/cli build-docs docs/openapi.yml --output docs/api-docs.html
 npx @redocly/cli preview-docs docs/openapi.yml --port 8081