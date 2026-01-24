import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format seconds into human-friendly time format
 * Only shows relevant units (hours, minutes, seconds)
 * Examples: "5s", "2m 30s", "1h 20m", "2h 15m 45s"
 * @param seconds - Total seconds to format
 * @returns Formatted time string
 */
export function formatTimeHMS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Format seconds into compact H:MM:SS format
 * @param seconds - Total seconds to format
 * @returns Formatted time string like "1:20:30"
 */
export function formatTimeCompact(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Waits for an element to appear in the DOM
 * @param selector - CSS selector to wait for
 * @param timeout - Maximum time to wait in ms (default 3000)
 * @returns Promise resolving to the element or null if timeout reached
 */
export function waitForElement(selector: string, timeout = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get accurate bounding rect for an element, accounting for visualViewport and scroll
 * @param selector - CSS selector for the element
 * @param retries - Number of retries if element not found or rect invalid
 * @param delay - Delay between retries in ms
 * @returns Promise resolving to DOMRect or null
 */
export async function getAccurateBoundingRect(
  selector: string,
  retries = 3,
  delay = 200
): Promise<DOMRect | null> {
  for (let i = 0; i <= retries; i++) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      // Check if rect is valid (not 0,0 and visible)
      if (rect.width > 0 && rect.height > 0) {
        // Get all the context we need for debugging
        const visualViewport = window.visualViewport;
        const computedStyle = window.getComputedStyle(el);
        const position = computedStyle.position;
        const transform = computedStyle.transform;
        
        // Check for transformed ancestors
        let hasTransformedAncestor = false;
        let parent = el.parentElement;
        while (parent) {
          const parentStyle = window.getComputedStyle(parent);
          if (parentStyle.transform !== 'none' || parentStyle.perspective !== 'none') {
            hasTransformedAncestor = true;
            console.log('[TUTORIAL] Found transformed ancestor:', parent.tagName, parent.className);
            break;
          }
          parent = parent.parentElement;
        }
        
        // Extensive debugging as requested
        console.log('[TUTORIAL] NAV RECT DEBUG', {
          selector,
          attempt: i + 1,
          rawRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
          position,
          transform,
          hasTransformedAncestor,
          windowInnerHeight: window.innerHeight,
          distanceFromBottom: window.innerHeight - rect.bottom,
          visualViewport: visualViewport ? {
            offsetTop: visualViewport.offsetTop,
            offsetLeft: visualViewport.offsetLeft,
            pageTop: visualViewport.pageTop,
            height: visualViewport.height,
            width: visualViewport.width
          } : 'N/A'
        });

        // Validate bottom navbar position - should be near the bottom
        if (selector.includes('nav') || selector.includes('today')) {
          const isValidBottomPosition = rect.bottom >= window.innerHeight - 100 && rect.bottom <= window.innerHeight + 10;
          if (!isValidBottomPosition) {
            console.warn('[TUTORIAL] Invalid bottom position detected!', {
              rectBottom: rect.bottom,
              windowHeight: window.innerHeight,
              diff: rect.bottom - window.innerHeight
            });
            // If position is way off, retry
            if (i < retries) {
              console.log('[TUTORIAL] Retrying due to invalid position...');
              await sleep(delay);
              continue;
            }
          }
        }

        return rect;
      }
    }
    if (i < retries) await sleep(delay);
  }
  return null;
}
