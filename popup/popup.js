document.addEventListener("DOMContentLoaded", function () {
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const fontSizeValue = document.getElementById("fontSizeValue");
  const fontSelect = document.querySelector("select");
  const colorRadios = document.querySelectorAll("input[name='color']");
  const bionicToggle = document.querySelector("#bionic-toggle");

  let fontPercentage = 100;
  const minPercentage = 50;
  const maxPercentage = 150;

  // Update label
  fontSizeSlider.addEventListener("input", () => {
    const value = parseInt(fontSizeSlider.value);
    fontSizeValue.textContent = value + "%";

    chrome.storage.sync.set({ fontPercentage: value });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyFontSize",
        percentage: value,
      });
    });
  });

  fontSelect.addEventListener("change", function () {
    const selectedFont = fontSelect.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyFont",
        font: selectedFont,
      });
    });
    chrome.storage.sync.get("settings", (data) => {
      const settings = data.settings || {};
      settings.fontFamily = selectedFont;

      chrome.storage.sync.set({ settings });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyFont",
        font: selectedFont,
      });
    });
  });

  colorRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const selectedColor = document.querySelector(
        "input[name='color']:checked"
      ).value;
      const enableBW = selectedColor === "bw";

      chrome.storage.sync.get("settings", (data) => {
        const settings = data.settings || {};
        settings.blackWhiteMode = enableBW;

        chrome.storage.sync.set({ settings });
      });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleBlackWhite",
          enable: enableBW,
        });
      });
    });
  });

  bionicToggle.addEventListener("change", function () {
    const enableBionic = bionicToggle.checked;

    chrome.storage.sync.get("settings", (data) => {
      const settings = data.settings || {};
      settings.bionicReading = enableBionic;

      chrome.storage.sync.set({ settings });
    });
    console.log("Bionic Reading mode set to:", enableBionic);
    

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleBionicReading",
        enable: enableBionic,
      }).then((res) => {
        console.log(res);
      });
    });
  });

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

  document.getElementById("stop-speech-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          if (speechSynthesis.speaking) {
            speechSynthesis.cancel(); // Stops speech immediately
          }
        },
      });
    });
  });

  updateFontSizeDisplay();

  chrome.storage.sync.get("settings", (data) => {
    const settings = data.settings || {};

    // Restore Font Family
    const fontSelect = document.querySelector("select");
    if (settings.fontFamily) {
      fontSelect.value = settings.fontFamily;
    }

    // Restore Font Size
    const fontSizeSpan = document.querySelector(".font-size-control span");
    const fontPercentage = settings.fontPercentage || 100;
    fontSizeSpan.textContent = fontPercentage + "%";

    // Restore Black & White
    if (settings.blackWhiteMode !== undefined) {
      const bwOption = document.querySelector(
        "input[name='color'][value='bw']"
      );
      const normalOption = document.querySelector(
        "input[name='color'][value='normal']"
      );
      if (settings.blackWhiteMode && bwOption) bwOption.checked = true;
      else if (normalOption) normalOption.checked = true;
    }

    // Restore Bionic Toggle
    const bionicToggle = document.querySelector("#bionic-toggle");
    if (bionicToggle) {
      bionicToggle.checked = settings.bionicReading || false;
    }

    // OPTIONAL: Re-send settings to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyFont",
        font: settings.fontFamily || "Arial",
        percentage: fontPercentage,
      });

      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleBlackWhite",
        enable: settings.blackWhiteMode || false,
      });

      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleBionicReading",
        enable: settings.bionicReading || false,
      })
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleADHDMode",
        enable: settings.adhdMode || false,
      });
    });
  });
});
