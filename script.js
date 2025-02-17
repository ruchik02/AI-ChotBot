import { GoogleGenerativeAI } from "https://cdn.jsdelivr.net/npm/@google/generative-ai@0.1.3/+esm";
import GEMINI_API_KEY from './config.js';

// Add timeout and retry logic for API calls
async function fetchWithTimeout(promise, timeout = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        )
    ]);
}

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const fileInput = document.getElementById('fileInput');
    const emojiButton = document.getElementById('emojiButton');

    // Initialize Gemini API with error checking
    let genAI;
    let model;
    let visionModel;

    try {
        if (!GEMINI_API_KEY) {
            throw new Error('Please set your Gemini API key in config.js');
        }
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
        visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
        console.error('Error initializing Gemini API:', error);
        addMessage("Error: Unable to initialize AI. Please check your API key.", false);
    }

    // Enhanced chatbot responses with more patterns and topics
    function getChatbotResponse(userMessage) {
        const message = userMessage.toLowerCase().trim();

        // First, check if the message is an HTML tag
        if (userMessage.match(/<[^>]*>/)) {
            // If it's an HTML tag, echo it back with an explanation
            return `Here's your HTML rendered: ${userMessage}\nYou can also try other HTML tags like <h1>, <h3>, <p>, <ul>, etc.`;
        }

        // Handle HTML tag requests (when someone types "show me h2" etc)
        if (message.includes('heading 2') || message.includes('h2')) {
            return "Here's a Heading 2: <h2>This is Heading 2</h2>";
        }
        if (message.includes('heading 1') || message.includes('h1')) {
            return "Here's a Heading 1: <h1>This is Heading 1</h1>";
        }
        if (message.includes('heading 3') || message.includes('h3')) {
            return "Here's a Heading 3: <h3>This is Heading 3</h3>";
        }

        // Mathematical Operations - only process if it's clearly a calculation
        if (message.includes('calculate') || message.match(/^[\d\s+\-*\/()]+$/)) {
            try {
                const expression = message.replace(/[^0-9+\-*\/().]/g, '');
                if (expression) {
                    const result = eval(expression);
                    return `The result is: ${result}`;
                }
            } catch {
                return "I couldn't process that calculation. Please provide a valid mathematical expression.";
            }
        }

        // General Knowledge & Questions
        if (message.includes('what is') || message.includes('tell me about') || message.includes('explain')) {
            if (message.includes('javascript')) {
                return "JavaScript is a programming language that powers web interactivity. It's used for:\n- Creating interactive web elements\n- Building web applications\n- Server-side development (Node.js)\n- Mobile app development\nWhat specific aspect would you like to know about?";
            }
            if (message.includes('python')) {
                return "Python is a versatile programming language known for:\n- Easy to read syntax\n- Data science and AI applications\n- Web development (Django, Flask)\n- Automation and scripting\nWhat would you like to learn about Python?";
            }
            if (message.includes('html')) {
                return "HTML (HyperText Markup Language) is the standard markup language for web pages. It defines the structure and content of web pages using various elements and tags.";
            }
            if (message.includes('css')) {
                return "CSS (Cascading Style Sheets) is a styling language used to control the visual presentation of HTML documents. It handles layout, colors, fonts, spacing, and more.";
            }
        }

        // Time and Date Queries
        if (message.includes('time')) {
            return `The current time is ${new Date().toLocaleTimeString()}`;
        }
        if (message.includes('date') || message.includes('day')) {
            return `Today is ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`;
        }

        // Personal Questions
        if (message.includes('who are you') || message.includes('what are you')) {
            return "I'm an AI chatbot designed to help you with various topics including programming, calculations, and general information. I can answer questions, provide explanations, and assist with basic tasks.";
        }
        if (message.includes('your name')) {
            return "You can call me AI Assistant. I'm here to help you!";
        }

        // Greetings
        if (/^(hi|hello|hey|greetings)/i.test(message)) {
            return "Hello! How can I assist you today? Feel free to ask me anything about programming, calculations, or general information.";
        }

        // Help Requests
        if (message.includes('help') || message.includes('can you')) {
            return "I can help you with:\n" +
                   "- HTML tags and elements\n" +
                   "- Formatting text with headings, paragraphs, lists\n" +
                   "- Programming questions\n" +
                   "- Mathematical calculations\n" +
                   "- Time and date information\n" +
                   "- General knowledge\n" +
                   "Just type what you need or ask for an example!";
        }

        // Weather (simulated)
        if (message.includes('weather')) {
            return "I don't have access to real-time weather data, but I can explain weather concepts or recommend weather services. Would you like that?";
        }

        // Coding Questions
        if (message.includes('code') || message.includes('program') || message.includes('debug')) {
            return "I can help with programming concepts and basic code examples. What specific programming topic would you like to learn about?";
        }

        // Farewell
        if (/^(bye|goodbye|see you|farewell)/i.test(message)) {
            return "Goodbye! Feel free to return if you have more questions. Have a great day!";
        }

        // Thank you responses
        if (message.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with?";
        }

        // Handle empty or unclear messages
        if (message.length < 2) {
            return "Please type a complete message or question, and I'll be happy to help!";
        }

        // Handle HTML explanation requests
        if (message.includes('html tags') || message.includes('show me html')) {
            return "I can demonstrate various HTML tags:\n" +
                   "1. Headings: <h1>H1</h1> to <h6>H6</h6>\n" +
                   "2. Paragraphs: <p>Paragraph</p>\n" +
                   "3. Lists: <ul><li>List item</li></ul>\n" +
                   "4. Links: <a href='#'>Link</a>\n" +
                   "Just ask for any specific HTML element!";
        }

        // Default response
        return "I understand you're asking about '" + userMessage + "'. Could you please provide more details or rephrase your question?";
    }

    // Function to show loading indicator
    function showLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    }

    // Function to add message to chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (message.includes('<img')) {
            messageContent.innerHTML = message;
        } else {
            messageContent.textContent = message;
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Enhanced handleUserInput with better error handling
    async function handleUserInput() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, true);
        userInput.value = '';

        // Show loading indicator
        const loadingIndicator = showLoadingIndicator();

        try {
            // Check if API is initialized
            if (!model) {
                throw new Error('AI model not initialized');
            }

            // Get response from Gemini with timeout
            const result = await fetchWithTimeout(
                model.generateContent(message),
                30000 // 30 second timeout
            );
            
            const response = await result.response;
            const text = response.text();

            // Remove loading indicator and add response
            loadingIndicator.remove();
            addMessage(text, false);
        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.remove();
            
            // More specific error messages
            if (error.message.includes('timed out')) {
                addMessage("Sorry, the request took too long. Please try again.", false);
            } else if (error.message.includes('API key')) {
                addMessage("Error: Invalid API key. Please check your configuration.", false);
            } else if (error.message.includes('fetch')) {
                addMessage("Network error. Please check your internet connection.", false);
            } else {
                addMessage("Sorry, I encountered an error. Please try again.", false);
            }
        }
    }

    // Handle image upload with improved error handling
    async function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            addMessage("Please upload only image files.", false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
            // Show uploaded image
            addMessage(`<img src="${e.target.result}" style="max-width: 200px; border-radius: 10px;">`, true);

            // Show loading indicator before API call
            const loadingIndicator = showLoadingIndicator();

            try {
                // Convert image to base64
                const base64Image = e.target.result.split(',')[1];
                
                // Prepare the request for Gemini Vision
                const prompt = "Analyze this image and describe what you see.";
                
                // Get Gemini Vision response with proper image format
                const result = await fetchWithTimeout(
                    visionModel.generateContent([
                        {
                            inlineData: {
                                data: base64Image,
                                mimeType: file.type
                            }
                        },
                        prompt
                    ]),
                    30000 // 30 second timeout
                );
                
                const response = await result.response;
                
                // Remove loading indicator and show response
                loadingIndicator.remove();
                addMessage(response.text(), false);
            } catch (error) {
                console.error('Error:', error);
                loadingIndicator.remove();
                
                // More specific error messages
                if (error.message.includes('404')) {
                    addMessage("Error: Image analysis service is currently unavailable. Please try again later.", false);
                } else if (error.message.includes('timed out')) {
                    addMessage("Request timed out. Please try again with a smaller image.", false);
                } else {
                    addMessage("Sorry, I couldn't analyze that image. Please try again.", false);
                }
            }
        };

        reader.onerror = function() {
            addMessage("Error reading the image file. Please try again.", false);
        };

        reader.readAsDataURL(file);
    }

    // Event Listeners
    sendButton.addEventListener('click', handleUserInput);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                addMessage("File is too large. Please upload an image smaller than 4MB.", false);
                return;
            }
            handleImageUpload(file);
        }
    });

    // Emoji picker functionality
    let emojiPickerVisible = false;
    
    function createEmojiPicker() {
        const emojis = [
            '😊', '😄', '😃', '😀', '🥰',
            '🤗', '😎', '🤔', '🥺', '😌',
            '👍', '👋', '✨', '💡', '💭',
            '💪', '❤️', '💯', '🔥', '⭐'
        ];
        
        const pickerContainer = document.createElement('div');
        pickerContainer.className = 'emoji-picker';
        
        // Create grid container for emojis
        const emojiGrid = document.createElement('div');
        emojiGrid.className = 'emoji-grid';
        
        emojis.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.className = 'emoji-btn';
            emojiButton.textContent = emoji;
            emojiButton.onclick = () => {
                userInput.value += emoji;
                pickerContainer.remove();
                emojiPickerVisible = false;
                userInput.focus();
            };
            emojiGrid.appendChild(emojiButton);
        });
        
        pickerContainer.appendChild(emojiGrid);
        return pickerContainer;
    }

    // Enhanced error handling for emoji picker
    emojiButton.addEventListener('click', (e) => {
        try {
            if (emojiPickerVisible) {
                const picker = document.querySelector('.emoji-picker');
                if (picker) picker.remove();
            } else {
                const picker = createEmojiPicker();
                document.querySelector('.chat-input-container').appendChild(picker);
            }
            emojiPickerVisible = !emojiPickerVisible;
        } catch (error) {
            console.error('Error with emoji picker:', error);
            // Fallback to basic emoji input if picker fails
            userInput.value += '😊';
        }
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-picker') && !e.target.closest('#emojiButton')) {
            const picker = document.querySelector('.emoji-picker');
            if (picker) {
                picker.remove();
                emojiPickerVisible = false;
            }
        }
    });
});
