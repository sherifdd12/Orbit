# Orbit ERP - Enterprise Resource Planning System

A comprehensive, bilingual (English/Arabic) ERP system for trading, contrasting, and service providers. Built with Next.js, Supabase, and Tailwind CSS.

## Features

### 📦 Inventory & Warehousing
- Multi-warehouse support
- Real-time stock tracking
- **Stock Movements**: Goods Receipt, Goods Issue, Transfers, Adjustments
- Printable vouchers for all movements
- Low stock alerts

### 💰 Sales & CRM
- Customer Management
- Sales Orders & Quotations
- Invoicing & Payments
- Customizable Document Templates (Invoices, Quotes, etc.)

### 🛒 Purchasing
- Vendor Management
- Purchase Orders
- Bill Processing
- Goods Receipt integration

### 📊 Reports & Analytics
- Business Overview Dashboard
- Financial Reports (Revenue, Expenses, Profit)
- Inventory Reports
- Export to PDF/Excel

### 🛠️ Administration
- Document Template Customization (Drag & drop branding)
- User & Role Management
- System Settings

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **Internationalization**: Full RTL support (Arabic/English)

## Deployment
Deploy easily on Vercel or any Node.js hosting.
