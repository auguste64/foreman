from playwright.sync_api import sync_playwright

def try_login(email, password):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type in ['error', 'warning'] else None)

        page.goto("http://localhost:3000/login", wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(1000)

        # Fill in credentials
        page.fill('input[type="email"]', email)
        page.fill('input[type="password"]', password)

        # Click login
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)

        current_url = page.url
        title = page.title()

        page.screenshot(path="/Users/auguste/foreman/audit-screenshots/06_after_login.png", full_page=False)
        browser.close()

        return current_url, title, console_errors[:5]

# Try common test credentials
url, title, errors = try_login("test@test.com", "password123")
print(f"URL after login: {url}")
print(f"Title: {title}")
print(f"Errors: {errors}")
