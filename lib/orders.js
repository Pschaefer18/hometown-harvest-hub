// Pure helpers for working with website orders (no Firebase calls here).
//
// Every order belongs to the delivery/pickup slot the customer chose, e.g.
// fulfillment.optionId = "delivery-2026-11-17". The website closes each slot at
// its own cutoff (orderCutoff in the site's orderConfig.js), so there's no
// separate cutoff rule here: an order's week is simply the Monday–Sunday week
// containing its slot date.

const pad = (n) => String(n).padStart(2, "0");

// "2026-11-17" → local Date (midnight), avoiding UTC day shifts.
function parseDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const toDayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// The date the order is delivered or picked up, or null if it can't be read.
export function fulfillmentDate(order) {
  const match = /(\d{4}-\d{2}-\d{2})$/.exec(order?.fulfillment?.optionId || "");
  return match ? parseDay(match[1]) : null;
}

// Monday of the week containing `date`, as "YYYY-MM-DD".
export function weekKeyFor(date) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDayKey(monday);
}

export function orderWeekKey(order) {
  const date = fulfillmentDate(order);
  return date ? weekKeyFor(date) : null;
}

// "Nov 16 – Nov 22, 2026"
export function weekLabel(weekKey) {
  const start = parseDay(weekKey);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

// Weeks that have orders plus the current week, sorted oldest → newest.
export function weekOptions(orders, today = new Date()) {
  const keys = new Set(orders.map(orderWeekKey).filter(Boolean));
  keys.add(weekKeyFor(today));
  return [...keys].sort();
}

// Default week: the one with the next upcoming delivery/pickup, otherwise this week.
export function defaultWeek(orders, today = new Date()) {
  const startOfToday = parseDay(toDayKey(today));
  const upcoming = orders
    .map(fulfillmentDate)
    .filter((d) => d && d >= startOfToday)
    .sort((a, b) => a - b)[0];
  return weekKeyFor(upcoming || today);
}

// Splits a week's orders into one section per delivery/pickup slot, in date order:
// [{ optionId, method, date, dateLabel, timeLabel, orders: [...] }]
export function groupBySlot(orders) {
  const slots = new Map();
  for (const order of orders) {
    const f = order.fulfillment || {};
    const key = f.optionId || "unknown";
    if (!slots.has(key)) {
      slots.set(key, {
        optionId: key,
        method: f.method,
        date: fulfillmentDate(order),
        dateLabel: f.date || "Unknown date",
        timeLabel: f.time || "",
        orders: [],
      });
    }
    slots.get(key).orders.push(order);
  }
  for (const slot of slots.values()) slot.orders.sort(byCustomerName);
  return [...slots.values()].sort((a, b) => (a.date || 0) - (b.date || 0));
}

// Totals to bag for a set of orders, grouped by product:
// [{ productId, productName, unit, total, sizes: [{ sizeId, sizeLabel, amount, quantity }] }]
// `total` is in the product's unit (lb or heads).
export function packTotals(orders) {
  const products = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      if (!products.has(item.productId)) {
        products.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          unit: item.unit || "lb",
          total: 0,
          sizes: new Map(),
        });
      }
      const product = products.get(item.productId);
      const amount = item.amount ?? item.pounds ?? 1;
      product.total += amount * item.quantity;
      const size = product.sizes.get(item.sizeId) || { sizeId: item.sizeId, sizeLabel: item.sizeLabel, amount, quantity: 0 };
      size.quantity += item.quantity;
      product.sizes.set(item.sizeId, size);
    }
  }
  return [...products.values()]
    .map((p) => ({ ...p, sizes: [...p.sizes.values()].sort((a, b) => b.amount - a.amount) }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
}

const UNIT_PLURALS = { lb: "lb", head: "heads" };

// "35 lb", "1 head", "6 heads"
export function formatAmount(n, unit = "lb") {
  return `${n} ${n === 1 ? unit : UNIT_PLURALS[unit] || `${unit}s`}`;
}

// One size line on a pack list or order: "10 lb bag × 3" or "6 heads".
export function sizeLine({ sizeLabel, amount, quantity }, unit = "lb") {
  if (unit !== "lb" && amount === 1) return formatAmount(quantity, unit);
  return `${sizeLabel}${unit === "lb" ? " bag" : ""} × ${quantity}`;
}

export function customerName(order) {
  const c = order.customer || {};
  return `${c.firstName || ""} ${c.lastName || ""}`.trim() || "(no name)";
}

function byCustomerName(a, b) {
  const last = (o) => `${o.customer?.lastName || ""} ${o.customer?.firstName || ""}`.toLowerCase();
  return last(a).localeCompare(last(b));
}

// Address as one line. The website only delivers in Michigan, so MI is added.
export function addressLine(address) {
  if (!address) return "";
  const street = [address.street, address.unit].filter(Boolean).join(", ");
  return `${street}, ${address.city}, MI ${address.zipCode}`;
}

export function mapsSearchUrl(text) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

export const formatMoney = (n) => (typeof n === "number" ? `$${n.toFixed(2)}` : "");
