const germanyTimeZone = "Europe/Berlin";
const footerGreetingEl = document.querySelector("[data-footer-greeting]");
const timeDifferenceEl = document.querySelector("[data-time-difference]");
const tooltipTimeouts = new WeakMap();

const getTimeZoneOffsetMinutes = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const timeAsUtc = Date.UTC(
    valueByType.year,
    valueByType.month - 1,
    valueByType.day,
    valueByType.hour,
    valueByType.minute,
    valueByType.second,
  );

  return Math.round((timeAsUtc - date.getTime()) / 60000);
};

const formatUtcDifference = (differenceMinutes) => {
  if (differenceMinutes === 0) {
    return "UTC+0";
  }

  const absoluteMinutes = Math.abs(differenceMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const sign = differenceMinutes > 0 ? "+" : "-";
  const minuteText = minutes > 0 ? `:${String(minutes).padStart(2, "0")}` : "";

  return `UTC${sign}${hours}${minuteText}`;
};

const updateFooterGreeting = (date) => {
  if (!footerGreetingEl) {
    return;
  }

  const hour = date.getHours();
  footerGreetingEl.textContent =
    hour >= 22 || hour < 6 ? "Good night!" : "Have a great day!";
};

const updateTimeComparison = () => {
  const now = new Date();

  updateFooterGreeting(now);

  if (!timeDifferenceEl) {
    return;
  }

  const localTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone";
  const germanyOffset = getTimeZoneOffsetMinutes(now, germanyTimeZone);
  const localOffset = getTimeZoneOffsetMinutes(now, localTimeZone);

  timeDifferenceEl.textContent = formatUtcDifference(localOffset - germanyOffset);
};

if (footerGreetingEl || timeDifferenceEl) {
  updateTimeComparison();
  setInterval(updateTimeComparison, 60 * 1000);
}

document.querySelectorAll(".deactivated").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    link.classList.remove("show-tooltip");

    requestAnimationFrame(() => {
      link.classList.add("show-tooltip");
    });

    const existingTimeout = tooltipTimeouts.get(link);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      link.classList.remove("show-tooltip");
      tooltipTimeouts.delete(link);
    }, 1200);

    tooltipTimeouts.set(link, timeout);
  });
});

const shareModal = document.querySelector("[data-share-modal]");
const shareOpenButton = document.querySelector("[data-share-open]");
const shareCloseButton = document.querySelector("[data-share-close]");
const shareCopyButton = document.querySelector("[data-share-copy]");
let focusedElementBeforeShareModal = null;

const closeShareModal = () => {
  if (!(shareModal instanceof HTMLElement)) {
    return;
  }

  shareModal.hidden = true;
  shareOpenButton?.setAttribute("aria-expanded", "false");

  if (focusedElementBeforeShareModal instanceof HTMLElement) {
    focusedElementBeforeShareModal.focus();
  }
};

const openShareModal = () => {
  if (!(shareModal instanceof HTMLElement)) {
    return;
  }

  focusedElementBeforeShareModal = document.activeElement;
  shareModal.hidden = false;
  shareOpenButton?.setAttribute("aria-expanded", "true");

  if (shareCloseButton instanceof HTMLElement) {
    shareCloseButton.focus();
  }
};

if (shareOpenButton instanceof HTMLElement) {
  shareOpenButton.addEventListener("click", openShareModal);
}

if (shareCloseButton instanceof HTMLElement) {
  shareCloseButton.addEventListener("click", closeShareModal);
}

if (shareModal instanceof HTMLElement) {
  shareModal.addEventListener("click", (event) => {
    if (event.target === shareModal) {
      closeShareModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!shareModal.hidden && event.key === "Escape") {
      closeShareModal();
    }
  });
}

if (shareCopyButton instanceof HTMLElement) {
  const defaultCopyText = shareCopyButton.textContent?.trim() || "Link kopieren";

  shareCopyButton.addEventListener("click", async () => {
    const shareUrl = shareCopyButton.dataset.shareUrl;

    if (!shareUrl) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(shareUrl);
      shareCopyButton.textContent = "Kopiert";
      setTimeout(() => {
        shareCopyButton.textContent = defaultCopyText;
      }, 1200);
    } catch {
      window.prompt("Link kopieren", shareUrl);
    }
  });
}
