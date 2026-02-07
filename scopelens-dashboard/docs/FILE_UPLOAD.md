# File Upload System

## Overview

The Upload Hub allows users to upload files for scanning and analysis. It supports drag-and-drop, multiple file selection, and provides real-time upload progress.

## Features

- **Drag & Drop**: Drop files directly into the upload zone
- **Multiple Files**: Upload multiple files simultaneously
- **Progress Tracking**: Real-time upload progress indicators
- **File Validation**: Type and size validation before upload
- **Scan Integration**: Automatic scan initiation after upload

## Supported File Types

| Category | Extensions |
|----------|------------|
| Documents | `.pdf`, `.doc`, `.docx`, `.txt` |
| Images | `.jpg`, `.jpeg`, `.png`, `.gif` |
| Archives | `.zip`, `.rar`, `.7z` |

## File Size Limits

| Plan | Max File Size | Max Files/Upload |
|------|---------------|------------------|
| Free | 10 MB | 5 |
| Pro | 50 MB | 20 |
| Enterprise | 100 MB | Unlimited |

## Usage

### Upload Component

```tsx
import { UploadHub } from '@/components/UploadHub';

<UploadHub 
  onUploadComplete={(files) => console.log('Uploaded:', files)}
  maxFiles={10}
  maxSize={50 * 1024 * 1024} // 50MB
/>
```

### API Endpoint

```
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "files": [
    {
      "id": "file_123",
      "name": "document.pdf",
      "size": 1024000,
      "status": "uploaded",
      "scanId": "scan_456"
    }
  ]
}
```

## Upload Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Select     │───►│   Upload    │───►│   Scan      │
│  Files      │    │   to Server │    │   Initiate  │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Supabase  │
                   │   Storage   │
                   └─────────────┘
```

## File History

The Files page (`/files`) displays all uploaded files with:

- File name and type
- Upload date
- Scan status
- Actions (view, download, delete)

## Storage

Files are stored in Supabase Storage buckets:

| Bucket | Purpose |
|--------|---------|
| `uploads` | User uploaded files |
| `scans` | Processed scan results |
| `reports` | Generated PDF reports |

## Error Handling

| Error | Message | Resolution |
|-------|---------|------------|
| File too large | "File exceeds size limit" | Reduce file size or upgrade plan |
| Invalid type | "File type not supported" | Use supported file format |
| Upload failed | "Upload failed, please retry" | Check connection and retry |
| Quota exceeded | "Storage quota exceeded" | Delete old files or upgrade |
