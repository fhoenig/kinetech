// 
//  viech-controller-scripts.js
//  trees
//  
//  Created by Florian Hoenig on 2013-03-26
//  Copyright 2013 Florian Hoenig. All rights reserved.
// 


// 
// Scripts Controller
// 
// Uses in browser code editor created controller scrtips
//

ControllerScriptTemplate = "";

ActorControllers.Viech.Scripts = ActorController.extend({
	
	init: function() {
		this._super();
		this.type = "Scripts";
		this.scripts = [
            {
                source: "",
                compiled: null
            }
        ];
        this.commentsPatters = new RegExp('^\w*\/\/.*$', "gm");
	},
	
	setSource: function(index, sourcecode) {
	    this.scripts[index].source = sourcecode.replace(this.commentsPatters, '');
	    console.log(this.scripts[index].source);
	    return this.compile(index);
	},
	
	compile: function(index) {
        try {
	        var compiled = (new Function("var ret = " + this.scripts[index].source + "\n return ret;"))();
	        this.scripts[index].compiled = compiled;
	        return true;
        } 
        catch(e) {
            console.log("compile error", e);
            return false;
        }
	},
	
	update: function(dt, ts) {
		this._super(dt, ts);
		var v = this._actor;
		
		for (var i=0; i<this.scripts.length; i++) {
		    var controller = this.scripts[i];
		    if (controller.compiled != null)
		        controller.compiled.update(ts, dt, v);
		}
		
        // 
        // for (var jn in v.joints) {
        //  if (Math.random() > 0.9) {
        //      v.joints[jn].EnableMotor(false);
        //  } else {
        //      v.joints[jn].EnableMotor(true);
        //      v.joints[jn].SetMaxMotorTorque(v.getFatiguedMuscleTorque(jn));
        //      var s = v.joints[jn].GetMotorSpeed();
        //      var range = Math.abs(v.jointAngularLimits[jn][0] - v.jointAngularLimits[jn][1]);
        //      v.joints[jn].SetMotorSpeed(s+XMath.randomGauss()/range*30);
        //  }
        // }
	}
});

