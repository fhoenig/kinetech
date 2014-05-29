
var XMath = {};

XMath.randomUniform = function(from, to) {
	return Math.random() * (to - from + 1) + from;
};

XMath.randomFromTo = function(from, to){
	return Math.floor(Math.random() * (to - from + 1) + from);
};
XMath.deg2rad = function(angle) {
	return (angle / 180) * Math.PI;
};
XMath.rad2deg = function(angle) {
	return angle / Math.PI * 180;
};
XMath.round = function(num, dec) {
	return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};
XMath.rotVec = function(v, a) {
	var theta = XMath.deg2rad(a);
	var cs = Math.cos(theta);
	var sn = Math.sin(theta);
	return [v[0]*cs-v[1]*sn, v[0]*sn+v[1]*cs];
};
XMath.addVec = function(v1, v2) {
	return [v1[0] + v2[0], v1[1] + v2[1]];
};

XMath.subVec = function(A, B) {
	return [A[0]-B[0], A[1]-B[1]];
};

XMath.vecMag = function(V) {
	return Math.sqrt(Math.pow(V[0],2) + Math.pow(V[1], 2));
};

XMath.unitVec = function(V) {
	var m = XMath.vecMag(V);
	return [V[0]/m, V[1]/m];
};

XMath.centerPoint = function(A, B) {
	var V = [B[0] - A[0], B[1] - A[1]];
	var m = XMath.vecMag(A);
	var Vu = [V[0]/m, V[1]/m];
	return [A[0]+(m/2)*Vu[0], A[1]+(m/2)*Vu[1]];
};

XMath.vecDot = function(A, B) {
	return A[0]*B[0] + A[1]*B[1];
};

XMath.lerp = function(val1, val2, u) {
	return ((1 - u) * val1 + u * val2);
};

XMath.sigmoid = function(x, a, b) {
	return 1 / (1 + Math.exp(-x*a+b));
};

XMath.randomDist = function(f) {
	var X, r, s;
	do {
		var r = Math.random(); 
		var s = Math.random();
		X = f(r);
	} while (X < s);
	return X;
};

XMath.randomGauss = function() {
	var NSUM=25;
	var x = 0;
	var i;
	for (i = 0; i < NSUM; i++)
		x += Math.random();
	x -= NSUM / 2.0;
	x /= Math.sqrt(NSUM / 12.0);
	return x;	
};

XMath.sign = function(n) {
	if (n < 0) return -1;
	else if (n == 0) return 0;
	else return 1;
};

XMath.gaussian = function(x, s, m) {
	return Math.exp(-( Math.pow(x-m, 2) / (2*Math.pow(s, 2))));
};

XMath.gaussianN = function(N, P, M, s) {
	var E = 0;
	for (var i=0; i<N; i++) {
		E += Math.pow(P[i]-M[i], 2) / (2*Math.pow(s, 2));
	};
	return Math.exp(-E);
};

XMath.euclidDist = function(A, B) {
	var sum = 0;
	for (var i = 0; i<A.length; i++) {
		sum+=Math.pow(B[i] - A[i], 2);
	}
	return Math.sqrt(sum);
};

XMath.ellipse = function(t, a, b, th) {
	return [
		a * Math.cos(t) * Math.cos(th) - b * Math.sin(t) * Math.sin(th),
		a * Math.cos(t) * Math.sin(th) + b * Math.sin(t) * Math.cos(th)
	];
};

// N-Dimensional vector math

XMath.vecSub = function(v, w) {
	if (v.length != w.length)
		throw Exception("dimension missmatch");
	var r = [];
	for (var i=0; i<w.length; i++)
		r[i] = v[i] - w[i];
	return r;
};

XMath.vecNorm = function(v) {
	var s = 0;
	for (var i=0; i<v.length; i++)
		s += Math.pow(v[i], 2);
	return Math.sqrt(s);
};

XMath.median = function (ary) {
    if (ary.length == 0)
        return null;
    ary.sort(function (a,b){return a - b})
    var mid = Math.floor(ary.length / 2);
    if ((ary.length % 2) == 1)  // length is odd
        return ary[mid];
    else 
        return (ary[mid - 1] + ary[mid]) / 2;
};
