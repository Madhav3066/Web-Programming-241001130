# Attendance Pro - Employee Attendance Tracker

A front-end web project (HTML, CSS, JavaScript) with login, role-based screens,
a dashboard, daily attendance, monthly reports and team management.

## Files
- index.html - page structure (login screen + app shell)
- style.css  - all styling, light/dark theme, responsive layout
- script.js  - login, roles, attendance logic, charts, localStorage storage

## How to run
Open index.html in any modern browser. No server or install needed
(the Google Fonts link needs internet; the app falls back to system fonts offline).

## Demo accounts
- Manager:  admin / admin123
- Employee: priya / priya123  (also marcus, aiko, diego with <name>123)

## Features
- Login with SHA-256 hashed passwords, sign out, remembered session
- Manager: dashboard (stats, donut, 7-day chart, who's in), attendance table with
  search + date picker, monthly report (copy as CSV), add/remove employees
- Employee: check in / check out, live timer, monthly calendar and stats
- Late rule: arrival after 09:30 (change LATE in script.js)
- Dark mode toggle, responsive layout

## Notes
Data is stored in the browser's localStorage, so it is per-device. Login is
client-side only (for learning/demo). A production version needs a backend
(e.g. Node/Express or PHP + MySQL) for real authentication and shared data.
To reset the demo data, clear this site's localStorage.
