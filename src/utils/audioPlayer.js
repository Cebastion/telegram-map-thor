export const playAudio = (fileUrl) => {
  if (!fileUrl) return;

  const audio = new Audio(fileUrl);
  audio.play().catch((error) => {
    console.error('Error playing audio:', error);
  });
};
