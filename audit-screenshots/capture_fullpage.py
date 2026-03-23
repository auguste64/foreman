from playwright.sync_api import sync_playwright

def capture_full(url, output_path, viewport_width=1280, viewport_height=800):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type in ['error', 'warning'] else None)
        page.goto(url, wait_until='networkidle', timeout=30000)
        page.screenshot(path=output_path, full_page=True)
        browser.close()
        return console_errors

# Landing full page desktop
errors = capture_full("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/01b_landing_desktop_full.png", 1280, 800)
print("Landing desktop full done, errors:", errors[:10])

# Landing full page mobile
errors = capture_full("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/02b_landing_mobile_full.png", 375, 812)
print("Landing mobile full done, errors:", errors[:10])

# Login full page
errors = capture_full("http://localhost:3000/login", "/Users/auguste/foreman/audit-screenshots/04b_login_desktop_full.png", 1280, 800)
print("Login desktop full done, errors:", errors[:10])

errors = capture_full("http://localhost:3000/login", "/Users/auguste/foreman/audit-screenshots/05b_login_mobile_full.png", 375, 812)
print("Login mobile full done, errors:", errors[:10])
