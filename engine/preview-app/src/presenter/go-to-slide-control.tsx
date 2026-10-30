import { useState } from "react";

/** Jump to a slide by typing its number or picking it by title. */
export function GoToSlideControl({ index, onJump, titles }: {
  index: number;
  onJump: (index: number) => void;
  titles: string[];
}) {
  const [typed, setTyped] = useState("");
  const submit = () => {
    const target = Number.parseInt(typed, 10);
    if (Number.isFinite(target)) onJump(target - 1);
    setTyped("");
  };

  return <span className="present-goto" role="group" aria-label="Go to slide">
    Go to
    <input aria-label="Slide number" inputMode="numeric" onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="#" size={3} value={typed} />
    <select aria-label="Slide by title" onChange={(e) => onJump(Number(e.target.value))} value={index}>
      {titles.map((title, i) => <option key={i} value={i}>{i + 1} · {title}</option>)}
    </select>
  </span>;
}
