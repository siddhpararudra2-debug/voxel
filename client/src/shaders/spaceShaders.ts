/** Orbital Field Manual reminder: celestial effects are sparse observational phenomena, not ornamental neon. */
export const atmosphereVertex = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragment = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
    gl_FragColor = vec4(0.18, 0.49, 0.72, 1.0) * intensity;
  }
`;

export const blackHoleLensingFragment = `
  uniform sampler2D tDiffuse;
  uniform vec2 center;
  uniform float strength;
  varying vec2 vUv;
  void main() {
    vec2 offset = vUv - center;
    float radius = max(length(offset), 0.03);
    vec2 warped = center + offset * (1.0 + strength / (radius * 18.0));
    gl_FragColor = texture2D(tDiffuse, warped);
  }
`;
