"use client";

import { useEffect } from "react";

function normalized(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

type HomeSpring = {
  depth: number;
  element: HTMLElement;
  rotation: string;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
};

function opaqueBackground(start: Element | null) {
  let element = start;
  while (element && element !== document.documentElement) {
    const color = getComputedStyle(element).backgroundColor;
    const match = color.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[, /]+([\d.]+))?\)/);
    if (match && (match[4] === undefined || Number.parseFloat(match[4]) >= .9)) return {
      color,
      dark: .2126 * Number(match[1]) + .7152 * Number(match[2]) + .0722 * Number(match[3]) < 140,
    };
    element = element.parentElement;
  }
  return { color: "#100f0f", dark: true };
}

function setupSharedHandoffInteractions(root: HTMLElement, home: boolean) {
  const navigation = root.querySelector<HTMLElement>("[data-nav]");
  const progress = root.querySelector<HTMLElement>("[data-readbar]");
  if (!navigation && !progress) return undefined;
  let frame = 0;
  const sync = () => {
    frame = 0;
    if (progress) {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${maximum > 0 ? Math.min(100, Math.max(0, window.scrollY / maximum * 100)) : 0}%`;
    }
    if (!home && navigation) {
      const probeY = navigation.getBoundingClientRect().height + 14;
      const hit = document.elementFromPoint(window.innerWidth / 2, probeY);
      const themed = hit?.closest<HTMLElement>("[data-navtheme]");
      if (themed) {
        navigation.dataset.theme = themed.dataset.navtheme || "dark";
        navigation.style.removeProperty("background");
      } else {
        const background = opaqueBackground(hit);
        navigation.dataset.theme = background.dark ? "dark" : "light";
        navigation.style.background = background.color;
      }
    }
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(sync);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.cancelAnimationFrame(frame);
  };
}

function makeHomeVisible(root: HTMLElement) {
  root.dataset.homeInteractions = "fallback";
  for (const element of root.querySelectorAll<HTMLElement>("[data-rise]")) {
    element.dataset.riseState = "visible";
  }
  for (const element of root.querySelectorAll<HTMLElement>("[data-stackpanel], [data-stackpanel] [data-mob='chapter'], [data-stackind]")) {
    element.style.setProperty("opacity", "1", "important");
  }
  for (const panel of root.querySelectorAll<HTMLElement>("[data-stackpanel]")) {
    panel.style.setProperty("transform", "none", "important");
  }
}

function setupHomeInteractions(root: HTMLElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const riseElements = Array.from(root.querySelectorAll<HTMLElement>("[data-rise]"));
  const riseSections = Array.from(new Set(riseElements.map((element) => element.closest<HTMLElement>("[data-screen-label]")))).filter(Boolean) as HTMLElement[];
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-stackpanel]"));
  const stack = panels[0]?.parentElement ?? null;
  const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-stackdot]"));
  const navigation = root.querySelector<HTMLElement>("[data-nav]");
  const snapElements = Array.from(root.querySelectorAll<HTMLElement>("[data-snap]"));
  let chapterTops: number[] = [];
  let animationFrame = 0;
  let scrollTweenFrame = 0;
  let observer: IntersectionObserver | null = null;
  let wheelAccumulator = 0;
  let snapLockedUntil = 0;
  let destroyed = false;

  const reveal = (element: HTMLElement, index = 0) => {
    element.dataset.riseState = "visible";
    element.style.setProperty("--handoff-rise-delay", `${index * 130}ms`);
  };

  // The server-rendered handoff must be readable before this effect runs. Only opt into
  // hidden pending states when the browser can guarantee a later reveal.
  if (!reducedMotion && typeof window.IntersectionObserver === "function") {
    for (const section of riseSections) {
      const rect = section.getBoundingClientRect();
      const visiblePixels = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      const alreadyVisible = visiblePixels >= Math.min(rect.height, window.innerHeight) * 0.35;
      const elements = riseElements.filter((element) => section.contains(element));
      elements.forEach((element, index) => {
        element.dataset.riseState = alreadyVisible ? "visible" : "pending";
        if (alreadyVisible) reveal(element, index);
      });
    }
    root.dataset.homeInteractions = "ready";
    observer = new window.IntersectionObserver((entries) => {
      for (const entry of entries) {
      if (!entry.isIntersecting) continue;
        const section = entry.target as HTMLElement;
        riseElements.filter((element) => section.contains(element)).forEach(reveal);
        observer?.unobserve(section);
      }
    }, { threshold: [0, 0.12] });
    riseSections.forEach((section) => observer?.observe(section));
  } else {
    makeHomeVisible(root);
  }

  const springs: HomeSpring[] = reducedMotion || !finePointer
    ? []
    : Array.from(root.querySelectorAll<HTMLElement>("[data-tphoto]")).map((element) => ({
      depth: Number.parseFloat(element.dataset.depth || "24"),
      element,
      rotation: element.dataset.rot || "0deg",
      targetX: 0,
      targetY: 0,
      velocityX: 0,
      velocityY: 0,
      x: 0,
      y: 0,
    }));

  const onPointerMove = (event: PointerEvent) => {
    const normalizedX = event.clientX / window.innerWidth - 0.5;
    const normalizedY = event.clientY / window.innerHeight - 0.5;
    for (const spring of springs) {
      spring.targetX = normalizedX * spring.depth * 1.55;
      spring.targetY = normalizedY * spring.depth * 1.1;
    }
  };

  const syncNavigation = () => {
    if (!navigation) return;
    const probeY = navigation.getBoundingClientRect().height + 14;
    const hit = document.elementFromPoint(window.innerWidth / 2, probeY);
    const section = hit?.closest<HTMLElement>("[data-navtheme]");
    navigation.dataset.theme = section?.dataset.navtheme || "dark";
  };

  const syncStack = () => {
    if (!stack) return;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const stackTop = stack.getBoundingClientRect().top + scrollY;
    let flow = 0;
    let panelIndex = 0;
    const opens: number[] = [];

    for (const child of Array.from(stack.children) as HTMLElement[]) {
      if (child.hasAttribute("data-snap")) continue;
      if (child.hasAttribute("data-stackpanel")) {
        const open = stackTop + flow;
        const raw = open - scrollY;
        opens.push(open);
        if (panelIndex === 0 && !reducedMotion) {
          const distance = Math.max(viewportHeight, flow);
          if (raw >= distance) {
            child.style.setProperty("transform", "none", "important");
            child.style.setProperty("opacity", "0", "important");
          } else if (raw > 0) {
            const progress = 1 - raw / distance;
            const eased = progress * progress * (3 - 2 * progress);
            child.style.setProperty("transform", `translateY(${-raw}px) scale(${(0.24 + 0.76 * eased).toFixed(4)})`, "important");
            child.style.setProperty("opacity", Math.min(1, progress * 10).toFixed(2), "important");
            child.style.borderRadius = `${Math.round(28 * Math.min(1, (1 - eased) * 10))}px`;
          } else {
            child.style.setProperty("transform", "none", "important");
            child.style.setProperty("opacity", "1", "important");
            child.style.borderRadius = "0";
          }
          const contentVisible = raw <= 4;
          for (const element of [child.querySelector<HTMLElement>("[data-mob='chapter']"), child.querySelector<HTMLElement>("[data-stackind]")]) {
            if (!element) continue;
            element.style.setProperty("opacity", contentVisible ? "1" : "0", "important");
          }
        } else {
          child.style.setProperty("transform", "none", "important");
          child.style.setProperty("opacity", "1", "important");
          child.style.borderRadius = reducedMotion || raw <= 2 ? "0" : "28px 28px 0 0";
          for (const element of [child.querySelector<HTMLElement>("[data-mob='chapter']"), child.querySelector<HTMLElement>("[data-stackind]")]) {
            element?.style.setProperty("opacity", "1", "important");
          }
        }
        panelIndex += 1;
      }
      flow += child.offsetHeight;
    }

    chapterTops = [stackTop, ...opens];
    if (dots.length && opens.length >= 3) {
      const progress = Math.min(1, Math.max(0, (scrollY - opens[0]) / Math.max(1, opens[2] - opens[0])));
      dots.forEach((dot) => { dot.style.left = `calc(${(progress * 100).toFixed(2)}% - 4.5px)`; });
    }
  };

  const tick = () => {
    if (destroyed) return;
    for (const spring of springs) {
      spring.velocityX = (spring.velocityX + (spring.targetX - spring.x) * 0.06) * 0.8;
      spring.velocityY = (spring.velocityY + (spring.targetY - spring.y) * 0.06) * 0.8;
      spring.x += spring.velocityX;
      spring.y += spring.velocityY;
      spring.element.style.transform = `translate(${spring.x.toFixed(2)}px, ${spring.y.toFixed(2)}px) rotate(${spring.rotation})`;
    }
    syncNavigation();
    syncStack();
    animationFrame = window.requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now < snapLockedUntil) {
      wheelAccumulator = 0;
      return;
    }
    wheelAccumulator += event.deltaY;
    if (Math.abs(wheelAccumulator) < 24) return;
    const direction = wheelAccumulator > 0 ? 1 : -1;
    wheelAccumulator = 0;
    const from = window.scrollY;
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const stops = [...snapElements.map((element) => element.getBoundingClientRect().top + from), ...chapterTops]
      .filter((value, index, values) => values.findIndex((candidate) => Math.abs(candidate - value) < 2) === index)
      .sort((left, right) => left - right);
    let target = direction > 0 ? maximum : 0;
    if (direction > 0) target = stops.find((stop) => stop > from + 4) ?? maximum;
    else for (const stop of stops) if (stop < from - 4) target = stop;
    target = Math.max(0, Math.min(maximum, target));
    if (Math.abs(target - from) < 2) return;
    const duration = 600;
    snapLockedUntil = now + duration;
    const distance = target - from;
    const html = document.documentElement;
    const previousSnap = html.style.scrollSnapType;
    html.style.scrollSnapType = "none";
    const step = () => {
      const progress = Math.min(1, (performance.now() - now) / duration);
      window.scrollTo(0, from + distance * (1 - Math.pow(1 - progress, 4)));
      if (progress < 1) scrollTweenFrame = window.requestAnimationFrame(step);
      else html.style.scrollSnapType = previousSnap;
    };
    scrollTweenFrame = window.requestAnimationFrame(step);
  };

  if (springs.length) window.addEventListener("pointermove", onPointerMove, { passive: true });
  if (!reducedMotion && finePointer) window.addEventListener("wheel", onWheel, { passive: false });
  tick();

  return () => {
    destroyed = true;
    observer?.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("wheel", onWheel);
    window.cancelAnimationFrame(animationFrame);
    window.cancelAnimationFrame(scrollTweenFrame);
    document.documentElement.style.removeProperty("scroll-snap-type");
    delete root.dataset.homeInteractions;
  };
}

export function HandoffInteractions({ name }: { name: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-handoff-page="${name}"]`);
    if (!root) return;

    const cleanUpShared = setupSharedHandoffInteractions(root, name === "home");
    const cleanUpHome = name === "home" ? setupHomeInteractions(root) : undefined;

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;
      const label = normalized(button.textContent);
      if (label === "start programme") {
        window.location.assign("/program?entry=start");
        return;
      }
      if (name !== "learn") return;
      const topics = ["all topics", "bonuses", "banking", "casinos", "games", "responsible play", "industry"];
      if (!topics.includes(label)) return;
      const allGuides = [...root.querySelectorAll("h2")].find((heading) => normalized(heading.textContent) === "all guides");
      const section = allGuides?.parentElement?.parentElement;
      if (!section) return;
      const cards = [...section.querySelectorAll<HTMLAnchorElement>("a[href]")];
      for (const card of cards) card.hidden = label !== "all topics" && !normalized(card.textContent).includes(label);
      const siblings = button.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? [];
      for (const item of siblings) {
        const active = item === button;
        item.style.background = active ? "rgb(16, 15, 15)" : "transparent";
        item.style.color = active ? "rgb(250, 250, 247)" : "rgb(16, 15, 15)";
      }
    };

    const onInput = (event: Event) => {
      if (name !== "learn" || !(event.target instanceof HTMLInputElement) || event.target.type !== "search") return;
      const query = normalized(event.target.value);
      const allGuides = [...root.querySelectorAll("h2")].find((heading) => normalized(heading.textContent) === "all guides");
      const section = allGuides?.parentElement?.parentElement;
      if (!section) return;
      for (const card of section.querySelectorAll<HTMLAnchorElement>("a[href]")) card.hidden = Boolean(query) && !normalized(card.textContent).includes(query);
    };

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      cleanUpHome?.();
      cleanUpShared?.();
    };
  }, [name]);
  return null;
}
