// Helper function to create a shader
function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compilation error: ' + info);
  }
  
  return shader;
}

// Create a shader program from vertex and fragment sources
function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create program');
  }
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Program linking error: ' + info);
  }
  
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  
  return program;
}

// Vertex shader used by all programs
const baseVertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment shaders for each program
const fragmentShaders = {
  // Add velocity at a point
  addVelocity: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform vec2 point;
uniform vec2 value;
uniform float radius;

in vec2 vUv;
out vec2 fragColor;

void main() {
  vec2 p = vUv * vec2(textureSize(uVelocity, 0));
  vec2 velocity = texture(uVelocity, vUv).xy;
  float dist = length(p - point);
  
  if (dist < radius) {
    float influence = 1.0 - smoothstep(0.0, radius, dist);
    velocity += value * influence;
  }
  
  fragColor = velocity;
}
`,

  // Add density (color) at a point
  addDensity: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uDensity;
uniform vec2 point;
uniform vec4 value;
uniform float radius;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 p = vUv * vec2(textureSize(uDensity, 0));
  vec4 density = texture(uDensity, vUv);
  float dist = length(p - point);
  
  if (dist < radius) {
    float influence = 1.0 - smoothstep(0.0, radius, dist);
    density += value * influence;
  }
  
  fragColor = min(density, vec4(1.0));
}
`,

  // Apply gravity
  gravity: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform float gravity;

in vec2 vUv;
out vec2 fragColor;

void main() {
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.y -= gravity;
  fragColor = velocity;
}
`,

  // Compute vorticity
  vorticity: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform vec2 texelSize;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out float fragColor;

void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  
  float vorticity = R - L - T + B;
  fragColor = vorticity * 0.5;
}
`,

  // Apply vorticity confinement
  vorticityConfinement: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform sampler2D uVorticity;
uniform vec2 texelSize;
uniform float confinement;
uniform float dt;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec2 fragColor;

void main() {
  float L = abs(texture(uVorticity, vL).x);
  float R = abs(texture(uVorticity, vR).x);
  float T = abs(texture(uVorticity, vT).x);
  float B = abs(texture(uVorticity, vB).x);
  
  float C = abs(texture(uVorticity, vUv).x);
  
  vec2 force = vec2(0.0, 0.0);
  force.x = T - B;
  force.y = R - L;
  
  float lengthSquared = max(0.0001, dot(force, force));
  force = force * inversesqrt(lengthSquared);
  force *= confinement * C * vec2(1.0, -1.0);
  
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * dt;
  
  fragColor = velocity;
}
`,

  // Velocity diffusion
  diffuse: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform vec2 texelSize;
uniform float dt;
uniform float viscosity;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec2 fragColor;

void main() {
  vec2 L = texture(uVelocity, vL).xy;
  vec2 R = texture(uVelocity, vR).xy;
  vec2 T = texture(uVelocity, vT).xy;
  vec2 B = texture(uVelocity, vB).xy;
  vec2 C = texture(uVelocity, vUv).xy;
  
  float alpha = texelSize.x * texelSize.y / (viscosity * dt);
  float beta = 1.0 / (4.0 + alpha);
  
  fragColor = (L + R + B + T + alpha * C) * beta;
}
`,

  // Compute velocity divergence
  divergence: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform vec2 texelSize;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out float fragColor;

void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  
  float div = 0.5 * (R - L + T - B);
  fragColor = div;
}
`,

  // Clear texture to a value
  clear: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uTexture;
uniform float value;

in vec2 vUv;
out float fragColor;

void main() {
  fragColor = value;
}
`,

  // Pressure solver iteration
  pressure: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out float fragColor;

void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float C = texture(uPressure, vUv).x;
  float divergence = texture(uDivergence, vUv).x;
  
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = pressure;
}
`,

  // Apply pressure gradient to velocity
  gradientSubtract: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
uniform float scale;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec2 fragColor;

void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= scale * vec2(R - L, T - B);
  
  fragColor = velocity;
}
`,

  // Advection
  advect: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  vec4 result = texture(uSource, coord);
  fragColor = result * dissipation;
}
`,

  // Bloom downsampling
  bloomDownsample: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uTexture;
uniform vec2 texelSize;
uniform float threshold;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vUv);
  vec4 sum = color;
  
  // Box filter
  sum += texture(uTexture, vUv + vec2(texelSize.x, 0.0));
  sum += texture(uTexture, vUv - vec2(texelSize.x, 0.0));
  sum += texture(uTexture, vUv + vec2(0.0, texelSize.y));
  sum += texture(uTexture, vUv - vec2(0.0, texelSize.y));
  
  sum += texture(uTexture, vUv + texelSize);
  sum += texture(uTexture, vUv - texelSize);
  sum += texture(uTexture, vUv + vec2(texelSize.x, -texelSize.y));
  sum += texture(uTexture, vUv + vec2(-texelSize.x, texelSize.y));
  
  sum /= 9.0;
  
  // Apply threshold
  float brightness = max(sum.r, max(sum.g, sum.b));
  float soft = brightness - max(0.0, brightness - threshold);
  soft = soft * soft / (brightness + 0.00001);
  sum *= soft;
  
  fragColor = sum;
}
`,

  // Particle update
  particles: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uParticles;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
uniform vec2 viewportSize;
uniform float dt;
uniform float particleLife;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 particle = texture(uParticles, vUv);
  vec2 pos = particle.xy;
  
  // Normalized position for velocity lookup
  vec2 velCoord = pos / viewportSize;
  velCoord = clamp(velCoord, 0.0, 1.0);
  
  // Get velocity at particle position
  vec2 vel = texture(uVelocity, velCoord).xy * 10.0;
  
  // Update position
  pos += vel * dt;
  
  // Wrap around screen boundaries
  if (pos.x < 0.0) pos.x = viewportSize.x;
  if (pos.x > viewportSize.x) pos.x = 0.0;
  if (pos.y < 0.0) pos.y = viewportSize.y;
  if (pos.y > viewportSize.y) pos.y = 0.0;
  
  // Store velocity for rendering
  vec2 storedVel = vel;
  
  // Output updated particle
  fragColor = vec4(pos, storedVel);
}
`,

  // Final display with bloom and particles
  display: `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uDensity;
uniform sampler2D uBloom;
uniform sampler2D uParticles;
uniform float bloomIntensity;
uniform int particleCount;

in vec2 vUv;
out vec4 fragColor;

float circle(vec2 uv, vec2 center, float radius, float blur) {
  float d = length(uv - center);
  return smoothstep(radius, radius - blur, d);
}

void main() {
  vec4 density = texture(uDensity, vUv);
  vec4 bloom = texture(uBloom, vUv) * bloomIntensity;
  
  // Combine base image with bloom
  vec4 color = density + bloom;
  
  // Draw particles
  for (int i = 0; i < 1000; i++) {
    if (i >= particleCount) break;
    
    float t = float(i) / float(particleCount);
    vec4 particle = texelFetch(uParticles, ivec2(i, 0), 0);
    
    vec2 pos = particle.xy / vec2(textureSize(uDensity, 0));
    vec2 vel = particle.zw;
    
    float speed = length(vel) * 0.01;
    float size = mix(0.001, 0.003, speed);
    float brightness = mix(0.3, 1.0, speed);
    
    float c = circle(vUv, pos, size, size * 0.5);
    
    // Particle color based on velocity
    vec3 particleColor = mix(vec3(0.2, 0.4, 1.0), vec3(1.0, 0.4, 0.2), speed);
    
    color.rgb = mix(color.rgb, particleColor, c * brightness);
  }
  
  // Apply some gamma correction
  color = pow(color, vec4(0.8));
  
  // Ensure alpha blending works correctly
  color.a = max(color.r, max(color.g, color.b));
  
  fragColor = color;
}
`
};

export function createShaders(gl: WebGL2RenderingContext) {
  // Create quad vertices
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  
  // Create all shader programs
  const programs: Record<string, any> = {};
  
  for (const [name, fragmentSource] of Object.entries(fragmentShaders)) {
    const program = createProgram(gl, baseVertexShader, fragmentSource);
    
    // Set up attributes and uniforms
    const positionAttrib = gl.getAttribLocation(program, 'aPosition');
    
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
    
    // Get uniform locations
    const uniforms: Record<string, WebGLUniformLocation> = {};
    
    // Common uniforms
    const texelSizeLocation = gl.getUniformLocation(program, 'texelSize');
    if (texelSizeLocation) uniforms.texelSize = texelSizeLocation;
    
    // Program-specific uniforms
    switch (name) {
      case 'addVelocity':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.point = gl.getUniformLocation(program, 'point')!;
        uniforms.value = gl.getUniformLocation(program, 'value')!;
        uniforms.radius = gl.getUniformLocation(program, 'radius')!;
        break;
        
      case 'addDensity':
        uniforms.uDensity = gl.getUniformLocation(program, 'uDensity')!;
        uniforms.point = gl.getUniformLocation(program, 'point')!;
        uniforms.value = gl.getUniformLocation(program, 'value')!;
        uniforms.radius = gl.getUniformLocation(program, 'radius')!;
        break;
        
      case 'gravity':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.gravity = gl.getUniformLocation(program, 'gravity')!;
        break;
        
      case 'vorticity':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        break;
        
      case 'vorticityConfinement':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.uVorticity = gl.getUniformLocation(program, 'uVorticity')!;
        uniforms.confinement = gl.getUniformLocation(program, 'confinement')!;
        uniforms.dt = gl.getUniformLocation(program, 'dt')!;
        break;
        
      case 'diffuse':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.viscosity = gl.getUniformLocation(program, 'viscosity')!;
        uniforms.dt = gl.getUniformLocation(program, 'dt')!;
        break;
        
      case 'divergence':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        break;
        
      case 'clear':
        uniforms.uTexture = gl.getUniformLocation(program, 'uTexture')!;
        uniforms.value = gl.getUniformLocation(program, 'value')!;
        break;
        
      case 'pressure':
        uniforms.uPressure = gl.getUniformLocation(program, 'uPressure')!;
        uniforms.uDivergence = gl.getUniformLocation(program, 'uDivergence')!;
        break;
        
      case 'gradientSubtract':
        uniforms.uPressure = gl.getUniformLocation(program, 'uPressure')!;
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.scale = gl.getUniformLocation(program, 'scale')!;
        break;
        
      case 'advect':
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.uSource = gl.getUniformLocation(program, 'uSource')!;
        uniforms.dt = gl.getUniformLocation(program, 'dt')!;
        uniforms.dissipation = gl.getUniformLocation(program, 'dissipation')!;
        break;
        
      case 'bloomDownsample':
        uniforms.uTexture = gl.getUniformLocation(program, 'uTexture')!;
        uniforms.threshold = gl.getUniformLocation(program, 'threshold')!;
        break;
        
      case 'particles':
        uniforms.uParticles = gl.getUniformLocation(program, 'uParticles')!;
        uniforms.uVelocity = gl.getUniformLocation(program, 'uVelocity')!;
        uniforms.viewportSize = gl.getUniformLocation(program, 'viewportSize')!;
        uniforms.dt = gl.getUniformLocation(program, 'dt')!;
        uniforms.particleLife = gl.getUniformLocation(program, 'particleLife')!;
        break;
        
      case 'display':
        uniforms.uDensity = gl.getUniformLocation(program, 'uDensity')!;
        uniforms.uBloom = gl.getUniformLocation(program, 'uBloom')!;
        uniforms.uParticles = gl.getUniformLocation(program, 'uParticles')!;
        uniforms.bloomIntensity = gl.getUniformLocation(program, 'bloomIntensity')!;
        uniforms.particleCount = gl.getUniformLocation(program, 'particleCount')!;
        break;
    }
    
    programs[name] = { program, uniforms };
  }
  
  return programs;
}