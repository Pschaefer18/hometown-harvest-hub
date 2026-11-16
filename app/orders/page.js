"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ORDERS_COLLECTION, PAID_STATUS, PICKUP_NOTE } from "@/lib/config";
import {
  addressLine,
  customerName,
  defaultWeek,
  formatAmount,
  formatMoney,
  groupBySlot,
  mapsSearchUrl,
  orderWeekKey,
  packTotals,
  sizeLine,
  weekLabel,
  weekOptions,
} from "@/lib/orders";

// Paid orders are packed. Unpaid ones still in checkout are only counted as a heads-up.
const STATUSES = [PAID_STATUS, "pending_payment", "payment_processing"];

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [week, setWeek] = useState(null);

  // Live: new and updated orders appear without reloading.
  useEffect(() => {
    const q = query(collection(db, ORDERS_COLLECTION), where("status", "in", STATUSES));
    return onSnapshot(
      q,
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((o) => !o.deletedAt)),
      (err) => setError(err.code === "permission-denied" ? "No permission to read orders. Have the Firestore rules been published?" : err.message)
    );
  }, []);

  const weeks = useMemo(() => (orders ? weekOptions(orders) : []), [orders]);
  const selectedWeek = week || (orders ? defaultWeek(orders) : null);

  const weekOrders = useMemo(
    () => (orders || []).filter((o) => orderWeekKey(o) === selectedWeek),
    [orders, selectedWeek]
  );
  const paid = weekOrders.filter((o) => o.status === PAID_STATUS);
  const unpaidCount = weekOrders.length - paid.length;
  const slots = groupBySlot(paid);

  if (error) return <p className="error">{error}</p>;
  if (!orders) return <p className="muted">Loading orders…</p>;

  return (
    <>
      <div className="toolbar">
        <label className="field">
          <span>Order week</span>
          <select value={selectedWeek} onChange={(e) => setWeek(e.target.value)}>
            {weeks.map((w) => (
              <option key={w} value={w}>{weekLabel(w)}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="muted small">
        {paid.length} paid order{paid.length === 1 ? "" : "s"}. Orders belong to the delivery or pickup day the customer chose;
        the website closes each day at its own cutoff.
      </p>
      {unpaidCount > 0 && (
        <p className="notice">
          {unpaidCount} more order{unpaidCount === 1 ? " is" : "s are"} still in checkout or clearing payment and{" "}
          {unpaidCount === 1 ? "isn't" : "aren't"} counted yet.
        </p>
      )}

      {slots.length === 0 && <p className="empty">No paid orders this week.</p>}

      {/* 1. Pack list: totals per day */}
      {slots.length > 0 && <h2>Pack list</h2>}
      <div className="grid-2">
        {slots.map((slot) => (
          <section key={slot.optionId} className="card">
            <h3>
              <span className={`pill pill-${slot.method}`}>{slot.method === "delivery" ? "Delivery" : "Pickup"}</span>{" "}
              {slot.dateLabel}
            </h3>
            <p className="muted small">{slot.orders.length} order{slot.orders.length === 1 ? "" : "s"}</p>
            <table className="pack-table">
              <tbody>
                {packTotals(slot.orders).map((p) => (
                  <tr key={p.productId}>
                    <td>
                      <strong>{p.productName}</strong>
                      <div className="muted small">{p.sizes.map((s) => sizeLine(s, p.unit)).join(" · ")}</div>
                    </td>
                    <td className="num">{formatAmount(p.total, p.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      {/* 2. Per-customer view */}
      {slots.map((slot) => (
        <section key={slot.optionId}>
          <h2>
            {slot.method === "delivery" ? "Delivery" : "Pickup"}: {slot.dateLabel}
          </h2>
          <div className="order-list">
            {slot.orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function OrderCard({ order }) {
  const delivery = order.fulfillment?.method === "delivery";
  const address = addressLine(order.address);
  return (
    <article className="card order-card">
      <div className="order-head">
        <h3>{customerName(order)}</h3>
        <span className="muted small">{order.id}</span>
      </div>

      <ul className="items">
        {(order.items || []).map((item, i) => (
          <li key={i}>
            <span>{item.productName}</span>
            <strong>{sizeLine(item, item.unit)}</strong>
          </li>
        ))}
      </ul>

      {delivery ? (
        <p>
          <a href={mapsSearchUrl(address)} target="_blank" rel="noreferrer">{address}</a>
        </p>
      ) : (
        <p className="muted">{PICKUP_NOTE}</p>
      )}
      {order.notes && <p className="note">Note: {order.notes}</p>}
      <p className="muted small">
        {order.customer?.phone && <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>}
        {order.customer?.phone && " · "}
        Paid {formatMoney(order.amountPaid ?? order.total)}
      </p>
    </article>
  );
}
