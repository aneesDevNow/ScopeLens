# User Dashboard

## Overview

The main dashboard provides users with an overview of their account, recent scans, and quick access to all features.

## Dashboard Home (`/`)

### Stats Cards

The dashboard displays key metrics:

| Stat | Description |
|------|-------------|
| Total Scans | Number of scans performed |
| Files Uploaded | Total files in storage |
| Reports Generated | PDF reports created |
| Plan Usage | Scans used vs. limit |

### Recent Activity

Shows the latest:
- Uploaded files
- Completed scans
- Generated reports

### Quick Actions

- **New Scan**: Start a new file scan
- **Upload Files**: Open upload hub
- **View Reports**: Browse all reports

## Navigation

### Sidebar Menu

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview and stats |
| `/files` | Files | File management |
| `/reports` | Reports | Scan reports |
| `/plans` | Plans | Subscription options |
| `/settings` | Settings | Account settings |
| `/payment` | Payment | Payment methods |

## Files Page (`/files`)

### Features

- **File List**: All uploaded files with metadata
- **Search**: Filter files by name
- **Sort**: Sort by date, name, or size
- **Actions**: View, download, delete files
- **File Details Modal**: Detailed file information

### File Status

| Status | Badge Color | Description |
|--------|-------------|-------------|
| Uploaded | Blue | File uploaded, not scanned |
| Scanning | Yellow | Scan in progress |
| Complete | Green | Scan finished |
| Failed | Red | Scan encountered error |

## Reports Page (`/reports`)

### Report Types

- **Scan Report**: Individual file analysis
- **Summary Report**: Multiple file overview
- **PDF Export**: Downloadable PDF format

### Report Actions

- View detailed results
- Download as PDF
- Share via link
- Delete report

## Plans Page (`/plans`)

Displays available subscription plans:

| Plan | Price | Scans/Month | Features |
|------|-------|-------------|----------|
| Free | $0 | 10 | Basic scanning |
| Pro | $19 | 100 | Priority support |
| Enterprise | $99 | Unlimited | Custom features |

## Settings Page (`/settings`)

### Sections

- **Profile**: Name, email, avatar
- **Security**: Password, 2FA
- **Notifications**: Email preferences
- **API Keys**: Developer access

## Payment Page (`/payment`)

### Features

- **Saved Cards**: Manage payment methods
- **Billing History**: Past invoices
- **Current Plan**: Subscription details
- **Upgrade/Downgrade**: Plan changes

## Responsive Design

The dashboard is fully responsive:

- **Desktop**: Full sidebar navigation
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation bar
