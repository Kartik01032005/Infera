# Infera — API Specification

## 1. Purpose

This document defines the API architecture, endpoints, request formats, response formats, authentication requirements, authorization rules, tenant isolation, validation, errors, and security requirements for Infera.

The API is built using:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- JWT / secure sessions
- LangGraph
- Google Gemini

The API acts as the controlled communication layer between the Next.js frontend, backend services, AI system, and PostgreSQL database.

The frontend must communicate with the backend through the API.

The frontend must never connect directly to PostgreSQL.

---

## 2. API Architecture

The API follows this architecture:

    Next.js Frontend
          ↓
    FastAPI API
          ↓
    Authentication
          ↓
    Authorization
          ↓
    Tenant Context
          ↓
    Application Services
          ↓
    Database / AI Services
          ↓
    PostgreSQL / Gemini

The API is responsible for:

- Request validation
- Authentication
- Authorization
- Tenant isolation
- Business logic coordination
- AI workflow execution
- Database access coordination
- Error handling
- Audit logging

---

## 3. API Base URL

Development:

    http://localhost:8000

API prefix:

    /api/v1

Example:

    http://localhost:8000/api/v1/query

Production URL should be configurable through environment variables.

---

## 4. API Versioning

The API should use versioning.

Initial version:

    /api/v1

Example:

    /api/v1/auth/login

Future versions may use:

    /api/v2

Existing API versions should remain stable when possible.

---

## 5. API Response Format

Successful responses should use predictable JSON structures.

Example:

    {
      "status": "SUCCESS",
      "data": {},
      "request_id": "uuid"
    }

Error responses should use:

    {
      "status": "FAILED",
      "error": {
        "code": "ERROR_CODE",
        "message": "Safe error message"
      },
      "request_id": "uuid"
    }

Internal stack traces must never be returned to users.

---

## 6. Authentication

Protected API endpoints require authentication.

The authentication flow is:

    User
      ↓
    Login
      ↓
    FastAPI
      ↓
    Credential Verification
      ↓
    JWT / Session
      ↓
    Authenticated Requests

Authentication credentials must be validated by the backend.

---

## 7. Authentication Header

For JWT-based authentication, protected requests may use:

    Authorization: Bearer <access_token>

Example:

    Authorization: Bearer eyJhbGciOi...

The frontend must store and transmit authentication securely.

---

## 8. Authentication Endpoints

Authentication endpoints:

    POST /api/v1/auth/register
    POST /api/v1/auth/login
    POST /api/v1/auth/logout
    GET  /api/v1/auth/me

---

## 9. Register Endpoint

Endpoint:

    POST /api/v1/auth/register

Purpose:

Create a new user account.

Request:

    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "secure-password",
      "company_name": "Example Corp"
    }

The backend should:

1. Validate the request.
2. Validate email format.
3. Validate password requirements.
4. Create or associate the company according to the application rules.
5. Hash the password.
6. Create the user.
7. Return a safe response.

Passwords must never be stored in plain text.

---

## 10. Login Endpoint

Endpoint:

    POST /api/v1/auth/login

Request:

    {
      "email": "john@example.com",
      "password": "secure-password"
    }

Response:

    {
      "status": "SUCCESS",
      "data": {
        "access_token": "token",
        "token_type": "bearer"
      },
      "request_id": "uuid"
    }

The backend should identify:

    user_id
    company_id
    role
    permissions

These values must come from the authenticated backend context.

---

## 11. Logout Endpoint

Endpoint:

    POST /api/v1/auth/logout

Purpose:

End the user's authenticated session.

For JWT-based systems, the implementation may use:

- Short-lived access tokens
- Refresh token invalidation
- Token rotation
- Server-side session tracking

The exact mechanism can be finalized during implementation.

---

## 12. Current User Endpoint

Endpoint:

    GET /api/v1/auth/me

Purpose:

Return the currently authenticated user's safe profile.

Example response:

    {
      "status": "SUCCESS",
      "data": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "company_id": "uuid",
        "role": "CEO"
      },
      "request_id": "uuid"
    }

Sensitive information such as `password_hash` must never be returned.

---

## 13. Company Endpoint

Endpoint:

    GET /api/v1/company

Purpose:

Return information about the authenticated user's company.

Example response:

    {
      "status": "SUCCESS",
      "data": {
        "id": "uuid",
        "name": "Example Corp",
        "status": "ACTIVE"
      },
      "request_id": "uuid"
    }

The company must be determined from the authenticated user.

The frontend must not select another company.

---

## 14. Company Summary Endpoint

Endpoint:

    GET /api/v1/company/summary

Purpose:

Return high-level company metrics.

Possible data:

- Transaction count
- Transaction value
- Risk events
- Compliance events
- Failed logins
- Flagged transactions

All results must be tenant-scoped.

---

## 15. Dashboard Endpoint

Endpoint:

    GET /api/v1/dashboard

Purpose:

Return the main executive dashboard data.

Example response:

    {
      "status": "SUCCESS",
      "data": {
        "transactions": {},
        "risk": {},
        "security": {},
        "compliance": {},
        "finance": {}
      },
      "request_id": "uuid"
    }

The dashboard must only contain data belonging to the authenticated user's company.

---

## 16. Transaction Endpoints

Available endpoints:

    GET /api/v1/transactions
    GET /api/v1/transactions/{transaction_id}
    GET /api/v1/transactions/summary

These endpoints provide transaction information according to the user's permissions.

---

## 17. Transaction List Endpoint

Endpoint:

    GET /api/v1/transactions

Possible query parameters:

    page
    limit
    status
    country
    transaction_type
    start_date
    end_date

Example:

    GET /api/v1/transactions?status=FLAGGED&limit=50

The backend must automatically apply the authenticated user's `company_id`.

The user must not be able to override tenant filtering.

---

## 18. Transaction Details Endpoint

Endpoint:

    GET /api/v1/transactions/{transaction_id}

Purpose:

Return details for a specific transaction.

Before returning the record, the backend must verify:

    transaction.company_id == authenticated_user.company_id

If the transaction belongs to another company, access must be denied.

---

## 19. Transaction Summary Endpoint

Endpoint:

    GET /api/v1/transactions/summary

Possible metrics:

- Total transactions
- Completed transactions
- Failed transactions
- Flagged transactions
- Total transaction value
- Average transaction value
- Transaction trends

All metrics must be calculated using tenant-scoped data.

---

## 20. Risk Endpoints

Available endpoints:

    GET /api/v1/risk/summary
    GET /api/v1/risk/events
    GET /api/v1/risk/events/{event_id}

Possible risk information:

- Total risk events
- Risk levels
- Risk scores
- High-risk transactions
- Risk trends
- Risk concentration

---

## 21. Security Endpoints

Available endpoints:

    GET /api/v1/security/summary
    GET /api/v1/security/login-events
    GET /api/v1/security/login-events/{event_id}

Possible security metrics:

- Successful logins
- Failed logins
- Blocked logins
- Suspicious activity
- Login trends

Sensitive security information must be protected according to user permissions.

---

## 22. Compliance Endpoints

Available endpoints:

    GET /api/v1/compliance/summary
    GET /api/v1/compliance/events
    GET /api/v1/compliance/events/{event_id}

Possible information:

- Open compliance events
- Resolved events
- Escalated events
- Events under review
- Resolution trends

All results must be tenant-scoped.

---

## 23. AI Query Endpoint

Endpoint:

    POST /api/v1/query

Purpose:

Allow users to ask Infera natural-language business questions.

Example request:

    {
      "question": "Why did flagged transactions increase this month?"
    }

The API should:

1. Authenticate the user.
2. Determine the trusted company context.
3. Check permissions.
4. Send the question to the LangGraph workflow.
5. Retrieve relevant schema.
6. Generate SQL.
7. Validate SQL.
8. Validate tenant scope.
9. Execute the query.
10. Analyze results.
11. Select visualization.
12. Generate finding.
13. Generate insight.
14. Generate recommendation.
15. Return structured output.

---

## 24. AI Query Response

Example successful response:

    {
      "status": "SUCCESS",
      "data": {
        "query_id": "uuid",
        "intent": "ROOT_CAUSE_ANALYSIS",
        "domain": "RISK",
        "finding": "Flagged transactions increased by 24% this month.",
        "insight": "The increase is concentrated in several high-risk transaction patterns.",
        "recommendation": "Review the affected transaction patterns and strengthen monitoring.",
        "visualization": {
          "type": "line",
          "title": "Flagged Transactions by Month",
          "data": []
        }
      },
      "request_id": "uuid"
    }

---

## 25. AI Query Validation

Before executing an AI-generated query, the backend must validate:

- SQL syntax
- SQL statement type
- Allowed tables
- Allowed columns
- Tenant scope
- User permissions
- Query complexity
- Parameter safety
- Query limits

The AI output must never be executed directly.

---

## 26. AI Query Tenant Security

The AI query endpoint must use trusted authentication context.

Correct flow:

    Authenticated User
          ↓
    Trusted company_id
          ↓
    LangGraph
          ↓
    SQL Generation
          ↓
    SQL Validation
          ↓
    Tenant Validation
          ↓
    Query Execution

The user must not be able to submit:

    company_id

and use it to access another company.

The backend owns the tenant identity.

---

## 27. Query History Endpoint

Endpoint:

    GET /api/v1/query/history

Purpose:

Return previous AI queries belonging to the authenticated user or company according to the application's authorization rules.

Possible query parameters:

    page
    limit
    domain
    status
    start_date
    end_date

Example:

    GET /api/v1/query/history?page=1&limit=20

---

## 28. Query Details Endpoint

Endpoint:

    GET /api/v1/query/history/{query_id}

Purpose:

Return details of a previous AI query.

Before returning the record, the backend must verify:

    query.company_id == authenticated_user.company_id

Unauthorized query history must not be accessible.

---

## 29. Query History Response

Example:

    {
      "status": "SUCCESS",
      "data": {
        "items": [
          {
            "query_id": "uuid",
            "question": "Why did flagged transactions increase?",
            "domain": "RISK",
            "status": "SUCCESS",
            "created_at": "2026-09-04T10:00:00Z"
          }
        ],
        "page": 1,
        "limit": 20,
        "total": 1
      },
      "request_id": "uuid"
    }

---

## 30. Health Endpoint

Endpoint:

    GET /api/v1/health

Purpose:

Check whether the API is operational.

Example response:

    {
      "status": "SUCCESS",
      "data": {
        "status": "healthy"
      }
    }

The health endpoint should not expose secrets or internal infrastructure details.

---

## 31. Database Health Check

The backend may provide an internal database health check.

Example:

    PostgreSQL
        ↓
    Connection Test
        ↓
    Database Healthy

Database errors should be logged internally without exposing credentials.

---

## 32. AI Health Check

The backend may also monitor AI provider availability.

Possible internal status:

    Gemini
        ↓
    Available

or:

    Gemini
        ↓
    Unavailable

Provider credentials must never be returned by the API.

---

## 33. Pagination

Large result sets should use pagination.

Standard parameters:

    page
    limit

Example:

    GET /api/v1/transactions?page=1&limit=50

Recommended default:

    limit = 50

Maximum limits should be enforced by the backend.

---

## 34. Filtering

APIs may support safe filtering.

Examples:

    status
    country
    transaction_type
    risk_level
    start_date
    end_date

Example:

    GET /api/v1/risk/events?risk_level=HIGH

Filters must be validated.

Users must not be able to inject SQL through filter parameters.

---

## 35. Sorting

Where required, APIs may support controlled sorting.

Example:

    GET /api/v1/transactions?sort=created_at&order=desc

Only predefined sortable fields should be accepted.

The API must not directly insert user-provided sort values into raw SQL.

---

## 36. Request Validation

FastAPI and Pydantic should validate incoming requests.

Validation should include:

- Required fields
- Data types
- String lengths
- Email formats
- Password requirements
- UUID formats
- Enum values
- Date formats
- Pagination limits

Invalid requests should return:

    400 Bad Request

or:

    422 Unprocessable Entity

depending on the validation case.

---

## 37. HTTP Status Codes

Common status codes:

    200 OK
    201 Created
    204 No Content
    400 Bad Request
    401 Unauthorized
    403 Forbidden
    404 Not Found
    409 Conflict
    422 Unprocessable Entity
    429 Too Many Requests
    500 Internal Server Error
    503 Service Unavailable

The API should use consistent status codes.

---

## 38. Authentication Errors

Example:

    {
      "status": "FAILED",
      "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "Invalid email or password."
      },
      "request_id": "uuid"
    }

Do not reveal whether a specific email address exists unless required by the product design.

---

## 39. Authorization Errors

Example:

    {
      "status": "FAILED",
      "error": {
        "code": "FORBIDDEN",
        "message": "You are not authorized to access this resource."
      },
      "request_id": "uuid"
    }

Do not expose internal permission logic unnecessarily.

---

## 40. Tenant Access Errors

If a user attempts to access another company's data:

    {
      "status": "FAILED",
      "error": {
        "code": "TENANT_ACCESS_DENIED",
        "message": "You are not authorized to access this resource."
      },
      "request_id": "uuid"
    }

The API should avoid revealing whether the requested resource exists in another tenant.

---

## 41. AI Errors

Possible AI errors:

    AI_SERVICE_UNAVAILABLE
    INTENT_CLASSIFICATION_FAILED
    DOMAIN_CLASSIFICATION_FAILED
    SCHEMA_RETRIEVAL_FAILED
    SQL_GENERATION_FAILED
    SQL_VALIDATION_FAILED
    SQL_REPAIR_FAILED
    AI_QUERY_FAILED
    ANALYSIS_FAILED
    VISUALIZATION_FAILED
    CIO_SYNTHESIS_FAILED

Example:

    {
      "status": "FAILED",
      "error": {
        "code": "AI_SERVICE_UNAVAILABLE",
        "message": "The intelligence service is temporarily unavailable."
      },
      "request_id": "uuid"
    }

---

## 42. Database Errors

Database failures should return safe messages.

Example:

    {
      "status": "FAILED",
      "error": {
        "code": "DATABASE_UNAVAILABLE",
        "message": "The data service is temporarily unavailable."
      },
      "request_id": "uuid"
    }

Do not return:

- SQL stack traces
- Database passwords
- Connection strings
- Internal hostnames
- Database credentials

---

## 43. Rate Limiting

Rate limiting should be applied to sensitive and expensive endpoints.

Especially:

    POST /api/v1/auth/login
    POST /api/v1/auth/register
    POST /api/v1/query

AI queries may require stricter limits because they can consume external AI resources and database resources.

Rate limits should be configurable.

---

## 44. Request IDs

Every API request should have a request ID.

Example:

    request_id = uuid

The request ID should be:

- Returned in the response
- Included in logs
- Included in audit records
- Used for troubleshooting

Example:

    {
      "status": "SUCCESS",
      "request_id": "8b1c7d..."
    }

---

## 45. Audit Logging

Important API events should be recorded.

Examples:

    Login
    Logout
    Registration
    Authorization Failure
    Tenant Access Violation
    AI Query
    Blocked SQL
    Database Failure
    Important Security Events

Audit records may contain:

    user_id
    company_id
    request_id
    endpoint
    event_type
    status
    timestamp

Sensitive information must not be unnecessarily logged.

---

## 46. Role-Based API Access

Different endpoints may require different roles.

Example:

    CEO
    → Executive dashboard

    CFO
    → Financial information

    RISK_MANAGER
    → Risk information

    SECURITY_MANAGER
    → Security information

    COMPLIANCE_MANAGER
    → Compliance information

    COMPANY_ADMIN
    → Company administration

The exact permission matrix should be finalized during implementation.

---

## 47. API Security Rules

The API must:

1. Authenticate protected requests.
2. Authorize every protected resource.
3. Enforce tenant isolation.
4. Validate all request data.
5. Validate all AI-generated SQL.
6. Prevent SQL injection.
7. Prevent prompt injection from bypassing security.
8. Apply rate limits.
9. Protect secrets.
10. Use HTTPS in production.
11. Avoid sensitive logging.
12. Return safe error messages.
13. Never trust frontend authorization data.
14. Never trust AI authorization decisions.

---

## 48. CORS

CORS should allow only trusted frontend origins.

Development example:

    http://localhost:3000

Production origins should be configured through environment variables.

Do not use unrestricted production CORS unless explicitly required.

---

## 49. Environment Variables

API configuration may include:

    DATABASE_URL
    JWT_SECRET
    GOOGLE_API_KEY
    GEMINI_MODEL
    FRONTEND_URL
    CORS_ORIGINS

Secrets must never be hard-coded.

The `.env` file must not be committed to Git.

---

## 50. API Project Structure

Recommended structure:

    backend/
    └── app/
        ├── main.py
        ├── config.py
        │
        ├── api/
        │   └── v1/
        │       ├── router.py
        │       ├── auth.py
        │       ├── company.py
        │       ├── dashboard.py
        │       ├── query.py
        │       ├── transactions.py
        │       ├── risk.py
        │       ├── security.py
        │       ├── compliance.py
        │       ├── audit.py
        │       └── health.py
        │
        ├── schemas/
        │   ├── auth.py
        │   ├── company.py
        │   ├── query.py
        │   ├── transaction.py
        │   └── common.py
        │
        ├── services/
        │   ├── auth_service.py
        │   ├── company_service.py
        │   ├── dashboard_service.py
        │   ├── query_service.py
        │   ├── transaction_service.py
        │   ├── risk_service.py
        │   └── compliance_service.py
        │
        └── security/
            ├── permissions.py
            ├── tenant.py
            └── sql_validator.py

---

## 51. API and AI Separation

The API should not contain all AI logic directly inside route handlers.

Correct architecture:

    API Route
        ↓
    Query Service
        ↓
    LangGraph Workflow
        ↓
    AI Nodes
        ↓
    SQL Validation
        ↓
    Query Executor
        ↓
    PostgreSQL

This keeps the API layer clean and maintainable.

---

## 52. API and Database Separation

The frontend must never directly access PostgreSQL.

Correct:

    Next.js
        ↓
    FastAPI
        ↓
    Service Layer
        ↓
    SQLAlchemy
        ↓
    PostgreSQL

Incorrect:

    Next.js
        ↓
    PostgreSQL

---

## 53. API and Tenant Separation

Every tenant-aware API request must follow:

    Request
        ↓
    Authentication
        ↓
    Trusted User
        ↓
    Trusted company_id
        ↓
    Authorization
        ↓
    Tenant-Scoped Service
        ↓
    Tenant-Scoped Database Query

The API must never rely on the client to enforce tenant isolation.

---

## 54. Complete AI API Flow

Example:

    POST /api/v1/query

    User:
    "Why did flagged transactions increase this month?"

        ↓

    Authentication

        ↓

    Authorization

        ↓

    Trusted company_id

        ↓

    LangGraph

        ↓

    Intent Detection

        ↓

    Domain Detection

        ↓

    Schema Retrieval

        ↓

    SQL Generation

        ↓

    SQL Validation

        ↓

    Tenant Validation

        ↓

    Secure Query Executor

        ↓

    PostgreSQL

        ↓

    Pandas Analysis

        ↓

    Visualization

        ↓

    CIO Reasoning

        ↓

    API Response

---

## 55. Example Complete Response

Example:

    {
      "status": "SUCCESS",
      "data": {
        "query_id": "9e8f...",
        "intent": "ROOT_CAUSE_ANALYSIS",
        "domain": "RISK",
        "finding": "Flagged transactions increased by 24% this month.",
        "insight": "The increase is concentrated in several high-risk transaction patterns.",
        "recommendation": "Review the affected patterns and strengthen monitoring.",
        "visualization": {
          "type": "line",
          "title": "Flagged Transactions Trend",
          "x_axis": "month",
          "y_axis": "count",
          "data": []
        }
      },
      "request_id": "4d72..."
    }

---

## 56. API Testing Requirements

The API must be tested for:

- Authentication
- Authorization
- Tenant isolation
- Request validation
- Pagination
- Filtering
- Sorting
- Database errors
- AI errors
- Rate limiting
- SQL validation
- Prompt injection
- Sensitive data exposure
- Invalid resource access

---

## 57. Critical API Security Tests

The following scenarios must pass:

    Company A user
    → Request Company A transaction
    → ALLOWED

    Company A user
    → Request Company B transaction
    → BLOCKED

    Company A user
    → Submit company_id = Company B
    → BLOCKED

    Company A user
    → Query another company's data through AI
    → BLOCKED

    AI-generated DELETE
    → BLOCKED

    AI-generated UPDATE
    → BLOCKED

    AI-generated DROP
    → BLOCKED

    Unauthorized role
    → Protected endpoint
    → BLOCKED

---

## 58. API Documentation

FastAPI should automatically provide API documentation.

Expected development documentation:

    /docs

Alternative documentation:

    /redoc

API documentation should clearly describe:

- Endpoints
- Request schemas
- Response schemas
- Authentication
- Error responses
- Query parameters
- Authorization requirements

---

## 59. API Design Principles

Infera APIs should follow:

### Consistency

Use consistent naming and response structures.

### Security

Validate and authorize every request.

### Simplicity

Keep endpoint responsibilities clear.

### Tenant Awareness

All company data must be tenant-scoped.

### Maintainability

Keep route handlers thin and business logic in services.

### Observability

Use request IDs and structured logging.

### Reliability

Handle failures without exposing internal details.

### Scalability

Design APIs so services can scale independently.

---

## 60. Final API Principle

The FastAPI layer is the control point between the user, AI system, and database.

The fundamental API architecture is:

    Next.js
        ↓
    FastAPI
        ↓
    Authentication
        ↓
    Authorization
        ↓
    Tenant Isolation
        ↓
    Application Services
        ↓
    LangGraph / Database Services
        ↓
    Validation
        ↓
    PostgreSQL / Gemini
        ↓
    Structured API Response

The frontend requests.

The backend authenticates.

The backend authorizes.

The backend enforces tenant isolation.

The AI provides intelligence.

The SQL validator provides query safety.

PostgreSQL provides the data.

**The API is the controlled gateway between Infera users, AI intelligence, and company data.**