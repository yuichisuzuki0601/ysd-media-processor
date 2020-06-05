import EffectBox from './_EffectBox.js';
import room from './impulse-responses/room.js';
import hall from './impulse-responses/hall.js';

// @see https://rainbowsound.cafe/2018/11/21/reverb-ir-summary/
// @see https://www.voxengo.com/impulses/
export default class ConvolverReverbBox extends EffectBox {

	constructor(context, integrateNode) {
		super(context);

		this.irBuffer = null;
		this.convolverNode = null;

		this.reverbTypes = { room, hall };
		this._setReverbType = (type) => {
			const byteString = atob(this.reverbTypes[type].split(',')[1]);
			const ab = new ArrayBuffer(byteString.length);
			const ia = new Uint8Array(ab);
			for (let i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
			this.context.decodeAudioData(ab, (irBuffer) => this.convolverNode.buffer = irBuffer);
		};

		// init
		this.context = context;
		this.convolverNode = context.createConvolver();

		// setting
		this.reverbType = 'room';
		this._setReverbType(this.reverbType);

		// wiring
		this.inputNode.connect(this.convolverNode).connect(this.outputNode).connect(integrateNode);
	}

	getReverbTypes() {
		return Object.keys(this.reverbTypes);
	}

	getReverbType() {
		return this.reverbType;
	}

	setReverbType(type) {
		if (!this.getReverbTypes().includes(type)) {
			throw 'No shch types.';
		}
		this._setReverbType(type);
	}

	getOutputGain() {
		return Math.round(this.outputNode.gain.value * 10);
	}

	setOutputGain(level) {
		this.outputNode.gain.value = Number(level) / 10;
	}

}