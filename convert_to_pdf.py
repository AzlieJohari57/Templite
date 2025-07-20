import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def url_to_pdf(url, output_path):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto(url)
        await page.wait_for_load_state('networkidle')

        # Set page content height to auto so it breaks across A4 pages
        await page.emulate_media(media="print")

        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "0.5mm", "bottom": "0.5mm", "left": "0.5mm", "right": "0.5mm"},
        )

        await browser.close()

# Convert local HTML file to file:// URI
html_path = Path("./generated html/5757_output_resume.html").resolve().as_uri()
output_path = "./generated resume/resume_output.pdf"

asyncio.run(url_to_pdf(html_path, output_path))
