// Shape guards for the two slide props the shipped templates read directly as data: `chartData`
// (bar series) and `images` (image grid). The runtime coerces neither — it only checks Array-ness —
// so a wrong element shape reaches the template and renders as a NaN-height bar or a broken image
// instead of failing the deck. These checks close that gap.
import fs from "node:fs";
import path from "node:path";

const REMOTE_SRC = /^[a-z][a-z0-9+.-]*:/i;

// Returns { errors, warnings } of message strings, already prefixed with `label`.
export function validateSlideMediaProps({ metadata, label, deckDir }) {
  const errors = [];
  const warnings = [];
  validateChartData(metadata.chartData, label, errors);
  validateImages(metadata.images, label, deckDir, errors, warnings);
  validateSingleImage(metadata, label, deckDir, errors, warnings);
  return { errors, warnings };
}

function validateChartData(chartData, label, errors) {
  if (chartData === undefined) return;
  if (!Array.isArray(chartData)) {
    errors.push(`${label}: chartData must be an array of {label, value} entries.`);
    return;
  }
  if (chartData.length === 0) {
    errors.push(`${label}: chartData is empty — remove it or give the chart at least one entry.`);
    return;
  }
  const seen = new Set();
  chartData.forEach((entry, index) => {
    const at = `${label}: chartData[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${at} must be an object with "label" and "value".`);
      return;
    }
    if (typeof entry.label !== "string" || entry.label.trim() === "") {
      errors.push(`${at}.label must be a non-empty string.`);
    } else if (seen.has(entry.label)) {
      // The chart keys bars by label; duplicates collide and a bar is dropped or reused.
      errors.push(`${at}.label "${entry.label}" is duplicated — chart entry labels must be unique.`);
    } else {
      seen.add(entry.label);
    }
    if (typeof entry.value !== "number" || !Number.isFinite(entry.value)) {
      // A quoted number is the common authoring slip: it divides into NaN and the bar vanishes.
      errors.push(`${at}.value must be a finite number, not ${JSON.stringify(entry.value)}.`);
    }
  });
}

// The scalar counterpart of `images[]`: imageSrc goes straight into <img src> in the shipped
// templates, so it carries the same failure mode and gets the same guard.
function validateSingleImage(metadata, label, deckDir, errors, warnings) {
  const { imageSrc, imageAlt } = metadata;
  if (imageSrc === undefined) {
    if (imageAlt !== undefined) {
      errors.push(`${label}: imageAlt is set without an imageSrc.`);
    }
    return;
  }
  if (typeof imageSrc !== "string" || imageSrc.trim() === "") {
    errors.push(`${label}: imageSrc must be a non-empty string.`);
    return;
  }
  if (imageAlt !== undefined && typeof imageAlt !== "string") {
    errors.push(`${label}: imageAlt must be a string.`);
  } else if (imageAlt === undefined || imageAlt.trim() === "") {
    warnings.push(`${label}: imageSrc has no imageAlt — screen readers will announce nothing for this image.`);
  }
  validateImageSrc(imageSrc, `${label}: imageSrc`, deckDir, errors, warnings);
}

function validateImages(images, label, deckDir, errors, warnings) {
  if (images === undefined) return;
  if (!Array.isArray(images)) {
    errors.push(`${label}: images must be an array of {src, alt, caption} entries.`);
    return;
  }
  if (images.length === 0) {
    errors.push(`${label}: images is empty — remove it or give the grid at least one image.`);
    return;
  }
  images.forEach((entry, index) => {
    const at = `${label}: images[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${at} must be an object with a "src".`);
      return;
    }
    if (entry.alt !== undefined && typeof entry.alt !== "string") {
      errors.push(`${at}.alt must be a string.`);
    } else if (entry.alt === undefined || entry.alt.trim() === "") {
      warnings.push(`${at} has no alt text — screen readers will announce nothing for this image.`);
    }
    if (entry.caption !== undefined && typeof entry.caption !== "string") {
      errors.push(`${at}.caption must be a string.`);
    }
    if (typeof entry.src !== "string" || entry.src.trim() === "") {
      errors.push(`${at}.src must be a non-empty string.`);
      return;
    }
    validateImageSrc(entry.src, at, deckDir, errors, warnings);
  });
}

// A deck is a portable bundle: an asset that does not travel inside it breaks offline export.
function validateImageSrc(src, at, deckDir, errors, warnings) {
  const field = at.endsWith("imageSrc") ? at : `${at}.src`;
  if (REMOTE_SRC.test(src)) {
    warnings.push(`${field} "${src}" is remote — it will not render in an offline or exported deck.`);
    return;
  }
  if (path.isAbsolute(src)) {
    errors.push(`${field} "${src}" is an absolute path — use a path relative to the deck bundle.`);
    return;
  }
  const resolved = path.resolve(deckDir, src);
  const withinDeck = path.relative(deckDir, resolved);
  if (withinDeck.startsWith("..") || path.isAbsolute(withinDeck)) {
    errors.push(`${field} "${src}" points outside the deck bundle.`);
    return;
  }
  if (!fs.existsSync(resolved)) {
    errors.push(`${field} "${src}" does not exist in the deck bundle.`);
  }
}
