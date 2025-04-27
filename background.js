chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script loaded successfully!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "applyFont") {
    chrome.storage.sync.set({ fontFamily: message.font });
  }
});

// Listen for "clearTabSettings" message from adjustPage.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clearTabSettings") {
    if (sender.tab) {
      const tabId = sender.tab.id;
      // Clear saved tab-specific settings on page reload
      chrome.storage.local.remove(`tab_${tabId}_applied`);
      chrome.storage.local.remove(`settings_tab_${tabId}`);
    }
  }
});
