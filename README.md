npm test -- --runInBand tests/health.test.js tests/auth.test.js

npx @redocly/cli build-docs docs/openapi.yml --output docs/api-docs.html
 npx @redocly/cli preview-docs docs/openapi.yml --port 8081

## Face attendance

Face recognition runs on the backend using the bundled local model. On enrollment, the face embedding is saved privately on the user's `faceEmbedding` field in MongoDB before attempting the ImageKit avatar upload. The avatar is saved as an ImageKit URL when upload succeeds; if ImageKit is unavailable, the selfie is stored as a data URL in the user's MongoDB `avatar` field instead. Employees can enroll at `POST /api/v1/auth/face/enroll` with an authenticated `multipart/form-data` request containing an `image` file.

Check-in and check-out use `POST /api/v1/attendance/check-in` and `/api/v1/attendance/check-out`, also as multipart requests with `image`, `organizationId`, and location (`lat` and `lng`). The backend requires a face match and enforces the assigned shift window and store radius. Face matching does not currently include liveness or anti-spoof detection.