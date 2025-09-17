# AI Image Overlay Extension

A Chrome extension that transforms images on webpages with AI-generated personalized versions using free Hugging Face Stable Diffusion. Upload your face to see yourself in product images!

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)](https://github.com/uk0527/ai_chrome_extension)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://github.com/uk0527/ai_chrome_extension/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/uk0527/ai_chrome_extension?style=for-the-badge)](https://github.com/uk0527/ai_chrome_extension/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/uk0527/ai_chrome_extension?style=for-the-badge)](https://github.com/uk0527/ai_chrome_extension/network)

## Features

- **Smart Image Detection** - Automatically finds and processes all visible images
- **Free AI Generation** - Uses Hugging Face Stable Diffusion (no API key required)
- **Face Personalization** - Upload your face to personalize product images
- **Multiple Styles** - Artistic, Realistic, Cartoon, Vintage, Modern
- **Intensity Control** - Adjust AI modification strength (1-10)
- **One-Click Reset** - Restore original images anytime
- **Visual Indicators** - See which images are processed
- **Local Storage** - Your data stays on your device

## Quick Start

### Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/uk0527/ai_chrome_extension.git
   cd ai_chrome_extension
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the extension folder
   - The extension icon will appear in your toolbar

3. **Start Using**
   - Navigate to any webpage with images
   - Click the extension icon
   - Click "Run AI Overlay" to transform images!

### Usage

1. **Basic Usage (No Face Upload)**
   - Images get transformed with AI-generated styles
   - Choose from different styles and intensity levels
   - Perfect for trying different artistic effects

2. **With Face Personalization**
   - Click "Upload Your Face" and select a clear photo
   - Product images will be personalized with your appearance
   - Great for trying on sunglasses, watches, clothes, etc.

## Use Cases

- **E-commerce**: See yourself wearing products on Amazon, fashion sites
- **Social Media**: Transform images with artistic styles
- **Content Creation**: Generate unique images for blogs, presentations
- **Personal Shopping**: Visualize how products would look on you
- **Entertainment**: Have fun with AI-generated image transformations

## Technical Details

### Architecture
```
User clicks "Run AI Overlay"
         │
         ▼
Content Script scans page for <img> tags
         │
         ▼
Background Script calls Hugging Face API
         │
         ▼
Stable Diffusion generates new images
         │
         ▼
Content Script replaces images with AI versions
```

### Tech Stack
- **Chrome Extension**: Manifest V3
- **AI Service**: Hugging Face Stable Diffusion XL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Chrome Storage API
- **Image Processing**: Base64 encoding, Blob handling

### File Structure
```
ai_chrome_extension/
├── manifest.json          # Extension configuration
├── popup.html             # User interface
├── popup.css              # Styling
├── popup.js               # Popup functionality
├── content.js             # Image processing
├── background.js          # AI API integration
├── test.html              # Test page
└── README.md              # This file
```

## Configuration

### Settings
- **Style Selection**: Choose AI transformation style
- **Intensity Control**: Adjust modification strength (1-10)
- **Face Upload**: Optional personalization with your photo
- **API Key**: Optional Hugging Face key for higher rate limits

### Styles Available
- **Artistic**: Creative, abstract, colorful interpretations
- **Realistic**: Photorealistic, detailed enhancements
- **Cartoon**: Animated, playful, colorful style
- **Vintage**: Retro, sepia, classic aesthetic
- **Modern**: Contemporary, sleek, minimalist

## Privacy & Security

- **Local Storage**: Face images stored on your device only
- **No Cloud Upload**: Data doesn't leave your browser unnecessarily
- **Secure API**: Encrypted communication with Hugging Face
- **Minimal Permissions**: Only requests necessary access
- **Open Source**: Full transparency in code

## Troubleshooting

### Common Issues

**Extension not working?**
- Check if Developer mode is enabled
- Reload the extension
- Check browser console for errors (F12)

**Images not processing?**
- Verify internet connection
- Check if images are accessible
- Try a different webpage

**Face upload issues?**
- Use clear, well-lit photos
- Supported formats: JPG, PNG
- Try different image sizes

### Debug Mode
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for extension-related messages
4. Check Network tab for API calls

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Setup
```bash
# Clone the repository
git clone https://github.com/uk0527/ai_chrome_extension.git

# Navigate to the directory
cd ai_chrome_extension

# Load in Chrome (see installation steps above)
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/uk0527/ai_chrome_extension/issues)
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/uk0527/ai_chrome_extension/discussions)
- **Documentation**: Check this README and code comments

## Changelog

### Version 1.0.0
- Initial release
- AI image generation with multiple styles
- Face personalization feature
- Free Hugging Face API integration
- Image reset functionality
- Visual indicators and status updates

---

**Made with love for the AI and Chrome Extension community**

**Star this repository if you find it helpful!**