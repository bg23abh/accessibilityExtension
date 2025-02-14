chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script loaded successfully!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "applyFont") {
    chrome.storage.sync.set({ fontFamily: message.font });
  }
});
