// 
//  RL.js
//  trees
//  
//  Inspired/ported from C++ http://homepages.cwi.nl/~hasselt/code.html
//  Created by Florian Hoenig on 2012-02-14.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 


// namespace
var RL = {};

RL.State = Class.extend({
	init: function(cont, dim) {
		if (cont == true) {
			this.continuous = true;
		    this.discrete = false;
		    this.stateDimension = dim;
		    this.numberOfStates = null;
		    this.discreteState = null;
		    this.continuousState = new Array();
		} else {
			this.continuous = false;
		    this.discrete = true;
		    this.stateDimension = null;
		    this.numberOfStates = dim;
		    this.discreteState = null;
		    this.continuousState = null;
		}
	}
});

RL.Action = Class.extend({
	init: function(cont, dim) {
		if (cont == true) {
			this.continuous = true;
			this.discrete = false;
			this.actionDimension = dim;
			this.numberOfActions = null;
			this.discreteAction = null;
			this.continuousAction = new Array();			
		} else {
			this.continuous = false;
			this.discrete = true;
			this.actionDimension = null;
			this.numberOfActions = dim;
			this.discreteAction = null;
			this.continuousAction = null;				
		}
	}
});


/**
 * RL-learning algorithm base class
 * 
 */
RL.Algorithm = Class.extend({

	init: function() {
	    this.discreteStates = false;
	    this.continuousStates = false;
	    this.discreteActions = false;
	    this.continuousActions = false;
	},

	// double * array, int n 
	max: function(array, n) {
	    this.maxX    = array[0];
	    for (var i=1; i<n; i++) {
	        if (this.array[i] > this.maxX) {
	            this.maxX = this.array[i];
	        }
	    }
	    return this.maxX;
	},
	
	// double * array, int n 
	argmax: function(array, n) {
	    this.maxX    = array[0];
	    this.maxI    = 0;
	    for (var i=1; i<n; i++) {
	        this.X = this.array[i];

	        if (this.X > this.maxX) {
	            this.maxX = this.X;
	            this.maxI = i;
	        }
	    }
	    return this.maxI;
	},

	// double * array, int n
	argmaxAll: function(array, n) {
	    this.maxX    = array[0];
	    var maxI = new Array();
	    maxI.push(0);

	    for (var i=1; i<n; i++) {
	        this.X = array[i];

	        if (this.X > this.maxX) {
	            this.maxX = this.X;
	            maxI = [];
	            maxI.push(i);
	        } else if (this.X == this.maxX) {
	            maxI.push(i);
	        }
	    }
	    return maxI;
	},

	// State * state, Action * action, double epsilon
	egreedy: function(state, action, epsilon) {
	    if (Math.random() < epsilon) {
	        this.getMaxAction(state, action);
	    } else {
	        this.getRandomAction(state, action);
	    }
	},

	egreedyNoise: function(state, action, epsilon) {
	    if (Math.random() < epsilon) {
	        this.getMaxAction(state, action);
	    } else {
	        this.getNoiseAction(state, action);
	    }
	},


	// ifstream * ifile, string label 
	read_moveTo: function(ifile, label) {
	    var temp = "";
		//TODO
/*
	    while (temp.compare(label) != 0 and ifile) {
	        *ifile >> temp;

	        if (ifile->eof()) {
	            cout << "Read error: Could not find label '" << label << "' while reading parameter file." << endl;
	            exit(0);
	        }

	    }
*/
	}
});



/**
 * RL-learning CACLA algorithm
 * Continuous State Actor-Critic Learning Algorithm
 *
 */
RL.Cacla = RL.Algorithm.extend({
	
	init: function(parameterFile, w) {

	    this.discreteStates      = w.getDiscreteStates();
	    this.actionDimension     = w.getActionDimension();

	    this.nHiddenQ = parameterFile.nHiddenQ;
		this.nHiddenV = parameterFile.nHiddenV;

	    if (this.discreteStates == true) {

	        this.numberOfStates = w.getNumberOfStates();

	        this.A = new Array();//double*[numberOfStates];
	        this.V = new Array();//double[numberOfStates];

	        for (var s=0; s<this.numberOfStates; s++) {

	            this.A[s] = new Array();//double[actionDimension];
	
	            for (var a=0; a < this.actionDimension; a++) {
	                this.A[s][a] = 0.0;
	            }

	            this.V[s] = 0.0;
	        }

	    } else {

	        this.stateDimension = w.getStateDimension();

	        var layerSizesA = [this.stateDimension, this.nHiddenQ, this.actionDimension];
	        var layerSizesV = [this.stateDimension, this.nHiddenV, 1];
	        this.ANN = new NN.NeuralNetwork(1, layerSizesA);
	        this.VNN = new NN.GSBFNet(this.stateDimension, 10, [-250, 250]);// NN.NeuralNetwork(1, layerSizesV);
	
	        this.VTarget = new Array();//double[1];
			this.noiseFunction = [];

			this.noiseFunction = new SimplexNoise();


	    }
	    this.storedGauss = false;
	},


	getMaxAction: function(state, action) {

	    var As;//double * As;

	    if (state.discrete) {
	        As = this.A[state.discreteState];
	    } else {
	        As = this.ANN.forwardPropagate(state.continuousState);
	    }

		for (var a = 0; a < this.actionDimension; a++) {
			action.continuousAction[a] = As[a];
		}
	},


	getRandomAction: function(state, action) {
		
	    for (var a = 0; a < this.actionDimension; a++) {
	        action.continuousAction[a] = 2.0*Math.random() - 1.0;
	    }
	},
	
	getNoiseAction: function(state, action) {
		
	    for (var a = 0; a < this.actionDimension; a++) {
	        action.continuousAction[a] = this.noiseFunction.noise(Date.now()/10000, a*10);
	    }
	},
	

	//double explorationRate, string explorationType, bool endOfEpisode
	explore: function(state, action, explorationRate, explorationType, endOfEpisode) {

	    if (explorationType == "boltzmann") {
	        throw Exception("Boltzmann exploration is as of yet undefined for Cacla.");
	
	    } else if (explorationType == "egreedy") {
	        this.egreedy(state, action, explorationRate);

	    } else if (explorationType == "gaussian") {
	        this.gaussian(state, action, explorationRate);

	    } else if (explorationType == "egreedynoise") {
			this.egreedyNoise(state, action, explorationRate);
	    } else if (explorationType == "noise") {
			this.noise(state, action, explorationRate);
		}
	},

	gaussianRandom: function() {
	    // Generates gaussian (or normal) random numbers, with mean = 0 and
	    // std dev = 1. Used for gaussian exploration.

	    if (this.storedGauss) {
	        this.storedGauss = false;
	        return this.g2;

	    } else {
	        var x, y;
	        var z = 1.0;

	        while (z >= 1.0) {
	            x = 2.0*Math.random() - 1.0;
	            y = 2.0*Math.random() - 1.0;
	            z = x * x + y * y;
	        }

	        z = Math.sqrt(-2.0 * Math.log(z) / z);
	        this.g1 = x * z;
	        this.g2 = y * z;
	        this.storedGauss = true;

	        return this.g1;
	    }

	},

	gaussian: function(state, action, sigma) {

	    this.getMaxAction(state, action);
	
	    for (var a = 0; a < this.actionDimension; a++) {
	        action.continuousAction[a] += sigma*this.gaussianRandom();
	    }
	},
	
	noise: function(state, action, sigma) {

	    this.getMaxAction(state, action);
		var maxAction = action.continuousAction.slice(0);
		this.getNoiseAction(state, action, sigma);
	
	    for (var a = 0; a < this.actionDimension; a++) {
	        action.continuousAction[a] = (maxAction[a]*sigma + action.continuousAction[a]*(1-sigma));
	    }

	},
	
	
	
	// State * state, Action * action, double rt, State * nextState, bool endOfEpisode, double * learningRate, double gamma 
	update: function(state, action, rt, nextState, endOfEpisode, learningRate, gamma) {

	    var at = action.continuousAction;

	    if (state.discrete) {
	        var st      = state.discreteState;
	        var st_     = nextState.discreteState;
	        var Vt = V[st];

	        if (endOfEpisode) {
	            this.V[st] += learningRate[1]*(rt - this.V[st]);
	        } else {
	            this.V[st] += learningRate[1]*(rt + gamma*this.V[st_] - this.V[st]);
	        }

	        if (this.V[st] > Vt) {
	            for (var a = 0; a < this.actionDimension; a++) {
	                this.A[st][a] += learningRate[0]*(at[a] - this.A[st][a]);
	            }
	        }

	    } else {
	        var st = state.continuousState;
	        var st_ = nextState.continuousState;

	        if (endOfEpisode) {
	            this.VTarget[0] = rt;
	        } else {
	            var Vs_ = this.VNN.evaluate($V(st_)); //.forwardPropagate(st_)[0];
	            this.VTarget[0] = rt + gamma*Vs_;
	        }


	        var Vt = this.VNN.evaluate($V(st));

	        this.VNN.train($V(st), this.VTarget);//(st, this.VTarget, learningRate[1]);
			// console.log("ANN update", this.VTarget[0], Vt, Vs_, (this.VTarget[0]>Vt));
	        if (this.VTarget[0] > Vt) {
	            this.ANN.backPropagate(st, at, learningRate[0]);
	        } else {
				at[0] *= -1;
				at[1] *= -1;
				this.ANN.backPropagate(st, at, learningRate[0]);

			}
	    }
	},


	getNumberOfLearningRates: function() {
	    return 2;
	},

	getContinuousStates: function() {
	    return true;
	},

	getDiscreteStates: function() {
	    return true;
	},

	getContinuousActions: function() {
	    return true;
	},

	getDiscreteActions: function() {
	    return false;
	},

	getName: function() {
	    return "Cacla";
	}

});


RL.CaclaTrace = RL.Cacla.extend({
	
	init: function(parameterFile, w) {
		this._super(parameterFile, w);
		this.trace = [];
		this.maxTrace = 500;
	},
	
	// State * state, Action * action, double rt, State * nextState, bool endOfEpisode, double * learningRate, double gamma 
	update: function(state, action, rt, nextState, endOfEpisode, learningRate, gamma) {

		var at = action.continuousAction;

		var st = state.continuousState;
		var st_ = nextState.continuousState;

		this.trace.push({st: st.slice(0), at: at.slice(0), st_: st_.slice(0), rt: rt});
		if (this.trace.length > this.maxTrace)
		this.trace.shift();
		for (var i in this.trace) {
			this.VNN.backPropagate(this.trace[i].st, [this.trace[i].rt], learningRate[1]);
		}

		for (var i in this.trace) {
			var Vt = this.VNN.forwardPropagate(this.trace[i].st)[0];
			var Vs_ = this.VNN.forwardPropagate(this.trace[i].st_)[0];
			if (Vs_ > Vt) {
				this.ANN.backPropagate(st, this.trace[i].at, learningRate[0]);
			} else if (Vs_ < Vt) {
				at[0] = this.trace[i].at[0] * -1;
				at[1] = this.trace[i].at[1] * -1;
				this.ANN.backPropagate(st, at, learningRate[0]);
			}
		}
	}
});


RL.ActorRewardLearner = RL.Cacla.extend({
	
	init: function(parameterFile, w) {
		this._super(parameterFile, w);
		this._memory = [];
	},
	
	resetMemory: function() {
		this._memory = [];
	},
	
	update: function(state, action, rt, nextState, endOfEpisode, learningRate, gamma) {
		if (this._memory.length > 10)
			this._memory.shift();
			
		this._memory.push({
			state: state.continuousState.slice(0),
			action: action.continuousAction.slice(0),
			rt: rt,
			nextState: nextState.continuousState.slice(0)
		});

		// update reward trace
		this._memory[this._memory.length-1].R = this._memory[this._memory.length-1].rt;
		for (var i=this._memory.length-1; i>1; i--) {
			this._memory[i-1].R = this._memory[i-1].rt + this._memory[i].rt * gamma;
		// console.log(this._memory[i-1].rt);			
		}
		// $("#reward").append(this._memory[0].R + " ");
		// df.ds=1;

		var lastR = this._memory[0].R;
		for (var mi=0; mi<this._memory.length; mi++) {

			var st = this._memory[mi].state;
			var st_ = this._memory[mi].nextState;

			// this.VTarget[0] = this._memory[mi].rt;
			// this.VNN.backPropagate(st, this.VTarget, learningRate[1]);

			// var Vs = this.VNN.forwardPropagate(st)[0];
			// var Vs_ = this.VNN.forwardPropagate(st_)[0]
			var a = this._memory[mi].action.slice(0);
			// a = XMath.unitVec(a);

			if (this._memory[mi].R > lastR) {
				this.ANN.backPropagate(st, a, learningRate[0]);
			} else if (this._memory[mi].R < lastR){
				a[0] *= -1;
				a[1] *= -1;
				this.ANN.backPropagate(st, a, learningRate[0]);
			}
			lastR = this._memory[mi].R;
		}
	}
});


