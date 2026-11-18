/* Run separately against npm start; no screenshots or persistent browser profile. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH);

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const base = process.env.TEST_ORIGIN || "http://localhost:3100";

  async function visit(path) {
    const response = await page.goto(`${base}${path}`);
    assert.equal(response.status(), 200, path);
    await page.locator("h1, .empty h2").first().waitFor();
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll("body *")]
        .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          width: element.getBoundingClientRect().width,
        })),
    }));
    assert.ok(
      overflow.scroll <= overflow.width,
      `horizontal overflow: ${path} ${JSON.stringify(overflow)}`,
    );
  }

  try {
    for (const path of [
      "/",
      "/events/current",
      "/events/current/split",
      "/events/current/collect",
      "/settings",
      "/backup",
      "/about",
      "/share",
    ])
      await visit(path);
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of [
      "/",
      "/events/current",
      "/events/current/split",
      "/events/current/collect",
      "/settings",
      "/backup",
      "/about",
    ])
      await visit(path);

    await visit("/events/current/split");
    await page.getByRole("button", { name: "共有URLをコピー" }).click();
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(sharedUrl.includes("/share?data=v1."));
    const fresh = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const sharedPage = await fresh.newPage();
    sharedPage.on("pageerror", (error) => errors.push(error.message));
    sharedPage.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    assert.equal((await sharedPage.goto(sharedUrl)).status(), 200);
    await sharedPage.getByRole("heading", { name: "会費と計算の根拠" }).waitFor();
    assert.equal(await sharedPage.evaluate(() => localStorage.getItem("nsa:v1")), null);
    assert.equal(await sharedPage.locator(".shared-row").count(), 10);
    assert.equal(
      await sharedPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await fresh.close();

    await visit("/events/current/collect");
    await page.getByLabel("未集金だけ表示").check();
    assert.equal(await page.locator(".collection-row").count(), 3);
    await page.locator(".collection-row").first().getByLabel("集金済み", { exact: true }).click();
    assert.equal(await page.locator(".collection-row").count(), 2);
    await page.reload();
    await page.getByLabel("未集金だけ表示").check();
    assert.equal(await page.locator(".collection-row").count(), 2);

    await visit("/");
    await page.getByRole("button", { name: "新しい会をつくる" }).click();
    await page.getByLabel("会の名前", { exact: true }).fill("動作確認の会");
    await page.getByLabel("お店の会計（円）").fill("12001");
    for (const name of ["若槻 花", "吉野 圭", "相馬 岳"]) {
      await page.getByRole("button", { name: "参加者を追加" }).click();
      await page.getByLabel("名前", { exact: true }).last().fill(name);
    }
    await page.getByRole("button", { name: "設定を保存する" }).click();
    await page.getByRole("status").filter({ hasText: "保存しました" }).waitFor();
    const createdPath = new URL(page.url()).pathname;
    assert.ok(!createdPath.includes("local"));
    await visit(`${createdPath}/split`);
    assert.equal(await page.locator(".split-table tbody tr").count(), 3);
    await page.getByRole("button", { name: "CSVを書き出す" }).click();

    await visit("/settings");
    await page.getByLabel("飲まない人の係数", { exact: true }).fill("0.75");
    await page.getByRole("button", { name: "既定の設定を保存" }).click();
    await page.reload();
    assert.equal(await page.getByLabel("飲まない人の係数", { exact: true }).inputValue(), "0.75");

    await visit("/backup");
    const saved = await page.evaluate(() => localStorage.getItem("nsa:v1"));
    await page
      .locator("#backup-file")
      .setInputFiles({
        name: "invalid.json",
        mimeType: "application/json",
        buffer: Buffer.from("{}"),
      });
    await page.getByRole("alert").filter({ hasText: "バックアップ" }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("nsa:v1")), saved);
    await page
      .locator("#backup-file")
      .setInputFiles({
        name: "valid.json",
        mimeType: "application/json",
        buffer: Buffer.from(saved),
      });
    await page.getByRole("button", { name: "この内容で置き換える" }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem("nsa:v1")), saved);
    await page.locator("#backup-file").focus();
    assert.ok(
      await page
        .locator(".file-label")
        .evaluate((label) => getComputedStyle(label).outlineStyle !== "none"),
    );

    await page.evaluate(() => localStorage.setItem("nsa:v1", "{broken"));
    await visit("/");
    await page.getByRole("status").filter({ hasText: "壊れていた" }).waitFor();
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem("nsa:v1")).events.length),
      10,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Browser checks passed: all routes, 375px, new ID, shared URL, collection, CSV, settings, backup, corruption recovery; console errors: 0",
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
