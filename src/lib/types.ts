
export type SessionRecord = {
  id: string;
  date: string;
  mode: 'normal' | 'precision' | 'speed';
  totalDuration: number; // in seconds
  imagesCompleted: number;
};
