// @see https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/
export default class BufferToWaveEncoder {

	static encode(audioBuffer) {
		const numberOfChannels = audioBuffer.numberOfChannels;
		const sampleRate = audioBuffer.sampleRate;

		// for Safari (Safari is not support offlineAudioContext.length)
		const length = 44 + Math.ceil(audioBuffer.duration * sampleRate) * numberOfChannels * 2;
		const buffer = new ArrayBuffer(length);
		const view = new DataView(buffer);

		let pos = 0;

		const setUint16 = (data) => {
			view.setUint16(pos, data, true);
			pos += 2;
		}

		const setUint32 = (data) => {
			view.setUint32(pos, data, true);
			pos += 4;
		}

		// write WAVE header
		setUint32(0x46464952); // "RIFF"
		setUint32(length - 8); // file length - 8
		setUint32(0x45564157); // "WAVE"

		setUint32(0x20746d66); // "fmt " chunk
		setUint32(16); // length = 16
		setUint16(1); // PCM (uncompressed)
		setUint16(numberOfChannels);
		setUint32(sampleRate);
		setUint32(sampleRate * 2 * numberOfChannels); // avg. bytes/sec
		setUint16(numberOfChannels * 2); // block-align
		setUint16(16); // 16-bit (hardcoded in this demo)

		setUint32(0x61746164); // "data" - chunk
		setUint32(length - pos - 4); // chunk length

		const channels = [];
		for (let i = 0; i < numberOfChannels; i++) {
			channels.push(audioBuffer.getChannelData(i));
		}

		let offset = 0;
		while (pos < length) {
			for (let i = 0; i < numberOfChannels; i++) {
				let sample = Math.max(-1, Math.min(1, channels[i][offset]));
				sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
				view.setInt16(pos, sample, true);
				pos += 2;
			}
			offset++;
		}

		// cut final zero area
		let notZeroPos = 0;
		for (let i = view.byteLength - 2; i >= 0; i -= 2) {
			if (view.getInt16(i) !== 0x00) {
				notZeroPos = i;
				break;
			}
		}
		const newBuffer = buffer.slice(0, notZeroPos);

		// create Blob
		return new Blob([newBuffer], { type: 'audio/wav' });
	}

}