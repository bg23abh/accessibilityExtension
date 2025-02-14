document.addEventListener("DOMContentLoaded", function () {
    const minusBtn = document.querySelector(".font-size-control button:first-of-type");
    const plusBtn = document.querySelector(".font-size-control button:last-of-type");
    const fontSizeSpan = document.querySelector(".font-size-control span");
    const fontSelect = document.querySelector("select");
    const colorRadios = document.querySelectorAll("input[name='color']");
    const adhdToggle = document.querySelector("#adhd-toggle"); // ADHD toggle slider

    let fontPercentage = 100;
    const minPercentage = 50;
    const maxPercentage = 150;

    function updateFontSizeDisplay() {
        fontSizeSpan.textContent = fontPercentage + "%";
    }

    function adjustFontSize(change) {
        fontPercentage += change;
        fontPercentage = Math.max(minPercentage, Math.min(maxPercentage, fontPercentage));
        updateFontSizeDisplay();

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "adjustFontSize", percentage: fontPercentage });
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
    });

    colorRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            const selectedColor = document.querySelector("input[name='color']:checked").value;
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggleBlackWhite", enable: selectedColor === "bw" });
            });
        });
    });

    adhdToggle.addEventListener("change", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleADHDMode", enable: adhdToggle.checked });
        });
    });

    updateFontSizeDisplay();
});