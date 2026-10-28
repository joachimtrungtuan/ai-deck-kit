import { useEffect, useRef, useState } from "react";
import { runtimeDeckExportUrl } from "virtual:aideck-deck";
import type { PreviewSource } from "../preview-types";
import { MirrorFrame, type MirrorSourceKind } from "./mirror-frame";
import { isFresh, openPresenterChannel, type PresenterChannel, type ScreenMode } from "./presenter-channel";
import { readResumeIndex } from "./presenter-resume";

/**
 * The window projected to the audience: only the slide, mirrored from the presenter. Black hides
 * the slide; frozen keeps the current one on screen and ignores moves until the presenter resumes.
 */
export function AudienceView({ kind, source }: { kind: MirrorSourceKind; source: PreviewSource }) {
  const total = source.slides.length;
  const [index, setIndex] = useState(() => readResumeIndex(localStorage, source.id, total));
  const [mode, setMode] = useState<ScreenMode>("live");
  const lastSeq = useRef(0);
  const latest = useRef({ index, mode });
  const held = useRef<number | null>(null);
  const channelRef = useRef<PresenterChannel | null>(null);
  latest.current = { index, mode };

  useEffect(() => {
    const clamp = (value: number) => Math.max(0, Math.min(total - 1, value));
    const channel = openPresenterChannel(source.id, (message) => {
      if (message.kind === "goto" || message.kind === "state") {
        if (!isFresh(lastSeq.current, message.seq)) return;
        lastSeq.current = message.seq;
        if (latest.current.mode === "frozen") { held.current = clamp(message.index); return; }
        setIndex(clamp(message.index));
      } else if (message.kind === "screen") {
        if (message.mode !== "frozen" && held.current !== null) { setIndex(held.current); held.current = null; }
        setMode(message.mode);
      }
    });
    channelRef.current = channel;
    channel.post({ kind: "hello" });
    return () => { channel.close(); channelRef.current = null; };
  }, [source.id, total]);

  return <main style={{ position: "fixed", inset: 0, background: "#000" }}>
    <MirrorFrame exportUrl={runtimeDeckExportUrl} index={index} kind={kind} source={source} />
    {mode === "black" && <div aria-hidden style={{ position: "absolute", inset: 0, background: "#000" }} />}
  </main>;
}
