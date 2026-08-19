import type { Options } from "canvas-confetti";

type ConfettiFire = (options?: Options) => void;

const canvases = new WeakMap<HTMLElement, HTMLCanvasElement>();
const fires = new WeakMap<HTMLCanvasElement, Promise<ConfettiFire>>();

function getConfettiRoot(element: HTMLElement | null): HTMLElement {
  return (
    element?.closest<HTMLElement>("[data-confetti-root]") ??
    document.querySelector<HTMLElement>("[data-confetti-root]") ??
    document.body
  );
}

function getOrCreateCanvas(root: HTMLElement): HTMLCanvasElement {
  const existing = canvases.get(root);
  if (existing?.isConnected) return existing;

  const canvas = document.createElement("canvas");
  canvas.dataset.confettiCanvas = "";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "40",
  });
  root.appendChild(canvas);
  canvases.set(root, canvas);
  return canvas;
}

function originOnCanvas(
  canvas: HTMLCanvasElement,
  element: HTMLElement | null,
  fallbackY: number,
): { x: number; y: number } {
  const canvasRect = canvas.getBoundingClientRect();
  if (!element || canvasRect.width === 0 || canvasRect.height === 0) {
    return { x: 0.5, y: fallbackY };
  }
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2 - canvasRect.left) / canvasRect.width,
    y: (rect.top + rect.height / 2 - canvasRect.top) / canvasRect.height,
  };
}

async function getFire(canvas: HTMLCanvasElement): Promise<ConfettiFire> {
  const cached = fires.get(canvas);
  if (cached) return cached;

  const pending = import("canvas-confetti").then((mod) =>
    mod.default.create(canvas, { resize: true, useWorker: false }),
  );
  fires.set(canvas, pending);
  return pending;
}

export function burstConfettiFromElement(
  element: HTMLElement | null,
  run: (fire: ConfettiFire, origin: { x: number; y: number }) => void,
  fallbackY = 0.4,
) {
  void (async () => {
    const root = getConfettiRoot(element);
    const canvas = getOrCreateCanvas(root);
    const fire = await getFire(canvas);
    run(fire, originOnCanvas(canvas, element, fallbackY));
  })();
}
