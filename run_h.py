import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        await pg.goto("http://127.0.0.1:4197/", wait_until="networkidle")
        for _ in range(80):
            st=(await pg.inner_text("#out")).strip() or (await pg.inner_text("#status"))
            if 'loaded' in (await pg.inner_text("#status")): break
            await pg.wait_for_timeout(500)
        print('status:', await pg.inner_text("#status"))
        for e in errs[:3]: print('E>',e)
        for _ in range(120):
            out=(await pg.inner_text("#out")).strip()
            if out: break
            await pg.wait_for_timeout(500)
        print(await pg.inner_text("#out"))
        await b.close()
asyncio.run(main())
