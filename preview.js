document.addEventListener('DOMContentLoaded', () => {
    const previewContent = document.getElementById('previewContent');

    chrome.storage.local.get(['steps'], (data) => {
        const steps = data.steps || [];
        renderPreview(steps);
    });

    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        window.print();
    });

    function renderPreview(steps) {
        previewContent.innerHTML = ''; // Clear existing content

        if (steps.length === 0) {
            previewContent.innerHTML = '<p style="text-align: center; color: #6b7280;">No steps recorded yet. Start recording to see your workflow here!</p>';
            return;
        }

        steps.forEach((step, index) => {
            const card = document.createElement('div');
            card.className = 'step-card';

            const header = document.createElement('div');
            header.className = 'step-header';
            header.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <h3 class="step-title" contenteditable="true" spellcheck="false" data-index="${index}">${step.text || step.action}</h3>
                <div style="margin-left: auto;">
                    <button class="step-delete" data-index="${index}" style="padding: 4px 8px; font-size: 12px; border-radius: 4px; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; cursor: pointer;">Delete</button>
                </div>
            `;

            const meta = document.createElement('div');
            meta.className = 'step-meta';
            const displayUrl = (step.url && step.url.length > 60) ? step.url.substring(0, 60) + '...' : (step.url || 'unknown');
            meta.innerText = `Action: ${step.action} | Element: ${step.targetTag} | URL: ${displayUrl}`;

            card.appendChild(header);
            card.appendChild(meta);

            if (step.screenshot) {
                const img = document.createElement('img');
                img.src = step.screenshot;
                img.className = 'step-image';
                card.appendChild(img);
            }

            previewContent.appendChild(card);
        });

        // Add listeners for editing
        document.querySelectorAll('.step-title').forEach(el => {
            el.addEventListener('blur', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const newText = e.target.innerText.trim();
                chrome.storage.local.get(['steps'], (data) => {
                    const stepsData = data.steps || [];
                    if (stepsData[idx]) {
                        stepsData[idx].text = newText;
                        chrome.storage.local.set({ steps: stepsData });
                    }
                });
            });
            // Also prevent newlines
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });

        // Add listeners for delete buttons
        document.querySelectorAll('.step-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                chrome.storage.local.get(['steps'], (data) => {
                    const stepsData = data.steps || [];
                    stepsData.splice(idx, 1);
                    chrome.storage.local.set({ steps: stepsData }, () => {
                        renderPreview(stepsData); // re-render locally
                    });
                });
            });
        });
    }
});
