let fontPercentage = 100; // Default scaling
const minPercentage = 50;
const maxPercentage = 150;
const originalFontSizes = new Map(); // Store the original font sizes for elements
let originalTextMap = new Map();

function updatePageFontSize(percentage, absolute = false) {
    fontPercentage = absolute ? percentage : fontPercentage + percentage;
    fontPercentage = Math.max(minPercentage, Math.min(maxPercentage, fontPercentage));

    document.querySelectorAll("*:not(script, style, meta, link, title, head)").forEach(element => {
        if (!originalFontSizes.has(element)) {
            originalFontSizes.set(element, parseFloat(window.getComputedStyle(element).fontSize));
        }
        let baseSize = originalFontSizes.get(element);
        let newSize = (baseSize * fontPercentage) / 100;
        element.style.fontSize = newSize + "px";
    });

    console.log("Updated font size to:", fontPercentage + "%");
}

function applyBlackAndWhiteMode(enable) {
    document.documentElement.style.filter = enable ? "grayscale(100%)" : "none";
    console.log("Black & White Mode:", enable);
}

function applyBionicReading(enable) {
    const tags = [...document.querySelectorAll("p, h1, h2, h3, h4, h5, h6")];

    tags.forEach(el => {
        // Avoid reprocessing already bold elements
        if (enable) {
            if (!originalTextMap.has(el)) {
                originalTextMap.set(el, el.innerHTML);
                el.innerHTML = bionicTransform(el.innerText);
            }
        } else {
            if (originalTextMap.has(el)) {
                el.innerHTML = originalTextMap.get(el);
                originalTextMap.delete(el);
            }
        }
    });
}

function bionicTransform(text) {
    return text
        .split(" ")
        .map(word => {
            if (word.length < 1) return word;

            // Preserve punctuation (basic)
            const match = word.match(/^(\W*)(\w+)(\W*)$/);
            if (!match) return word;

            const [, prefix, core, suffix] = match;
            const boldCount = Math.ceil(core.length * 0.4);
            const bolded = `<b>${core.slice(0, boldCount)}</b>${core.slice(boldCount)}`;
            return `${prefix}${bolded}${suffix}`;
        })
        .join(" ");
}

// Apply settings on interaction only (not auto-load)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "adjustFontSize") {
        updatePageFontSize(message.percentage, true);
    } else if (message.action === "applyFont") {
        document.querySelectorAll("*:not(script, style, meta, link, title, head)").forEach(element => {
            element.style.fontFamily = message.font + ", sans-serif";
        });
        console.log("Applied font:", message.font);
    } else if (message.action === "toggleBlackWhite") {
        applyBlackAndWhiteMode(message.enable);
    } else if (message.action === "toggleBionicReading") {
        applyBionicReading(message.enable);
        console.log("Bionic Reading mode set to:", message.enable);
    }
});