export function speakLoop(text) {
  if (!("speechSynthesis" in window)) return () => {}

  let cancelled = false

  const speakOnce = () => {
    if (cancelled) return

    window.speechSynthesis.cancel()
    window.speechSynthesis.resume?.()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onend = () => {
      if (!cancelled) setTimeout(speakOnce, 400)
    }

    utterance.onerror = () => {
      if (!cancelled) setTimeout(speakOnce, 800)
    }

    window.speechSynthesis.speak(utterance)
  }

  speakOnce()

  return () => {
    cancelled = true
    window.speechSynthesis.cancel()
  }
}
