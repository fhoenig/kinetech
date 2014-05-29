// 
// Perlin Noise Controller
// 
// Sets joint motor speeds via perlin noise
// 
ActorControllers.Viech.Noise2 = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Noise2";
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
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;
		var i = 0;
		for (var jointName in v.joints) {
			v.joints[jointName].EnableMotor(true);
			v.joints[jointName].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jointName));

			// var s = v.joints[jointName].GetMotorSpeed();
			var range = Math.abs(v.jointAngularLimits[jointName][0] - v.jointAngularLimits[jointName][1]);

			var jcn = this.perlin(this.getControllerTime(), i, 0.1, 1.125, 2.75, 2);

			v.joints[jointName].SetMotorSpeed( jcn );
			i++;
		}
	}
});
