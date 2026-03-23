from playwright.sync_api import sync_playwright
import json

def capture(url, output_path, viewport_width=1280, viewport_height=800):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type in ['error', 'warning'] else None)
        page.goto(url, wait_until='networkidle', timeout=30000)
        page.screenshot(path=output_path, full_page=False)
        browser.close()
        return console_errors

# Landing page desktop
errors = capture("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/01_landing_desktop.png", 1280, 800)
print("Landing desktop done")
print("Console errors:", errors[:5])

# Landing page mobile 375
errors = capture("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/02_landing_mobile_375.png", 375, 812)
print("Landing mobile 375 done")

# Landing page mobile 390
errors = capture("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/03_landing_mobile_390.png", 390, 844)
print("Landing mobile 390 done")

# Login page desktop
errors = capture("http://localhost:3000/login", "/Users/auguste/foreman/audit-screenshots/04_login_desktop.png", 1280, 800)
print("Login desktop done")

# Login page mobile
errors = capture("http://localhost:3000/login", "/Users/Auguste/foreman/audit-screenshots/05_login_mobile.png", 375, 812)
print("Login mobile done")
