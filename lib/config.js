// ─────────────────────────────────────────────────────────────────────────────
// HUB SETTINGS: the one place to change emails, addresses, and collection names.
// ─────────────────────────────────────────────────────────────────────────────

// Google accounts allowed to sign in. Keep this in sync with isOwner() in
// firestore.rules. The rules are what actually protect the data; this list
// just shows a friendly "not allowed" screen to anyone else.
export const ALLOWED_EMAILS = ["paul@hometownharvestllc.com", "paul.r.schaefer11@gmail.com"];

// Farm address: the start and end of every delivery route.
export const FARM_ADDRESS = "5185 Zeeb Rd, Dexter, MI 48130";
export const PICKUP_NOTE = "Garden pickup at 5185 Zeeb Rd. Bag goes in the box truck.";

// Collections in the main project (csa-registration-1ed70), written by the website.
export const ORDERS_COLLECTION = "Orders";
export const INVENTORY_COLLECTION = "Inventory";

// CSA member collections, newest first. Add "2027 Members" here next year.
export const MEMBER_COLLECTIONS = ["2026 Members"];

// Only orders with this status are packed. The website sets it once Stripe confirms payment.
export const PAID_STATUS = "paid";

// Climate data from the Raspberry Pis. Each one writes:
//   <collection>/live-climate          (latest reading)
//   <collection>/set-climate           (target temperature; germination only)
//   <collection>/history/log/<auto-id> ({ timestamp, temperature, humidity? })
export const CLIMATE_SOURCES = {
  germination: { collection: "germination", title: "Germination Chamber", hasSetpoint: true },
  greenhouse: { collection: "greenhouse", title: "Greenhouse", hasSetpoint: false },
};
