chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'requestMicrophone') {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        sendResponse({ success: true, streamId: stream.id });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required to indicate async response
  }
});
