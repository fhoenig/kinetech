// 
//  viech-controller-simplerandom.js
//  trees
//  
//  Created by Florian Hoenig on 2012-02-02.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 


// 
// SimpleRandom Controller
// 
// Sets joint motor speeds via a simple gaussian random number generator
// 
ActorControllers.Viech.SimpleRandom = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "SimpleRandom";
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;
		
		for (var jn in v.joints) {
			if (Math.random() > 0.9) {
				v.joints[jn].EnableMotor(false);
			} else {
				v.joints[jn].EnableMotor(true);
				v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));
				var s = v.joints[jn].GetMotorSpeed();
				var range = Math.abs(v.jointAngularLimits[jn][0] - v.jointAngularLimits[jn][1]);
				v.joints[jn].SetMotorSpeed(s+XMath.randomGauss()/range*30);
			}
		}
	}
});

