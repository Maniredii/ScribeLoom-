// Initialize state on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isRecording: false, steps: [] });
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startRecording') {
        chrome.storage.local.set({ isRecording: true });
        console.log("ScribeLoom: Recording started");
        
        // Notify all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'recordingStatusChanged', isRecording: true }).catch(() => {});
            });
        });
    } else if (message.action === 'stopRecording') {
        chrome.storage.local.set({ isRecording: false });
        console.log("ScribeLoom: Recording stopped");
        
        // Notify all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'recordingStatusChanged', isRecording: false }).catch(() => {});
            });
        });
    } else if (message.action === 'recordStep') {
        // We received an interaction from the content script. Let's capture a screenshot.
        
        // Only capture active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            
            // Capture visible tab
            chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 50 }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error("Screenshot error:", chrome.runtime.lastError);
                    dataUrl = null;
                }
                
                // Save step with screenshot
                const stepData = {
                    ...message.data,
                    timestamp: Date.now(),
                    url: sender.tab ? sender.tab.url : "unknown",
                    screenshot: dataUrl
                };
                
                chrome.storage.local.get(['steps'], (data) => {
                    const steps = data.steps || [];
                    steps.push(stepData);
                    chrome.storage.local.set({ steps });
                });
            });
        });
    }
});

// Listen for page navigation
chrome.webNavigation.onCompleted.addListener((details) => {
    // We only care about the main frame (the whole page, not an iframe)
    if (details.frameId !== 0) return;

    // Check if we are currently recording
    chrome.storage.local.get(['isRecording'], (data) => {
        if (!data.isRecording) return;
        
        // Make sure the navigated tab is currently active
        chrome.tabs.get(details.tabId, (tab) => {
            if (!tab.active) return;
            
            // Give the page a tiny bit of time to render completely after load
            setTimeout(() => {
                chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 50 }, (dataUrl) => {
                    if (chrome.runtime.lastError) {
                        console.error("Screenshot error:", chrome.runtime.lastError);
                        dataUrl = null;
                    }
                    
                    let domainName = "new page";
                    try {
                        domainName = new URL(details.url).hostname;
                    } catch (e) {}

                    const stepData = {
                        action: 'navigation',
                        text: 'Loaded ' + domainName,
                        targetTag: 'page',
                        timestamp: Date.now(),
                        url: details.url,
                        screenshot: dataUrl
                    };
                    
                    chrome.storage.local.get(['steps'], (storageData) => {
                        const steps = storageData.steps || [];
                        steps.push(stepData);
                        chrome.storage.local.set({ steps });
                    });
                });
            }, 500);
        });
    });
});
