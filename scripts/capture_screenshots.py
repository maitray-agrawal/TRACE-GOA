"""Capture real application screenshots using Playwright at 1440x900 and 390x844."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = Path("docs/assets/screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

# Also save directly to artifact directory for immediate visual inspection
ARTIFACT_DIR = Path("C:/Users/agraw/.gemini/antigravity-ide/brain/f52e3df0-45a8-4670-aec7-2873c6099f8f")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:5173"

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ---------------------------------------------------------------------
        # DESKTOP VIEWPORT: 1440 x 900
        # ---------------------------------------------------------------------
        print("=== Capturing 1440x900 Desktop Views ===")
        context_desktop = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context_desktop.new_page()

        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 1. Hero 1440x900
        print("Capturing hero_1440x900.png...")
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)
        hero_el = page.locator("section").first
        await hero_el.screenshot(path=str(SCREENSHOTS_DIR / "hero_1440x900.png"))
        await hero_el.screenshot(path=str(ARTIFACT_DIR / "hero_1440x900.png"))
        await hero_el.screenshot(path=str(SCREENSHOTS_DIR / "01-hero.png"))

        # 2. Case Village 1440x900
        print("Capturing case_village_1440x900.png...")
        village_el = page.locator("#case-village-section")
        await village_el.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        await village_el.screenshot(path=str(SCREENSHOTS_DIR / "case_village_1440x900.png"))
        await village_el.screenshot(path=str(ARTIFACT_DIR / "case_village_1440x900.png"))
        await village_el.screenshot(path=str(SCREENSHOTS_DIR / "02-case-village.png"))

        # 3. Investigation View 1440x900
        print("Navigating to Investigation tab...")
        await page.click("button:has-text('TRACE')")
        await page.wait_for_timeout(1000)
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        print("Capturing investigation_1440x900.png...")
        await page.screenshot(path=str(SCREENSHOTS_DIR / "investigation_1440x900.png"))
        await page.screenshot(path=str(ARTIFACT_DIR / "investigation_1440x900.png"))
        await page.screenshot(path=str(SCREENSHOTS_DIR / "03-investigation-command-center.png"))

        # ---------------------------------------------------------------------
        # MOBILE VIEWPORT: 390 x 844
        # ---------------------------------------------------------------------
        print("=== Capturing 390x844 Mobile Views ===")
        context_mobile = await browser.new_context(viewport={"width": 390, "height": 844})
        mobile_page = await context_mobile.new_page()

        await mobile_page.goto(BASE_URL, wait_until="networkidle")
        await mobile_page.wait_for_timeout(2000)

        # 1. Hero 390x844
        print("Capturing hero_390x844.png...")
        await mobile_page.evaluate("window.scrollTo(0, 0)")
        await mobile_page.wait_for_timeout(500)
        mobile_hero = mobile_page.locator("section").first
        await mobile_hero.screenshot(path=str(SCREENSHOTS_DIR / "hero_390x844.png"))
        await mobile_hero.screenshot(path=str(ARTIFACT_DIR / "hero_390x844.png"))

        # 2. Case Village 390x844
        print("Capturing case_village_390x844.png...")
        mobile_village = mobile_page.locator("#case-village-section")
        await mobile_village.scroll_into_view_if_needed()
        await mobile_page.wait_for_timeout(500)
        await mobile_village.screenshot(path=str(SCREENSHOTS_DIR / "case_village_390x844.png"))
        await mobile_village.screenshot(path=str(ARTIFACT_DIR / "case_village_390x844.png"))

        # 3. Investigation View 390x844
        print("Navigating to mobile Investigation tab...")
        await mobile_page.click("button:has-text('TRACE')")
        await mobile_page.wait_for_timeout(1000)
        await mobile_page.evaluate("window.scrollTo(0, 0)")
        await mobile_page.wait_for_timeout(1000)
        print("Capturing investigation_390x844.png...")
        await mobile_page.screenshot(path=str(SCREENSHOTS_DIR / "investigation_390x844.png"))
        await mobile_page.screenshot(path=str(ARTIFACT_DIR / "investigation_390x844.png"))

        await browser.close()
        print("All Gate 1 screenshots successfully captured at 1440x900 and 390x844!")

if __name__ == "__main__":
    asyncio.run(capture())

