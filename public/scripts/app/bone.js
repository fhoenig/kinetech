
// CLASS Bone - for skeletal animation
var Bone = Class.extend({

	init: function(x, y, l, a, parent, vx, vy, part, px, py) {
		this.x = x;
		this.y = y;
		this.l = l;
		this.a = a;
		this.vx = vx;
		this.vy = vy;
		this.part = part;
		this.px = px;
		this.py = py;
		this.aMin = false;
		this.aMax = false;
		
		if (parent) {
			this.parent = parent;
			parent.children.push(this);
		} else {
			parent = null;
		}

		// var p = this.parent;
		// var t = 0;
		// while (p != null) {
		// 	t += p.l;
		// 	p = p.parent;
		// }
		// if (vy > 0) {
		// 	this.partOffset = Math.abs(this.part.m_exf.position.y) - t + this.y;
		// } else if (vy < 0) {
		// 	this.partOffset =  t - Math.abs(this.part.m_exf.position.y);
		// } else if (vx > 0) {
		// 	this.partOffset = Math.abs(this.part.m_exf.position.x) + t + this.x;
		// } else if (vx < 0) {
		// 	this.partOffset = Math.abs(this.part.m_exf.position.x) - t + this.x;
		// }
		// console.log(this.partOffset);
		this.children = [];
	}
});