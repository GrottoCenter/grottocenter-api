# Permission Management System

## Overview

Grottocenter API implements a **Role-Based Access Control (RBAC) Level 1** system where users are assigned to roles and permissions are checked based on role membership. The system uses a combination of route-level policies and controller-level permission checks.

## User Roles

Roles are **not hierarchical**; for instance, an Administrator does not automatically inherit all permissions of a Moderator, nevertheless, **a user can be assigned multiple roles** cumulating their permissions.

### 1. **Visitor** (Anonymous Users)
- **Description**: Non-authenticated users
- **Permissions**:
  - View public cave/entrance/document/organisation/massif/person data
  - Search through cave/entrance/document/organisation/massif/person data
  - View complete entity history
  - View statistics
  - View all organization details
  - Access API documentation
  - Access API within the rate limits

### 2. **User** (Authenticated Users)
- **Description**: Default authenticated users role
- **Permissions**: All Visitor permissions plus:
  - **Content Management**:
    - Create caves, entrances, documents, Massifs, Organisations, comments, descriptions, locations, riggings, histories
    - Edit caves, entrances, documents, Massifs, Organisations, descriptions, locations, riggings, histories
    - Edit own comments
    - Unlink documents from entities
    - Rollback to a previous version of any content
    - Add/remove own explored entrances
  - **Personal Management**:
    - Manage personal profile and settings
    - Join/leave organizations (own membership only)
  - **Organization Membership**:
    - Manage own organization memberships
    - Manage explored caves for organizations they belong to

### 3. **Leader** (Regional Leaders)
- **Description**: Contributors that others can refer to for questions
- **Permissions**: All User permissions plus:
  - **Regional Management**:
    - Subscribe/unsubscribe to country notifications
    - Subscribe/unsubscribe to massif notifications
    - Subscribe/unsubscribe to region notifications
  - **Data Export**:
    - Download full database export

### 4. **Moderator** (Content Reviewers)
- **Description**: Content reviewers and validators
- **Permissions**: All User permissions plus:
  - **Content Moderation**:
    - Delete/restore any caves, entrances, documents, comments, descriptions, locations, riggings, histories, organisations, massifs, documents
    - Update any user's comments
    - Validate documents
    - Manage duplicates (documents and entrances)
  - **Advanced Access**:
    - View deleted content
    - Access moderation tools and interfaces
  - **Explored Cave Management**:
    - Add/remove explored caves for any organization

### 5. **Administrator** (System Administrators)
- **Description**: Technical responsible for the application
- **Permissions**: All User permissions plus:
  - **User Management**:
    - Assign/remove user roles
    - Manage any user accounts
    - Delete user accounts
    - View user lists (authors, contributors, users)
    - View complete user information
    - Cancel any user's subscriptions
  - **System Operations**:
    - Import data from CSV files (documents and entrances)
    - System configuration and maintenance
  - **Sensitive Data Management**:
    - Remove sensitive flag from entrances
    - Modify coordinates of sensitive entrances
    - Access all sensitive entrance data
  - **Advanced Organization Management**:
    - Add/remove explored caves for any organization
    - Manage organization memberships for any user

## Comprehensive Permission Matrix

| Action                                                        | Visitor | User | Leader | Moderator | Administrator |
|---------------------------------------------------------------|---------|------|--------|-----------|---------------|
| **Public Data Access**                                        |
| View public cave/entrance/document/organisation/massif/person | ✅ | ✅ | ✅ | ✅ | ✅ |
| View non-sensitive coordinates                                | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search content                                                | ✅ | ✅ | ✅ | ✅ | ✅ |
| View statistics                                               | ✅ | ✅ | ✅ | ✅ | ✅ |
| View history                                                  | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Content Creation**                                          |
| Create caves/entrances/document/organisation/massif/person    | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create comments/descriptions/locations/riggings/histories     | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Content Modification**                                      |
| Update caves/entrances/document/organisation/massif/person    | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update descriptions/locations/riggings/histories              | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update own comments                                           | ❌ | ✅ | ✅ | ✅ | ✅ |
| Update any comment                                            | ❌ | ❌ | ❌ | ✅ | ❌ |
| Soft delete any content                                       | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Soft-deleted Content Management**                           |
| View soft-deleted content                                     | ❌ | ❌ | ❌ | ✅ | ✅ |
| Restore soft-deleted content                                  | ❌ | ❌ | ❌ | ✅ | ✅ |
| Permanent delete                                              | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Document Management**                                       |
| Validate documents                                            | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage document duplicates                                    | ❌ | ❌ | ❌ | ✅ | ✅ |
| Unlink documents from entities                                | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Organization Management**                                   |
| Join/leave own organizations                                  | ❌ | ✅ | ✅ | ✅ | ✅ |
| Revoke any user's organization membership                     | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Explored Cave Management**                                  |
| Add/remove explored caves (own orgs)                          | ❌ | ✅ | ✅ | ✅ | ✅ |
| Add/remove explored caves (any org)                           | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Subscriptions & Notifications**                             |
| Manage own subscriptions                                      | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cancel any user's subscriptions                               | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Sensitive Data Access**                                     |
| View sensitive entrance coordinates                           | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modify sensitive entrance coordinates                         | ❌ | ❌ | ❌ | ❌ | ✅ |
| Remove sensitive flag                                         | ❌ | ❌ | ❌ | ❌ | ✅ |
| **User Management**                                           |
| View user lists                                               | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage user roles                                             | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete user accounts                                          | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System Operations**                                         |
| Import data from CSV                                          | ❌ | ❌ | ❌ | ❌ | ✅ |
| Download full database export                                 | ❌ | ❌ | ✅ | ❌ | ❌ |

## Special Permission Cases

### Sensitive Entrance Data
- **Coordinates**: Only Moderators and Administrators can view coordinates of sensitive entrances
- **Locations**: Sensitive entrance location descriptions are hidden from non-privileged users
- **Modification**: Only Administrators can remove the sensitive flag or modify coordinates of sensitive entrances
- **Creation**: Any authenticated user can mark an entrance as sensitive, but coordinates are then hidden from their own
  view
- **Restriction**: Once marked as sensitive, only Administrators can unmark an entrance (remove the sensitive flag)

### Organization-Based Permissions
- **Membership Management**: Users can only manage their own organization memberships
- **Explored Cave Management**: Organization members can add/remove explored caves for organizations they belong to
- **Administrative Override**: Moderators and Administrators can manage any organization's explored caves and
  memberships

### Owner-Based Access Control
- **Content Ownership**: Users can modify any content except other's comments
- **Moderator Override**: Moderators and Administrators can modify any content regardless of ownership
- **Comment Updates**: Users can update their own comments; Moderators can update any comments

### Snapshot and History Access
- **Public History**: Available to all users for non-sensitive content
- **Sensitive History**: Historical data for sensitive entrances requires Administrator privileges

## Security Features

### JWT Token Authentication
- All authenticated endpoints require valid JWT tokens
- Tokens contain user ID and role memberships
- Tokens are validated by the `tokenAuth` policy

### Ownership-Based Access
- Users can modify their own content
- Moderators and Administrators can override ownership
- Organization members can manage their organization's explored caves

### Sensitive Data Protection
- Sensitive entrance coordinates are hidden from everyone except Administrators
- Only Administrators can modify sensitive entrance coordinates

### Soft Deletes
- Content is soft-deleted (marked as deleted, not removed)
- Only Moderators+ can restore deleted content
- Administrators can perform permanent deletions

## Architecture

### Three-Layer Permission Model

1. **Route Level** (`config/policies.js`)
- `false` - Blocked (default)
- `true` - Public access (no authentication required)
- `'tokenAuth'` - Requires valid JWT token

2. **Controller Level** (`RightService.hasGroup()`)
- Role-based permission checks
- Owner-based access control

3. **Business Logic Level**
- Resource-specific permissions
- Contextual access control

## Implementation Details

### Database Schema

```sql
-- User groups/roles
CREATE TABLE t_group (
  id smallserial PRIMARY KEY,
  name varchar(200) NOT NULL,
  comments varchar(1000)
);

-- User-to-group assignments
CREATE TABLE j_caver_group (
  id_caver int4 NOT NULL,
  id_group int2 NOT NULL,
  PRIMARY KEY (id_caver, id_group)
);
```

### Code Examples

#### Route-Level Policy
```javascript
// config/policies.js
module.exports.policies = {
  '*': false, // Deny all by default
  'v1/entrance/find': true, // Public access
  'v1/entrance/create': 'tokenAuth', // Requires authentication
};
```

#### Role-Based Permission Check
```javascript
// In controllers
const hasRight = RightService.hasGroup(
  req.token.groups,
  RightService.G.MODERATOR
);
if (!hasRight) {
  return res.forbidden('You are not authorized to perform this action.');
}
```

#### Owner-Based Access Control
```javascript
// Users can edit their own content, moderators can edit any content
if (req.token.id !== resource.author) {
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasModeratorRight) {
    return res.forbidden('You can only edit your own content.');
  }
}
```

#### Organization Membership Check
```javascript
// Check if user is member of organization for cave explorer management
const memberQuery = `
  SELECT 1 FROM j_grotto_caver
  WHERE id_caver = $1 AND id_grotto = $2
`;
const memberResult = await sails.sendNativeQuery(memberQuery, [
  req.token.id,
  organizationId,
]);
const isMember = memberResult.rows.length > 0;

if (!hasAdminRight && !hasModeratorRight && !isMember) {
  return res.forbidden('You are not authorized to manage cave explorers.');
}
```

#### Sensitive Data Access Control
```javascript
// Hide coordinates and locations for sensitive entrances
result.latitude = !isSensitive || meta?.hasCompleteViewRight === true
  ? parseFloat(source.latitude)
  : null;
result.longitude = !isSensitive || meta?.hasCompleteViewRight === true
  ? parseFloat(source.longitude)
  : null;
result.locations = !source.isSensitive || meta?.hasCompleteViewRight === true
  ? toList('locations', source, toSimpleLocation)
  : [];
```

## Adding New Permissions

### 1. Route-Level Permission
Add to `config/policies.js`:
```javascript
'v1/new-endpoint/action': 'tokenAuth',
```

### 2. Role-Based Permission
Add to controller:
```javascript
const hasRight = RightService.hasGroup(
  req.token.groups,
  RightService.G.REQUIRED_ROLE
);
```

### 3. New Role
1. Add to `t_group` table
2. Update `RightService.G` constants
3. Add permission checks in relevant controllers

### 4. Organization-Based Permission
Add membership check:
```javascript
const isMember = await checkOrganizationMembership(req.token.id, organizationId);
if (!hasAdminRight && !isMember) {
  return res.forbidden('You must be a member of this organization.');
}
```

### 5. Sensitive Data Permission
Add sensitive data check:
```javascript
const hasCompleteViewRight = RightService.hasGroup(
  req.token.groups,
  RightService.G.ADMINISTRATOR
);
// Use hasCompleteViewRight in converters to show/hide sensitive data
```
