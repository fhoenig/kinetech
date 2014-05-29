
// CLASS Schene
var Scene = Class.extend({
    
    init: function(selector, debug) {

  		// scale factor view/world
		this._scaleFactor = 290.0; // 1 pixel in browser ^= 1cm in physical world

        // debug draw mode (canvas)
		this._debugDraw = (typeof debug == "undefined") ? false : debug;

        // the renderer context
        this._context = null;
        // external display (window)
        this._extcontext = null

        // the physical world
        this._world = this._createWorld();

		// for delta time
		this._lastTime = 0;
        
        // objects in the world
        this._objects = new Array();

		// stopping condition
		this._running = false;
		
		// detached window
		this._worldWindow = null;
		
		// TEMP: ground box
		// renderer element
		this._display = null;
		this._ground = null;
		
		// tool interaction functions
		this._toolUpdate = function(){};
		this._toolClick = function(){};
		this._toolBarUpdate = function(){};
		
		// represents the selection
		this._selectedBody = null;
		// represents the body that's being acted on by a tool
		this._pickedBody = null;

		this.setDisplay(selector);
    },
    
    setDisplay: function(selector) {
        this._paused = true;
        this._display = $(selector).get(0);

        // init drawing context
		this._initDebugRenderer();

		if (this._ground == null)
		    this._ground = this._initWalls();

		this._initMouse();
        this._paused = false;
    },

	_initMouse: function() {
		// mouse
		this._isMouseDown = false;
		this._canvasPosition = $(this._display).offset();

		// bind events
		$(this._display).mousemove($.proxy(function(e) {
			this._mouseX = (e.pageX - this._canvasPosition.left) / this._scaleFactor;
			this._mouseY = (e.pageY - this._canvasPosition.top) / this._scaleFactor;
		}, this));

		$(this._display).mousedown($.proxy(function(){
			this._isMouseDown = true;
		}, this));
		$(this._display).mouseup($.proxy(function(){
			this._isMouseDown = false;
		}, this));

		$(this._display).click($.proxy(function(e){
			this._toolClick(e);
		}, this));		
	},
	
	bindUpdate: function(cb) {
		this._toolBarUpdate = cb;
	},
	
	enableDragging: function(){
		this._toolClick = function(){};
		this._toolUpdate = function() {
			// handle mouse dragging
			if (this._isMouseDown && (!this._mouseJoint)) {
				this._getBodyAtMouse();
				if (this._pickedBody) {
					// establish a new mouse joint
					var md = new b2MouseJointDef();
					md.bodyA = this._world.GetGroundBody();
					md.bodyB = this._pickedBody;
					md.target.Set(this._mouseX, this._mouseY);
					md.collideConnected = true;
					md.maxForce = 1000;
					this._mouseJoint = this._world.CreateJoint(md);
					this._pickedBody.SetAwake(true);
				}
			}
			if (this._mouseJoint) {
				if (this._isMouseDown) {
					// drag mouse joint
					this._mouseJoint.SetTarget(new b2Vec2(this._mouseX, this._mouseY));
				} else {
					// release mouse joint
					this._world.DestroyJoint(this._mouseJoint);
					this._mouseJoint = null;
					this._pickedBody = null;
				}
			}	
		};
	},
	
	enableMoving: function(){
		this._toolClick = function(){};
		this._toolUpdate = function() {
			// handle mouse moving
			if (this._isMouseDown) {
				if (!this._pickedBody) {
					this._getBodyAtMouse();
				} else {
					// set new position
					this._pickedBody.SetAwake(true);
					// this._pickedBody.SetType(b2Body.b2_staticBody);
					this._pickedBody.SetPosition(new b2Vec2(this._mouseX, this._mouseY));
				}
			} else {
				// drop moving body
				if (this._pickedBody) {
					// this._pickedBody.SetType(b2Body.b2_dynamicBody);
					this._pickedBody = null;									
				}
			}
		};
	},
	
	enableSelection: function(changeCb) {
		this._toolClick = function(){
			var oldSelection = this._selectedBody;
			 this._selectedBody = this._getBodyAtMouse();
			if (this._selectedBody != null && this._selectedBody != oldSelection) {
				changeCb(this._selectedBody);
			}
		};
	},

	enableCreateBox: function() {
		this._toolClick = function(e){
			var fixDef = new b2FixtureDef();
			fixDef.density = 150.0;
			fixDef.friction = 1;
			fixDef.restitution = 0.5;
			var bodyDef = new b2BodyDef();

			bodyDef.type = b2Body.b2_dynamicBody;
			bodyDef.position.y = (e.pageY - this._canvasPosition.top) / this._scaleFactor;
			bodyDef.position.x = (e.pageX - this._canvasPosition.left) / this._scaleFactor;

			fixDef.shape = new b2PolygonShape();
			fixDef.shape.SetAsBox(0.2, 0.2);
			this._world.CreateBody(bodyDef).CreateFixture(fixDef);
		};
	},

	enableCreateCircle: function() {
		this._toolClick = function(e){
			// creates ball
			var fixDef = new b2FixtureDef();
			fixDef.density = 50.0;
			fixDef.friction = 1;
			fixDef.restitution = 0.5;
			var bodyDef = new b2BodyDef();

			bodyDef.type = b2Body.b2_dynamicBody;
			bodyDef.position.y = (e.pageY - this._canvasPosition.top) / this._scaleFactor;
			bodyDef.position.x = (e.pageX - this._canvasPosition.left) / this._scaleFactor;

			fixDef.shape = new b2CircleShape();
			fixDef.shape.SetRadius(0.2);
			this._world.CreateBody(bodyDef).CreateFixture(fixDef);
		};
	},
	

	_getBodyCB: function(fixture) {
		// if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
			if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), this._mousePVec)) {
				this._pickedBody = fixture.GetBody();
				return false;
			}
		// }
		return true;
	},
    	
	_getBodyAtMouse: function() {
		this._mousePVec = new b2Vec2(this._mouseX, this._mouseY);
		var aabb = new b2AABB();
		aabb.lowerBound.Set(this._mouseX - 0.003, this._mouseY - 0.003);
		aabb.upperBound.Set(this._mouseX + 0.003, this._mouseY + 0.003);
		// Query the world for overlapping shapes.
		this._selectedBody = null;
		this._world.QueryAABB($.proxy(this._getBodyCB, this), aabb);
		return this._pickedBody;
	},

	getWorld: function() {
		return this._world;
	},

	_initDebugRenderer: function() {
		// setup debug drawing
		
		if (!this._display || this._display.nodeName.toLowerCase() !="canvas") {
			throw ("render target element not found");
		}
			
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(this._display.getContext("2d"));
		debugDraw.SetDrawScale(this._scaleFactor);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);//| b2DebugDraw.e_velocityBit);// | b2DebugDraw.e_centerOfMassBit);
		this._world.SetDebugDraw(debugDraw);
		this._context = debugDraw;
	},

	_initExternalRenderer: function(selector, scale) {
		// setup debug drawing
					
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite($(selector).get(0).getContext("2d"));
		debugDraw.SetDrawScale(scale);
		debugDraw.SetFillAlpha(0.2);
		debugDraw.SetAlpha(0.7);
		debugDraw.SetLineThickness(4.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit);// | b2DebugDraw.e_velocityBit);// | b2DebugDraw.e_jointBit);//| b2DebugDraw.e_velocityBit);// | b2DebugDraw.e_centerOfMassBit);
		this._extcontext = debugDraw;
	},
	
	_initSVGRenderer: function() {
		if (Graphic.rendererSupported("SVG")) {
			this._context = new Graphic.SVGRenderer($(this._display).identify());
		} else {
			throw ("Your browser needs SVG support.");
		}
	},

	addObject: function(obj) {
		this._objects.push(obj);
	},
    
    getObjectCount: function() {
        return this._objects.size();  
    },
    
    run: function() {
		var world = this._world;
		this._running = true;
		this._paused = false;
		this._detached = false;
		this._lastTime = 0;
		
		var update = function(timestamp) {
			
			if (window.joysticks && window.joysticks.length > 0){
				window.joysticks = JSON.parse(plugin.joysticksJSON());
				// console.log(window.joysticks[0].axes[0]);
			}
			
			// update delta time
			if (this._lastTime == 0) {
				this._lastTime = timestamp;
			}
			var deltaTime = (timestamp - this._lastTime) / 1000;
			this._lastTime = timestamp;
			// console.log(deltaTime);
			deltaTime = 1/60;

			// alias this for callback
			var self = this;

			// update tool interaction
			this._toolUpdate();
			this._toolBarUpdate(deltaTime, timestamp/1000);

			// pause check
			if (!this._paused) {

				// advance physics world
				world.Step(deltaTime, 100, 10);
				
				// update actors
				for (var actor in this._objects) {
					this._objects[actor].update(deltaTime, timestamp/1000);
				}

			};
			
			if (this._debugDraw) {
				// debug draw mode
				this._world.DrawDebugData();
				if (this._detached == true && this._extcontext != null) {
				    this._world.SetDebugDraw(this._extcontext);
				    this._world.DrawDebugData();
				    this._world.SetDebugDraw(this._context);
				}
				
				/*
				if (this._objects[0].type == "Viech") {
	 				// temporary drawing of foot contacts and balance vector
					if (this._objects[0]._controller.foot1OnGround) {
						this._context.DrawCircle(this._objects[0]._controller.foot1Contact, 0.02, new b2Color(1,1,0));
					}
					if (this._objects[0]._controller.foot2OnGround) {
						this._context.DrawCircle(this._objects[0]._controller.foot2Contact, 0.02, new b2Color(1,1,0));
					}
					if (this._objects[0]._controller.foot2OnGround || this._objects[0]._controller.foot1OnGround) {
						var p = b2Math.AddVV(this._objects[0]._controller.anchorCM, this._objects[0]._controller.CMAvg);
						var q = b2Math.AddVV(this._objects[0]._controller.anchorCM, new b2Vec2(0, -1));
						this._context.DrawSegment(this._objects[0]._controller.anchorCM, p, new b2Color(1,1,0));
						this._context.DrawSegment(this._objects[0]._controller.anchorCM, q, new b2Color(0,1,0));
					}
					
				}
				*/	
			}
			else {
				// regular mode
				this._updateWorld();				
			}
			
			world.ClearForces();
			
			
			// repeat loop
			if (self._running) {
				requestAnimFrame(function(ts) {
					update.call(self, ts);
				});				
			}
		};
		update.call(this, 0);
    },
    
    stop: function() {
		this._running = false;
    },

	togglePause: function() {
		return (this._paused = !this._paused);
	},

	toggleDetached: function() {
	    if (this._detached == false) {
	        this._worldWindow = window.open("extview.html", "extview", "directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes");
	        var self = this;
	        
            this._worldWindow.onload = function() {
                console.log("onload");
                var ext = self._worldWindow.document;
                $(".fullscreen", ext).empty();
                var newCanvas = document.createElement("canvas");
                $(".fullscreen", ext).append(newCanvas);
    	        $(self._worldWindow).resize(function(){
                    console.log("onresize", $(self._worldWindow).innerWidth(), $(self._worldWindow).innerHeight(), newCanvas, ext, self, self._worldWindow);
    	            $(newCanvas).attr("height", $(self._worldWindow).innerHeight());
    	            $(newCanvas).attr("width", $(self._worldWindow).innerWidth());
    	            var scale = 290.0/580.0 * $(self._worldWindow).innerHeight();
    	            self._initExternalRenderer($(newCanvas), scale);
    	            self._worldWindow.isInitialized = true;   	        
    	        });
    	        $(self._worldWindow).unload(function(){
    	            self._detached = false;
        	        this._extcontext = null;
    	            // warning: ugly hack
    	            var e = $("#detachWorld");
    	            $("a", e).text("Detach");
        			$(e).removeClass("selected");
	            });
            };
            
            if (this._worldWindow.isInitialized == true) {
                $(this._worldWindow).trigger("load");
                $(this._worldWindow).trigger("resize");
            }
            
	    } else {
	        this._worldWindow.close();
	    }
		return (this._detached = !this._detached);
	},
    
    
    enableMiniView: function() {
        var miniCanvas = $("#miniView");
        this._scaleFactor = 290.0/580.0 * $(miniView).innerHeight();
        this.setDisplay(miniCanvas);
    },
    
    disableMiniView: function() {
        this._scaleFactor = 290.0;
        this.setDisplay($('#canvas'));
    },
    
    _createWorld: function() {
		var world = new b2World(
			new b2Vec2(0, 9.8),	// gravity
			true                // allow sleep
		);
        return world;
    },

    _initWalls: function() {
	    var fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.friction = 0.2;
        fixDef.restitution = 0.2;
        
        var bodyDef = new b2BodyDef();

        var dim = {};
        dim.width = this.v2w($(this._display).width());
        dim.height = this.v2w($(this._display).height());
        var thick = this.v2w(10.0);
        
        // create ground
        bodyDef.type = b2Body.b2_staticBody;
        bodyDef.position.Set(dim.width/2.0, dim.height + thick);
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(dim.width/2.0, thick);
        var ground = this._world.CreateBody(bodyDef);
		ground.CreateFixture(fixDef);
		
		// create left wall
        bodyDef.type = b2Body.b2_staticBody;
        bodyDef.position.Set(-thick, dim.height/2.0);
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(thick, dim.height/2.0);
        var leftWall = this._world.CreateBody(bodyDef);
		leftWall.CreateFixture(fixDef);

		// create right wall
        bodyDef.type = b2Body.b2_staticBody;
        bodyDef.position.Set(dim.width+thick, dim.height/2.0);
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(thick, dim.height/2.0);
        var rightWall = this._world.CreateBody(bodyDef);
		rightWall.CreateFixture(fixDef);

		
		return ground;
    },

    // _updateWorld: function() {
    // 
    //     var node = this._world.GetBodyList();
    //     while (node) {
    //         var b = node;
    //         node = node.GetNext();
    // 
    //         // update all bodies linked to a DOM element
    //         var svgShape = b.GetUserData();
    //         if (!svgShape) continue;
    //                     
    //         // update dom to reflect world
    //         if (b.IsAwake())
    //             this._updateElement(b, svgShape);
    //     }
    // },

    v2w: function(viewUnit) {
        // convert view to world units
        return (viewUnit / this._scaleFactor);
    },
    w2v: function(worldUnit) {
        // convert world to view units
        return (worldUnit * this._scaleFactor);        
    }

});

