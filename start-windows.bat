@echo off
REM Double-click this file to open Thunai Care on Windows.
cd /d "%~dp0"
title Thunai Care

where node >nul 2>nul
if %errorlevel%==0 (
  node scripts\serve.js
) else (
  echo Node.js is not installed, so opening the single-file version instead.
  echo Everything still works. To install Node.js later: https://nodejs.org
  start "" "%~dp0thunai-care.html"
  timeout /t 5 >nul
)
