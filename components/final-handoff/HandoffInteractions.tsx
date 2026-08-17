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

function setupSharedHandoffInteractions(root: HTMLElement) {
  const progress = root.querySelector<HTMLElement>("[data-readbar]");
  if (!progress) return undefined;
  let frame = 0;
  const sync = () => {
    frame = 0;
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${maximum > 0 ? Math.min(100, Math.max(0, window.scrollY / maximum * 100)) : 0}%`;
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
  const snapElements = Array.from(root.querySelectorAll<HTMLElement>("[data-snap]"));
  const publicFooter = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
  let chapterTops: number[] = [];
  let animationFrame = 0;
  let scrollTweenFrame = 0;
  let observer: IntersectionObserver | null = null;
  let wheelAccumulator = 0;
  let snapLockedUntil = 0;
  let destroyed = false;
  let footerObserver: ResizeObserver | null = null;

  const syncClosingComposition = () => {
    if (!publicFooter) return;
    root.style.setProperty("--home-public-footer-height", `${Math.ceil(publicFooter.getBoundingClientRect().height)}px`);
  };

  syncClosingComposition();
  window.addEventListener("resize", syncClosingComposition, { passive: true });
  if (publicFooter && typeof window.ResizeObserver === "function") {
    footerObserver = new window.ResizeObserver(syncClosingComposition);
    footerObserver.observe(publicFooter);
  }

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
      const childStyle = window.getComputedStyle(child);
      const marginTop = Number.parseFloat(childStyle.marginTop) || 0;
      const marginBottom = Number.parseFloat(childStyle.marginBottom) || 0;
      if (child.hasAttribute("data-stackpanel")) {
        const open = stackTop + flow + marginTop;
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
      flow += marginTop + child.offsetHeight + marginBottom;
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
    footerObserver?.disconnect();
    window.removeEventListener("resize", syncClosingComposition);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("wheel", onWheel);
    window.cancelAnimationFrame(animationFrame);
    window.cancelAnimationFrame(scrollTweenFrame);
    document.documentElement.style.removeProperty("scroll-snap-type");
    root.style.removeProperty("--home-public-footer-height");
    delete root.dataset.homeInteractions;
  };
}

export function HandoffInteractions({ name }: { name: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-handoff-page="${name}"]`);
    if (!root) return;

    const cleanUpShared = setupSharedHandoffInteractions(root);
    const cleanUpHome = name === "home" ? setupHomeInteractions(root) : undefined;

    const learnTopics = ["all topics", "bonuses", "banking", "casinos", "games", "responsible play", "industry"];
    const learnInput = name === "learn" ? root.querySelector<HTMLInputElement>('input[placeholder^="Search guides"]') : null;
    const allGuides = name === "learn"
      ? [...root.querySelectorAll("h2")].find((heading) => normalized(heading.textContent) === "all guides")
      : undefined;
    const learnSection = allGuides?.parentElement?.parentElement ?? null;
    const learnCards = learnSection ? [...learnSection.querySelectorAll<HTMLAnchorElement>("a[data-learn-category]")] : [];
    const learnButtons = learnSection
      ? [...learnSection.querySelectorAll<HTMLButtonElement>("button")].filter((button) => learnTopics.includes(normalized(button.textContent)))
      : [];
    const learnCount = allGuides?.parentElement?.querySelector<HTMLElement>(".sc-interp") ?? null;
    const learnGrid = learnCards[0]?.parentElement ?? null;
    const learnStatus = name === "learn" ? document.createElement("p") : null;
    const categoryTopic = new Map([
      ["casino-bonuses", "bonuses"],
      ["payments", "banking"],
      ["crypto-casinos", "banking"],
      ["game-guides", "games"],
      ["sports-betting-basics", "games"],
      ["responsible-gambling", "responsible play"],
      ["industry-news", "industry"],
    ]);
    const requestedCategory = name === "learn" ? new URLSearchParams(window.location.search).get("category") : null;
    let learnTopic = requestedCategory ? categoryTopic.get(requestedCategory) || "casinos" : "all topics";
    let learnQuery = "";

    if (learnInput) {
      learnInput.type = "search";
      learnInput.setAttribute("aria-label", "Search guides");
    }
    for (const button of learnButtons) {
      button.type = "button";
      button.setAttribute("aria-pressed", String(normalized(button.textContent) === learnTopic));
    }
    if (learnStatus && learnGrid) {
      learnStatus.dataset.learnResultsStatus = "";
      learnStatus.setAttribute("aria-live", "polite");
      learnStatus.setAttribute("role", "status");
      learnStatus.style.cssText = "min-height:22px;margin:-18px 0 22px;color:rgb(100,99,92);font:500 14px/1.5 Archivo,sans-serif";
      learnGrid.before(learnStatus);
    }

    const updateLearnButtonState = () => {
      for (const item of learnButtons) {
        const active = normalized(item.textContent) === learnTopic;
        item.setAttribute("aria-pressed", String(active));
        item.style.background = active ? "rgb(16, 15, 15)" : "transparent";
        item.style.color = active ? "rgb(250, 250, 247)" : "rgb(16, 15, 15)";
      }
    };

    const applyLearnFilters = () => {
      let visible = 0;
      for (const card of learnCards) {
        const topicMatch = learnTopic === "all topics" || card.dataset.learnCategory === learnTopic;
        const queryMatch = !learnQuery || normalized(card.textContent).includes(learnQuery);
        const matches = topicMatch && queryMatch;
        card.hidden = !matches;
        // Captured cards carry inline display:flex. That author style outranks the
        // user-agent [hidden] rule, so apply the visibility state at the same level.
        card.style.display = matches ? "flex" : "none";
        if (!card.hidden) visible += 1;
      }
      if (learnCount) learnCount.textContent = String(visible);
      if (learnStatus) {
        learnStatus.textContent = visible
          ? `${visible} ${visible === 1 ? "guide" : "guides"} shown.`
          : "No guides match. Clear the search or choose All topics.";
      }
      updateLearnButtonState();
    };

    if (name === "learn") applyLearnFilters();

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;
      const label = normalized(button.textContent);
      if (label === "start programme") {
        window.location.assign("/program?entry=start");
        return;
      }
      if (name !== "learn") return;
      if (!learnTopics.includes(label)) return;
      learnTopic = label;
      applyLearnFilters();
    };

    const onInput = (event: Event) => {
      if (name !== "learn" || !learnInput || event.target !== learnInput) return;
      learnQuery = normalized(learnInput.value);
      applyLearnFilters();
    };

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      learnStatus?.remove();
      cleanUpHome?.();
      cleanUpShared?.();
    };
  }, [name]);
  return null;
}
