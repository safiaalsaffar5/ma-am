// Usage: node scripts/shoot.mjs <outDir>
import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const out = process.argv[2] || "shots"; mkdirSync(out, { recursive: true });
const url = pathToFileURL(process.cwd() + "/index.html").href;
const NOW = new Date(2026, 10, 20, 10, 15);
const k = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const day = n => { const d = new Date(NOW); d.setDate(d.getDate()+n); return k(d); };
const done = (h) => new Date(2026,10,20,h,0).getTime();
let i = 0; const T = (title, o = {}) => ({ id: "t" + (i++), title, note: "", day: day(0), time: "", tag: null, done: false, doneAt: null, focus: false, created: i, ...o });
const FULL = [
  T("أكمل عرض مشروع الربع الأول", { focus: true, tag: "work", time: "11:00" }),
  T("مكالمة مع فريق التصميم", { tag: "work", time: "13:30" }),
  T("أراجع عقد الإيجار", { tag: "home", note: "قبل الخميس" }),
  T("أطلب هدية عيد ميلاد نورة", { tag: "self" }),
  T("أرد على إيميل العميل", { tag: "work", time: "16:00" }),
  T("مشي ٣٠ دقيقة", { tag: "self", time: "18:30" }),
  T("أشتري خضار وفواكه", { tag: "home" }),
  T("أحجز موعد الأسنان", { tag: "self" }),
  T("أدفع فاتورة الكهرباء", { day: day(-1), tag: "home" }),
  T("أرسل ملاحظات التقرير", { day: day(-3), tag: "work" }),
  T("أصلي الفجر بوقتها", { done: true, doneAt: done(5) }),
  T("قهوة الصباح مع ريم", { done: true, doneAt: done(8), tag: "self" }),
  T("أرتب صندوق الوارد", { done: true, doneAt: done(9), tag: "work" }),
  T("أسقي النباتات", { done: true, doneAt: done(9), tag: "home" }),
  T("اجتماع التخطيط الأسبوعي", { day: day(1), time: "09:30", tag: "work" }),
  T("أوديني السيارة للصيانة", { day: day(1), tag: "home" }),
  T("درس اليوغا", { day: day(2), time: "19:00", tag: "self" }),
  T("أسلّم تصاميم الصفحة الرئيسية", { day: day(4), tag: "work" }),
  T("عشاء عائلي عند خالتي", { day: day(9), time: "20:00", tag: "self" }),
  T("أقرأ كتاب «فن اللامبالاة»", { day: null, tag: "self" }),
];
const state = (tasks, extra={}) => ({ v:1, tasks, settings:{theme:"auto",digits:"arab"}, onboarded:true, updated:1, ...extra });
const devices = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const browser = await chromium.launch();
async function shot(name, dev, scheme, st, act, full = false) {
  if (only && !only.some(o => name.includes(o))) return;
  const ctx = await browser.newContext({ ...devices[dev], colorScheme: scheme, locale: "ar" });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  page.on("pageerror", e => console.log("PAGEERROR", name, e.message));
  page.on("console", m => { if (m.type() === "error") console.log("CONSOLE", name, m.text()); });
  await page.addInitScript(s => { if (s) localStorage.setItem("maham.v1", JSON.stringify(s)); }, st);
  await page.goto(url, { waitUntil: "networkidle" });
  // Preview only: load the locally installed Thmanyah files (not shipped with the app)
  if (process.env.FONTS_CSS) await page.addStyleTag({ content: (await import("node:fs")).readFileSync(process.env.FONTS_CSS, "utf8") });
  await page.evaluate(() => document.fonts.ready);
  if (act) await act(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-${dev}-${scheme}.png`, fullPage: false });
  await ctx.close();
}
for (const dev of ["phone", "desktop"]) for (const scheme of ["light", "dark"]) {
  await shot("01-onb1", dev, scheme, null);
  await shot("02-onb2", dev, scheme, null, p => p.click("[data-o=next]"));
  await shot("03-onb3", dev, scheme, null, async p => { await p.click("[data-o=next]"); await p.waitForTimeout(350); await p.click("[data-o=next]"); });
  await shot("04-onbfirst", dev, scheme, null, async p => { for (let j=0;j<3;j++){ await p.click("[data-o=next]"); await p.waitForTimeout(350);} });
  await shot("05-empty", dev, scheme, state([]));
  await shot("06-today", dev, scheme, state(FULL), null, dev === "phone");
  await shot("07-todayfold", dev, scheme, state(FULL));
  await shot("08-upcoming", dev, scheme, state(FULL), p => p.evaluate(() => window.__maham.setView("upcoming")), dev === "phone");
  await shot("09-prefs", dev, scheme, state(FULL), p => p.evaluate(() => window.__maham.setView("prefs")));
  await shot("10-sheet", dev, scheme, state(FULL), async p => { await p.click(dev === "phone" ? "#fab" : "#sideAdd"); await p.waitForTimeout(500); await p.keyboard.type("أجهز شنطة السفر"); });
  await shot("11-edit", dev, scheme, state(FULL), async p => { await p.click(".list .task__body"); await p.waitForTimeout(500); });
  await shot("13-todayscroll", dev, scheme, state(FULL), async p => { await p.click("[data-act=showdone]"); await p.evaluate(() => window.scrollTo(0, 99999)); });
  await shot("14-toast", dev, scheme, state(FULL), async p => { await p.click(".list .check"); await p.waitForTimeout(900); });
  await shot("12-upempty", dev, scheme, state([]), p => p.evaluate(() => window.__maham.setView("upcoming")));
}
await browser.close();
console.log("done");
