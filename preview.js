document.addEventListener('DOMContentLoaded', () => {
    const previewContent = document.getElementById('previewContent');

    chrome.storage.local.get(['steps'], (data) => {
        const steps = data.steps || [];

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
                <h3 class="step-title">${step.text || step.action}</h3>
            `;

            const meta = document.createElement('div');
            meta.className = 'step-meta';
            meta.innerText = `Action: ${step.action} | Element: ${step.targetTag} | URL: ${step.url}`;

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
    });
});
