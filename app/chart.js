// Two small charts that share one time axis (never a dual-axis chart):
//   1. How the person felt (1–10) at each visit — a line
//   2. How many medicines they were on — bars
// Visits are placed by date, so visits getting closer together is visible.
// Hovering (or tapping) a visit shows its details. The timeline table below
// the charts is the accessible table view of the same numbers.

const W = 600;
const PAD_L = 34;
const PAD_R = 46;
const FEEL_H = 120;
const MEDS_H = 84;
const GAP = 38;
const AXIS_H = 22;
const TOP = 22; // room for the first chart title

export function renderCharts(r, dateLabel) {
  const v = r.visits;
  const t0 = Date.parse(v[0].date);
  const t1 = Date.parse(v[v.length - 1].date);
  const span = Math.max(1, t1 - t0);
  const x = (d) => PAD_L + ((Date.parse(d) - t0) / span) * (W - PAD_L - PAD_R);
  const xs = v.map((vis) => x(vis.date));

  // --- Feeling line (fixed 1–10 scale so it is never exaggerated) ---
  const fy = (val) => TOP + 10 + (1 - (val - 1) / 9) * (FEEL_H - 20);
  const grid = [1, 5, 10]
    .map(
      (g) => `<line x1="${PAD_L}" x2="${W - PAD_R}" y1="${fy(g)}" y2="${fy(g)}" class="grid"/>
      <text x="${PAD_L - 8}" y="${fy(g) + 4}" class="tick" text-anchor="end">${g}</text>`
    )
    .join("");
  const segs = [];
  let cur = [];
  v.forEach((vis, i) => {
    if (vis.wellbeing == null) {
      if (cur.length) segs.push(cur);
      cur = [];
    } else cur.push([xs[i], fy(vis.wellbeing)]);
  });
  if (cur.length) segs.push(cur);
  const path = segs.map((s) => `<path d="M${s.map((p) => p.join(",")).join("L")}" class="feel-line"/>`).join("");
  const dots = v
    .map((vis, i) => (vis.wellbeing == null ? "" : `<circle cx="${xs[i]}" cy="${fy(vis.wellbeing)}" r="4.5" class="feel-dot"/>`))
    .join("");
  const lastScored = [...v].reverse().find((vis) => vis.wellbeing != null);
  const lastLabel = lastScored
    ? `<text x="${x(lastScored.date) + 9}" y="${fy(lastScored.wellbeing) + 4}" class="direct">${lastScored.wellbeing}/10</text>`
    : "";

  // --- Medicine count bars ---
  const counts = r.timeline.counts.map((c) => c.total);
  const maxC = Math.max(4, ...counts);
  const top = TOP + FEEL_H + GAP;
  const my = (n) => top + MEDS_H - (n / maxC) * (MEDS_H - 8);
  const minGap = xs.length > 1 ? Math.min(...xs.slice(1).map((xx, i) => xx - xs[i])) : 40;
  const bw = Math.max(6, Math.min(22, minGap - 6));
  const bars = counts
    .map((n, i) => {
      const y = my(n);
      const h = top + MEDS_H - y;
      if (h <= 0) return "";
      // 4px rounded top, square at the baseline
      const rr = Math.min(4, h, bw / 2);
      const x0 = xs[i] - bw / 2;
      const x1 = xs[i] + bw / 2;
      const yb = top + MEDS_H;
      return `<path class="med-bar" d="M${x0},${yb}V${y + rr}Q${x0},${y} ${x0 + rr},${y}H${x1 - rr}Q${x1},${y} ${x1},${y + rr}V${yb}Z"/>`;
    })
    .join("");
  const lastCount = `<text x="${xs[xs.length - 1] + bw / 2 + 6}" y="${my(counts[counts.length - 1]) + 4}" class="direct">${counts[counts.length - 1]}</text>`;
  const base = `<line x1="${PAD_L}" x2="${W - PAD_R}" y1="${top + MEDS_H}" y2="${top + MEDS_H}" class="axis"/>`;
  const medTicks = [0, maxC]
    .map((g) => `<text x="${PAD_L - 8}" y="${my(g) + 4}" class="tick" text-anchor="end">${g}</text>`)
    .join("");

  // --- Shared date axis: first and last labels only, to avoid collisions ---
  const ay = top + MEDS_H + 16;
  const axis = `<text x="${xs[0]}" y="${ay}" class="tick" text-anchor="start">${dateLabel(v[0].date, r.datesShifted)}</text>
    <text x="${xs[xs.length - 1]}" y="${ay}" class="tick" text-anchor="end">${dateLabel(v[v.length - 1].date, r.datesShifted)}</text>`;

  // --- Hover targets: one column per visit, wider than the marks ---
  const H = top + MEDS_H + AXIS_H;
  const bounds = xs.map((xx, i) => {
    const l = i === 0 ? PAD_L - 10 : (xs[i - 1] + xx) / 2;
    const rgt = i === xs.length - 1 ? W - PAD_R + 10 : (xx + xs[i + 1]) / 2;
    return [l, rgt];
  });
  const hits = v
    .map((vis, i) => {
      const tip = `${dateLabel(vis.date, r.datesShifted)}|Feeling: ${vis.wellbeing ?? "not recorded"}${vis.wellbeing != null ? "/10" : ""}|Medicines: ${counts[i]}`;
      return `<rect class="hit" x="${bounds[i][0]}" width="${bounds[i][1] - bounds[i][0]}" y="${TOP}" height="${top + MEDS_H - TOP}" data-x="${xs[i]}" data-tip="${tip}" tabindex="0" aria-label="${tip.replace(/\|/g, ", ")}"/>`;
    })
    .join("");

  return `<div class="chart-wrap">
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Feeling score and number of medicines at each visit. The same numbers are in the timeline table below.">
      <text x="0" y="13" class="ctitle">How they felt (1–10)</text>
      <text x="0" y="${top - 10}" class="ctitle">Number of medicines</text>
      ${grid}${path}${dots}${lastLabel}
      ${base}${medTicks}${bars}${lastCount}
      ${axis}
      <line class="cross" x1="0" x2="0" y1="${TOP}" y2="${top + MEDS_H}" visibility="hidden"/>
      ${hits}
    </svg>
    <div class="chart-tip" hidden></div>
  </div>`;
}

export function attachChartHover(root) {
  const wrap = root.querySelector(".chart-wrap");
  if (!wrap) return;
  const svg = wrap.querySelector("svg");
  const tip = wrap.querySelector(".chart-tip");
  const cross = svg.querySelector(".cross");
  const show = (rect) => {
    const [d, a, b] = rect.dataset.tip.split("|");
    tip.innerHTML = `<b>${d}</b><br/>${a}<br/>${b}`;
    tip.hidden = false;
    const xPx = (Number(rect.dataset.x) / W) * svg.clientWidth;
    const left = Math.min(Math.max(0, xPx - 70), svg.clientWidth - 140);
    tip.style.left = `${left}px`;
    cross.setAttribute("x1", rect.dataset.x);
    cross.setAttribute("x2", rect.dataset.x);
    cross.setAttribute("visibility", "visible");
  };
  const hide = () => {
    tip.hidden = true;
    cross.setAttribute("visibility", "hidden");
  };
  svg.querySelectorAll(".hit").forEach((h) => {
    h.addEventListener("mouseenter", () => show(h));
    h.addEventListener("focus", () => show(h));
    h.addEventListener("click", () => show(h));
    h.addEventListener("mouseleave", hide);
    h.addEventListener("blur", hide);
  });
}
