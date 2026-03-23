from playwright.sync_api import sync_playwright

def capture_scroll(url, output_path, viewport_width=1280, viewport_height=800, scroll_y=0):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
        page.goto(url, wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(2000)
        if scroll_y > 0:
            page.evaluate(f"document.querySelector('.lp-wrapper')?.scrollTo(0, {scroll_y}) || window.scrollTo(0, {scroll_y})")
            page.wait_for_timeout(500)
        page.screenshot(path=output_path, full_page=False)
        browser.close()

# Landing - hero (already taken)
# Landing - pricing section
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/08_landing_pricing_desktop.png", 1280, 800, 900)
print("Landing pricing desktop done")

capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/09_landing_pricing_mobile.png", 375, 812, 700)
print("Landing pricing mobile done")

# Landing - features section
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/10_landing_features_desktop.png", 1280, 800, 1800)
print("Landing features desktop done")

# Nav check at top
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/11_landing_nav_desktop.png", 1280, 800, 0)
print("Landing nav desktop done")

capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/12_landing_nav_mobile.png", 375, 812, 0)
print("Landing nav mobile done")

# Login page - mobile overflow check
capture_scroll("http://localhost:3000/login", "/Users/auguste/foreman/audit-screenshots/13_login_mobile_375.png", 375, 812, 0)
print("Login mobile done")
