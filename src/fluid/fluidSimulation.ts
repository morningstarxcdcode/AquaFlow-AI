import { createShaders } from './shaders';

export function initFluidSimulation(canvas: HTMLCanvasElement, config: any) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true }) as WebGL2RenderingContext;
  
  if (!gl) {
    throw new Error('WebGL2 not supported');
  }
  
  // Set up the simulation
  const { 
    viscosity = 0.015, 
    diffusion = 0.0001, 
    pressure = 0.3, 
    vorticity = 0.2,
    bloomIntensity = 0.6,
    particleCount = 1000,
    palette = 'ocean',
    gravity = false
  } = config;
  
  const texWidth = 512;
  const texHeight = 512;
  let width = canvas.width;
  let height = canvas.height;
  
  // Initialize shader programs
  const shaders = createShaders(gl);
  
  // Create textures and framebuffers
  const createFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    return {
      texture,
      fbo
    };
  };
  
  // Create double-buffered textures for velocity, density, pressure, etc.
  let velocityTexture1 = createFBO(texWidth, texHeight, gl.RG32F, gl.RG, gl.FLOAT, gl.LINEAR);
  let velocityTexture2 = createFBO(texWidth, texHeight, gl.RG32F, gl.RG, gl.FLOAT, gl.LINEAR);
  let densityTexture1 = createFBO(texWidth, texHeight, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR);
  let densityTexture2 = createFBO(texWidth, texHeight, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR);
  let pressureTexture1 = createFBO(texWidth, texHeight, gl.R32F, gl.RED, gl.FLOAT, gl.NEAREST);
  let pressureTexture2 = createFBO(texWidth, texHeight, gl.R32F, gl.RED, gl.FLOAT, gl.NEAREST);
  const divergenceTexture = createFBO(texWidth, texHeight, gl.R32F, gl.RED, gl.FLOAT, gl.NEAREST);
  const vorticityTexture = createFBO(texWidth, texHeight, gl.R32F, gl.RED, gl.FLOAT, gl.NEAREST);
  
  // For bloom effect
  const bloomTexture1 = createFBO(texWidth / 2, texHeight / 2, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR);
  const bloomTexture2 = createFBO(texWidth / 4, texHeight / 4, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.LINEAR);
  
  // For particles
  let particleStateTexture1 = createFBO(particleCount, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST);
  let particleStateTexture2 = createFBO(particleCount, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST);
  
  // Initialize particles
  const initializeParticles = () => {
    const particleData = new Float32Array(particleCount * 4);
    for (let i = 0; i < particleCount; i++) {
      particleData[i * 4 + 0] = Math.random() * width;     // x position
      particleData[i * 4 + 1] = Math.random() * height;    // y position
      particleData[i * 4 + 2] = 0;                         // velocity x
      particleData[i * 4 + 3] = 0;                         // velocity y
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, particleStateTexture1.fbo);
    gl.viewport(0, 0, particleCount, 1);
    gl.bindTexture(gl.TEXTURE_2D, particleStateTexture1.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleCount, 1, gl.RGBA, gl.FLOAT, particleData);
  };
  
  initializeParticles();
  
  // Color palettes
  const colorPalettes: Record<string, number[][]> = {
    ocean: [
      [0.0, 0.0, 0.07, 1.0],
      [0.01, 0.13, 0.39, 1.0],
      [0.01, 0.24, 0.49, 1.0],
      [0.0, 0.59, 0.78, 1.0],
      [0.28, 0.79, 0.89, 1.0]
    ],
    lava: [
      [0.22, 0.02, 0.09, 1.0],
      [0.42, 0.02, 0.06, 1.0],
      [0.62, 0.01, 0.03, 1.0],
      [0.82, 0.0, 0.0, 1.0],
      [0.86, 0.18, 0.01, 1.0]
    ],
    nebula: [
      [0.14, 0.0, 0.27, 1.0],
      [0.24, 0.04, 0.42, 1.0],
      [0.35, 0.09, 0.60, 1.0],
      [0.48, 0.17, 0.75, 1.0],
      [0.62, 0.31, 0.87, 1.0]
    ],
    forest: [
      [0.03, 0.11, 0.08, 1.0],
      [0.11, 0.26, 0.20, 1.0],
      [0.18, 0.42, 0.31, 1.0],
      [0.25, 0.57, 0.42, 1.0],
      [0.32, 0.72, 0.53, 1.0]
    ],
    sunset: [
      [1.0, 0.47, 0.0, 1.0],
      [1.0, 0.62, 0.0, 1.0],
      [1.0, 0.72, 0.0, 1.0],
      [1.0, 0.82, 0.0, 1.0],
      [1.0, 0.92, 0.0, 1.0]
    ],
    neon: [
      [1.0, 0.0, 0.5, 1.0],
      [1.0, 0.0, 1.0, 1.0],
      [0.5, 0.0, 1.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 0.5, 1.0, 1.0]
    ]
  };
  
  // Get current palette
  const getCurrentPalette = () => {
    return colorPalettes[palette] || colorPalettes.ocean;
  };
  
  // Resize function
  const resize = (newWidth: number, newHeight: number) => {
    width = newWidth;
    height = newHeight;
    canvas.width = width;
    canvas.height = height;
  };
  
  // Audio data state
  let audioData = {
    lowFreq: 0,
    midFreq: 0,
    highFreq: 0,
    volume: 0
  };
  
  // Update with audio data
  const updateWithAudio = (data: typeof audioData) => {
    audioData = data;
  };
  
  // Add velocity at position
  const addVelocity = (x: number, y: number, velX: number, velY: number) => {
    const velocityProgram = shaders.addVelocity;
    gl.useProgram(velocityProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityTexture2.fbo);
    
    gl.uniform2f(velocityProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(velocityProgram.uniforms.uVelocity, 0);
    gl.uniform2f(velocityProgram.uniforms.point, x / width * texWidth, y / height * texHeight);
    gl.uniform2f(velocityProgram.uniforms.value, velX * 10, -velY * 10); // Flip Y for WebGL coordinates
    gl.uniform1f(velocityProgram.uniforms.radius, 50.0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap textures
    const temp = velocityTexture1;
    velocityTexture1 = velocityTexture2;
    velocityTexture2 = temp;
  };
  
  // Add density (color) at position
  const addDensity = (x: number, y: number, selectedPalette: string) => {
    const densityProgram = shaders.addDensity;
    gl.useProgram(densityProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, densityTexture2.fbo);
    
    const palette = colorPalettes[selectedPalette] || colorPalettes.ocean;
    const colorIndex = Math.floor(Math.random() * palette.length);
    const color = palette[colorIndex];
    
    gl.uniform2f(densityProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(densityProgram.uniforms.uDensity, 0);
    gl.uniform2f(densityProgram.uniforms.point, x / width * texWidth, y / height * texHeight);
    gl.uniform4f(densityProgram.uniforms.value, color[0], color[1], color[2], 1.0);
    gl.uniform1f(densityProgram.uniforms.radius, 30.0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, densityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap textures
    const temp = densityTexture1;
    densityTexture1 = densityTexture2;
    densityTexture2 = temp;
  };
  
  // Update function (single simulation step)
  const update = () => {
    // Apply external forces
    if (gravity) {
      const gravityProgram = shaders.gravity;
      gl.useProgram(gravityProgram.program);
      
      gl.viewport(0, 0, texWidth, texHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocityTexture2.fbo);
      
      gl.uniform2f(gravityProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
      gl.uniform1i(gravityProgram.uniforms.uVelocity, 0);
      gl.uniform1f(gravityProgram.uniforms.gravity, 9.8 * 0.01); // Gravity strength
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      // Swap velocity textures
      const temp = velocityTexture1;
      velocityTexture1 = velocityTexture2;
      velocityTexture2 = temp;
    }
    
    // Apply audio effects if enabled
    if (audioData.volume > 0) {
      // Low frequencies affect large-scale turbulence
      if (audioData.lowFreq > 0.2) {
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const velX = (Math.random() * 2 - 1) * audioData.lowFreq * 20;
          const velY = (Math.random() * 2 - 1) * audioData.lowFreq * 20;
          addVelocity(x, y, velX, velY);
        }
      }
      
      // Mid and high frequencies add density
      if (audioData.midFreq > 0.3 || audioData.highFreq > 0.3) {
        for (let i = 0; i < 2; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          addDensity(x, y, palette);
        }
      }
    }
    
    // Compute vorticity
    const vorticityProgram = shaders.vorticity;
    gl.useProgram(vorticityProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, vorticityTexture.fbo);
    
    gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Apply vorticity confinement
    const vorticityConfinementProgram = shaders.vorticityConfinement;
    gl.useProgram(vorticityConfinementProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityTexture2.fbo);
    
    gl.uniform2f(vorticityConfinementProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(vorticityConfinementProgram.uniforms.uVelocity, 0);
    gl.uniform1i(vorticityConfinementProgram.uniforms.uVorticity, 1);
    gl.uniform1f(vorticityConfinementProgram.uniforms.confinement, vorticity);
    gl.uniform1f(vorticityConfinementProgram.uniforms.dt, 0.016);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, vorticityTexture.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap velocity textures
    let temp = velocityTexture1;
    velocityTexture1 = velocityTexture2;
    velocityTexture2 = temp;
    
    // Diffuse velocity
    const diffuseProgram = shaders.diffuse;
    gl.useProgram(diffuseProgram.program);
    
    for (let i = 0; i < 4; i++) {
      gl.viewport(0, 0, texWidth, texHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocityTexture2.fbo);
      
      gl.uniform2f(diffuseProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
      gl.uniform1i(diffuseProgram.uniforms.uVelocity, 0);
      gl.uniform1f(diffuseProgram.uniforms.viscosity, viscosity);
      gl.uniform1f(diffuseProgram.uniforms.dt, 0.016);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      // Swap velocity textures
      temp = velocityTexture1;
      velocityTexture1 = velocityTexture2;
      velocityTexture2 = temp;
    }
    
    // Compute divergence
    const divergenceProgram = shaders.divergence;
    gl.useProgram(divergenceProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, divergenceTexture.fbo);
    
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Clear pressure
    const clearProgram = shaders.clear;
    gl.useProgram(clearProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pressureTexture1.fbo);
    
    gl.uniform1i(clearProgram.uniforms.uTexture, 0);
    gl.uniform1f(clearProgram.uniforms.value, 0.0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressureTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Solve pressure
    const pressureProgram = shaders.pressure;
    gl.useProgram(pressureProgram.program);
    
    for (let i = 0; i < 20; i++) {
      gl.viewport(0, 0, texWidth, texHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressureTexture2.fbo);
      
      gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
      gl.uniform1i(pressureProgram.uniforms.uPressure, 0);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, 1);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressureTexture1.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergenceTexture.texture);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      // Swap pressure textures
      temp = pressureTexture1;
      pressureTexture1 = pressureTexture2;
      pressureTexture2 = temp;
    }
    
    // Apply pressure gradient to velocity
    const gradientSubtractProgram = shaders.gradientSubtract;
    gl.useProgram(gradientSubtractProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityTexture2.fbo);
    
    gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, 0);
    gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, 1);
    gl.uniform1f(gradientSubtractProgram.uniforms.scale, pressure);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressureTexture1.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap velocity textures
    temp = velocityTexture1;
    velocityTexture1 = velocityTexture2;
    velocityTexture2 = temp;
    
    // Advect velocity
    const advectProgram = shaders.advect;
    gl.useProgram(advectProgram.program);
    
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityTexture2.fbo);
    
    gl.uniform2f(advectProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(advectProgram.uniforms.uVelocity, 0);
    gl.uniform1i(advectProgram.uniforms.uSource, 0);
    gl.uniform1f(advectProgram.uniforms.dt, 0.016);
    gl.uniform1f(advectProgram.uniforms.dissipation, 0.99);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap velocity textures
    temp = velocityTexture1;
    velocityTexture1 = velocityTexture2;
    velocityTexture2 = temp;
    
    // Advect density
    gl.viewport(0, 0, texWidth, texHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, densityTexture2.fbo);
    
    gl.uniform2f(advectProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(advectProgram.uniforms.uVelocity, 0);
    gl.uniform1i(advectProgram.uniforms.uSource, 1);
    gl.uniform1f(advectProgram.uniforms.dt, 0.016);
    gl.uniform1f(advectProgram.uniforms.dissipation, 0.98);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, densityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap density textures
    temp = densityTexture1;
    densityTexture1 = densityTexture2;
    densityTexture2 = temp;
    
    // Update particles
    const particleProgram = shaders.particles;
    gl.useProgram(particleProgram.program);
    
    gl.viewport(0, 0, particleCount, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, particleStateTexture2.fbo);
    
    gl.uniform2f(particleProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform2f(particleProgram.uniforms.viewportSize, width, height);
    gl.uniform1i(particleProgram.uniforms.uParticles, 0);
    gl.uniform1i(particleProgram.uniforms.uVelocity, 1);
    gl.uniform1f(particleProgram.uniforms.dt, 0.016);
    gl.uniform1f(particleProgram.uniforms.particleLife, 0.9);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, particleStateTexture1.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Swap particle textures
    temp = particleStateTexture1;
    particleStateTexture1 = particleStateTexture2;
    particleStateTexture2 = temp;
  };
  
  // Render function
  const render = () => {
    gl.viewport(0, 0, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // Apply bloom effect (downsample)
    const bloomDownsampleProgram = shaders.bloomDownsample;
    gl.useProgram(bloomDownsampleProgram.program);
    
    gl.viewport(0, 0, texWidth / 2, texHeight / 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomTexture1.fbo);
    
    gl.uniform2f(bloomDownsampleProgram.uniforms.texelSize, 1.0 / texWidth, 1.0 / texHeight);
    gl.uniform1i(bloomDownsampleProgram.uniforms.uTexture, 0);
    gl.uniform1f(bloomDownsampleProgram.uniforms.threshold, 0.6);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, densityTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Further downsample
    gl.viewport(0, 0, texWidth / 4, texHeight / 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomTexture2.fbo);
    
    gl.uniform2f(bloomDownsampleProgram.uniforms.texelSize, 2.0 / texWidth, 2.0 / texHeight);
    gl.uniform1i(bloomDownsampleProgram.uniforms.uTexture, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bloomTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Final render
    const displayProgram = shaders.display;
    gl.useProgram(displayProgram.program);
    
    gl.viewport(0, 0, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    gl.uniform1i(displayProgram.uniforms.uDensity, 0);
    gl.uniform1i(displayProgram.uniforms.uBloom, 1);
    gl.uniform1i(displayProgram.uniforms.uParticles, 2);
    gl.uniform1f(displayProgram.uniforms.bloomIntensity, bloomIntensity);
    gl.uniform1i(displayProgram.uniforms.particleCount, particleCount);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, densityTexture1.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomTexture2.texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, particleStateTexture1.texture);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  
  // Cleanup function
  const destroy = () => {
    // Delete textures and framebuffers
    const textures = [
      velocityTexture1.texture, velocityTexture2.texture,
      densityTexture1.texture, densityTexture2.texture,
      pressureTexture1.texture, pressureTexture2.texture,
      divergenceTexture.texture, vorticityTexture.texture,
      bloomTexture1.texture, bloomTexture2.texture,
      particleStateTexture1.texture, particleStateTexture2.texture
    ];
    
    const framebuffers = [
      velocityTexture1.fbo, velocityTexture2.fbo,
      densityTexture1.fbo, densityTexture2.fbo,
      pressureTexture1.fbo, pressureTexture2.fbo,
      divergenceTexture.fbo, vorticityTexture.fbo,
      bloomTexture1.fbo, bloomTexture2.fbo,
      particleStateTexture1.fbo, particleStateTexture2.fbo
    ];
    
    textures.forEach(texture => {
      if (texture) gl.deleteTexture(texture);
    });
    
    framebuffers.forEach(fbo => {
      if (fbo) gl.deleteFramebuffer(fbo);
    });
    
    // Delete shader programs
    Object.values(shaders).forEach(shader => {
      if (shader.program) gl.deleteProgram(shader.program);
    });
  };
  
  return {
    update,
    render,
    resize,
    addVelocity,
    addDensity,
    updateWithAudio,
    destroy
  };
}