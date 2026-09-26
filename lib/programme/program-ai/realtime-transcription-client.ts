import type { ProgrammeLocale } from "@/lib/programme/presentation";

const DELTA_EVENT = "conversation.item.input_audio_transcription.delta";
const COMPLETED_EVENT = "conversation.item.input_audio_transcription.completed";

export type ProgrammeRealtimeTranscriptEvent =
  | { type: "partial"; itemId: string; text: string }
  | { type: "final"; itemId: string; text: string }
  | { type: "error" };

export function parseProgrammeRealtimeTranscriptEvent(
  value: string,
): ProgrammeRealtimeTranscriptEvent | null {
  let event: unknown;
  try {
    event = JSON.parse(value);
  } catch {
    return null;
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const body = event as Record<string, unknown>;
  if (body.type === "error") return { type: "error" };
  if (typeof body.item_id !== "string") return null;
  if (body.type === DELTA_EVENT && typeof body.delta === "string") {
    return { type: "partial", itemId: body.item_id, text: body.delta };
  }
  if (body.type === COMPLETED_EVENT && typeof body.transcript === "string") {
    return { type: "final", itemId: body.item_id, text: body.transcript.trim() };
  }
  return null;
}

export type ProgrammeRealtimeTranscription = {
  commit: () => void;
  close: () => void;
  finalTranscript: Promise<string>;
};

export async function connectProgrammeRealtimeTranscription(input: {
  locale: ProgrammeLocale;
  stream: MediaStream;
  onPartial: (text: string) => void;
  requestHeaders?: HeadersInit;
  fetchImpl?: typeof fetch;
  peerConnection?: RTCPeerConnection;
}): Promise<ProgrammeRealtimeTranscription> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const peer = input.peerConnection ?? new RTCPeerConnection();
  const channel = peer.createDataChannel("programme-transcription-events");
  const partialByItem = new Map<string, string>();
  let settled = false;
  let resolveFinal!: (transcript: string) => void;
  let rejectFinal!: (error: Error) => void;
  const finalTranscript = new Promise<string>((resolve, reject) => {
    resolveFinal = resolve;
    rejectFinal = reject;
  });
  void finalTranscript.catch(() => undefined);
  const fail = () => {
    if (settled) return;
    settled = true;
    rejectFinal(new Error("REALTIME_TRANSCRIPTION_FAILED"));
  };

  channel.addEventListener("message", (message) => {
    if (typeof message.data !== "string") return;
    const event = parseProgrammeRealtimeTranscriptEvent(message.data);
    if (!event) return;
    if (event.type === "error") {
      fail();
      return;
    }
    if (event.type === "partial") {
      const partial = `${partialByItem.get(event.itemId) ?? ""}${event.text}`;
      partialByItem.set(event.itemId, partial);
      input.onPartial(partial);
      return;
    }
    if (!event.text || settled) {
      if (!event.text) fail();
      return;
    }
    settled = true;
    resolveFinal(event.text);
  });
  channel.addEventListener("error", fail);
  input.stream.getTracks().forEach((track) => peer.addTrack(track, input.stream));

  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    if (!offer.sdp) throw new Error("REALTIME_SDP_UNAVAILABLE");
    const requestHeaders = new Headers(input.requestHeaders);
    requestHeaders.set("content-type", "application/sdp");
    const response = await fetchImpl(
      `/api/program/program-ai/transcription/realtime?locale=${encodeURIComponent(input.locale)}`,
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: requestHeaders,
        body: offer.sdp,
      },
    );
    if (!response.ok) throw new Error("REALTIME_SESSION_UNAVAILABLE");
    const answerSdp = await response.text();
    await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
    if (channel.readyState !== "open") {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("REALTIME_CHANNEL_TIMEOUT")), 5_000);
        channel.addEventListener("open", () => {
          window.clearTimeout(timer);
          resolve();
        }, { once: true });
        channel.addEventListener("error", () => {
          window.clearTimeout(timer);
          reject(new Error("REALTIME_CHANNEL_FAILED"));
        }, { once: true });
      });
    }
    return {
      commit: () => channel.send(JSON.stringify({ type: "input_audio_buffer.commit" })),
      close: () => {
        channel.close();
        peer.close();
      },
      finalTranscript,
    };
  } catch (error) {
    settled = true;
    peer.close();
    // The promise is not returned on setup failure, so settle it to avoid an orphan rejection.
    resolveFinal("");
    throw error;
  }
}
