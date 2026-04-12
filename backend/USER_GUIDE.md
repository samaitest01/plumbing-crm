# User Guide - Plumbing CRM

This guide will help you understand how to use the Plumbing CRM application effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Creating Invoices](#creating-invoices)
4. [Managing Customers](#managing-customers)
5. [Viewing Invoices](#viewing-invoices)
6. [Products Catalog](#products-catalog)
7. [Reports & Analytics](#reports-analytics)
8. [Tips & Best Practices](#tips-best-practices)

---

## Getting Started

### First Time Login

1. Navigate to the application URL
2. You'll be redirected to the login page
3. Click "Don't have an account? Register"
4. Fill in your details:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Minimum 6 characters
   - **Role**: Select your role (STAFF, PLUMBER, or ADMIN)
5. Click "Register"

### Subsequent Logins

1. Go to the login page
2. Enter your email and password
3. Click "Login"

**Note:** Your session will remain active for 7 days. After that, you'll need to log in again.

---

## Dashboard

The dashboard is your home screen showing key metrics and quick actions.

### Understanding the Stats

- **Today's Sales**: Total revenue generated today
- **Today's Invoices**: Number of invoices created today
- **Total Customers**: Total customers in the system
- **Pending Records**: Total amount in pending/balance status

### Quick Actions

Use the quick action buttons to:
- **Create Invoice**: Start a new invoice
- **View Invoices**: See all invoices
- **Customers**: Manage customer information
- **Products**: View product catalog

### Recent Invoices

The dashboard shows your 5 most recent invoices with:
- Invoice number
- Customer name
- Date
- Amount
- Payment status

---

## Creating Invoices

### Step 1: Select or Add Customer

**Option A: Select Existing Customer**
1. Use the "Select Customer" dropdown
2. Choose a customer from the list
3. Their details will auto-fill

**Option B: Add New Customer**
1. Enter customer name (letters only)
2. Enter 10-digit mobile number
3. The customer will be created automatically when you save the invoice

### Step 2: Add Products

1. **Select Product**: Choose from the dropdown
2. **Select Size**: Pick the size variant
3. **Enter Quantity**: How many units
4. **Discount %** (optional): Apply line-item discount
5. Click **"Add"** button

**To Edit an Item:**
- Click the ✏️ (edit) button
- Modify details
- Click "Update"

**To Delete an Item:**
- Click the ❌ (delete) button

### Step 3: Review Totals

The system automatically calculates:
- **Total Price (Gross)**: Sum of all base amounts
- **Total Discount**: Total discount applied
- **Final Amount (Taxable)**: Amount after discounts

### Step 4: Record Keeping (Mock Payment)

⚠️ **Important**: These fields are for record-keeping only. No actual payment is processed.

1. **Payment Status**:
   - **Pending**: Payment not yet recorded
   - **Recorded**: Payment has been recorded in books

2. **Payment Mode**: Cash, UPI, Card, or Other

3. **Amount Recorded** (if Pending):
   - Partial amount recorded
   - Leave 0 if nothing recorded yet

### Step 5: Save Invoice

1. Review all details
2. Click **"Save Invoice"**
3. Success! Invoice number will appear

### Step 6: Share Invoice

After saving:
- **PDF**: Download professional PDF invoice
- **Print**: Print directly from browser
- **WhatsApp**: From invoices list, share via WhatsApp

---

## Managing Customers

### Adding Customers

1. Go to Customers page
2. Enter customer name
3. Enter 10-digit mobile number
4. Click "Add Customer"

**Validation:**
- Name must contain only letters and spaces
- Mobile must be exactly 10 digits
- Mobile numbers must be unique

### Viewing Customer Details

1. In the customers list, click "View Details"
2. You'll see:
   - Customer information
   - Statistics (total invoices, billed, recorded, pending)
   - Complete invoice history

### Customer Statistics

- **Total Invoices**: Number of invoices
- **Total Billed**: Sum of all invoice amounts
- **Total Recorded**: Sum of recorded amounts
- **Total Pending**: Balance amounts

---

## Viewing Invoices

### Searching Invoices

Use the search box to find invoices by:
- Invoice number
- Customer name

### Filtering

**By Status:**
- All Status
- Recorded
- Pending

**By Date:**
- Newest First (default)
- Oldest First

### Invoice Actions

For each invoice:

1. **📄 PDF**: Download invoice as PDF
2. **💬 WhatsApp**: Send invoice link via WhatsApp
   - Pre-filled message with invoice details
   - Opens WhatsApp with customer's mobile number

---

## Products Catalog

### Viewing Products

Products are organized by system:
- **CPVC**: Chlorinated Polyvinyl Chloride
- **UPVC**: Unplasticized Polyvinyl Chloride
- **SWR**: Soil, Waste, and Rainwater

Each product shows:
- Product name
- Unit type
- Length (if applicable)
- Available sizes
- Price for each size

### Managing Products

To add, edit, or remove products:
1. Navigate to `backend/data/products.json`
2. Edit the JSON file
3. Restart the backend server
4. Products will update automatically

**JSON Structure:**
```json
{
  "system": "CPVC",
  "category": "Chlorinated Polyvinyl Chloride",
  "products": [
    {
      "id": "unique_id",
      "name": "Product Name",
      "unit": "length",
      "length_m": 3,
      "variants": [
        {
          "size_mm": 15,
          "price": 150.50
        }
      ]
    }
  ]
}
```

---

## Reports & Analytics

**Note:** Reports are only available to users with ADMIN role.

### Overview Tab

Shows high-level metrics:
- Total invoices
- Total revenue
- Recorded/Pending breakdown

### Sales Trends Tab

View sales over time:
- Daily: Last 30 days
- Weekly: Last 12 weeks
- Monthly: Last 12 months

Use the period selector to change the view.

### Top Customers Tab

See your best customers by revenue:
- Top 10 customers
- Total revenue per customer
- Number of invoices

### Top Products Tab

Identify best-selling products:
- Top 10 products by revenue
- Helps with inventory planning

---

## Tips & Best Practices

### For Daily Use

1. **Start Each Day on Dashboard**
   - Check today's sales at a glance
   - Review pending balances

2. **Create Customers First**
   - Add new customers before creating invoices
   - Easier than typing details each time

3. **Use Search Effectively**
   - Search invoices by customer name for quick access
   - Search by invoice number for specific invoices

4. **Regular PDF Downloads**
   - Download and backup important invoices
   - Keep digital records

### For Accuracy

1. **Double-Check Quantities**
   - Verify quantities before adding items
   - Use edit function to correct mistakes

2. **Verify Customer Mobile Numbers**
   - Ensure 10-digit mobile numbers are correct
   - Important for WhatsApp sharing

3. **Record Payment Status**
   - Update payment status promptly
   - Helps track pending balances

### For Efficiency

1. **Use Quick Actions**
   - Dashboard quick actions save navigation time
   - Learn keyboard shortcuts (if available)

2. **Batch Customer Entry**
   - Add multiple customers at once
   - Use customer management page

3. **Review Reports Weekly**
   - Identify trends early
   - Plan inventory based on top products

### Security Best Practices

1. **Keep Credentials Safe**
   - Don't share your password
   - Use a strong password

2. **Logout When Done**
   - Especially on shared computers
   - Use the logout button in navigation

3. **Regular Backups**
   - Admin should backup database regularly
   - Export important invoices as PDFs

### Troubleshooting

**Cannot Login:**
- Check email and password spelling
- Verify account was created
- Contact admin if account issues persist

**Invoice Not Saving:**
- Check all required fields are filled
- Verify customer mobile is 10 digits
- Ensure at least one item is added

**PDF Not Downloading:**
- Check browser pop-up blocker
- Try different browser
- Ensure backend server is running

**WhatsApp Not Working:**
- Verify customer mobile number
- Check WhatsApp is installed
- Ensure internet connection

---

## Mobile Usage

While the app is responsive, for best experience:

1. **Use Landscape Mode** for creating invoices
2. **Desktop is Recommended** for reports and analytics
3. **Mobile is Perfect** for:
   - Viewing invoices
   - Sharing via WhatsApp
   - Quick customer lookup

---

## Getting Help

If you encounter issues:

1. Check this user guide
2. Review error messages carefully
3. Try refreshing the page
4. Logout and login again
5. Contact your system administrator

---

## Keyboard Shortcuts

(If implemented in future versions)

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New invoice
- `Esc`: Close modals
- `Tab`: Navigate form fields

---

## Updates & New Features

This application is regularly updated. New features may include:
- Email invoice delivery
- Advanced reporting
- Inventory management
- Multi-language support
- Mobile app

Check with your administrator for the latest features available in your installation.
