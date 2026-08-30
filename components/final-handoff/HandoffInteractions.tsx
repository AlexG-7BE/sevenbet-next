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
  const publicFooter = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
  let animationFrame = 0;
  let observer: IntersectionObserver | null = null;
  let destroyed = false;
  let footerObserver: ResizeObserver | null = null;
  let stackObserver: ResizeObserver | null = null;
  let geometryDirty = Boolean(stack) && !reducedMotion;
  let stackDirty = Boolean(stack) && !reducedMotion;
  let panelLayouts: Array<{ element: HTMLElement; entranceDistance: number; open: number }> = [];
  let canonicalDestinations: number[] = [];
  let wheelTargetIndex: number | null = null;
  let lastWheelAt = Number.NEGATIVE_INFINITY;
  let lastWheelDirection = 0;

  const measureCanonicalDestinations = () => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const positions = Array.from(root.querySelectorAll<HTMLElement>("[data-home-snap]"), (element) => (
      Math.min(maximum, Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY)))
    ));
    if (!positions.some((position) => Math.abs(position - maximum) <= 3)) positions.push(maximum);
    canonicalDestinations = [...new Set(positions)].sort((left, right) => left - right);
  };

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
    element.style.setProperty("--handoff-rise-delay", `${index * 60}ms`);
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

  const springsAreMoving = () => springs.some((spring) => (
    Math.abs(spring.targetX - spring.x) > 0.01
    || Math.abs(spring.targetY - spring.y) > 0.01
    || Math.abs(spring.velocityX) > 0.01
    || Math.abs(spring.velocityY) > 0.01
  ));

  const onPointerMove = (event: PointerEvent) => {
    const normalizedX = event.clientX / window.innerWidth - 0.5;
    const normalizedY = event.clientY / window.innerHeight - 0.5;
    for (const spring of springs) {
      spring.targetX = normalizedX * spring.depth * 1.55;
      spring.targetY = normalizedY * spring.depth * 1.1;
    }
    scheduleFrame();
  };

  const onPointerLeave = () => {
    for (const spring of springs) {
      spring.targetX = 0;
      spring.targetY = 0;
    }
    scheduleFrame();
  };

  const measureStack = () => {
    if (!stack) return;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const stackTop = stack.getBoundingClientRect().top + scrollY;
    let flow = 0;
    const nextLayouts: typeof panelLayouts = [];

    for (const child of Array.from(stack.children) as HTMLElement[]) {
      if (child.hasAttribute("data-snap")) continue;
      const childStyle = window.getComputedStyle(child);
      const marginTop = Number.parseFloat(childStyle.marginTop) || 0;
      const marginBottom = Number.parseFloat(childStyle.marginBottom) || 0;
      if (child.hasAttribute("data-stackpanel")) {
        nextLayouts.push({
          element: child,
          entranceDistance: Math.max(viewportHeight, flow),
          open: stackTop + flow + marginTop,
        });
      }
      flow += marginTop + child.offsetHeight + marginBottom;
    }

    panelLayouts = nextLayouts;
    measureCanonicalDestinations();
  };

  const nearestDestinationIndex = () => canonicalDestinations.reduce((nearest, destination, index) => (
    Math.abs(destination - window.scrollY) < Math.abs(canonicalDestinations[nearest] - window.scrollY) ? index : nearest
  ), 0);

  const onWheel = (event: WheelEvent) => {
    if (reducedMotion || !finePointer || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    if (canonicalDestinations.length < 2 || event.deltaY === 0) return;

    const now = window.performance.now();
    const quietFor = now - lastWheelAt;
    const direction = event.deltaY > 0 ? 1 : -1;
    const activeDestination = wheelTargetIndex === null ? null : canonicalDestinations[wheelTargetIndex];
    const currentDestinationIndex = nearestDestinationIndex();
    const currentAtAnotherDestination = wheelTargetIndex !== null
      && currentDestinationIndex !== wheelTargetIndex
      && Math.abs(window.scrollY - canonicalDestinations[currentDestinationIndex]) <= 4;
    const movedByAnotherInput = activeDestination !== null && (
      currentAtAnotherDestination
      || Math.abs(window.scrollY - activeDestination) > window.innerHeight * 1.25
    );
    const reversing = wheelTargetIndex !== null && direction !== lastWheelDirection;
    const activeReached = activeDestination === null || Math.abs(window.scrollY - activeDestination) <= 4;
    lastWheelAt = now;

    // Momentum events from one wheel/trackpad gesture are consumed by the same adjacent
    // landing. A new gesture is accepted after the stream goes quiet and the landing is
    // complete; the opposite direction can retarget immediately.
    if (!reversing && !movedByAnotherInput && (quietFor < 140 || !activeReached)) return;

    const baseIndex = movedByAnotherInput || wheelTargetIndex === null
      ? currentDestinationIndex
      : wheelTargetIndex;
    const nextIndex = Math.min(canonicalDestinations.length - 1, Math.max(0, baseIndex + direction));
    wheelTargetIndex = nextIndex;
    lastWheelDirection = direction;
    if (reversing) window.scrollTo({ behavior: "auto", top: window.scrollY });
    if (nextIndex === baseIndex) return;
    window.scrollTo({ behavior: "smooth", top: canonicalDestinations[nextIndex] });
  };

  const syncStack = () => {
    if (!stack || reducedMotion || !panelLayouts.length) return;
    const scrollY = window.scrollY;
    const opens = panelLayouts.map(({ open }) => open);

    panelLayouts.forEach(({ element: child, entranceDistance, open }, panelIndex) => {
      const raw = open - scrollY;
      if (panelIndex === 0) {
          const distance = entranceDistance;
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
        child.style.borderRadius = raw <= 2 ? "0" : "28px 28px 0 0";
        for (const element of [child.querySelector<HTMLElement>("[data-mob='chapter']"), child.querySelector<HTMLElement>("[data-stackind]")]) {
          element?.style.setProperty("opacity", "1", "important");
        }
      }
    });

    if (dots.length && opens.length >= 3) {
      const progress = Math.min(1, Math.max(0, (scrollY - opens[0]) / Math.max(1, opens[2] - opens[0])));
      dots.forEach((dot) => { dot.style.left = `calc(${(progress * 100).toFixed(2)}% - 4.5px)`; });
    }
  };

  const syncSprings = () => {
    for (const spring of springs) {
      spring.velocityX = (spring.velocityX + (spring.targetX - spring.x) * 0.06) * 0.8;
      spring.velocityY = (spring.velocityY + (spring.targetY - spring.y) * 0.06) * 0.8;
      spring.x += spring.velocityX;
      spring.y += spring.velocityY;
      if (Math.abs(spring.targetX - spring.x) <= 0.01 && Math.abs(spring.velocityX) <= 0.01) {
        spring.x = spring.targetX;
        spring.velocityX = 0;
      }
      if (Math.abs(spring.targetY - spring.y) <= 0.01 && Math.abs(spring.velocityY) <= 0.01) {
        spring.y = spring.targetY;
        spring.velocityY = 0;
      }
      spring.element.style.transform = `translate(${spring.x.toFixed(2)}px, ${spring.y.toFixed(2)}px) rotate(${spring.rotation})`;
    }
  };

  const runFrame = () => {
    animationFrame = 0;
    if (destroyed) return;
    if (geometryDirty) {
      geometryDirty = false;
      measureStack();
      stackDirty = true;
    }
    if (stackDirty) {
      stackDirty = false;
      syncStack();
    }
    syncSprings();
    if (springsAreMoving()) scheduleFrame();
  };

  function scheduleFrame() {
    if (!animationFrame && !destroyed) animationFrame = window.requestAnimationFrame(runFrame);
  }

  const onScroll = () => {
    stackDirty = true;
    scheduleFrame();
  };

  const onResize = () => {
    geometryDirty = true;
    stackDirty = true;
    scheduleFrame();
  };

  if (springs.length) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }
  if (stack && !reducedMotion) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    if (typeof window.ResizeObserver === "function") {
      stackObserver = new window.ResizeObserver(onResize);
      stackObserver.observe(stack);
      for (const child of Array.from(stack.children)) stackObserver.observe(child);
    }
    scheduleFrame();
  }
  if (finePointer && !reducedMotion) {
    root.dataset.homeWheelController = "adjacent";
    window.addEventListener("wheel", onWheel, { passive: false });
  }

  return () => {
    destroyed = true;
    observer?.disconnect();
    footerObserver?.disconnect();
    stackObserver?.disconnect();
    window.removeEventListener("resize", syncClosingComposition);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    window.cancelAnimationFrame(animationFrame);
    root.style.removeProperty("--home-public-footer-height");
    delete root.dataset.homeWheelController;
    delete root.dataset.homeInteractions;
  };
}

export function HandoffInteractions({ name }: { name: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-handoff-page="${name}"]`);
    if (!root) return;

    const cleanUpShared = setupSharedHandoffInteractions(root);
    const cleanUpHome = name === "home" ? setupHomeInteractions(root) : undefined;

    const learnInput = name === "learn" ? root.querySelector<HTMLInputElement>("[data-learn-discovery-search] input") : null;
    const allGuides = name === "learn" ? root.querySelector<HTMLElement>("[data-learn-all-guides]") : null;
    const learnSection = allGuides?.parentElement?.parentElement ?? null;
    const learnCards = learnSection ? [...learnSection.querySelectorAll<HTMLAnchorElement>("a[data-learn-category]")] : [];
    const learnButtons = learnSection ? [...learnSection.querySelectorAll<HTMLButtonElement>("button[data-learn-topic]")] : [];
    const learnI18n = name === "learn" ? root.querySelector<HTMLElement>("[data-learn-i18n]") : null;
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
    }
    for (const button of learnButtons) {
      button.type = "button";
      button.setAttribute("aria-pressed", String(button.dataset.learnTopic === learnTopic));
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
        const active = item.dataset.learnTopic === learnTopic;
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
          ? `${visible} ${visible === 1 ? learnI18n?.dataset.learnOne : learnI18n?.dataset.learnMany}`
          : (learnI18n?.dataset.learnNone ?? "");
      }
      updateLearnButtonState();
    };

    if (name === "learn") applyLearnFilters();

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;
      const label = button.dataset.learnTopic ?? normalized(button.textContent);
      if (label === "start programme") {
        window.location.assign("/program?entry=start");
        return;
      }
      if (name !== "learn") return;
      if (!button.dataset.learnTopic) return;
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
