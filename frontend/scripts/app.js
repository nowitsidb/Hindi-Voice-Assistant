class HindiAIAssistant {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioPlayer = new Audio();
        
        this.recordButton = document.getElementById('recordButton');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorToast = document.getElementById('errorToast');
        
        this.toggleRecording = this.toggleRecording.bind(this);
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.handleAudioData = this.handleAudioData.bind(this);
        this.showError = this.showError.bind(this);

        this.init();
    }

    init() {
        this.recordButton.addEventListener('click', this.toggleRecording);
        document.querySelector('.toast-close')?.addEventListener('click', () => {
            this.errorToast.classList.add('hidden');
        });

        this.audioPlayer.addEventListener('play', () => {
            this.recordButton.disabled = true;
        });
        this.audioPlayer.addEventListener('ended', () => {
            this.recordButton.disabled = false;
        });

        this.checkMicrophonePermission();
    }

    async checkMicrophonePermission() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            console.error('Microphone access denied:', error);
            this.showError('Please enable microphone access to use the assistant');
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                this.handleAudioData();
            };

            this.audioChunks = [];
            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateUI(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Error accessing microphone');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateUI(false);
        }
    }

    async handleAudioData() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.showLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('http://localhost:8000/api/process-audio', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.transcription) {
                this.addMessage('user', data.transcription);
            }
            
            if (data.response) {
                this.addMessage('ai', data.response);
            }

            if (data.audioUrl) {
                try {
                    this.audioPlayer.src = data.audioUrl;
                    await this.audioPlayer.play();
                } catch (error) {
                    console.error('Error playing audio:', error);
                    this.showError('Error playing audio response');
                }
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            this.showError('Error processing your message');
        } finally {
            this.showLoading(false);
        }
    }

    addMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;

        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timestamp);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateUI(isRecording) {
        this.recordButton.classList.toggle('recording', isRecording);
        this.recordingStatus.textContent = isRecording ? 'Recording...' : '';
        
        const micIcon = this.recordButton.querySelector('.mic-icon');
        if (isRecording) {
            micIcon.innerHTML = `
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
            `;
        } else {
            micIcon.innerHTML = `
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
            `;
        }
    }

    showLoading(show) {
        this.loadingIndicator.classList.toggle('hidden', !show);
        this.recordButton.disabled = show;
    }

    showError(message, duration = 5000) {
        const toast = this.errorToast;
        const messageEl = toast.querySelector('.toast-message');
        messageEl.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HindiAIAssistant();
});