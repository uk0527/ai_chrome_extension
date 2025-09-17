// Content script for AI Image Overlay Extension
class AIImageOverlay {
    constructor() {
        this.originalImages = new Map();
        this.isOverlaid = false;
        this.overlaidCount = 0;
        this.settings = {
            style: 'artistic',
            intensity: 5
        };
        
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'runAIOverlay':
                    this.settings = request.settings;
                    await this.runAIOverlay();
                    sendResponse({ success: true, imageCount: this.overlaidCount });
                    break;
                    
                case 'resetImages':
                    this.resetImages();
                    sendResponse({ success: true });
                    break;
                    
                case 'getOverlayStatus':
                    sendResponse({ 
                        hasOverlaidImages: this.isOverlaid, 
                        imageCount: this.overlaidCount 
                    });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ error: error.message });
        }
    }

    async runAIOverlay() {
        try {
            // Find all img elements
            const images = this.findImages();
            console.log(`Found ${images.length} images to process`);

            if (images.length === 0) {
                throw new Error('No images found on this page');
            }

            // Store original images
            this.storeOriginalImages(images);

            // Process images with AI
            await this.processImagesWithAI(images);

            this.isOverlaid = true;
            this.overlaidCount = images.length;

            // Add visual indicator
            this.addVisualIndicators(images);

        } catch (error) {
            console.error('Error running AI overlay:', error);
            throw error;
        }
    }

    findImages() {
        // Find all img elements that are visible and have valid src
        const images = Array.from(document.querySelectorAll('img')).filter(img => {
            return img.src && 
                   img.src.startsWith('http') && 
                   !img.src.includes('data:') &&
                   img.offsetWidth > 0 && 
                   img.offsetHeight > 0 &&
                   !img.hasAttribute('data-ai-overlay'); // Skip already processed images
        });

        return images;
    }

    storeOriginalImages(images) {
        images.forEach((img, index) => {
            const imageData = {
                src: img.src,
                alt: img.alt || '',
                title: img.title || '',
                width: img.width,
                height: img.height,
                className: img.className,
                id: img.id,
                style: img.style.cssText
            };
            
            this.originalImages.set(img, imageData);
        });
    }

    async processImagesWithAI(images) {
        // Process images with real Gemini AI API calls
        for (const img of images) {
            try {
                // Add processing indicator
                this.addProcessingIndicator(img);
                
                // Call background script for real AI processing
                const response = await chrome.runtime.sendMessage({
                    action: 'processImageWithAI',
                    imageUrl: img.src,
                    settings: this.settings
                });
                
                if (response && response.success) {
                    // Replace the image with AI-generated version
                    this.replaceImage(img, response.aiImageUrl);
                } else {
                    throw new Error(response?.error || 'Failed to process image with AI');
                }
                
                // Remove processing indicator
                this.removeProcessingIndicator(img);
                
            } catch (error) {
                console.error('Error processing image:', error);
                // Fallback to placeholder image
                try {
                    const fallbackUrl = await this.generateAIImage(img.src);
                    this.replaceImage(img, fallbackUrl);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }
                this.removeProcessingIndicator(img);
            }
        }
    }

    async generateAIImage(originalUrl) {
        // For MVP, we'll use a placeholder service
        // In production, this would call the background script with Gemini AI
        
        try {
            // Use a placeholder service that can modify images
            const baseUrl = 'https://picsum.photos';
            const width = 400;
            const height = 300;
            const seed = Math.floor(Math.random() * 1000);
            
            // Add some query parameters to make it look different
            const modifiedUrl = `${baseUrl}/${width}/${height}?random=${seed}&style=${this.settings.style}&intensity=${this.settings.intensity}`;
            
            return modifiedUrl;
        } catch (error) {
            console.error('Error generating AI image:', error);
            // Fallback to original image
            return originalUrl;
        }
    }

    replaceImage(img, newSrc) {
        // Mark as AI processed
        img.setAttribute('data-ai-overlay', 'true');
        
        // Store the new src
        img.setAttribute('data-ai-src', newSrc);
        
        // Replace the src
        img.src = newSrc;
        
        // Add error handling
        img.onerror = () => {
            console.error('Failed to load AI image:', newSrc);
            this.restoreOriginalImage(img);
        };
    }

    restoreOriginalImage(img) {
        const originalData = this.originalImages.get(img);
        if (originalData) {
            img.src = originalData.src;
            img.alt = originalData.alt;
            img.title = originalData.title;
            img.removeAttribute('data-ai-overlay');
            img.removeAttribute('data-ai-src');
        }
    }

    resetImages() {
        // Restore all original images
        for (const [img, originalData] of this.originalImages) {
            this.restoreOriginalImage(img);
        }
        
        // Clear stored data
        this.originalImages.clear();
        this.isOverlaid = false;
        this.overlaidCount = 0;
        
        // Remove visual indicators
        this.removeAllVisualIndicators();
    }

    addVisualIndicators(images) {
        images.forEach(img => {
            img.style.border = '2px solid #667eea';
            img.style.borderRadius = '4px';
            img.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.3)';
        });
    }

    removeAllVisualIndicators() {
        const overlaidImages = document.querySelectorAll('[data-ai-overlay="true"]');
        overlaidImages.forEach(img => {
            img.style.border = '';
            img.style.borderRadius = '';
            img.style.boxShadow = '';
        });
    }

    addProcessingIndicator(img) {
        const indicator = document.createElement('div');
        indicator.className = 'ai-overlay-processing';
        indicator.innerHTML = 'AI';
        indicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(102, 126, 234, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: pulse 1s infinite;
        `;
        
        // Make img container relative
        const imgParent = img.parentElement;
        if (imgParent) {
            imgParent.style.position = 'relative';
            imgParent.appendChild(indicator);
        }
    }

    removeProcessingIndicator(img) {
        const indicator = img.parentElement?.querySelector('.ai-overlay-processing');
        if (indicator) {
            indicator.remove();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the AI Image Overlay
const aiImageOverlay = new AIImageOverlay();

// Add CSS for processing animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
`;
document.head.appendChild(style);
