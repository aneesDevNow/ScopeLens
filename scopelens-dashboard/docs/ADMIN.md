# Admin Panel

## Overview

The Admin Panel provides full administrative control over the ScopeLens platform, including user management, plan configuration, and system monitoring.

**URL**: `http://localhost:3002`

## Dashboard (`/`)

### Overview Stats

| Stat | Description |
|------|-------------|
| Total Users | All registered users |
| Active Subscriptions | Paid subscriptions |
| Revenue (MTD) | Month-to-date revenue |
| New Users (7d) | Recent signups |

### Quick Actions

- View all users
- Manage plans
- Check system status
- View support tickets

## Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Admin overview |
| `/users` | Users | User management |
| `/plans` | Plans | Subscription plans |
| `/resellers` | Resellers | Reseller accounts |
| `/licenses` | Licenses | License management |
| `/analytics` | Analytics | Usage analytics |
| `/support` | Support | Support tickets |
| `/system` | System | System settings |

## Users Page (`/users`)

### Features

- **User List**: All platform users
- **Search**: Find by name/email
- **Add User**: Create admin users
- **Actions**: Edit, suspend, delete

### User Actions

| Action | Description |
|--------|-------------|
| Edit | Modify user details |
| Impersonate | Login as user |
| Suspend | Disable account |
| Delete | Remove user |

## Plans Page (`/plans`)

### Plan Management

- Create new plans
- Edit existing plans
- Set pricing and limits
- Enable/disable plans

### Plan Fields

| Field | Description |
|-------|-------------|
| Name | Plan display name |
| Price | Monthly cost (USD) |
| Scan Limit | Scans per month |
| Features | Feature list |
| Status | Active/Inactive |

## Resellers Page (`/resellers`)

### Reseller Management

- View all resellers
- Approve new resellers
- Adjust credit balance
- View client counts

## Analytics Page (`/analytics`)

### Metrics

- User signups over time
- Revenue trends
- Popular plans
- Geographic distribution

### Charts

- Line chart: Signups
- Bar chart: Revenue
- Pie chart: Plan distribution
- Map: User locations

## Support Page (`/support`)

### Ticket Management

- View all tickets
- Assign to team
- Update status
- Reply to users

### Ticket Status

| Status | Color | Meaning |
|--------|-------|---------|
| Open | Blue | New ticket |
| In Progress | Yellow | Being handled |
| Resolved | Green | Issue fixed |
| Closed | Gray | Archived |

## System Page (`/system`)

### Settings

- Platform name
- Default currency
- Email templates
- API configuration

### Health Checks

- Database status
- Storage status
- API status
- Background jobs

## API Endpoints

All admin APIs require admin authentication:

```
GET /api/admin/users
GET /api/admin/plans
GET /api/admin/analytics
GET /api/admin/resellers
```
