document.addEventListener("DOMContentLoaded", function () {
    const minusBtn = document.querySelector(".font-size-control button:first-of-type");
    const plusBtn = document.querySelector(".font-size-control button:last-of-type");
    const fontSizeSpan = document.querySelector(".font-size-control span");
    const fontSelect = document.querySelector("select");
    const colorRadios = document.querySelectorAll("input[name='color']");
    const bionicToggle = document.querySelector("#bionic-toggle");

    let fontPercentage = 100;
    const minPercentage = 50;
    const maxPercentage = 150;

    function updateFontSizeDisplay() {
        fontSizeSpan.textContent = fontPercentage + "%";
    }

    function adjustFontSize(change) {
        fontPercentage += change;
    fontPercentage = Math.max(minPercentage, Math.min(maxPercentage, fontPercentage));
    fontSizeSpan.textContent = fontPercentage + "%";

    chrome.storage.sync.get("settings", (data) => {
        const settings = data.settings || {};
        settings.fontPercentage = fontPercentage;

        chrome.storage.sync.set({ settings });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "adjustFontSize",
            change: change
        });
    });
    }

    minusBtn.addEventListener("click", function () {
        adjustFontSize(-1);
            });

    plusBtn.addEventListener("click", function () {
        adjustFontSize(1);
            });

    fontSelect.addEventListener("change", function () {
        const selectedFont = fontSelect.value;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "applyFont", font: selectedFont });
        });
        chrome.storage.sync.get("settings", (data) => {
            const settings = data.settings || {};
            settings.fontFamily = selectedFont;
    
            chrome.storage.sync.set({ settings });
        });
    
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "applyFont",
                font: selectedFont
            });
        });
    });

    colorRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            const selectedColor = document.querySelector("input[name='color']:checked").value;
        const enableBW = selectedColor === "bw";

        chrome.storage.sync.get("settings", (data) => {
            const settings = data.settings || {};
            settings.blackWhiteMode = enableBW;

            chrome.storage.sync.set({ settings });
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleBlackWhite",
                enable: enableBW
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

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleBionicReading",
            enable: enableBionic
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
            const bwOption = document.querySelector("input[name='color'][value='bw']");
            const normalOption = document.querySelector("input[name='color'][value='normal']");
            if (settings.blackWhiteMode && bwOption) bwOption.checked = true;
            else if (normalOption) normalOption.checked = true;
        }
    
        // Restore Bionic Toggle
        const bionicToggle = document.querySelector("#bionic-toggle");
        if (bionicToggle) {
            bionicToggle.checked = settings.bionicReading || false;
        }
    
        // Restore ADHD Toggle
        const adhdToggle = document.querySelector("#adhd-toggle");
        if (adhdToggle) {
            adhdToggle.checked = settings.adhdMode || false;
        }
    
        // OPTIONAL: Re-send settings to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "applyFont",
                font: settings.fontFamily || "Arial",
                percentage: fontPercentage
            });
    
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleBlackWhite",
                enable: settings.blackWhiteMode || false
            });
    
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleBionicReading",
                enable: settings.bionicReading || false
            });
    
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "toggleADHDMode",
                enable: settings.adhdMode || false
            });
        });
    });
});