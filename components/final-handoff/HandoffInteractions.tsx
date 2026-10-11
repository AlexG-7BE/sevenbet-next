"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";

import { usePublicNavigationFeedback } from "@/components/public-shell/PublicNavigationFeedback";

import { createHomeWheelIntent } from "./homeWheelIntent";

function normalized(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

const HOME_CHAPTER_WAITING_OPACITY = 0.001;
// A landing that has not arrived after this long was taken over by the scrollbar or the keyboard.
const HOME_TRAVEL_EXPIRES_MS = 1200;

type HomeTravel = {
  direction: number;
  since: number;
  to: number;
};

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
  for (const dot of dots) dot.style.willChange = "transform";
  let publicFooter = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
  let animationFrame = 0;
  let observer: IntersectionObserver | null = null;
  let destroyed = false;
  let footerMutationObserver: MutationObserver | null = null;
  let footerObserver: ResizeObserver | null = null;
  let stackObserver: ResizeObserver | null = null;
  let geometryDirty = Boolean(stack) && !reducedMotion;
  let stackDirty = Boolean(stack) && !reducedMotion;
  let panelLayouts: Array<{ element: HTMLElement; entranceDistance: number; open: number; pinned: boolean }> = [];
  let dotTracks: number[] = [];
  let canonicalDestinations: number[] = [];
  let travel: HomeTravel | null = null;
  let queuedDirection = 0;
  let wheelTarget: EventTarget | null = null;
  let ownScroller: Element | null = null;
  const readWheelIntent = createHomeWheelIntent(() => window.innerHeight);
  const scrollDrivenChapter = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");

  const measureCanonicalDestinations = () => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const positions = Array.from(root.querySelectorAll<HTMLElement>("[data-home-snap]"), (element) => (
      Math.min(maximum, Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY)))
    ));
    if (!positions.some((position) => Math.abs(position - maximum) <= 3)) positions.push(maximum);
    canonicalDestinations = [...new Set(positions)].sort((left, right) => left - right);
  };

  const syncClosingComposition = () => {
    const currentFooter = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    if (!currentFooter) return;
    root.style.setProperty("--home-public-footer-height", `${Math.ceil(currentFooter.getBoundingClientRect().height)}px`);
  };

  const observeCurrentFooter = () => {
    const currentFooter = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    if (currentFooter === publicFooter && footerObserver) return;
    footerObserver?.disconnect();
    footerObserver = null;
    publicFooter = currentFooter;
    if (publicFooter && typeof window.ResizeObserver === "function") {
      footerObserver = new window.ResizeObserver(syncClosingComposition);
      footerObserver.observe(publicFooter);
    }
    syncClosingComposition();
  };

  observeCurrentFooter();
  window.addEventListener("resize", syncClosingComposition, { passive: true });
  if (typeof window.MutationObserver === "function") {
    footerMutationObserver = new window.MutationObserver(observeCurrentFooter);
    footerMutationObserver.observe(document.body, { childList: true, subtree: true });
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
    let anchorTop: number | null = null;
    const nextLayouts: typeof panelLayouts = [];

    for (const child of Array.from(stack.children) as HTMLElement[]) {
      if (child.hasAttribute("data-snap")) continue;
      const childStyle = window.getComputedStyle(child);
      const marginTop = Number.parseFloat(childStyle.marginTop) || 0;
      const marginBottom = Number.parseFloat(childStyle.marginBottom) || 0;
      if (child.hasAttribute("data-home-snap-anchor")) anchorTop = child.getBoundingClientRect().top + scrollY;
      if (child.hasAttribute("data-stackpanel")) {
        // A panel is fully open at the anchor in front of it. One pulled up by a negative
        // margin is already pinned while it opens (see transformHomeHandoffCss).
        nextLayouts.push({
          element: child,
          entranceDistance: Math.max(viewportHeight, flow),
          open: anchorTop ?? stackTop + flow + marginTop,
          pinned: marginTop < 0,
        });
        anchorTop = null;
      }
      flow += marginTop + child.offsetHeight + marginBottom;
    }

    panelLayouts = nextLayouts;
    dotTracks = dots.map((dot) => dot.parentElement?.clientWidth ?? 0);
    measureCanonicalDestinations();
  };

  const adjacentDestination = (position: number, direction: number) => {
    const ordered = direction > 0 ? canonicalDestinations : [...canonicalDestinations].reverse();
    return ordered.find((destination) => (direction > 0 ? destination > position + 4 : destination < position - 4));
  };

  // The landing is the browser's own smooth scroll (Founder, 11 Oct 2026: it has to be
  // perfectly smooth). That scroll runs off the main thread, so a busy page cannot stall it;
  // moved from here frame by frame instead, the page froze for 50-150ms whenever the main
  // thread did. Every stop is a snap position, so the browser rests exactly on it.
  const beginTravel = (direction: number) => {
    const to = adjacentDestination(travel ? travel.to : window.scrollY, direction);
    if (to === undefined) return false;
    window.scrollTo({ behavior: "smooth", top: to });
    // Turned back before the page had moved: it is already there and no scroll will say so.
    travel = Math.abs(window.scrollY - to) <= 2 ? null : { direction, since: window.performance.now(), to };
    return true;
  };

  const settleTravel = () => {
    if (!travel || Math.abs(window.scrollY - travel.to) > 2) return;
    const next = queuedDirection;
    travel = null;
    queuedDirection = 0;
    if (next) beginTravel(next);
  };

  // An element that scrolls on its own, such as the language menu, keeps its wheel.
  const findOwnScroller = (target: EventTarget | null) => {
    for (let element = target instanceof Element ? target : null; element && element !== document.body; element = element.parentElement) {
      if (element.scrollHeight > element.clientHeight + 1 && /auto|scroll/.test(window.getComputedStyle(element).overflowY)) return element;
    }
    return null;
  };

  const onWheel = (event: WheelEvent) => {
    if (reducedMotion || !finePointer || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (event.target !== wheelTarget) {
      wheelTarget = event.target;
      ownScroller = findOwnScroller(wheelTarget);
    }
    if (ownScroller) {
      // At its end the list holds the wheel rather than handing it to the page behind.
      const room = event.deltaY > 0 ? ownScroller.scrollHeight - ownScroller.clientHeight - ownScroller.scrollTop : ownScroller.scrollTop;
      if (room <= 1) event.preventDefault();
      return;
    }
    event.preventDefault();
    if (canonicalDestinations.length < 2) return;
    const now = window.performance.now();
    const direction = readWheelIntent(event, now);
    if (!direction) return;
    if (travel && now - travel.since > HOME_TRAVEL_EXPIRES_MS) travel = null;
    // A second gesture made while a screen is still arriving follows it; the opposite one turns back at once.
    if (travel?.direction === direction) {
      queuedDirection = direction;
      return;
    }
    queuedDirection = 0;
    beginTravel(direction);
  };

  // Phones read the chapters as compact cards in normal flow (see transformHomeHandoffCss):
  // the pinned stack animation must not write its inline transforms there.
  const compactChapters = window.matchMedia("(max-width: 760px)");
  let compactApplied = false;
  const showCompactChapters = () => {
    if (compactApplied) return;
    compactApplied = true;
    for (const panel of panels) {
      panel.style.setProperty("transform", "none", "important");
      panel.style.setProperty("opacity", "1", "important");
      panel.style.removeProperty("border-radius");
      panel.style.removeProperty("pointer-events");
      for (const element of [panel.querySelector<HTMLElement>("[data-mob='chapter']"), panel.querySelector<HTMLElement>("[data-stackind]")]) {
        element?.style.setProperty("opacity", "1", "important");
      }
    }
  };

  const syncStack = () => {
    if (!stack || reducedMotion) return;
    if (compactChapters.matches) {
      showCompactChapters();
      return;
    }
    compactApplied = false;
    if (!panelLayouts.length) return;
    const scrollY = window.scrollY;
    const opens = panelLayouts.map(({ open }) => open);

    panelLayouts.forEach(({ element: child, entranceDistance, open, pinned }, panelIndex) => {
      const raw = open - scrollY;
      if (panelIndex === 0) {
          const distance = entranceDistance;
          // Unseen, it must not take clicks meant for the screen it is waiting over.
          child.style.pointerEvents = raw >= distance ? "none" : "";
          const progress = Math.min(1, Math.max(0, 1 - raw / distance));
          const eased = progress * progress * (3 - 2 * progress);
          const opening = raw > 0 && raw < distance;
          // At rest on the screen before it, it is as good as invisible but drawn: at exactly 0
          // the browser drops its photo and rasterises all of it again in the frames where it
          // starts to appear. Further away it stays at 0, so that work is not done mid-landing.
          const waiting = raw - distance <= 2 ? String(HOME_CHAPTER_WAITING_OPACITY) : "0";
          child.style.setProperty("opacity", opening ? Math.max(HOME_CHAPTER_WAITING_OPACITY, Math.min(1, progress * 10)).toFixed(3) : raw > 0 ? waiting : "1", "important");
          if (pinned && scrollDrivenChapter) {
            // The browser scales it with the scroll, off the main thread (see transformHomeHandoffCss).
            child.style.removeProperty("transform");
          } else {
            child.style.setProperty("transform", opening ? `${pinned ? "" : `translateY(${-raw}px) `}scale(${(0.24 + 0.76 * eased).toFixed(4)})` : "none", "important");
          }
          // The corners square off once, when it is fully open. Easing them over the last
          // stretch repainted the whole photo on every step, in the middle of the motion.
          child.style.borderRadius = raw > 0 ? "28px" : "0";
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
      // Each dot rides its own layer on a transform. Moved by `left`, it repainted its
      // chapter's whole photo on every frame the page scrolled between chapters.
      dots.forEach((dot, index) => {
        const shift = `translateX(${(progress * dotTracks[index]).toFixed(1)}px)`;
        if (dot.style.transform !== shift) dot.style.transform = shift;
      });
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
    window.addEventListener("scroll", settleTravel, { passive: true });
  }

  return () => {
    destroyed = true;
    observer?.disconnect();
    footerMutationObserver?.disconnect();
    footerObserver?.disconnect();
    stackObserver?.disconnect();
    window.removeEventListener("resize", syncClosingComposition);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", settleTravel);
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    window.cancelAnimationFrame(animationFrame);
    root.style.removeProperty("--home-public-footer-height");
    delete root.dataset.homeWheelController;
    delete root.dataset.homeInteractions;
  };
}

export function HandoffInteractions({ name, programmePath = "/program" }: { name: string; programmePath?: string }) {
  const navigationFeedback = usePublicNavigationFeedback();
  const navigationFeedbackId = useId();
  const router = useRouter();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-handoff-page="${name}"]`);
    if (!root) return;

    const cleanUpShared = setupSharedHandoffInteractions(root);
    const cleanUpHome = name === "home" ? setupHomeInteractions(root) : undefined;

    const learnInput = name === "learn" ? root.querySelector<HTMLInputElement>("[data-learn-discovery-search] input") : null;
    const allGuides = name === "learn" ? root.querySelector<HTMLElement>("[data-learn-all-guides]") : null;
    const learnSection = allGuides?.parentElement?.parentElement ?? null;
    const learnCards = learnSection ? [...learnSection.querySelectorAll<HTMLAnchorElement>("a[data-learn-category]")] : [];
    const learnProgrammeBridge = learnSection?.querySelector<HTMLElement>("[data-learn-programme-bridge]") ?? null;
    const learnButtons = learnSection ? [...learnSection.querySelectorAll<HTMLButtonElement>("button[data-learn-topic]")] : [];
    const learnI18n = name === "learn" ? root.querySelector<HTMLElement>("[data-learn-i18n]") : null;
    const learnCount = allGuides?.parentElement?.querySelector<HTMLElement>(".sc-interp") ?? null;
    const learnGrid = learnCards[0]?.parentElement
      ?? learnSection?.querySelector<HTMLElement>("[data-learn-grid]")
      ?? null;
    const learnStatus = name === "learn" ? document.createElement("p") : null;
    // Start here guides are not repeated in All guides (Founder, 25 Sep 2026). While a topic or search
    // is active, a copy of each matching one joins the top of the list, so the results stay complete
    // without changing the layout above the filters. Unfiltered, the copies are not in the document.
    const learnStartCards = name === "learn" ? [...root.querySelectorAll<HTMLAnchorElement>("[data-learn-start-section] a[data-learn-category]")] : [];
    const learnStartEchoes = learnGrid ? learnStartCards.map((card) => {
      const echo = card.cloneNode(true) as HTMLAnchorElement;
      echo.classList.replace("scp2", "scp3");
      echo.dataset.learnStartEcho = "";
      echo.style.padding = "24px 30px";
      echo.style.borderRadius = "14px";
      echo.style.background = "rgb(250, 250, 247)";
      return echo;
    }) : [];
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
    let pendingNavigationLabel = "";
    let pendingNavigationTimeout = 0;

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
      const filtered = learnTopic !== "all topics" || Boolean(learnQuery);
      const cardMatches = (card: HTMLElement) => (learnTopic === "all topics" || card.dataset.learnCategory === learnTopic)
        && (!learnQuery || normalized(card.textContent).includes(learnQuery));
      for (const card of learnCards) {
        const matches = cardMatches(card);
        card.hidden = !matches;
        // Captured cards carry inline display:flex. That author style outranks the
        // user-agent [hidden] rule, so apply the visibility state at the same level.
        card.style.display = matches ? "flex" : "none";
        if (!card.hidden) visible += 1;
      }
      const shownEchoes: HTMLAnchorElement[] = [];
      learnStartCards.forEach((card, index) => {
        const matches = cardMatches(card);
        if (matches) visible += 1;
        const echo = learnStartEchoes[index];
        if (echo && filtered && matches) shownEchoes.push(echo);
      });
      for (const echo of learnStartEchoes) echo.remove();
      if (learnGrid && shownEchoes.length) learnGrid.prepend(...shownEchoes);
      if (learnCount) learnCount.textContent = String(visible);
      if (learnProgrammeBridge) {
        // The inline Programme card belongs to the full list; a topic or search result shows guides only.
        learnProgrammeBridge.hidden = filtered;
        learnProgrammeBridge.style.display = filtered ? "none" : "flex";
      }
      if (learnStatus) {
        const idleEmptyCatalogue = learnCards.length === 0 && learnStartCards.length === 0 && !filtered;
        learnStatus.textContent = idleEmptyCatalogue
          ? ""
          : visible
            ? `${visible} ${visible === 1 ? learnI18n?.dataset.learnOne : learnI18n?.dataset.learnMany}`
            : (learnI18n?.dataset.learnNone ?? "");
      }
      updateLearnButtonState();
    };

    if (name === "learn") applyLearnFilters();

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (anchor && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !anchor.download && (!anchor.target || anchor.target === "_self")) {
        const destination = new URL(anchor.href, window.location.href);
        const sameDocument = destination.pathname === window.location.pathname && destination.search === window.location.search;
        if (destination.origin === window.location.origin && !sameDocument) {
          event.preventDefault();
          pendingNavigationLabel = anchor.textContent?.trim().replace(/\s+/g, " ") || destination.pathname;
          navigationFeedback?.({ id: navigationFeedbackId, label: pendingNavigationLabel }, true);
          window.clearTimeout(pendingNavigationTimeout);
          // Leaving this page clears the pill; until then it holds for the layout's 30 s maxDuration,
          // because a pill that vanished at 8 s left a slow tap looking dead (4 Oct 2026).
          pendingNavigationTimeout = window.setTimeout(() => {
            navigationFeedback?.({ id: navigationFeedbackId, label: pendingNavigationLabel }, false);
            pendingNavigationLabel = "";
          }, 30_000);
          router.push(`${destination.pathname}${destination.search}${destination.hash}`);
          return;
        }
      }
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button");
      if (!button) return;
      const label = button.dataset.learnTopic ?? normalized(button.textContent);
      if (label === "start programme") {
        window.location.assign(`${programmePath}?entry=start`);
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
      for (const echo of learnStartEchoes) echo.remove();
      window.clearTimeout(pendingNavigationTimeout);
      if (pendingNavigationLabel) {
        navigationFeedback?.({ id: navigationFeedbackId, label: pendingNavigationLabel }, false);
      }
      cleanUpHome?.();
      cleanUpShared?.();
    };
  }, [name, navigationFeedback, navigationFeedbackId, programmePath, router]);
  return null;
}
