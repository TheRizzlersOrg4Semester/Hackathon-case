"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./gooey-nav.module.css";

type GooeyNavItem = {
  label: string;
  href: string;
};

type GooeyNavProps = {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
};

const NOISE_JITTER = 8;

export function GooeyNav({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0
}: GooeyNavProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLUListElement | null>(null);
  const filterRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
    const angle = ((360 + noise(NOISE_JITTER)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (index: number) => {
    const rotate = noise(particleR / 10);
    const time = animationTime * 2 + noise(timeVariance * 2);
    return {
      start: getXY(particleDistances[0], particleCount - index, particleCount),
      end: getXY(particleDistances[1] + noise(7), particleCount - index, particleCount),
      time,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + particleR / 20) * 10 : (rotate - particleR / 20) * 10
    };
  };

  const makeParticles = (element: HTMLSpanElement) => {
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i += 1) {
      const particleConfig = createParticle(i);
      element.classList.remove(styles.effectActive);

      window.setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add(styles.particle);
        particle.style.setProperty("--start-x", `${particleConfig.start[0]}px`);
        particle.style.setProperty("--start-y", `${particleConfig.start[1]}px`);
        particle.style.setProperty("--end-x", `${particleConfig.end[0]}px`);
        particle.style.setProperty("--end-y", `${particleConfig.end[1]}px`);
        particle.style.setProperty("--time", `${particleConfig.time}ms`);
        particle.style.setProperty("--scale", `${particleConfig.scale}`);
        particle.style.setProperty("--color", `var(--color-${particleConfig.color}, white)`);
        particle.style.setProperty("--rotate", `${particleConfig.rotate}deg`);

        point.classList.add(styles.point);
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add(styles.effectActive);
        });
        window.setTimeout(() => {
          if (element.contains(particle)) {
            element.removeChild(particle);
          }
        }, particleConfig.time);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const stylesForPosition = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`
    };
    Object.assign(filterRef.current.style, stylesForPosition);
    Object.assign(textRef.current.style, stylesForPosition);
    textRef.current.innerText = element.innerText;
  };

  const triggerActive = (index: number, targetElement: HTMLElement) => {
    if (activeIndex === index) return;

    setActiveIndex(index);
    updateEffectPosition(targetElement);

    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(`.${styles.particle}`);
      particles.forEach((particle) => filterRef.current?.removeChild(particle));
      makeParticles(filterRef.current);
    }

    if (textRef.current) {
      textRef.current.classList.remove(styles.effectTextActive);
      void textRef.current.offsetWidth;
      textRef.current.classList.add(styles.effectTextActive);
    }
  };

  useEffect(() => {
    const nextActiveIndex = items.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    if (nextActiveIndex >= 0 && nextActiveIndex !== activeIndex) {
      setActiveIndex(nextActiveIndex);
    }
  }, [activeIndex, items, pathname]);

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;

    const activeLi = navRef.current.querySelectorAll("li")[activeIndex] as HTMLElement | undefined;
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.current?.classList.add(styles.effectTextActive);
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[activeIndex] as HTMLElement | undefined;
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <div className={styles.gooeyNavContainer} ref={containerRef}>
      <nav className={styles.nav}>
        <ul className={styles.list} ref={navRef}>
          {items.map((item, index) => (
            <li
              className={`${styles.navItem} ${activeIndex === index ? styles.navItemActive : ""}`}
              key={item.href}
            >
              <Link
                className={styles.navLink}
                href={item.href}
                onClick={(event) => {
                  const liElement = event.currentTarget.parentElement as HTMLElement | null;
                  if (liElement) {
                    triggerActive(index, liElement);
                  }
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <span className={`${styles.effect} ${styles.effectFilter}`} ref={filterRef} />
      <span className={`${styles.effect} ${styles.effectText}`} ref={textRef} />
    </div>
  );
}
