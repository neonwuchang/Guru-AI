// background.js

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveContent") {
        chrome.storage.local.set({ content: message.data }, () => {
            sendResponse({ status: "Content saved" });
        });
    } else if (message.action === "loadContent") {
        chrome.storage.local.get("content", (result) => {
            sendResponse({ data: result.content });
        });
    }
    return true; // Indicates you want to send a response asynchronously
});
