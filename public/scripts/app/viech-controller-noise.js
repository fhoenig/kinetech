// 
// Perlin Noise Controller
// 
// Sets joint motor speeds via perlin noise
// 
ActorControllers.Viech.Noise = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Noise";
		this._nf = new SimplexNoise();
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;
		var i = 0;
		for (var jointName in v.joints) {
		    var fatiguedTorque = v.getFatiguedMuscleTorque(jointName);
		    var fatigue = v.muscleFatigue[jointName];
            if (Math.random() < fatigue) {
                v.joints[jointName].EnableMotor(false);    
            } else {
                v.joints[jointName].EnableMotor(true);    
            }
			
			v.joints[jointName].SetMaxMotorTorque(fatiguedTorque);

			// var s = v.joints[jointName].GetMotorSpeed();
			var range = Math.abs(v.jointAngularLimits[jointName][0] - v.jointAngularLimits[jointName][1]);

			var jcn = this._nf.noise((ts-this.getStartTime())/5, i) + 
			          this._nf.noise(i, (ts-this.getStartTime())/0.5) + 
			          this._nf.noise((ts-this.getStartTime())/0.05, i)/10;

			v.joints[jointName].SetMotorSpeed( jcn * range/60);
			i++;
		}
	}
});
