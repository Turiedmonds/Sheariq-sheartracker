@echo off
setlocal

cd /d "%~dp0"

echo Starting Shear Tracker proxy on http://localhost:5000 ...
start "ShearTracker Proxy" /min cmd /c py proxy.py

echo Starting Shear Tracker web server on http://localhost:8080 ...
start "ShearTracker Web" /min cmd /c py -m http.server 8080

REM Give services a brief moment to bind, then open the app.
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/index.html"

echo Shear Tracker started.
