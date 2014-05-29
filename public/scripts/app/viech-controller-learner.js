// 
// Learner Controller
// 
// simple reinforcement learner for attempting to sit up
//
//

// State cell prototype
// This is defined by a 15-dimensional gaussian with fixed variance 10^2
var PC = function(M) {
	this.m = M;
};
// fireing rate given a stimulus
PC.prototype.f = function(S) {
	return XMath.gaussianN(16, S, this.m, 100);
};
// distance of a stimulus to the mean
PC.prototype.d = function(M) {
	return XMath.euclidDist(M, this.m);
};

// Action cell prototype
var AC = function(V) {
	this.V = V;
};
AC.prototype.f = function(s) {
	var o=[];
	for (var i in this.V)
		o.push(this.V[i] * s);
	return o;
};
AC.prototype.d = function(A) {
	return XMath.euclidDist(A, this.V);
};


ActorControllers.Viech.Learner = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Learner";
		this._nf = new SimplexNoiseN(1, 2);

		this._phase = "rest"; // {explore|learn|rest}
		this._restWork = 10000;
		this._lastRestWork = 0;
		this._restTime = 2; //seconds
		this._restStartTime = null;
		this._explorationTrajectory = [];
		
	},
	
	_initNetwork: function() {
		this.PCPopulation = [
			// rudimentary knowledge of one state
			new PC([0,0,0,0,0,0,0,0,0,90,90,0,0,0,0,0])
		];
		
		// action cells initialized
		this.ACPopulation = [];
		// weights
		this.W = [];
		
		// dimensions
		var d=15;
		var w = [];
		for (var i=0; i<Math.pow(2, d); i++) {
			var v = [];
			for (var n=0; n<d; n++) {
				v[n] = ((i >>> n) >>> 0) % 2 * 2 - 1;
			}
			w[i] = Math.random()-0.5;
			this.ACPopulation.push(new AC(v));
        }
		this.W.push(w);
	},
	
	_computeRPC: function(S) {
		var RPC = [];
		for (var i in this.PCPopulation) {
			// calculate fire rate of inputs given the state stimulus S.
			RPC[i] = this.PCPopulation[i].f(S);
		}
		return RPC;
	},
	
	_computeRAC: function(RPC) {
		var RAC = [];
		for (var j in this.ACPopulation) {
			var rACj = 0;
			for (var i in RPC) {
				rACj += this.W[i][j] * RPC[i];
			}
			RAC.push(rACj);
		}
		return RAC;
	},
	
	_applyActivityProfile: function(chosenaction) {
		for (var i in this.RAC) {
			this.RAC[i] = Math.exp(-Math.pow(this.ACPopulation[i].d(chosenaction), 2) / 1);
		}
	},
	
	setActor: function(a) {
		this._super(a);
		this._lastRestWork = this._actor.getWorkDone();
		this._initNetwork();
		this.setPhase('explore');
	},
	
	_getDistanceHeadGround: function() {
		var ground = this._actor._scene._ground;
		var head = this._actor.parts.head;
		return Math.abs(ground.GetFixtureList().GetAABB().lowerBound.y - head.GetWorldCenter().y);
	},
	
	_getHeadAngle: function() {
		// TODO: distance function is cyclic here. how does this affect the PCs?
		return XMath.rad2deg(this._actor.parts.head.GetAngle()) % 360.0;
	},
	
	getPhase: function(p) {
		return this._phase;
	},
	
	setPhase: function(p) {
		this._phase = p;
		switch (this._phase) {
			case 'rest':
				for (var jn in this._actor.joints)
					this._actor.joints[jn].EnableMotor(false);
				this._restStartTime = Date.now() / 1000;
				this._lastRestWork = this._actor.getWorkDone();
			break;
			
			case 'explore':
				for (var jn in this._actor.joints)
					this._actor.joints[jn].EnableMotor(true);
				this.setStartTime(Date.now()/1000);
				this._explorationTrajectory = new Array();
			break;
			
			case 'learn':
				// init first time step
				var S = this._getStimulus();
				this.RPC = this._computeRPC(S);
				this.RAC = this._computeRAC(this.RPC);
				var ax = this._getRandomAction(0);
				this.Qax = this._computeNearestQ(ax, this.RAC);
				this._applyActivityProfile(ax);
				this.pt = this._computeETrace();
			break;
		}
	},
	
	_updatePCs: function() {

		// pick a random state vector from trajectory
		if (this._explorationTrajectory.length < 1)
			return;
		var t = this._explorationTrajectory[XMath.randomFromTo(0, this._explorationTrajectory.length-1)];
		
		// check if we need to create a new Place State Cell (PC)
		// if distance to all existing cells is greater than 100
		var minD = 100000000;
		for (var i in this.PCPopulation) {
			minD = Math.min(minD, this.PCPopulation[i].d(t));
		}
		if (minD >= 50.0) {
			// create new PC
			this.PCPopulation.push(new PC(t));
			
			// add weight entries for PC
			var w = [];
			for (var i=0; i<Math.pow(2, 15); i++) {
				w[i] = Math.random()-1/2;
			}
			this.W.push(w);
		}
		
		// this._explorationTrajectory = [];
		console.log("PCPopulation size: "+ this.PCPopulation.length);
	},
	
	_getActionPopulationVector: function() {
		// compute the action from the population vector
		var action = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		for (var i in this.ACPopulation) {
			var acf = this.ACPopulation[i].f(this.RAC[i]);
			for (var j in acf)
				action[j] += acf[j];
		}
		return action;
	},
	
	_getRandomAction: function(ts) {
		// sample a random action from simplex noise using the current timestamp
		var action = [];
		var v = this._actor;
		var i = 0;
		for (var jn in v.joints) {
			action.push(this._nf.simplexNoise([ts/5, i]) + this._nf.simplexNoise([ts/0.5, i])/10 + this._nf.simplexNoise([ts/5, i]) + this._nf.simplexNoise([ts/0.05, i])/100);
			i++;
		}
		return action;
	},
	
	_computeETrace: function(prev) {
		var p = [];
		var init = (typeof prev == "undefined");
		
		for (var i in this.RAC) {
			var pi = [];
			for (var j in this.RPC) {
				if (!init)
					pi.push(0.6 * prev[i][j] + this.RAC[i] * this.RPC[j]);
				else pi.push(this.RAC[i] * this.RPC[j]);
			}
			p.push(pi);
		}
		return p;
	},
	
	_getStimulus: function() {
		// builds the input vector from joint angles and head level
		var S = [];
		var v = this._actor;
		for (var jn in v.joints) {
			S.push(XMath.rad2deg(v.joints[jn].GetJointAngle()));
		}
		S.push(this._getHeadAngle());
		return S;
	},
	
	_computeNearestQ: function(a, rac0) {
		var d = [];
		for (var i in this.ACPopulation) {
			d.push([this.ACPopulation[i].d(a), i]);
		}
		d.sort(function(a,b){ return a[0] - b[0];});
		// console.log(rac0[d[0][1]] +" : "+ rac0[d[1][1]]);
		return (rac0[d[0][1]] * d[1][0]) / (rac0[d[1][1]] * d[0][0]);
	},
	
	_applyAction: function(a) {
		var i=0;
		for (var jn in v.joints) {
			v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));
			var range = Math.abs(v.jointAngularLimits[jn][0] - v.jointAngularLimits[jn][1]);
			v.joints[jn].SetMotorSpeed( a[i] * range/70);
			i++;
		}		
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		// var f = this._getDistanceHeadGround();
		switch (this._phase) {

			// rest phase: turn off all joint motors to relax
			case 'rest':
				if (ts - this._restStartTime >= this._restTime) {
					this.setPhase('explore');
					return;
				}
					
				// update PCs from previous trajectory
				this._updatePCs();
				break;

			// noise based exploratory movement
			case 'explore':
				var v = this._actor;
				var i = 0;

				// need to relax?
				if (v.getWorkDone() - this._lastRestWork > this._restWork) {
					this.setPhase('rest');
					return;
				}

				// trajectory vector entry
				var trajV = [];
				
				for (var jn in v.joints) {
					v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));
					var range = Math.abs(v.jointAngularLimits[jn][0] - v.jointAngularLimits[jn][1]);
					var jcn = this._nf.simplexNoise([ts/5, i]) + this._nf.simplexNoise([ts/0.5, i])/10 + this._nf.simplexNoise([ts/5, i]) + this._nf.simplexNoise([ts/0.05, i])/100;
					v.joints[jn].SetMotorSpeed( jcn * range/70);
					
					// remember trajectory
					trajV.push(XMath.rad2deg(v.joints[jn].GetJointAngle()));
					i++;
				}
				// add the head's angle (our measure for orientation awareness)
				trajV.push(this._getHeadAngle());
				// trajectory entry
				this._explorationTrajectory.push(trajV);
				
				break;
			
			case 'learn':
				// 1: compute Q prediction values
				var S = this._getStimulus();
				// console.log(S);
				this.RPC = this._computeRPC(S);
				// console.log(this.RPC);
				this.RAC_prev = this.RAC;
				this.RAC = this._computeRAC(this.RPC);
				
				// 2: e-greedy: explore with probability 0.7
				var a0 = this._getActionPopulationVector();
				var ax;
				this.Qax_prev = this.Qax;
				if (Math.random() <= 0.01) {
					// pick random action
					ax = this._getRandomAction(ts);
					this.Qa0 = this._computeNearestQ(a0, this.RAC);
					this.Qax = this._computeNearestQ(ax, this.RAC);
					
				} else {
					// pick selected action
					ax = a0;
					this.Qa0 = this.Qax = this._computeNearestQ(a0, this.RAC);
				}
				// console.log(ax);
				
				// 3: generalize
				this._applyActivityProfile(ax);
				
				// 4: Update elegibility trace
				this.pt_prev = this.pt;
				this.pt = this._computeETrace(this.pt_prev);
				
				// 5: apply action
				// console.log(ax);
				this._applyAction(ax);
				
				// 6: Calculate reward prediction error
				var R = (0.9 - this._getDistanceHeadGround() < 0.05) ? 100 : 0;
				var PErr = R + 0.90 * this.Qa0 - this.Qax_prev;
				// console.log(R +"+ 0.90 * "+this.Qa0+" - "+this.Qax_prev);
				
				// 7: Update weights
				for (var i in this.W) {
					for (var j in this.W[i]) {
						this.W[i][j] += 0.9 * PErr * this.pt_prev[j][i];
					}
				}
				
				break;
		}
		
	}
});
