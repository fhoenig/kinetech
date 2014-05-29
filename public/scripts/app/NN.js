// 
//  NN.js
//  Neural Network implementation
//  
//  Inspired/ported from C++ http://homepages.cwi.nl/~hasselt/code.html
//  Created by Florian Hoenig on 2012-02-13.
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 


// namespace
var NN = {};

// global constants
NN.THRESHOLD=2;
NN.TANH=1;
NN.LINEAR=0;

NN.Func = {};

NN.Func.TanH = {	
	output: function(input, output, n) {
		if (arguments.length == 1) {
		    var out = -1 ;
		    if (input > 1.92032) {
		        out = 0.96016;
		    } else if (input > 0.0) {
		        out = -0.260373271*input*input + input;
		    } else if (input > -1.92032) {
		        out = 0.260373271*input*input + input;
		    } else {
		        out = -0.96016;
		    }
		    return out;			
		} else if (arguments.length == 3) {
			for (var i = 0 ; i < n ; i++ ) {
		        output[i] = -1 ;
		        if (input[i] > 1.92032) {
		            output[i] = 0.96016;
		        } else if (input[i] > 0.0) {
		            output[i] = -0.260373271*input[i]*input[i] + input[i];
		        } else if (input[i] > -1.92032) {
		            output[i] = 0.260373271*input[i]*input[i] + input[i];
		        } else {
		            output[i] = -0.96016;
		        }
		    }
		}
	},

	derivative: function(input, output, derivative, n) {
		if (arguments.length == 2) 
	    	return 1.0 - (output*output);
		else {
		    for (var i=0; i < n; i++) {
		        derivative[i] = 1.0 - (output[i]*output[i]);
		    }			
		}
	}
};

NN.Func.Linear = {
	output: function(inp, outp, n) {
		if (arguments.length == 1) {
			return inp;
		} else {
		    for ( var i=0; i < n; i++ ) {
		        outp[i] = inp[i];
		    }
		}
	},

	derivative: function( input, output, derivative, n ) {
		if (arguments.length == 2)
	    	return 1.0;
		else {
		    for ( var i=0; i<n; i++ ) {
		        derivative[i] = 1.0 ;
		    }					
		}
	}	
};

NN.Func.Threshold = {
	output: function(inp, outp, n) {
		if (arguments.length == 1) {
		    if ( input > 0 ) {
		        return 1.0 ;
		    } else {
		        return -1.0 ;
		    }			
		} else {
			for ( var i = 0 ; i < n ; i++ ) {
		        if ( inp[i] > 0 ) {
		            outp[i] = 1.0 ;
		        } else {
		            outp[i] = -1.0 ;
		        }
		    }
		}
	},

	derivative: function (input, output) {
	    return 1.0;
	}
};


NN.Matrix = Class.extend({

	init: function(a, b, c) {
		
		switch (arguments.length) {
			case 0:
				this._data = [];
			    this._nRows = 0;
			    this._nCols = 0;
				break;			
			case 1:
				this.setSize(a);
			case 2:
				this.setSize(a, b);
				break;
			case 3:
				this.setSize(a, b);
				for (var r=0; r<this._nRows; r++ ) {
			        for (var c=0; c<this._nCols; c++) {
			            this._data[r*this._nCols+c] = c[r*this._nCols+c];
			        }
			    }
				break;
		}
	},
	
	setSize: function(a, b) {
		
		if (arguments.length == 1) {
		    this._size = a;
		    this._data = [];
		    for (var x=0; x<this._size; x++) {
		        this._data[x] = 0.0;
		    }
		    this._nRows = this._size;
		    this._nCols = 1 ;
		} else {
			this._size = a * b ;
		    this._data = [];
		    for (var x=0; x<this._size; x++) {
		        this._data[x] = 0.0;
		    }
		    this._nRows = a;
		    this._nCols = b;
		}
	},
	
	getSize: function() {
		return this._size;
	},
	
	getPtr: function() {
	    return (this._data);
	},
	
	get: function(i, j) {
		if (arguments.length == 1)
	    	return this._data[i];
		else return this._data[ i*this._nCols + j];
	},
	
	set: function (i, j, val) {
		if (arguments.length == 2)
	    	this._data[i] = j;
		else if (arguments.length == 3)
			this._data[i*this._nCols + j] = val;
	},

	add: function (i, j, val) {
		if (arguments.length == 2)
	    	this._data[i] += j;
		else if (arguments.length == 3)
			this._data[i*this._nCols + j] += val;
	}
});


NN.NeuralNetwork = Class.extend({
	
	init: function(a, b, c) {
		switch (arguments.length) {
			case 1:
				// load network from persitent storage (TODO)
				this.readNetwork(a);
			break;
			
			case 2:
				// init n layers (a) with respective sizes b[]
				var nLayersInit = a;
				var layerSizeInit = b;
				var layerFunctions = new Array(); //int[ nLayersInit + 2 ] ;
			    for (var l=1; l<nLayersInit+1; l++) {
			        layerFunctions[l] = NN.TANH;
			    }
			    layerFunctions[0] = NN.LINEAR ;
			    layerFunctions[nLayersInit+1] = NN.LINEAR;

			    this.initialize(nLayersInit, layerSizeInit, layerFunctions);
			break;
			
			case 3:
				// pass through to initialize method
				this.initialize(a, b, c);
			break;
		}
	},

	//
	// Initialize
	//
	// int nLayersInit 			: the number of hidden layers (So for input, hidden, output -> 1)
    // Array layerSizeInit 		: the number of nodes per layer (# nodes layers = # weights layers + 1)
    //                      	  (size should be nLayersInit + 2)
    // Array layerFunctionInit 	: code, specifying the function per (node) layer
	//
	//
	initialize: function(nLayersInit, layerSizeInit, layerFunctionInit) {

	    this.nLayers = nLayersInit + 2 ; // # node layers == # hidden layers + 2
	    this.nInput  = layerSizeInit[0] ;
	    this.nOutput = layerSizeInit[this.nLayers-1] ;

	    this.layerFunction       = new Array();//cFunction*[ nLayers ] ;
	    this.layerFunctionInts   = new Array();//int[ nLayers ] ;
	    this.weights             = new Array();//Matrix*[ nLayers - 1 ] ; // # weights layers = # node layers - 1
	    this.layerIn             = new Array();//Matrix*[ nLayers ] ; 
	    this.layerOut            = new Array();//Matrix*[ nLayers ] ;
	    this.layerSize           = new Array();//int[ nLayers ] ;

	    for (var l=0; l<(this.nLayers-1); l++ ) {
	        this.weights[l] = new NN.Matrix(layerSizeInit[l]+1, layerSizeInit[l+1]) ; // layerSize[ l ] + 1, for bias
	    }
	    for (var l=0; l<this.nLayers; l++) {
	        this.layerSize[l] = layerSizeInit[ l ] ;
	        this.layerIn[l] = new NN.Matrix( this.layerSize[ l ] );
	        this.layerOut[l] = new NN.Matrix( this.layerSize[ l ] );

	        this.layerFunctionInts[l] = layerFunctionInit[l];
	        if ( layerFunctionInit[l] == NN.TANH ) {
	            this.layerFunction[l] = NN.Func.TanH;
	        } else if (layerFunctionInit[l] == NN.LINEAR ) {
	            this.layerFunction[l] = NN.Func.Linear;
	        } else {
				throw Exception("unknown function");
	        }
	    }

	    // Initialise the weights randomly between -0.3 and 0.3
	    this.randomizeWeights( -0.3, 0.3 );
	    this.recentlyUpdated = true;
	},
	
	changeFunction: function(layer, f) {
		
		this.layerFunction[layer] = null;

	    if (f == NN.TANH) {
	        this.layerFunction[layer] = NN.Func.TanH;
	    } else if (f == NN.LINEAR) {
	        this.layerFunction[layer] = NN.Func.Linear;
	    } else if (f == NN.THRESHOLD) {
	        this.layerFunction[layer] = NN.Func.Threshold;
	    }
	    this.recentlyUpdated = true;
	},
	
	_forwardPropLayer: function(layer) {
		
	    this.w = this.weights[layer].getPtr() ; // The weights of the current layer

	    this.nFormer = this.layerSize[layer];       // # nodes in the former nodes layer
	    this.nNext   = this.layerSize[layer+1] ;   // # nodes in the next nodes layer

	    this.formerOut  = this.layerOut[layer].getPtr();      // The output of the former layer
	    this.nextIn     = this.layerIn[layer+1].getPtr();   // The input of the next layer (to be set)
	    this.nextOut    = this.layerOut[layer+1].getPtr();  // The output of the next layer (follows from the input and function)

	    var f = this.layerFunction[layer+1];             // The function on the next layer

	    // Initialise inputs to the next layer to zero
	    for( o=0; o < this.nNext; o++ ) {
	        this.nextIn[o] = 0.0;
	    }

	    // initialise counter for the weights
	    this.wPos=0;
	
	    // add weighted inputs
	    for (var i=0; i < this.nFormer; i++) {
	        if ( this.formerOut[i] != 0.0) {
	            for (var o=0; o < this.nNext; o++ ) {
	                this.nextIn[o] += this.w[this.wPos] * this.formerOut[i];
	                this.wPos++ ;
	            }
	        } else {
	            this.wPos += this.nNext;
	        }
	    }
	    // add bias and calculate output
	    for (var o=0; o<this.nNext; o++) {
	        this.nextIn[o] += this.w[this.wPos]; 
	        this.wPos++;
	    }
	    f.output(this.nextIn, this.nextOut, this.nNext);
	},
	
	_backPropLayer: function(layer, oError, learningSpeed) {
		
		this.w = this.weights[layer].getPtr(); // The weights of the current layer

	    this.nFormer = this.layerSize[layer];   // # nodes in the former nodes layer
	    this.nNext   = this.layerSize[layer+1];       // # nodes in the next nodes layer

	    this.formerOut = this.layerOut[layer].getPtr(); // The output of the former layer
	    this.formerIn  = this.layerIn[layer].getPtr();  // The input of the former layer

	    var f = this.layerFunction[layer]; // Function of the former layer

	    this.wPos=0;

	    this.iError = new Array();//new double[ nFormer ] ;   // Error of the input of the former layer

	    if (layer > 0) {

	        for (var i=0; i<this.nFormer; i++) {

	            this.iError[i] = 0.0;

	            if ( this.formerOut[i] != 0.0 ) {
	                for (var o=0; o<this.nNext; o++) {
	                    // First get error:
	                    this.iError[i] += this.w[this.wPos] * this.oError[o];

	                    // Then update the weight:
	                    this.w[this.wPos] += this.formerOut[i] * this.oError[o];
	                    this.wPos++;
	                }
	            } else {
	                for (var o=0; o<this.nNext; o++) {
	                    // Only get error:
	                    this.iError[i] += this.w[this.wPos] * this.oError[o];
	                    this.wPos++ ;
	                }
	            }
	            // Pass the error through the layers function:
	            this.iError[i] *= f.derivative(this.formerIn[i], this.formerOut[i]);
	        }
	
	    } else {

	        for (var i=0; i<this.nFormer; i++) {

	            if (this.formerOut[i] != 0.0 ) {
	                for (var o=0; o<this.nNext; o++) {
	                    // Only update weight:
	                    this.w[this.wPos] += this.formerOut[i] * this.oError[o];
	                    this.wPos++ ;
	                }
	            } else {
	                this.wPos += this.nNext ;
	            }
	        }
	    }

	    for (var o=0; o<this.nNext; o++) {
	        // Update the bias
	        this.w[this.wPos] += this.oError[o];
	        this.wPos++;
	    }

	    return this.iError;
	},
	
	backPropagate: function (input, target, learningSpeed) {
		// If the network has been adapted after the last forward propagation,
	    // forwardPropagate first to correctly set the hidden activations:
	    if ( this.recentlyUpdated ) {
	        this.forwardPropagate(input);
	    } else {
	        // Check whether the activations of the layers correspond with the present input
	        this.inputIn = this.layerIn[0].getPtr();
	        var useLastActivations = 1;
	        for (var i=0; (i<this.nInput) & useLastActivations; i++) {
	            if ( input[i] != this.inputIn[i] ) {
	                useLastActivations = 0;
	            }
	        }
	        if ( 0 == useLastActivations ) {
	            // If the activations don't correspond to the last input (and the network
	            // has been adapted in the meantime) set the activations by a forward
	            // propagation
	            this.forwardPropagate(input);
	        }
	    }
	    this.error = new Array();//double[ nOutput ] ; //error of the output layer.
	    this.outputOut  = this.layerOut[this.nLayers-1].getPtr();// Output of the output layer

	    for (var o=0; o < this.nOutput; o++) {
	        this.error[o] = target[o] - this.outputOut[o];
	    }
	    // backPropagate the error
	    this.backPropagateError(input, this.error, learningSpeed);
	    this.error = null;
	},

	
	backPropagateError: function(input, error, learningSpeed) {
		// If the network has been adapted after the last forward propagation,
	    // forwardPropagate first to correctly set the hidden activations:
	    if ( this.recentlyUpdated ) {
	        this.forwardPropagate( input );
	    } else {
	        // Check whether the activations of the layers correspond with the present input
	        this.inputIn = this.layerIn[0].getPtr();
	        var useLastActivations = 1;
	        for (var i=0; (i < this.nInput) & useLastActivations; i++ ) {
	            if ( input[i] != this.inputIn[i] ) {
	                useLastActivations = 0;
	            }
	        }
	        if ( 0 == useLastActivations ) {
	            // If the activations don't correspond to the last input (and the network
	            // has been adapted in the meantime) set the activations by a forward
	            // propagation
	            this.forwardPropagate(input);
	        }
	    }
	    this.oError = new Array();//double[ nOutput ] ; //error of the output layer.

	    this.outputIn   = this.layerIn[this.nLayers - 1].getPtr(); 	// Input of the output layer
	    this.outputOut  = this.layerOut[this.nLayers - 1].getPtr();	// Output of the output layer
	    var f   	    = this.layerFunction[this.nLayers - 1]; // Function of the output layer

	    // First calculate the error of the input of the output layer:
	    for (var o=0; o<this.nOutput; o++) {
	        this.oError[o] = learningSpeed * error[o];
	        this.oError[o] *= f.derivative(this.outputIn[o], this.outputOut[o]);
	    }

	    // Now propagate until reaching the input layer:
	    for (var l=this.nLayers-2; l >= 0; l--) {
	        this.iError = this._backPropLayer(l, this.oError, learningSpeed);
	        this.oError = this.iError;
	    }

	    this.iError=null;
	    this.recentlyUpdated = true;
	},
	
	forwardPropagate: function(input) {
		var f = this.layerFunction[0]; // Function of the input layer

	    var inputIn  = this.layerIn[0].getPtr();  // Input of the first layer (to be set)
	    var inputOut = this.layerOut[0].getPtr(); // Output of the first layer (to be set)

	    // First set the first layer
	    for (var i=0; i<this.nInput; i++) {
	        inputIn[i] = input[i];
	    }

	    f.output(input, inputOut, this.nInput) ;

	    // Now propagate (sets layerIn and layerOut for each layer)
	    for (var l=0; l<(this.nLayers-1); l++) {
	        this._forwardPropLayer(l);
	    }

	    //Set recentlyUpdated to false to show that the activations where set after the last change to the network
	    this.recentlyUpdated = false;

	    return this.layerOut[this.nLayers-1].getPtr(); // Output of the last layer
	},
	
	getActivation: function(layer, node)  {
	    return this.layerOut[layer].get(node);
	},
	
	
	getActivations: function(layer, activations) {
		
		//CHECK: activations should be pass-by-reference
	    var layerActivation = this.layerOut[layer].getPtr() ; // Output of the requested layer

		if (typeof activations == "undefined") {
			return layerActivation;
		}

	    // Return the output of the requested layer through the argument
	    var nActivations = this.layerSize[layer];
	    //activations->contents = new double[ nActivations ];
	    for (var o=0; o<nActivations; o++) {
	        activations[o] = layerActivation[o];
	    }
	},
	
	getWeights: function(layer, i, j)  {
	    return this.weights[layer].get(i*(this.layerSize[layer+1])+j);
	},


	setWeights: function(layer, i, j, val) {
	    this.recentlyUpdated = true;
	    this.weights[layer].set(i*(this.layerSize[layer+1])+j, val);
	},


	randomizeWeights: function (min, max, seed) {
		if (typeof seed != "undefined") {
			Math.seedrandom(seed);	
		}
	    
	    for (var l=0; l < (this.nLayers - 1); l++ ) {
	        for (var i=0; i < (this.layerSize[l] + 1); i++ ) {
	            for (var o=0; o<this.layerSize[l+1]; o++ ) {
	                this.setWeights(l, i, o, min + (max - min)*Math.random());
	            }
	        }
	    }
	}
	
});

NN.GSBFNet = Class.extend({

	init: function(indim, numUnits, centerRange) {
        this.indim = indim;
        this.numUnits = 0;
        this.centerVector = [];
		this.shapeMatrix = [];

		this.lrW = 0.1;
		this.lrM = 0.0001;
		this.lrC = 1000;
		this.eMax = 0.01;
		this.aMin = 0.0001;
		this.initialRadius = Math.abs(centerRange[0] - centerRange[1]) / numUnits;

		// linear output weights
        this.W = [];
		for (n=0; n<numUnits; n++){
			this.W.push(Math.random());
		}
		
		// cached values
		this.output = 0;
		this.activations = Vec.Zero(numUnits);

				
		// init random centers within centerRange
		for (var i=0; i<numUnits; i++) {
			var center = [];
			for (d=0; d<indim; d++) {
				center[d] = XMath.randomUniform(centerRange[0], centerRange[1]);
			}
			this._addUnit($V(center), this.initialRadius, Math.random());
		}
		
	},
	
	_addUnit: function(center, radius, weight) {
		this.centerVector.push(center);
		var shape = [];
		for (d=0; d<this.indim; d++)
			shape.push(1/radius);
		this.shapeMatrix.push(Matrix.Diagonal(shape));
		this.W.push(weight);
		this.numUnits++;
		this.activations.elements.push(0);
		console.log("added unit", center.elements, radius, weight);
	},
	
	_actFunc: function(X, M, C) {
		var A = M.multiply(X.subtract(C)).modulus();
        return Math.exp(-1/2 * A * A);
	},
	
	_calcAct: function(X) {
        // calculate activations of RBFs
		var sA = 1e-6;
		for (var ci in this.centerVector) {
			this.activations.elements[ci] = this._actFunc(X, this.shapeMatrix[ci], this.centerVector[ci]);
			sA += this.activations.elements[ci];
		}

		for (var i in this.activations.elements)
			this.activations.elements[i] /= sA;
		
        return this.activations;
	},
	
	train: function(X, Y) {
        
        // calculate activations of RBFs
        var dE = this.evaluate(X)-Y;

		// check if we need to add a new unit
		if (Math.max.apply(Math, this.activations.elements) < this.aMin && Math.abs(dE) > this.eMax) {
			this._addUnit(X.dup(), this.initialRadius, Y);
		}

		// adapt shape matrices with delta rule
		for (k=0; k<this.numUnits; k++) {
			var XmC = $M(X.subtract(this.centerVector[k]));
			var dMk = this.shapeMatrix[k].multiply(XmC.multiply(XmC.transpose()));
			dMk = dMk.multiply(dE * -this.lrM * this.W[k] * (this.activations.elements[k]-1) * this.activations.elements[k]);
			this.shapeMatrix[k] = this.shapeMatrix[k].add(dMk);
		}

		// adapt center vectors with delta rule
		for (k=0; k<this.numUnits; k++) {
			var s = (dE * this.lrC * this.W[k] * (this.activations.elements[k]-1) * this.activations.elements[k]);
			var dCk = this.shapeMatrix[k].multiply(this.shapeMatrix[k].transpose()).multiply(X.subtract(this.centerVector[k]));
			// console.log(dCk.multiply(s).elements);
			this.centerVector[k] = this.centerVector[k].add(dCk.multiply(s));
		}
		
		dE = this.evaluate(X)-Y;
		        
		// adapt linear output weights with delta rule
		for (k=0; k<this.numUnits; k++) {
			this.W[k] = this.W[k] - this.lrW * dE * this.activations.elements[k];
		}

    },

    evaluate: function(X) {
        this._calcAct(X);
		this.output = 0;
		
		for (k=0; k<this.numUnits; k++) {
			// console.log(this.W[k],  this.activations.elements[k]);
			this.output += this.W[k] * this.activations.elements[k];
		}
        return this.output;
	}
});




