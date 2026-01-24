# Orbit ERP - Integration Guide

This document outlines the technical strategy for implementing the Email (IMAP/SMTP) and Document Management (OneDrive) modules.

## 1. Webmail Interface (IMAP/SMTP)

To connect existing business emails (cPanel, Verio, etc.) directly to Orbit, we use a hybrid approach with Next.js API routes.

### Dependencies
```bash
npm install imapflow nodemailer
```

### Architecture
1.  **Frontend:** A modern email UI built with Shadcn/ui (ScrollArea, Separator, etc.).
2.  **API Routes:**
    *   `src/app/api/email/fetch/route.ts`: Uses `imapflow` to establish a secure connection to the business IMAP server and stream message list/content.
    *   `src/app/api/email/send/route.ts`: Uses `nodemailer` to send emails via the business SMTP server.
3.  **Security:** User email credentials should be encrypted before storage in the database or passed via session-only state if not persisting.

---

## 2. Document Management (OneDrive Integration)

Using Microsoft Graph API allows Orbit to leverage OneDrive for file storage, keeping the ERP database lightweight.

### Setup
1.  **Azure Portal:** Register an application in Azure Active Directory (Microsoft Entra ID).
2.  **Permissions:** Grant `Files.ReadWrite.All` and `User.Read`.
3.  **Authentication:** Use `next-auth` with the Azure AD provider to handle OAuth tokens.

### Implementation
```typescript
import { Client } from "@microsoft/microsoft-graph-client";

// Initialize Graph Client with user's OAuth token
const client = Client.init({
  authProvider: (done) => {
    done(null, userAccessToken);
  },
});

// Upload a file to a project's folder
async function uploadToProjectFolder(projectId: string, fileName: string, content: Buffer) {
  return await client
    .api(`/me/drive/root:/OrbitERP/Projects/${projectId}/${fileName}:/content`)
    .put(content);
}
```

## 3. Deployment Checklist

*   **Environment Variables:**
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `AZURE_AD_CLIENT_ID`
    *   `AZURE_AD_CLIENT_SECRET`
*   **Edge Compatibility:** Ensure all heavy libraries (like `imap`) are called from standard Node.js environments if the edge runtime has limitations.
