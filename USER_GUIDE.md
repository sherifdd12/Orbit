# Orbit ERP User Guide

Welcome to Orbit ERP. This guide will help you get started with the system, manage users, and understand permissions.

## 1. Getting Started

### Accessing the System
- **Login**: Use your registered email and password at the `/login` page.
- **Support**: If you forgot your password, please contact your system administrator to reset it via the Supabase Dashboard.

## 2. User Roles & Permissions

Orbit ERP uses a Role-Based Access Control (RBAC) system. Each user is assigned one of the following roles:

| Role | Description |
| :--- | :--- |
| **Admin** | Full access to all modules, including user management and system settings. |
| **Manager** | Can view and edit Inventory, Projects, and Tasks. Limited access to Finance. |
| **Accountant** | Full access to Finance and Reports. Can view Inventory and Projects. |
| **Employee** | Can view/edit assigned Tasks and view Inventory. |

### How to Change User Roles
Currently, roles can be managed directly in the `profiles` table within the Supabase Dashboard. 
1. Go to the **Supabase Dashboard** -> **Table Editor**.
2. Select the `profiles` table.
3. Locate the user and update the `role` column to one of: `Admin`, `Manager`, `Accountant`, `Employee`.

## 3. Core Modules

### Inventory
- **Add Item**: Click "Add New Item" to record new stock.
- **Stock Tracking**: The system tracks SKU, Category, and Quantity.
- **Stock Alerts**: Items with stock quantity below 5 will trigger an alert on the Dashboard.

### Project Management
- **Create Project**: Start a new project with a client name and budget.
- **Status Tracking**: Update project status from Planning to Active or Completed.

### Finance
- **Transactions**: Record both Income and Expenses.
- **Balanced View**: See your net balance and monthly totals on the Finance dashboard.

### Tasks
- **Checklist**: Track specific actions needed for projects or office operations.
- **Toggle Completion**: Click the circle icon to mark a task as done.

## 4. Admin Setup (First Time)
To promote yourself to Admin:
1. Sign up for an account via the `/login` page (redirects to signup if email not found).
2. Run the `promote_admin.sql` script in the Supabase **SQL Editor** to grant your email full privileges.

```sql
UPDATE public.profiles 
SET role = 'Admin' 
WHERE email = 'your-email@example.com';
```

---
*Orbit ERP - Powering your Digital Product.*
