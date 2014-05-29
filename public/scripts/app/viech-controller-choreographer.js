// 
//  viech-controller-choreographer.js
//  trees
//  
//  Created by Florian Hoenig on 2013-05-14.
//  Copyright 2013 Florian Hoenig. All rights reserved.
// 


// 
// Choreographer Controller
// 
// Bundles multiple controllers and switches between them based on a time table
// 
ActorControllers.Viech.Choreographer = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Choreographer";
		
		this.sequence = [
            {duration: 35, torqueIncrease: true, torqueIncreaseTime: 50, timeScale: 0.1, controller: ActorControllers.Viech.SimpleRandom},
            {duration: 100, torqueIncrease: true, torqueIncreaseTime: 100, timeScale: 0.5, controller: ActorControllers.Viech.Noise},
            {duration: 42, torqueIncrease: false, torqueIncreaseTime: 300, timeScale: 1.0, controller: ActorControllers.Viech.Learner2},
            {duration: 100, torqueIncrease: false, torqueIncreaseTime: 1, timeScale: 1.25, controller: ActorControllers.Viech.Noise2},
            {duration: 100, torqueIncrease: true, torqueIncreaseTime: 100, timeScale: 0.75, controller: ActorControllers.Viech.Swimmer},
            {duration: 73, torqueIncrease: true, torqueIncreaseTime: 73, timeScale: 1.0, controller: ActorControllers.Viech.Noise2},
                        // solo
            {duration: 117, torqueIncrease: false, torqueIncreaseTime: 300, timeScale: 1.0, controller: ActorControllers.Viech.Up},
		    {duration: 140, torqueIncrease: true, torqueIncreaseTime: 5, timeScale: 1.0, controller: ActorControllers.Viech.Noiseposer},
		    {duration: 100, torqueIncrease: true, torqueIncreaseTime: 100000, timeScale: 1.0, controller: ActorControllers.Viech.Noiseposer}
		];
		this.currentAct = -1;
		this.actDuration = 0;
		this.currentController = null;
		this.nextActAt = 0;
		this.hasEnded = false;
		this.torqueIncrease = false;
		this.torqueIncreaseTime = 100;
		this.totalTime = 0;
		this.timeScale = 1.0;
		for (var i=0; i<this.sequence.length; i++) {
		    this.totalTime += this.sequence[i].duration;
		}
	},
	
	setNextController: function()
	{
	    this.currentAct++;
	    
	    if (this.currentAct < this.sequence.length) {
    	    this.currentController = new (this.sequence[this.currentAct].controller)();
    	    this.torqueIncrease = this.sequence[this.currentAct].torqueIncrease;
    	    this.torqueIncreaseTime = this.sequence[this.currentAct].torqueIncreaseTime;
    	    this.timeScale = this.sequence[this.currentAct].timeScale;
    	    this.actDuration = this.sequence[this.currentAct].duration;
    	    this.currentController.setActor(this._actor);
    	    this.nextActAt = this.getControllerTime() + this.sequence[this.currentAct].duration;
	    }
	    else {
	        // end
	        this.currentController.setActor(null);
	        delete this.currentController;
    	    this.currentController = null;
    	    this.hasEnded = true;
    	    console.log('finito');
	    }
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;

		if (this.getControllerTime() >= this.nextActAt && this.hasEnded == false) {
		    this.setNextController();
		}
		else if (this.currentController != null) {
		    var th = (this.torqueIncrease) ? (this.currentController.getControllerTime() / this.torqueIncreaseTime) : 1.0;
		    this.currentController.update(dt*this.timeScale, ts*this.timeScale);
		    for (var jn in v.joints) {
                v.joints[jn].SetMaxMotorTorque(XMath.lerp(0, v.getFatiguedMuscleTorque(jn), th));
                // if (v.joints[jn].IsMotorEnabled()) {
                //     v.joints[jn].SetMotorSpeed(v.joints[jn].GetMotorSpeed()*th*th);
                // }
                
            }
		} 
		else {
            for (var jn in v.joints) {
                v.joints[jn].EnableMotor(false);
            }
		}
	}
});

