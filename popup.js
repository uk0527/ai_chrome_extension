document.addEventListener('DOMContentLoaded', function() {
    const runOverlayBtn = document.getElementById('runOverlay');
    const resetImagesBtn = document.getElementById('resetImages');
    const styleSelect = document.getElementById('styleSelect');
    const intensityRange = document.getElementById('intensityRange');
    const intensityValue = document.getElementById('intensityValue');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const faceImageUpload = document.getElementById('faceImageUpload');
    const uploadFaceBtn = document.getElementById('uploadFaceBtn');
    const facePreview = document.getElementById('facePreview');
    const facePreviewImg = document.getElementById('facePreviewImg');
    const removeFaceBtn = document.getElementById('removeFaceBtn');

    // Update intensity value display
    intensityRange.addEventListener('input', function() {
        intensityValue.textContent = this.value;
    });

    // Load saved settings
    loadSettings();
    
    // Check API key status
    checkApiKeyStatus();
    
    // Load saved face image
    loadFaceImage();
    
    // Face upload functionality
    uploadFaceBtn.addEventListener('click', () => faceImageUpload.click());
    
    faceImageUpload.addEventListener('change', handleFaceImageUpload);
    
    removeFaceBtn.addEventListener('click', removeFaceImage);

    // Run AI Overlay button click
    runOverlayBtn.addEventListener('click', async function() {
        try {
            setStatus('processing', 'Processing images...');
            runOverlayBtn.disabled = true;
            runOverlayBtn.innerHTML = '<span class="loading"></span> Processing...';

            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Save current settings
            await saveSettings();

            // Send message to content script to start AI overlay
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'runAIOverlay',
                settings: {
                    style: styleSelect.value,
                    intensity: parseInt(intensityRange.value)
                }
            });

            if (response && response.success) {
                setStatus('success', `Processed ${response.imageCount} images`);
                resetImagesBtn.disabled = false;
            } else {
                throw new Error(response?.error || 'Failed to process images');
            }

        } catch (error) {
            console.error('Error running AI overlay:', error);
            setStatus('error', 'Error: ' + error.message);
        } finally {
            runOverlayBtn.disabled = false;
            runOverlayBtn.innerHTML = '<span class="btn-icon">AI</span> Run AI Overlay';
        }
    });

    // Reset Images button click
    resetImagesBtn.addEventListener('click', async function() {
        try {
            setStatus('processing', 'Restoring images...');
            resetImagesBtn.disabled = true;

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'resetImages'
            });

            setStatus('success', 'Images restored');
            resetImagesBtn.disabled = true;

        } catch (error) {
            console.error('Error resetting images:', error);
            setStatus('error', 'Error: ' + error.message);
            resetImagesBtn.disabled = false;
        }
    });

    function setStatus(type, message) {
        statusIndicator.className = 'status-indicator';
        if (type === 'processing') {
            statusIndicator.classList.add('processing');
        } else if (type === 'error') {
            statusIndicator.classList.add('error');
        }
        statusText.textContent = message;
    }

    async function saveSettings() {
        const settings = {
            style: styleSelect.value,
            intensity: parseInt(intensityRange.value)
        };
        await chrome.storage.local.set({ aiOverlaySettings: settings });
    }

    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['aiOverlaySettings']);
            if (result.aiOverlaySettings) {
                const settings = result.aiOverlaySettings;
                styleSelect.value = settings.style || 'artistic';
                intensityRange.value = settings.intensity || 5;
                intensityValue.textContent = settings.intensity || 5;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Check if images are currently overlaid
    checkOverlayStatus();
    
    async function checkOverlayStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getOverlayStatus'
            });
            
            if (response && response.hasOverlaidImages) {
                resetImagesBtn.disabled = false;
                setStatus('success', `${response.imageCount} images overlaid`);
            }
        } catch (error) {
            // Content script might not be ready, that's okay
            console.log('Content script not ready yet');
        }
    }

    async function checkApiKeyStatus() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getApiStatus'
            });
            
            if (response && !response.hasApiKey) {
                setStatus('processing', 'Using free AI (rate limited)');
                runOverlayBtn.disabled = false;
                runOverlayBtn.innerHTML = '<span class="btn-icon">AI</span> Run AI Overlay';
                
                // Add optional API key configuration
                const configureBtn = document.createElement('button');
                configureBtn.textContent = 'Configure API Key (Optional)';
                configureBtn.className = 'secondary-btn';
                configureBtn.style.marginTop = '10px';
                configureBtn.onclick = configureApiKey;
                document.querySelector('.main-content').appendChild(configureBtn);
            }
        } catch (error) {
            console.error('Error checking API key status:', error);
        }
    }

    async function configureApiKey() {
        const apiKey = prompt('Enter your Hugging Face API key (optional - works without key but with rate limits):\n\nGet free key at: https://huggingface.co/settings/tokens\n\nLeave empty to use without key:');
        if (apiKey !== null) { // Allow empty string for no key
            try {
                await chrome.runtime.sendMessage({
                    action: 'setApiKey',
                    apiKey: apiKey
                });
                
                setStatus('success', apiKey ? 'API key configured' : 'Using free tier (rate limited)');
                runOverlayBtn.disabled = false;
                runOverlayBtn.innerHTML = '<span class="btn-icon">AI</span> Run AI Overlay';
                runOverlayBtn.onclick = null; // Remove the configure handler
                
                // Restore original click handler
                runOverlayBtn.addEventListener('click', arguments.callee);
            } catch (error) {
                console.error('Error setting API key:', error);
                setStatus('error', 'Failed to configure API key');
            }
        }
    }

    async function handleFaceImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                setStatus('processing', 'Processing face image...');
                
                // Convert to data URL
                const dataUrl = await fileToDataUrl(file);
                
                // Send to background script
                const response = await chrome.runtime.sendMessage({
                    action: 'setUserFaceImage',
                    imageDataUrl: dataUrl
                });
                
                if (response.success) {
                    // Show preview
                    facePreviewImg.src = dataUrl;
                    facePreview.style.display = 'block';
                    uploadFaceBtn.style.display = 'none';
                    
                    setStatus('success', 'Face image uploaded successfully');
                } else {
                    throw new Error('Failed to save face image');
                }
                
            } catch (error) {
                console.error('Error uploading face image:', error);
                setStatus('error', 'Failed to upload face image');
            }
        }
    }

    async function removeFaceImage() {
        try {
            // Clear from storage
            await chrome.runtime.sendMessage({
                action: 'setUserFaceImage',
                imageDataUrl: null
            });
            
            // Hide preview
            facePreview.style.display = 'none';
            uploadFaceBtn.style.display = 'flex';
            faceImageUpload.value = '';
            
            setStatus('success', 'Face image removed');
            
        } catch (error) {
            console.error('Error removing face image:', error);
            setStatus('error', 'Failed to remove face image');
        }
    }

    async function loadFaceImage() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getUserFaceImage'
            });
            
            if (response && response.faceImage) {
                facePreviewImg.src = response.faceImage;
                facePreview.style.display = 'block';
                uploadFaceBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading face image:', error);
        }
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
});
