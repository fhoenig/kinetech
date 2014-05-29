// 
// Learner Controller
// 
// simple reinforcement learner for attempting to sit up
//
//

ActorControllers.Viech.Learner2 = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Learner2";
		this._nf = new SimplexNoiseN(1, 2);

		this._phase = "learn"; // {apply|learn|rest}
		this._episode = 0;
		this._restWork = 1000;
		this._lastRestWork = 0;
		this._restTime = 2; //seconds
		this._restStartTime = null;
		this._algorithm = new RL.Cacla({nHiddenQ: 100, nHiddenV: 20}, this);
		this._state = new RL.State(true, 16);
		this._nextState = new RL.State(true, 16);
		this._action = new RL.Action(true, 15);
		this._nextAction = new RL.Action(true, 15);
		this._epsilon = 0.5;
		this._explorationType = "egreedynoise";
	},
	
	getDiscreteStates: function() {
		// interface method for RL.Algorithm
		return false;
	},
	
	getActionDimension: function() {
		// interface method for RL.Algorithm
		return 15;
	},
	
	getStateDimension: function() {
		// interface method for RL.Algorithm
		return 16;
	},
		
	setActor: function(a) {
		this._super(a);
		this._lastRestWork = this._actor.getWorkDone();
		this.setPhase('learn');
	},
	
	_getDistanceHeadGround: function() {
		var ground = this._actor._scene._ground;
		var head = this._actor.parts.head;
		return Math.abs(ground.GetFixtureList().GetAABB().lowerBound.y - head.GetWorldCenter().y);
	},
	
	_getVerticalDistanceHeadFeet: function() {
		return (this._actor.parts.foot1.GetWorldCenter().y - this._actor.parts.head.GetWorldCenter().y) +
			(this._actor.parts.foot2.GetWorldCenter().y - this._actor.parts.head.GetWorldCenter().y);
	},
	
	_getHeadAngle: function() {
		// TODO: distance function is cyclic here. how does this affect the PCs?
		return XMath.rad2deg(this._actor.parts.head.GetAngle()) % 360.0;
	},
	
	_getReward: function() {
		return Math.pow(this._getVerticalDistanceHeadFeet() / 3.0, 2) - 1.0;// - this._actor.getTotalFatigue();
		// var diff = (this._getDistanceHeadGround() - this._initialHeadDistance);
		// this._initialHeadDistance = this._getDistanceHeadGround();
		// if (diff <= 0)
		// 	return -10.0 - this._actor.getTotalEffort()/15;
		// else return 10.0 - this._actor.getTotalEffort()/15;
	},
		
	_getState: function(state) {
		// builds the input vector from joint angles and head level
		var S = [];
		var v = this._actor;
		for (var jn in v.joints) {
			S.push(XMath.rad2deg(v.joints[jn].GetJointAngle()));
		}
		S.push(this._getHeadAngle());
		state.continuousState = S;
	},
		
	_applyAction: function(a) {
		var i=0;
		var v = this._actor;
		for (var jn in v.joints) {

			if (typeof a[i] == "boolean" && a[i] == false) {
				v.joints[jn].EnableMotor(false);
			} else {
				v.joints[jn].EnableMotor(true);
				v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));
				// var range = Math.abs(v.jointAngularLimits[jn][0] - v.jointAngularLimits[jn][1]);
				v.joints[jn].SetMotorSpeed(a[i]*2);
			}
			i++;
		}		
	},
	
	getEpisode: function() {
		return this._episode;
	},
	
	getRewardSum: function() {
		return this._rewardSum;
	},

	getExplorationType: function() {
		return this._explorationType;
	},
	
	getEpsilon: function() {
		return this._epsilon;
	},
	
	setEpsilon: function(e) {
		this._epsilon = parseFloat(e);
	},
	
	setExplorationType: function(t) {
		this._explorationType = t;
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
			
			case 'apply':
			
			break;
			
			case 'learn':
				// init first time step
				this._episode++;
			    this._rewardSum = 0.0;
				this._initialHeadDistance = this._getDistanceHeadGround();
			    this._getState(this._state);
			    this._algorithm.explore(this._state, this._action, this._epsilon, this._explorationType);
				this._applyAction(this._action.continuousAction);
			    this._endOfEpisode = true;
			break;
		}
	},
	
	
	update: function(dt, ts) {

		this._super(dt, ts);
		
		// var f = this._getDistanceHeadGround();
		switch (this._phase) {

			// rest phase: turn off all joint motors to relax
			case 'rest': {
				if (this._actor.getTotalFatigue() < 0.01) {
					this.setPhase('learn');
					return;
				}
				break;
			}

			// noise based exploratory movement
			case 'apply': {
				
				break;	
			}			

			case 'learn': {
				// immediate reward from last action
				this._reward = this._getReward();
				
				// new state
				this._getState(this._nextState);
				
				// exploration / next decision
		        this._algorithm.explore(this._nextState, this._nextAction, this._epsilon, this._explorationType);
		
		        this._rewardSum += this._reward;

		        this._endOfEpisode = ((this._actor.getWorkDone() - this._lastRestWork) >= this._restWork);
		
				// learner algorithm update
				this._algorithm.update(this._state, this._action, this._reward, this._nextState, this._endOfEpisode, [0.001, 0.001] /*rate*/, 0.95 /*gamma*/);
		        				
				// copy current to state/action
				this._state.continuousState = this._nextState.continuousState;
				this._action.continuousAction = this._nextAction.continuousAction;

				this._applyAction(this._action.continuousAction);
						
				if (this._endOfEpisode) {
					this.setPhase('rest');
				}

				break;				
			}

		}
	}
});
