/* JavaScript File */

/* get canvas by id */
var canvas = document.getElementById("drawlayout");
var divmodule = document.getElementById("canvas-container");
canvas.width = 960;
canvas.height = 612;

/********************************** variables declaration **********************************/
var ctx = canvas.getContext("2d"),          // 2-d canvas                                  **
    nodes = data.nodes,                     // nodes data in miserables.json               **
    links = data.links,                     // edges data in miserables.json               **
    graph_links = [],                       // determine whether a node is being linking   **
    group_color = [],                       // color of each node gruop                    **
    group_num = 0,                          // total number of node groups                 **
	max_value = 0,                          // biggest value of links between nodes        **
    radius = 4,                             // the radius of nodes                         **
    nodeclick = -1,                         // determine whether a node is being clicked   **
    interval = 1,                           // the interval time in fuction setInterval()  **
    map = {},                               // map from data name to NO.                   **
    letters = "0123456789ABCDEF".split(""), // color letters                               **
    color = "#",                            // color variable                              **
    K = 200,                                // a constant in force model                   **
    C = 2,                                  // a constant in force model                   **
	force = new Array(nodes.length),        // force array of all nodes                    **
    barycenter = { x : 0, y : 0};           // the barycenter position of all nodes        **
/*******************************************************************************************/

for (var i = 0; i < nodes.length; i++)
    map[nodes[i].id] = i;
// build relations between names and indices of nodes

for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].group > group_num)
        group_num = nodes[i].group;
} // find the total num of groups

for (var i = 0; i < links.length; i++) {
    if (links[i].value > max_value)
        max_value = links[i].value;
} // find the biggest value of links

for (var i = 0; i < nodes.length; i++) { 
    for (var j = 0; j < 6; j++)
        color += letters[Math.round(Math.random() * 15)];
    group_color[i] = color;
    color = "#";
} // random color for each group

function init_layout(){
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].x = (2 * Math.random() - 1) * canvas.width * 0.2 + canvas.width * 0.5;
        nodes[i].y = (2 * Math.random() - 1) * canvas.height * 0.2 + canvas.height * 0.5;
        // initiation of coordinates

        nodes[i].press = false; 
        nodes[i].color = group_color[nodes[i].group];
        // nodes in one group share the same color        
    }

    for (var i = 0; i < nodes.length; i++) {
        graph_links[i] = new Array(nodes.length);
        for(var j = 0; j < nodes.length; j++)
            graph_links[i][j] = false;
        // edges initiation
    }

    for (var i = 0; i < links.length; i++) {
        graph_links[map[links[i].source]][map[links[i].target]] = true;
        graph_links[map[links[i].target]][map[links[i].source]] = true;
    } // edges layout
}

function draw_layout() {
    for (var i = 0; i < links.length; i++){
        ctx.strokeStyle = "rgba(180, 180, 180, 0.75)";
        // color of lines

        ctx.beginPath();
        ctx.lineWidth = 1 + 4.5 * links[i].value / max_value;
        // the width of lines is determined by their values
        // the bigger its value is, the thicker the line will be

        ctx.moveTo(nodes[map[links[i].source]].x, nodes[map[links[i].source]].y);
        ctx.lineTo(nodes[map[links[i].target]].x, nodes[map[links[i].target]].y);
        // draw lines between nodes

        ctx.stroke();
        ctx.closePath();
    }

    for (var i = 0; i < nodes.length; i++){
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, radius * 1.4, 0, 2 * Math.PI, false);
        ctx.arc(nodes[i].x, nodes[i].y, radius * 1.0, 2 * Math.PI, 0, false);
        ctx.fillStyle = "white";
        ctx.closePath();
        // this area is like a circle ring
        // we fill this area with white color, which probably contributes to aesthetics
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = nodes[i].color;
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = nodes[i].color;
        // we fill the inner domain with its relative color
    }
}

/* the object of vector in Euclidean space */
var vector = {
	x: 0, y: 0, // members
	create : function(x = 0, y = 0) {
		var vec = Object.create(vector);
		vec.x = x; vec.y = y;
		return vec;
	}, // constructor
	
	plus : function(vec)
	{ // plus a vector
		return vector.create(this.x + vec.x, this.y + vec.y);
	},
	
	minus : function(vec)
	{ // minus a vector
		return vector.create(this.x - vec.x, this.y - vec.y);
	},
	
	sca_multi : function(factor)
	{ // scalar-multiply
		return vector.create(this.x * factor, this.y * factor);
	},
	
	norm : function()
	{ // normalize a vector
		var size = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
		return vector.create(this.x / size, this.y / size);
	}
}

/* the model of repulsive force and attractive force */
function dist(_my_node1, _my_node2) {
    return Math.sqrt(Math.pow(_my_node1.x - _my_node2.x, 2) + 
                     Math.pow(_my_node1.y - _my_node2.y, 2));
}

function repu_force(_my_node1, _my_node2) {
    var force = C * K / (Math.pow(dist(_my_node1, _my_node2), 2));
    if (_my_node1.group == _my_node2.group)
        force /= 2;
	// weaker repulsive force between two nodes in the same group

    var repu_vec = vector.create(_my_node1.x - _my_node2.x, 
	                             _my_node1.y - _my_node2.y);
    return repu_vec.norm().sca_multi(force);
}

function attr_force(_my_node1, _my_node2) {
    var force = dist(_my_node1, _my_node2) / K;
	// here we use another force model
	
    var attr_vec = vector.create(_my_node2.x - _my_node1.x,
	                             _my_node2.y - _my_node1.y);
    return attr_vec.norm().sca_multi(force);
}

/* the animation */
function mouse_pos() {
    var mpos = 
	{ // create an mouse object
        x: 0, y: 0
    }; 
    var event = arguments[0] || window.event;
	// consider compatibility in different rendering engines
	
	var bbox = canvas.getBoundingClientRect();
	// to get the relative position of canvas
	
    mpos.x = event.clientX - bbox.left * (canvas.width / bbox.width);
    mpos.y = event.clientY - bbox.top * (canvas.height / bbox.height);
	
    return mpos;
}

function activate_click()
{ // this function choose which node is being clicked
    var mpos = mouse_pos();
    for (var i = 0; i < nodes.length; i++)
        if(dist(nodes[i], mpos) <= 3 * radius)
		{ // at most one node can be clicked one time
            nodes[i].press = true;
            nodeclick = i;
			break;
        }
}

function move_node()
{ // this function move the chosen node to new position
    var mpos = mouse_pos();
    if (nodeclick == -1) return;
	// no node is chosen
	
    nodes[nodeclick].x = mpos.x;
    nodes[nodeclick].y = mpos.y;
    // modify the coordinates
	
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_layout();
	// clear canvas and draw layout again
}

function deactivate_click()
{ // this function disarms activate status
    if (nodeclick == -1) return;
	// no node is chosen
	
    nodes[nodeclick].press = false;
    nodeclick = -1;
}

function update_layout() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
	// first clear rectangle area to update
    
    for (var i = 0; i < nodes.length; i++)
    { // calculate the barycenter position
        barycenter.x += nodes[i].x;
        barycenter.y += nodes[i].y;
    }

    barycenter.x /= nodes.length;
    barycenter.y /= nodes.length;
    gravity = vector.create(480 - barycenter.x, 306 - barycenter.y)
        .sca_multi(1.6);

    for (var i = 0; i < nodes.length; i++)
	{ // calculate the force of each node at current status
        force[i] = vector.create();
        for(var j = 0; j < i; j++) {
            var subforce = attr_force(nodes[i], nodes[j]).sca_multi(Number(graph_links[i][j]))
			             . plus(repu_force(nodes[i], nodes[j]));
			// only linked nodes have attractive force
            force[i] = force[i].plus(subforce);
            force[j] = force[j].minus(subforce);
        }
    }

    for (var i = 0; i < nodes.length; i++)
	{ // update coordinates of all nodes
        if(nodes[i].press == false) {
            nodes[i].x += C * force[i].x + gravity.x;
            nodes[i].y += C * force[i].y + gravity.y;
        }
    }
	
    draw_layout();
}

/* the mouse event is consist of 3 subevents below */
canvas.addEventListener("mousedown", activate_click, false);
canvas.addEventListener("mousemove", move_node, false);
canvas.addEventListener("mouseup", deactivate_click, false);

/* initiate and update layout */
init_layout();
setInterval(update_layout, interval);
