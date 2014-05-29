// 
//  viech-controller-noiseposer.js
//  trees
//  
//  Created by Florian Hoenig on 2012-02-02.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 

//
// Poser Controller
//
// Uses joint maxtorques and joint motors to hold various
// poses listed in a table
//
ActorControllers.Viech.Noiseposer = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Noiseposer";
		
		this.currentPoseDef = {
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
    	};
    	
		this._nf = new SimplexNoise();
	},
	
	fbm: function(x, y, octaves) {
	    var d = 0.0;
        var m = 2.0;

        for (var i=0; i<octaves; i++)
        {
            d += this._nf.noise(x*m, y*m) / m*2;
            m *=2;
        }
        return d;
	},
	
	perlin: function(x, y, frequency, persistence, lacunarity, octaveCount)
    {
        var value = 0.0;
        var signal = 0.0;
        var curPersistence = 1.0;

        var px = x * frequency;
        var py = y * frequency;

        for (var curOctave=0; curOctave < octaveCount; curOctave++) {

            // Get the coherent-noise value from the input value and add it to the
            // final result.
            signal = this._nf.noise(px, py);
            value += signal * curPersistence;

            // Prepare the next octave.
            px *= lacunarity;
            py *= lacunarity;
            curPersistence *= persistence;
        }

        return value;
    },
	
	update: function(deltaTime, timestamp) {
		this._super(deltaTime, timestamp);
		// alias
		var v = this._actor;
		var poseDef = this.currentPoseDef;
		var ground = v._scene._ground;
		var dHeadGround = ground.GetWorldCenter().y - v.parts.head.GetWorldCenter().y - v.parts.head.GetFixtureList().GetShape().m_radius;
        // console.log((0.7 - dHeadGround));
        dHeadGround *= dHeadGround;
        var i=0;
		for (var jointName in poseDef.targetAngles) {

            var range = 1.0 - (Math.abs(v.jointAngularLimits[jointName][0] - v.jointAngularLimits[jointName][1]) / 360.0);
			var jcn = (this.perlin((timestamp-this.getStartTime()), i++, 1, 2.1, 1.75, 2) + 1.0);
			poseDef.targetAngles[jointName] = XMath.lerp(v.jointAngularLimits[jointName][0], v.jointAngularLimits[jointName][1], jcn);

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
				var heightFactor = (0.7*0.7 - dHeadGround);
                // heightFactor += Math.abs(this._nf.noise(heightFactor, timestamp) / 25.0)
                // if (Math.abs(error) > 0.01)
					v.joints[jointName].SetMotorSpeed(-10 * heightFactor * error + 0.2);  // deg/s * degE
                // else if (Math.abs(v.joints[jointName].m_motorImpulse) < 0.001) 
                    // v.joints[jointName].EnableMotor(false);
                // else
                    // v.joints[jointName].SetMotorSpeed(0);
			}
			
		}
	}
	
});