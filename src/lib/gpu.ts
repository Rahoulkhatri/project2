/**
 * Decides the post-processing tier once, before the canvas mounts. The composer's graph must not change
 * at runtime (adding or removing passes breaks its MSAA resolve), so quality is chosen up front from the
 * GPU renderer string, read from a throwaway context. No network, about a millisecond.
 */
const LOW_POWER = /intel\(r\)\s*(hd|uhd)|intel.*(hd|uhd) graphics|mali|adreno|powervr|apple gpu a\d|swiftshader|llvmpipe|software/i;

export function detectLowPowerGpu(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return LOW_POWER.test(renderer);
  } catch {
    return false;
  }
}
