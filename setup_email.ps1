Write-Host "Creating .env file for email configuration..." -ForegroundColor Green
Write-Host ""

Set-Location backend

@"
EMAIL_USER=somanadhsaiaddepalli13@gmail.com
EMAIL_PASS=your-16-digit-app-password-here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=movie-ticket-booking
PORT=5000
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ".env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You need to edit the .env file and replace:" -ForegroundColor Yellow
Write-Host '"your-16-digit-app-password-here" with your actual Gmail app password' -ForegroundColor Yellow
Write-Host ""
Write-Host "To get your Gmail app password:" -ForegroundColor Cyan
Write-Host "1. Go to https://myaccount.google.com/" -ForegroundColor White
Write-Host "2. Enable 2-Factor Authentication" -ForegroundColor White
Write-Host "3. Go to Security > App passwords" -ForegroundColor White
Write-Host "4. Generate a new app password for 'Mail'" -ForegroundColor White
Write-Host ""
Write-Host "After editing the .env file, restart the backend server:" -ForegroundColor Green
Write-Host "npm start" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue" 