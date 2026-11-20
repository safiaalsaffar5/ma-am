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
let i = 0; const T = (title, o = {}) => ({ id: "t" + (i++), title, note: "", day: day(0), time: "", dur: 30, list: "work", remind: null, done: false, doneAt: null, reminded: false, created: i, ...o });
const FULL = [
  T("مراجعة عرض الربع الأول", { time: "09:00", dur: 60, list: "work", done: true, doneAt: done(10) }),
  T("اجتماع فريق التصميم", { time: "11:00", dur: 60, list: "work", remind: 10 }),
  T("مكالمة مع العميل", { time: "13:30", dur: 30, list: "work", remind: 10, note: "تجهيز الأرقام" }),
  T("موعد الأسنان", { time: "16:00", dur: 60, list: "health", remind: 30 }),
  T("استلام الأطفال من المدرسة", { time: "14:15", dur: 30, list: "home", remind: 0 }),
  T("رياضة", { time: "19:00", dur: 60, list: "health" }),
  T("الرد على إيميلات الموردين", { list: "work" }),
  T("تحديث خطة المشروع", { list: "work", note: "قبل الخميس" }),
  T("شراء أغراض البيت", { list: "home" }),
  T("حجز تذاكر الإجازة", { list: "personal" }),
  T("دفع فاتورة الكهرباء", { day: day(-1), list: "home" }),
  T("إرسال التقرير الأسبوعي", { day: day(-3), list: "work" }),
  T("ترتيب صندوق الوارد", { list: "work", done: true, doneAt: done(8) }),
  T("المشي ٢٠ دقيقة", { list: "health", done: true, doneAt: done(7) }),
  T("اجتماع التخطيط الأسبوعي", { day: day(2), time: "09:30", dur: 60, list: "work", remind: 10 }),
  T("صيانة السيارة", { day: day(1), time: "17:00", list: "home" }),
  T("عشاء عائلي", { day: day(1), time: "20:00", dur: 120, list: "personal" }),
  T("تسليم تصاميم الصفحة الرئيسية", { day: day(4), list: "work" }),
  T("فحص دوري", { day: day(9), time: "10:00", list: "health", remind: 60 }),
  T("قراءة كتاب العادات الذرية", { day: null, list: "personal" }),
];
const NOTES = [
  { id: "n1", title: "محضر اجتماع التصميم", body: "- اعتماد الألوان الجديدة\n- مراجعة شاشة التقويم\n- موعد التسليم الخميس\n- ريم: تجهيز النماذج", pinned: true, created: 1, updated: done(9) },
  { id: "n2", title: "أفكار لعرض الربع", body: "نبدأ بالأرقام، بعدها قصص العملاء، وآخر شيء خطة الربع الجاي.", pinned: false, created: 2, updated: done(8) },
  { id: "n3", title: "قائمة السفر", body: "جواز السفر\nشاحن\nأدوية\nحجز الفندق", pinned: true, created: 3, updated: done(6) },
  { id: "n4", title: "كتب أبي أقرأها", body: "العادات الذرية\nالعمل العميق\nفن اللامبالاة", pinned: false, created: 4, updated: done(5) },
  { id: "n5", title: "وصفة الكيكة", body: "٣ بيض، كوب سكر، كوب طحين، نص كوب زيت، فانيلا. ١٨٠ درجة لمدة ٣٥ دقيقة.", pinned: false, created: 5, updated: done(4) },
];
const state = (tasks, extra = {}) => ({ v: 2, tasks, notes: [], settings: { theme: "auto", digits: "arab" }, onboarded: true, updated: 1, ...extra });
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
  await page.addInitScript(s => { if (s) localStorage.setItem("maham.v2", JSON.stringify(s)); }, st);
  await page.goto(url, { waitUntil: "networkidle" });
  // Preview only: load the locally installed Thmanyah files (not shipped with the app)
  if (process.env.FONTS_CSS) await page.addStyleTag({ content: (await import("node:fs")).readFileSync(process.env.FONTS_CSS, "utf8") });
  await page.evaluate(() => document.fonts.ready);
  if (act) await act(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-${dev}-${scheme}.png`, fullPage: false });
  await ctx.close();
}
const F = () => state(FULL, { notes: NOTES });
const go = v => p => p.evaluate(v => window.__maham.setView(v), v);
for (const dev of ["phone", "desktop"]) for (const scheme of ["light", "dark"]) {
  await shot("01-onb1", dev, scheme, null);
  await shot("02-onb2", dev, scheme, null, p => p.click("[data-o=next]"));
  await shot("03-onb3", dev, scheme, null, async p => { await p.click("[data-o=next]"); await p.waitForTimeout(350); await p.click("[data-o=next]"); });
  await shot("04-onbfirst", dev, scheme, null, async p => { for (let j = 0; j < 3; j++) { await p.click("[data-o=next]"); await p.waitForTimeout(350); } });
  await shot("05-empty", dev, scheme, state([]));
  await shot("06-today", dev, scheme, F());
  await shot("07-todayscroll", dev, scheme, F(), p => p.evaluate(() => window.scrollTo(0, 700)));
  await shot("08-calendar", dev, scheme, F(), go("calendar"));
  await shot("09-tasks", dev, scheme, F(), go("tasks"));
  await shot("10-notes", dev, scheme, F(), go("notes"));
  await shot("11-sheet", dev, scheme, F(), async p => { await p.click(".ev .body"); await p.waitForTimeout(500); });
  await shot("12-note", dev, scheme, F(), async p => { await go("notes")(p); await p.click("[data-note=n1]"); await p.waitForTimeout(500); });
  await shot("13-prefs", dev, scheme, F(), go("prefs"));
  await shot("14-banner", dev, scheme, F(), async p => { await p.evaluate(() => window.__maham.showBanner("t2")); await p.waitForTimeout(700); });
}
await browser.close();
console.log("done");
