import EffectBox from './_EffectBox.js';

// @see http://www.ari-web.com/service/soft/reverb-2.htm
export default class SchroederReverbBox extends EffectBox {

	constructor(context) {
		super(context);

		// init
		var middleNode1 = context.createGain();
		var middleNode2 = context.createGain();

		// setting
		this.inputNode.gain.value = 0.25;
		this.outputNode.gain.value = 0.2;

		// make comb filter
		var combDelayTimeList = [0.03985, 0.03610, 0.03327, 0.03015];
		var combFeedbackList = [0.871402, 0.882762, 0.891443, 0.901117];
		var combDelayNodes = [];
		var combFeedbackNodes = [];
		for (var i = 0; i < 4; i++) {
			combDelayNodes[i] = context.createDelay();
			combDelayNodes[i].delayTime.value = combDelayTimeList[i];
			combFeedbackNodes[i] = context.createGain();
			combFeedbackNodes[i].gain.value = combFeedbackList[i];
		}
		// wiring comb filter nodes
		for (var i = 0; i < 4; i++) {
			this.inputNode.connect(combDelayNodes[i]).connect(middleNode1);
			combDelayNodes[i].connect(combFeedbackNodes[i]).connect(combDelayNodes[i]);
		}

		// make all pass filter
		var apfDelayTimeList = [0.005, 0.0017];
		var apfFeedForwardAndBackList = [0.35, 0.35];
		var apfDelayNodes = [];
		var apfFeedforwardNodes = [];
		var apfFeedbackNodes = [];
		for (var i = 0; i < 2; i++) {
			apfDelayNodes[i] = context.createDelay();
			apfDelayNodes[i].delayTime.value = apfDelayTimeList[i];
			apfFeedforwardNodes[i] = context.createGain();
			apfFeedforwardNodes[i].gain.value = apfFeedForwardAndBackList[i];
			apfFeedbackNodes[i] = context.createGain();
			apfFeedbackNodes[i].gain.value = apfFeedForwardAndBackList[i];
		}
		// wiring all pass filter
		middleNode1.connect(apfDelayNodes[0]).connect(middleNode2);
		middleNode1.connect(apfFeedforwardNodes[0]).connect(middleNode2);
		apfDelayNodes[0].connect(apfFeedbackNodes[0]).connect(middleNode1);
		middleNode2.connect(apfDelayNodes[1]).connect(this.outputNode);
		middleNode2.connect(apfFeedforwardNodes[1]).connect(this.outputNode);
		apfDelayNodes[1].connect(apfFeedbackNodes[1]).connect(middleNode2);
	}

	getOutputGain() {
		return Math.round(this.outputNode.gain.value * 10);
	}

	setOutputGain(level) {
		this.outputNode.gain.value = Number(level) / 10;
	}

}