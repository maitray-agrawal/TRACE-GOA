"""
Capture real, high-resolution application screenshots for TRACE//GOA.
Captures all 8 views required for hackathon submission collateral:
01-command.png, 02-trace.png, 03-network.png, 04-signals.png,
05-clearance.png, 06-ledger.png, 07-memory.png, 08-trials.png.
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "docs" / "assets" / "screenshots"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CHROME_BIN = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "http://localhost:5173"

def capture_all():
    print(f"=== Capturing Real TRACE//GOA Screenshots to {OUTPUT_DIR} ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_BIN,
            headless=True
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        print(f"[*] Navigating to {URL}...")
        page.goto(URL, wait_until="networkidle")
        time.sleep(2)
        
        # 1. COMMAND (Dashboard)
        print("[*] Capturing 01-command.png...")
        page.screenshot(path=str(OUTPUT_DIR / "01-command.png"))
        
        # 2. TRACE (Investigation Workspace)
        print("[*] Navigating to TRACE view...")
        page.click("text=TRACE")
        time.sleep(1.5)
        print("[*] Capturing 02-trace.png...")
        page.screenshot(path=str(OUTPUT_DIR / "02-trace.png"))
        
        # 3. SIGNALS (inside TRACE / Evidence Panel)
        print("[*] Clicking SIGNALS tab in Evidence Panel...")
        signals_btn = page.query_selector("button:has-text('SIGNALS')")
        if signals_btn:
            signals_btn.click()
            time.sleep(1)
        print("[*] Capturing 04-signals.png...")
        page.screenshot(path=str(OUTPUT_DIR / "04-signals.png"))
        
        # 4. MEMORY (inside TRACE / Evidence Panel)
        print("[*] Clicking MEMORY tab in Evidence Panel...")
        mem_btn = page.query_selector("button:has-text('MEMORY')")
        if mem_btn:
            mem_btn.click()
            time.sleep(1)
        print("[*] Capturing 07-memory.png...")
        page.screenshot(path=str(OUTPUT_DIR / "07-memory.png"))

        # 5. NETWORK (Graph View)
        print("[*] Navigating to NETWORK view...")
        page.click("text=NETWORK")
        time.sleep(2)
        print("[*] Capturing 03-network.png...")
        page.screenshot(path=str(OUTPUT_DIR / "03-network.png"))
        
        # 6. CLEARANCE (Governance / RBAC Actions)
        print("[*] Navigating to CLEARANCE view...")
        page.click("text=CLEARANCE")
        time.sleep(1.5)
        print("[*] Capturing 05-clearance.png...")
        page.screenshot(path=str(OUTPUT_DIR / "05-clearance.png"))
        
        # 7. LEDGER (Cryptographic Audit Trail)
        print("[*] Navigating to LEDGER view...")
        page.click("text=LEDGER")
        time.sleep(1.5)
        print("[*] Capturing 06-ledger.png...")
        page.screenshot(path=str(OUTPUT_DIR / "06-ledger.png"))
        
        # 8. TRIALS // DEMO (Execution & Replay)
        print("[*] Navigating to TRIALS view...")
        page.click("text=TRIALS")
        time.sleep(1.5)
        print("[*] Capturing 08-trials.png...")
        page.screenshot(path=str(OUTPUT_DIR / "08-trials.png"))
        
        browser.close()
        
    print("\n[+] Verification of Captured Screenshots:")
    expected = [
        "01-command.png", "02-trace.png", "03-network.png", "04-signals.png",
        "05-clearance.png", "06-ledger.png", "07-memory.png", "08-trials.png"
    ]
    for name in expected:
        fpath = OUTPUT_DIR / name
        if fpath.exists():
            size_kb = fpath.stat().st_size / 1024
            print(f"    [+] {name:<18} ({size_kb:>6.1f} KB)")
        else:
            print(f"    [-] MISSING: {name}")

if __name__ == "__main__":
    capture_all()
