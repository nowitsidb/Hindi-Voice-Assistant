# Hindi AI Assistant

## Overview

The Hindi AI Assistant is an innovative voice-based conversational application that allows users to interact with an AI in Hindi through speech-to-text, natural language processing, and text-to-speech technologies.

## 🌟 Features

- **Voice-Powered Interaction**: Communicate with the AI using spoken Hindi
- **Real-Time Transcription**: Converts spoken Hindi to text
- **AI-Powered Responses**: Generates intelligent responses in Hindi
- **Text-to-Speech Playback**: Converts AI responses back to spoken Hindi
- **Modern, Responsive UI**: Sleek design with neumorphic and glass effect styling

## 🛠 Technologies Used

### Backend
- **Framework**: FastAPI
- **Speech-to-Text**: OpenAI Whisper
- **Text Generation**: OpenAI GPT-3.5-turbo
- **Text-to-Speech**: OpenAI TTS
- **Audio Processing**: PyDub

### Frontend
- **HTML5**
- **CSS**: Modern UI with neumorphic design
- **JavaScript**: Vanilla JS with modern Web APIs

### Key Dependencies
- `fastapi`: Web framework
- `openai`: AI service integration
- `pydub`: Audio processing
- `uvicorn`: ASGI server

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- OpenAI API Key
- Docker (optional)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/hindi-ai-assistant.git
   cd hindi-ai-assistant
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Set Up Environment Variables**
   Create a `.env` file in the backend directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Run the Application**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t hindi-ai-assistant .
   ```

2. **Run Docker Container**
   ```bash
   docker run -p 8000:8000 -e OPENAI_API_KEY=your_key hindi-ai-assistant
   ```

## 🖥 Project Structure

```
hindi-ai-assistant/
│
├── backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── static/
│       └── responses/    # Audio response storage
│
├── frontend/
│   ├── index.html        # Main HTML template
│   ├── scripts/
│   │   └── app.js        # Frontend JavaScript
│   └── styles/
│       └── main.css      # Neumorphic design styles
│
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Multi-container orchestration
```

## 🔧 Key Components

### Speech Processing Pipeline
1. **Audio Recording**: Capture user's spoken Hindi
2. **Preprocessing**: Normalize audio for better recognition
3. **Speech-to-Text**: Transcribe audio using Whisper
4. **AI Response Generation**: Create contextual response
5. **Text-to-Speech**: Convert response to spoken audio

### Frontend Interactions
- Mic button toggles recording
- Displays conversation history
- Shows loading indicators
- Handles error states

## 🌐 API Endpoints

### `/api/process-audio`
- **Method**: POST
- **Input**: Audio file
- **Output**: 
  ```json
  {
    "transcription": "User's spoken text",
    "response": "AI's reply",
    "audioUrl": "URL of audio response"
  }
  ```

## 🔒 Security & Performance

- Uses CORS middleware
- Implements error handling
- Normalizes and preprocesses audio
- Configurable API parameters

## 🔜 Future Roadmap
- Multi-dialect support
- Improved context retention
- Offline mode
- More advanced NLP techniques