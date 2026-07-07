/* ============================================================
   Toni's Cleaning Services — Invoicing & Scheduling
   ============================================================ */

const BIZ = {
  name: "Toni's Cleaning Services",
  owner: "Toni Goucher",
  addr1: "1101 E 267th St",
  addr2: "Cleveland, MO 64734",
  phone: "(816) 406-8630",
};

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------
   TABS
------------------------------------------------------------ */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    const view = tab.dataset.view;
    $("view-invoice").hidden = view !== "invoice";
    $("view-schedule").hidden = view !== "schedule";
    if (view === "schedule") renderWeek();
  });
});

/* ============================================================
   INVOICE
============================================================ */
const itemsList = $("itemsList");

function addItemRow(desc = "", amount = "") {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input type="text" class="item-desc" placeholder="Service description" />
    <input type="number" class="item-amount" placeholder="0.00" min="0" step="0.01" />
    <button type="button" class="item-del" title="Remove">×</button>`;
  row.querySelector(".item-desc").value = desc;
  row.querySelector(".item-amount").value = amount;
  row.querySelector(".item-desc").addEventListener("input", renderInvoice);
  row.querySelector(".item-amount").addEventListener("input", renderInvoice);
  row.querySelector(".item-del").addEventListener("click", () => {
    row.remove();
    if (!itemsList.children.length) addItemRow();
    renderInvoice();
  });
  itemsList.appendChild(row);
}

function getItems() {
  return [...itemsList.querySelectorAll(".item-row")]
    .map((r) => ({
      desc: r.querySelector(".item-desc").value.trim(),
      amount: parseFloat(r.querySelector(".item-amount").value) || 0,
    }))
    .filter((i) => i.desc || i.amount);
}

function invoiceData() {
  const items = getItems();
  return {
    number: $("invoiceNumber").value.trim() || "2026-118",
    date: $("invoiceDate").value,
    client: $("clientName").value.trim(),
    clientDetails: $("clientDetails").value.trim(),
    notes: $("notes").value.trim(),
    items,
    total: items.reduce((s, i) => s + i.amount, 0),
  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function renderInvoice() {
  const d = invoiceData();
  $("pvNumber").textContent = d.number;
  $("pvDate").textContent = fmtDate(d.date);
  $("pvClient").textContent = d.client || "—";
  $("pvClientDetails").textContent = d.clientDetails;
  $("totalDisplay").textContent = money(d.total);
  $("pvTotal").textContent = money(d.total);

  const body = $("pvItems");
  body.innerHTML = "";
  if (!d.items.length) {
    body.innerHTML = `<tr><td colspan="2" style="color:#9ca3af">No services added yet</td></tr>`;
  } else {
    d.items.forEach((i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(i.desc || "—")}</td><td class="right">${money(i.amount)}</td>`;
      body.appendChild(tr);
    });
  }
  $("pvNotesWrap").hidden = !d.notes;
  $("pvNotes").textContent = d.notes;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ------------------------------------------------------------
   PDF generation (jsPDF, modern layout)
------------------------------------------------------------ */
function buildPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" }); // US Letter (8.5x11") — full-size for US printers
  const d = invoiceData();
  const W = doc.internal.pageSize.getWidth();
  const M = 48; // margin
  const teal = [15, 118, 110];
  const tealDark = [15, 61, 58];
  const gold = [212, 160, 23];
  const goldSoft = [253, 230, 138];
  const muted = [107, 114, 128];
  const line = [229, 231, 235];

  // ---- Header band ----
  doc.setFillColor(...teal);
  doc.rect(0, 0, W, 96, "F");
  doc.setFillColor(...gold);
  doc.rect(0, 96, W, 4, "F");

  // Logo badge (drawn circle monogram)
  doc.setFillColor(255, 255, 255);
  doc.circle(M + 26, 48, 26, "F");
  doc.setTextColor(...tealDark);
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text("TG", M + 26, 55, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text(BIZ.name, M + 64, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(BIZ.owner, M + 64, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("INVOICE", W - M, 46, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice #  ${d.number}`, W - M, 66, { align: "right" });
  doc.text(`Date  ${fmtDate(d.date)}`, W - M, 80, { align: "right" });

  // ---- Parties ----
  let y = 140;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text("FROM", M, y);
  doc.text("BILL TO", W / 2 + 10, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 72, 78);
  doc.setFontSize(10);
  const fromLines = [BIZ.owner, BIZ.addr1, BIZ.addr2, BIZ.phone];
  fromLines.forEach((l, i) => doc.text(l, M, y + 16 + i * 14));

  const toLines = [d.client || "—"];
  if (d.clientDetails) toLines.push(...d.clientDetails.split("\n"));
  toLines.forEach((l, i) => {
    doc.setFont("helvetica", i === 0 ? "bold" : "normal");
    doc.text(l, W / 2 + 10, y + 16 + i * 14);
  });

  // ---- Items table ----
  y += 90;
  const rowH = 26;
  doc.setFillColor(...teal);
  doc.rect(M, y, W - M * 2, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SERVICE", M + 12, y + 17);
  doc.text("AMOUNT", W - M - 12, y + 17, { align: "right" });

  y += rowH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const items = d.items.length ? d.items : [{ desc: "—", amount: 0 }];
  items.forEach((it, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(247, 250, 249);
      doc.rect(M, y, W - M * 2, rowH, "F");
    }
    doc.setTextColor(38, 50, 56);
    const descLines = doc.splitTextToSize(it.desc || "—", W - M * 2 - 120);
    doc.text(descLines, M + 12, y + 17);
    doc.text(money(it.amount), W - M - 12, y + 17, { align: "right" });
    doc.setDrawColor(...line);
    doc.line(M, y + rowH, W - M, y + rowH);
    y += rowH + (descLines.length > 1 ? (descLines.length - 1) * 12 : 0);
  });

  // ---- Total ----
  y += 14;
  const boxW = 220;
  doc.setFillColor(...tealDark);
  doc.roundedRect(W - M - boxW, y, boxW, 40, 5, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Total Due", W - M - boxW + 16, y + 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(money(d.total), W - M - 16, y + 26, { align: "right" });
  y += 40;

  // ---- Notes ----
  if (d.notes) {
    y += 24;
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTES", M, y);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const nLines = doc.splitTextToSize(d.notes, W - M * 2);
    doc.text(nLines, M, y + 15);
    y += 15 + nLines.length * 13;
  }

  // ---- Thank you ----
  y = Math.max(y + 40, 640);
  doc.setTextColor(...teal);
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.text("Thank you for your business!", W / 2, y, { align: "center" });

  // ---- Payable highlight ----
  const payText = "Please make all checks payable to Toni Goucher";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const tw = doc.getTextWidth(payText);
  const px = W / 2 - tw / 2;
  const py = y + 28;
  doc.setFillColor(...goldSoft);
  doc.roundedRect(px - 12, py - 12, tw + 24, 22, 4, 4, "F");
  doc.setTextColor(58, 44, 5);
  doc.text(payText, W / 2, py + 3, { align: "center" });

  // ---- Footer ----
  const fy = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(...line);
  doc.line(M, fy - 12, W - M, fy - 12);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${BIZ.name}  ·  ${BIZ.addr1}, ${BIZ.addr2}  ·  ${BIZ.phone}`, W / 2, fy, { align: "center" });

  return doc;
}

function pdfFilename() {
  const d = invoiceData();
  const who = (d.client || "client").replace(/[^\w-]+/g, "_");
  return `Invoice_${d.number}_${who}.pdf`;
}

/* ---- Actions ---- */
$("addItemBtn").addEventListener("click", () => addItemRow());

["invoiceNumber", "invoiceDate", "clientName", "clientDetails", "notes"].forEach((id) =>
  $(id).addEventListener("input", renderInvoice)
);

$("downloadBtn").addEventListener("click", () => {
  if (!window.jspdf) return alert("PDF library still loading — try again in a moment.");
  buildPdf().save(pdfFilename());
});

$("shareBtn").addEventListener("click", async () => {
  if (!window.jspdf) return alert("PDF library still loading — try again in a moment.");
  const doc = buildPdf();
  const blob = doc.output("blob");
  const file = new File([blob], pdfFilename(), { type: "application/pdf" });
  const d = invoiceData();
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Invoice ${d.number}`,
        text: `Invoice ${d.number} from ${BIZ.name}`,
      });
    } catch (e) { /* user cancelled */ }
  } else {
    // Fallback: download + open mail app
    doc.save(pdfFilename());
    openMail();
    $("shareHint").textContent = "Your device can't attach files directly — the PDF was downloaded and your email app opened. Attach the saved PDF to the email.";
  }
});

function openMail() {
  const d = invoiceData();
  const subject = encodeURIComponent(`Invoice ${d.number} — ${BIZ.name}`);
  const body = encodeURIComponent(
    `Hi ${d.client || "there"},\n\nPlease find attached invoice ${d.number} for ${money(d.total)}.\n\n` +
    `Please make all checks payable to Toni Goucher.\n\nThank you for your business!\n\n${BIZ.owner}\n${BIZ.name}\n${BIZ.phone}`
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
$("emailBtn").addEventListener("click", openMail);

/* ============================================================
   WEEKLY SCHEDULE
============================================================ */
const STORE_KEY = "toni_schedule_v1";
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let weekOffset = 0; // 0 = current week
let modalTargetDate = null;

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveStore(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

function ymd(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function startOfWeek(offset) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sun = new Date(now);
  sun.setDate(now.getDate() - now.getDay() + offset * 7);
  return sun;
}

function renderWeek() {
  const store = loadStore();
  const sun = startOfWeek(weekOffset);
  const todayStr = ymd(new Date());
  const grid = $("weekGrid");
  grid.innerHTML = "";

  let weekTotal = 0, weekJobs = 0;

  for (let i = 0; i < 7; i++) {
    const dt = new Date(sun);
    dt.setDate(sun.getDate() + i);
    const key = ymd(dt);
    const appts = (store[key] || []).slice().sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const dayTotal = appts.reduce((s, a) => s + (Number(a.price) || 0), 0);
    weekTotal += dayTotal;
    weekJobs += appts.length;

    const col = document.createElement("div");
    col.className = "day-col" + (key === todayStr ? " is-today" : "");
    col.innerHTML = `
      <div class="day-head">
        <div class="day-name">${DAY_NAMES[i].slice(0, 3)}</div>
        <div class="day-date">${dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
      </div>
      <div class="day-total">${dayTotal ? money(dayTotal) : ""}</div>
      <div class="appts"></div>
      <button type="button" class="add-appt">+ Add client</button>`;

    const apptsEl = col.querySelector(".appts");
    appts.forEach((a) => {
      const el = document.createElement("div");
      el.className = "appt";
      el.innerHTML = `
        <button type="button" class="appt-del" title="Remove">×</button>
        <div class="appt-time">${a.time ? formatTime(a.time) : ""}</div>
        <div class="appt-client">${escapeHtml(a.client)}</div>
        ${a.service ? `<div class="appt-service">${escapeHtml(a.service)}</div>` : ""}
        <div class="appt-price">${money(a.price)}</div>`;
      el.querySelector(".appt-del").addEventListener("click", () => {
        removeAppt(key, a.id);
      });
      apptsEl.appendChild(el);
    });

    col.querySelector(".add-appt").addEventListener("click", () => openApptModal(key));
    grid.appendChild(col);
  }

  $("weekTotal").textContent = money(weekTotal);
  $("weekJobs").textContent = weekJobs;

  const end = new Date(sun); end.setDate(sun.getDate() + 6);
  const label = weekOffset === 0 ? "This Week" : `Week of ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  $("weekLabel").textContent = `${label} · ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

function removeAppt(dateKey, id) {
  const store = loadStore();
  store[dateKey] = (store[dateKey] || []).filter((a) => a.id !== id);
  if (!store[dateKey].length) delete store[dateKey];
  saveStore(store);
  renderWeek();
}

/* ---- Modal ---- */
function openApptModal(dateKey) {
  modalTargetDate = dateKey;
  $("apptClient").value = "";
  $("apptTime").value = "09:00";
  $("apptPrice").value = "";
  $("apptService").value = "";
  const dt = new Date(dateKey + "T00:00:00");
  $("apptModalTitle").textContent = "Add Client — " + dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  $("apptModal").hidden = false;
  setTimeout(() => $("apptClient").focus(), 40);
}
function closeApptModal() { $("apptModal").hidden = true; modalTargetDate = null; }

$("apptCancel").addEventListener("click", closeApptModal);
$("apptModal").addEventListener("click", (e) => { if (e.target === $("apptModal")) closeApptModal(); });

$("apptSave").addEventListener("click", () => {
  const client = $("apptClient").value.trim();
  if (!client) { $("apptClient").focus(); return; }
  const store = loadStore();
  if (!store[modalTargetDate]) store[modalTargetDate] = [];
  store[modalTargetDate].push({
    id: "a" + Date.now() + Math.floor(Math.random() * 1000),
    client,
    time: $("apptTime").value,
    price: parseFloat($("apptPrice").value) || 0,
    service: $("apptService").value.trim(),
  });
  saveStore(store);
  closeApptModal();
  renderWeek();
});

$("apptClient").addEventListener("keydown", (e) => { if (e.key === "Enter") $("apptSave").click(); });
$("apptPrice").addEventListener("keydown", (e) => { if (e.key === "Enter") $("apptSave").click(); });

$("prevWeek").addEventListener("click", () => { weekOffset--; renderWeek(); });
$("nextWeek").addEventListener("click", () => { weekOffset++; renderWeek(); });
$("thisWeek").addEventListener("click", () => { weekOffset = 0; renderWeek(); });

/* ============================================================
   INIT
============================================================ */
(function init() {
  // default date = today
  const t = new Date();
  $("invoiceDate").value = ymd(t);
  addItemRow();
  addItemRow();
  renderInvoice();
})();
