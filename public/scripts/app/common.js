// Import Box2D "Namespaces"
if (typeof Box2D != 'undefined') {
	window.b2Vec2 = Box2D.Common.Math.b2Vec2;

	window.b2Vec3 = Box2D.Common.Math.b2Vec3;
	window.b2Transform = Box2D.Common.Math.b2Transform;
	window.b2Manifold = Box2D.Collision.b2Manifold;
	window.b2WorldManifold = Box2D.Collision.b2WorldManifold
	window.b2BodyDef = Box2D.Dynamics.b2BodyDef;
	window.b2AABB = Box2D.Collision.b2AABB;
	window.b2Body = Box2D.Dynamics.b2Body;
	window.b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	window.b2Fixture = Box2D.Dynamics.b2Fixture;
	window.b2World = Box2D.Dynamics.b2World;
	window.b2MassData = Box2D.Collision.Shapes.b2MassData;
	window.b2Shape = Box2D.Collision.Shapes.b2Shape,
	window.b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
	window.b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	window.b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;
	window.b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;
	window.b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
	window.b2Math = Box2D.Common.Math.b2Math;
	window.b2Color = Box2D.Common.b2Color;
	window.b2Mat22 = Box2D.Common.Math.b2Mat22;
}

// Animation frame handler
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame   	  || 
		   window.webkitRequestAnimationFrame || 
		   window.mozRequestAnimationFrame    || 
		   window.oRequestAnimationFrame      || 
		   window.msRequestAnimationFrame     || 
		   function(callback, element) {
		   		window.setTimeout(callback, 1000 / 60);
		   };
})();

function ucfirst(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var getKeys = function(obj){
   var keys = [];
   for(var key in obj){
      keys.push(key);
   }
   return keys;
};

var zip = function(arr1, arr2) {

	//determine the shortest array passed in
	var shortest = (arr1.length > arr2.length) ? arr2 : arr1;

	//create an object to store the zipped up values
	var zipped = [];

	//loop through our arrays, create new key:value pairs
	for(var i=0; i<shortest.length; i++){
		zipped.push([arr1[i], arr2[i]]);
	}

	//return the zipped up object
	return zipped;
};

var fill = function(v, n) {
	var a = [];
	for (i=0; i<n; i++)
		a.push(v);
	return a;
};

var range = function(n) {
	var a = [];
	for (i=0; i<n; i++)
		a.push(i);
	return a;
};

var sum = function(a){
	for(var i=0,sum=0;i<a.length;sum+=a[i++]);
	return sum;
};
