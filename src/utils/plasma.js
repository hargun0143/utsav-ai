const VERTEX_SOURCE = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), s.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), s.x),
    s.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = turn * p * 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  p += (u_pointer - 0.5) * 0.18;
  float t = u_time * 0.035;

  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p * 1.4 + 3.0 * q + vec2(1.7, 9.2) + t),
    fbm(p * 1.4 + 3.0 * q + vec2(8.3, 2.8) - t)
  );
  float f = fbm(p * 1.4 + 3.0 * r);

  float ridge = 1.0 - abs(2.0 * f - 1.0);
  float vein = pow(ridge, 7.0);
  float haze = pow(ridge, 2.0);

  vec3 base = vec3(0.051, 0.047, 0.043);
  vec3 marigold = vec3(0.949, 0.655, 0.231);
  vec3 pink = vec3(0.878, 0.271, 0.482);
  vec3 teal = vec3(0.169, 0.702, 0.639);

  vec3 tint = mix(pink, teal, smoothstep(0.35, 0.75, r.y));
  tint = mix(tint, marigold, smoothstep(0.4, 0.8, q.x));

  vec3 color = base + tint * (vein * 0.26 + haze * 0.04);

  float edge = length((uv - 0.5) * vec2(1.1, 1.0));
  color *= mix(1.0, 0.45, smoothstep(0.35, 0.85, edge));

  gl_FragColor = vec4(color, 1.0);
}
`

const RENDER_SCALE = 0.5
const FRAME_INTERVAL = 1000 / 30
const STILL_TIME = 40

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE)
  if (!vertex || !fragment) return null

  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  gl.deleteProgram(program)
  return null
}

/**
 * Initializes and renders a full-screen WebGL plasma shader background animation.
 * @param {HTMLCanvasElement} canvas - Target canvas element to render into.
 * @returns {function(): void} Cleanup function to stop animation and release WebGL resources.
 */
export function startPlasma(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  })
  if (!gl) return () => {}

  const program = createProgram(gl)
  if (!program) return () => {}
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const uResolution = gl.getUniformLocation(program, 'u_resolution')
  const uTime = gl.getUniformLocation(program, 'u_time')
  const uPointer = gl.getUniformLocation(program, 'u_pointer')

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 }
  const origin = performance.now()
  let frame = 0
  let lastDraw = 0

  const draw = (seconds) => {
    const width = Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE))
    const height = Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    gl.uniform2f(uResolution, width, height)
    gl.uniform1f(uTime, seconds)
    gl.uniform2f(uPointer, pointer.x, pointer.y)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const isHidden = () => document.hidden || getComputedStyle(canvas).visibility === 'hidden'

  const tick = (now) => {
    frame = requestAnimationFrame(tick)
    if (now - lastDraw < FRAME_INTERVAL) return
    lastDraw = now
    if (isHidden()) return
    pointer.x += (pointer.targetX - pointer.x) * 0.05
    pointer.y += (pointer.targetY - pointer.y) * 0.05
    draw((now - origin) / 1000)
  }

  const run = () => {
    cancelAnimationFrame(frame)
    if (reducedMotion.matches) {
      draw(STILL_TIME)
    } else {
      frame = requestAnimationFrame(tick)
    }
  }

  const onPointerMove = (event) => {
    pointer.targetX = event.clientX / window.innerWidth
    pointer.targetY = 1 - event.clientY / window.innerHeight
  }

  const onContextLost = (event) => {
    event.preventDefault()
    cancelAnimationFrame(frame)
  }

  const resizeObserver = new ResizeObserver(() => {
    if (reducedMotion.matches) draw(STILL_TIME)
  })

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  canvas.addEventListener('webglcontextlost', onContextLost)
  reducedMotion.addEventListener('change', run)
  resizeObserver.observe(canvas)
  run()

  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    reducedMotion.removeEventListener('change', run)
    resizeObserver.disconnect()
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
  }
}