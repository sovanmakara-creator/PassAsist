class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Use the global sampleRate of the context with a safe fallback to prevent ReferenceError
    this.sourceSampleRate = typeof sampleRate !== "undefined" ? sampleRate : 48000;
    this.targetSampleRate = 16000;
    this.conversionRatio = this.sourceSampleRate / this.targetSampleRate;
    this.inputSampleIndex = 0;
    this.buffer = new Int16Array(2048);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];
    const ratio = this.conversionRatio;

    // Perform linear interpolation downsampling
    while (this.inputSampleIndex < channel.length) {
      const index = Math.floor(this.inputSampleIndex);
      const nextIndex = Math.min(index + 1, channel.length - 1);
      const weight = this.inputSampleIndex - index;

      const sample = channel[index] * (1 - weight) + channel[nextIndex] * weight;

      // Clamp and convert to 16-bit PCM (little-endian)
      const clamped = Math.max(-1, Math.min(1, sample));
      const pcmSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

      this.buffer[this.bufferIndex++] = pcmSample;

      if (this.bufferIndex >= this.buffer.length) {
        this.port.postMessage(this.buffer.slice(0).buffer);
        this.bufferIndex = 0;
      }

      this.inputSampleIndex += ratio;
    }

    // Offset the fractional index for the next block
    this.inputSampleIndex -= channel.length;
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
