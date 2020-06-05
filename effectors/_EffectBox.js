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
	_connect(source, destination) {
		if (source && destination) {
			source.connect(this.inputNode);
			this.outputNode.connect(destination);
		}
		this.enabled = true;
	}

	supplySource(source, destination) {
		if (this.isOn()) {
			this._connect.bind(this)(source, destination);
		}
	}

	resetSource(source) {
		// If you call source.disconnect in Safari, it ignores the argument Node that you want to disconnect and disconnects all, so provisional support.

		// try {
		// 	if (source) {
		// 		source.disconnect(this.inputNode);
		// 	}
		// } catch {
		// }
		this.outputNode.disconnect();
	}

	// private
	_disconnect(source, _) {
		this.resetSource(source);
		this.enabled = false;
	}

	toggle(source, destination) {
		(!this.enabled ? this._connect : this._disconnect).bind(this)(source, destination);
	}

}