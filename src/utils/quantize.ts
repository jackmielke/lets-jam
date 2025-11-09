import { RecordedNote } from "@/types/recording";
import { LickNote } from "@/types/lick";

/**
 * Quantize recorded notes based on timing type
 * Straight: 16th note subdivisions (0, 0.25, 0.5, 0.75)
 * Swing: Triplet subdivisions (0, 0.333, 0.667)
 */
export const quantizeRecording = (
  notes: RecordedNote[], 
  timingType: 'straight' | 'swing' = 'straight'
): LickNote[] => {
  if (notes.length === 0) return [];

  // Define subdivision targets based on timing type
  const subdivisions = timingType === 'straight' 
    ? [0, 0.25, 0.5, 0.75]  // 16th notes
    : [0, 0.333, 0.667];     // Triplets

  return notes.map(note => {
    // Round subdivision to nearest target subdivision
    let nearestSubdivision = 0;
    let minDiff = Infinity;

    subdivisions.forEach(target => {
      const diff = Math.abs(note.subdivision - target);
      if (diff < minDiff) {
        minDiff = diff;
        nearestSubdivision = target;
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
