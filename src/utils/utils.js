import Decimal from "decimal.js";

export const deci = (value) => {
  try {
    return new Decimal(value);
  } catch (error) {
    return null;
  }
};
/**
 * Accepts big numbers
 */
export const deciB = (value) => {
  try {
    return new Decimal(value.toString());
  } catch (error) {
    return null;
  }
};

/**
 * return a formatter number with commas , can accept string , number , float , e.t.c
 */
export const formatNumber = (value, precesion = 3) => {
  const number = new Decimal(value);
  // Round the number to the max decimal places
  const roundedNumber = number.toDecimalPlaces(precesion);
  const formattedNumber = roundedNumber.toNumber().toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precesion,
  });
  return formattedNumber;
};

export const presaleStates = {
  IN_FUTURE: 0,
  RUNNING: 1,
  PAUSED: 2,
  SOLD_OUT: 3,
  EXPIRED: 4,
};

export function formatToEllipsis(
  hexString,
  prefixLength = 8,
  suffixLength = 10
) {
  // Ensure the input is a string
  if (typeof hexString !== "string") {
    throw new Error("Input must be a string");
  }

  // Check if the string is long enough for formatting
  if (hexString.length <= prefixLength + suffixLength + 3) {
    return hexString; // Return the string as is if too short for ellipsis
  }

  // Extract the prefix and suffix
  const prefix = hexString.slice(0, prefixLength);
  const suffix = hexString.slice(-suffixLength);

  // Combine and return the formatted string
  return `${prefix}...${suffix}`;
}

export function copyToClipboard(text) {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; // Avoid scrolling to bottom
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy", false, "");
      console.log("Fallback: Copying text was successful!");
    } catch (err) {
      console.error("Fallback: Unable to copy text", err);
    }
    document.body.removeChild(textarea);
  } else {
    // Modern method
    navigator.clipboard
      .writeText(text)
      .then(() => console.log("Text copied to clipboard!"))
      .catch((err) => console.error("Failed to copy text to clipboard", err));
  }
}

// Example usage:
