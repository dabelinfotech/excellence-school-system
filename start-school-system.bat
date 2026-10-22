@echo off
title Excellence British Schools Management System (Port 4000)
cd /d "%~dp0"
echo ======================================================================
echo   EXCELLENCE BRITISH SCHOOLS MANAGEMENT SYSTEM
echo   UK Standard Academic Platform & Dual-Wing Portal Hub
echo ======================================================================
echo   Main Portal:           http://localhost:4000
echo   Elementary Wing:       http://localhost:4000/primary  (Excellence Elementary School)
echo   College Wing:          http://localhost:4000/secondary (Excellence College)
echo   Result Checker:        http://localhost:4000/result-checker
echo   CBT Examination:       http://localhost:4000/cbt
echo   Fee Receipt Upload:    http://localhost:4000/payment-receipt
echo   Academic Newsletters:  http://localhost:4000/newsletter
echo   Upcoming Events:       http://localhost:4000/events
echo   Admin Dashboard:       http://localhost:4000/admin (admin / admin123)
echo ======================================================================
echo   Demo Elementary Pupil: NPS/2024/001 ^| PIN: EXCEL001 (David Adeleke)
echo   Demo College Scholar:  SEC/2024/001 ^| PIN: SEC0001 (Emeka Okafor)
echo ======================================================================
echo.
"%LOCALAPPDATA%\Programs\nodejs\node.exe" server.js
if %ERRORLEVEL% NEQ 0 (
  node server.js
)
pause
