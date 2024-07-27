const PlayAudioWithRetry = (audioRef, url, retries = 5, timeout) => {
  const playAttempt = () => {
    audioRef.current.src = url
    audioRef.current.play().catch(error => {
      console.error('Audio playback failed:', error)
      if (retries > 0) {
        setTimeout(() => PlayAudioWithRetry(audioRef, url, retries - 1), timeout)
      }
    })
  }
  playAttempt()
}

export { PlayAudioWithRetry }