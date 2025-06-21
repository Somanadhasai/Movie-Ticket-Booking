# Email Configuration for somanadhsaiaddepalli13@gmail.com

## Current Status
✅ Email address configured: `somanadhsaiaddepalli13@gmail.com`
❌ App password needed: You need to set your Gmail app password

## Setup Instructions

### Step 1: Create Gmail App Password
1. Go to your Google Account: https://myaccount.google.com/
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → App passwords
4. Select "Mail" and generate a 16-digit app password
5. Copy the 16-digit password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Create .env File
Create a file named `.env` in the `backend` folder with:
```
EMAIL_USER=somanadhsaiaddepalli13@gmail.com
EMAIL_PASS=your-16-digit-app-password-here
```

Replace `your-16-digit-app-password-here` with your actual 16-digit app password.

### Step 3: Restart Server
```bash
cd backend
npm start
```

## What's Already Configured
- ✅ Email address: `somanadhsaiaddepalli13@gmail.com`
- ✅ Email server connection
- ✅ All email templates
- ✅ Seat marking system

## What You Need to Do
- ❌ Add your Gmail app password to the .env file
- ❌ Restart the backend server

## Testing
After setup, test by:
1. Making a booking
2. Check console for "Email sent successfully"
3. Check your Gmail inbox for confirmation

## Troubleshooting
- If you see "Email server connection failed", check your app password
- Make sure the .env file is in the backend folder
- Restart the server after creating the .env file 