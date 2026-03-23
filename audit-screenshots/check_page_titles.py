from playwright.sync_api import sync_playwright

def check_page(url, output_prefix, check_login_redirect=True):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Desktop
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        errors = []
        page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == 'error' else None)
        page.goto(url, wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(1500)
        final_url = page.url
        title = page.title()
        page.screenshot(path=f"/Users/auguste/foreman/audit-screenshots/{output_prefix}_desktop.png")

        # Mobile
        page2 = browser.new_page(viewport={'width': 375, 'height': 812})
        page2.goto(url, wait_until='domcontentloaded', timeout=30000)
        page2.wait_for_timeout(1500)
        page2.screenshot(path=f"/Users/auguste/foreman/audit-screenshots/{output_prefix}_mobile.png")

        browser.close()
        return final_url, title, errors

# Public pages
url, title, errs = check_page("http://localhost:3000/cgu", "14_cgu")
print(f"CGU: {url} | {title} | errors: {len(errs)}")

url, title, errs = check_page("http://localhost:3000/confidentialite", "15_confidentialite")
print(f"Confidentialite: {url} | {title} | errors: {len(errs)}")

url, title, errs = check_page("http://localhost:3000/mentions-legales", "16_mentions")
print(f"Mentions: {url} | {title} | errors: {len(errs)}")

# Check page source for meta tags
url, title, errs = check_page("http://localhost:3000", "17_landing_check")
print(f"Landing: {url} | {title} | errors: {len(errs)}")
