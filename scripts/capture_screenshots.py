"""Capture real application screenshots using Playwright."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = Path("docs/assets/screenshots")
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:5173"

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("Navigating to frontend...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # 1. Hero Section
        print("Capturing 01-hero.png...")
        hero_el = page.locator("section").first
        if await hero_el.count() > 0:
            await hero_el.screenshot(path=str(SCREENSHOTS_DIR / "01-hero.png"))
            await hero_el.screenshot(path=str(SCREENSHOTS_DIR / "01-command.png"))

        # 2. Case Village
        print("Capturing 02-case-village.png...")
        village_el = page.locator("#case-village-section")
        if await village_el.count() > 0:
            await village_el.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await village_el.screenshot(path=str(SCREENSHOTS_DIR / "02-case-village.png"))

        # 3. Investigation Command Center
        print("Navigating to Investigation tab...")
        await page.click("button:has-text('TRACE')")
        await page.wait_for_timeout(2000)

        print("Capturing 03-investigation-command-center.png...")
        await page.screenshot(path=str(SCREENSHOTS_DIR / "03-investigation-command-center.png"))
        await page.screenshot(path=str(SCREENSHOTS_DIR / "02-trace.png"))

        # 4. Network Trace (Graph)
        print("Capturing 04-network-trace.png...")
        await page.click("button:has-text('NETWORK')")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(SCREENSHOTS_DIR / "04-network-trace.png"))
        await page.screenshot(path=str(SCREENSHOTS_DIR / "03-network.png"))

        # 5. Evidence Board & 6. Uncertainty Loop (in TRACE tab)
        await page.click("button:has-text('TRACE')")
        await page.wait_for_timeout(1000)

        # Capture evidence board area
        print("Capturing 05-evidence-board.png...")
        evidence_el = page.locator("text=PINNED EVIDENCE // CORK BOARD").locator("xpath=ancestor::div[contains(@class, 'card-goa')][1]")
        if await evidence_el.count() > 0:
            await evidence_el.screenshot(path=str(SCREENSHOTS_DIR / "05-evidence-board.png"))
            await evidence_el.screenshot(path=str(SCREENSHOTS_DIR / "04-signals.png"))

        # Capture uncertainty loop / sun-tide gauge
        print("Capturing 06-uncertainty-loop.png...")
        gauge_el = page.locator("text=RISK, CONFIDENCE & UNCERTAINTY").locator("xpath=ancestor::div[contains(@class, 'card-goa')][1]")
        if await gauge_el.count() > 0:
            await gauge_el.screenshot(path=str(SCREENSHOTS_DIR / "06-uncertainty-loop.png"))

        # 7. Next-Best Action (NBA)
        print("Capturing 07-nba.png...")
        nba_el = page.locator("text=NEXT-BEST ACTION (NBA)").locator("xpath=ancestor::div[contains(@class, 'card-goa')][1]")
        if await nba_el.count() > 0:
            await nba_el.screenshot(path=str(SCREENSHOTS_DIR / "07-nba.png"))

        # 8. Supervisory Approval Center
        print("Navigating to Clearance tab...")
        await page.click("button:has-text('CLEARANCE')")
        await page.wait_for_timeout(1500)
        print("Capturing 08-approval.png...")
        await page.screenshot(path=str(SCREENSHOTS_DIR / "08-approval.png"))
        await page.screenshot(path=str(SCREENSHOTS_DIR / "05-clearance.png"))

        # 9. Decision Ledger
        print("Navigating to Ledger tab...")
        await page.click("button:has-text('LEDGER')")
        await page.wait_for_timeout(1500)
        print("Capturing 09-ledger.png...")
        await page.screenshot(path=str(SCREENSHOTS_DIR / "09-ledger.png"))
        await page.screenshot(path=str(SCREENSHOTS_DIR / "06-ledger.png"))

        # 10. Demo Mode
        print("Navigating to Demo tab...")
        await page.click("button:has-text('DEMO')")
        await page.wait_for_timeout(1500)
        print("Capturing 10-demo-mode.png...")
        await page.screenshot(path=str(SCREENSHOTS_DIR / "10-demo-mode.png"))
        await page.screenshot(path=str(SCREENSHOTS_DIR / "08-trials.png"))

        # 11. Mobile Viewport (375x812)
        print("Capturing 11-mobile.png...")
        mobile_context = await browser.new_context(viewport={"width": 375, "height": 812})
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto(BASE_URL, wait_until="networkidle")
        await mobile_page.wait_for_timeout(1000)
        await mobile_page.screenshot(path=str(SCREENSHOTS_DIR / "11-mobile.png"))

        await browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(capture())
