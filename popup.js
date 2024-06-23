document.addEventListener('DOMContentLoaded', function () {
    const chatbotTab = document.getElementById('chatbot-tab');
    const talkTab = document.getElementById('talk-tab');
    const settingsTab = document.getElementById('settings-tab');
    const content = document.getElementById('content');
    const sendButton = document.getElementById('send-button');
    const textInput = document.getElementById('text-input');
    const voiceFooter = document.getElementById('voice-footer');
    const footer = document.getElementById('footer');
    const mic = document.getElementById('mic');
    const typingIndicator = document.getElementById('typing-indicator');
    //const apiKey = ''; // Replace with your OpenAI API key
    let currentTab = 'chatbot';

    function loadChatbot() {
        currentTab = 'chatbot';
        content.innerHTML = `<h2>Chatbot</h2>`;
        footer.style.display = 'flex';
        voiceFooter.style.display = 'none';
        setActiveTab(chatbotTab);
        displayGreetingMessage();
        loadConversation();
    }

    function loadTalk() {
        currentTab = 'talk';
        content.innerHTML = `<h2>Talk</h2><p>Welcome to the talk interface.</p>`;
        footer.style.display = 'none';
        voiceFooter.style.display = 'flex';
        setActiveTab(talkTab);
    }

    function loadSettings() {
        currentTab = 'settings';
        content.innerHTML = `<h2>Settings</h2><p>Welcome to the settings interface.</p>`;
        footer.style.display = 'flex';
        voiceFooter.style.display = 'none';
        setActiveTab(settingsTab);
    }

    function setActiveTab(tab) {
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('selected');
        });
        tab.classList.add('selected');
    }

    function displayGreetingMessage() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tabTitle = tabs[0].title;
            const greetingMessage = `<p><strong>Chatbot:</strong> Hello! Do you have any questions about "${tabTitle}"? If yes, please ask!</p>`;
            content.innerHTML += greetingMessage;
        });
    }

    async function sendMessageToOpenAI(message) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // or 'gpt-4'
                    messages: [{ role: 'user', content: message }],
                    max_tokens: 150
                })
            });
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error:', error);
            return 'Sorry, I could not get a response. Please try again later.';
        }
    }

    async function handleMessageSend() {
        const userInput = textInput.value.trim();
        if (userInput) {
            const userMessage = document.createElement('p');
            userMessage.innerHTML = `<strong>User:</strong> ${userInput}`;
            content.appendChild(userMessage);
            textInput.value = '';

            // Show typing indicator
            typingIndicator.style.display = 'flex';

            // Send message to OpenAI and get response
            const botResponseText = await sendMessageToOpenAI(userInput);

            // Hide typing indicator
            typingIndicator.style.display = 'none';

            // Display response from OpenAI
            const botResponse = document.createElement('p');
            botResponse.innerHTML = `<strong>Chatbot:</strong> ${botResponseText}`;
            content.appendChild(botResponse);

            // Save conversation
            saveConversation();
        }
    }

    function saveConversation() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tabId = tabs[0].id;
            const conversation = content.innerHTML;
            const storageKey = `conversation_${tabId}`;
            chrome.storage.local.set({ [storageKey]: conversation }, function () {
                console.log('Conversation saved.');
            });
        });
    }

    function loadConversation() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tabId = tabs[0].id;
            const storageKey = `conversation_${tabId}`;
            chrome.storage.local.get([storageKey], function (result) {
                if (result[storageKey]) {
                    content.innerHTML = result[storageKey];
                }
            });
        });
    }

    sendButton.addEventListener('click', handleMessageSend);

    textInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            handleMessageSend();
        }
    });

    chatbotTab.addEventListener('click', function() {
        loadChatbot();
    });

    talkTab.addEventListener('click', function() {
        loadTalk();
    });

    settingsTab.addEventListener('click', function() {
        loadSettings();
    });

    mic.addEventListener('click', function () {
        if (!mic.classList.contains('listening')) {
            startVoiceRecognition();
        } else {
            stopVoiceRecognition();
        }
    });

    function startVoiceRecognition() {
        mic.classList.add('listening');
        console.log('Voice recognition started...');
        // Here you would integrate the Web Speech API
    }

    function stopVoiceRecognition() {
        mic.classList.remove('listening');
        console.log('Voice recognition stopped...');
        // Here you would integrate the Web Speech API
    }

    // Load default tab
    loadChatbot();
});
