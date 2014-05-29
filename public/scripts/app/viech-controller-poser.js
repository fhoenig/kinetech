// 
//  viech-controller-poser.js
//  trees
//  
//  Created by Florian Hoenig on 2012-02-02.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 


var ViechPoses = {
	ragdoll: {
		title: "Ragdoll", 
		speed: 1.0,		
		targetAngles: {
			torsoL__torsoM	: false,
			torsoL__legU1	: false,
			torsoL__legU2	: false,
			legU1__legL1	: false,
			legU2__legL2	: false,
			legL1__foot1	: false,
			legL2__foot2	: false,
			torsoM__torsoU	: false,
			torsoU__head 	: false,
			torsoU__armU1 	: false,
			torsoU__armU2	: false,
			armU1__armL1	: false,
			armU2__armL2	: false,
			armL1__hand1	: false,
			armL2__hand2	: false
		}
	},
	board: {
		title: "Stiff Board",
		speed: 1.0,
		targetAngles: {
			torsoL__torsoM	: 0,
			torsoL__legU1	: 0,
			torsoL__legU2	: 0,
			legU1__legL1	: 0,
			legU2__legL2	: 0,
			legL1__foot1	: 0,
			legL2__foot2	: 0,
			torsoM__torsoU	: 0,
			torsoU__head 	: 0,
			torsoU__armU1 	: 90,
			torsoU__armU2	: 90,
			armU1__armL1	: 0,
			armU2__armL2	: 0,
			armL1__hand1	: 0,
			armL2__hand2	: 0
		}
		
	},
	weird: {
		title: "Weird Pose", 
		speed: 1.0,
		targetAngles: {
			torsoL__torsoM	: 5,
			torsoL__legU1	: 0,
			torsoL__legU2	: 0,
			legU1__legL1	: 20,
			legU2__legL2	: 20,
			legL1__foot1	: -10,
			legL2__foot2	: -10,
			torsoM__torsoU	: 15,
			torsoU__head 	: 15,
			torsoU__armU1 	: 145,
			torsoU__armU2	: 23,
			armU1__armL1	: -30,
			armU2__armL2	: -30,
			armL1__hand1	: 0,
			armL2__hand2	: 0
		}
	},
	stand1: {
		title: "Standing Pose I", 
		speed: 1.0,	
		targetAngles: {
			torsoL__torsoM	: -15,
			torsoL__legU1	: -60,
			torsoL__legU2	: -60,
			legU1__legL1	: 50,
			legU2__legL2	: 50,
			legL1__foot1	: -20,
			legL2__foot2	: -20,
			torsoM__torsoU	: -15,
			torsoU__head 	: 0,
			torsoU__armU1 	: false,
			torsoU__armU2	: false,
			armU1__armL1	: false,
			armU2__armL2	: false,
			armL1__hand1	: false,
			armL2__hand2	: false
		}
	},
	stand2: {
		title: "Standing Pose II", 
		speed: 1.0,		
		targetAngles: {
			torsoL__torsoM	: 5,
			torsoL__legU1	: 10,
			torsoL__legU2	: 10,
			legU1__legL1	: 10,
			legU2__legL2	: 10,
			legL1__foot1	: -10,
			legL2__foot2	: -10,
			torsoM__torsoU	: 0,
			torsoU__head 	: 0,
			torsoU__armU1 	: false,
			torsoU__armU2	: false,
			armU1__armL1	: false,
			armU2__armL2	: false,
			armL1__hand1	: false,
			armL2__hand2	: false
		}
	},
	pullup: {
		title: "Pullup", 
		speed: 1.0,
		targetAngles: {
			torsoL__torsoM	: -15,
			torsoL__legU1	: -120,
			torsoL__legU2	: -120,
			legU1__legL1	: false,
			legU2__legL2	: false,
			legL1__foot1	: false,
			legL2__foot2	: false,
			torsoM__torsoU	: -20,
			torsoU__head 	: 0,
			torsoU__armU1 	: 0,
			torsoU__armU2	: 0,
			armU1__armL1	: -170,
			armU2__armL2	: -170,
			armL1__hand1	: 0,
			armL2__hand2	: 0
		}
	},
	situp: {
		title: "Situp",
		speed: 1.0, 
		targetAngles: {
			torsoL__torsoM	: 15,
			torsoL__legU1	: false,
			torsoL__legU2	: false,
			legU1__legL1	: 0,
			legU2__legL2	: 0,
			legL1__foot1	: 0,
			legL2__foot2	: 0,
			torsoM__torsoU	: 25,
			torsoU__head 	: 55,
			torsoU__armU1 	: false,
			torsoU__armU2	: false,
			armU1__armL1	: false,
			armU2__armL2	: false,
			armL1__hand1	: false,
			armL2__hand2	: false
		}
	},
	situp2: {
		title: "Situp2",
		speed: 0.1,
		targetAngles: {
			torsoL__torsoM	: 15,
			torsoL__legU1	: -100,
			torsoL__legU2	: -100,
			legU1__legL1	: 0,
			legU2__legL2	: 0,
			legL1__foot1	: 0,
			legL2__foot2	: 0,
			torsoM__torsoU	: 25,
			torsoU__head 	: 55,
			torsoU__armU1 	: false,
			torsoU__armU2	: false,
			armU1__armL1	: false,
			armU2__armL2	: false,
			armL1__hand1	: false,
			armL2__hand2	: false
		}
	}
	
};



//
// Poser Controller
//
// Uses joint maxtorques and joint motors to hold various
// poses listed in a table
//
ActorControllers.Viech.Poser = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Poser";
		this.currentPose = "ragdoll";
		this.currentPoseDef = ViechPoses[this.currentPose];
	},
	
	availablePoses: function() {
		var list = {};
		for (var s in ViechPoses) {
			list[s] = ViechPoses[s].title;
		}
		return list;
	},
	
	setPoseDef: function(poseDef) {
		this.currentPoseDef = poseDef;
		var v = this._actor;
		for (var jointName in poseDef.targetAngles) {
			var ta = poseDef.targetAngles[jointName];
			if (typeof ta == "boolean" && ta == false) {
				// joint "friction" motor
				// v.joints[jointName].SetMaxMotorTorque(0.5);
				v.joints[jointName].EnableMotor(false);
			} else {
				// active muscle motor
				v.joints[jointName].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jointName));
				v.joints[jointName].EnableMotor(true);
			}
		}
	},
	
	setPose: function(pose) {
		// alias
		var v = this._actor;
		this.currentPose = pose;
		var poseDef = ViechPoses[this.currentPose];
		this.setPoseDef(poseDef);
	},
	
	getPose: function() {
		return this.currentPose;
	},
	
	update: function(deltaTime, timestamp) {
		this._super(deltaTime, timestamp);
		// alias
		var v = this._actor;
		var poseDef = this.currentPoseDef;
		
		for (var jointName in poseDef.targetAngles) {
			var ta = poseDef.targetAngles[jointName];
			if (typeof ta == "boolean" && ta == false) {
				// update "stiffness motor"
				/*
				var error = v.joints[jointName].GetJointAngle() - XMath.deg2rad(v.jointAngularCenters[jointName]);
		
				if (Math.abs(error) > 0.01)
					v.joints[jointName].SetMotorSpeed(-10 * error);
				else
					v.joints[jointName].SetMotorSpeed(0);
				*/
					
			} else {
				// go towards target angle
				v.joints[jointName].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jointName));
				var error = v.joints[jointName].GetJointAngle() - XMath.deg2rad(ta);
				v.joints[jointName].EnableMotor(true);
				if (Math.abs(error) > 0.01)
					v.joints[jointName].SetMotorSpeed(-10 * poseDef.speed * error);  // deg/s * degE
				else if (Math.abs(v.joints[jointName].m_motorImpulse) < 0.001) 
					v.joints[jointName].EnableMotor(false);
				else
					v.joints[jointName].SetMotorSpeed(0);
			}
			
		}
	}
	
});