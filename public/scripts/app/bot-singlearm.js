// 
//  viech.js
//  trees
//  
//  Created by Florian Hoenig on 2012-01-25.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 

// Controller list for viech
ActorControllers.BotSinglearm = {};


// CLASS Viech
var BotSinglearm = Actor.extend({

	init: function(scene, initialX, initialY) {
		
		this._super("BotSinglearm", scene, initialX, initialY);

		// energy
		this.workDone = 0;

		// remember joints and bodies
		this.parts = {};
		this.joints = {};
		this.bones = {};
		this.partsTransforms = {};
		
		this.generate();
		this._initJointLimits();
		this._initMuscles();		
	},
	
	_initJointLimits: function() {
		this.jointAngularLimits = {
			foundation_arm1	: [90, -90],
		};
				
		// angular centers of joint ("held" by ligaments and muscle passive resistance)
		this.jointAngularCenters = {
			foundation_arm1	: 0
		};
				
		for (var jointName in this.jointAngularLimits) {
			this.joints[jointName].SetLimits(
				XMath.deg2rad(this.jointAngularLimits[jointName][1]),
				XMath.deg2rad(this.jointAngularLimits[jointName][0])
			);
		}
	},
	
	_initMuscles: function() {
		// rough approximate flexion and extension torques (symmetric)
		this.muscleMaxTorques = {
			foundation_arm1	: 200
		};
		
		// list of work (J) done by muscles
		this.muscleWork = {};
		// list of fatigue per muscle [0-1];
		this.muscleFatigue = {};
		// list of muscle efforts
		this.muscleEffort = {};		
		
		for (var jn in this.muscleMaxTorques) {
			this.muscleWork[jn] = 0.0;
			this.muscleFatigue[jn] = 0.0;
			this.muscleEffort[jn] = 0.0;
		}		
	},
	
	update: function(dt, ts) {
		// call parent update (controller)
		this._super(dt, ts);

		// update work done (Joule)
		for (var jn in this.joints) {

			if (this.joints[jn].IsMotorEnabled()) {
				// work for length of current timestep (dt)
				var work = Math.abs(this.joints[jn].m_motorImpulse);
				// total work per muscle
				this.muscleWork[jn] += work;
				// add up total work done
				this.workDone += work;
				
				// ratio of work to max torque: 0 means no effort, 1 means max effort
				var effort = work/dt/this.muscleMaxTorques[jn];
				this.muscleEffort[jn] = effort;
				// simulate fatigue
				if (effort > 0) {
					// this.muscleFatigue[jn] = Math.min(1.0, this.muscleFatigue[jn] + effort/180);
					this.muscleFatigue[jn] = Math.max(0, Math.min(1.0, this.muscleFatigue[jn] + Math.exp(4*effort)/Math.exp(7) - Math.exp(5) / Math.exp(11)));
				}
				else this.muscleFatigue[jn] *= 0.95;
			} else {
				// simulate regeneration
				this.muscleFatigue[jn] *= 0.95;
			}
		}
		
		this.joints.foundation_arm1.SetMaxMotorTorque(this.getFatiguedMuscleTorque('foundation_arm1'));
		this.joints.foundation_arm1.EnableMotor(true);
		this.joints.foundation_arm1.SetMotorSpeed(0);
		
	},
	
	getFatiguedMuscleTorque: function(jn) {
		// Temporarily disabled!!!
		return (1-this.muscleFatigue[jn]) * this.muscleMaxTorques[jn];
		// return this.muscleMaxTorques[jn];
	},
	
	getWorkDone: function() {
		return XMath.round(this.workDone, 2);
	},
	
	getTotalEffort: function() {
		var total = 0;
		for (var p in this.muscleEffort) {
			total += this.muscleEffort[p];
		}
		return total;
	},
	
	getTotalMass: function() {
		var total = 0;
		for (var p in this.parts) {
			total += this.parts[p].GetMass();
		}
		return total;
	},
	
	getTotalFatigue: function() {
		var sum=0; count=0;
		for (var i in this.muscleFatigue) {
			sum += this.muscleFatigue[i];
			count++;
		};
		return sum / count;
	},
	
	getPartsMassRatios: function() {
		var total = this.getTotalMass();
		var ratios = {};
		for (var p in this.parts) {
			ratios[p] = XMath.round(this.parts[p].GetMass() / total * 100, 2);
		}
		return ratios;
	},
	
	getJointAngles: function() {
		var angles = {};
		for (var jointName in this.joints) {
			angles[jointName] = XMath.round(XMath.rad2deg(this.joints[jointName].GetJointAngle()), 3);
		}
		return angles;
	},

	getMotorImpulses: function() {
		var torques = {};
		for (var jointName in this.joints) {
			torques[jointName] = XMath.round(this.joints[jointName].m_motorImpulse, 5);
		}
		return torques;
	},

	getMotorSpeeds: function() {
		var torques = {};
		for (var jointName in this.joints) {
			torques[jointName] = XMath.round(this.joints[jointName].m_motorSpeed, 5);
		}
		return torques;
	},


	generate: function() {

		// generate foundation
		var a = 1.5;
		var b = 0.1;
		var c = 0.1;

		var p1 = [-a/2, 0];
		var p4 = [a/2, 0];
		var p2 = [-a*0.8/2, -b];
		var p3 = [a*0.8/2, -b];
		
		this.parts.foundation = this._makePolyBody(0, 0, [p1, p2, p3, p4], 500.0, 1.0, 0.0);

		// generate first arm
		p1 = [-c*0.7/2, a/2];
		p4 = [c*0.7/2, a/2];
		p2 = [-c/2, -a/2];
		p3 = [c/2, -a/2];

		this.parts.arm1 = this._makePolyBody(0, -b-a/2+a/20, [p1, p2, p3, p4], 220.0, 1.0, 0.0);	
				
		this.joints = {
			foundation_arm1	: this._makeRevoluteJoint(this.parts.foundation, this.parts.arm1, 0, -b, 0, 0),
		};
	}
	
});

