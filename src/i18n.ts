// ----- Lightweight i18n (English / Thai) -----
export type Lang = "en" | "th";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "th", label: "TH" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // top bar / nav
  "brand.title": "Portfolio Health",
  "badge.live": "LIVE",
  "nav.dashboard": "Dashboard",
  "nav.holdings": "Holdings",
  "nav.news": "News",
  "settings.light": "Light",
  "settings.dark": "Dark",
  "search.placeholder": "Search ticker or company…",
  "search.searching": "Searching…",

  // asset header
  "header.prevClose": "Prev Close",
  "header.high52": "52W High",
  "header.low52": "52W Low",
  "header.rangePos": "Range Pos",
  "header.today": "today",
  "header.loading": "Loading…",

  // chart controls
  "controls.candles": "Candles",
  "controls.heikin": "Heikin Ashi",
  "controls.line": "Line",
  "controls.srLines": "S/R Lines",
  "controls.bollinger": "Bollinger",
  "controls.sma": "SMA 50",
  "controls.sub": "Sub",
  "controls.rsi": "RSI",
  "controls.volume": "Volume",
  "chart.loading": "Loading {sym} chart…",
  "chart.unavailable": "Chart unavailable: {err}",

  // calculator
  "calc.title": "Support / Resistance Calculator",
  "calc.subtitle": "{sym} Entry Calculator",
  "calc.investment": "Investment Amount",
  "calc.lock": "Lock this amount",
  "calc.useCurrent": "Use current price as entry",
  "calc.entryOverride": "Entry overridden with live price {price} (S1).",
  "calc.supports": "Supports (entries)",
  "calc.resistances": "Resistances (targets)",
  "calc.reset": "Reset levels",
  "calc.entryTarget": "Entry ＼ Target",
  "calc.help":
    "Each cell = profit & % return if you invest {amt} at the row's support and exit at the column's resistance. Percentages are independent of the amount; dollar profit scales with it.",

  // holdings
  "holdings.title": "Portfolio Holdings",
  "holdings.updated": "Updated {time}",
  "holdings.loading": "Loading…",
  "holdings.symbol": "Symbol",
  "holdings.shares": "Shares",
  "holdings.avgCost": "Avg Cost",
  "holdings.price": "Price",
  "holdings.mktValue": "Mkt Value",
  "holdings.unrealized": "Unrealized P/L",
  "holdings.weight": "Weight",
  "holdings.empty": "No positions yet — add one on the right.",
  "holdings.addTitle": "Add shares",
  "holdings.cash": "Cash",
  "cash.title": "Cash balance",
  "cash.placeholder": "Cash amount",
  "cash.set": "Set",
  "cash.add": "+ Add",
  "add.ticker": "Ticker",
  "add.shares": "Shares",
  "add.avgCost": "Avg cost",
  "add.amount": "Amount ($)",
  "add.price": "Price",
  "add.button": "+ Add / Merge position",
  "add.useLive": "Use live $",
  "add.errInputs": "Enter a ticker, a positive $ amount and a price.",
  "add.errFetch": "Could not fetch price — check the ticker.",
  "add.added": "Added ${amt} of {sym} @ ${price} ({sh} sh)",
  "holdings.invested": "Invested",

  // average-down helper
  "avg.title": "Average down (buy more)",
  "avg.current": "Now: {sh} sh @ {avg}",
  "avg.buyAt": "Buy at",
  "avg.addShares": "+ Shares",
  "avg.newAvg": "New avg",
  "avg.newShares": "Total sh",
  "avg.help":
    "If you invest {amt} more at each support, this is your new blended average cost. Green = it lowers your average.",
  "avg.none": "Add this ticker to your holdings to see average-down scenarios.",

  // analysis
  "analysis.title": "Portfolio Health & Analysis",
  "analysis.totalValue": "Total Market Value",
  "analysis.costBasis": "Total Cost Basis",
  "analysis.unrealized": "Unrealized P/L",
  "analysis.today": "Today",
  "analysis.healthScore": "Health Score",
  "grade.healthy": "Healthy",
  "grade.balanced": "Balanced",
  "grade.watch": "Watch",
  "grade.atrisk": "At Risk",
  "analysis.topPerformer": "Top performer",
  "analysis.laggard": "Laggard",
  "analysis.concentration": "Concentration",
  "analysis.allocation": "Allocation by market value",
  "analysis.concentrationDetail": "Largest position {pct}",

  // recommendations
  "recs.title": "What to do next",
  "recs.trim":
    "{sym} is {pct} of your portfolio — quite concentrated. To bring it under {target}, trim about {amt} (~{sh} shares) and redeploy into other names or cash.",
  "recs.diversify":
    "You hold only {n} positions. Adding 2–3 uncorrelated names (different sectors) would lower single-stock risk.",
  "recs.cutLoss":
    "{sym} is down {pct} on cost. Re-check your thesis: average down only with real conviction, otherwise consider cutting to free up capital.",
  "recs.takeProfit":
    "{sym} is up {pct}. Consider trimming a portion to lock in gains and rebalance toward your target weights.",
  "recs.dayMove":
    "Portfolio moved {pct} today. Avoid reacting to one session — stick to your plan.",
  "recs.balanced":
    "Allocation looks reasonably balanced. Keep contributing on a schedule and review quarterly.",

  // news
  "news.title": "Market News",
  "news.portfolio": "Portfolio",
  "news.loading": "Fetching news…",
  "news.empty": "No recent headlines found.",
  "news.error": "Couldn't load news: {err}",

  // footer
  "footer.text":
    "Live data via Yahoo Finance · {n} positions · auto-refresh 60s · For research only, not financial advice.",
};

const th: Dict = {
  "brand.title": "สุขภาพพอร์ต",
  "badge.live": "เรียลไทม์",
  "nav.dashboard": "แดชบอร์ด",
  "nav.holdings": "พอร์ตหุ้น",
  "nav.news": "ข่าว",
  "settings.light": "สว่าง",
  "settings.dark": "มืด",
  "search.placeholder": "ค้นหาสัญลักษณ์หรือบริษัท…",
  "search.searching": "กำลังค้นหา…",

  "header.prevClose": "ราคาปิดก่อนหน้า",
  "header.high52": "สูงสุด 52 สัปดาห์",
  "header.low52": "ต่ำสุด 52 สัปดาห์",
  "header.rangePos": "ตำแหน่งในกรอบ",
  "header.today": "วันนี้",
  "header.loading": "กำลังโหลด…",

  "controls.candles": "แท่งเทียน",
  "controls.heikin": "ไฮเก็น อาชิ",
  "controls.line": "เส้น",
  "controls.srLines": "เส้นแนวรับ-ต้าน",
  "controls.bollinger": "โบลลิงเจอร์",
  "controls.sma": "SMA 50",
  "controls.sub": "กราฟย่อย",
  "controls.rsi": "RSI",
  "controls.volume": "ปริมาณ",
  "chart.loading": "กำลังโหลดกราฟ {sym}…",
  "chart.unavailable": "ไม่สามารถโหลดกราฟ: {err}",

  "calc.title": "ตารางคำนวณ แนวรับ-แนวต้าน",
  "calc.subtitle": "ตัวคำนวณจุดเข้า {sym}",
  "calc.investment": "จำนวนเงินลงทุน",
  "calc.lock": "ล็อกจำนวนเงินนี้",
  "calc.useCurrent": "ใช้ราคาปัจจุบันเป็นจุดเข้า",
  "calc.entryOverride": "แทนที่จุดเข้าด้วยราคาเรียลไทม์ {price} (S1)",
  "calc.supports": "แนวรับ (จุดเข้า)",
  "calc.resistances": "แนวต้าน (เป้าหมาย)",
  "calc.reset": "รีเซ็ตระดับ",
  "calc.entryTarget": "จุดเข้า ＼ เป้าหมาย",
  "calc.help":
    "แต่ละช่อง = กำไรและ % ผลตอบแทน หากลงทุน {amt} ที่แนวรับของแถวนั้นและขายที่แนวต้านของคอลัมน์นั้น เปอร์เซ็นต์ไม่ขึ้นกับจำนวนเงิน ส่วนกำไรเป็นดอลลาร์จะเพิ่มตามจำนวนเงิน",

  "holdings.title": "หุ้นในพอร์ต",
  "holdings.updated": "อัปเดต {time}",
  "holdings.loading": "กำลังโหลด…",
  "holdings.symbol": "สัญลักษณ์",
  "holdings.shares": "จำนวนหุ้น",
  "holdings.avgCost": "ต้นทุนเฉลี่ย",
  "holdings.price": "ราคา",
  "holdings.mktValue": "มูลค่าตลาด",
  "holdings.unrealized": "กำไร/ขาดทุนที่ยังไม่รับรู้",
  "holdings.weight": "สัดส่วน",
  "holdings.empty": "ยังไม่มีหุ้น — เพิ่มได้ทางด้านขวา",
  "holdings.addTitle": "เพิ่มหุ้น",
  "holdings.cash": "เงินสด",
  "cash.title": "ยอดเงินสด",
  "cash.placeholder": "จำนวนเงินสด",
  "cash.set": "ตั้งค่า",
  "cash.add": "+ เพิ่ม",
  "add.ticker": "สัญลักษณ์",
  "add.shares": "จำนวนหุ้น",
  "add.avgCost": "ต้นทุนเฉลี่ย",
  "add.amount": "จำนวนเงิน ($)",
  "add.price": "ราคา",
  "add.button": "+ เพิ่ม / รวมสถานะ",
  "add.useLive": "ใช้ราคาจริง",
  "add.errInputs": "กรอกสัญลักษณ์ จำนวนเงิน และราคาที่มากกว่าศูนย์",
  "add.errFetch": "ดึงราคาไม่สำเร็จ — ตรวจสอบสัญลักษณ์",
  "add.added": "เพิ่ม {sym} มูลค่า ${amt} ที่ราคา ${price} ({sh} หุ้น)",
  "holdings.invested": "เงินลงทุน",

  "avg.title": "เฉลี่ยต้นทุน (ซื้อเพิ่ม)",
  "avg.current": "ตอนนี้: {sh} หุ้น ที่ {avg}",
  "avg.buyAt": "ซื้อที่",
  "avg.addShares": "+ หุ้น",
  "avg.newAvg": "ต้นทุนใหม่",
  "avg.newShares": "หุ้นรวม",
  "avg.help":
    "หากลงทุนเพิ่ม {amt} ที่แต่ละแนวรับ นี่คือต้นทุนเฉลี่ยใหม่ของคุณ สีเขียว = ช่วยลดต้นทุนเฉลี่ย",
  "avg.none": "เพิ่มหุ้นตัวนี้เข้าพอร์ตเพื่อดูสถานการณ์เฉลี่ยต้นทุน",

  "analysis.title": "สุขภาพและการวิเคราะห์พอร์ต",
  "analysis.totalValue": "มูลค่าตลาดรวม",
  "analysis.costBasis": "ต้นทุนรวม",
  "analysis.unrealized": "กำไร/ขาดทุนที่ยังไม่รับรู้",
  "analysis.today": "วันนี้",
  "analysis.healthScore": "คะแนนสุขภาพ",
  "grade.healthy": "แข็งแรง",
  "grade.balanced": "สมดุล",
  "grade.watch": "เฝ้าระวัง",
  "grade.atrisk": "เสี่ยง",
  "analysis.topPerformer": "ทำผลงานดีสุด",
  "analysis.laggard": "อ่อนแรงสุด",
  "analysis.concentration": "การกระจุกตัว",
  "analysis.allocation": "สัดส่วนตามมูลค่าตลาด",
  "analysis.concentrationDetail": "สถานะใหญ่สุด {pct}",

  "recs.title": "ควรทำอะไรต่อ",
  "recs.trim":
    "{sym} คิดเป็น {pct} ของพอร์ต — กระจุกตัวค่อนข้างมาก หากต้องการให้ต่ำกว่า {target} ควรลดประมาณ {amt} (~{sh} หุ้น) แล้วนำไปกระจายในหุ้นอื่นหรือถือเงินสด",
  "recs.diversify":
    "คุณถือเพียง {n} สถานะ การเพิ่มหุ้น 2–3 ตัวที่ไม่สัมพันธ์กัน (ต่างกลุ่ม) จะช่วยลดความเสี่ยงรายตัว",
  "recs.cutLoss":
    "{sym} ขาดทุน {pct} จากต้นทุน ทบทวนเหตุผลการถือ: เฉลี่ยขาลงเฉพาะเมื่อมั่นใจจริง มิฉะนั้นพิจารณาตัดขายเพื่อปลดเงินทุน",
  "recs.takeProfit":
    "{sym} กำไร {pct} พิจารณาลดบางส่วนเพื่อล็อกกำไรและปรับสมดุลกลับสู่สัดส่วนเป้าหมาย",
  "recs.dayMove":
    "พอร์ตเปลี่ยนแปลง {pct} วันนี้ อย่าตอบสนองต่อวันเดียว — ทำตามแผนที่วางไว้",
  "recs.balanced":
    "การจัดสรรดูสมดุลพอสมควร ลงทุนสม่ำเสมอและทบทวนทุกไตรมาส",

  "news.title": "ข่าวตลาด",
  "news.portfolio": "ทั้งพอร์ต",
  "news.loading": "กำลังดึงข่าว…",
  "news.empty": "ไม่พบข่าวล่าสุด",
  "news.error": "โหลดข่าวไม่สำเร็จ: {err}",

  "footer.text":
    "ข้อมูลเรียลไทม์จาก Yahoo Finance · {n} สถานะ · รีเฟรชอัตโนมัติทุก 60 วินาที · เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน",
};

export const translations: Record<Lang, Dict> = { en, th };
