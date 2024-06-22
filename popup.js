document.addEventListener('DOMContentLoaded', function () {
    const chatbotTab = document.getElementById('chatbot-tab');
    const talkTab = document.getElementById('talk-tab');
    const settingsTab = document.getElementById('settings-tab');
    const content = document.getElementById('content');
    const sendButton = document.getElementById('send-button');
    const textInput = document.getElementById('text-input');
    let currentTab = 'chatbot';

    function loadChatbot() {
        currentTab = 'chatbot';
        loadContent(currentTab);
        displayChatbotQuestion();
    }

    function loadTalk() {
        currentTab = 'talk';
        loadContent(currentTab);
        displayChatbotQuestion();
    }

    function loadSettings() {
        currentTab = 'settings';
        loadContent(currentTab);
        displayChatbotQuestion();
    }

    function saveContent(tab) {
        chrome.storage.local.set({ [tab]: content.innerHTML });
    }

    function loadContent(tab) {
        chrome.storage.local.get([tab], function (result) {
            if (result[tab]) {
                content.innerHTML = result[tab];
            } else {
                content.innerHTML = `<h2>${capitalizeFirstLetter(tab)}</h2><p>Welcome to the ${tab} interface.</p>`;
            }
        });
    }

    function displayChatbotQuestion() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tabTitle = tabs[0].title;
            const question = `Do you need my help about "${tabTitle}"? If yes, please ask!`;
            const questionElement = document.createElement('p');
            questionElement.innerHTML = `<strong>Chatbot:</strong> ${question}`;
            content.appendChild(questionElement);
            saveContent(currentTab);
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function saveActiveTab(tab) {
        chrome.storage.local.set({ activeTab: tab });
    }

    function loadActiveTab() {
        chrome.storage.local.get(['activeTab'], function (result) {
            switch (result.activeTab) {
                case 'talk':
                    loadTalk();
                    break;
                case 'settings':
                    loadSettings();
                    break;
                case 'chatbot':
                default:
                    loadChatbot();
                    break;
            }
        });
    }

    chatbotTab.addEventListener('click', function() {
        saveContent(currentTab);
        loadChatbot();
        saveActiveTab('chatbot');
    });

    talkTab.addEventListener('click', function() {
        saveContent(currentTab);
        loadTalk();
        saveActiveTab('talk');
    });

    settingsTab.addEventListener('click', function() {
        saveContent(currentTab);
        loadSettings();
        saveActiveTab('settings');
    });

    sendButton.addEventListener('click', function () {
        const userInput = textInput.value;
        if (userInput) {
            const userMessage = document.createElement('p');
            userMessage.innerHTML = `<strong>User:</strong> ${userInput}`;
            content.appendChild(userMessage);
            textInput.value = '';
            saveContent(currentTab);
        }
    });

    // Load saved content and active tab on startup
    loadActiveTab();
});
