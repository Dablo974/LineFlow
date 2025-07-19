
export type SessionRecord = {
  id: string;
  date: string;
  mode: 'normal' | 'precision' | 'speed' | 'shapes' | 'poses' | 'zen' | 'anatomy';
  totalDuration: number; // in seconds
  imagesCompleted: number;
  imageSet: 'custom' | 'ai';
};

export interface GenerateShapeInput {
  description: string;
}

export interface GenerateShapeOutput {
  imageDataUri: string;
}
