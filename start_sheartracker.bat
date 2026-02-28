@echo off
setlocal

cd /d "%~dp0"

echo Starting Shear Tracker proxy on http://localhost:5000 ...
start "ShearTracker Proxy" cmd /k py proxy.py

echo Starting Shear Tracker web server on http://localhost:8080 ...
start "ShearTracker Web" cmd /k py -m http.server 8080

echo Done.
echo Open: http://localhost:8080/
pause