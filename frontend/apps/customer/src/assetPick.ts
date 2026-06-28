/**
 * Tiny hand-off channel for returning a just-created asset id from the
 * `/assets/new` screen back to whatever pushed it (e.g. the new-request wizard).
 * expo-router has no native return-value API, so the create screen sets the id
 * and the opener consumes it once on focus.
 */
let created: number | null = null;

export const setCreatedAsset = (id: number) => {
  created = id;
};

/** Read and clear the pending created-asset id (null when nothing is pending). */
export const takeCreatedAsset = (): number | null => {
  const v = created;
  created = null;
  return v;
};
