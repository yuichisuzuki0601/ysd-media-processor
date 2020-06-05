import EffectBox from './_EffectBox.js';

export default class DelayBox extends EffectBox {

	constructor(context, integrateNode) {
		super(context);
		
		this.delayNode = null;
		this.feedbackNode = null;

		// init
		this.delayNode = context.createDelay(5);
		this.feedbackNode = context.createGain();

		// setting
		this.delayNode.delayTime.value = 0.05;
		this.feedbackNode.gain.value = 0.5;

		// wiring
		this.inputNode.connect(this.delayNode).connect(this.outputNode);
		this.delayNode.connect(this.feedbackNode).connect(this.delayNode);
	}

	getDelayTime() {
		return Math.round(this.delayNode.delayTime.value * 1000);
	}

	setDelayTime(ms) {
		this.delayNode.delayTime.value = Number(ms) / 1000;
	}

	getFeedback() {
		return Math.round(this.feedbackNode.gain.value * 10);
	}

	setFeedback(level) {
		this.feedbackNode.gain.value = Number(level) / 10;
	}

}