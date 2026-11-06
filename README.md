npm test -- --runInBand tests/health.test.js tests/auth.test.js

npx @redocly/cli build-docs docs/openapi.yml --output docs/api-docs.html
 npx @redocly/cli preview-docs docs/openapi.yml --port 8081

## Face attendance

Face recognition runs on the backend using the bundled local model; face images are not sent to a hosted recognition service. Employees can enroll at `POST /api/v1/auth/face/enroll` with an authenticated `multipart/form-data` request containing an `image` file. The enrollment selfie is uploaded through the existing ImageKit service and its returned URL is saved as the user's avatar; the face embedding is stored privately.

Check-in and check-out use `POST /api/v1/attendance/check-in` and `/api/v1/attendance/check-out`, also as multipart requests with `image`, `organizationId`, and location (`lat` and `lng`). The backend requires a face match and enforces the assigned shift window and store radius. Face matching does not currently include liveness or anti-spoof detection.