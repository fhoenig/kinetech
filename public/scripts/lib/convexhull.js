var GrahamScan = {

    /**
     *  The Graham scan is a method of computing the convex hull of a finite set of points 
     *  in the plane with time complexity O(n log n). It is named after Ronald Graham, who 
     *  published the original algorithm in 1972. The algorithm finds all vertices of 
     *  the convex hull ordered along its boundary. It may also be easily modified to report 
     *  all input points that lie on the boundary of their convex hull.
     */
    

    /**
     *  Returns a convex hull given an unordered array of points.
     */
    convexHull: function(data)
    {
        return this.findHull(this.order(data));
    },

    /**
     *  Orders an array of points counterclockwise.
     */
    order: function(data)
    {
        // first run through all the points and find the upper left [lower left]
        var p = data[0];
        var n = data.length;
        for (var i = 1; i < n; i++)
        {
            if(data[i][1] < p[1])
            {
                //trace("   d[0] < p[0] / d is new p.");
                p = data[i];
            }
            else if(data[i][1] == p[1] && data[i][0] < p[0])
            {
                p = data[i];
            }
        }
        // next find all the cotangents of the angles made by the point P and the
        // other points
        var sorted = new Array();
        // we need arrays for positive and negative values, because Array.sort
        // will put sort the negatives backwards.
        var pos    = new Array();
        var neg    = new Array();
        // add points back in order
        for (i = 0; i < n; i++)
        {
            var a  = data[i][0] - p[0];
            var b  = data[i][1] - p[1];
            var cot = b/a;
            if(cot < 0)
                neg.push({point:data[i], cotangent:cot});
            else
                pos.push({point:data[i], cotangent:cot});
        }
        // sort the arrays
        // pos.sortOn("cotangent", Array.NUMERIC | Array.DESCENDING);
		pos.sort(function(a, b) { return b.cotangent - a.cotangent; });
        // neg.sortOn("cotangent", Array.NUMERIC | Array.DESCENDING);
		neg.sort(function(a, b) { return b.cotangent - a.cotangent; });

        sorted = neg.concat(pos);
        
        var ordered  = new Array();
            ordered.push(p);
        for (i = 0; i < n; i++)
        {
            if(p == sorted[i].point)
                continue;
            ordered.push(sorted[i].point);
        }
		
        return ordered;
    },
    /**
     *  Given an array of points ordered counterclockwise, findHull will 
     *  filter the points and return an array containing the vertices of a
     *  convex polygon that envelopes those points.
     */
    findHull: function(data)
    {
        var n = data.length;
        var hull  = new Array();
            hull.push(data[0]); // add the pivot
            hull.push(data[1]); // makes first vector
            
        for (var i = 2; i < n; i++)
        {
            while (this.direction(hull[hull.length - 2], hull[hull.length - 1], data[i]) >= 0)
                hull.pop();
            hull.push(data[i]);
        }
        
        return hull;
    },
    /**
     *
     */
    direction: function(p1, p2, p3)
    {
        // > 0  is right turn
        // == 0 is collinear
        // < 0  is left turn
        // we only want right turns, usually we want right turns, but
        // flash's grid is flipped on y.
        return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    }
};

