// Initialize a flag to identify first load
let firstLoad = true;

// Restore saved settings for the popup when opened
function restoreSettings() {
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const fontSizeValue = document.getElementById("fontSizeValue");
  const fontSelect = document.querySelector("select");
  const colorRadios = document.querySelectorAll("input[name='color']");
  const bionicToggle = document.querySelector("#bionic-toggle");

  // Query the current active tab to send message or inject scripts
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    chrome.storage.local.get(`tab_${tabId}_applied`, (data) => {
      const isApplied = data[`tab_${tabId}_applied`];

      if (!isApplied) {
        resetPopupToDefaults(); // Reset popup if no settings applied
      } else {
        continueRestoreSettings(); // Restore saved settings
      }
    });
  });

  firstLoad = false;
}

// Wait for DOM content to load
document.addEventListener("DOMContentLoaded", function () {
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const fontSizeValue = document.getElementById("fontSizeValue");
  const fontSelect = document.querySelector("select");
  const colorRadios = document.querySelectorAll("input[name='color']");
  const bionicToggle = document.querySelector("#bionic-toggle");

  let fontPercentage = 100;
  const minPercentage = 50;
  const maxPercentage = 150;

  // Log to verify popup has loaded
  console.log("Popup loaded");

  restoreSettings(); // Restore settings when popup loads

  // Font size slider change handler
  fontSizeSlider.addEventListener("input", () => {
    const value = parseInt(fontSizeSlider.value);
    fontSizeValue.textContent = value + "%";

    chrome.storage.sync.get("settings", (data) => {
      const settings = data.settings || {};
      settings.fontPercentage = value;
      chrome.storage.sync.set({ settings });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyFontSize",
        percentage: value,
      });
      chrome.storage.local.set({ [`tab_${tabs[0].id}_applied`]: true });
    });
  });

  // Font selection change handler
  fontSelect.addEventListener("change", function () {
    const selectedFont = fontSelect.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyFont",
        font: selectedFont || null,
      });
      chrome.storage.local.set({ [`tab_${tabs[0].id}_applied`]: true });
    });
    chrome.storage.sync.get("settings", (data) => {
      const settings = data.settings || {};
      settings.fontFamily = selectedFont;
      chrome.storage.sync.set({ settings });
    });
  });

  // Color mode radio change handler
  colorRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const selectedColor = document.querySelector(
        "input[name='color']:checked"
      ).value;
      const enableBW = selectedColor === "bw";

      chrome.storage.sync.get("settings", (data) => {
        const settings = data.settings || {};
        settings.colorMode = selectedColor;
        chrome.storage.sync.set({ settings });
      });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleColorMode",
          mode: selectedColor,
        });
        chrome.storage.local.set({ [`tab_${tabs[0].id}_applied`]: true });
      });
    });
  });

  // Bionic reading toggle handler
  bionicToggle.addEventListener("change", function () {
    const enableBionic = bionicToggle.checked;

    chrome.storage.sync.get("settings", (data) => {
      const settings = data.settings || {};
      settings.bionicReading = enableBionic;
      chrome.storage.sync.set({ settings });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleBionicReading",
        enable: enableBionic,
      });
      chrome.storage.local.set({ [`tab_${tabs[0].id}_applied`]: true });
    });
  });

  // Full page read button handler
  document.getElementById("read-full-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const text = document.body.innerText.trim();
            if (text) {
              const utterance = new SpeechSynthesisUtterance(text);
              speechSynthesis.speak(utterance);
            } else {
              alert("No readable text found on the page.");
            }
          },
        },
        () => {
          if (chrome.runtime.lastError) {
            console.warn("Error:", chrome.runtime.lastError.message);
          }
        }
      );
    });
  });

  // Selected text read button handler
  document.getElementById("read-selected-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText) {
              const utterance = new SpeechSynthesisUtterance(selectedText);
              speechSynthesis.speak(utterance);
            } else {
              alert("Please select some text on the page first.");
            }
          },
        },
        () => {
          if (chrome.runtime.lastError) {
            console.warn("Error:", chrome.runtime.lastError.message);
          }
        }
      );
    });
  });

  // Stop speech button handler
  document.getElementById("stop-speech-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
          }
        },
      });
    });
  });
});

// Reset popup fields to default state
function resetPopupToDefaults() {
  const fontSelect = document.querySelector("select");
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const fontSizeValue = document.getElementById("fontSizeValue");
  const colorRadios = document.querySelectorAll("input[name='color']");
  const bionicToggle = document.querySelector("#bionic-toggle");

  fontSelect.value = ""; // Default option selected
  fontSizeSlider.value = 100;
  fontSizeValue.textContent = "100%";
  colorRadios.forEach((radio) => {
    if (radio.value === "normal") {
      radio.checked = true;
    }
  });
  bionicToggle.checked = false;
}

// Continue restoring previously saved user settings
function continueRestoreSettings() {
  // Restore previously saved font family, font size, color mode, and bionic reading toggle
  chrome.storage.sync.get("settings", (data) => {
    const settings = data.settings || {};
    const fontSelect = document.querySelector("select");
    const fontSizeSlider = document.getElementById("fontSizeSlider");
    const fontSizeValue = document.getElementById("fontSizeValue");
    const colorRadios = document.querySelectorAll("input[name='color']");
    const bionicToggle = document.querySelector("#bionic-toggle");

    if (settings.fontFamily) fontSelect.value = settings.fontFamily;
    const fontPercentage = settings.fontPercentage || 100;
    fontSizeSlider.value = fontPercentage;
    fontSizeValue.textContent = fontPercentage + "%";

    if (settings.colorMode !== undefined) {
      const normalOption = document.querySelector("input[value='normal']");
      const bwOption = document.querySelector("input[value='bw']");
      const darkOption = document.querySelector("input[value='dark']");

      if (settings.colorMode === "normal" && normalOption) {
        normalOption.checked = true;
      } else if (settings.colorMode === "bw" && bwOption) {
        bwOption.checked = true;
      } else if (settings.colorMode === "dark" && darkOption) {
        darkOption.checked = true;
      }
    }

    if (bionicToggle) {
      bionicToggle.checked = settings.bionicReading || false;
    }
  });
}
