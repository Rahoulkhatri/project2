/**
 * One shared pointer, read per frame by the cursor and the camera rig.
 * The canvas sits under the HTML overlay, so R3F's own pointer never sees
 * moves; this listens on window instead.
 */
export const pointer = {
  /** Client pixels. */
  x: -100,
  y: -100,
  /** Normalised, -1..1, +y up. */
  nx: 0,
  ny: 0,
  moved: false,
};

let bound = false;

export function bindPointer() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.moved = true;
    },
    { passive: true },
  );
}
