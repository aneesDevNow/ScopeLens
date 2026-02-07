# Reports System

## Overview

The Reports system generates detailed scan analysis in viewable and downloadable PDF format.

## Report Types

### Scan Report
Individual file analysis with:
- File metadata
- Scan results
- Threat detection
- Recommendations

### Summary Report
Multiple file overview:
- Batch scan results
- Statistics
- Aggregated findings

## Reports Page (`/reports`)

### Features

| Feature | Description |
|---------|-------------|
| Report List | All generated reports |
| Search | Filter by name/date |
| Sort | Order by date, name |
| Actions | View, download, delete |

### Report Status

| Status | Color | Meaning |
|--------|-------|---------|
| Ready | Green | Available for viewing |
| Generating | Yellow | Processing in progress |
| Failed | Red | Generation failed |

## Viewing Reports

Click any report to open the detail view:

- Full scan results
- Detailed findings
- File information
- Action recommendations

## PDF Generation

### Generate PDF

```tsx
// Trigger PDF generation
const generatePDF = async (scanId: string) => {
  const res = await fetch(`/api/report/${scanId}/pdf`, {
    method: 'POST'
  });
  
  const { reportUrl } = await res.json();
  window.open(reportUrl);
};
```

### PDF Contents

1. **Header**: Logo, report title, date
2. **Summary**: Quick overview
3. **Details**: Full scan results
4. **Recommendations**: Action items
5. **Footer**: Page numbers, timestamp

## API Endpoints

### List Reports

```
GET /api/reports

Response:
{
  "reports": [
    {
      "id": "rpt_123",
      "name": "Scan Report - document.pdf",
      "createdAt": "2026-02-01T10:00:00Z",
      "status": "ready",
      "fileId": "file_456"
    }
  ]
}
```

### Get Report

```
GET /api/report/{id}

Response:
{
  "id": "rpt_123",
  "scanResults": { ... },
  "metadata": { ... }
}
```

### Generate PDF

```
POST /api/report/{id}/pdf

Response:
{
  "pdfUrl": "https://storage.../report.pdf"
}
```

## Report Sharing

Reports can be shared via:
- Direct link (time-limited)
- Email export
- Download PDF

## Storage

Reports are stored in Supabase Storage:
- Bucket: `reports`
- Retention: 90 days (configurable)
