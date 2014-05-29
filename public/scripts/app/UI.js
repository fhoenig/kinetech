var UI = {};

UI.Code = {};

UI.Code.init = function(selector, template) {
  	UI.Code.editor = CodeMirror($(selector).get(0), {
		value: template,
		lineNumbers: true,
		matchBrackets: true,
		continueComments: "Enter",
		mode: {name: "javascript", json: true},
		theme: "ambiance",
		indentUnit: 4
	});
	
	UI.Code.editor.on('focus', function(){
	    UI.Code.focused = true;
	});
	UI.Code.editor.on('blur', function(){
	    UI.Code.focused = false;
	});
};

UI.Timeline = Class.extend({
	init: function(elem, actor) {
		this._actor = actor;
		this._elem = elem;
		this._ctx = null;
		this._buildDom();
	},
	
	_color: function (color, alpha) {
		return "rgba(" + ((color & 0xFF0000) >> 16) + "," + ((color & 0xFF00) >> 8) + "," + (color & 0xFF) + "," + alpha + ")";
	},

	_buildDom: function() {
		$(".labels", this._elem).empty();
		for (var jn in this._actor.joints) {
			$(".labels", this._elem).append("<li>"+jn+"</li>");
		}
		var height = $(".labels", this._elem).height()-4;
		var cvs = $('<canvas width="799" height="'+height+'"></canvas>');
		$(cvs).addClass("timelineCanvas");
		$(".container", this._elem).empty().append(cvs);

		this._ctx = $(".timelineCanvas", this._elem).get(0).getContext("2d");
		this._trackCount = $(".labels li", this._elem).length;
		this._trackHeight = $(".labels", this._elem).height() / this._trackCount;
		this._drawGuides();

	},
	
	_drawGuides: function() {
		this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
		var s = this._ctx;
		
		for (var i=1; i < this._trackCount; i++) {
			s.beginPath();
			s.strokeStyle = this._color("0x777777", 1.0);
			s.lineWidth = 1.0;
			s.moveTo(0, i*this._trackHeight-0.5);
			s.lineTo(this._ctx.canvas.width, i*this._trackHeight-0.5);
			s.stroke();
			s.beginPath();
			s.strokeStyle = this._color("0x5555FF", 0.2);
			s.lineWidth = 1.0;
			s.moveTo(0, i*this._trackHeight - this._trackHeight/2.0);
			s.lineTo(this._ctx.canvas.width, i*this._trackHeight - this._trackHeight/2.0);
			s.stroke();
		};
	},
	
	update: function(dt, ts) {

		if (!(this._actor.getController()))
			return;
			
		var i=1;
		var current = this._actor.getController().getTick();
		var currentX = current % 799;
		var s = this._ctx;
		if (Math.round(currentX) == 0.0)
			this._drawGuides();
			
		var th = this._trackHeight;
	
		for (var jn in this._actor.joints) {
			var j = this._actor.joints[jn];

			// draw fatigue
			s.beginPath();
			s.strokeStyle = this._color("0xFF5500", 0.8);
			s.lineWidth = 1.0;
			var currentFY = (th-2) * this._actor.muscleFatigue[jn];
			s.moveTo(currentX, i*th - 2);
			s.lineTo(currentX, i*th - currentFY);
			s.stroke();

			if (j.IsMotorEnabled()) {
				// draw motor speed
				s.beginPath();
				s.strokeStyle = this._color("0x00FF00", 0.8);
				s.lineWidth = 1.0;
				var currentY = j.m_motorImpulse / (this._actor.muscleMaxTorques[jn] * dt) * ((th-2) / 2.0);
				s.moveTo(currentX, i*th-th/2.0 + 0);
				s.lineTo(currentX, i*th-th/2.0 + currentY);
				s.stroke();
			} 
			
			i++;	
		}
	}
});

UI.Toolgroup = Class.extend({

	init: function(toolBar, groupElem, isSwitched) {
		this._elem = groupElem;
		this._toolBar = toolBar;
		this._isSwitched = isSwitched;
		this._tools = $('li', groupElem);
		this._tools.bind('click', $.proxy(function(e){
			var cbName = '_on' + ucfirst(e.currentTarget.id) + 'Click';
			if (cbName in this && typeof this[cbName] == "function") {
				// remove selected class
				if (this._isSwitched) {
					this._tools.removeClass('selected');
					$(e.currentTarget).addClass('selected');
				}
				this[cbName](e.currentTarget);
			} else {
				// tool method not implemented, show red border
				$(e.currentTarget).css("border-color", "red");
			}
			return false;
		}, this));	
	},
	
	_onSelectBodyClick: function(e) {
		var change = $.proxy(function(body){
			this._toolBar.clearInspectors();

			var actor = body.GetUserData();
			if (actor) switch (actor.type) {
				case "Viech":
					this._toolBar.addInspector(new UI.ViechPropertyInspector(actor));
					this._toolBar.attachTimeline(actor);
				break;
			}
			this._toolBar.addInspector(new UI.BodyPropertyInspector(body));
		}, this);
		this._toolBar._scene.enableSelection(change);
	},
	
	_onDragBodyClick: function(e) {
		this._toolBar._scene.enableDragging();
	},
	
	_onMoveBodyClick: function(e) {
		this._toolBar._scene.enableMoving();
	},
	
	_onCreateCircleClick: function(e) {
		this._toolBar._scene.enableCreateCircle();
	},
	
	_onCreateBoxClick: function(e) {
		this._toolBar._scene.enableCreateBox();	
	},
	
	_onPoserClick: function(e) {
		var change = $.proxy(function(body) {
			this._toolBar.clearInspectors();

			var actor = body.GetUserData();
			if (actor) switch (actor.type) {
				case "Viech":
					this._toolBar.addInspector(new UI.ViechPoserDesigner(actor));
					this._toolBar.attachTimeline(actor);
				break;
			}
		}, this);
		this._toolBar._scene.enableSelection(change);
	},
	
	_onViewWorldClick: function(e) {
		
	    $("#view-editor").hide();
		$("#view-world").show();
		this._toolBar.removeInspectorType("MiniView");
	    this._toolBar._scene.disableMiniView();
	},

	_onViewCodeClick: function(e) {
	    $("#view-editor").show();
		$("#view-world").hide();
		UI.Code.editor.refresh();
		this._toolBar.addInspector(new UI.MiniView());
	    this._toolBar._scene.enableMiniView();
	},
	
	_onPauseWorldClick: function(e) {
		// tell scene to pause
		if (this._toolBar._scene.togglePause()) {
			$("a", e).text("resume");
			$(e).addClass("selected");
		} else {
			$("a", e).text("pause");
			$(e).removeClass("selected");
		}
	},
	
	_onDetachWorldClick: function(e) {
		// detach world rendering into new window
		if (this._toolBar._scene.toggleDetached()) {
			$("a", e).text("Attach");
			$(e).addClass("selected");
		} else {
			$("a", e).text("Detach");
			$(e).removeClass("selected");
		}
	}
});

/**
 * UI.Toolbar
 *
 * Central UI component to broker all tool actions and inspector
 * interactions.
 *
 */
UI.Toolbar = Class.extend({
		
    init: function(selector, propertyBoxSelector, scene) {
		this._scene = scene;
		this._toolBar = $(selector);
		this._propertyBoxElement = $(propertyBoxSelector);
		this._inspectors = new Array();
		this._groups = new Array();
		this._propertyBoxElement.empty();
		this._timeline = null;
		this._bindTools();
		this._scene.bindUpdate($.proxy(this.update, this));
	},
		
	_bindTools: function() {
		$(".toolgroup", this._toolBar).each($.proxy(function(num, g) {
			var tg = new UI.Toolgroup(this, g, $(g).hasClass("switchgroup"));
			this._groups.push(tg);
		}, this));
		
		// TEMP: key shortcuts
		
		$(document).keypress($.proxy(function(e){
		    if (UI.Code.focused == true)
		        return true;
		        
			// spacebar
			if (e.which == 32) {
				e.preventDefault();
				this._onPauseWorldClick($('#pauseWorld'));
				return false;
			}
		}, this._groups[1]));
		
	},
	
	attachTimeline: function(actor) {
		delete this._timeline;
		this._timeline = new UI.Timeline($('#timeline'), actor);
	},

	clearInspectors: function() {
		this._propertyBoxElement.empty();
		this._inspectors = new Array();
	},
	
	
	addInspector: function(inspector) {
		this._inspectors.push(inspector);
		inspector.toolbar = this;
		inspector.setupDom(this._propertyBoxElement);
		return inspector;
	},
	
	removeInspector: function(inspector) {
		for (var i in this._inspectors) {
			if (this._inspectors[i] == inspector) {
				this._inspectors[i].removeDom();
				delete this._inspectors[i];
			}
		}
	},
	
	removeInspectorType: function(inspectorType) {
		for (var i in this._inspectors) {
			if (this._inspectors[i].type == inspectorType) {
				this._inspectors[i].removeDom();
				delete this._inspectors[i];
			}
		}
	},
	
	update: function(dt, ts) {
		this.updateInspectors();
		this.updateTimeline(dt, ts);
	},
	
	updateTimeline: function(dt, ts) {
		if (this._timeline)
			this._timeline.update(dt, ts);
	},
	
	updateInspectors: function() {
		for (var i in this._inspectors) {
			this._inspectors[i].updateValues();
		}
	}
});

UI.PropertyInspectorSerial = {
	lastId: 0,
	next: function() { return this.lastId++; }
};

// Abstract Property Inspector
UI.PropertyInspector = Class.extend({
	init: function() {
		this._propertyMap = {};
		this._propertyEditors = {};
		this.toolbar = null;
		this.type = "unknown";
		
		this._id = UI.PropertyInspectorSerial.next();
	},
	
	_stringifyObject: function(obj) {
		var str = "";
		for (key in obj) {
			str += key + ": " + obj[key] + "<br>";
		}
		return str;
	},
	
	_getPropertyValue: function(key) {
		if (typeof this._propertyMap[key] == "function")
			return this._propertyMap[key]();
		else
			return this._propertyMap[key];
	},
	
	removeDom: function() {
		$("#PROP-"+this._id).remove();
	},
	
	setupDom: function(parent) {
		var dom = $('<table id="PROP-'+this._id+'" border="0" cellspacing="0" cellpadding="0"><tr><th colspan="2">'+this._section+'</th></tr></table>');
		for (var key in this._propertyMap) {

			var propertyRow = $('<tr id="PROP-'+this._id+'-'+key+'"></tr>');
			$(propertyRow).append('<td width="130">'+key+'</td>');
			
			var val = this._getPropertyValue(key);

			// check whether property has an editor
			if (key in this._propertyEditors) {
				var edit = this._propertyEditors[key];
				switch (edit.type) {
					case "selectone":
						var input = $('<select></select>');
						$(input).attr("id", 'PROP-'+this._id+'-'+key+'-EDIT');
						for (var o in edit.options) {
							var oElem = $('<option name="'+o+'">'+edit.options[o]+'</option>');
							if (o == val) $(oElem).attr("selected", "selected");
							$(input).append(oElem);
						}
						var td = $("<td></td>");
						$(td).append(input);
						$(propertyRow).append(td);
						$(input).change($.proxy(function(e){
							this.onChange($('option:selected', $(e.target)).attr('name'));
						}, edit));
					break;
					
					case "button":
    					var input = $('<div class="button">'+key+'</div>');
    					$(input).attr("id", 'PROP-'+this._id+'-'+key+'-EDIT');
    					var td = $("<td></td>");
    					$(td).append(input);
    					$(propertyRow).append(td);
    					$(input).click($.proxy(function(e){
    						this.onClick();
    					}, edit));					
					break;
				}
			} else {
				$(propertyRow).append('<td>'+val+'</td>');
			} 
			$(dom).append(propertyRow);			
		}
		$(parent).append(dom);
	},
	
	updateValues: function() {
		for (var key in this._propertyMap) {
			if (typeof this._propertyMap[key] == "function") {
				var row = $('#PROP-'+this._id+'-'+key+'>td');
				if (row.length == 2) {
					$($(row).get(0)).text(key);
					if (key in this._propertyEditors) {
						// value has an editor, needs special updating (can't just overwrite stuff in there)
						var edit = this._propertyEditors[key];
						switch (edit.type) {
							case "selectone":
								var val = this._propertyMap[key]();
								$('option', row).attr("selected", null);
								$('option[name="'+val+'"]').attr("selected", "selected");
							break;
						}
					} else {
						// value doesn't have an editor
						$($(row).get(1)).html(this._propertyMap[key]());	
					}
				}
			}
		}		
	}
});


// Property Inspector for "Viech" Objects
UI.ViechPropertyInspector = UI.PropertyInspector.extend({
	init: function(viech) {
		this._super();
		this._viech = viech;
		this._section = "Actor";
		this._type = "ViechPropertyInspector";
		this._controllerInspector = null;
		this._propertyMap = {
			ID: viech.id,
			Type: viech.type,
			InitialPosition: viech._initialX + ", " + viech._initialY,
			Controller: function() { var c = viech.getController(); return (c) ? c.type : '';},
			TotalMass: viech.getTotalMass(),
			// PartsMassRatios: this._stringifyObject(viech.getPartsMassRatios()),
			// JointLimits: this._stringifyObject(viech.jointAngularLimits),
			// JointAngles: $.proxy(function() {return this._stringifyObject(viech.getJointAngles());}, this),
			//MotorImpulses: $.proxy(function() {return this._stringifyObject(viech.getMotorImpulses());}, this),
			//MotorSpeeds: $.proxy(function() {return this._stringifyObject(viech.getMotorSpeeds());}, this),
			WorkDone: $.proxy(function() {return this._viech.getWorkDone();}, this),
			TotalFatigue: $.proxy(function() {return this._viech.getTotalFatigue();}, this),
			TotalEffort: $.proxy(function() {return this._viech.getTotalEffort();}, this)
		};
		this._propertyEditors = {
			Controller: {
				type: "selectone",
				options: this._getAvailableControllers(),
				onChange: $.proxy(function(newController) {
					this.toolbar.removeInspector(this._controllerInspector);
					if (newController == '')
						viech.setController(null);
					else {
						var c = new ActorControllers.Viech[newController];
						viech.setController(c);
						if (newController == "Poser")
							this._controllerInspector = this.toolbar.addInspector(new UI.ViechPoserControllerInspector(c));
						else if (newController == "Learner2")
							this._controllerInspector = this.toolbar.addInspector(new UI.ViechLearnerControllerInspector(c));
						else if (newController == "Scripts")
						    this._controllerInspector = this.toolbar.addInspector(new UI.ViechScriptsControllerInspector(c));
					}
				}, this)
			}
		};
	},
		
	_getAvailableControllers: function() {
		var all = {'' : "None"};
		for (var c in ActorControllers.Viech) {
			all[c] = c;
		}
		return all;
	}
});

UI.ViechPoserControllerInspector = UI.PropertyInspector.extend({
	init: function(controller) {
		this._super();
		this._controller = controller;
		this._section = "ActorController";
		this.type = "ViechPoserControllerInspector";
		this._propertyMap = {
			ID: controller._actor.id + "Controller",
			Pose: function() {return controller.getPose();}
		};
		this._propertyEditors = {
			Pose: {
				type: "selectone",
				options: this._controller.availablePoses(),
				onChange: function(newPose) {
					controller.setPose(newPose);
				}
			}
		};
	}
	
});

UI.ViechScriptsControllerInspector = UI.PropertyInspector.extend({
	init: function(controller) {
		this._super();
		this._controller = controller;
		this._section = "Script";
		this.type = "ViechScriptsControllerInspector";
		this._propertyMap = {
			ID: controller._actor.id + "Controller",
			Compile: "Compile"
		};
		this._propertyEditors = {
			Compile: {
				type: "button",
				onClick: function() {
				    if (false == controller.setSource(0, UI.Code.editor.getValue()))
				        console.log(this);
				}
			}
		};
	}
});


UI.ViechLearnerControllerInspector = UI.PropertyInspector.extend({
	init: function(controller) {
		this._super();
		this.type = "ViechLearnerControllerInspector";
		this._controller = controller;
		this._section = "ActorController";
		this._propertyMap = {
			ID: controller._actor.id + "Controller",
			Phase: function() {return controller.getPhase();},
			Episode: function() {return controller.getEpisode();},
			RewardSum: function() {return XMath.round(controller.getRewardSum(), 5);},
			Epsilon: function() { return controller.getEpsilon();},
			Exploration: function() { return controller.getExplorationType();}
		};
		this._propertyEditors = {
			Phase: {
				type: "selectone",
				options: {'apply': "Applying", "rest": "Resting", "learn": "Learning"},
				onChange: function(newPhase) {
					controller.setPhase(newPhase);
				}
			},
			Exploration: {
				type: "selectone",
				options: {'egreedy': "e-Greedy", "gaussian": "Gaussian"},
				onChange: function(newT) {
					controller.setExplorationType(newT);
				}
			},
			Epsilon: {
				type: "selectone",
				options: {"0":"0", "0.1":"0.1", "0.2":"0.2", "0.4":"0.4", "0.5":"0.5", "0.6":"0.6", "0.85":"0.85", "0.95":"0.95", "0.99":"0.99", "1.0":"1", "10.0": "10"},
				onChange: function(newE) {
					controller.setEpsilon(newE);
				}
			}			
		};
	}
	
});



// Property Inspector for b2Body
UI.BodyPropertyInspector = UI.PropertyInspector.extend({
	init: function(body) {
		this._super();
		this._section = "Body";
		this.type = "BodyPropertyInspector";
		this._propertyMap = {
			Position: function() {return XMath.round(body.GetPosition().x, 5) + ", " + XMath.round(body.GetPosition().y, 5);},
			Rotation: function() {return XMath.round(XMath.rad2deg(body.GetAngle()) % 360.0, 5);},
			Mass: body.GetMass(),
			Type: function() { return body.GetType(); }
		};
		this._propertyEditors = {
			Type: {
				type: "selectone",
				options: {0: "static", 1: "kinematic", 2: "dynamic"},
				onChange: function(newState) {
					body.SetType(newState);
				}
			}
		};
		
	}
});

UI.GridInspector = UI.PropertyInspector.extend({
	init: function() {
		this._super();
		this._draw = new Box2D.Dynamics.b2DebugDraw;
		this.type = "GridInspector";
		this._ctx = null;
	},
	
	_drawGrid: function() {
		var limitX = this._ctx.canvas.width/2.0/this._scale;
		var limitY = this._ctx.canvas.height/2.0/this._scale;
		var step = 0.1;
		var p1 = new b2Vec2();
		var p2 = new b2Vec2();
		var p3 = new b2Vec2();
		var p4 = new b2Vec2();
		var color = new b2Color(0.3, 0.3, 0.3);
		for (var sx = 0, sy = 0; sx < limitX; sx += step, sy += step) {
			if (sx == 0) {
				color.Set(0.55, 0.55, 0.55);
			} else if (Math.floor(sx/(step*5)) == sx/(step*5)) {
				color.Set(0.4, 0.4, 0.4);
			} else {
				color.Set(0.3, 0.3, 0.3);				
			}
			p1.Set(sx, -limitY);
			p2.Set(sx, limitY);
			p1.Add(this._center);
			p2.Add(this._center);
			p3.Set(-limitX, sy);
			p4.Set(limitX, sy);
			p3.Add(this._center);
			p4.Add(this._center);
			this._draw.DrawSegment(p1, p2, color);
			this._draw.DrawSegment(p3, p4, color);
			
			if (sx > 0) {
				p1.Set(-sx, -limitY);
				p2.Set(-sx, limitY);
				p1.Add(this._center);
				p2.Add(this._center);
				this._draw.DrawSegment(p1, p2, color);
				p3.Set(-limitX, -sy);
				p4.Set(limitX, -sy);
				p3.Add(this._center);
				p4.Add(this._center);
				this._draw.DrawSegment(p3, p4, color);
			}
		}
	}
});

UI.MiniView = UI.PropertyInspector.extend({
    init: function() {
		this._super();
		this.type = "MiniView";
	},
	
	setupDom: function(parent) {
		var dom = $('<div class="poserDesigner" id="PROP-'+this._id+'"></div>');
		$(dom).append('<canvas id="miniView" width="370" height="240"></canvas>');
		$(parent).prepend(dom);
	}
});

UI.ViechPoserDesigner = UI.GridInspector.extend({
	init: function(viech) {
		this._super();
		this._viech = viech;
		this.type = "ViechPoserDesigner";

		// check if poser is already there
		var currentController = this._viech.getController();
		if (!currentController) {
			currentController = new ActorControllers.Viech.Poser();
			this._viech.setController(currentController);
		} else if (currentController.type == "Stand") {
			
		}
	},
	
	setupDom: function(parent) {
		var dom = $('<div class="poserDesigner" id="PROP-'+this._id+'"></div>');
		$(dom).append('<canvas width="370" height="370"></canvas>');
		var tb = $('<div class="toolbar" id="posertoolbar"><ul id="syncGroup" class="toolgroup left switchgroup"><li id="connectTransforms" class="button"><div class="icon connect" title="connect transforms"></div></li><li id="disconnectTransforms" class="button"><div class="icon disconnected" title="disconnect transforms"></div></li><li id="enableKinect" class="button"><div class="icon kinect" title="enable kinect"></div></li></ul></div>');
		$(dom).append(tb);
		var slider = $('<input class="rotationslider" data-bone="" type="range" min="0" max="360" value="0">');
		$(slider).change($.proxy(function(e){
			this._rotationChange($(slider).val(), $(slider).attr("data-bone"));
		}, this));
		$(dom).append(slider);
		$(dom).append('<div class="bonename"></div>');
		this._ctx = $("canvas", dom).get(0).getContext("2d");

		this._scale = this.toolbar._scene._scaleFactor;
		this._draw.SetSprite(this._ctx);
		this._draw.SetDrawScale(this._scale);
		this._draw.SetFillAlpha(0.3);
		this._draw.SetLineThickness(1.0);
		this._draw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);//| b2DebugDraw.e_centerOfMassBit);
		this._center = new b2Vec2(this._ctx.canvas.width/2.0/this._scale, this._ctx.canvas.height/2.0/this._scale);
		$(parent).append(dom);
		$("canvas", dom).click($.proxy(this._onDesignerClick,this));
		$("#connectTransforms", dom).click($.proxy(this._onConnectPose, this));
		$("#disconnectTransforms", dom).click($.proxy(this._onDisconnectPose, this));
		var self = this;
		
		// check for kinect 
		if (window.zig && window.zig.sensorConnected) {
			$("#enableKinect", dom).click(function(){
				if ($(this).hasClass('selected')) {
					self._disableKinectInterface();
				} else {
					self._enableKinectInterface();
				}
				$(this).toggleClass('selected');
			});	
		}
	},
	
	removeDom: function() {
		this._disableKinectInterface();
		this._super();
	},
	
	_enableKinectInterface: function() {
		this._kinectview = new UI.KinectView(this._viech, this);
		this.toolbar.addInspector(this._kinectview);
	},
	
	_disableKinectInterface: function() {
		if (this._kinectview) {
			this.toolbar.removeInspector(this._kinectview);
			delete this._kinectview;
		}
	},

	_buildPoseDef: function() {
		// set pose
		var poseDef = {};
		
		for (var jn in this._viech.joints) {
			var boneName = jn.split('__')[1];
			poseDef[jn] = XMath.rad2deg(this._viech.bones[boneName].a);
		}
		
		return poseDef;
	},
	
	_onConnectPose: function() {
		this._updatePose = true;
		this._viech.updatePoseInput(this._buildPoseDef());
	},
	
	_onDisconnectPose: function() {
		this._updatePose = false;
		this._viech.updatePoseInput(null);
	},
	
	_onDesignerClick: function(e) {
		
		// get mouse position in local coordinates
		var designerCanvas = $("#PROP-"+this._id).find('canvas');
		var mouseX = (e.pageX - designerCanvas.offset().left) / this._scale - this._center.x;
		var mouseY = (e.pageY - designerCanvas.offset().top) / this._scale - this._center.y;
		
		// do hit test for bones
		var sel = this._queryBone(this._viech.bones.torsoL, new b2Transform(), new b2Vec2(mouseX, mouseY));
		
		if (sel) {
			// find bone with name
			var boneName;
			for (var b in this._viech.bones) {
				if (sel == this._viech.bones[b])
					boneName = b;
			}
			
			// attach controls to bone
			this._attachBoneControls(boneName);
		}
	},
	
	_attachBoneControls: function(b) {
		var slider = $("#PROP-"+this._id).find('.rotationslider');
		var bone = this._viech.bones[b];
		if (!bone) {
			$(slider).hide();
			return;
		}
				
		$(slider).attr("data-bone", b);
		$(slider).attr("value", XMath.rad2deg(bone.a));
		$(slider).attr("min", XMath.rad2deg(bone.aMin));
		$(slider).attr("max", XMath.rad2deg(bone.aMax));
		$(slider).show();
		
		$("#PROP-"+this._id).find('.bonename').html(b);
	},
	
	
	_rotationChange: function(a, boneName) {
		
		var bone = this._viech.bones[boneName];
		if (bone) {
			bone.a = XMath.deg2rad(a);
		}
	},
	
	_queryBone: function(bone, dxf, point) {

		// store matrix
		var xf = new b2Transform();
	 	xf.Set(dxf);
	
		// translate and rotate origin
		dxf.position.Add(b2Math.MulMV(dxf.R, new b2Vec2(bone.x, bone.y)));
		dxf.R = b2Math.MulMM(dxf.R, b2Mat22.FromAngle(bone.a));
		
		// test line circle selection
		var p1 = b2Math.MulX(dxf, new b2Vec2(0, 0));
		var p2 = b2Math.MulX(dxf, new b2Vec2(bone.vx*bone.l, bone.vy*bone.l));
	
	    var dir = b2Math.SubtractVV(p2, p1);
	    var diff = b2Math.SubtractVV(point, p1);
	    var t = b2Math.Dot(diff, dir) / b2Math.Dot(dir, dir);
	    if (t < 0.0)
	        t = 0.0;
	    if (t > 1.0)
	        t = 1.0;
		
		dir.Multiply(t)
	    var closest = b2Math.AddVV(p1, dir);
	    var d = b2Math.SubtractVV(point, closest);
	    var distsqr = b2Math.Dot(d, d);
		var r = 0.025;
	    if (distsqr <= r * r) {
			return bone;
		}
			
		// translate forward along the bone
		dxf.position.Add(b2Math.MulMV(dxf.R, new b2Vec2(bone.vx*bone.l, bone.vy*bone.l)));
		
		// search children recursively
		for (var b in bone.children) {
			var found = this._queryBone(bone.children[b], dxf, point);
			if (found)
				return found;
		}

		// restore matrix
		dxf.Set(xf);
	},
	
	updateValues: function() {

		// clear 
		this._draw.m_sprite.graphics.clear();
		
		// draw grid
		this._drawGrid();
		
		// update poses
		if (this._updatePose == true) {
			this._viech.updatePoseInput(this._buildPoseDef());
		}
		
		var dXf = new b2Transform();
		// this._drawPart(this._viech.parts.torsoL, null, dXf);
		this._drawBone(this._viech.bones.torsoL, dXf);
	},
	
	_drawBone: function(bone, dxf) {

		// store matrix
		var xf = new b2Transform();
	 	xf.Set(dxf);
	
		// translate and rotate origin
		dxf.position.Add(b2Math.MulMV(dxf.R, new b2Vec2(bone.x, bone.y)));
		dxf.R = b2Math.MulMM(dxf.R, b2Mat22.FromAngle(bone.a));
		
		// draw bone
		dxf.position.Add(this._center);
		this._draw.DrawCircle(b2Math.MulX(dxf, new b2Vec2(0, 0)), 0.05, new b2Color(1, 0.3, 0.3));
		this._draw.DrawCircle(b2Math.MulX(dxf, new b2Vec2(bone.vx*bone.l, bone.vy*bone.l)), 0.025, new b2Color(0.3, 1, 0.3));
		this._draw.DrawSegment(b2Math.MulX(dxf, new b2Vec2(0, 0)), b2Math.MulX(dxf, new b2Vec2(bone.vx*bone.l, bone.vy*bone.l)), new b2Color(0.3, 0.3, 1));
		dxf.position.Subtract(this._center);

		// draw body part attached to bone
		var sxf = new b2Transform();
		sxf.Set(dxf);
		sxf.position.Add(b2Math.MulMV(sxf.R, new b2Vec2(bone.px, bone.py)));				
		sxf.position.Add(this._center);
		this._drawShape(bone.part.GetFixtureList().GetShape(), sxf, new b2Color(1, 1, 1));
		sxf.position.Subtract(this._center);
		
		// translate forward along the bone
		dxf.position.Add(b2Math.MulMV(dxf.R, new b2Vec2(bone.vx*bone.l, bone.vy*bone.l)));
		
		// draw children recursively
		for (var b in bone.children) {
			this._drawBone(bone.children[b], dxf);
		}

		// restore matrix
		dxf.Set(xf);
	},
	
	_drawShape: function (shape, xfc, color) {
		
		switch (shape.m_type) {
			case b2Shape.e_circleShape:
			{
				var circle = ((shape instanceof b2CircleShape ? shape : null));
				var center = b2Math.MulX(xfc, circle.m_p);
				var radius = circle.m_radius;
				var axis = xfc.R.col1;
				this._draw.DrawSolidCircle(center, radius, axis, color);
			}
			break;
			case b2Shape.e_polygonShape:
			{
				var poly = ((shape instanceof b2PolygonShape ? shape : null));
				var vertexCount = parseInt(poly.GetVertexCount());
				var localVertices = poly.GetVertices();
				var vertices = new Vector(vertexCount);
				for (var i=0; i < vertexCount; ++i) {
					vertices[i] = b2Math.MulX(xfc, localVertices[i]);
				}
				this._draw.DrawSolidPolygon(vertices, vertexCount, color);
			}
			break;
			case b2Shape.e_edgeShape:
			{
				var edge = (shape instanceof b2EdgeShape ? shape : null);
				this._draw.DrawSegment(b2Math.MulX(xfc, edge.GetVertex1()), b2Math.MulX(xfc, edge.GetVertex2()), color);
			}
			break;
		}
	}	

});


UI.KinectView = UI.GridInspector.extend({
	init: function(viech, boneview) {
		this._super();
		this._viech = viech;
		this._boneview = boneview;
		this._engager = zig.EngageUsersWithSkeleton(1);
		this._user = null;
		this.type = "KinectView";
	},
	
	setupDom: function(parent) {
		var dom = $('<div class="kinectView" id="PROP-'+this._id+'"></div>');
		$(dom).append('<canvas width="370" height="370"></canvas>');
		this._ctx = $("canvas", dom).get(0).getContext("2d");

		this._scale = this.toolbar._scene._scaleFactor;
		this._draw.SetSprite(this._ctx);
		this._draw.SetDrawScale(this._scale);
		this._draw.SetFillAlpha(0.3);
		this._draw.SetLineThickness(1.0);
		this._center = new b2Vec2(this._ctx.canvas.width/2.0/this._scale, this._ctx.canvas.height/2.0/this._scale);
		$(parent).append(dom);
		this._drawGrid();
		this._hookupZig();
	},
	
	removeDom: function() {
		zig.removeListener(this._engager);
		this._engager = null;
		this._super();
	},
	
	_hookupZig: function() {
		var self = this;
		this._engager.addEventListener('userengaged', function(user) {
			console.log('User engaged: ' + user.id);
			user.addEventListener('userupdate', $.proxy(self._userUpdate, self));
			this._user = user;
		});
		this._engager.addEventListener('userdisengaged', function(user) {
			console.log('User disengaged: ' + user.id);
			this._user = null;
		});
		zig.addListener(this._engager);
	},
	
	_userUpdate: function(user) {
		// clear 
		this._draw.m_sprite.graphics.clear();
		
		// draw grid
		this._drawGrid();
		
		// translate and rotate skeleton data
		for (var i in user.skeleton) {
			var p = user.skeleton[i].position;
			var cth = Math.cos(Math.PI/2);
			var sth = Math.sin(Math.PI/2);
			user.skeleton[i].position[0] = cth*p[0]+sth*p[2]-user.skeleton[3].position[2];
			user.skeleton[i].position[1] = p[1] - user.skeleton[21].position[1];
		}

		// Torso: 3		
		// Head: 1
		// Neck: 2

		// LeftElbow: 7
		// LeftFoot: 20
		// LeftHand: 9
		// LeftHip: 17
		// LeftKnee: 18
		// LeftShoulder: 6

		// RightElbow: 13
		// RightFoot: 24
		// RightHand: 15
		// RightHip: 21
		// RightKnee: 22
		// RightShoulder: 12

		var v;
		// torsoM
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[3].position[0], user.skeleton[3].position[1]),
						  	  new b2Vec2(user.skeleton[17].position[0], user.skeleton[17].position[1]));
		this._viech.bones.torsoM.a = Math.atan(v.y/v.x) - Math.PI/2 + ((v.x<0) ? Math.PI : 0);
		// torsoU
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[2].position[0], user.skeleton[2].position[1]),
						  	  new b2Vec2(user.skeleton[3].position[0], user.skeleton[3].position[1]));
		this._viech.bones.torsoU.a = Math.atan(v.y/v.x) - Math.PI/2 + ((v.x<0) ? Math.PI : 0)
								   - this._viech.bones.torsoM.a;
		// head
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[1].position[0], user.skeleton[1].position[1]),
						  	  new b2Vec2(user.skeleton[2].position[0], user.skeleton[2].position[1]));
		this._viech.bones.head.a = Math.atan(v.y/v.x) - Math.PI/2 + ((v.x<0) ? Math.PI : 0)
								   - this._viech.bones.torsoU.a;

		// legU1
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[18].position[0], user.skeleton[18].position[1]),
						  	  new b2Vec2(user.skeleton[17].position[0], user.skeleton[17].position[1]));
		this._viech.bones.legU1.a = Math.atan(v.y/v.x) - Math.PI/2 - Math.PI + ((v.x<0) ? Math.PI : 0);
		// legL1
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[20].position[0], user.skeleton[20].position[1]),
						  	  new b2Vec2(user.skeleton[18].position[0], user.skeleton[18].position[1]));
		this._viech.bones.legL1.a = Math.atan(v.y/v.x) - Math.PI/2 - Math.PI + ((v.x<0) ? Math.PI : 0)
									- this._viech.bones.legU1.a;

		// legU2
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[22].position[0], user.skeleton[22].position[1]),
						  	  new b2Vec2(user.skeleton[21].position[0], user.skeleton[21].position[1]));
		this._viech.bones.legU2.a = Math.atan(v.y/v.x) - Math.PI/2 - Math.PI + ((v.x<0) ? Math.PI : 0);
		// legL2
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[24].position[0], user.skeleton[24].position[1]),
						  	  new b2Vec2(user.skeleton[22].position[0], user.skeleton[22].position[1]));
		this._viech.bones.legL2.a = Math.atan(v.y/v.x) - Math.PI/2 - Math.PI + ((v.x<0) ? Math.PI : 0)
									- this._viech.bones.legU2.a;
		
		// armU1
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[7].position[0], user.skeleton[7].position[1]),
						  	  new b2Vec2(user.skeleton[6].position[0], user.skeleton[6].position[1]));
		this._viech.bones.armU1.a = Math.atan(v.y/v.x) + Math.PI + ((v.x<0) ? Math.PI : 0)
									- this._viech.bones.torsoU.a;
		// armL1
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[9].position[0], user.skeleton[9].position[1]),
						  	  new b2Vec2(user.skeleton[7].position[0], user.skeleton[7].position[1]));
		this._viech.bones.armL1.a = Math.atan(v.y/v.x) + Math.PI + ((v.x<0) ? Math.PI : 0)
									- this._viech.bones.armU1.a;

		// armU2
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[13].position[0], user.skeleton[13].position[1]),
						  	  new b2Vec2(user.skeleton[12].position[0], user.skeleton[12].position[1]));
		this._viech.bones.armU2.a = Math.atan(v.y/v.x) + Math.PI + ((v.x<0) ? Math.PI : 0)
									- this._viech.bones.torsoU.a;
		// armL2
		v = b2Math.SubtractVV(new b2Vec2(user.skeleton[12].position[0], user.skeleton[12].position[1]),
						  	  new b2Vec2(user.skeleton[15].position[0], user.skeleton[15].position[1]));
		this._viech.bones.armL2.a = Math.atan(v.y/v.x) + ((v.x<0) ? Math.PI : 0)
									- this._viech.bones.armU2.a;

		// draw skeleton
		for (var i in user.skeleton) {
			var jp = new b2Vec2(user.skeleton[i].position[0], user.skeleton[i].position[1]);
			jp.Multiply(1/(this._scale*5));
			jp.y = jp.y * -1;

			jp.Add(this._center);
			this._draw.DrawCircle(jp, 0.025, new b2Color(1,1,1));

			// draw label
			var label = 'n/a';
			for (var j in zig.Joint) {
				if (zig.Joint[j] == i)
					label = j;
			}
			
			var ctx = this._ctx;
            ctx.strokeStyle="0xff0000";
            ctx.fillStyle = "white";
            ctx.fillText(label, jp.x*this._scale, jp.y*this._scale);
		}
		
		// tell bone view to redraw
		this._boneview.updateValues();
	}
	
});

