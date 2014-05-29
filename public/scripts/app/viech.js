// 
//  viech.js
//  trees
//  
//  Created by Florian Hoenig on 2012-01-25.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 

// Controller list for viech
ActorControllers.Viech = {};


// CLASS Viech
var Viech = Actor.extend({

	init: function(scene, initialX, initialY, dna) {
		
		this._super("Viech", scene, initialX, initialY);
		this.dna = dna;
		Math.seedrandom(this.dna.seed);

		// energy
		this.workDone = 0;

		// remember joints and bodies
		this.parts = {};
		this.joints = {};
		this.bones = {};
		this.partsTransforms = {};
		
		// kinect pose input
		// this is set by the kinect plugin when enabled
		this.poseInput = {
		    prev: null,
		    curr: null,
		};
		
		this.generate();
		this._initJointLimits();
		this._initMuscles();		
	},
	
	_initJointLimits: function() {
		this.jointAngularLimits = {
			torsoL__torsoM	: [50, -15],
			torsoL__legU1	: [15, -80],
			torsoL__legU2	: [15, -80],
			legU1__legL1	: [160, -5],
			legU2__legL2	: [160, -5],
			legL1__foot1	: [90, -20],
			legL2__foot2	: [90, -20],
			torsoM__torsoU	: [25, -20],
			torsoU__head 	: [55, -5],
			torsoU__armU1 	: [140, -100],
			torsoU__armU2	: [140, -100],
			armU1__armL1	: [10, -140],
			armU2__armL2	: [10, -140],
			armL1__hand1	: [45, -90],
			armL2__hand2	: [45, -90]
		};
		if (this.dna.flipX)
			for (var i in this.jointAngularLimits) {
				this.jointAngularLimits[i].reverse()
				this.jointAngularLimits[i][0] *= -1;
				this.jointAngularLimits[i][1] *= -1;
			};
		
		// copy limits into bone system
		for (var jn in this.jointAngularLimits) {
			var b = jn.split("__")[1];
			this.bones[b].aMin = XMath.deg2rad(this.jointAngularLimits[jn][1]);
			this.bones[b].aMax = XMath.deg2rad(this.jointAngularLimits[jn][0]);
		}
		
		// angular centers of joint ("held" by ligaments and muscle passive resistance)
		this.jointAngularCenters = {
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
			torsoL__torsoM	: 200,
			torsoL__legU1	: 150,
			torsoL__legU2	: 150,
			legU1__legL1	: 95,
			legU2__legL2	: 95,
			legL1__foot1	: 100,
			legL2__foot2	: 100,
			torsoM__torsoU	: 140,
			torsoU__head 	: 60,
			torsoU__armU1 	: 60,
			torsoU__armU2	: 60,
			armU1__armL1	: 70,
			armU2__armL2	: 70,
			armL1__hand1	: 20,
			armL2__hand2	: 20
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
		
		// update last frame's poseInput
	    this.poseInput.prev = this.poseInput.curr;
	    
	},
	
	updatePoseInput: function(poseDef) {
	    this.poseInput.curr = poseDef;
	},
	
	getFatiguedMuscleTorque: function(jn) {
		// Temporarily disabled!!!
        // return (1-this.muscleFatigue[jn]) * this.muscleMaxTorques[jn];
        return this.muscleMaxTorques[jn];
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

		// generate lower torso
		var a = 0.20 * this.dna.spineLength / 0.60;
		var b = 0.17 * this.dna.spineLength / 0.60;
		var c = 0.10 * this.dna.spineLength / 0.60;
		var d = c / 2;
		var e = 0.20 * this.dna.spineLength / 0.60;
		var th = 5;

		var p1 = [-c/2, b];
		var p6 = [c/2, b];
		var p3 = [-d, -a/5];
		var p4 = [d, -a/5];
		var p5 = XMath.rotVec([e/2.5, 0], -th);
		var p2 = XMath.rotVec([-e/2.5, 0], -th);
		var p2a = XMath.rotVec([-e/2.2, 0], -th*5);
		var p2b = XMath.rotVec([-e/1.7, 0], -th*10);
		
		this.parts.torsoL = this._makePolyBody(0, 0, [p1, p2b, p2a, p2, p3, p4, p5, p6], 200.0, 1.0, 0.0, this.dna.flipX);

		// generate middle torso
		p1 = [-d, a];
		p6 = [d*1.5, a];
		p3 = [-d/2, -b*0.8];
		p4 = [d/2, -b*0.8];
		p5 = [e/2 * 1.2, 0];
		p2 = XMath.rotVec([-e/2, 0], th);

		this.parts.torsoM = this._makePolyBody(0, -a, [p1, p2, p3, p4, p5, p6], 200.0, 1.0, 0.0, this.dna.flipX);
		
		// generate upper torso
		p3 = [-d/2, -e/2];
		p4 = [d/2, -e/2];
		p5 = [e/2 * 1.5, 0];
		p2 = [-e/2, 0];
		p6 = XMath.rotVec([e/2*1.2, 0], th);
		p6[1] += e/2;
		p1 = XMath.rotVec([-e/2, 0], th);
		p1[1] += e/2;
		
		this.parts.torsoU = this._makePolyBody(0, -a-e/2, [p1, p2, p3, p4, p5, p6], 200.0, 1.0, 0.0, this.dna.flipX);
		
		// generate head
		var hr = this.dna.spineLength *0.20;
		this.parts.head = this._makeCircleBody(0, -a-e/2-hr*1.8, hr, 60.0, 1.0, 0.0, this.dna.flipX);
		
		// generate upper legs 
		p1 = [-d/2, (a+e)/2];
		p6 = [d/2, (a+e)/2];
		p3 = [-c/2, -(a+e)/2];
		p4 = [c/2, -(a+e)/2];
		p5 = XMath.rotVec([e/2 *0.8, 0], -th);
		p2 = XMath.rotVec([-e/2 *0.8, 0], -th);
		
		this.parts.legU1 = this._makePolyBody(0, b/2 + (a+e)/2, [p1, p2, p3, p4, p5, p6], 120.0, 1.0, 0.0, this.dna.flipX);
		this.parts.legU2 = this._makePolyBody(0, b/2 + (a+e)/2, [p1, p2, p3, p4, p5, p6], 120.0, 1.0, 0.0, this.dna.flipX);
		
		// generate lower legs
		p3 = [-d/2, -(a+e)/2];
		p4 = [d/2, -(a+e)/2];
		p1 = [-d/2, (a+e)/2];
		p6 = [d/2, (a+e)/2];
		p5 = XMath.rotVec([d, 0], 2*th);
		p2 = XMath.rotVec([-d, 0], 2*th);
		
		this.parts.legL1 = this._makePolyBody(0, (a+e)*1.55, [p1, p2, p3, p4, p5, p6], 110.0, 1.0, 0.0, this.dna.flipX);
		this.parts.legL2 = this._makePolyBody(0, (a+e)*1.55, [p1, p2, p3, p4, p5, p6], 110.0, 1.0, 0.0, this.dna.flipX);
		
		// generate feet
		p4 = [e, 0];
		p3 = XMath.rotVec(p4, th*2);
		// p4[0] *= 0.1;
		p3[1] -= d;
 		// p3[0] *=1.2;
		p1 = [-d/2, 0];
		p2 = [-d/4, -d*1.5];
		this.parts.foot1 = this._makePolyBody(-d/3, (a+e)*2.1, [p1, p2, p3, p4], 80.0, 1.0, 0.0, this.dna.flipX);
		this.parts.foot2 = this._makePolyBody(-d/3, (a+e)*2.1, [p1, p2, p3, p4], 80.0, 1.0, 0.0, this.dna.flipX);
		
		// generate upper arms
		p3 = [0, -d*1.2];
		p2 = XMath.rotVec(p3, -45);
		p1 = XMath.rotVec(p2, -90);
		p6 = XMath.rotVec(p1, -45);
		p4 = [a+d, -p1[1]/2];
		p5 = [a+d, p1[1]/2];
		this.parts.armU1 = this._makePolyBody(0, -a-e/2, [p1, p2, p3, p4, p5, p6], 80.0, 1.0, 0.0, this.dna.flipX);
		this.parts.armU2 = this._makePolyBody(0, -a-e/2, [p1, p2, p3, p4, p5, p6], 80.0, 1.0, 0.0, this.dna.flipX);

		var flipX = (this.dna.flipX == true)?-1:1;
		
		// generate lower arms
		p3 = [0, -d*0.5];
		p2 = XMath.rotVec(p3, -45);
		p1 = XMath.rotVec(p2, -90);
		p6 = XMath.rotVec(p1, -45);
		p4 = [a, -p1[1]];
		p5 = [a, p1[1]];
		this.parts.armL1 = this._makePolyBody(flipX*(a+d), -a-e/2, [p1, p2, p3, p4, p5, p6], 92.0, 1.0, 0.0, this.dna.flipX);
		this.parts.armL2 = this._makePolyBody(flipX*(a+d), -a-e/2, [p1, p2, p3, p4, p5, p6], 92.0, 1.0, 0.0, this.dna.flipX);
		
		// generate hands
		p3 = [0, -d*0.6];
		p2 = XMath.rotVec(p3, -45);
		p1 = XMath.rotVec(p2, -90);
		p6 = XMath.rotVec(p1, -45);
		p4 = [2*d, -p1[1]];
		p5 = [2*d, p1[1]];

		this.parts.hand1 = this._makePolyBody(flipX*(a+d)+a, -a-e/2, [p1, p2, p3, p4, p5, p6], 60, 1.0, 0.0, this.dna.flipX);
		this.parts.hand2 = this._makePolyBody(flipX*(a+d)+a, -a-e/2, [p1, p2, p3, p4, p5, p6], 60, 1.0, 0.0, this.dna.flipX);
				
		this.joints = {
			torsoL__torsoM	: this._makeRevoluteJoint(this.parts.torsoL, this.parts.torsoM, 0, 0, 0, 0),
			torsoL__legU1	: this._makeRevoluteJoint(this.parts.torsoL, this.parts.legU1, 0, b*2/3, 0, 0),
			torsoL__legU2	: this._makeRevoluteJoint(this.parts.torsoL, this.parts.legU2, 0, b*2/3, 0, 0),
			legU1__legL1	: this._makeRevoluteJoint(this.parts.legU1, this.parts.legL1, 0, (a+e)*1.1, 0, 0),
			legU2__legL2	: this._makeRevoluteJoint(this.parts.legU2, this.parts.legL2, 0, (a+e)*1.1, 0, 0),
			legL1__foot1	: this._makeRevoluteJoint(this.parts.legL1, this.parts.foot1, -d/3, (a+e)*2.1 -d , 0, 0),
			legL2__foot2	: this._makeRevoluteJoint(this.parts.legL2, this.parts.foot2, -d/3, (a+e)*2.1 -d , 0, 0),
			torsoM__torsoU	: this._makeRevoluteJoint(this.parts.torsoM, this.parts.torsoU, -d/2, -a, 0, 0),
			torsoU__head 	: this._makeRevoluteJoint(this.parts.torsoU, this.parts.head, 0, -a-e/2, 0, 0),
			torsoU__armU1 	: this._makeRevoluteJoint(this.parts.torsoU, this.parts.armU1, 0, -a-e/2, 0, 0),
			torsoU__armU2	: this._makeRevoluteJoint(this.parts.torsoU, this.parts.armU2, 0, -a-e/2, 0, 0),
			armU1__armL1	: this._makeRevoluteJoint(this.parts.armU1, this.parts.armL1, flipX*(a+d), -a-e/2, 0, 0),
			armU2__armL2	: this._makeRevoluteJoint(this.parts.armU2, this.parts.armL2, flipX*(a+d), -a-e/2, 0, 0),
			armL1__hand1	: this._makeRevoluteJoint(this.parts.armL1, this.parts.hand1, flipX*(a+d)+a, -a-e/2, 0, 0),
			armL2__hand2	: this._makeRevoluteJoint(this.parts.armL2, this.parts.hand2, flipX*(a+d)+a, -a-e/2, 0, 0)
		};

		this.bones.torsoL = new Bone(0, 0, (b*2/3), 0, null, 0, 1, this.parts.torsoL, 0, 0);
		this.bones.legU1 = new Bone(0, 0, ((a+e)/2+(a+e)/2) - this.bones.torsoL.l, 0, this.bones.torsoL, 0, 1, this.parts.legU1, 0, this.parts.legU1.m_exf.position.y - this.bones.torsoL.l);
		this.bones.legU2 = new Bone(0, 0, ((a+e)/2+(a+e)/2) - this.bones.torsoL.l, 0, this.bones.torsoL, 0, 1, this.parts.legU2, 0, this.parts.legU2.m_exf.position.y - this.bones.torsoL.l);
		this.bones.legL1 = new Bone(0, 0, ((a+e)*2-d/2-d) - this.bones.legU1.l - this.bones.torsoL.l, 0, this.bones.legU1, 0, 1, this.parts.legL1, 0, this.parts.legL1.m_exf.position.y - this.bones.legU1.l - this.bones.torsoL.l);
		this.bones.legL2 = new Bone(0, 0, ((a+e)*2-d/2-d) - this.bones.legU2.l - this.bones.torsoL.l, 0, this.bones.legU2, 0, 1, this.parts.legL2, 0, this.parts.legL2.m_exf.position.y - this.bones.legU2.l - this.bones.torsoL.l);
		this.bones.foot1 = new Bone(0, 0, (c), 0, this.bones.legL1, flipX*1, 0, this.parts.foot1, 0, this.parts.foot1.m_exf.position.y - this.bones.legU1.l - this.bones.torsoL.l - this.bones.legL1.l);
		this.bones.foot2 = new Bone(0, 0, (c), 0, this.bones.legL2, flipX*1, 0, this.parts.foot2, 0, this.parts.foot2.m_exf.position.y - this.bones.legU2.l - this.bones.torsoL.l - this.bones.legL2.l);
		this.bones.torsoM = new Bone(0, -(b*2/3), (a+b*2/3), 0, this.bones.torsoL, 0, -1, this.parts.torsoM, 0, this.parts.torsoM.m_exf.position.y);
		this.bones.torsoU = new Bone(flipX*(-d/2), 0, (b*2/3), 0, this.bones.torsoM, 0, -1, this.parts.torsoU, flipX*(d/2), 0);
		this.bones.head = new Bone(flipX*(d/2), (b*2/3), (-a-e/2-hr*1.8) + this.bones.torsoM.l, 0, this.bones.torsoU, 0, 1, this.parts.head, 0, (-a-e/2-hr*1.8) + this.bones.torsoM.l);
		this.bones.armU1 = new Bone(flipX*(d/2), (b*2/3), (a-d), 0, this.bones.torsoU, flipX*1, 0, this.parts.armU1, 0, 0);
		this.bones.armU2 = new Bone(flipX*(d/2), (b*2/3), (a-d), 0, this.bones.torsoU, flipX*1, 0, this.parts.armU2, 0, 0);
		this.bones.armL1 = new Bone(0, 0, (a-d), 0, this.bones.armU1, flipX*1, 0, this.parts.armL1);
		this.bones.armL2 = new Bone(0, 0, (a-d), 0, this.bones.armU2, flipX*1, 0, this.parts.armL2);
		this.bones.hand1 = new Bone(0, 0, (c), 0, this.bones.armL1, flipX*1, 0, this.parts.hand1);
		this.bones.hand2 = new Bone(0, 0, (c), 0, this.bones.armL2, flipX*1, 0, this.parts.hand2);


	}
	
});

