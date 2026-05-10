document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusEl = document.getElementById('status');
    const stepsList = document.getElementById('stepsList');
    const stepCount = document.getElementById('stepCount');
    const previewBtn = document.getElementById('previewBtn');
    const copyMdBtn = document.getElementById('copyMdBtn');
    const exportMdBtn = document.getElementById('exportMdBtn');
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
                // Only re-render if the number of steps changed to prevent focus loss during typing
                const oldLen = changes.steps.oldValue ? changes.steps.oldValue.length : 0;
                const newLen = changes.steps.newValue ? changes.steps.newValue.length : 0;
                if (oldLen !== newLen) {
                    renderSteps(changes.steps.newValue);
                }
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

    previewBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('preview.html') });
    });

    copyMdBtn.addEventListener('click', () => {
        chrome.storage.local.get(['steps'], (data) => {
            const steps = data.steps || [];
            let md = "# ScribeLoom - Recorded Workflow\n\n";
            steps.forEach((step, i) => {
                md += `## Step ${i + 1}: ${step.text || step.action}\n`;
                md += `**Action:** ${step.action} | **Target:** ${step.targetTag}\n\n`;
                if (step.screenshot) {
                    md += `![Step ${i + 1}](${step.screenshot})\n\n`;
                }
            });
            navigator.clipboard.writeText(md).then(() => {
                const originalText = copyMdBtn.innerText;
                copyMdBtn.innerText = "Copied!";
                setTimeout(() => copyMdBtn.innerText = originalText, 2000);
            });
        });
    });

    exportMdBtn.addEventListener('click', () => {
        chrome.storage.local.get(['steps'], (data) => {
            const steps = data.steps || [];
            let md = "# ScribeLoom - Recorded Workflow\n\n";
            steps.forEach((step, i) => {
                md += `## Step ${i + 1}: ${step.text || step.action}\n`;
                md += `**Action:** ${step.action} | **Target:** ${step.targetTag}\n\n`;
                if (step.screenshot) {
                    md += `![Step ${i + 1}](${step.screenshot})\n\n`;
                }
            });
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: 'scribeloom-tutorial.md',
                saveAs: true
            });
        });
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
            li.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong>Step ${index + 1}: ${step.action}</strong>
                                <button class="btn danger step-delete" data-index="${index}" style="padding: 2px 6px; font-size: 11px;">🗑️</button>
                            </div>
                            <input type="text" class="step-edit" data-index="${index}" value="${step.text || ''}" placeholder="Enter step description...">
                            <span>Target: ${step.targetTag}</span>`;
            if (step.screenshot) {
                const img = document.createElement('img');
                img.src = step.screenshot;
                img.className = 'step-image';
                li.appendChild(img);
            }
            stepsList.appendChild(li);
        });

        // Add event listeners to all inputs to save edits to storage
        document.querySelectorAll('.step-edit').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const newText = e.target.value;
                chrome.storage.local.get(['steps'], (data) => {
                    const stepsData = data.steps || [];
                    if (stepsData[idx]) {
                        stepsData[idx].text = newText;
                        chrome.storage.local.set({ steps: stepsData });
                    }
                });
            });
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.step-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                chrome.storage.local.get(['steps'], (data) => {
                    const stepsData = data.steps || [];
                    stepsData.splice(idx, 1); // remove 1 item
                    chrome.storage.local.set({ steps: stepsData });
                });
            });
        });
    }
});
