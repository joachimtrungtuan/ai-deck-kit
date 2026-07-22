import type { TableBlockData } from "./contracts";
import { BlockShell } from "./block-shell";

export function TableBlock({ block }: { block: TableBlockData }) {
  return <BlockShell block={block} className="primitive-table-block"><table>{block.caption ? <caption>{block.caption}</caption> : null}<thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={`${block.id}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${block.id}-${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></BlockShell>;
}
