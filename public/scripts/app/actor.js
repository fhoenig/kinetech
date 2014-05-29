// Actor serial generator
var ActorSerial = {
	lastId: 1,
	next: function(){return this.lastId++;}
};

// controller class to decouple multiple behavioral strategies
var ActorController = Class.extend({
	init: function() {
		this._startTime = 0;
		this._actor = null;
		this._tick = 0;
		this._ts = 0;
	},
	
	setActor: function(actor) {
		this._actor = actor;
	},
	
	setStartTime: function(ts) {
		this._startTime = ts;
		this._tick = 0;
	},
	
	getStartTime: function() {
		return this._startTime;
	},
	
	getTick: function(){
		return this._tick;
	},
	
	getControllerTime: function() {
		return this._ts - this._startTime;
	},
	
	update: function(deltaTime, timestamp) {
		this._tick++;
		if (this._startTime == 0) {
		    this._startTime = timestamp;
		}
		    
		this._ts = timestamp;
	},
	
	stop: function() {
		// cleanup by disabling all joint motors
		var v = this._actor;
		for (var jointName in v.joints) {
			v.joints[jointName].EnableMotor(false);
		}
	}
});

// list of actor controller classes
var ActorControllers = {};


// CLASS Actor - All scene objects are actors
var Actor = Class.extend({

	init: function(type, scene, initialX, initialY) {
		this.id = ActorSerial.next();
		this.type = type;
		this._initialX = initialX;
		this._initialY = initialY;
		this._scene = scene;
		this._controller = null;
		scene.addObject(this);
	},
	
	setController: function(controller) {
		if (this._controller)
			this._controller.stop();
		this._controller = controller;
		if (controller) {
			this._controller.setActor(this);
            // this._controller.setStartTime(Date.now() / 1000);            
		}
	},
	
	getController: function(controller) {
		return this._controller;
	},
	
	update: function(deltaTime, timestamp) {
		if (this._controller)
			this._controller.update(deltaTime, timestamp);
	},
	
	_makePolyBody: function(px, py, vertices, dens, frict, rest, flipX) {

		if (flipX == true)
			vertices.reverse();
		// fixture definition
		var fixDef = new b2FixtureDef();
		fixDef.density = dens;
		fixDef.friction = frict;
		fixDef.restitution = rest;
		fixDef.filter.groupIndex = -this.id;

		// body definition
		var bodyDef = new b2BodyDef();
		bodyDef.type = b2Body.b2_dynamicBody;

		// shape definition
		fixDef.shape = new b2PolygonShape();
		var vertexCount = vertices.length;
		var pVertices = new Array();

		for ( j=0; j<vertexCount; ++j )
		{
			pVertices[j] = new b2Vec2();
			if (flipX == true) 
				pVertices[j].Set((-1.0*vertices[j][0]), (vertices[j][1]));
			else
				pVertices[j].Set((1.0*vertices[j][0]), (vertices[j][1]));
		}
		fixDef.shape.SetAsArray(pVertices, vertexCount);
		bodyDef.position.Set((px + this._initialX), (py + this._initialY));
		var body = this._scene.getWorld().CreateBody(bodyDef);
		body.CreateFixture(fixDef);
		body.SetUserData(this);
		
		// extend b2Body to store a copy of the transform
		body.m_exf = new b2Transform();
		body.m_exf.Set(body.m_xf);
		body.m_exf.position.x = (px)
		body.m_exf.position.y = (py);
		
		return body;
	},
	
	_makeCircleBody: function(px, py, r, dens, frict, rest, flipX) {
		// creates ball
		var fixDef = new b2FixtureDef();
		fixDef.density = dens;
		fixDef.friction = frict;
		fixDef.restitution = rest;
		fixDef.filter.groupIndex = -this.id;
		var bodyDef = new b2BodyDef();

		bodyDef.type = b2Body.b2_dynamicBody;
		bodyDef.position.Set((px + this._initialX), (py + this._initialY));
		if (flipX == true) 
			bodyDef.angle = -Math.PI;
			
		fixDef.shape = new b2CircleShape();
		fixDef.shape.SetRadius((r));
		var body = this._scene.getWorld().CreateBody(bodyDef);
		body.CreateFixture(fixDef);
		body.SetUserData(this);
		
		// extend b2Body to store a copy of the transform
		body.m_exf = new b2Transform();
		body.m_exf.Set(body.m_xf);
		body.m_exf.position.x = (px)
		body.m_exf.position.y = (py);
		
		return body;
	},
	
	_makeRevoluteJoint: function(body1, body2, ax, ay, lu, ll) {
		// connect join
		var jDef = new b2RevoluteJointDef();
		
		jDef.lowerAngle = ll / (180/Math.PI);
		jDef.upperAngle = lu / (180/Math.PI);
		jDef.enableLimit = true;
		
		var anchor = new b2Vec2();
		anchor.Set((ax + this._initialX), (ay + this._initialY));
		
		jDef.Initialize(body1, body2, anchor);
		return this._scene.getWorld().CreateJoint(jDef);
	}
});