"use server";

import { lookup } from "../lib/search";

export async function performLookup(term: string) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return lookup(term);
}
