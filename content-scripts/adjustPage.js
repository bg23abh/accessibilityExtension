let fontPercentage = 100; // Default scaling
const minPercentage = 50;
const maxPercentage = 150;
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



function handleDomChanges(functionToCall) {
  requestAnimationFrame(functionToCall);
}

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
      // if (!originalFontSizes.has(element)) {
      //   originalFontSizes.set(
      //     element,
      //     parseFloat(window.getComputedStyle(element).fontSize)
      //   );
      // }
      let baseSize = originalFontSizes.get(element);
      let newSize = (baseSize * fontPercentage) / 100;
      element.style.fontSize = newSize + "px";
    });

  console.log("Updated font size to:", fontPercentage + "%");
  })
}

function applyBlackAndWhiteMode(enable) {
  handleDomChanges(() => document.documentElement.style.filter = enable ? "grayscale(100%)" : "none");
  
  console.log("Black & White Mode:", enable);
}

function applyBionicReading(enable) {

  const tags = [...document.querySelectorAll("p")];
  const startTime = new Date().getTime();

  if (enable) {
    // Process elements in batches
    processInBatches(tags, (el, done) => {
      if (!originalTextMap.has(el)) {
        originalTextMap.set(el, el.innerHTML);
        bionicTransformAsync(el.innerText, (transformed) => {
          el.innerHTML = transformed;
          done(() => {
            console.log("Transformed");
          }); // Mark this element as processed
        });
      } else {
        done(() => {
          console.log("Skipped");
        }); // Skip already processed elements
      }
    }, () => {
      const endTime = new Date().getTime();
      console.log("Bionic Reading applied");
      console.log(`Time taken ${endTime - startTime}ms`);
    });
  } else {
    // Revert elements in batches
    processInBatches(tags, (el, done) => {
      if (originalTextMap.has(el)) {
        el.innerHTML = originalTextMap.get(el);
        originalTextMap.delete(el);
      }
      done(() => {
        console.log("Reverted");
        
      }); // Mark this element as processed
    }, () => {
      const endTime = new Date().getTime();
      console.log("Bionic Reading reverted");
      console.log(`Time taken ${endTime - startTime}ms`);
    });
  }

  // const tags = [...document.querySelectorAll("p, h1, h2, h3, h4, h5, h6")];

  // const startTime = new Date().getTime();

  // handleDomChanges(() => {
  //   tags.forEach((el) => {
  //     // Avoid reprocessing already bold elements
  //     if (enable) {
  //       if (!originalTextMap.has(el)) {
  //         originalTextMap.set(el, el.innerHTML);
  //         bionicTransformAsync(el.innerText, (transformed) => {
  //           console.log("Using web worker");
            
  //           el.innerHTML = transformed;
  //         });
  //         // el.innerHTML = bionicTransform(el.innerText);
  //       }
  //     } else {
  //       if (originalTextMap.has(el)) {
  //         el.innerHTML = originalTextMap.get(el);
  //         originalTextMap.delete(el);
  //       }
  //     }
  //   });
  //   const endTime = new Date().getTime();
  //   console.log("Done")
  //   console.log(`Time taken ${endTime - startTime}ms`);
    
  // })
}

// Helper function to process elements in batches
function processInBatches(elements, processElement, onComplete) {
  const batchSize = 200; // Number of elements to process per frame
  let index = 0;

  function processNextBatch() {
    const batch = elements.slice(index, index + batchSize);
    let processedCount = 0;

    batch.forEach((el) => {
      processElement(el, () => {
        processedCount++;
        if (processedCount === batch.length) {
          // All elements in this batch are processed
          if (index + batchSize < elements.length) {
            index += batchSize;
            requestAnimationFrame(processNextBatch); // Process the next batch
            onComplete();
          } else {
            onComplete(); // All elements are processed
          }
        }
      });
    });
  }

  processNextBatch(); // Start processing the first batch
}

function bionicTransformAsync(text, callback) {

  fetch(chrome.runtime.getURL("content-scripts/bionicWorker.js"))
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch worker script: ${response.statusText}`);
    }
    return response.text();
  }).then((workerScript) => {
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
    }

    worker.onerror = (e) => {
      handleWorkerMessage(() => console.error("Error in worker:", e.message));
    }

    // worker.onmessage = (e) => {
    //   callback(e.data);
    //   worker.terminate();
    //   URL.revokeObjectURL(blobUrl);
    // };

    // worker.onerror = (e) => {
    //   worker.terminate();
    //   URL.revokeObjectURL(blobUrl);
    // };

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
utterance.rate = 1

// Speak function
function speakText(text) {
  window.speechSynthesis.cancel(); // Stop any existing speech
  utterance = {
    ...utterance,
    text
  }
  window.speechSynthesis.speak(utterance);
}

// Apply settings on interaction only (not auto-load)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "applyFontSize") {
    updatePageFontSize(message.percentage, true);
  } else if (message.action === "applyFont") {
    document
      .querySelectorAll("*:not(script, style, meta, link, title, head)")
      .forEach((element) => {
        element.style.fontFamily = message.font + ", sans-serif";
      });
    console.log("Applied font:", message.font);
  } else if (message.action === "toggleBlackWhite") {
    applyBlackAndWhiteMode(message.enable);
  } else if (message.action === "toggleBionicReading") {
    applyBionicReading(message.enable);
    sendResponse({ success: true });
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
