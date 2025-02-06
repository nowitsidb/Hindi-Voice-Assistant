from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from openai import OpenAI
from pathlib import Path
import os
import tempfile
import logging
from dotenv import load_dotenv
from pydub import AudioSegment
import numpy as np
import io
from fastapi.responses import FileResponse
import shutil

load_dotenv()

app = FastAPI(title="Hindi AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://api.openai.com/v1"
)

STATIC_DIR = Path("static/responses")
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

class AudioResponse(BaseModel):
    transcription: str
    response: str
    audioUrl: str

def preprocess_audio(audio_content: bytes) -> bytes:
    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_content))
        
        if audio.channels > 1:
            audio = audio.set_channels(1)
        
        audio = audio.normalize()
        
        buffer = io.BytesIO()
        audio.export(buffer, format='wav', parameters=[
            "-ar", "16000",  
            "-ac", "1",      
            "-b:a", "256k"   
        ])
        return buffer.getvalue()
    except Exception as e:
        logging.error(f"Error preprocessing audio: {str(e)}")
        return audio_content

def post_process_hindi_text(text: str) -> str:
    text = ' '.join(text.split())
    
    replacements = {
        'हैं ': 'हैं',
        'है ': 'है',
        '  ': ' ',
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text.strip()

def generate_ai_response(input_text: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": """
                You are a helpful AI assistant who responds in Hindi. 
                Keep responses natural, friendly and conversational.
                Use proper Hindi grammar and vocabulary.
                Keep responses concise but complete.
                If you don't understand something, ask for clarification in Hindi.
                """},
                {"role": "user", "content": input_text}
            ],
            temperature=0.7,
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception as e:
        logging.error(f"Error generating AI response: {str(e)}")
        return "क्षमा करें, मैं अभी उत्तर नहीं दे पा रहा हूं। कृपया पुनः प्रयास करें।"

@app.post("/api/process-audio", response_model=AudioResponse)
async def process_audio(audio: UploadFile = File(...)):
    try:
        content = await audio.read()
        
        processed_audio = preprocess_audio(content)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            temp_audio.write(processed_audio)
            temp_audio_path = temp_audio.name

        with open(temp_audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="hi",
                response_format="verbose_json",
                temperature=0.2,
                prompt="This is Hindi speech. Please transcribe accurately."
            )

        transcription = post_process_hindi_text(transcript.text)
        
        response_text = generate_ai_response(transcription)
        
        audio_filename = f"speech_{os.urandom(4).hex()}.mp3"
        speech_file_path = STATIC_DIR / audio_filename
        
        speech_response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=response_text,
            speed=0.9
        )
        
        speech_response.stream_to_file(str(speech_file_path))

        if not speech_file_path.exists():
            raise HTTPException(status_code=500, detail="Failed to create audio file")

        audio_url = f"http://localhost:8000/static/responses/{audio_filename}"

        return AudioResponse(
            transcription=transcription,
            response=response_text,
            audioUrl=audio_url
        )

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'temp_audio_path' in locals():
            try:
                os.unlink(temp_audio_path)
            except Exception as e:
                logging.error(f"Error cleaning up temp file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)