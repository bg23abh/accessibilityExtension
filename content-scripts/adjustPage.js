let fontPercentage = 100; // Default scaling
const minPercentage = 50;
const maxPercentage = 150;
const originalFontSizes = new Map(); // Store the original font sizes for elements

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

function applyADHDReadingMode(enable) {
    document.querySelectorAll("p, span, div:not([role]), li, a, td, th").forEach(element => {
        if (enable) {
            element.childNodes.forEach(child => {
                if (child.nodeType === 3) { // Text node only
                    let words = child.nodeValue.split(" ");
                    let updatedWords = words.map(word => {
                        if (!word.startsWith("<b>")) { // Ignore already bold words
                            return `<b>${word.slice(0, 2)}</b>${word.slice(2)}`;
                        }
                        return word;
                    });
                    let newHTML = updatedWords.join(" ");
                    let spanWrapper = document.createElement("span");
                    spanWrapper.innerHTML = newHTML;
                    element.replaceChild(spanWrapper, child);
                }
            });
        } else {
            element.innerHTML = element.innerHTML.replace(/<b>(\w{2})<\/b>(\w*)/g, "$1$2");
        }
    });
    console.log("ADHD Mode:", enable);
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
    } else if (message.action === "toggleADHDMode") {
        applyADHDReadingMode(message.enable);
    }
});