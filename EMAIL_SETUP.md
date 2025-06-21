# Email Configuration Guide

## Problem
You're not receiving confirmation emails after booking seats because the email service is not properly configured.

## Solution

### Option 1: Configure Gmail (Recommended)

1. **Create a Gmail App Password:**
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Go to Security → App passwords
   - Generate a new app password for "Mail"

2. **Set Environment Variables:**
   Create a `.env` file in the `backend` folder with:
   ```
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

3. **Restart the backend server:**
   ```bash
   cd backend
   npm start
   ```

### Option 2: Use a Test Email Service

For testing purposes, you can use services like:
- **Mailtrap** (free for testing)
- **Ethereal Email** (fake SMTP for testing)

### Option 3: Disable Email (Seats Still Marked as Sold)

If you don't want to configure email right now:
- The seats will still be marked as sold in the database
- You'll see a message: "Payment processed successfully but email failed to send"
- The booking is still valid and seats are reserved

## Current Status
- ✅ Seats are being marked as sold correctly
- ✅ Database is working properly
- ❌ Email service needs configuration

## Testing
After configuring email, test by:
1. Making a booking
2. Check console logs for "Email sent successfully"
3. Check your email inbox for confirmation

## Troubleshooting
- If you see "Email server connection failed", check your credentials
- If you see "Email transporter not available", the .env file is not being read
- Make sure to restart the server after changing .env file 