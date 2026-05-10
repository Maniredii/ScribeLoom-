let isRecording = false;

// Check initial recording state
chrome.storage.local.get(['isRecording'], (data) => {
    isRecording = data.isRecording || false;
});

// Listen for state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'recordingStatusChanged') {
        isRecording = message.isRecording;
        console.log("ScribeLoom Content Script: Recording state changed to", isRecording);
    } else if (message.action === 'aiRewrite') {
        (async () => {
            try {
                if (!window.ai || (!window.ai.languageModel && !window.ai.createTextSession)) {
                    sendResponse({ error: "window.ai not available in tab context. Check chrome://flags." });
                    return;
                }
                
                let session;
                if (window.ai.languageModel) {
                    session = await window.ai.languageModel.create({
                        systemPrompt: "You rewrite raw UI actions into short, clear, human-readable instructions. Only output the final instruction text without any quotes or extra words."
                    });
                } else {
                    session = await window.ai.createTextSession();
                }

                const resultText = await session.prompt(message.promptText);
                if (session.destroy) session.destroy();
                
                sendResponse({ success: true, text: resultText });
            } catch (err) {
                sendResponse({ error: err.message });
            }
        })();
        return true; // Keep message channel open for async response
    }
});

function showHighlight(element) {
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.style.position = 'fixed';
    highlight.style.top = rect.top + 'px';
    highlight.style.left = rect.left + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';
    highlight.style.border = '3px solid #ef4444'; // Red border
    highlight.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; // Red transparent fill
    highlight.style.pointerEvents = 'none'; // Don't block subsequent clicks
    highlight.style.zIndex = '9999999'; // Stay on top
    highlight.style.transition = 'opacity 0.3s ease-out';
    highlight.style.boxSizing = 'border-box';
    highlight.style.borderRadius = '4px';
    
    document.body.appendChild(highlight);
    
    // Fade out and remove the highlight box after capturing
    setTimeout(() => {
        highlight.style.opacity = '0';
        setTimeout(() => highlight.remove(), 300);
    }, 600);
}

// Event Listeners for interactions
document.addEventListener('click', (e) => {
    if (!isRecording) return;
    
    // Ignore clicks on non-interactive elements unless it's a structural click
    const target = e.target;
    
    // Simple heuristic to get meaningful text
    let text = target.innerText || target.value || target.placeholder || target.title || target.alt || '';
    text = text.trim().substring(0, 50); // limit length
    
    if (text === '') {
        // try to find text in parent if it's an icon or something
        if (target.parentElement) {
             text = target.parentElement.innerText?.trim().substring(0, 50) || '';
        }
    }

    const stepData = {
        action: 'click',
        text: text,
        targetTag: target.tagName.toLowerCase(),
        id: target.id,
        className: target.className
    };

    // Add a visual highlight box to the clicked element
    showHighlight(target);

    // Send to background to capture screenshot and save
    // Delay slightly to allow the highlight and any visual effects/modals to appear
    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'recordStep', data: stepData });
    }, 300);
}, true);

// Listen for form submissions
document.addEventListener('submit', (e) => {
    if (!isRecording) return;
    
    const target = e.target;
    
    const stepData = {
        action: 'form_submit',
        text: target.id || target.name || 'Form',
        targetTag: 'form',
        id: target.id,
        className: target.className
    };
    
    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'recordStep', data: stepData });
    }, 300);
}, true);

// Listen for typing in input fields
document.addEventListener('change', (e) => {
    if (!isRecording) return;
    
    const target = e.target;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
    
    // Ignore passwords for privacy
    if (target.type === 'password') return;

    let actionType = (target.type === 'checkbox' || target.type === 'radio') ? 'toggled' : 'typed';
    let val = target.type === 'checkbox' ? (target.checked ? 'checked' : 'unchecked') : target.value;
    
    if (actionType === 'typed' && !val.trim()) return; // ignore clearing the input for now
    
    if (val.length > 50) val = val.substring(0, 50) + '...';

    const fieldName = target.name || target.id || target.placeholder || target.ariaLabel || 'input field';

    const stepData = {
        action: 'input',
        text: `User ${actionType} "${val}" in ${fieldName}`,
        targetTag: target.tagName.toLowerCase(),
        id: target.id,
        className: target.className
    };

    showHighlight(target);

    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'recordStep', data: stepData });
    }, 300);
}, true);
