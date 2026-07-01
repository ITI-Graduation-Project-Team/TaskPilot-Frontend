# API Contract — TaskPilot

> Generated for Angular frontend integration.
> **Generated on:** 2026-06-28
>
> **Base URLs** (from `launchSettings.json`):
> | Profile | URL |
> |---------|-----|
> | http | `http://localhost:5157` |
> | https | `https://localhost:7209` |
> | IIS Express | `http://localhost:41030` (SSL port 44388) |
>
> **Authentication:** JWT Bearer (configured in `Program.cs`)
> - Issuer: `TaskPilotApi`
> - Audience: `TaskPilotUsers`
> - Token Duration: **15 minutes**
> - Refresh Token Expiry: **7 days**, Inactivity Timeout: **8 hours**

---

## Global Notes

### Required Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | On `[Authorize]` endpoints | JWT access token |
| `Content-Type` | `application/json` | For JSON bodies | Default for most endpoints |
| `Content-Type` | `multipart/form-data` | For file uploads | Used on `[FromForm]` endpoints |
| `lang` | `en` or `ar` | ❌ Optional | Language preference. Defaults to `en`. Drives which localized content is returned (English or Arabic field variants). Set via global `LanguageMiddleware`. |

### Global Response Envelope — `ApiResponse`

**Every** endpoint wraps its response in a consistent `ApiResponse` envelope:

**Success:**
```json
{
  "succeeded": true,
  "message": "Optional success message or null",
  "data": { /* payload — omitted when null */ }
}
```

**Failure:**
```json
{
  "succeeded": false,
  "message": "Human-readable description of the first error",
  "errors": [
    {
      "code": "ERROR_CODE",
      "description": "Localized description"
    }
  ],
  "data": null
}
```

### Global Error Status Code Mapping

The base controller (`ApiControllerBase`) maps domain `ErrorType` to HTTP status codes:

| ErrorType | HTTP Status |
|-----------|-------------|
| `Validation` | `400 Bad Request` |
| `NotFound` | `404 Not Found` |
| `Conflict` | `409 Conflict` |
| `Unauthorized` | `401 Unauthorized` |
| `Forbidden` | `403 Forbidden` |
| `Failure` (default) | `500 Internal Server Error` |

### 401 Unauthorized Shape (JWT Challenge)

When a JWT challenge occurs, the response body is a `Result` object (not the `ApiResponse` envelope):
```json
{
  "isSuccess": false,
  "errors": [{ "code": "UNAUTHORIZED", "description": "..." }]
}
```

### Enum Serialization

All enums are serialized as **strings** (via `JsonStringEnumConverter` in `Program.cs`), not integers.

### CORS

CORS is configured with `AllowAll` policy — all origins, methods, and headers are permitted.

---

## Endpoints

---

### POST `api/auth/register`

**Controller:** `AuthController` → `Register()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `RegisterDTO` | ✅ | User registration payload |
| `[FromQuery]` | `Role` | `UserRole` (enum) | ✅ | Role to assign to the new user |

**Request Body Model:**
```json
{
  "firstNameEn": "string",
  "lastNameEn": "string",
  "firstNameAr": "string",
  "lastNameAr": "string",
  "email": "string (email format)",
  "password": "string"
}
```
*All fields are `[Required]`. `email` is validated with `[EmailAddress]`.*

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Registration succeeded | `ApiResponse<RegisterResponseDTO>` |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |
| `409 Conflict` | Email already exists | `ApiResponse` with errors |

**Response Body Model (`RegisterResponseDTO` in `data`):**
```json
{
  "userId": "string",
  "email": "string",
  "message": "string"
}
```

#### 📝 Summary
Registers a new user with the specified role. A confirmation email with OTP is sent to the user's email. The Angular app should call this from the registration page. The user must confirm their email before they can log in.

---

### POST `api/auth/login`

**Controller:** `AuthController` → `Login()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `LoginDTO` | ✅ | Login credentials |

**Request Body Model:**
```json
{
  "email": "string (email format)",
  "password": "string"
}
```
*Both fields are `[Required]`. `email` is validated with `[EmailAddress]`.*

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Login succeeded | `ApiResponse<AuthResponseDTO>` |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |
| `401 Unauthorized` | Invalid credentials | `ApiResponse` with errors |

**Response Body Model (`AuthResponseDTO` in `data`):**
```json
{
  "userId": "guid",
  "email": "string",
  "fullName": "string",
  "token": "string (JWT access token)",
  "message": "string",
  "refreshToken": "string",
  "roles": ["string"]
}
```

#### 📝 Summary
Authenticates a user and returns a JWT access token plus refresh token. The Angular app should store the token and attach it as a `Bearer` header. The `roles` array determines which UI features to show (e.g., Admin panel, PM dashboard).

---

### POST `api/auth/confirm-email`

**Controller:** `AuthController` → `ConfirmEmail()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `ConfirmEmailDTO` | ✅ | OTP confirmation payload |

**Request Body Model:**
```json
{
  "email": "string",
  "otp": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Email confirmed | `ApiResponse` (no data) |
| `400 Bad Request` | Invalid OTP or email | `ApiResponse` with errors |

#### 📝 Summary
Confirms the user's email using a one-time password (OTP) sent during registration. The Angular app should present an OTP input screen after registration and call this endpoint. Users cannot log in until their email is confirmed.

---

### POST `api/auth/resend-confirmation`

**Controller:** `AuthController` → `ResendConfirmation()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `ResendConfirmationDTO` | ✅ | Email to resend OTP to |

**Request Body Model:**
```json
{
  "email": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | OTP resent | `ApiResponse` (no data) |
| `400 Bad Request` | Invalid request | `ApiResponse` with errors |

#### 📝 Summary
Resends the email confirmation OTP. The Angular app should offer a "Resend Code" button on the OTP verification screen.

---

### POST `api/auth/google`

**Controller:** `AuthController` → `Google()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `GoogleAuthDTO` | ✅ | Google ID token |

**Request Body Model:**
```json
{
  "idToken": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Login succeeded | `ApiResponse<AuthResponseDTO>` |
| `400 Bad Request` | Invalid token | `ApiResponse` with errors |

#### 📝 Summary
Authenticates a user via Google Sign-In. The Angular app should use the Google Identity SDK (Client ID: `586738650387-koc3m0suvmmc1bsndim8mqls2rpvj9td.apps.googleusercontent.com`) to obtain an ID token, then send it here. Returns the same `AuthResponseDTO` as the standard login.

---

### POST `api/auth/refresh-token`

**Controller:** `AuthController` → `RefreshToken()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `RefreshTokenDTO` | ✅ | Refresh token |

**Request Body Model:**
```json
{
  "refreshToken": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | New tokens issued | `ApiResponse<AuthResponseDTO>` |
| `400 Bad Request` | Invalid/expired refresh token | `ApiResponse` with errors |

#### 📝 Summary
Exchanges a valid refresh token for a new JWT + refresh token pair. The Angular app should call this proactively before the access token expires (15 min) or on receiving a 401. Database changes are persisted (refresh token rotation).

---

### POST `api/auth/logout`

**Controller:** `AuthController` → `Logout()`
**Auth Required:** Yes

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `RevokeTokenDTO` | ✅ | Refresh token to revoke |

**Request Body Model:**
```json
{
  "refreshToken": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Logged out | `ApiResponse` (no data) |
| `401 Unauthorized` | Not authenticated | — |

#### 📝 Summary
Revokes the given refresh token, effectively logging the user out on the server side. The Angular app should call this on user logout and clear stored tokens locally. The refresh token is invalidated in the database.

---

### POST `api/auth/forgot-password`

**Controller:** `AuthController` → `ForgotPassword()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `string` | ✅ | The user's email address (sent as a raw JSON string) |

**Request Body:**
```json
"user@example.com"
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | OTP sent | `ApiResponse` (no data) |
| `400 Bad Request` | Invalid email | `ApiResponse` with errors |

#### 📝 Summary
Sends a password reset OTP to the specified email address. The Angular app should call this from a "Forgot Password" page and then navigate to the OTP + new password entry screen.

---

### POST `api/auth/reset-password`

**Controller:** `AuthController` → `ResetPassword()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `ResetPasswordDTO` | ✅ | Reset password payload |

**Request Body Model:**
```json
{
  "otp": "string",
  "email": "string",
  "password": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Password reset successful | `ApiResponse` (no data) |
| `400 Bad Request` | Invalid OTP or validation error | `ApiResponse` with errors |

#### 📝 Summary
Resets the user's password using the OTP received via `forgot-password`. The Angular app should present a form with OTP, email, and new password fields.

---

### GET `api/auth/invitation/{token}`

**Controller:** `AuthController` → `GetInvitationInfo()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `token` | `string` | ✅ | Invitation token |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Invitation info retrieved | `ApiResponse<InvitationInfoResponse>` |
| `404 Not Found` | Invalid token | `ApiResponse` with errors |

**Response Body Model (`InvitationInfoResponse` in `data`):**
```json
{
  "email": "string",
  "companyName": "string",
  "userExists": true,
  "token": "string"
}
```

#### 📝 Summary
Retrieves invitation details by token. The Angular app should call this when a user navigates to an invitation link (e.g., `/invite?token=xxx`). The `userExists` flag determines whether to show a login form or a registration form before completing the invitation.

---

### POST `api/auth/complete-invitation`

**Controller:** `AuthController` → `CompleteInvitation()`
**Auth Required:** Yes

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `CompleteInvitationDTO` | ✅ | Invitation token |

**Request Body Model:**
```json
{
  "token": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Invitation completed | `ApiResponse` (no data) |
| `401 Unauthorized` | Not authenticated or invalid user ID | — |
| `400 Bad Request` | Invalid token | `ApiResponse` with errors |

#### 📝 Summary
Completes an invitation by associating the currently authenticated user with the company that sent the invitation. The user must be logged in first. Database changes are persisted on success. The Angular app should call this after the user logs in / registers from an invitation link.

---

### POST `api/companies/setup`

**Controller:** `CompaniesController` → `SetupCompany()`
**Auth Required:** Implicitly yes (reads `User.Claims` for owner ID; returns 401 if missing)
**Note:** The `[Authorize]` attribute on the controller is currently commented out, but the method logic requires a valid user claim.

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromForm]` | *(form data)* | `SetupCompanyRequest` | ✅ | Company setup payload (multipart) |

**Request Body Model (multipart/form-data):**
```json
{
  "companyName": "string",
  "policyTitleEn": "string | null (optional)",
  "policyTitleAr": "string | null (optional)",
  "policyContentEn": "string | null (optional)",
  "policyContentAr": "string | null (optional)",
  "policyDocument": "IFormFile | null (optional file upload)",
  "employeeEmails": ["string (email addresses to invite)"]
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `201 Created` | Company created | `ApiResponse<CompanyResponse>` |
| `401 Unauthorized` | No valid user identity | — |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |

**Response Body Model (`CompanyResponse` in `data`):**
```json
{
  "id": "guid",
  "name": "string",
  "ownerId": "guid"
}
```

#### 📝 Summary
Sets up a new company for the currently authenticated user (who becomes the owner). Accepts optional company policy text/document and a list of employee emails to invite. This is typically called once during onboarding after a Project Manager registers. Side effects include sending invitation emails to listed employees.

---

### GET `api/companies/employees/search`

**Controller:** `CompaniesController` → `SearchEmployees()`
**Auth Required:** Yes — Role: `ProjectManager`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromQuery]` | `query` | `string` | ✅ | Search term (name or email) |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Search results | `ApiResponse<List<EmployeeSuggestionDTO>>` |
| `401 Unauthorized` | Not authenticated | — |
| `403 Forbidden` | Not a ProjectManager | — |

**Response Body Model (`EmployeeSuggestionDTO[]` in `data`):**
```json
[
  {
    "id": "guid",
    "fullName": "string",
    "email": "string",
    "hasCompany": true
  }
]
```

#### 📝 Summary
Searches for employees by name or email. Returns suggestions for autocomplete when a Project Manager is assigning team members. The `hasCompany` flag indicates whether the employee is already part of a company.

---

### GET `api/projects`

**Controller:** `ProjectsController` → `GetAll()`
**Auth Required:** No (no `[Authorize]` attribute)

#### 📥 Request

No parameters.

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | All projects | `ApiResponse<List<ProjectDto>>` |

**Response Body Model (`ProjectDto[]` in `data`):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "description": "string | null",
    "managerId": "guid",
    "companyId": "guid"
  }
]
```

#### 📝 Summary
Returns all projects. The `name` and `description` are returned localized based on the `lang` header. The Angular app should call this for the project list/dashboard view.

---

### GET `api/projects/{id}`

**Controller:** `ProjectsController` → `GetById()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Project ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Project found | `ApiResponse<ProjectDto>` |
| `404 Not Found` | Project not found | `ApiResponse` with errors |

#### 📝 Summary
Returns a single project by ID. Used for project detail views.

---

### GET `api/projects/company/{companyId}`

**Controller:** `ProjectsController` → `GetByCompanyId()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `companyId` | `Guid` | ✅ | Company ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Projects for company | `ApiResponse<List<ProjectDto>>` |

#### 📝 Summary
Returns all projects belonging to a specific company. The Angular app should use this on the company dashboard to show only relevant projects.

---

### POST `api/projects`

**Controller:** `ProjectsController` → `Create()`
**Auth Required:** No (no explicit `[Authorize]`)

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `CreateProjectDto` | ✅ | New project data |

**Request Body Model:**
```json
{
  "nameEn": "string",
  "nameAr": "string",
  "descriptionEn": "string | null (optional)",
  "descriptionAr": "string | null (optional)",
  "managerId": "guid",
  "companyId": "guid"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `201 Created` | Project created | `ApiResponse<ProjectDto>` |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |

#### 📝 Summary
Creates a new project. Both English and Arabic names are required. Database changes are persisted on success.

---

### PUT `api/projects`

**Controller:** `ProjectsController` → `Update()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `UpdateProjectDto` | ✅ | Updated project data |

**Request Body Model:**
```json
{
  "id": "guid",
  "nameEn": "string",
  "nameAr": "string",
  "descriptionEn": "string | null (optional)",
  "descriptionAr": "string | null (optional)"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Project updated | `ApiResponse` (no data, message only) |
| `404 Not Found` | Project not found | `ApiResponse` with errors |

#### 📝 Summary
Updates an existing project's name and description. The project ID is included in the body.

---

### DELETE `api/projects/{id}`

**Controller:** `ProjectsController` → `Delete()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Project ID to delete |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Project deleted | `ApiResponse` (no data, message only) |
| `404 Not Found` | Project not found | `ApiResponse` with errors |

#### 📝 Summary
Deletes a project by ID. This likely performs a soft delete. Database changes are persisted on success.

---

### POST `api/employees/cv`

**Controller:** `EmployeeController` → `UploadCv()`
**Auth Required:** Yes

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromForm]` | `file` | `IFormFile` | ✅ | CV file (PDF or DOCX, max 5 MB) |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | CV processed | `ApiResponse<ParsedCvDto>` |
| `400 Bad Request` | Invalid file (empty, too large, wrong format) | `ApiResponse` with errors |
| `401 Unauthorized` | Not authenticated | — |

**Response Body Model (`ParsedCvDto` in `data`):**
```json
{
  "jobTitle": "string | null",
  "seniorityLevel": "Junior | MidLevel | Senior | Lead | null",
  "totalYearsOfExperience": 5,
  "skills": [
    {
      "name": "string",
      "level": "Beginner | Intermediate | Advanced | Expert | null",
      "yearsOfExperience": 2.5,
      "confidenceScore": 0.95
    }
  ]
}
```

#### 📝 Summary
Current logged-in employee uploads their own CV. The file is parsed using AI to extract job title, seniority level, skills, etc. Only `.pdf` and `.docx` files up to 5 MB are accepted. The Angular app should use `multipart/form-data` with a file input field named `file`.

---

### POST `api/employees/{userId}/cv`

**Controller:** `EmployeeController` → `UploadCv()`
**Auth Required:** Yes — Roles: `Admin` or `ProjectManager` (to upload for another user)

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `userId` | `Guid` | ✅ | Target employee's user ID |
| `[FromForm]` | `file` | `IFormFile` | ✅ | CV file (PDF or DOCX, max 5 MB) |

#### 📤 Response

Same as `POST api/employees/cv` above.

#### 📝 Summary
Allows Admin or Project Manager to upload a CV on behalf of another employee. Returns 403 Forbidden if the caller is not Admin or ProjectManager.

---

### GET `api/roles`

**Controller:** `RolesController` → `GetAllRoles()`
**Auth Required:** No (controller-level `[Authorize(Roles = "Admin")]` is commented out)

#### 📥 Request

No parameters.

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | All roles | `ApiResponse<List<RoleDto>>` |

**Response Body Model (`RoleDto[]` in `data`):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "permissions": ["string"]
  }
]
```

#### 📝 Summary
Returns all available roles with their permissions. Intended for admin role management views.

---

### GET `api/roles/{id}`

**Controller:** `RolesController` → `GetRoleById()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Role ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Role found | `ApiResponse<RoleDto>` |
| `404 Not Found` | Role not found | `ApiResponse` with errors |

#### 📝 Summary
Returns a single role by ID with its permissions list.

---

### GET `api/roles/permissions-matrix`

**Controller:** `RolesController` → `GetPermissionMatrix()`
**Auth Required:** No

#### 📥 Request

No parameters.

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Permission matrix | `ApiResponse<List<PermissionModuleDto>>` |

**Response Body Model (`PermissionModuleDto[]` in `data`):**
```json
[
  {
    "moduleName": "string",
    "permissions": [
      {
        "name": "string",
        "value": "string"
      }
    ]
  }
]
```

#### 📝 Summary
Returns all permission modules and their individual permissions. Used to render the permission matrix UI where an admin can check/uncheck permissions for a role.

---

### PUT `api/roles/{id}/permissions`

**Controller:** `RolesController` → `UpdateRolePermissions()`
**Auth Required:** No (controller-level auth is commented out)

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Role ID |
| `[FromBody]` | *(body)* | `UpdateRolePermissionsDto` | ✅ | New permissions list |

**Request Body Model:**
```json
{
  "permissions": ["string"]
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Permissions updated | `ApiResponse` (no data, message only) |
| `404 Not Found` | Role not found | `ApiResponse` with errors |

#### 📝 Summary
Replaces the permissions for a specific role. The Angular app should send the full list of permission values (strings) that the role should have after the update.

---

### GET `api/skills`

**Controller:** `SkillsController` → `GetAll()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

No parameters.

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | All skills | `ApiResponse<List<...>>` (skill list) |
| `401 Unauthorized` | Not authenticated | — |
| `403 Forbidden` | Not Admin | — |

#### 📝 Summary
Returns all skills in the system. Used for admin skill management.

---

### POST `api/skills`

**Controller:** `SkillsController` → `Create()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `string` | ✅ | Skill name (raw JSON string) |

**Request Body:**
```json
"JavaScript"
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Skill created | `ApiResponse` |
| `409 Conflict` | Skill already exists | `ApiResponse` with errors |

#### 📝 Summary
Creates a single skill by name. The request body is a raw JSON string, not an object.

---

### DELETE `api/skills/{id}`

**Controller:** `SkillsController` → `Delete()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `int` | ✅ | Skill ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Skill deleted | `ApiResponse` |
| `404 Not Found` | Skill not found | `ApiResponse` with errors |

#### 📝 Summary
Deletes a skill by its integer ID.

---

### POST `api/skills/bulk`

**Controller:** `SkillsController` → `CreateBulk()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `List<string>` | ✅ | Array of skill names |

**Request Body:**
```json
["C#", "Angular", "TypeScript"]
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Skills created | `ApiResponse` (message only) |
| `400 Bad Request` | Validation errors | `ApiResponse` with errors |

#### 📝 Summary
Creates multiple skills at once. Useful for initial setup or bulk import.

---

### GET `api/subscriptionplans`

**Controller:** `SubscriptionPlansController` → `GetAll()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

No parameters.

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | All plans | `ApiResponse<List<SubscriptionPlanDto>>` |

**Response Body Model (`SubscriptionPlanDto[]` in `data`):**
```json
[
  {
    "id": 1,
    "name": "string",
    "monthlyPrice": 99.99,
    "annualPrice": 999.99,
    "currency": "EGP",
    "maxProjects": 10,
    "maxUsersPerProject": 25,
    "hasAi": true,
    "hasAdvancedAnalytics": false,
    "hasTrial": true,
    "trialDays": 14
  }
]
```

#### 📝 Summary
Returns all subscription plans. Used for the admin plan management page and the public pricing page.

---

### GET `api/subscriptionplans/{id}`

**Controller:** `SubscriptionPlansController` → `GetById()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `int` | ✅ | Plan ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Plan found | `ApiResponse<SubscriptionPlanDto>` |
| `404 Not Found` | Plan not found | `ApiResponse` with errors |

#### 📝 Summary
Returns a single subscription plan by ID.

---

### POST `api/subscriptionplans`

**Controller:** `SubscriptionPlansController` → `Create()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `CreateSubscriptionPlanDto` | ✅ | Plan details |

**Request Body Model:**
```json
{
  "name": "string (required, max 200 chars)",
  "monthlyPrice": 99.99,
  "annualPrice": 999.99,
  "currency": "EGP (required, max 10 chars)",
  "maxProjects": 10,
  "maxUsersPerProject": 25,
  "hasAi": true,
  "hasAdvancedAnalytics": false,
  "hasTrial": true,
  "trialDays": 14
}
```
*Validation: `name` — `[Required, MaxLength(200)]`; `currency` — `[Required, MaxLength(10)]`; `monthlyPrice`, `annualPrice` — `[Range(0, double.MaxValue)]`; `maxProjects`, `maxUsersPerProject` — `[Range(1, int.MaxValue)]`.*

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `201 Created` | Plan created | `ApiResponse<SubscriptionPlanDto>` |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |

#### 📝 Summary
Creates a new subscription plan. Only Admins can manage plans.

---

### PUT `api/subscriptionplans/{id}`

**Controller:** `SubscriptionPlansController` → `Update()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `int` | ✅ | Plan ID |
| `[FromBody]` | *(body)* | `UpdateSubscriptionPlanDto` | ✅ | Updated plan details |

**Request Body Model:**
```json
{
  "name": "string (required, max 200 chars)",
  "monthlyPrice": 99.99,
  "annualPrice": 999.99,
  "currency": "EGP (required, max 10 chars)",
  "maxProjects": 10,
  "maxUsersPerProject": 25,
  "hasAi": true,
  "hasAdvancedAnalytics": false,
  "hasTrial": true,
  "trialDays": 14
}
```
*Same validation rules as `CreateSubscriptionPlanDto`.*

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Plan updated | `ApiResponse` (message only) |
| `404 Not Found` | Plan not found | `ApiResponse` with errors |

#### 📝 Summary
Updates an existing subscription plan.

---

### DELETE `api/subscriptionplans/{id}`

**Controller:** `SubscriptionPlansController` → `Delete()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `int` | ✅ | Plan ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Plan deleted | `ApiResponse` (message only) |
| `404 Not Found` | Plan not found | `ApiResponse` with errors |

#### 📝 Summary
Deletes a subscription plan by ID.

---

### GET `api/usersubscriptions/current`

**Controller:** `UserSubscriptionsController` → `GetCurrentSubscription()`
**Auth Required:** Yes — Roles: `ProjectManager` or `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromQuery]` | `projectManagerId` | `Guid?` | ❌ | Optional PM ID (Admin-only: view another PM's subscription) |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Current subscription | `ApiResponse<UserSubscriptionDto>` |
| `404 Not Found` | No active subscription | `ApiResponse` with errors |

**Response Body Model (`UserSubscriptionDto` in `data`):**
```json
{
  "id": "guid",
  "projectManagerId": "guid",
  "subscriptionPlanId": 1,
  "planName": "string",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-02-01T00:00:00Z",
  "billingCycle": "Monthly | Annually",
  "status": "Active | Expired | Canceled | Trialing",
  "autoRenew": true,
  "isTrial": false,
  "trialEndDate": "2026-01-15T00:00:00Z | null",
  "clientSecret": "string | null (Stripe client secret for payment confirmation)"
}
```

#### 📝 Summary
Returns the current active subscription for the logged-in PM, or for a specific PM if the caller is Admin. May trigger an auto-fallback to a free plan if the current subscription has expired — database changes are saved on success. The Angular app should call this on dashboard load to determine feature availability.

---

### GET `api/usersubscriptions`

**Controller:** `UserSubscriptionsController` → `GetAll()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromQuery]` | `projectManagerId` | `Guid?` | ❌ | Filter by PM ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | All subscriptions | `ApiResponse<List<UserSubscriptionDto>>` |

#### 📝 Summary
Returns all user subscriptions, optionally filtered by Project Manager ID. Admin-only endpoint for subscription management.

---

### GET `api/usersubscriptions/{id}`

**Controller:** `UserSubscriptionsController` → `GetById()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Subscription ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Subscription found | `ApiResponse<UserSubscriptionDto>` |
| `404 Not Found` | Not found | `ApiResponse` with errors |

#### 📝 Summary
Returns a specific user subscription by ID.

---

### POST `api/usersubscriptions`

**Controller:** `UserSubscriptionsController` → `Subscribe()`
**Auth Required:** Yes — Role: `ProjectManager`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `CreateUserSubscriptionDto` | ✅ | Subscription request |

**Request Body Model:**
```json
{
  "subscriptionPlanId": 1,
  "billingCycle": "Monthly | Annually",
  "autoRenew": true,
  "gateway": "Stripe | PayPal | Fawry | VodafoneCash",
  "paymentMethodId": "string | null (optional, e.g., Stripe PaymentMethod ID)"
}
```
*Validation: `subscriptionPlanId` — `[Required]`; `billingCycle` — `[Required, RegularExpression("Monthly|Annually")]`.*

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `201 Created` | Subscribed | `ApiResponse<UserSubscriptionDto>` |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |

#### 📝 Summary
Creates a new subscription for the currently authenticated Project Manager. The `clientSecret` in the response may be used for Stripe payment confirmation on the frontend. Database changes are persisted on success.

---

### PUT `api/usersubscriptions/{id}`

**Controller:** `UserSubscriptionsController` → `Update()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Subscription ID |
| `[FromBody]` | *(body)* | `UpdateUserSubscriptionDto` | ✅ | Updated subscription data |

**Request Body Model:**
```json
{
  "status": "Active | Expired | Canceled | Trialing (required)",
  "autoRenew": true,
  "endDate": "2026-03-01T00:00:00Z"
}
```
*Validation: `status` — `[Required]`.*

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Updated | `ApiResponse` (message only) |
| `404 Not Found` | Not found | `ApiResponse` with errors |

#### 📝 Summary
Admin-only endpoint to manually update a subscription's status, auto-renew setting, and end date.

---

### DELETE `api/usersubscriptions/{id}`

**Controller:** `UserSubscriptionsController` → `Delete()`
**Auth Required:** Yes — Role: `Admin`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Subscription ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Deleted | `ApiResponse` (message only) |
| `404 Not Found` | Not found | `ApiResponse` with errors |

#### 📝 Summary
Admin-only: Deletes a user subscription.

---

### POST `api/usersubscriptions/{id}/cancel`

**Controller:** `UserSubscriptionsController` → `Cancel()`
**Auth Required:** Yes — Role: `ProjectManager`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | Subscription ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Cancelled | `ApiResponse` (message only) |
| `403 Forbidden` | Subscription doesn't belong to the PM | — |
| `404 Not Found` | Subscription not found | `ApiResponse` with errors |

#### 📝 Summary
Allows a Project Manager to cancel their own subscription. The endpoint verifies that the subscription belongs to the requesting PM before proceeding. Returns 403 if the subscription belongs to someone else.

---

### GET `api/users`

**Controller:** `UsersController` → `GetAll()`
**Auth Required:** No

#### 📥 Request

No parameters.

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | All users | `ApiResponse<List<UserDto>>` |

**Response Body Model (`UserDto[]` in `data`):**
```json
[
  {
    "id": "guid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "companyId": "guid | null",
    "isDeleted": false
  }
]
```

#### 📝 Summary
Returns all users. Localized first/last name is returned based on the `lang` header.

---

### GET `api/users/{id}`

**Controller:** `UsersController` → `GetById()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | User ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | User found | `ApiResponse<UserDto>` |
| `404 Not Found` | User not found | `ApiResponse` with errors |

#### 📝 Summary
Returns a single user by ID.

---

### DELETE `api/users/{id}`

**Controller:** `UsersController` → `Delete()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `id` | `Guid` | ✅ | User ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | User deleted | `ApiResponse` (message only) |
| `404 Not Found` | User not found | `ApiResponse` with errors |

#### 📝 Summary
Deletes a user by ID. This likely performs a soft delete (sets `isDeleted` flag).

---

### POST `api/aiproject/generate`

**Controller:** `AiProjectController` → `Generate()`
**Auth Required:** Yes — Role: `ProjectManager`
**Content-Type:** `multipart/form-data`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromForm]` | `textRequirements` | `string?` | ❌ | Free-text requirements or answers to clarification questions |
| `[FromForm]` | `chatId` | `string?` | ❌ | OpenAI Thread ID from a previous call (null on first call) |
| `[FromForm]` | `companyId` | `Guid` | ✅ | Target company ID |
| `[FromForm]` | `managerId` | `Guid` | ✅ | Project Manager ID |
| `[FromForm]` | `audioFile` | `IFormFile?` | ❌ | Audio file with spoken requirements |
| `[FromForm]` | `documentFile` | `IFormFile?` | ❌ | Document file with requirements (text extracted) |

**At least one of `textRequirements`, `audioFile`, or `documentFile` must be provided.**

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Draft generated or clarification needed | `ApiResponse<GeneratedProjectDTO>` |
| `400 Bad Request` | No input provided or invalid file | `ApiResponse` with errors |
| `401 Unauthorized` | Not authenticated | — |
| `403 Forbidden` | Not a ProjectManager | — |

**Response Body Model (`GeneratedProjectDTO` in `data`):**
```json
{
  "chatId": "string (OpenAI thread ID — pass back on follow-up calls)",
  "clarificationQuestions": ["string (empty when draft is ready)"],
  "nameEn": "string (empty when clarification needed)",
  "nameAr": "string",
  "descriptionEn": "string | null",
  "descriptionAr": "string | null",
  "companyId": "guid",
  "managerId": "guid",
  "needsClarification": true
}
```

#### 📝 Summary
**Step 1 of AI project generation.** Accepts requirements via text, audio, or document. Sends them to OpenAI to produce a project draft. Two possible outcomes:
1. **Clarification needed** — `needsClarification` is `true`, `clarificationQuestions` contains questions. The PM answers and calls `/generate` again with the same `chatId`.
2. **Draft ready** — `needsClarification` is `false`, project fields are populated. The PM reviews and calls `/confirm`.
Nothing is written to the database at this stage.

---

### POST `api/aiproject/confirm`

**Controller:** `AiProjectController` → `Confirm()`
**Auth Required:** Yes — Role: `ProjectManager`

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `GeneratedProjectDTO` | ✅ | The (possibly edited) project draft |

**Request Body Model:**
```json
{
  "chatId": "string",
  "clarificationQuestions": [],
  "nameEn": "string",
  "nameAr": "string",
  "descriptionEn": "string | null",
  "descriptionAr": "string | null",
  "companyId": "guid",
  "managerId": "guid"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `201 Created` | Project created | `ApiResponse<ProjectDto>` |
| `400 Bad Request` | Validation error | `ApiResponse` with errors |

#### 📝 Summary
**Step 2 of AI project generation.** The PM sends back the reviewed/edited draft. The project is validated and persisted to the database. This is the point where the actual Project entity is created.

---

### POST `api/context-advisor/documents`

**Controller:** `ContextAdvisorController` → `UploadProjectKnowledge()`
**Auth Required:** No (no `[Authorize]` attribute on controller or method)

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromForm]` | `projectId` | `Guid?` | ❌ | Associated project ID |
| `[FromForm]` | `isAvailableToContextSummarizer` | `bool` | ❌ | Default: `true`. Makes the document available to the AI context summarizer |
| `[FromForm]` | `file` | `IFormFile` | ✅ | Document file to ingest |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Document ingested | `DocumentIngestionResult` (raw, not wrapped in ApiResponse) |

**Response Body Model:**
```json
{
  "success": true,
  "documentId": "guid",
  "category": "Requirements | Architecture | ApiDocumentation | MeetingNotes | AudioTranscript | Diagram | Image | Uncategorized",
  "chunksCreated": 12,
  "questionsAutoResolved": 3,
  "message": "string"
}
```

#### 📝 Summary
Uploads a project knowledge document for the AI Context Advisor to use when generating summaries and answering questions. The document is chunked, categorized, and stored in a vector database. Note: This endpoint returns the raw result, NOT wrapped in the standard `ApiResponse` envelope.

---

### POST `api/context-advisor/summary`

**Controller:** `ContextAdvisorController` → `GetContextSummary()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `ContextAdvisorSummaryRequest` | ✅ | Task to summarize |

**Request Body Model:**
```json
{
  "taskId": "guid"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Context summary generated | `ContextSummaryResponse` (raw, not wrapped in ApiResponse) |
| `404 Not Found` | Task not found | `ApiResponse` with errors (via HandleResult) |

**Response Body Model:**
```json
{
  "conversationId": "guid",
  "summary": "string",
  "codebaseNotes": ["string"],
  "relatedPastTasks": ["string"],
  "techStackContext": ["string"],
  "suggestedImplementationGuidance": ["string"],
  "citations": [
    {
      "number": 1,
      "documentId": "guid",
      "chunkId": "guid",
      "fileName": "string",
      "chunkIndex": 0,
      "sourceUrl": "string | null",
      "snippet": "string"
    }
  ]
}
```

#### 📝 Summary
Generates an AI-powered context summary for a specific task. The AI retrieves relevant knowledge chunks from ingested project documents and produces a comprehensive summary including codebase notes, related past tasks, tech stack context, and implementation guidance. The `conversationId` can be used for follow-up questions via the `/ask` endpoint. Language-aware: returns Arabic or English content based on the `lang` header.

---

### POST `api/context-advisor/ask`

**Controller:** `ContextAdvisorController` → `Ask()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `ContextAdvisorAskRequest` | ✅ | Question about a task |

**Request Body Model:**
```json
{
  "taskId": "guid",
  "conversationId": "guid | null (optional, pass to continue a conversation)",
  "question": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Answer generated | `ContextAdvisorAnswerResponse` (raw, not wrapped in ApiResponse) |
| `404 Not Found` | Task not found | `ApiResponse` with errors |

**Response Body Model:**
```json
{
  "conversationId": "guid",
  "answer": "string",
  "citations": [
    {
      "number": 1,
      "documentId": "guid",
      "chunkId": "guid",
      "fileName": "string",
      "chunkIndex": 0,
      "sourceUrl": "string | null",
      "snippet": "string"
    }
  ],
  "suggestedFollowUps": ["string"]
}
```

#### 📝 Summary
Ask the AI Context Advisor a question about a specific task. Pass `conversationId` from a previous `/summary` or `/ask` call to maintain conversation context. The AI retrieves relevant knowledge from project documents and answers the question with citations. Suggested follow-up questions are included for the UI to offer as quick actions.

---

### POST `api/requirements/document`

**Controller:** `RequirementController` → `Document()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromForm]` | `sessionId` | `Guid` | ✅ | Requirement session ID |
| `[FromForm]` | `projectId` | `Guid?` | ❌ | Associated project ID |
| `[FromForm]` | `isAvailableToContextSummarizer` | `bool` | ❌ | Default: `true` |
| `[FromForm]` | `file` | `IFormFile` | ✅ | Document file to ingest |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Document ingested | `DocumentIngestionResult` (raw) |

#### 📝 Summary
Uploads a document into a requirements gathering session. The document is parsed, chunked, and any relevant clarification questions may be auto-resolved. Note: returns raw result, NOT wrapped in `ApiResponse`.

---

### POST `api/requirements/message`

**Controller:** `RequirementController` → `Message()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromBody]` | *(body)* | `RequirementMessageRequest` | ✅ | Chat message |

**Request Body Model:**
```json
{
  "sessionId": "guid | null (null to start a new session)",
  "message": "string"
}
```

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Session state returned | `RequirementSession` (raw) |

**Response Body Model (`RequirementSession`):**
```json
{
  "sessionId": "guid",
  "status": "RequirementGathering | RequirementValidation | Planning | Completed | Failed",
  "requirements": { /* ExtractedRequirements object */ },
  "questionPool": [
    {
      /* ClarificationQuestion objects — includes isAnswered flag */
    }
  ],
  "conversationHistory": [
    {
      "role": "string (e.g., 'user', 'assistant')",
      "message": "string",
      "timestamp": "2026-01-01T00:00:00Z"
    }
  ],
  "completenessReport": { /* or null */ },
  "knowledge": { /* SessionKnowledgeContext */ },
  "finalRequirements": { /* StructuredRequirements or null */ },
  "lastWorkflowResult": { /* WorkflowStepResult or null */ },
  "lastError": "string | null",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z",
  "allQuestionsAnswered": true
}
```

#### 📝 Summary
The main chat endpoint for the AI requirements gathering workflow. If `sessionId` is null, a new session is started; otherwise, the message is processed as a PM response in an existing session. The returned `RequirementSession` contains the full conversation state, extracted requirements, clarification questions, and status. The Angular app should implement a chat-like UI that sends messages here and renders the session state.

---

### GET `api/requirements/{sessionId}`

**Controller:** `RequirementController` → `Get()`
**Auth Required:** No

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `sessionId` | `Guid` | ✅ | Session ID |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Session found | `RequirementSession` (raw) |
| `404 Not Found` | Session not found | — (empty NotFound) |

#### 📝 Summary
Retrieves an existing requirements gathering session by ID. Useful for resuming a session or displaying its current state. Note: returns 404 with no body (raw `NotFound()`), not the standard ApiResponse error envelope.

---

### POST `api/webhooks/{gateway}`

**Controller:** `WebhooksController` → `Handle()`
**Auth Required:** No
**Note:** This controller extends `ControllerBase` directly, NOT `ApiControllerBase`. It does NOT use the `ApiResponse` envelope.

#### 📥 Request

| Source | Parameter | Type | Required | Description |
|--------|-----------|------|----------|-------------|
| `[FromRoute]` | `gateway` | `string` | ✅ | Payment gateway name (e.g., "stripe", "paypal") |
| *(raw body)* | — | `string` | ✅ | Raw webhook payload (read from request stream) |
| *(headers)* | — | — | — | Gateway-specific signature headers |

#### 📤 Response

| Status Code | Meaning | Response Body Type |
|-------------|---------|-------------------|
| `200 OK` | Webhook processed | — (empty) |
| `400 Bad Request` | Processing failed | — (empty) |

#### 📝 Summary
Handles incoming payment webhook notifications from Stripe, PayPal, etc. **This endpoint is NOT for Angular to call directly** — it is called by payment gateway servers. The Angular app should not interact with this endpoint.

---

## 📦 Shared Models & DTOs

### `ApiResponse`
```json
{
  "succeeded": "bool — true on success, false on failure",
  "message": "string | null — human-readable message",
  "errors": "ErrorDetail[] | null — present on failure only",
  "data": "T | null — present on success only (ApiResponse<T>)"
}
```

### `ErrorDetail`
```json
{
  "code": "string — machine-readable error code",
  "description": "string — localized human-readable description"
}
```

### `AuthResponseDTO`
```json
{
  "userId": "Guid",
  "email": "string",
  "fullName": "string",
  "token": "string — JWT access token",
  "message": "string",
  "refreshToken": "string",
  "roles": ["string — e.g., 'Admin', 'ProjectManager', 'Employee'"]
}
```

### `RegisterResponseDTO`
```json
{
  "userId": "string",
  "email": "string",
  "message": "string"
}
```

### `InvitationInfoResponse`
```json
{
  "email": "string",
  "companyName": "string",
  "userExists": "bool",
  "token": "string"
}
```

### `CompanyResponse`
```json
{
  "id": "Guid",
  "name": "string",
  "ownerId": "Guid"
}
```

### `EmployeeSuggestionDTO`
```json
{
  "id": "Guid",
  "fullName": "string",
  "email": "string",
  "hasCompany": "bool"
}
```

### `ProjectDto`
```json
{
  "id": "Guid",
  "name": "string — localized based on lang header",
  "description": "string | null",
  "managerId": "Guid",
  "companyId": "Guid"
}
```

### `CreateProjectDto`
```json
{
  "nameEn": "string",
  "nameAr": "string",
  "descriptionEn": "string | null",
  "descriptionAr": "string | null",
  "managerId": "Guid",
  "companyId": "Guid"
}
```

### `UpdateProjectDto`
```json
{
  "id": "Guid",
  "nameEn": "string",
  "nameAr": "string",
  "descriptionEn": "string | null",
  "descriptionAr": "string | null"
}
```

### `UserDto`
```json
{
  "id": "Guid",
  "email": "string",
  "firstName": "string — localized",
  "lastName": "string — localized",
  "companyId": "Guid | null",
  "isDeleted": "bool"
}
```

### `RoleDto`
```json
{
  "id": "Guid",
  "name": "string",
  "permissions": ["string"]
}
```

### `PermissionModuleDto`
```json
{
  "moduleName": "string",
  "permissions": [
    { "name": "string", "value": "string" }
  ]
}
```

### `SubscriptionPlanDto`
```json
{
  "id": "int",
  "name": "string",
  "monthlyPrice": "decimal",
  "annualPrice": "decimal",
  "currency": "string (default: EGP)",
  "maxProjects": "int",
  "maxUsersPerProject": "int",
  "hasAi": "bool",
  "hasAdvancedAnalytics": "bool",
  "hasTrial": "bool",
  "trialDays": "int | null"
}
```

### `UserSubscriptionDto`
```json
{
  "id": "Guid",
  "projectManagerId": "Guid",
  "subscriptionPlanId": "int",
  "planName": "string",
  "startDate": "DateTime",
  "endDate": "DateTime",
  "billingCycle": "string (Monthly | Annually)",
  "status": "string (Active | Expired | Canceled | Trialing)",
  "autoRenew": "bool",
  "isTrial": "bool",
  "trialEndDate": "DateTime | null",
  "clientSecret": "string | null"
}
```

### `CreateUserSubscriptionDto`
```json
{
  "subscriptionPlanId": "int — [Required]",
  "billingCycle": "string — [Required, must be 'Monthly' or 'Annually']",
  "autoRenew": "bool (default: true)",
  "gateway": "PaymentGateway enum (Stripe | PayPal | Fawry | VodafoneCash)",
  "paymentMethodId": "string | null"
}
```

### `UpdateUserSubscriptionDto`
```json
{
  "status": "string — [Required]",
  "autoRenew": "bool",
  "endDate": "DateTime"
}
```

### `ParsedCvDto`
```json
{
  "jobTitle": "string | null",
  "seniorityLevel": "SeniorityLevel enum | null",
  "totalYearsOfExperience": "int | null",
  "skills": ["ParsedSkillDto"]
}
```

### `ParsedSkillDto`
```json
{
  "name": "string",
  "level": "SkillLevel enum | null",
  "yearsOfExperience": "double | null",
  "confidenceScore": "double"
}
```

### `GeneratedProjectDTO`
```json
{
  "chatId": "string — OpenAI Thread ID",
  "clarificationQuestions": ["string"],
  "nameEn": "string",
  "nameAr": "string",
  "descriptionEn": "string | null",
  "descriptionAr": "string | null",
  "companyId": "Guid",
  "managerId": "Guid",
  "needsClarification": "bool (computed: true when clarificationQuestions is non-empty)"
}
```

### `ContextSummaryResponse`
```json
{
  "conversationId": "Guid",
  "summary": "string",
  "codebaseNotes": ["string"],
  "relatedPastTasks": ["string"],
  "techStackContext": ["string"],
  "suggestedImplementationGuidance": ["string"],
  "citations": ["ContextCitation"]
}
```

### `ContextAdvisorAnswerResponse`
```json
{
  "conversationId": "Guid",
  "answer": "string",
  "citations": ["ContextCitation"],
  "suggestedFollowUps": ["string"]
}
```

### `ContextCitation`
```json
{
  "number": "int",
  "documentId": "Guid",
  "chunkId": "Guid",
  "fileName": "string",
  "chunkIndex": "int",
  "sourceUrl": "string | null",
  "snippet": "string"
}
```

### `DocumentIngestionResult`
```json
{
  "success": "bool",
  "documentId": "Guid",
  "category": "DocumentCategory enum",
  "chunksCreated": "int",
  "questionsAutoResolved": "int",
  "message": "string"
}
```

### `RequirementSession`
```json
{
  "sessionId": "Guid",
  "status": "RequirementSessionStatus enum",
  "requirements": "ExtractedRequirements (complex object)",
  "questionPool": ["ClarificationQuestion"],
  "conversationHistory": ["ConversationMessage"],
  "completenessReport": "object | null",
  "knowledge": "SessionKnowledgeContext",
  "finalRequirements": "StructuredRequirements | null",
  "lastWorkflowResult": "WorkflowStepResult | null",
  "lastError": "string | null",
  "createdAt": "DateTime",
  "updatedAt": "DateTime",
  "allQuestionsAnswered": "bool (computed)"
}
```

### `ConversationMessage`
```json
{
  "role": "string (e.g., 'user', 'assistant')",
  "message": "string",
  "timestamp": "DateTime"
}
```

---

## 🔢 Enums

All enums are serialized as **strings** (not integers) in JSON responses.

### `UserRole`
| Value |
|-------|
| `Admin` |
| `ProjectManager` |
| `Employee` |

### `PaymentGateway`
| Value | Int |
|-------|-----|
| `Stripe` | 0 |
| `PayPal` | 1 |
| `Fawry` | 2 |
| `VodafoneCash` | 3 |

### `PaymentMethod`
| Value | Int |
|-------|-----|
| `CreditCard` | 0 |
| `DebitCard` | 1 |
| `Wallet` | 2 |
| `BankTransfer` | 3 |

### `PaymentStatus`
| Value |
|-------|
| `Pending` |
| `Completed` |
| `Failed` |
| `Refunded` |

### `BillingCycle`
| Value |
|-------|
| `Monthly` |
| `Annually` |

### `SubscriptionStatus`
| Value |
|-------|
| `Active` |
| `Expired` |
| `Canceled` |
| `Trialing` |

### `SeniorityLevel`
| Value | Int |
|-------|-----|
| `Junior` | 1 |
| `MidLevel` | 2 |
| `Senior` | 3 |
| `Lead` | 4 |

### `SkillLevel`
| Value | Int |
|-------|-----|
| `Beginner` | 0 |
| `Intermediate` | 1 |
| `Advanced` | 2 |
| `Expert` | 3 |

### `Availability`
| Value |
|-------|
| `Available` |
| `Busy` |
| `OnLeave` |

### `AiProcessingStatus`
| Value |
|-------|
| `Pending` |
| `Processing` |
| `Completed` |
| `Failed` |

### `ProjectRole`
| Value |
|-------|
| `Developer` |
| `TeamLead` |
| `QA` |
| `ScrumMaster` |

### `SprintStatus`
| Value | Int |
|-------|-----|
| `Planned` | 0 |
| `Active` | 1 |
| `Completed` | 2 |

### `StoryPriority`
| Value | Int |
|-------|-----|
| `Low` | 0 |
| `Medium` | 1 |
| `High` | 2 |
| `Critical` | 3 |

### `StoryStatus`
| Value | Int |
|-------|-----|
| `ToDo` | 0 |
| `InProgress` | 1 |
| `Done` | 2 |

### `TaskItemStatus`
| Value | Int |
|-------|-----|
| `ToDo` | 0 |
| `InProgress` | 1 |
| `Review` | 2 |
| `Done` | 3 |

### `TaskPriority`
| Value | Int |
|-------|-----|
| `Low` | 0 |
| `Medium` | 1 |
| `High` | 2 |
| `Critical` | 3 |

### `NotificationType`
| Value | Int |
|-------|-----|
| `TaskAssigned` | 0 |
| `TaskUpdated` | 1 |
| `TaskCompleted` | 2 |
| `TaskOverdue` | 3 |
| `UserStoryUpdated` | 4 |
| `SprintStarted` | 5 |
| `SprintEnded` | 6 |
| `ProjectCreated` | 7 |
| `ProjectUpdated` | 8 |
| `CommentAdded` | 9 |
| `UserAddedToProject` | 10 |
| `SubscriptionExpiring` | 11 |
| `PaymentSuccess` | 12 |
| `PaymentFailed` | 13 |
| `BugReported` | 14 |

### `PolicyScope`
| Value | Int |
|-------|-----|
| `Company` | 0 |
| `Project` | 1 |

### `DocumentCategory` *(AI layer)*
| Value | Int |
|-------|-----|
| `Requirements` | 1 |
| `Architecture` | 2 |
| `ApiDocumentation` | 3 |
| `MeetingNotes` | 4 |
| `AudioTranscript` | 5 |
| `Diagram` | 6 |
| `Image` | 7 |
| `Uncategorized` | 99 |

### `RequirementSessionStatus` *(AI layer)*
| Value | Int |
|-------|-----|
| `RequirementGathering` | 1 |
| `RequirementValidation` | 2 |
| `Planning` | 3 |
| `Completed` | 4 |
| `Failed` | 5 |

### `QuestionCategory` *(AI layer)*
| Value | Int |
|-------|-----|
| `General` | 1 |
| `BusinessGoals` | 2 |
| `Scale` | 3 |
| `Integration` | 4 |
| `Timeline` | 5 |
| `Compliance` | 6 |
| `UserRoles` | 7 |
| `Realtime` | 8 |

### `QuestionPriority` *(AI layer)*
| Value | Int |
|-------|-----|
| `Low` | 1 |
| `Medium` | 2 |
| `High` | 3 |
| `Critical` | 4 |

---

## 🔐 Auth Flow

### Obtaining a Token
1. **Register:** `POST api/auth/register` → receive `RegisterResponseDTO` with `userId`.
2. **Confirm Email:** `POST api/auth/confirm-email` with the OTP sent to email.
3. **Login:** `POST api/auth/login` → receive `AuthResponseDTO` with `token` and `refreshToken`.
4. **Alternative:** `POST api/auth/google` with a Google ID token → receive `AuthResponseDTO`.

### Attaching the Token
- Header: `Authorization: Bearer <token>`
- All `[Authorize]` endpoints require this header.

### Token Lifecycle
- **Access Token:** Expires in **15 minutes**.
- **Refresh Token:** Expires in **7 days**, or after **8 hours** of inactivity.
- **Refresh:** `POST api/auth/refresh-token` with the current refresh token → receive new `token` + `refreshToken` (rotation).
- **Logout:** `POST api/auth/logout` revokes the refresh token server-side.

### Password Reset Flow
1. `POST api/auth/forgot-password` with email → OTP sent to email.
2. `POST api/auth/reset-password` with email, OTP, new password.

### Invitation Flow
1. User receives email with invitation link containing a token.
2. `GET api/auth/invitation/{token}` → check if user exists.
3. If `userExists` is `false`, user registers first.
4. User logs in, then calls `POST api/auth/complete-invitation` to join the company.

---

## ⚠️ Notes for the Angular Agent

### Inconsistent Response Wrapping
- **Most endpoints** use the `ApiResponse` envelope (via `HandleResult()` / `HandleCreated()`).
- **Context Advisor** endpoints (`api/context-advisor/*`) return raw objects via `Ok(result)` — NOT wrapped in `ApiResponse`.
- **Requirements** endpoints (`api/requirements/*`) also return raw objects — NOT wrapped in `ApiResponse`.
- **Webhooks** (`api/webhooks/*`) return empty 200/400 — NOT for frontend use.
- The Angular HTTP interceptor should handle both shapes.

### File Upload Endpoints
These endpoints accept `multipart/form-data` with `IFormFile`:
- `POST api/companies/setup` — optional `policyDocument`
- `POST api/employees/cv` and `POST api/employees/{userId}/cv` — required `file` (PDF/DOCX, max 5 MB)
- `POST api/aiproject/generate` — optional `audioFile` and `documentFile`
- `POST api/context-advisor/documents` — required `file`
- `POST api/requirements/document` — required `file`

### Commented-Out Auth
- `CompaniesController` has `[Authorize]` commented out at the class level, but `SetupCompany` reads user claims (will 401 without a token in practice).
- `RolesController` has `[Authorize(Roles = "Admin")]` commented out — currently publicly accessible.

### No Pagination
No pagination conventions were found in the codebase. List endpoints return all records.

### Localization (i18n)
- Many entities store dual-language fields (`*En` / `*Ar`).
- Input DTOs accept both languages (e.g., `nameEn`, `nameAr`).
- Output DTOs return the localized value based on the `lang` header (e.g., `name` = English or Arabic depending on header).

### No SignalR Hubs
No SignalR hubs were found in the codebase.

### No `[Obsolete]` Endpoints
No endpoints are marked as `[Obsolete]`.

### No `NotImplementedException`
No endpoints throw `NotImplementedException`.

### Google OAuth Client ID
`586738650387-koc3m0suvmmc1bsndim8mqls2rpvj9td.apps.googleusercontent.com`

### Stripe Integration
The `clientSecret` field in `UserSubscriptionDto` is used for Stripe Payment Intents. The Angular app should use `@stripe/stripe-js` to confirm the payment on the client side when `clientSecret` is present in the subscription response.
