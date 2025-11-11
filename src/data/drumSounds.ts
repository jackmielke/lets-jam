import { DrumSound } from "@/types/audio";

export const drumPadSounds: DrumSound[] = [
  // Row 1 - Cymbals and Hi-hats
  { id: "hihat-closed", name: "Hi-Hat", type: "hihat", frequency: 10000, color: "bg-yellow-500" },
  { id: "hihat-open", name: "Hi-Hat Open", type: "hihat", frequency: 12000, color: "bg-yellow-600" },
  { id: "crash", name: "Crash", type: "cymbal", frequency: 8000, color: "bg-cyan-500" },
  { id: "ride", name: "Ride", type: "cymbal", frequency: 9000, color: "bg-cyan-600" },
  
  // Row 2 - Snares and Toms
  { id: "snare", name: "Snare", type: "snare", frequency: 200, color: "bg-blue-500" },
  { id: "tom-high", name: "High Tom", type: "tom", frequency: 400, color: "bg-orange-400" },
  { id: "tom-mid", name: "Mid Tom", type: "tom", frequency: 300, color: "bg-orange-500" },
  { id: "tom-low", name: "Low Tom", type: "tom", frequency: 200, color: "bg-orange-600" },
  
  // Row 3 - Kicks and Percussion
  { id: "kick", name: "Kick", type: "kick", frequency: 60, color: "bg-red-600" },
  { id: "kick-sub", name: "Sub Kick", type: "kick", frequency: 40, color: "bg-red-800" },
  { id: "clap", name: "Clap", type: "clap", frequency: 1000, color: "bg-purple-500" },
  { id: "rim", name: "Rimshot", type: "rim", frequency: 2000, color: "bg-pink-500" },
  
  // Row 4 - Extra Percussion
  { id: "cowbell", name: "Cowbell", type: "cowbell", frequency: 800, color: "bg-green-500" },
  { id: "shaker", name: "Shaker", type: "hihat", frequency: 15000, color: "bg-green-600" },
  { id: "tambourine", name: "Tambourine", type: "cymbal", frequency: 13000, color: "bg-green-400" },
  { id: "woodblock", name: "Woodblock", type: "cowbell", frequency: 1200, color: "bg-green-700" },
];

export const pianoSounds: DrumSound[] = [
  // Octave 3
  { id: "c3", name: "C3", type: "kick", frequency: 130.81, color: "bg-white" },
  { id: "cs3", name: "C#3", type: "snare", frequency: 138.59, color: "bg-black" },
  { id: "d3", name: "D3", type: "hihat", frequency: 146.83, color: "bg-white" },
  { id: "ds3", name: "D#3", type: "clap", frequency: 155.56, color: "bg-black" },
  { id: "e3", name: "E3", type: "tom", frequency: 164.81, color: "bg-white" },
  { id: "f3", name: "F3", type: "cymbal", frequency: 174.61, color: "bg-white" },
  { id: "fs3", name: "F#3", type: "cowbell", frequency: 185.00, color: "bg-black" },
  { id: "g3", name: "G3", type: "rim", frequency: 196.00, color: "bg-white" },
  { id: "gs3", name: "G#3", type: "kick", frequency: 207.65, color: "bg-black" },
  { id: "a3", name: "A3", type: "snare", frequency: 220.00, color: "bg-white" },
  { id: "as3", name: "A#3", type: "hihat", frequency: 233.08, color: "bg-black" },
  { id: "b3", name: "B3", type: "clap", frequency: 246.94, color: "bg-white" },
  
  // Octave 4 (central)
  { id: "c4", name: "C4", type: "tom", frequency: 261.63, color: "bg-white" },
  { id: "cs4", name: "C#4", type: "cymbal", frequency: 277.18, color: "bg-black" },
  { id: "d4", name: "D4", type: "cowbell", frequency: 293.66, color: "bg-white" },
  { id: "ds4", name: "D#4", type: "rim", frequency: 311.13, color: "bg-black" },
  { id: "e4", name: "E4", type: "kick", frequency: 329.63, color: "bg-white" },
  { id: "f4", name: "F4", type: "snare", frequency: 349.23, color: "bg-white" },
  { id: "fs4", name: "F#4", type: "hihat", frequency: 369.99, color: "bg-black" },
  { id: "g4", name: "G4", type: "clap", frequency: 392.00, color: "bg-white" },
  { id: "gs4", name: "G#4", type: "tom", frequency: 415.30, color: "bg-black" },
  { id: "a4", name: "A4", type: "cymbal", frequency: 440.00, color: "bg-white" },
  { id: "as4", name: "A#4", type: "cowbell", frequency: 466.16, color: "bg-black" },
  { id: "b4", name: "B4", type: "rim", frequency: 493.88, color: "bg-white" },
  
  // Octave 5
  { id: "c5", name: "C5", type: "kick", frequency: 523.25, color: "bg-white" },
  { id: "cs5", name: "C#5", type: "snare", frequency: 554.37, color: "bg-black" },
  { id: "d5", name: "D5", type: "hihat", frequency: 587.33, color: "bg-white" },
  { id: "ds5", name: "D#5", type: "clap", frequency: 622.25, color: "bg-black" },
  { id: "e5", name: "E5", type: "tom", frequency: 659.25, color: "bg-white" },
  { id: "f5", name: "F5", type: "cymbal", frequency: 698.46, color: "bg-white" },
  { id: "fs5", name: "F#5", type: "cowbell", frequency: 739.99, color: "bg-black" },
  { id: "g5", name: "G5", type: "rim", frequency: 783.99, color: "bg-white" },
  { id: "gs5", name: "G#5", type: "kick", frequency: 830.61, color: "bg-black" },
  { id: "a5", name: "A5", type: "snare", frequency: 880.00, color: "bg-white" },
  { id: "as5", name: "A#5", type: "hihat", frequency: 932.33, color: "bg-black" },
  { id: "b5", name: "B5", type: "clap", frequency: 987.77, color: "bg-white" }
];
