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
    const apiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key
    const humeApiKey = 'XGp3jgWAzNPFrTFcSWXeuScU0HWorZvsQrgB2p2wAl7NYXQe'; // Replace with your Hume API key
    let currentTab = 'chatbot';
    let mediaRecorder;
    let audioChunks = [];
    let ws;

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
        connectWebSocket();
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

    function initializeVoiceRecognition(stream) {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];
            displayTalkMessage('Audio Blob created.');
            sendAudioToWebSocket(audioBlob);
        };
    }

    function startVoiceRecognition() {
        if (mediaRecorder) {
            mediaRecorder.start();
            mic.classList.add('listening');
            displayTalkMessage('Voice recognition started...');
        }
    }

    function stopVoiceRecognition() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mic.classList.remove('listening');
            displayTalkMessage('Voice recognition stopped...');
        }
    }

    async function requestMicrophoneAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            initializeVoiceRecognition(stream);
            startVoiceRecognition();
        } catch (error) {
            displayTalkMessage(`Error accessing microphone: ${error.message}`);
        }
    }

    function connectWebSocket() {
        ws = new WebSocket(`wss://api.hume.ai/v0/evi/chat?api_key=${humeApiKey}`);

        ws.onopen = () => {
            displayTalkMessage('WebSocket connection established');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.data) {
                displayTalkMessage(`Response from EVI: ${JSON.stringify(message.data)}`);
                playAudio(message.data);
            } else {
                displayTalkMessage(`Response from EVI: No data received`);
            }
        };

        ws.onerror = (error) => {
            displayTalkMessage(`WebSocket error: ${error.message}`);
        };

        ws.onclose = () => {
            displayTalkMessage('WebSocket connection closed');
        };
    }

    function sendAudioToWebSocket(audioBlob) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Audio = reader.result.split(',')[1];
            displayTalkMessage('Sending audio to WebSocket...');
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'audio_input',
                    data: base64Audio
                }));
            } else {
                displayTalkMessage('WebSocket is not open.');
            }
        };
        reader.readAsDataURL(audioBlob);
    }

    function playAudio(base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play().then(() => {
            displayTalkMessage('Audio playback started.');
        }).catch((error) => {
            displayTalkMessage(`Error playing audio: ${error.message}`);
        });
    }

    function displayTalkMessage(message) {
        const talkMessage = document.createElement('p');
        talkMessage.innerHTML = `<strong>EVI:</strong> ${message}`;
        content.appendChild(talkMessage);
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
            requestMicrophoneAccess();
        } else {
            stopVoiceRecognition();
        }
    });

    // Load default tab
    loadChatbot();
});
