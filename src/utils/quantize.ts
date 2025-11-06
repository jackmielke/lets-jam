import { RecordedNote } from "@/types/recording";
import { LickNote } from "@/types/lick";

/**
 * Quantize recorded notes to nearest 16th note subdivision
 */
export const quantizeRecording = (notes: RecordedNote[]): LickNote[] => {
  if (notes.length === 0) return [];

  return notes.map(note => {
    // Round subdivision to nearest 16th (0, 0.25, 0.5, 0.75)
    const sixteenths = [0, 0.25, 0.5, 0.75];
    let nearestSubdivision = 0;
    let minDiff = Infinity;

    sixteenths.forEach(sixteenth => {
      const diff = Math.abs(note.subdivision - sixteenth);
      if (diff < minDiff) {
        minDiff = diff;
        nearestSubdivision = sixteenth;
      }
    });

    return {
      soundId: note.soundId,
      noteName: note.noteName,
      beatNumber: note.beatNumber,
      subdivision: nearestSubdivision
    };
  });
};
