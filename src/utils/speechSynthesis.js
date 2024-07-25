export const speak = (text) => {
  const speech = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(speech);
};