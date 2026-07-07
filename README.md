# Toni's Cleaning Services — Invoicing & Scheduling

A simple, mobile-friendly web app for **Toni Goucher** to create professional
PDF invoices and manage her weekly cleaning schedule.

## Features

### 🧾 Invoicing
- Auto-fills the business name, address, and phone number
- Invoice numbers start at **2026-118** (editable)
- Easy inputs for **date, client, services, and price** (add/remove line items)
- **No tax field** — total is the sum of services
- **Save PDF to phone** or **Share / Email** the PDF directly (uses your phone's
  share sheet; falls back to download + mail app on desktop)
- Modern, branded PDF with the "Thank you for your business!" note and a
  highlighted **"Please make all checks payable to Toni Goucher"** reminder

### 📅 Weekly Schedule
- Add and remove clients on any day of the week
- Each appointment holds time, price, and a service note
- Live **projected weekly earnings** total and job count
- Navigate between weeks (Prev / Next / Today)
- Saved locally on the device (browser storage) — no account needed

## Business details
- **Owner:** Toni Goucher
- **Address:** 1101 E 267th St, Cleveland, MO 64734
- **Phone:** (816) 406-8630

## Running locally
It's a static site — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server
```

## Deployment
Deployed automatically to **GitHub Pages** via `.github/workflows/pages.yml`.

## Tech
Plain HTML/CSS/JS. PDF generation uses [jsPDF](https://github.com/parallax/jsPDF)
(vendored in `vendor/` for offline reliability). No build step, no dependencies
to install.
