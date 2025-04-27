// Notify background script to clear any previously stored tab settings
chrome.runtime.sendMessage({ action: "clearTabSettings" });

// Default font scaling settings
let fontPercentage = 100;
const minPercentage = 50;
const maxPercentage = 150;

// Maps to store original element properties
const originalFontSizes = new Map(); // Store the original font sizes for elements
let originalTextMap = new Map();
let readSelectionEnabled = false;
let readFullPageEnabled = false;

document
  .querySelectorAll("*:not(script, style, meta, link, title, head)")
  .forEach((element) => {
    if (!originalFontSizes.has(element)) {
      originalFontSizes.set(
        element,
        parseFloat(window.getComputedStyle(element).fontSize)
      );
    }
  });

// Request animation frame for smooth DOM updates without blocking
function handleDomChanges(functionToCall) {
  requestAnimationFrame(functionToCall);
}

// Function to update page font size
function updatePageFontSize(percentage, absolute = false) {
  fontPercentage = absolute ? percentage : fontPercentage + percentage;
  fontPercentage = Math.max(
    minPercentage,
    Math.min(maxPercentage, fontPercentage)
  );

  handleDomChanges(() => {
    document
      .querySelectorAll("*:not(script, style, meta, link, title, head)")
      .forEach((element) => {
        let baseSize = originalFontSizes.get(element);
        let newSize = (baseSize * fontPercentage) / 100;
        element.style.fontSize = newSize + "px";
      });

    console.log("Updated font size to:", fontPercentage + "%");
  });
}

// Function to apply Black and White mode
// function applyBlackAndWhiteMode(enable) {
//   handleDomChanges(
//     () =>
//       (document.documentElement.style.filter = enable
//         ? "grayscale(100%)"
//         : "none")
//   );

//   console.log("Black & White Mode:", enable);
// }

// Function to apply color modes: Normal, Black & White, Dark
function applyColorMode(mode) {
  handleDomChanges(() => {
    if (mode === "normal") {
      document.documentElement.style.filter = "none";
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.querySelectorAll("*").forEach(el => {
        el.style.backgroundColor = "";
        el.style.color = "";
      });
    } else if (mode === "bw") {
      document.documentElement.style.filter = "grayscale(100%)";
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.querySelectorAll("*").forEach(el => {
        el.style.backgroundColor = "";
        el.style.color = "";
      });
    } else if (mode === "dark") {
      document.documentElement.style.filter = "none";
      document.body.style.backgroundColor = "#121212";
      document.body.style.color = "#e0e0e0";
      document.querySelectorAll("*").forEach(el => {
        el.style.backgroundColor = "#121212";
        el.style.color = "#e0e0e0";
        el.style.filter = "none"; // // light text
      });
    }
    console.log("Applied color mode:", mode);
  });
}


// Function to apply Bionic Reading Mode
function applyBionicReading(enable) {
  const paragraphs = [...document.querySelectorAll("p")];

  if (enable) {
    processParagraphsInBatches(paragraphs, (p, done) => {
      if (!p.getAttribute("data-bionic-applied")) {
        walkAndBoldTextNodes(p);
        p.setAttribute("data-bionic-applied", "true");
      }
      done();
    });
  } else {
    processParagraphsInBatches(paragraphs, (p, done) => {
      if (p.getAttribute("data-bionic-applied")) {
        p.innerHTML = p.getAttribute("data-original-html");
        p.removeAttribute("data-original-html");
        p.removeAttribute("data-bionic-applied");
      }
      done();
    });
  }
}

// Helper: Bold first 40% of each word inside text nodes
function walkAndBoldTextNodes(element) {
  if (!element.getAttribute("data-original-html")) {
    element.setAttribute("data-original-html", element.innerHTML);
  }

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  const nodesToProcess = [];

  while ((node = walker.nextNode())) {
    nodesToProcess.push(node);
  }

  nodesToProcess.forEach((node) => {
    const parent = node.parentNode;
    const text = node.textContent.trim();
    if (text.length > 0) {
      const html = text
        .split(/\s+/)
        .map((word) => {
          if (word.length < 1) return word;
          const boldLength = Math.ceil(word.length * 0.4);
          const bolded = `<b>${word.slice(0, boldLength)}</b>${word.slice(
            boldLength
          )}`;
          return bolded;
        })
        .join(" ");

      const tempSpan = document.createElement("span");
      tempSpan.innerHTML = html;
      parent.replaceChild(tempSpan, node);
    }
  });
}

// Helper: Process paragraphs in small batches
function processParagraphsInBatches(elements, processElement, onComplete) {
  const batchSize = 50;
  let index = 0;

  function processNextBatch() {
    const batch = elements.slice(index, index + batchSize);
    let processedCount = 0;

    batch.forEach((el) => {
      processElement(el, () => {
        processedCount++;
        if (processedCount === batch.length) {
          if (index + batchSize < elements.length) {
            index += batchSize;
            requestAnimationFrame(processNextBatch);
          } else {
            if (onComplete) onComplete();
          }
        }
      });
    });

    if (batch.length === 0 && onComplete) {
      onComplete();
    }
  }

  processNextBatch();
}

function bionicTransformAsync(text, callback) {
  // Dynamically create and use a Web Worker from internal script to offload bionic reading processing
  fetch(chrome.runtime.getURL("content-scripts/bionicWorker.js"))
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch worker script: ${response.statusText}`
        );
      }
      return response.text();
    })
    .then((workerScript) => {
      // Create a Blob from the worker script
      const blob = new Blob([workerScript], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);

      // Create the worker from the Blob URL
      const worker = new Worker(blobUrl);

      function handleWorkerMessage(callback) {
        callback();
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
      }
      worker.onmessage = (e) => {
        handleWorkerMessage(() => callback(e.data));
      };

      worker.onerror = (e) => {
        handleWorkerMessage(() => console.error("Error in worker:", e.message));
      };

      console.log("Posting message to worker...");
      worker.postMessage(text);
    })
    .catch((error) => {
      console.error("Error loading worker script:", error);
    });
}

function bionicTransform(text) {
  return text
    .split(" ")
    .map((word) => {
      if (word.length < 1) return word;

      // Preserve punctuation (basic)
      const match = word.match(/^(\W*)(\w+)(\W*)$/);
      if (!match) return word;

      const [, prefix, core, suffix] = match;
      const boldCount = Math.ceil(core.length * 0.4);
      const bolded = `<b>${core.slice(0, boldCount)}</b>${core.slice(
        boldCount
      )}`;
      return `${prefix}${bolded}${suffix}`;
    })
    .join(" ");
}

// Listen for text selection
document.addEventListener("mouseup", () => {
  if (!readSelectionEnabled) return;
  const selected = window.getSelection().toString().trim();
  if (selected) {
    speakText(selected);
  }
});

// Read entire page
function readWholePage() {
  const contentTags = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
  const fullText = Array.from(contentTags)
    .map((el) => el.innerText)
    .join(". ");
  speakText(fullText);
}
const utterance = new SpeechSynthesisUtterance("");
utterance.rate = 1;

// Speak function
function speakText(text) {
  window.speechSynthesis.cancel(); // Stop any existing speech
  utterance.text = text;
  window.speechSynthesis.speak(utterance);
}

chrome.storage.local.get(
  ["fontSize", "font", "blackWhiteMode", "bionicReadingMode"],
  (res) => {}
);

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Apply selected font size to page
  if (message.action === "applyFontSize") {
    updatePageFontSize(message.percentage, true);
    // Save updated setting to Chrome storage after applying it
    chrome.storage.sync.set({
      ...chrome.storage.sync.get("settings"),
      fontSize: message.percentage,
    });
  }
  // Apply selected typeface to page
  else if (message.action === "applyFont") {
    const fontName = message.font;
    // If Lexend font selected, dynamically inject Lexend link into page head
    if (fontName === "Lexend") {
      if (!document.getElementById("lexend-font-link")) {
        const link = document.createElement("link");
        link.id = "lexend-font-link";
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap";
        document.head.appendChild(link);
      }
    }

    // If OpenDyslexic font selected, dynamically inject font-face CSS
    //not working as the url is not giving access to the font
    if (fontName === "OpenDyslexic") {
      if (!document.getElementById("opendyslexic-style")) {
        const style = document.createElement("style");
        style.id = "opendyslexic-style";
        style.textContent = `
          @font-face {
            font-family: 'OpenDyslexic';
            src: url('https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic/opendyslexic-regular.otf') format('opentype');
            font-style: normal;
            font-weight: normal;
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Apply selected font-family to all page elements
    document
      .querySelectorAll("*:not(script, style, meta, link, title, head)")
      .forEach((element) => {
        if (fontName) {
          element.style.setProperty(
            "font-family",
            `"${fontName}", sans-serif`,
            "important"
          );
        } else {
          element.style.removeProperty("font-family");
        }
      });

    console.log("Applied font:", fontName);

    chrome.storage.sync.set({
      ...chrome.storage.sync.get("settings"),
      font: message.font,
    });
    console.log("Applied font:", message.font);
  }
  // Apply Black & White color mode
  else if (message.action === "toggleColorMode") {
    applyColorMode(message.mode);
  chrome.storage.sync.set({
    ...chrome.storage.sync.get("settings"),
    colorMode: message.mode,
  });
  }
  // Toggle Bionic Reading Mode
  else if (message.action === "toggleBionicReading") {
    applyBionicReading(message.enable);
    sendResponse({ success: true });
    chrome.storage.sync.set({
      ...chrome.storage.sync.get("settings"),
      bionicReadingMode: message.enable,
    });
    console.log("Bionic Reading mode set to:", message.enable);
  } else if (message.action === "toggleFullPageRead") {
    readFullPageEnabled = message.enable;
    if (readFullPageEnabled) {
      readWholePage();
    } else {
      window.speechSynthesis.cancel();
    }
  }
  if (message.action === "toggleSelectedRead") {
    readSelectionEnabled = message.enable;
  }
});
