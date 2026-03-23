from playwright.sync_api import sync_playwright
import json

def full_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- Try to login and get session ---
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        all_console_errors = {}
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type in ['error', 'warning'] else None)

        page.goto("http://localhost:3000/login", wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(1000)

        # Try credentials
        credentials = [
            ("auguste@thebuilder.io", "password123"),
            ("admin@foreman.com", "admin123"),
            ("test@foreman.com", "test123"),
            ("demo@foreman.com", "demo123"),
        ]

        logged_in = False
        for email, pwd in credentials:
            page.fill('input[type="email"]', email)
            page.fill('input[type="password"]', pwd)
            page.click('button[type="submit"]')
            page.wait_for_timeout(2000)
            if "/dashboard" in page.url:
                logged_in = True
                print(f"Logged in with: {email}")
                break
            # Go back to login
            page.goto("http://localhost:3000/login", wait_until='domcontentloaded', timeout=30000)
            page.wait_for_timeout(500)

        if not logged_in:
            print("Could not login with test credentials")
            # Try to access dashboard directly to see what happens
            page.goto("http://localhost:3000/dashboard", wait_until='domcontentloaded', timeout=30000)
            page.wait_for_timeout(2000)
            print(f"Dashboard URL (unauthenticated): {page.url}")
            page.screenshot(path="/Users/auguste/foreman/audit-screenshots/07_dashboard_unauth.png")

        browser.close()

full_audit()
