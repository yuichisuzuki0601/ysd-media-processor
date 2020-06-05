import VolumeBox from './controllers/VolumeBox.js';
import DelayBox from './effectors/DelayBox.js';
import ConvolverReverbBox from './effectors/ConvolverReverbBox.js';
import SchroederReverbBox from './effectors/SchroederReverbBox.js';

export default class YsdMediaProcessor {

	constructor() {
		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
		} catch (e) {
			alert('Web Audio API is not supported in this browser.');
		}
		this.context = new AudioContext();
		this.audioBuffer = null;
		this.masterNode = null;
		this.integrateNode = this.context.createGain();

		this.started = false;
		this.playTime = 0;
		this.playTimerId = null;
		this.onPlayTimeIncrementedCallback = () => { return; };

		this.waveDrawingModes = ['timeDomain', 'frequency'];
		this.waveDrawingMode = this.waveDrawingModes[0];
		this.waveDrawingTargetQuery = null;
		this.waveDrawingTimerId = null;

		this.onRecordingFinishedCallback = () => { return; };

		this.volumeBox = new VolumeBox(this.context, () => this.started);
		this.delayBox = new DelayBox(this.context, this.integrateNode);
		this.convolverReverbBox = new ConvolverReverbBox(this.context, this.integrateNode);
		this.schroederReverbBox = new SchroederReverbBox(this.context, this.integrateNode);
	}

	setArrayBuffer(arrayBuffer) {
		return new Promise((resolve, _) => {
			this.context.decodeAudioData(arrayBuffer, (audioBuffer) => {
				this.audioBuffer = audioBuffer;
				resolve();
			});
		});
	}

	setAudioFile(file) {
		return new Promise((resolve, _) => {
			var fileReader = new FileReader();
			fileReader.onload = () => this.setArrayBuffer(fileReader.result).then(resolve);
			fileReader.readAsArrayBuffer(file);
		});
	}

	getVolumeBox() {
		return this.volumeBox;
	}

	getDelayBox() {
		return this.delayBox;
	}

	getConvolverReverbBox() {
		return this.convolverReverbBox;
	}

	getSchroederReverbBox() {
		return this.schroederReverbBox;
	}

	toggleFadeIn() {
		this.volumeBox.toggleFadeIn();
	}

	toggleFadeOut() {
		this.volumeBox.toggleFadeOut();
	}

	toggleCut() {
		this.volumeBox.toggleCut();
	}

	toggleDelay() {
		this.delayBox.toggle(this.masterNode);
	}

	toggleConvolverReverb() {
		this.convolverReverbBox.toggle(this.masterNode);
	}

	toggleSchroederReverb() {
		this.schroederReverbBox.toggle(this.masterNode);
	}

	setOnPlayTimeIncrementedCallback(callback) {
		this.onPlayTimeIncrementedCallback = callback;
	}

	setOnEndedCallback(callback) {
		var current = this.source.onended;
		this.source.onended = () => {
			current();
			callback(this.playTime);
		};
	}

	setWaveDrawingTarget(waveDrawingTargetQuery) {
		this.waveDrawingTargetQuery = waveDrawingTargetQuery;
	}

	getWaveDrawingModes() {
		return this.waveDrawingModes;
	}

	getWaveDrawingMode() {
		return this.waveDrawingMode;
	}

	setWaveDrawingMode(mode) {
		if (!this.getWaveDrawingModes().includes(mode)) {
			throw 'No shch modes.';
		}
		this.waveDrawingMode = mode;
	}

	setOnRecordingFinishedCallback(callback) {
		this.onRecordingFinishedCallback = callback;
	}

	start() {
		this.source = this.context.createBufferSource();
		this.source.buffer = this.audioBuffer;

		this.masterNode = this.context.createGain();
		this.masterNode.gain.cancelScheduledValues(this.context.currentTime);

		this.volumeBox.scheduleFadeIn(this.masterNode);
		this.volumeBox.scheduleFadeOut(this.masterNode);
		this.volumeBox.scheduleCut(this.masterNode);

		this.delayBox.supplySource(this.masterNode);
		this.convolverReverbBox.supplySource(this.masterNode);
		this.schroederReverbBox.supplySource(this.masterNode);

		const analyserNode = new AnalyserNode(this.context);
		const recorderDestination = this.context.createMediaStreamDestination();
		const mediaRecorder = new MediaRecorder(recorderDestination.stream);
		mediaRecorder.ondataavailable = (e) => {
			if (this.onRecordingFinishedCallback) {
				this.onRecordingFinishedCallback(URL.createObjectURL(e.data));
			}
		}

		this.source.connect(this.masterNode).connect(this.integrateNode).connect(analyserNode);
		analyserNode.connect(recorderDestination);
		analyserNode.connect(this.context.destination);

		// this.source.loop = true;
		this.source.start();
		mediaRecorder.start();

		this.playTimerId = setInterval(() => {
			this.playTime++;
			if (this.onPlayTimeIncrementedCallback) {
				this.onPlayTimeIncrementedCallback(this.playTime);
			}
		}, 1000);

		this.waveDrawingTimerId = setInterval(() => {
			const width = 512;
			const height = 256;
			const element = document.querySelector(this.waveDrawingTargetQuery);
			if (element) {
				element.width = width;
				element.height = height;
				const canvasContext = element.getContext('2d');
				const analyseData = new Uint8Array(1024);
				if (this.waveDrawingMode === 'timeDomain') {
					analyserNode.getByteTimeDomainData(analyseData);
				} else {
					analyserNode.getByteFrequencyData(analyseData);
				}
				canvasContext.fillStyle = '#000';
				canvasContext.fillRect(0, 0, width, height);
				canvasContext.fillStyle = '#0F0';
				for (let i = 0; i < width; ++i) {
					const y = analyseData[i];
					canvasContext.fillRect(i, height - y, 1, y);
				}
			}
		}, 30);

		this.source.onended = () => {
			mediaRecorder.stop();
			clearInterval(this.playTimerId);
			clearInterval(this.waveDrawingTimerId);
			this.playTime = 0;
			this.started = false;
		};

		this.started = true;
	}

	stop() {
		this.source.stop();
	}

}