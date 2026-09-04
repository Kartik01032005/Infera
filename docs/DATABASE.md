# Infera — Database Specification

## 1. Purpose

This document defines the database architecture, schema, relationships, security requirements, multi-tenant isolation, indexing strategy, migrations, and data management rules for Infera.

Infera uses PostgreSQL as its primary database.

The database layer uses:

- PostgreSQL
- SQLAlchemy
- Alembic
- Python
- FastAPI

The database stores company, user, transaction, risk, security, compliance, audit, and AI query information.

---

## 2. Database Technology

Primary database:

    PostgreSQL

Database access:

    SQLAlchemy

Database migrations:

    Alembic

Backend:

    Python + FastAPI

PostgreSQL is selected because Infera requires:

- Relational data
- Complex joins
- Aggregations
- Analytical queries
- Strong constraints
- Multi-tenant isolation
- Transaction support
- Indexing
- Row-Level Security
- Reliable SQL support

---

## 3. Multi-Tenant Database Architecture

Infera is a multi-tenant application.

Multiple companies can use the same application and database.

Example:

    PostgreSQL
        │
        ├── Company A
        │     ├── Users
        │     ├── Transactions
        │     ├── Risk Events
        │     └── Compliance Events
        │
        ├── Company B
        │     ├── Users
        │     ├── Transactions
        │     ├── Risk Events
        │     └── Compliance Events
        │
        └── Company C
              ├── Users
              ├── Transactions
              ├── Risk Events
              └── Compliance Events

Each company's data must remain isolated.

---

## 4. Database Design Principles

The database should follow these principles:

1. Every tenant-owned record must have `company_id`.
2. Use UUID primary keys.
3. Use foreign keys for relationships.
4. Use appropriate constraints.
5. Use timestamps for important records.
6. Use indexes for common queries.
7. Protect sensitive information.
8. Use least-privilege database permissions.
9. Support tenant isolation.
10. Use migrations instead of manual schema changes.
11. Keep AI access read-only.
12. Avoid unnecessary data duplication.
13. Maintain referential integrity.
14. Use PostgreSQL features where they improve security and reliability.

---

## 5. Core Entity Relationship

The main database relationship is:

    Company
       │
       ├── Users
       │
       ├── Transactions
       │
       ├── Risk Events
       │
       ├── Login Events
       │
       ├── Compliance Events
       │
       ├── Audit Logs
       │
       └── Query History

A company can have many users.

A company can have many transactions.

A company can have many risk events.

A company can have many security events.

A company can have many compliance events.

A company can have many audit records.

A company can have many AI query records.

---

## 6. Companies Table

Table:

    companies

Purpose:

Stores organizations using Infera.

Columns:

    id
    name
    slug
    status
    created_at
    updated_at

Recommended types:

    id          UUID PRIMARY KEY
    name        VARCHAR
    slug        VARCHAR UNIQUE
    status      VARCHAR
    created_at  TIMESTAMP
    updated_at  TIMESTAMP

Example:

    {
      "id": "uuid",
      "name": "Example Corporation",
      "slug": "example-corporation",
      "status": "ACTIVE"
    }

---

## 7. Users Table

Table:

    users

Purpose:

Stores users belonging to companies.

Columns:

    id
    company_id
    name
    email
    password_hash
    role
    status
    created_at
    updated_at

Recommended structure:

    id             UUID PRIMARY KEY
    company_id     UUID FOREIGN KEY
    name           VARCHAR
    email          VARCHAR UNIQUE
    password_hash  VARCHAR
    role           VARCHAR
    status         VARCHAR
    created_at     TIMESTAMP
    updated_at     TIMESTAMP

Every user must belong to a company.

---

## 8. User Roles

Supported roles:

    PLATFORM_ADMIN
    COMPANY_ADMIN
    CEO
    CFO
    COO
    MANAGER
    ANALYST
    RISK_MANAGER
    SECURITY_MANAGER
    COMPLIANCE_MANAGER
    EMPLOYEE

Role permissions should be enforced by the backend.

The database should store the user's role.

The AI must never modify the role.

---

## 9. Transactions Table

Table:

    transactions

Purpose:

Stores company transaction data used for financial, operational, fraud, and risk analysis.

Columns:

    id
    company_id
    user_id
    amount
    currency
    country
    transaction_type
    status
    created_at

Recommended structure:

    id                UUID PRIMARY KEY
    company_id        UUID FOREIGN KEY
    user_id           UUID FOREIGN KEY
    amount            NUMERIC
    currency          VARCHAR
    country           VARCHAR
    transaction_type  VARCHAR
    status            VARCHAR
    created_at        TIMESTAMP

---

## 10. Transaction Status

Supported transaction statuses:

    PENDING
    COMPLETED
    FAILED
    CANCELLED
    FLAGGED
    REVIEW

These values should be validated by the application and database where appropriate.

---

## 11. Risk Events Table

Table:

    risk_events

Purpose:

Stores risk-related events associated with company activity.

Columns:

    id
    company_id
    user_id
    risk_level
    risk_score
    reason
    created_at

Recommended structure:

    id           UUID PRIMARY KEY
    company_id   UUID FOREIGN KEY
    user_id      UUID FOREIGN KEY
    risk_level   VARCHAR
    risk_score   NUMERIC
    reason       TEXT
    created_at   TIMESTAMP

---

## 12. Risk Levels

Supported risk levels:

    LOW
    MEDIUM
    HIGH
    CRITICAL

Risk scores may use a numeric scale.

The exact scoring model can be defined during implementation.

---

## 13. Login Events Table

Table:

    login_events

Purpose:

Stores authentication and login activity for security analysis.

Columns:

    id
    company_id
    user_id
    ip_address
    status
    failure_reason
    user_agent
    created_at

Recommended structure:

    id              UUID PRIMARY KEY
    company_id      UUID FOREIGN KEY
    user_id         UUID FOREIGN KEY
    ip_address      INET
    status          VARCHAR
    failure_reason  VARCHAR
    user_agent      TEXT
    created_at      TIMESTAMP

Sensitive security data should be handled carefully.

---

## 14. Login Status

Supported login statuses:

    SUCCESS
    FAILED
    BLOCKED

Possible failure reasons:

    INVALID_PASSWORD
    INVALID_USER
    ACCOUNT_LOCKED
    MFA_FAILED
    SUSPICIOUS_IP

The exact authentication implementation may introduce additional statuses later.

---

## 15. Compliance Events Table

Table:

    compliance_events

Purpose:

Stores compliance-related business events.

Columns:

    id
    company_id
    user_id
    event_type
    status
    details
    created_at

Recommended structure:

    id          UUID PRIMARY KEY
    company_id  UUID FOREIGN KEY
    user_id     UUID FOREIGN KEY
    event_type  VARCHAR
    status      VARCHAR
    details     JSONB
    created_at  TIMESTAMP

`JSONB` can be used for flexible compliance event details.

---

## 16. Compliance Status

Supported statuses:

    OPEN
    UNDER_REVIEW
    RESOLVED
    ESCALATED

These statuses support compliance workflow analysis.

---

## 17. Audit Logs Table

Table:

    audit_logs

Purpose:

Stores important system and security events.

Columns:

    id
    company_id
    user_id
    event_type
    request_id
    status
    created_at

Recommended structure:

    id          UUID PRIMARY KEY
    company_id  UUID FOREIGN KEY
    user_id     UUID FOREIGN KEY
    event_type  VARCHAR
    request_id  UUID
    status      VARCHAR
    created_at  TIMESTAMP

Possible events:

    LOGIN
    LOGOUT
    AUTH_FAILURE
    AUTHORIZATION_FAILURE
    TENANT_ACCESS_DENIED
    AI_QUERY
    SQL_BLOCKED
    SYSTEM_ERROR

---

## 18. Query History Table

Table:

    query_history

Purpose:

Stores AI query activity.

Columns:

    id
    company_id
    user_id
    question
    domain
    status
    created_at

Recommended structure:

    id          UUID PRIMARY KEY
    company_id  UUID FOREIGN KEY
    user_id     UUID FOREIGN KEY
    question    TEXT
    domain      VARCHAR
    status      VARCHAR
    created_at  TIMESTAMP

Query history allows users to review previous Infera questions.

---

## 19. Relationships

Main relationships:

    companies.id
        ↓
    users.company_id

    companies.id
        ↓
    transactions.company_id

    companies.id
        ↓
    risk_events.company_id

    companies.id
        ↓
    login_events.company_id

    companies.id
        ↓
    compliance_events.company_id

    companies.id
        ↓
    audit_logs.company_id

    companies.id
        ↓
    query_history.company_id

Users may also be referenced through:

    user_id

where applicable.

---

## 20. Tenant Isolation

Tenant isolation is mandatory.

Every tenant-owned table must contain:

    company_id

The backend must automatically restrict queries using the authenticated user's company.

Example:

    SELECT *
    FROM transactions
    WHERE company_id = :company_id;

The `company_id` value must come from trusted backend authentication context.

---

## 21. Trusted Tenant Context

The backend should create a trusted tenant context after authentication.

Example:

    tenant_context = {
        "user_id": authenticated_user.id,
        "company_id": authenticated_user.company_id,
        "role": authenticated_user.role
    }

This context must not be supplied by:

- Frontend
- User request body
- URL parameter
- AI model

The backend controls tenant identity.

---

## 22. PostgreSQL Row-Level Security

PostgreSQL Row-Level Security may be used as defense in depth.

Conceptually:

    Application Tenant Validation
            ↓
    PostgreSQL Row-Level Security
            ↓
    Company Data

RLS should ensure that a database session can only access rows belonging to the permitted company where implemented.

RLS is an additional security layer and does not replace backend authorization.

---

## 23. Database User Permissions

Database access should follow least privilege.

Recommended roles may include:

    Application User
    Read-Only AI User
    Migration User
    Administrative User

The AI query system should use read-only database permissions wherever possible.

The application should not use a highly privileged database account for normal AI queries.

---

## 24. AI Database Access

The AI must not directly connect to PostgreSQL.

Incorrect:

    Gemini
       ↓
    PostgreSQL

Correct:

    Gemini
       ↓
    FastAPI
       ↓
    SQL Validation
       ↓
    Tenant Validation
       ↓
    Query Executor
       ↓
    PostgreSQL

Gemini should never receive database credentials.

---

## 25. Read-Only AI Queries

AI-generated analytical queries should be read-only.

Allowed operations should primarily include:

    SELECT
    WITH

depending on the implemented SQL parser and security policy.

The backend must validate every generated query before execution.

---

## 26. Forbidden AI Database Operations

The AI query system must reject:

    INSERT
    UPDATE
    DELETE
    DROP
    ALTER
    TRUNCATE
    CREATE
    GRANT
    REVOKE

The AI should never be able to modify or destroy production data.

---

## 27. Indexing Strategy

Indexes should be created for commonly filtered and joined columns.

Recommended indexes:

    users.company_id

    transactions.company_id
    transactions.user_id
    transactions.created_at
    transactions.status
    transactions.country

    risk_events.company_id
    risk_events.user_id
    risk_events.risk_level
    risk_events.created_at

    login_events.company_id
    login_events.user_id
    login_events.status
    login_events.created_at

    compliance_events.company_id
    compliance_events.status
    compliance_events.created_at

    audit_logs.company_id
    audit_logs.user_id
    audit_logs.created_at

    query_history.company_id
    query_history.user_id
    query_history.created_at

Indexes should be reviewed after real query performance is measured.

---

## 28. Composite Indexes

Composite indexes may be added for common analytical queries.

Examples:

    transactions(company_id, created_at)

    transactions(company_id, status)

    risk_events(company_id, risk_level, created_at)

    login_events(company_id, status, created_at)

    compliance_events(company_id, status, created_at)

Composite indexes should be added based on actual query patterns.

Avoid creating unnecessary indexes.

---

## 29. Data Integrity

The database should enforce data integrity through:

- Primary keys
- Foreign keys
- Unique constraints
- NOT NULL constraints
- CHECK constraints
- Appropriate data types
- Controlled status values

Example:

    transactions.company_id
        ↓
    Must reference existing companies.id

---

## 30. Sensitive Data

Sensitive information must be protected.

Examples:

    password_hash
    authentication information
    IP addresses
    private security information
    internal infrastructure information

Rules:

1. Never expose password hashes through the API.
2. Never expose password hashes to the AI.
3. Never log passwords.
4. Never store plaintext passwords.
5. Protect authentication information.
6. Restrict sensitive columns.
7. Avoid unnecessary sensitive data collection.

---

## 31. Database Connection Security

Production database connections should use secure connections.

Requirements:

- Use encrypted database connections where supported.
- Store connection strings in environment variables.
- Do not hard-code credentials.
- Use secure credentials.
- Restrict database network access.
- Use least-privilege database accounts.

Required environment variable:

    DATABASE_URL

---

## 32. Connection Management

SQLAlchemy should manage database connections through a connection pool.

Requirements:

- Configure connection pooling.
- Configure connection timeouts.
- Close sessions correctly.
- Handle connection failures.
- Avoid connection leaks.
- Monitor database connections.

The exact pool settings should be tuned for the deployment environment.

---

## 33. Query Performance

The database should support efficient analytical queries.

Performance practices:

- Use appropriate indexes.
- Avoid unnecessary joins.
- Avoid SELECT * when unnecessary.
- Limit result sizes.
- Use pagination.
- Use query timeouts.
- Analyze slow queries.
- Use PostgreSQL query planning tools during optimization.

AI-generated queries must also be subject to query limits.

---

## 34. Query Result Limits

The backend should restrict excessive result sizes.

Example:

    Maximum rows returned:
    1000

The exact limit may be adjusted during implementation.

Large datasets should use:

- Aggregation
- Pagination
- Filtering
- Appropriate grouping

This prevents unnecessary database and AI processing.

---

## 35. Database Migrations

Alembic should be used for schema migrations.

Example workflow:

    Change SQLAlchemy Model
          ↓
    Create Alembic Migration
          ↓
    Review Migration
          ↓
    Apply Migration
          ↓
    Test Database

Never make undocumented production schema changes manually.

---

## 36. Migration Rules

Migration requirements:

1. Every schema change should have a migration.
2. Migrations should be reviewed.
3. Migrations should be tested locally.
4. Rollback should be considered.
5. Production migrations should be executed carefully.
6. Database backups should exist before risky migrations.

---

## 37. Seed Data

Development and testing should use fictional seed data.

Seed data should contain:

- Multiple companies
- Multiple users
- Transactions
- Risk events
- Login events
- Compliance events
- Query history

Example:

    Company A
        ↓
    100 Users
        ↓
    Transactions
        ↓
    Risk Events

    Company B
        ↓
    100 Users
        ↓
    Transactions
        ↓
    Risk Events

The exact seed volume can be adjusted during development.

---

## 38. Multi-Tenant Test Data

Seed data must make tenant isolation easy to test.

Example:

    Company A:
    company_id = A

    Company B:
    company_id = B

Test:

    Authenticated Company A User
        ↓
    Query company_id = A
        ↓
    ALLOWED

Test:

    Authenticated Company A User
        ↓
    Query company_id = B
        ↓
    BLOCKED

---

## 39. Database Backup

Production data should be backed up.

Backup strategy should consider:

- Automated backups
- Backup retention
- Point-in-time recovery where available
- Recovery testing
- Database failure scenarios

Backup credentials and storage must be protected.

---

## 40. Database Recovery

The recovery process should allow the system to restore database availability after a failure.

Recovery planning should define:

    Backup
        ↓
    Restore
        ↓
    Validate Database
        ↓
    Run Application Tests
        ↓
    Resume Service

Recovery procedures should be tested periodically.

---

## 41. Database Scalability

The initial architecture should support growth.

Potential future improvements:

- PostgreSQL read replicas
- Connection pooling improvements
- Partitioning
- Query optimization
- Caching
- Dedicated analytics database
- Data warehouse
- Background processing
- Database monitoring

These should only be introduced when required.

---

## 42. Future Database Expansion

Future tables may include:

    financial_metrics
    revenue_records
    expenses
    customers
    products
    employees
    fraud_events
    alerts
    forecasts
    business_goals
    ai_insights

New tenant-owned tables must follow the same multi-tenant security model.

---

## 43. Database and AI Architecture

The AI should interact with the database only through controlled backend services.

Complete flow:

    User Question
        ↓
    FastAPI
        ↓
    Authentication
        ↓
    Tenant Context
        ↓
    LangGraph
        ↓
    Gemini
        ↓
    SQL Generation
        ↓
    SQL Validation
        ↓
    Tenant Validation
        ↓
    Query Executor
        ↓
    SQLAlchemy
        ↓
    PostgreSQL
        ↓
    Query Result
        ↓
    Pandas
        ↓
    AI Analysis

---

## 44. Database Security Rules

The database implementation must follow these rules:

1. Every tenant-owned record must have `company_id`.
2. Company identity must come from trusted authentication.
3. Frontend-provided company IDs must not control authorization.
4. AI-generated SQL must always be validated.
5. AI access must be read-only.
6. AI must never receive database credentials.
7. Cross-company queries must be blocked.
8. Sensitive columns must be protected.
9. Least-privilege permissions must be used.
10. Production data must be backed up.
11. Database connections must be secured.
12. Schema changes must use migrations.
13. Database errors must not expose credentials.
14. Query limits must be enforced.
15. Audit events must be recorded where required.

---

## 45. Database Testing Requirements

The database layer must be tested for:

- Connection reliability
- Model creation
- Foreign keys
- Constraints
- Migrations
- Rollbacks
- Seed data
- Tenant isolation
- Query performance
- Sensitive data protection
- Read-only AI access
- Backup and recovery procedures

---

## 46. Critical Database Security Tests

The following tests must pass:

    Company A user
        ↓
    Company A transaction
        ↓
    ALLOWED

    Company A user
        ↓
    Company B transaction
        ↓
    BLOCKED

    AI-generated SELECT
        ↓
    Validated
        ↓
    ALLOWED

    AI-generated DELETE
        ↓
    BLOCKED

    AI-generated UPDATE
        ↓
    BLOCKED

    AI-generated DROP
        ↓
    BLOCKED

    AI requests password_hash
        ↓
    BLOCKED

---

## 47. Database Naming Conventions

Use consistent naming.

Recommended:

    snake_case

Examples:

    company_id
    user_id
    created_at
    transaction_type
    risk_level
    failure_reason

Table names should normally use plural snake_case:

    companies
    users
    transactions
    risk_events
    login_events
    compliance_events
    audit_logs
    query_history

---

## 48. Timestamp Standards

Timestamp columns should use a consistent timezone-aware strategy.

Recommended fields:

    created_at
    updated_at

The application should consistently handle timestamps in UTC.

Frontend applications can convert timestamps to the user's local timezone for display.

---

## 49. Database Environment Separation

Development, testing, and production databases should be separated.

Example:

    Development
        ↓
    Local PostgreSQL

    Testing
        ↓
    Test PostgreSQL

    Production
        ↓
    Managed PostgreSQL

Production data should never be casually copied into development environments.

---

## 50. Database Architecture Summary

The complete database architecture is:

    Next.js
        ↓
    FastAPI
        ↓
    Authentication
        ↓
    Authorization
        ↓
    Trusted Tenant Context
        ↓
    Application Services
        ↓
    SQL Validation
        ↓
    SQLAlchemy
        ↓
    PostgreSQL
        ↓
    Tenant Data

Core tables:

    companies
    users
    transactions
    risk_events
    login_events
    compliance_events
    audit_logs
    query_history

Every tenant-owned record is connected to:

    company_id

---

## 51. Final Database Principle

PostgreSQL is the source of truth for Infera business data.

The backend controls access.

The AI proposes analytical queries.

The SQL validator checks those queries.

Tenant isolation protects company data.

PostgreSQL enforces database-level rules.

The fundamental principle is:

**The AI can request data. The backend decides what is allowed. PostgreSQL stores and protects the data.**