export default class VolumeBox {

	constructor(context, isStarted) {
		this.context = context;
		this.isStarted = isStarted;
		this.onChangeErrorMessage = 'VolumeBox parameters cannot be changed during playback.';

		this.fadeInEnabled = false;
		this.fadeInDuration = 3;

		this.fadeOutEnabled = false;
		this.fadeOutStartTime = 10;
		this.fadeOutDuration = 3;

		this.cutEnabled = false;
		this.cutStartTime = 5;
		this.cutEndTime = 7;
	}

	isOnFadeIn() {
		return this.fadeInEnabled;
	}

	isOnFadeOut() {
		return this.fadeOutEnabled;
	}

	isOnCut() {
		return this.cutEnabled;
	}

	scheduleFadeIn(source) {
		if (this.fadeInEnabled) {
			source.gain.linearRampToValueAtTime(0, this.context.currentTime);
			source.gain.linearRampToValueAtTime(1, this.context.currentTime + this.fadeInDuration);
		}
	};

	scheduleFadeOut(source) {
		if (this.fadeOutEnabled) {
			setTimeout(() => {
				source.gain.setValueAtTime(1, this.context.currentTime);
				source.gain.linearRampToValueAtTime(0, this.context.currentTime + this.fadeOutDuration);
			}, this.fadeOutStartTime * 1000);
		}
	}

	scheduleCut(source) {
		if (this.cutEnabled) {
			source.gain.setValueAtTime(0, this.context.currentTime + this.cutStartTime);
			source.gain.setValueAtTime(1, this.context.currentTime + this.cutEndTime);
		}
	};

	toggleFadeIn() {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.fadeInEnabled = !this.fadeInEnabled;
	};

	toggleFadeOut() {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.fadeOutEnabled = !this.fadeOutEnabled;
	};

	toggleCut() {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.cutEnabled = !this.cutEnabled;
	};

	getFadeInDuration() {
		return this.fadeInDuration;
	};

	setFadeInDuration(sec) {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.fadeInDuration = sec;
	};

	getFadeOutStartTime() {
		return this.fadeOutStartTime;
	};

	setFadeOutStartTime(sec) {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.fadeOutStartTime = sec;
	};

	getFadeOutDuration() {
		return this.fadeOutDuration;
	};

	setFadeOutDuration(sec) {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.fadeOutDuration = sec;
	};

	getCutStartTime() {
		return this.cutStartTime;
	};

	setCutStartTime(sec) {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.cutStartTime = sec;
	};

	getCutEndTime() {
		return this.cutEndTime;
	};

	setCutEndTime(sec) {
		if (this.isStarted()) {
			throw this.onChangeErrorMessage;
		}
		this.cutEndTime = sec;
	};

};

