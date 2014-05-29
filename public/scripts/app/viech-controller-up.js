// 
// up Controller
// 
// tries to get up
// 
ActorControllers.Viech.Up = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Up";
		this._nf = new SimplexNoise();
		
		this._dhg = 0;
		this._dtg = 0;
		this._df1g = 0;		
		this._df2g = 0;		
		
		this.CMAvg = new b2Vec2();
		this.CM = {};
		this.CMAAccel = 0;
		this.CMAVel = 0;
		this.CMA = 0;
	},
	
	recalcCMs: function(deltaTime) {
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
	
	update: function(dt, ts) {
		this._super(dt, ts);
		
		var v = this._actor;
		var ground = v._scene._ground;
		
		// distance and velocity head/ground
		var dHeadGround = ground.GetWorldCenter().y - v.parts.head.GetWorldCenter().y - v.parts.head.GetFixtureList().GetShape().m_radius;
		var vdhg = (dHeadGround - this._dhg) / dt;
        // console.log(vdhg);
		this._dhg = dHeadGround;

		var dFoot1Ground = ground.GetWorldCenter().y - v.parts.foot1.GetWorldCenter().y - v.parts.head.GetFixtureList().GetShape().m_radius;
		var vdf1g = (dFoot1Ground - this._df1g) / dt;
        // console.log(vdhg);
		this._df1g = dFoot1Ground;

		var dFoot2Ground = ground.GetWorldCenter().y - v.parts.foot2.GetWorldCenter().y - v.parts.head.GetFixtureList().GetShape().m_radius;
		var vdf2g = (dFoot2Ground - this._df2g) / dt;
        // console.log(vdhg);
		this._df2g = dFoot2Ground;

		var dTorsoGround = ground.GetWorldCenter().y - v.parts.torsoL.GetWorldCenter().y - v.parts.head.GetFixtureList().GetShape().m_radius;
		var vdtg = (dTorsoGround - this._dtg) / dt;
        // console.log(vdhg);
		this._dtg = dTorsoGround;

		var D = (dHeadGround + dFoot1Ground + dFoot2Ground + dTorsoGround) ;
		var V = (this._dtg + this._dhg + this._df1g + this._df2g) ;
		
		// center of mass sensing (core)
        // this.recalcCMs(dt);
		
		var i = 0;
		for (var jointName in v.joints) {
			v.joints[jointName].EnableMotor(true);
			v.joints[jointName].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jointName));

			// var s = v.joints[jointName].GetMotorSpeed();
			var range = Math.abs(v.jointAngularLimits[jointName][0] - v.jointAngularLimits[jointName][1]);

			var jcn = this.perlin((ts-this.getStartTime()), i, 0.05, 1.125*V+D, 3.75, 4);

			v.joints[jointName].SetMotorSpeed( jcn );
			i++;
		}
	}
});
