// 
//  simplexnoise.js
//  trees
//  
//  Created by Florian Hoenig on 2012-02-05.
//  Based on https://github.com/Craig-Macomber/N-dimensional-simplex-noise/blob/master/simplex.py
//  Copyright 2012 Florian Hoenig. All rights reserved.
// 

// jenkins_one_at_a_time_hash algorithm (roughly)
var randHash = function(v) {
    var hash = (255 & v) >>> 0;
    hash += ((hash << 10) >>> 0);
    hash ^= ((hash >>> 6) >>> 0);
    
    hash += 255 & ((v>>>(8)) >>> 0);
    hash += ((hash << 10) >>> 0);
    hash ^= ((hash >>> 6) >>> 0);
    
    hash += (255 & (v>>>(16)) >>> 0);
    hash += ((hash << 10) >>> 0);
    hash ^= ((hash >>> 6) >>> 0);
    
    hash += ((hash << 3) >>> 0);
    hash ^= ((hash >>> 11) >>> 0);
    return (hash+((hash << 15)>>>0)) >>> 0;
};

var sortWith = function(l1, l2) {
    // Sorts l2 using l1
    var pairs = zip(l1,l2);
    pairs.sort(function(a, b){
		return (a[0] - b[0]);
	});
	var a = [];
	for (v in pairs) a.push(pairs[v][1]);
    return a;
};

var SimplexNoiseN = Class.extend({

	//
    // Initalize SimplexNoise by precomputing all that can be
    // precomputed to save time when sampling
	//
    init: function(seed, dimensions) {
        
        // This makes sure the seed is good and randomized
        // as sampling may not do so robustly
        this.seed = randHash(seed);
        this.d = dimensions;
        
        // Compute skew constant. This is questionably correct
        this.f = (Math.pow((this.d + 1), 0.5) - 1) / this.d;
        
        // Unskew constant
        // this.g=((this.d+1)-(this.d+1)**.5)/((this.d+1)*this.d)
        
        // this.f*=1.1
        // This is the proper relation between f and g in terms of d
        // that makes sure skewing and unskewing reverse eachother
        // this.f=this.g/(1-this.d*this.g)
        this.g = this.f / (1 + this.d * this.f);
        
        // simplex edge length
        var sideLength=Math.pow(this.d, 0.5) / (this.d * this.f + 1);
        var a = Math.pow(Math.pow(sideLength, 2) - Math.pow((sideLength/2), 2), 0.5);
        
		// distace from corner to center of most distant face
        // this is the max influance distance for a vertex
		var cornerToFace;
        if (this.d == 2) 
			cornerToFace = a;
        else if (this.d == 1)
			cornerToFace = sideLength;
        else
			cornerToFace = Math.pow(Math.pow(Math.pow(a, 2)+(a/2), 2), 0.5);
        
		this.cornerToFaceSquared = Math.pow(cornerToFace, 2);
        
        // Precompute gradient vectors.
        // Make all possible vectors consisting of:
        // +1 and -1 components with a single 0 component:
        // Vecs from center to midddle of edges of hyper-cube
        
        // Little helper generator function for making gradient vecs
        // Makes vecs of all -1 or 1, of d dimensions 
        var vf = function(d) {
			var v = [];
            for (var i=0; i<Math.pow(2, d); i++) {
				v[i] = [];
				for (var n=0; n<d; n++) {
					v[i][n] = ((i >>> n) >>> 0) % 2 * 2 - 1;
				}
			} 
			return v;
        };

        if (this.d > 1) {
	
            // inject 0s into vecs from vf to make needed vecs
            this.vecs=[];
			var vfw = vf(this.d - 1);
			for (var z=0; z<this.d; z++) {
				for (var i in vfw) {
					var v = vfw[i];
					var nv = v.slice(0, z);
					nv.push(0);
					nv = nv.concat(v.slice(z));
					this.vecs.push(nv);
				}
			}
            
            // All 1 or -1 version (hypercube corners)
            // Makes number of vecs higher, and a power of 2.
            //this.vecs=[v for z in xrange(this.d) for v in vf(this.d)]
            
            // Compensate for gradient vector lengths
            this.valueScaler = Math.pow((this.d-1),-0.5);
            // use d instead of d-1 if using corners instead of edges
            
            // Rough estimated/expirmentally determined function
            // for scaling output to be -1 to 1
            this.valueScaler *= Math.pow(this.d-1, -3.5) * 100 + 13;
        
        } else {
            this.f=0;
            this.vecs=[[1],[-1]];
            this.valueScaler=1.0;
            this.cornerToFaceSquared=1.0;
            this.g=1.0;
        }

        // shuffle the vectors using this.seed
		Math.seedrandom(this.seed);
		this.vecs.sort(function(a,b){ return Math.random()-0.5; });
        // r=random.Random()
        // r.seed(this.seed)
        // r.shuffle(this.vecs)
        // random.shuffle(this.vecs)
        
        this.vecCount=this.vecs.length;    
        // print this.d,this.f,this.g,this.cornerToFaceSquared,this.valueScaler,this.vecCount
	},
        
         
    simplexNoise: function(loc, getDerivative) {
	
       	// loc is a list of coordinates for the sample position
        // Perform the skew operation on input space will convert the
        // regular simplexs to right simplexes making up huper-cubes
        var ranged = range(this.d);
        var s = sum(loc)*this.f;

        // Skew and round loc to get origin of containing hypercube in skewed space
		var intSkewLoc=[];
		for (var v in loc)
        	intSkewLoc.push(parseInt(Math.floor(loc[v]+s)));
        
        // Unskewing factor for intSkewLoc to get to input space
        var t=sum(intSkewLoc)*this.g;
        // skewed simplex origin unskewed to input space would be:
        // cellOrigin=[v-t for v in intSkewLoc]
        
        // Distance from unskewed simplex origin (intSkewLoc[i]-t) to loc,
        // all in input space
		var cellDist = [];
		for (var i in ranged)
        	cellDist.push(loc[ranged[i]]-intSkewLoc[ranged[i]]+t);
        
        // Indexs of items in cellDist, largest to smallest
        // To find correct vertexes of containing simplex, the containing hypercube
        // is traversed one step of +1 on each axis, in the order given
        // by greatest displacement from origin of hyper cube first.
        // This order is stored in distOrder: The order to traverse the axies
// console.log(cellDist);
// console.log(ranged);
        var distOrder=sortWith(cellDist, ranged);
// console.log(distOrder);
        distOrder.reverse();
// console.log(distOrder);
        // Copy intSkewLoc to work through verts of simplex
        // intLoc will hold the current vertex,
        // and intSkewLoc will stay the containing origin's vertex
        // these are still the skewed right simplexes/ hypercube space vertex indexes
        var intLoc=intSkewLoc.slice(0);
        
        // our accumulator of noise
        var n=0.0;
        // skewOffset holds addational skew that needs to get added.
        // It will be this.g * the how many +1s have been added to all the axies total
        // Thus, adding it to the current vertex skewes it to be in input space
        // relative to the simplex's origin vertex:
        // intSkewLoc in skewed space.
        var skewOffset=0.0;
        var der=[];
        if (typeof getDerivative != "undefined" && getDerivative==true)
			for (var i=0; i<this.d; i++)
				der.push(0);
        
		var cc = [-1].concat(distOrder);
		var n=0;
        for (var vi in cc) {
			var v = cc[vi];
			
            // Move to the next corner of simplex of not on first corner
            if (v!=-1)
				intLoc[v]+=1;

            // get u: loc's position relative to the current vertex, in input space
            var u=[];
			for (var i in ranged)
				u.push(cellDist[ranged[i]]-(intLoc[ranged[i]]-intSkewLoc[ranged[i]])+skewOffset);

            // t is the factor for attenuating the effect from the current vertexes gradient
            // its based on distance squared
            // if distance squared exceeds this.cornerToFaceSquared, there is no contribution
            var t=this.cornerToFaceSquared;
            for (var a in u) {
                // Accumulate negative distance squared into t
                t-=u[a]*u[a];
            }

            if (t>0) {
                // fech a pseudorandom vec from this.vecs using intLoc
                index=this.seed;
                for (var i in ranged){
                    index += (intLoc[ranged[i]] << ((5*ranged[i])%16)) >>> 0;
				}
                var vec = this.vecs[(randHash(index))%this.vecCount];

                // dot product of vertex to loc vector and vector for gradient
                var gr=0;
                for (i in ranged)
                    gr += vec[ranged[i]]*u[ranged[i]];

                // add current vertexes contribution
                var t4 = Math.pow(t, 4);
                n += gr*t4;
                var gr8t3;

                if (getDerivative) {
                    // Apply product rule
                    // n+=gr*t**4
                    // n+=a*b
                    // der+=der(a)*b+a*der(b)
                    // a=gr
                    // b=t**4
                    // der(a)=vec
                    // der(b)=4*t**3*der(t)
                    // t=c-u**2
                    // der(t)=(-2)*u
                    // der(b)=4*t**3*(-2)*u
                    gr8t3 = gr*8* Math.pow(t, 3);
                    der=[];
					for (var i in ranged)
						der.push([ranged[i]]+vec[ranged[i]]*t4-gr8t3*u[ranged[i]]);
				}
            }    
            skewOffset += this.g;
		}
       	n *= this.valueScaler;
        if (getDerivative) {
			var dd = [];
			for (d in der) dd.push(der[d]*this.valueScaler);
			return [n, dd];
		}
        else
            return n;
	}
});

      
