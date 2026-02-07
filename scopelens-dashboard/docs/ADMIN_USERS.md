# Admin User Management

## Overview

The Users page in the Admin panel allows administrators to view, create, edit, and manage all platform users.

## Users Page (`/users`)

### User List

Displays all users with:

| Column | Description |
|--------|-------------|
| Name | User's full name |
| Email | Account email |
| Role | user/reseller/admin |
| Plan | Subscription plan |
| Status | active/suspended |
| Created | Registration date |
| Actions | Edit/Delete buttons |

### Search & Filter

**Search by:**
- Name
- Email

**Filter by:**
- Role (All, User, Reseller, Admin)
- Status (All, Active, Suspended)
- Plan (All, Free, Pro, Enterprise)

## Add User

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| Name | Text | Full name |
| Email | Email | Account email |
| Role | Select | User role |
| Plan | Select | Subscription |
| Password | Password | Temporary password |

### API

```
POST /api/admin/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "planId": "plan_pro"
}
```

## Edit User

### Editable Fields

- Name
- Email
- Role
- Plan
- Status

### API

```
PATCH /api/admin/users/{id}
{
  "name": "John Smith",
  "role": "admin"
}
```

## User Actions

### Suspend User

Disables account access without deletion:

```
POST /api/admin/users/{id}/suspend
```

### Reactivate User

Re-enables a suspended account:

```
POST /api/admin/users/{id}/reactivate
```

### Delete User

Permanently removes user and data:

```
DELETE /api/admin/users/{id}
```

### Reset Password

Sends password reset email:

```
POST /api/admin/users/{id}/reset-password
```

### Impersonate

Login as user for support:

```
POST /api/admin/users/{id}/impersonate
```

## Bulk Actions

Select multiple users for:

- Bulk suspend
- Bulk delete
- Export to CSV
- Send bulk email

## User Details Modal

Click a user to view:

### Overview Tab

- Profile information
- Account statistics
- Login history

### Subscription Tab

- Current plan
- Billing history
- Usage stats

### Activity Tab

- Recent actions
- File uploads
- Scan history
