// 
//  viech-controller-track1.js
//  trees
//  
//  Created by Florian Hoenig on 2013-05-07.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 


// 
// Track1 Controller
// 
// Tracks kinect poser input
// 
ActorControllers.Viech.Track1 = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Track1";
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;

        
		for (var jn in v.joints) {

            // wait for both samples to initialize
            if (v.poseInput.prev == null || v.poseInput.curr == null) {
                v.joints[jn].EnableMotor(false);
                continue;
            }

            // get clamped angular velocity
            var is = Math.max(-360, Math.min(360, (v.poseInput.curr[jn] - v.poseInput.prev[jn]) / dt));

            // ingnore movement below 5 deg/s threshold
            if (Math.abs(is) < 1) {
                v.joints[jn].EnableMotor(false);
                continue;                
            }
            
		    
            // if (Math.random() > 0.9) {
            //  v.joints[jn].EnableMotor(false);
            // } else {
				v.joints[jn].EnableMotor(true);
				v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));
                // var s = v.joints[jn].GetMotorSpeed();
				
                // var range = Math.abs(v.jointAngularLimits[jn][0] - v.jointAngularLimits[jn][1]);
                // console.log(v.poseInput.prev);
                v.joints[jn].SetMotorSpeed(XMath.deg2rad(is*2));
            // }
		}
	}
});

