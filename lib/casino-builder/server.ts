import { notFound } from "next/navigation";

import { casinoService, NotFoundError } from "@/lib/services";

export async function loadCasinoBuilderData(casinoId: string) {
  try {
    return await casinoService.getBuilderData(casinoId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
