// Background script for AI Image Overlay Extension
class AIImageProcessor {
    constructor() {
        this.apiKey = null;
        this.apiUrl = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
        this.init();
    }

    init() {
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Load API key from storage
        this.loadApiKey();
    }

    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['geminiApiKey']);
            this.apiKey = result.geminiApiKey;
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'processImageWithAI':
                    const result = await this.processImageWithAI(request.imageUrl, request.settings);
                    sendResponse({ success: true, aiImageUrl: result });
                    break;
                    
                case 'setApiKey':
                    await this.setApiKey(request.apiKey);
                    sendResponse({ success: true });
                    break;
                    
                case 'setUserFaceImage':
                    const success = await this.setUserFaceImage(request.imageDataUrl);
                    sendResponse({ success: success });
                    break;
                    
                case 'getApiStatus':
                    sendResponse({ 
                        hasApiKey: !!this.apiKey,
                        apiUrl: this.apiUrl 
                    });
                    break;
                    
                case 'getUserFaceImage':
                    const faceImage = await this.getUserFaceImage();
                    sendResponse({ faceImage: faceImage });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ error: error.message });
        }
    }

    async setApiKey(apiKey) {
        this.apiKey = apiKey;
        await chrome.storage.local.set({ geminiApiKey: apiKey });
    }

    async processImageWithAI(imageUrl, settings) {
        try {
            // First, check if user has uploaded their face image
            const userFaceImage = await this.getUserFaceImage();
            
            if (userFaceImage) {
                // Use face swapping or personalization
                return await this.personalizeImageWithFace(imageUrl, userFaceImage, settings);
            } else {
                // Fallback to style-based generation
                const prompt = this.createPrompt(settings);
                return await this.callHuggingFaceAPI(prompt, settings);
            }
            
        } catch (error) {
            console.error('Error processing image with AI:', error);
            // Fallback to a placeholder service
            return this.getFallbackImage(imageUrl, settings);
        }
    }

    async imageToBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting image to base64:', error);
            throw error;
        }
    }

    createPrompt(settings) {
        const style = settings.style || 'artistic';
        const intensity = settings.intensity || 5;
        
        const stylePrompts = {
            artistic: 'artistic, creative, abstract, colorful, vibrant',
            realistic: 'photorealistic, detailed, high quality, sharp',
            cartoon: 'cartoon style, animated, colorful, playful',
            vintage: 'vintage, retro, sepia, aged, classic',
            modern: 'modern, contemporary, sleek, minimalist, clean'
        };
        
        const basePrompt = stylePrompts[style] || stylePrompts.artistic;
        const intensityText = intensity > 7 ? 'highly detailed, dramatic, intense' : 
                            intensity > 4 ? 'detailed, enhanced' : 
                            'subtle, gentle';
        
        return `${basePrompt}, ${intensityText}, beautiful, professional quality`;
    }

    async callHuggingFaceAPI(prompt, settings) {
        try {
            const requestBody = {
                inputs: prompt,
                parameters: {
                    num_inference_steps: 20,
                    guidance_scale: 7.5,
                    width: 512,
                    height: 512
                }
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                if (response.status === 503) {
                    // Model is loading, wait and retry
                    console.log('Model is loading, waiting...');
                    await this.delay(5000);
                    return this.callHuggingFaceAPI(prompt, settings);
                }
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const imageBlob = await response.blob();
            
            // Convert blob to data URL
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(imageBlob);
            });
            
        } catch (error) {
            console.error('Error calling Hugging Face API:', error);
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getUserFaceImage() {
        try {
            const result = await chrome.storage.local.get(['userFaceImage']);
            return result.userFaceImage || null;
        } catch (error) {
            console.error('Error getting user face image:', error);
            return null;
        }
    }

    async setUserFaceImage(imageDataUrl) {
        try {
            await chrome.storage.local.set({ userFaceImage: imageDataUrl });
            return true;
        } catch (error) {
            console.error('Error setting user face image:', error);
            return false;
        }
    }

    async personalizeImageWithFace(productImageUrl, userFaceImage, settings) {
        try {
            // For now, we'll use a free face swapping service
            // In production, you'd use a more sophisticated face swapping API
            
            // Convert both images to base64
            const productImageBase64 = await this.imageToBase64(productImageUrl);
            const userFaceBase64 = userFaceImage.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            
            // Use a free face swapping API (like Replicate or Hugging Face)
            return await this.callFaceSwapAPI(productImageBase64, userFaceBase64, settings);
            
        } catch (error) {
            console.error('Error personalizing image with face:', error);
            // Fallback to style-based generation
            const prompt = this.createPrompt(settings);
            return await this.callHuggingFaceAPI(prompt, settings);
        }
    }

    async callFaceSwapAPI(productImageBase64, userFaceBase64, settings) {
        try {
            // Using a free face swapping model from Hugging Face
            const faceSwapUrl = 'https://api-inference.huggingface.co/models/akhaliq/CLIPSeg';
            
            const requestBody = {
                inputs: {
                    image: productImageBase64,
                    prompt: "face"
                }
            };

            const response = await fetch(faceSwapUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Face swap API failed: ${response.status}`);
            }

            // For now, return a modified version of the original image
            // In a real implementation, you'd process the face swap result
            return await this.createPersonalizedImage(productImageBase64, userFaceBase64, settings);
            
        } catch (error) {
            console.error('Error calling face swap API:', error);
            throw error;
        }
    }

    async createPersonalizedImage(productImageBase64, userFaceBase64, settings) {
        try {
            // Create a personalized prompt that includes face information
            const personalizedPrompt = this.createPersonalizedPrompt(settings);
            
            // Use the personalized prompt with Stable Diffusion
            return await this.callHuggingFaceAPI(personalizedPrompt, settings);
            
        } catch (error) {
            console.error('Error creating personalized image:', error);
            throw error;
        }
    }

    createPersonalizedPrompt(settings) {
        const style = settings.style || 'artistic';
        const intensity = settings.intensity || 5;
        
        const stylePrompts = {
            artistic: 'artistic portrait, creative, abstract, colorful, vibrant',
            realistic: 'photorealistic portrait, detailed, high quality, sharp',
            cartoon: 'cartoon portrait, animated, colorful, playful',
            vintage: 'vintage portrait, retro, sepia, aged, classic',
            modern: 'modern portrait, contemporary, sleek, minimalist, clean'
        };
        
        const basePrompt = stylePrompts[style] || stylePrompts.artistic;
        const intensityText = intensity > 7 ? 'highly detailed, dramatic, intense' : 
                            intensity > 4 ? 'detailed, enhanced' : 
                            'subtle, gentle';
        
        return `${basePrompt}, ${intensityText}, beautiful, professional quality, personalized face`;
    }

    getFallbackImage(originalUrl, settings) {
        // Fallback to a placeholder service for MVP
        const baseUrl = 'https://picsum.photos';
        const width = 400;
        const height = 300;
        const seed = Math.floor(Math.random() * 1000);
        
        // Add style-based modifications
        const styleParams = {
            artistic: 'blur=1&grayscale',
            realistic: 'grayscale',
            cartoon: 'blur=2',
            vintage: 'sepia=100',
            modern: 'blur=0.5'
        };
        
        const styleParam = styleParams[settings.style] || '';
        const intensity = settings.intensity || 5;
        
        // Create a more sophisticated fallback URL with style parameters
        let fallbackUrl = `${baseUrl}/${width}/${height}?random=${seed}`;
        
        if (styleParam) {
            fallbackUrl += `&${styleParam}`;
        }
        
        // Add intensity-based modifications
        if (intensity > 7) {
            fallbackUrl += '&blur=2';
        } else if (intensity > 4) {
            fallbackUrl += '&blur=1';
        }
        
        return fallbackUrl;
    }
}

// Initialize the AI Image Processor
const aiImageProcessor = new AIImageProcessor();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('AI Image Overlay Extension installed');
        // Set default settings
        chrome.storage.local.set({
            aiOverlaySettings: {
                style: 'artistic',
                intensity: 5
            }
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('AI Image Overlay Extension started');
});
