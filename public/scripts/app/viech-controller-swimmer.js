// 
//  viech-controller-simplerandom.js
//  trees
//  
//  Created by Florian Hoenig on 2012-02-02.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 

//window.two_bots = true;

// 
// SimpleRandom Controller
// 
// Sets joint motor speeds via a simple gaussian random number generator
// 
ActorControllers.Viech.Swimmer = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Swimmer";
		this.started = false;
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;
		for (var jn in v.joints) {
			
			var s = v.joints[jn].GetMotorSpeed();
			var a = v.joints[jn].GetJointAngle();
			var rate = 1;
			//console.log(s);
			//console.log("joint " + jn + " limit " + a);
			v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));	
			if (!this.started) {
				s = rate;
			} else if (a <= XMath.deg2rad(v.jointAngularLimits[jn][1]) + .1) {
				s = rate;
			} else if (a >= XMath.deg2rad(v.jointAngularLimits[jn][0]) - .1) {
				s = -rate;
			}// else if (s < .001 && s > -0.001) {
			//	s = 10; 
			//}
			v.joints[jn].EnableMotor(true);
			v.joints[jn].SetMotorSpeed(s);
		}
		this.started = true;
	}
});

