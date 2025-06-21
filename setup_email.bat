@echo off
echo Creating .env file for email configuration...
echo.

cd backend

echo EMAIL_USER=somanadhsaiaddepalli13@gmail.com > .env
echo EMAIL_PASS=your-16-digit-app-password-here >> .env
echo DB_HOST=localhost >> .env
echo DB_USER=root >> .env
echo DB_PASSWORD= >> .env
echo DB_NAME=movie-ticket-booking >> .env
echo PORT=5000 >> .env

echo.
echo .env file created successfully!
echo.
echo IMPORTANT: You need to edit the .env file and replace:
echo "your-16-digit-app-password-here" with your actual Gmail app password
echo.
echo To get your Gmail app password:
echo 1. Go to https://myaccount.google.com/
echo 2. Enable 2-Factor Authentication
echo 3. Go to Security ^> App passwords
echo 4. Generate a new app password for "Mail"
echo.
echo After editing the .env file, restart the backend server:
echo npm start
echo.
pause 