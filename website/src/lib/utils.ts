// Minimal class-name combiner. Mirrors the shadcn/ui `cn` utility but
// without the `clsx`/`tailwind-merge` deps (kept lean for v1).
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const push = (v: ClassValue): void => {
    if (!v && v !== 0) return;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(push);
      return;
    }
    if (typeof v === 'object') {
      for (const k of Object.keys(v)) {
        if (v[k]) out.push(k);
      }
    }
  };
  inputs.forEach(push);
  return out.join(' ');
}
