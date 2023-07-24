export type RecordAction = 'start' | 'stop';

export const supportedRecorder =
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
