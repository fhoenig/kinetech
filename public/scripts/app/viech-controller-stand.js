// 
//  viech-controller-stand.js
//  trees
//  
//  Created by Florian Hoenig on 2012-02-02.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 


//
// Stand Controller
//
// keeping the viech stand up and in balance
// external force is accounted for
//
ActorControllers.Viech.Stand = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Stand";		
	},
	
	setActor: function(a) {
		this._super(a);
		// init with neutral pose
		this.ta = $.extend({}, a.jointAngularCenters);
		this.foot1Contact = new b2Vec2();
		this.foot2Contact = new b2Vec2();
		this.foot1OnGround = false;
		this.foot2OnGround = false;
		this.CMAvg = new b2Vec2();
		this.CM = {};
		this.CMAAccel = 0;
		this.CMAVel = 0;
		this.CMA = 0;
		this.anchorCM = new b2Vec2();		
		var self = this;
		
		// attach contact listener for feet
		if (!this._listener) {
			var mf = new b2WorldManifold();
			var f1 = a.parts.foot1.GetFixtureList();
			var f2 = a.parts.foot2.GetFixtureList();
			
			this._listener = new Box2D.Dynamics.b2ContactListener;
			this._listener.BeginContact = function(contact) {
				if (contact.GetFixtureA() == a._scene._ground.GetFixtureList()) {
					if (contact.GetFixtureB() == f1)
						self.foot1OnGround = true;
					else if (contact.GetFixtureB() == f2)
						self.foot2OnGround = true;
				} else if (contact.GetFixtureB() == a._scene._ground.GetFixtureList()) {
					if (contact.GetFixtureA() == f1)
						self.foot1OnGround = true;
					else if (contact.GetFixtureA() == f2)
						self.foot2OnGround = true;					
				}
			},
			this._listener.EndContact = function(contact) {
				if (contact.GetFixtureA() == a._scene._ground.GetFixtureList()) {
					if (contact.GetFixtureB() == f1)
						self.foot1OnGround = false;
					else if (contact.GetFixtureB() == f2)
						self.foot2OnGround = false;
				} else if (contact.GetFixtureB() == a._scene._ground.GetFixtureList()) {
					if (contact.GetFixtureA() == f1)
						self.foot1OnGround = false;
					else if (contact.GetFixtureA() == f2)
						self.foot2OnGround = false;					
				}
			},
			this._listener.PostSolve = function(contact, impulse) {
				var updateFootContact = null;
				
				if (contact.GetFixtureB() == a.parts.foot1.GetFixtureList() && contact.GetFixtureA() == a._scene._ground.GetFixtureList() ||
					contact.GetFixtureA() == a.parts.foot1.GetFixtureList() && contact.GetFixtureB() == a._scene._ground.GetFixtureList()) {
					updateFootContact = self.foot1Contact;
				} else if (contact.GetFixtureB() == a.parts.foot2.GetFixtureList() && contact.GetFixtureA() == a._scene._ground.GetFixtureList() ||
					contact.GetFixtureA() == a.parts.foot2.GetFixtureList() && contact.GetFixtureB() == a._scene._ground.GetFixtureList()) {
					updateFootContact = self.foot2Contact;
				}
				
				if (updateFootContact) {
					contact.GetWorldManifold(mf);
					if (contact.GetManifold().m_pointCount == 2) {
						// find middle point depending on averages of contact impulses
						var cp = b2Math.SubtractVV(mf.m_points[1], mf.m_points[0]);
						cp.Multiply(impulse.normalImpulses[1] / (impulse.normalImpulses[0] + impulse.normalImpulses[1]));
						updateFootContact.SetV(b2Math.AddVV(mf.m_points[0], cp));
					} else {
						// simply take the single contact point
						updateFootContact.SetV(mf.m_points[0]);
					};
					// updateFootContact.SetV(a.parts.foot1.GetWorldCenter());
				}
				
				// console.log(impulse.normalImpulses[0], impulse.normalImpulses[1]);
			}
			a._scene._world.SetContactListener(this._listener);		
		}
	},	
	
	_recalcCMs: function(deltaTime) {
		if (this.foot1OnGround && !this.foot2OnGround)
			this.anchorCM = this.foot1Contact;
		else if (!this.foot1OnGround && this.foot2OnGround)
			this.anchorCM = this.foot2Contact;
		else if (this.foot1OnGround && this.foot2OnGround) {
			this.anchorCM.SetV(b2Math.AddVV(this.foot1Contact, this.foot2Contact));
			this.anchorCM.Multiply(1/2);
		} else {
			// only do when touching the ground
			return;
		}
			
		var n = 0;
		var a = 0;
		var S = new b2Vec2();
		for (var jn in this._actor.parts) {
			// exclude feet from center of mass vectors
			// if (jn == 'foot1' || jn == 'foot2')
			// 	continue;
			this.CM[jn] = new b2Vec2();
			this.CM[jn].SetV(this._actor.parts[jn].GetWorldCenter());
			this.CM[jn].Subtract(this.anchorCM);
			this.CM[jn].Multiply(this._actor.parts[jn].GetMass());
			n++;			
			S.Add(this.CM[jn]);
		}
		
		S.Multiply(1/n);
		S.Normalize();
		
		// angle of average mass vector
		a = Math.atan(S.y/S.x) - Math.PI/2 + ((S.x>0) ? Math.PI : 0);

		// angular velocity
		this.CMAAccel = ((a - this.CMA) / (deltaTime)) - this.CMAVel;
		this.CMAVel = (a - this.CMA) / (deltaTime);
		this.CMA = a;
		
		// set new average mass vector
		this.CMAvg.SetV(S);
		// console.log(XMath.rad2deg(a), this.CMAVel);
		
	},
			
	update: function(deltaTime, timestamp) {
		this._super(deltaTime, timestamp);
		this._recalcCMs(deltaTime);
		// alias
		var v = this._actor;
		var poseDef = this.currentPoseDef;

		// this.ta.legL1__foot1 = v.jointAngularCenters.legL1__foot1 + avel/Math.PI * 70;
		// this.ta.legL2__foot2 = this.ta.legL1__foot1;
		// this.ta.torsoL__torsoM = v.jointAngularCenters.torsoL__torsoM - avel/Math.PI * 90;
		// this.ta.torsoM__torsoU = v.jointAngularCenters.torsoM__torsoU - avel/Math.PI * 90;
		// this.ta.torsoU__armU1 = v.jointAngularCenters.torsoU__armU1 + avel/Math.PI * 180;
		// this.ta.torsoU__armU2 = this.ta.torsoU__armU1;

		// console.log(this.CMA, this.CMAVel, this.CMAAccel);

		for (var jointName in this.ta) {
			
			if ((!this.foot1OnGround && !this.foot2OnGround) || Math.abs(this.CMA) > XMath.deg2rad(20))
				v.joints[jointName].EnableMotor(false);
			else {
				v.joints[jointName].EnableMotor(true);
				v.joints[jointName].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jointName));
				v.joints[jointName].SetMotorSpeed(0);
				
			}
		}

		var err; var speed = 10;
		
		var Kp = 1;
		var Ki = 2;
		var Kd = 0.001;
		
		
		if ((this.foot2OnGround && this.foot1OnGround) && Math.abs(this.CMA) < XMath.deg2rad(10)) {
			speed = Kp*this.CMAVel + Ki*this.CMA + Kd*this.CMAAccel;

			// err = v.joints.legL1__foot1.GetJointAngle() - XMath.deg2rad(v.jointAngularCenters['legL1__foot1']);				
			v.joints.legL1__foot1.SetMaxMotorTorque(v.getFatiguedMuscleTorque('legL1__foot1'));
			// speed = 10*this.CMA - err;			
			v.joints.legL1__foot1.SetMotorSpeed(speed);

			// err = v.joints.legL2__foot2.GetJointAngle() - XMath.deg2rad(v.jointAngularCenters['legL2__foot2']);		
			v.joints.legL2__foot2.SetMaxMotorTorque(v.getFatiguedMuscleTorque('legL2__foot2'));
			// speed = 10*this.CMA - err;
			v.joints.legL2__foot2.SetMotorSpeed(speed);						
		}
			
        
		if (window.joysticks && window.joysticks.length > 0) {
			v.joints.torsoL__torsoM.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoL__torsoM'));
			v.joints.torsoL__torsoM.EnableMotor(true);
			v.joints.torsoL__torsoM.SetMotorSpeed(window.joysticks[0].axes[4]/30000/2);

			v.joints.torsoM__torsoU.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoM__torsoU'));
			v.joints.torsoM__torsoU.EnableMotor(true);
			v.joints.torsoM__torsoU.SetMotorSpeed(window.joysticks[0].axes[2]/30000/2);

			v.joints.torsoL__legU1.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoL__legU1'));
			v.joints.torsoL__legU2.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoL__legU2'));
			v.joints.torsoL__legU1.EnableMotor(true);
			v.joints.torsoL__legU2.EnableMotor(true);
			v.joints.torsoL__legU1.SetMotorSpeed(window.joysticks[0].axes[3]/30000/2);
			v.joints.torsoL__legU2.SetMotorSpeed(window.joysticks[0].axes[3]/30000/2);

			v.joints.legU1__legL1.SetMaxMotorTorque(v.getFatiguedMuscleTorque('legU1__legL1'));
			v.joints.legU2__legL2.SetMaxMotorTorque(v.getFatiguedMuscleTorque('legU2__legL2'));
			v.joints.legU1__legL1.EnableMotor(true);
			v.joints.legU2__legL2.EnableMotor(true);
			v.joints.legU1__legL1.SetMotorSpeed(window.joysticks[0].axes[5]/30000);
			v.joints.legU2__legL2.SetMotorSpeed(window.joysticks[0].axes[5]/30000);

			v.joints.torsoU__armU1.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoU__armU1'));
			v.joints.torsoU__armU1.EnableMotor(true);
			v.joints.torsoU__armU1.SetMotorSpeed((window.joysticks[0].axes[0] + 32768) / (32768+32767)*5 - (window.joysticks[0].axes[1] + 32768) / (32768+32767)*5);			

			v.joints.torsoU__armU2.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoU__armU2'));
			v.joints.torsoU__armU2.EnableMotor(true);
			v.joints.torsoU__armU2.SetMotorSpeed((window.joysticks[0].axes[0] + 32768) / (32768+32767)*5 - (window.joysticks[0].axes[1] + 32768) / (32768+32767)*5);			
			
		}
		
		// move arms
		err = v.joints.torsoU__armU1.GetJointAngle() - XMath.deg2rad(v.jointAngularCenters['torsoU__armU1']);				
		v.joints.torsoU__armU1.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoU__armU1'));
		v.joints.torsoU__armU1.SetMotorSpeed(-err);
		err = v.joints.torsoU__armU2.GetJointAngle() - XMath.deg2rad(v.jointAngularCenters['torsoU__armU2']);				
		v.joints.torsoU__armU2.SetMaxMotorTorque(v.getFatiguedMuscleTorque('torsoU__armU2'));
		v.joints.torsoU__armU2.SetMotorSpeed(-err);
		
	}
	
});