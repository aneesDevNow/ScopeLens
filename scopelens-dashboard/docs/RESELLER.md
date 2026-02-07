# Reseller System

## Overview

The Reseller Portal enables distributors to purchase credits in bulk and resell ScopeLens services to their clients with custom branding and pricing.

## Credit-Based Model

Resellers operate on a credit system:

| Action | Credits |
|--------|---------|
| Purchase credits | +Credits to balance |
| Client subscription | -Credits from balance |
| Bonus credits | +Bonus on bulk purchase |

## Credit Packages

| Amount | Bonus | Total Credits |
|--------|-------|---------------|
| $50 | +$0 | 50 |
| $100 | +$5 | 105 |
| $250 | +$20 | 270 |
| $500 | +$50 | 550 |
| $1000 | +$150 | 1150 |

## Reseller Dashboard (`/reseller`)

### Overview Stats

- **Credit Balance**: Current available credits
- **Active Clients**: Number of managed clients
- **Monthly Revenue**: Credits distributed
- **Growth Chart**: Trend visualization

### Quick Actions

- Add new client
- Purchase credits
- Generate license

## Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/reseller` | Dashboard | Overview and stats |
| `/reseller/clients` | Clients | Client management |
| `/reseller/billing` | Billing | Credit purchases |
| `/reseller/reports` | Reports | Revenue reports |
| `/reseller/settings` | Settings | Account settings |
| `/reseller/payment` | Payment | Payment methods |
| `/reseller/checkout` | Checkout | Purchase credits |

## Client Management

See [Reseller Clients](./RESELLER_CLIENTS.md) for details.

## Purchasing Credits

### Checkout Page (`/reseller/checkout`)

1. Select credit package or enter custom amount
2. View bonus credits (if applicable)
3. Enter payment details
4. Confirm purchase

### Currency Support

- USD and PKR supported
- Automatic conversion for Pakistani resellers
- Manual toggle available

## API Endpoints

### Get Profile

```
GET /api/reseller/profile

Response:
{
  "profile": {
    "id": "res_123",
    "credit_balance": 500,
    "company_name": "Acme Corp"
  }
}
```

### Purchase Credits

```
POST /api/reseller/credits/purchase
{
  "amount": 250
}

Response:
{
  "success": true,
  "credits_added": 270,
  "new_balance": 770
}
```

### List Clients

```
GET /api/reseller/clients

Response:
{
  "clients": [
    {
      "id": "client_123",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "plan": "Pro"
    }
  ]
}
```

## Reporting

### Revenue Reports

- Monthly credit distribution
- Client activity
- Growth trends
- Export to CSV

### Client Reports

- Individual client usage
- Subscription status
- Renewal dates

## Settings

### Account

- Company name
- Contact email
- Logo upload

### Branding

- Custom domain (Enterprise)
- White-label options
- Color scheme
