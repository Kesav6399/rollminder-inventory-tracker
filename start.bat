@echo off
echo Starting RollMinder...
echo.
echo Starting Backend (port 5000)...
start "Backend" cmd /k "cd backend && node src/server.js"
timeout /t 3 /nobreak >nul
echo Starting Frontend (port 3000)...
start "Frontend" cmd /k "cd frontend && npm start"
echo.
echo RollMinder is starting!
echo Open http://localhost:3000 in your browser
echo Login: admin@rollminder.com / admin123
pause