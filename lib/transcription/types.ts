export interface WordData {
  text: string;
  startSec: number;
  endSec: number;
}

export interface TranscriptUtteranceData {
  speaker: string;
  text: string;
  startSec: number;
  endSec: number;
  words: WordData[];
}
