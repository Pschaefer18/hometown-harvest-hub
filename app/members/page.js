"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MEMBER_COLLECTIONS } from "@/lib/config";
import { mapsSearchUrl } from "@/lib/orders";

const isDelivery = (m) => m.csaSelection === "homeDelivery";
const shareLabel = (m) => (m.csaShareSize === "half" ? "Half share" : "Full share");

export default function MembersPage() {
  const [collectionName, setCollectionName] = useState(MEMBER_COLLECTIONS[0]);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setMembers(null);
    return onSnapshot(
      collection(db, collectionName),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
        setMembers(list);
      },
      (err) => setError(err.code === "permission-denied" ? "No permission to read members. Have the Firestore rules been published?" : err.message)
    );
  }, [collectionName]);

  const togglePaid = async (member) => {
    try {
      await updateDoc(doc(db, collectionName, member.id), { paymentReceived: !member.paymentReceived });
    } catch (err) {
      alert(`Couldn't update payment: ${err.message}`);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!members) return <p className="muted">Loading members…</p>;

  const term = search.trim().toLowerCase();
  const shown = members.filter((m) => {
    if (filter === "unpaid" && m.paymentReceived) return false;
    if (filter === "delivery" && !isDelivery(m)) return false;
    if (filter === "pickup" && isDelivery(m)) return false;
    if (!term) return true;
    return [m.firstName, m.lastName, m.email, m.secondEmail, m.phone, m.address, m.city]
      .some((v) => String(v || "").toLowerCase().includes(term));
  });

  const unpaid = members.filter((m) => !m.paymentReceived);
  const outstanding = unpaid.reduce((sum, m) => sum + (Number(m.amountDue) || 0), 0);

  return (
    <>
      <div className="stats">
        <Stat label="Members" value={members.length} />
        <Stat label="Full / half" value={`${members.filter((m) => m.csaShareSize !== "half").length} / ${members.filter((m) => m.csaShareSize === "half").length}`} />
        <Stat label="Delivery / pickup" value={`${members.filter(isDelivery).length} / ${members.filter((m) => !isDelivery(m)).length}`} />
        <Stat label="Unpaid" value={`${unpaid.length} · $${outstanding.toLocaleString()}`} />
      </div>

      <div className="toolbar">
        {MEMBER_COLLECTIONS.length > 1 && (
          <select value={collectionName} onChange={(e) => setCollectionName(e.target.value)}>
            {MEMBER_COLLECTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <input type="search" placeholder="Search name, email, address…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="unpaid">Unpaid</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      {shown.length === 0 && <p className="empty">No members match.</p>}
      <div className="order-list">
        {shown.map((m) => {
          const address = [m.address, m.city, m.zipCode].filter(Boolean).join(", ");
          return (
            <article key={m.id} className="card">
              <div className="order-head">
                <h3>{m.firstName} {m.lastName}</h3>
                <span className={`pill pill-${isDelivery(m) ? "delivery" : "pickup"}`}>
                  {isDelivery(m) ? "Delivery" : "Pickup"}
                </span>
              </div>
              <p className="small">
                {shareLabel(m)}{m.returningMember ? " · Returning" : " · New"}
                {m.time?.toDate && <span className="muted"> · Signed up {m.time.toDate().toLocaleDateString()}</span>}
              </p>
              <p className="small">
                {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
                {m.secondEmail && <> · <a href={`mailto:${m.secondEmail}`}>{m.secondEmail}</a></>}
                {m.phone && <> · <a href={`tel:${m.phone}`}>{m.phone}</a></>}
              </p>
              {address && (
                <p className="small">
                  <a href={mapsSearchUrl(`${address}, MI`)} target="_blank" rel="noreferrer">{address}</a>
                </p>
              )}
              <label className="toggle">
                <input type="checkbox" checked={!!m.paymentReceived} onChange={() => togglePaid(m)} />
                <span>Payment received{m.amountDue ? ` ($${m.amountDue})` : ""}</span>
              </label>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
