"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./LiquidEther.module.css";

type LiquidEtherProps = {
  mouseForce?: number;
  cursorSize?: number;
  isViscous?: boolean;
  viscous?: number;
  iterationsViscous?: number;
  iterationsPoisson?: number;
  dt?: number;
  BFECC?: boolean;
  resolution?: number;
  isBounce?: boolean;
  colors?: string[];
  style?: React.CSSProperties;
  className?: string;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  takeoverDuration?: number;
  autoResumeDelay?: number;
  autoRampDuration?: number;
};

export default function LiquidEther({
  mouseForce = 18,
  cursorSize = 75,
  resolution = 0.5,
  colors = ["#5227FF", "#FF9FFC", "#B19EEF"],
  style = {},
  className = "",
  autoDemo = true,
  autoSpeed = 0.25,
  autoIntensity = 2.2,
  autoResumeDelay = 3000
}: LiquidEtherProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    let lastInteract = performance.now();
    const autoTarget = new THREE.Vector2(0.2, -0.2);
    let autoEnabled = autoDemo;

    const gradientTex = (() => {
      const width = Math.max(2, colors.length);
      const data = new Uint8Array(width * 4);
      for (let i = 0; i < width; i++) {
        const c = new THREE.Color(colors[i % colors.length]);
        data[i * 4 + 0] = Math.round(c.r * 255);
        data[i * 4 + 1] = Math.round(c.g * 255);
        data[i * 4 + 2] = Math.round(c.b * 255);
        data[i * 4 + 3] = 255;
      }
      const tex = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    })();

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0, 0) },
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_palette: { value: gradientTex },
        u_force: { value: mouseForce / 20 },
        u_cursor: { value: cursorSize / 100 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform sampler2D u_palette;
        uniform float u_force;
        uniform float u_cursor;

        float noise(vec2 p) {
          return sin(p.x) * sin(p.y);
        }

        void main() {
          vec2 uv = vUv;
          vec2 m = vec2(u_mouse.x * 0.5 + 0.5, u_mouse.y * 0.5 + 0.5);
          vec2 d = uv - m;
          float r = length(d);
          float influence = exp(-r * (8.0 - u_cursor * 3.0));
          float flow = noise((uv + d * influence * u_force) * vec2(7.0, 6.0) + vec2(u_time * 0.6, -u_time * 0.45));
          float wave = noise((uv + vec2(flow * 0.08)) * vec2(11.0, 9.0) + vec2(-u_time * 0.35, u_time * 0.3));
          float mixVal = clamp(0.5 + flow * 0.25 + wave * 0.2 + influence * 0.25, 0.0, 1.0);
          vec3 col = texture2D(u_palette, vec2(mixVal, 0.5)).rgb;
          float alpha = 0.35 + influence * 0.3;
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * resolution));
      const h = Math.max(1, Math.floor(rect.height * resolution));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      material.uniforms.u_resolution.value.set(w, h);
    };

    const setPointer = (clientX: number, clientY: number) => {
      const rect = mount.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      target.set(nx * 2 - 1, -(ny * 2 - 1));
      lastInteract = performance.now();
      autoEnabled = false;
    };

    const onMouseMove = (e: MouseEvent) => setPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      setPointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
      const now = performance.now();
      const dtSec = clock.getDelta();
      material.uniforms.u_time.value += dtSec;

      if (autoDemo && now - lastInteract > autoResumeDelay) {
        autoEnabled = true;
      }

      if (autoEnabled) {
        const t = now * 0.00035 * Math.max(0.2, autoSpeed);
        autoTarget.set(Math.cos(t * 1.3) * 0.42 * autoIntensity * 0.4, Math.sin(t * 0.9) * 0.38 * autoIntensity * 0.4);
        target.lerp(autoTarget, 0.03);
      }

      mouse.lerp(target, 0.085);
      material.uniforms.u_mouse.value.copy(mouse);
      renderer.render(scene, camera);
      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", resize);
      mesh.geometry.dispose();
      material.dispose();
      gradientTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [autoDemo, autoIntensity, autoResumeDelay, autoSpeed, colors, cursorSize, mouseForce, resolution]);

  return (
    <div ref={mountRef} className={`${styles.liquidEtherContainer} ${className || ""}`} style={style} />
  );
}
