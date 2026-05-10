document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusEl = document.getElementById('status');
    const stepsList = document.getElementById('stepsList');
    const stepCount = document.getElementById('stepCount');
    const exportJsonBtn = document.getElementById('exportJsonBtn');

    // Initialize state
    chrome.storage.local.get(['isRecording', 'steps'], (data) => {
        const isRecording = data.isRecording || false;
        const steps = data.steps || [];
        
        updateUI(isRecording);
        renderSteps(steps);
    });

    // Listen for storage changes to update UI dynamically
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.isRecording) {
                updateUI(changes.isRecording.newValue);
            }
            if (changes.steps) {
                renderSteps(changes.steps.newValue);
            }
        }
    });

    startBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'startRecording' });
    });

    stopBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'stopRecording' });
    });

    clearBtn.addEventListener('click', () => {
        chrome.storage.local.set({ steps: [] });
    });

    exportJsonBtn.addEventListener('click', () => {
        chrome.storage.local.get(['steps'], (data) => {
            const steps = data.steps || [];
            // Remove full base64 screenshots for cleaner export if you want, 
            // but for MVP let's export everything.
            const blob = new Blob([JSON.stringify(steps, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            chrome.downloads.download({
                url: url,
                filename: 'scribeloom-export.json',
                saveAs: true
            });
        });
    });

    function updateUI(isRecording) {
        startBtn.disabled = isRecording;
        stopBtn.disabled = !isRecording;
        statusEl.textContent = isRecording ? 'Recording (Red Circle)' : 'Idle';
        statusEl.style.color = isRecording ? '#ef4444' : '#111827';
    }

    function renderSteps(steps) {
        stepCount.textContent = steps.length;
        stepsList.innerHTML = '';
        
        steps.forEach((step, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Step ${index + 1}: ${step.action}</strong>
                            <span>Text: ${step.text || 'N/A'}</span>
                            <span>Target: ${step.targetTag}</span>`;
            if (step.screenshot) {
                const img = document.createElement('img');
                img.src = step.screenshot;
                img.className = 'step-image';
                li.appendChild(img);
            }
            stepsList.appendChild(li);
        });
    }
});
