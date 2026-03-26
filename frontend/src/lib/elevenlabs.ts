/**
 * ElevenLabs Text-to-Speech integration
 */

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - default voice
const API_BASE = 'https://api.elevenlabs.io/v1';

function getApiKey(): string {
  // Check localStorage first (user-configured), then env variable
  return localStorage.getItem('sc_elevenlabs_key') || import.meta.env.VITE_ELEVENLABS_API_KEY || '';
}

export function hasElevenLabsKey(): boolean {
  return !!getApiKey();
}

export function setElevenLabsKey(key: string): void {
  if (key) {
    localStorage.setItem('sc_elevenlabs_key', key);
  } else {
    localStorage.removeItem('sc_elevenlabs_key');
  }
}

export function getElevenLabsKey(): string {
  return localStorage.getItem('sc_elevenlabs_key') || import.meta.env.VITE_ELEVENLABS_API_KEY || '';
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

/**
 * Fetch available voices from ElevenLabs
 */
export async function getVoices(): Promise<Voice[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(`${API_BASE}/voices`, {
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) throw new Error('Failed to fetch voices');
    const data = await response.json();
    return data.voices || [];
  } catch {
    return [];
  }
}

/**
 * Convert text to speech using ElevenLabs API
 * Returns an audio blob that can be played
 */
export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<Blob | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${API_BASE}/text-to-speech/${voiceId || DEFAULT_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text.substring(0, 5000), // ElevenLabs has a character limit
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail?.message || `ElevenLabs API error: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

/**
 * Play audio blob through the browser
 */
export function playAudio(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to play audio'));
    };
    audio.play().catch(reject);
  });
}

/**
 * Speak text using ElevenLabs TTS - combines textToSpeech and playAudio
 */
export async function speak(text: string, voiceId?: string): Promise<boolean> {
  const blob = await textToSpeech(text, voiceId);
  if (!blob) return false;

  try {
    await playAudio(blob);
    return true;
  } catch {
    return false;
  }
}
