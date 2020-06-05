export default /* abstract */ class EffectBox {
	
	constructor(context) {
		this.enabled = false;
		this.inputNode = null;
		this.outputNode = null;

		// init
		this.inputNode = context.createGain();
		this.outputNode = context.createGain();

		// setting
		this.inputNode.gain.value = 1;
		this.outputNode.gain.value = 1;
	}

	isOn() {
		return this.enabled;
	}

	// private
	_connect(source) {
		if (source) {
			source.connect(this.inputNode);
			// safari対応
			this.inputNode.gain.value = 1;
		}
		this.enabled = true;
	}

	// private
	_disconnect(source) {
		if (source) {
			// safari対応
			// source.disconnect(this.inputNode);
			this.inputNode.gain.value = 0;
		}
		this.enabled = false;
	}

	supplySource(source) {
		if (this.isOn()) {
			this._connect.bind(this)(source);
		}
	}

	toggle(source) {
		(!this.enabled ? this._connect : this._disconnect).bind(this)(source);
	}

}