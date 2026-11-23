// Avatar slots as the backend names them (backend/src/lib/avatarSlots.ts). Every slot is an avatar_state column `<slot>_item_id`,
// and the avatar endpoints return `<slot>_name`, `<slot>_thumbnail` and `<slot>_asset_id` next to it.

export const AVATAR_SLOT_LABELS: Record<string, string> = {
  hat: "Hat",
  ears: "Ears",
  headphones: "Headphones",
  hair: "Hair",
  face: "Face",
  head: "Head",
  shirt: "Shirt",
  pants: "Pants",
  body: "Body",
  accessory: "Face accessory",
  accessory_2: "Neck",
  back: "Back",
  front: "Front",
  shoulder: "Shoulder",
  waist: "Waist",
  accessory_3: "Accessory",
};

/** Order of the "Currently Wearing" tiles. accessory_3 is the legacy "other" slot, so it comes last. */
export const WEARING_SLOT_ORDER = [
  "hat", "ears", "headphones", "hair", "face", "head", "shirt", "pants", "body",
  "accessory", "accessory_2", "back", "front", "shoulder", "waist", "accessory_3",
] as const;

/** The data the avatar endpoints return for a slot: the catalog item id, thumbnail and name (any of which may be absent). */
export interface WornSlot {
  slot: string;
  label: string;
  itemId: string | null;
  thumb: string;
  name: string | null;
}

/** Everything the avatar is wearing that has a thumbnail, in tile order, from an `avatarState` row. */
export function wornSlots(state: Record<string, unknown> | null | undefined): WornSlot[] {
  if (!state) return [];
  const worn: WornSlot[] = [];
  for (const slot of WEARING_SLOT_ORDER) {
    const thumb = state[`${slot}_thumbnail`];
    if (typeof thumb !== "string" || !thumb) continue;
    const itemId = state[`${slot}_item_id`];
    const name = state[`${slot}_name`];
    worn.push({
      slot,
      label: AVATAR_SLOT_LABELS[slot] ?? slot,
      itemId: typeof itemId === "string" ? itemId : itemId ? String(itemId) : null,
      thumb,
      name: typeof name === "string" ? name : null,
    });
  }
  return worn;
}
