"use client";

import { useEffect, useRef } from "react";

/**
 * Graphite, literally: two AB-stacked honeycomb sheets of carbon. The cursor
 * bends the top sheet and lights its bonds in steel; the lower sheet drifts in
 * parallax. An idle "pencil stroke" glint sweeps across when nobody is moving.
 */

type Node = { x: number; y: number; ox: number; oy: number; vx: number; vy: number; glow: number };

function buildSheet(w: number, h: number, size: number, shiftX = 0, shiftY = 0) {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  const key = new Map<string, number>();
  const hexW = Math.sqrt(3) * size;
  const rowH = 1.5 * size;
  const cols = Math.ceil(w / hexW) + 3;
  const rows = Math.ceil(h / rowH) + 3;

  const vid = (x: number, y: number) => {
    const k = `${Math.round(x * 10)}:${Math.round(y * 10)}`;
    let id = key.get(k);
    if (id === undefined) {
      id = nodes.length;
      key.set(k, id);
      nodes.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, glow: 0 });
    }
    return id;
  };
  const edgeKey = new Set<string>();

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * hexW + (r % 2 ? hexW / 2 : 0) + shiftX;
      const cy = r * rowH + shiftY;
      const ids: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        ids.push(vid(cx + size * Math.cos(a), cy + size * Math.sin(a)));
      }
      for (let i = 0; i < 6; i++) {
        const a = ids[i];
        const b = ids[(i + 1) % 6];
        const k = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!edgeKey.has(k)) {
          edgeKey.add(k);
          edges.push([a, b]);
        }
      }
    }
  }
  return { nodes, edges };
}

export function Lattice({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let size = 30;
    let top = buildSheet(0, 0, size);
    let under = buildSheet(0, 0, size);
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false, last: 0 };
    let raf = 0;
    let visible = true;
    let t0 = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = w < 640 ? 22 : 30;
      top = buildSheet(w, h, size);
      // AB stacking: the second sheet is offset by one bond length.
      under = buildSheet(w, h, size, 0, size);
      if (reduce) draw(performance.now());
    };

    const RADIUS = 170;

    const step = (now: number) => {
      const t = (now - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.18;
      pointer.y += (pointer.ty - pointer.y) * 0.18;
      const idle = now - pointer.last > 2600;

      // idle glint: a diagonal band sweeping every ~7s
      const sweep = ((t % 7) / 7) * (w + h) * 1.4 - h * 0.4;

      for (const n of top.nodes) {
        let fx = 0;
        let fy = 0;
        let g = 0;
        if (pointer.active) {
          const dx = n.ox - pointer.x;
          const dy = n.oy - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < RADIUS) {
            const f = 1 - d / RADIUS;
            const ease = f * f;
            fx += (dx / (d || 1)) * ease * 26;
            fy += (dy / (d || 1)) * ease * 26;
            g = Math.max(g, ease);
          }
        }
        if (idle || !pointer.active) {
          const band = Math.abs(n.ox + n.oy - sweep);
          if (band < 120) g = Math.max(g, (1 - band / 120) * 0.55);
        }
        // spring toward rest + pointer push
        const ax = (n.ox + fx - n.x) * 0.09;
        const ay = (n.oy + fy - n.y) * 0.09;
        n.vx = (n.vx + ax) * 0.78;
        n.vy = (n.vy + ay) * 0.78;
        n.x += n.vx;
        n.y += n.vy;
        n.glow += (g - n.glow) * 0.12;
      }
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const px = pointer.active ? (pointer.x / w - 0.5) * -14 : 0;
      const py = pointer.active ? (pointer.y / h - 0.5) * -10 : 0;

      // lower sheet: faint, parallax only
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(243,241,236,0.035)";
      ctx.beginPath();
      for (const [a, b] of under.edges) {
        const na = under.nodes[a];
        const nb = under.nodes[b];
        ctx.moveTo(na.x + px, na.y + py);
        ctx.lineTo(nb.x + px, nb.y + py);
      }
      ctx.stroke();

      // top sheet: base bonds in one pass
      ctx.strokeStyle = "rgba(243,241,236,0.075)";
      ctx.beginPath();
      for (const [a, b] of top.edges) {
        const na = top.nodes[a];
        const nb = top.nodes[b];
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
      }
      ctx.stroke();

      // lit bonds
      for (const [a, b] of top.edges) {
        const na = top.nodes[a];
        const nb = top.nodes[b];
        const g = (na.glow + nb.glow) / 2;
        if (g < 0.04) continue;
        ctx.strokeStyle = `rgba(167,190,224,${Math.min(0.85, g * 0.95)})`;
        ctx.lineWidth = 1 + g * 0.8;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }

      // atoms
      for (const n of top.nodes) {
        const g = n.glow;
        const r = 1 + g * 1.8;
        ctx.fillStyle = g > 0.04 ? `rgba(214,226,243,${0.18 + g * 0.8})` : "rgba(243,241,236,0.14)";
        ctx.fillRect(n.x - r / 2, n.y - r / 2, r, r);
      }
      void now;
    };

    const loop = (now: number) => {
      if (visible) {
        step(now);
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointer.tx = x;
      pointer.ty = y;
      if (inside && !pointer.active) {
        pointer.x = x;
        pointer.y = y;
      }
      pointer.active = inside;
      pointer.last = performance.now();
    };
    const onLeave = () => {
      pointer.active = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    if (!reduce) {
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    } else {
      draw(performance.now());
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
