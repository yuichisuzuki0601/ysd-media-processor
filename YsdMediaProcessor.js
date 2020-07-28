import VolumeBox from './controllers/VolumeBox.js';
import DelayBox from './effectors/DelayBox.js';
import ConvolverReverbBox from './effectors/ConvolverReverbBox.js';
import SchroederReverbBox from './effectors/SchroederReverbBox.js';

import BufferToWaveEncoder from './encoders/BufferToWaveEncoder.js';

export default class YsdMediaProcessor {

	constructor() {
		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
		} catch (e) {
			throw 'Web Audio API is not supported in this browser.';
		}
		this.context = new AudioContext();
		this.audioBuffer = null;
		this.masterNode = null;
		this.integrateNode = null;

		this.originalFileName = 'no-name.';
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
		this.delayBox = new DelayBox(this.context);
		this.convolverReverbBox = new ConvolverReverbBox(this.context);
		this.schroederReverbBox = new SchroederReverbBox(this.context);
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
			fileReader.onload = () => this.setArrayBuffer(fileReader.result).then(() => {
				this.originalFileName = file.name;
				resolve();
			});
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
		this.delayBox.toggle(this.masterNode, this.integrateNode);
	}

	toggleConvolverReverb() {
		this.convolverReverbBox.toggle(this.masterNode, this.integrateNode);
	}

	toggleSchroederReverb() {
		this.schroederReverbBox.toggle(this.masterNode, this.integrateNode);
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
		this.integrateNode = this.context.createGain();

		this.masterNode.gain.cancelScheduledValues(this.context.currentTime);
		this.volumeBox.scheduleFadeIn(this.masterNode);
		this.volumeBox.scheduleFadeOut(this.masterNode);
		this.volumeBox.scheduleCut(this.masterNode);

		this.delayBox.supplySource(this.masterNode, this.integrateNode);
		this.convolverReverbBox.supplySource(this.masterNode, this.integrateNode);
		this.schroederReverbBox.supplySource(this.masterNode, this.integrateNode);

		const analyserNode = this.context.createAnalyser();
		this.source.connect(this.masterNode).connect(this.integrateNode).connect(analyserNode);
		analyserNode.connect(this.context.destination);

		let mediaRecorder = null;
		if (window.MediaRecorder) {
			const recorderDestination = this.context.createMediaStreamDestination();
			mediaRecorder = new MediaRecorder(recorderDestination.stream);
			mediaRecorder.ondataavailable = (e) => {
				if (this.onRecordingFinishedCallback) {
					this.onRecordingFinishedCallback(URL.createObjectURL(e.data));
				}
			}
			analyserNode.connect(recorderDestination);
		}

		// this.source.loop = true;
		this.source.start();
		if (mediaRecorder) {
			mediaRecorder.start();
		}

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
			this.delayBox.resetSource(this.masterNode);
			this.convolverReverbBox.resetSource(this.masterNode);
			this.schroederReverbBox.resetSource(this.masterNode);
			if (mediaRecorder) {
				mediaRecorder.stop();
			}
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

	export() {
		return new Promise((resolve, reject) => {
			try {
				window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
			} catch (e) {
				throw 'OfflineAudioContext is not supported in this browser.';
			}

			const audioBuffer = this.audioBuffer;
			if (!audioBuffer) {
				console.error('Audio has not set yet.');
				reject();
			}

			const sampleRate = audioBuffer.sampleRate;
			const context = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.duration * sampleRate, sampleRate);
			const source = context.createBufferSource();
			source.buffer = audioBuffer;

			const masterNode = context.createGain();
			const integrateNode = context.createGain();

			const volumeBox = new VolumeBox(context, () => false);
			if (this.volumeBox.isOnFadeIn()) {
				volumeBox.setFadeInDuration(this.volumeBox.getFadeInDuration());
				volumeBox.toggleFadeIn();
			}
			if (this.volumeBox.isOnFadeOut()) {
				volumeBox.setFadeOutStartTime(this.volumeBox.getFadeOutStartTime());
				volumeBox.setFadeOutDuration(this.volumeBox.getFadeOutDuration());
				volumeBox.toggleFadeOut();
			}
			if (this.volumeBox.isOnCut()) {
				volumeBox.setCutStartTime(this.volumeBox.getCutStartTime());
				volumeBox.setCutEndTime(this.volumeBox.getCutEndTime());
				volumeBox.toggleCut();
			}
			volumeBox.scheduleFadeIn(masterNode);
			volumeBox.scheduleFadeOut(masterNode);
			volumeBox.scheduleCut(masterNode);

			if (this.delayBox.isOn()) {
				const delayBox = new DelayBox(context);
				delayBox.setDelayTime(this.delayBox.getDelayTime());
				delayBox.setFeedback(this.delayBox.getFeedback());
				delayBox.toggle(masterNode, integrateNode);
			}
			if (this.convolverReverbBox.isOn()) {
				const convolverReverbBox = new ConvolverReverbBox(context);
				convolverReverbBox.setReverbType(this.convolverReverbBox.getReverbType());
				convolverReverbBox.setOutputGain(this.convolverReverbBox.getOutputGain());
				convolverReverbBox.toggle(masterNode, integrateNode);
			}
			if (this.schroederReverbBox.isOn()) {
				const schroederReverbBox = new SchroederReverbBox(context);
				schroederReverbBox.setOutputGain(this.schroederReverbBox.getOutputGain());
				schroederReverbBox.toggle(masterNode, integrateNode);
			}

			source.connect(masterNode).connect(integrateNode).connect(context.destination);

			const renderStartTime = new Date().getTime();
			setTimeout(() => {
				source.start();
				context.startRendering();
				context.oncomplete = (e) => {
					const renderedBuffer = e.renderedBuffer;
					const anchor = document.createElement('a');
					anchor.href = URL.createObjectURL(BufferToWaveEncoder.encode(renderedBuffer));
					anchor.download = this.originalFileName.slice(0, this.originalFileName.lastIndexOf('.')) + '.mixed.wav';
					anchor.click();
					console.log('AudioRenderingTime: ' + (new Date().getTime() - renderStartTime) + '[ms]');
					resolve();
				};
			}, 100);
		});
	}

}