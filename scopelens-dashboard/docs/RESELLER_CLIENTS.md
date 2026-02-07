# Reseller Client Management

## Overview

Resellers manage their end-clients through the Clients page, handling subscriptions, license keys, and support.

## Clients Page (`/reseller/clients`)

### Features

- **Client List**: All managed clients
- **Search**: Filter by name or email
- **Add Client**: Create new client accounts
- **Client Details**: View/edit client info

### Client Status

| Status | Badge | Description |
|--------|-------|-------------|
| Active | Green | Subscription active |
| Pending | Yellow | Awaiting activation |
| Expired | Red | Subscription ended |
| Suspended | Gray | Account suspended |

## Adding Clients

### Steps

1. Click "Add Client" button
2. Enter client details:
   - Name
   - Email
   - Plan selection
3. Allocate credits from balance
4. Generate license key
5. Client receives activation email

### API

```
POST /api/reseller/clients
{
  "name": "John Doe",
  "email": "john@example.com",
  "planId": "plan_pro"
}

Response:
{
  "success": true,
  "client": {
    "id": "client_123",
    "licenseKey": "XXXX-XXXX-XXXX-XXXX"
  }
}
```

## Client Details Modal

Click a client row to open details:

### Information Tab

- Client name and email
- Company name
- Account created date
- Last login

### Subscription Tab

- Current plan
- Start date
- Expiry date
- Renewal status

### Actions Tab

- Extend subscription
- Change plan
- Suspend account
- Delete client

## License Keys

### Generation

```
POST /api/reseller/licenses/generate
{
  "clientId": "client_123",
  "duration": 30 // days
}

Response:
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "expiresAt": "2026-03-01T00:00:00Z"
}
```

### Copy to Clipboard

License keys can be copied with one click for easy sharing.

## Bulk Actions

Select multiple clients for:
- Bulk email
- Bulk subscription extension
- Export to CSV

## Client Search

### Filters

| Filter | Options |
|--------|---------|
| Status | All, Active, Pending, Expired |
| Plan | All, Free, Pro, Enterprise |
| Date | This month, Last 30 days, Custom |

### Search Fields

- Client name
- Email address
- Company name
- License key

## Notifications

Automatic emails sent to clients:
- Welcome email (on creation)
- Subscription expiring (7 days before)
- Subscription expired
- Renewal confirmation
