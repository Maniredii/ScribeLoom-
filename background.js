// Initialize state on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isRecording: false, steps: [], isPrivacyMode: false });
});

// Function to crop image
async function cropImage(dataUrl, rect, dpr) {
    if (!rect || !dataUrl) return dataUrl;
    
    try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        
        // The rect is in CSS pixels. The bitmap is in physical pixels.
        const r = {
            left: rect.left * dpr,
            top: rect.top * dpr,
            width: rect.width * dpr,
            height: rect.height * dpr
        };
        
        // Add padding around the cropped area
        const padding = 150 * dpr;
        
        let x = Math.max(0, r.left - padding);
        let y = Math.max(0, r.top - padding);
        let width = Math.min(bitmap.width - x, r.width + (padding * 2));
        let height = Math.min(bitmap.height - y, r.height + (padding * 2));
        
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
        
        const blobCropped = await canvas.convertToBlob({type: "image/jpeg", quality: 0.8});
        
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blobCropped);
        });
    } catch(e) {
        console.error("Cropping failed:", e);
        return dataUrl;
    }
}

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
            
            const tab = tabs[0];
            // Chrome blocks screenshots on restricted pages
            if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.includes('chrome.google.com/webstore'))) {
                console.warn("Skipping screenshot: Cannot capture browser settings or store pages.");
                return;
            }
            
            // Capture visible tab
            chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 80 }, async (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error("Screenshot error:", JSON.stringify(chrome.runtime.lastError) || chrome.runtime.lastError.message);
                    dataUrl = null;
                } else if (message.data.rect) {
                    // Smart image crop around the interacted element
                    dataUrl = await cropImage(dataUrl, message.data.rect, message.data.devicePixelRatio || 1);
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

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle_recording') {
        chrome.storage.local.get(['isRecording'], (data) => {
            const newState = !data.isRecording;
            chrome.storage.local.set({ isRecording: newState });
            console.log(`ScribeLoom: Recording ${newState ? 'started' : 'stopped'} via shortcut`);
            
            // Notify all tabs
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { action: 'recordingStatusChanged', isRecording: newState }).catch(() => {});
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
            
            if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.includes('chrome.google.com/webstore'))) {
                return;
            }
            
            // Give the page a tiny bit of time to render completely after load
            setTimeout(() => {
                chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 50 }, (dataUrl) => {
                    if (chrome.runtime.lastError) {
                        console.error("Screenshot error:", JSON.stringify(chrome.runtime.lastError) || chrome.runtime.lastError.message);
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
