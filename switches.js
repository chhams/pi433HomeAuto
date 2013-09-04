var childProcess = require('child_process'); 

/**
 * Switches 'class'
 */
var Switches = function() {
	
	this.masks = {
		one: '0FFF',
		two: 'F0FF',
		three: 'FF0F',
		four: 'FFF0',
		padding: 'FF',
		on: '0FS',		// If these don't work, try FFS (on) and F0S
		off: '00S'
	};
	
	// Put into a nice array
	this.maskIndexes = [{},this.masks.one, this.masks.two, this.masks.three, this.masks.four];
	
};

/**
 * Request to set a switch state
 */
Switches.prototype.switchState = function(group, id, state) {
	var self = this;
	var onoff = this.masks.off;
	if (state == 1) {
		onoff = this.masks.on;
	}
	
	var states = [];
	if (id < 1) {
		// do all switches
		for(var i=1;i<5;i++) {
			states.push(this.maskIndexes[group] + this.maskIndexes[i] + this.masks.padding + onoff);
		}
	} else {
		states.push(this.maskIndexes[group] + this.maskIndexes[id] + this.masks.padding + onoff);
		
	}
	states.forEach(function(s){
		self.execSwitch(s);
	});
	
};

/**
 * Request to turn a switch on
 */
Switches.prototype.switchOn = function(group, id) {
	this.switchState(group, id, 1);
};

/**
 * Request to turn a switch off
 */
Switches.prototype.switchOff = function(group, id) {
	this.switchState(group, id, 0);
};

/**
* Exec a process for tristate.
*/
Switches.prototype.execSwitch = function(state) {
	var child = childProcess.exec('sudo /home/pi/sdk/rcswitch-pi/sendTriState ' + state,  
		function (error, stdout, stderr) {
			if (error !== null) {
			  process.send({body:'Error execing sendTristate: ' + error});
			}
		}
	);
};

/**
 * Log out to the console
 */
Switches.prototype.log = function(message) {
	console.log('Switches-' + (new Date()).toISOString() + ': ' + message);
};

/**
 * Message received from parent.
 */
Switches.prototype.onMessage = function(message) {
	if (message.g && message.st && (message.s >= 0 && message.s <= 4)) {
		if (message.st == 1) {
			this.switchOn(message.g, message.s);
		} else {
			this.switchOff(message.g, message.s);
		}
	}
};

var s = new Switches();
process.on('message', function(message) {
	// Have to call using scope as "this" is broken by node event emitters.
	s.onMessage.call(s, message);
});
