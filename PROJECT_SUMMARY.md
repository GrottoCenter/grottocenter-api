# Grottocenter API - LLM-Friendly Project Summary

## Project Overview

**Grottocenter API** is a Node.js backend application providing REST API services for the Grottocenter platform - a collaborative wiki database for cave exploration data. Built with Sails.js framework, it serves as the data layer for cave entrances, documents, cavers, organizations, and speleological information worldwide.

**Key Technologies**: Node.js 20+, Sails.js 1.5, PostgreSQL with PostGIS, Typesense, Docker

## Architecture Overview

### Framework & Structure
- **Framework**: Sails.js MVC framework with Waterline ORM
- **API Version**: RESTful API v1 with OpenAPI 3.0 documentation
- **Database**: PostgreSQL with PostGIS for geographical data
- **Search**: Typesense for advanced search capabilities
- **File Storage**: Azure Blob Storage for document files
- **Email**: AWS SES for notifications

### Core Components Interaction
```
Frontend (grottocenter-front)
    ↓ HTTP/REST
API Layer (controllers/v1/)
    ↓ Business Logic
Services Layer (api/services/)
    ↓ Data Access
Models Layer (api/models/)
    ↓ ORM
PostgreSQL Database + Typesense
```

## Key File Paths & Descriptions

### Configuration
- `config/policies.js` - Route-level authorization policies (tokenAuth, public access)
- `config/routes.js` - API endpoint routing configuration
- `config/datastores.js` - Database connection configuration
- `config/typesense.js` - Typesense client configuration
- `config/locales/` - Internationalization files (15 languages supported)

### API Structure
- `api/controllers/v1/` - REST endpoint controllers organized by resource
- `api/services/` - Business logic services (AuthService, EntranceService, etc.)
- `api/models/` - Waterline ORM models (T* for tables, H* for history, J* for joins)
- `api/policies/tokenAuth.js` - JWT authentication middleware
- `api/responses/` - Standardized HTTP response handlers

### Database Schema
- `sql/0_tables.sql` - Complete database schema definition
- `sql/0_views.sql` - Database views for complex queries
- `sql/91_materialized_views.sql` - Performance-optimized materialized views
- `sql/2_*.sql` - Migration files with timestamps

### Documentation
- `assets/swaggerV1.yaml` - Complete OpenAPI 3.0 specification (24.0.0)

## Database Relational Model

### Core Entities
- **t_entrance** - Cave entrances with GPS coordinates, geology, access info
- **t_cave** - Cave networks with depth, length, diving status
- **t_document** - Speleological documents, publications, maps
- **t_caver** - Users, authors, contributors with authentication
- **t_grotto** - Speleological organizations, clubs, libraries
- **t_massif** - Geographical massifs with polygon boundaries

### Relationship Patterns
- **History Tables (h_*)**: Complete audit trail for all entities
- **Junction Tables (j_*)**: Many-to-many relationships
- **Soft Deletes**: `is_deleted` flag with `redirect_to` for merging
- **Multilingual Support**: Names and descriptions in multiple languages
- **Geographical Data**: PostGIS for spatial queries and containment

### Key Relationships
```sql
t_entrance → t_cave (many-to-one)
t_entrance → t_massif (spatial containment)
t_document → t_caver (author relationship)
t_entrance → t_location/t_description/t_rigging (one-to-many)
```

### Migration Management
- Sequential numbered migrations in `sql/` directory
- History tables automatically track all changes
- Materialized views for performance (refreshed via cron)

## Dependencies & Versions

### Core Dependencies (package.json v24.0.0)
- **sails**: ^1.5.12 - MVC framework
- **sails-postgresql**: ^5.0.1 - PostgreSQL adapter
- **typesense**: ^2.1.0 - Search engine client
- **jsonwebtoken**: ^9.0.2 - JWT authentication
- **argon2**: ^0.41.1 - Password hashing
- **@azure/storage-blob**: ^12.25.0 - File storage
- **@aws-sdk/client-ses**: ^3.664.0 - Email service

### Development Dependencies
- **mocha**: ^10.7.3 - Testing framework
- **eslint**: ^8.57.1 - Code linting (Airbnb config)
- **prettier**: ^3.3.3 - Code formatting
- **husky**: ^9.1.6 - Git hooks for quality control

## Available APIs & Usage Examples

### Authentication
```javascript
// Login
POST /api/v1/login
{ email: "user@example.com", password: "password" }
→ { token: "jwt_token", status: "Success" }

// Protected routes require Authorization header
Authorization: Bearer <jwt_token>
```

### Core Resources
```javascript
// Get entrance with full details
GET /api/v1/entrances/123
→ Entrance object with cave, descriptions, documents, etc.

// Search across all resources
POST /api/v1/search
{ query: "mammoth cave", resourceTypes: ["entrances", "documents"] }

// Create new entrance (requires auth)
POST /api/v1/entrances
{ name: {text: "Cave Name", language: "eng"}, latitude: 45.123, ... }
```

### Advanced Features
```javascript
// Geolocation queries
GET /api/v1/geoloc/entrances?sw_lat=45&sw_lng=2&ne_lat=46&ne_lng=3

// Bibliographic metadata (OAI-PMH compatible)
GET /api/v1/bibliographic-metadata/records?from=2023-01-01&until=2023-12-31

// Statistics
GET /api/v1/countries/FR/statistics
→ Cave counts, depths, lengths for France
```

## Translation Structure

### Implementation
- **Location**: `config/locales/` directory
- **Format**: JSON files per language (ar.json, en.json, fr.json, etc.)
- **Languages**: 15 supported languages including Arabic, Chinese, European languages
- **Usage**: `sails.__('key')` for server-side, API responses include localized content
- **Database**: Multilingual content stored with language codes (ISO 639-2)

### Language Support
```javascript
// Supported languages with ISO codes
const languages = ['ar', 'bg', 'ca', 'de', 'el', 'en', 'es', 'fr', 'he', 'id', 'it', 'ja', 'nl', 'pt', 'ro'];

// Content localization
t_name.id_language → t_language.id (3-letter codes)
t_description.id_language → localized descriptions
```

## Policies & Authorization

### Policy System (`config/policies.js`)
- **Default**: `'*': false` - Deny all by default
- **Public Routes**: `true` - No authentication required
- **Protected Routes**: `'tokenAuth'` - JWT token required
- **Granular Control**: Per-endpoint authorization

### User Groups & Permissions
```javascript
// User groups (t_group table)
ADMIN - Full system access
MODERATOR - Content moderation, validation
LEADER - Regional management, subscriptions
CONTRIBUTOR - Content creation
USER - Basic authenticated access

// Rights checking
RightService.hasGroup(token.groups, RightService.G.MODERATOR)
```

## Cron Jobs & Materialized Views

### Automated Refresh (`cron/` folder)
```bash
# refresh_views_procedure.sh - Weekly refresh at 04:00 Sunday
REFRESH MATERIALIZED VIEW CONCURRENTLY v_massif_info;
REFRESH MATERIALIZED VIEW CONCURRENTLY v_country_info;
REFRESH MATERIALIZED VIEW CONCURRENTLY v_region_info;

# refresh_data_quality_view_procedure.sh - Data quality metrics
REFRESH MATERIALIZED VIEW CONCURRENTLY v_data_quality_compute_entrance;
```

### Performance Views
- **v_massif_info**: Cave statistics per massif
- **v_country_info**: National cave statistics
- **v_region_info**: Regional cave statistics
- **v_data_quality_compute_entrance**: Data completeness scoring
- **v_bibliographic_metadata**: OAI-PMH metadata aggregation

## Test Organization & Fixtures

### Test Structure
```
test/
├── bootstrap.test.js - Test environment setup
├── fixtures/ - JSON test data for all entities
│   ├── tcaver.json - Test users
│   ├── tentrance.json - Test entrances
│   └── tdocument.json - Test documents
└── integration/ - API endpoint tests
    ├── 0_models/ - Model tests
    ├── 1_services/ - Service tests
    └── 4_routes/ - Controller tests
```

### Test Environment
- **Framework**: Mocha with Supertest for HTTP testing
- **Database**: Separate test database with `migrate: 'drop'`
- **Fixtures**: Fixted library for consistent test data
- **Coverage**: NYC for code coverage reporting

### Test Conventions
- **CRITICAL**: Always use arrow functions `() => {}` for `describe()` blocks
- **NEVER** use `function` keyword in `describe()` blocks (causes func-names linting error)
- For `it()` test cases:
  - Always use arrow functions: `it('test name', (done) => {})`
  - Chain `.timeout()` at the end if needed: `it('test name', (done) => { ... }).timeout(5000);`
- Always use arrow functions for `before()`/`after()` hooks

### Running Tests
```bash
npm test                    # All tests
npm run coverage           # With coverage report
npm test -- --grep "Auth"  # Specific test patterns
```

## Implementation Patterns & Conventions

### Code Organization
- **Controllers**: Thin layer, delegate to services
- **Services**: Business logic, reusable across controllers
- **Models**: Data validation, relationships, lifecycle callbacks
- **Converters**: Transform database models to API responses

### Naming Conventions
```javascript
// Database tables
t_* - Main tables (t_entrance, t_cave)
h_* - History/audit tables (h_entrance, h_cave)
j_* - Junction tables (j_document_caver_author)
v_* - Views (v_caver_roles)

// Models (Waterline)
T* - Table models (TEntrance, TCave)
H* - History models (HEntrance, HCave)
J* - Junction models (JDocumentCaverAuthor)
V* - View models (VCaverRoles)
```

### Error Handling
```javascript
// Standardized responses
return res.notFound('Entrance not found');
return res.forbidden('Insufficient permissions');
return res.serverError('Database error');

// Service layer error patterns
try {
  const result = await SomeService.operation();
  return result;
} catch (error) {
  sails.log.error(error);
  throw error;
}
```

### Data Validation
- **Model Level**: Waterline validations in model definitions
- **Service Level**: Business rule validation
- **Controller Level**: Parameter validation and sanitization

## Development Workflow

### Git Flow
- **Branches**: feature/, bugfix/, hotfix/ prefixes
- **Commits**: Conventional commit specification enforced
- **Hooks**: Husky for pre-commit linting and testing

### Quality Control
```bash
npm run lint        # ESLint with Airbnb config
npm run lint:fix    # Auto-fix linting issues
npm run dev         # Development with auto-restart
```

### Environment Setup
```bash
npm run dev:up      # Start PostgreSQL + Typesense containers
npm run dev         # Start API server with hot reload
npm run dev:down    # Stop and cleanup containers
```

## Extension Points for Future Development

### 1. New Resource Types
- Add model in `api/models/`
- Create service in `api/services/`
- Add controllers in `api/controllers/v1/`
- Update policies in `config/policies.js`
- Add Typesense indexing

### 2. Additional Languages
- Add JSON file in `config/locales/`
- Update `config/locales/index.js`
- Add language to `t_language` table

### 3. New API Endpoints
```javascript
// Controller pattern
module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(req.token?.groups, RightService.G.MODERATOR);
  const result = await SomeService.operation(req.params.id);
  return ControllerService.treatAndConvert(req, null, result, params, res, converter);
};
```

### 4. Database Extensions
- Add migration file: `sql/YYYY_MM_DD_description.sql`
- Update materialized views if needed
- Add corresponding model and relationships

### 5. Search Enhancements
- Extend `SearchService`
- Add new fields to search indexes
- Update search result converters

### 6. Authentication Extensions
- Extend `AuthService` for new providers
- Add new user groups in `t_group`
- Update `RightService` permissions

This summary provides a comprehensive foundation for LLM assistants to understand and work effectively with the Grottocenter API codebase, covering architecture, patterns, and extension points while maintaining focus on practical implementation details.
