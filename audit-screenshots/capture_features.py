from playwright.sync_api import sync_playwright

def capture_scroll(url, output_path, viewport_width=1280, viewport_height=800, scroll_y=0):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
        page.goto(url, wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(2000)
        if scroll_y > 0:
            page.evaluate(f"document.querySelector('.lp-wrapper')?.scrollTo(0, {scroll_y}) || window.scrollTo(0, {scroll_y})")
            page.wait_for_timeout(1000)
        page.screenshot(path=output_path, full_page=False)
        browser.close()

# Features section
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/20_features_desktop.png", 1280, 800, 2500)
print("Features desktop done")

# CTA section
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/21_cta_section_desktop.png", 1280, 800, 4000)
print("CTA section done")

# Footer
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/22_footer_desktop.png", 1280, 800, 5000)
print("Footer done")

# Mobile features
capture_scroll("http://localhost:3000", "/Users/auguste/foreman/audit-screenshots/23_features_mobile.png", 375, 812, 2000)
print("Features mobile done")
