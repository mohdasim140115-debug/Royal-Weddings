import "server-only";
import { revalidatePath } from "next/cache";

/** Refresh cached public pages after an admin changes catalogue data. */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
}
