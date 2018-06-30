// get canvas by id
var canvas = document.getElementById("drawlayout");
var divmodule = document.getElementById("canvas-container");
canvas.width = 960;
canvas.height = 612;

// variables declaration
var ctx = canvas.getContext("2d"),
    nodes = data.nodes,
    links = data.links,
    graph_links = [],
    group_color = [],
    group_num = 0,
    max_value = 0,
    radius = 4,
    nodeclick = -1,
    interval = 1,
    map = {},
    letters = "0123456789ABCDEF".split(""),
    color = "#",
    K = 200,
    C = 2,
    force = new Array(nodes.length),
    barycenter = { x : 0, y : 0 };

// Build relations between names and indices of nodes.
for (var i = 0; i < nodes.length; i++)
    map[nodes[i].id] = i;

// Find the total num of groups.
for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].group > group_num)
        group_num = nodes[i].group;
}

// find the biggest value of links
for (var i = 0; i < links.length; i++) {
    if (links[i].value > max_value)
        max_value = links[i].value;
}

// random color for each group
for (var i = 0; i < nodes.length; i++) { 
    for (var j = 0; j < 6; j++)
        color += letters[Math.round(Math.random() * 15)];
    group_color[i] = color;
    color = "#";
}

function init_layout() {
    // Initiation of coordinates.
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].x = (2 * Math.random() - 1) * canvas.width * 0.2 + canvas.width * 0.5;
        nodes[i].y = (2 * Math.random() - 1) * canvas.height * 0.2 + canvas.height * 0.5;

        // nodes in one group share the same color
        nodes[i].press = false; 
        nodes[i].color = group_color[nodes[i].group];
    }
    // Edges initiation
    for (var i = 0; i < nodes.length; i++) {
        graph_links[i] = new Array(nodes.length);
        for(var j = 0; j < nodes.length; j++)
            graph_links[i][j] = false;
    }
    // Edges layout.
    for (var i = 0; i < links.length; i++) {
        graph_links[map[links[i].source]][map[links[i].target]] = true;
        graph_links[map[links[i].target]][map[links[i].source]] = true;
    }
}

function draw_layout() {
    for (var i = 0; i < links.length; i++) {
        // color of lines
        ctx.strokeStyle = "rgba(180, 180, 180, 0.75)";

        // the width of lines is determined by their values
        // the bigger its value is, the thicker the line will be.
        ctx.beginPath();
        ctx.lineWidth = 1 + 4.5 * links[i].value / max_value;
        
        // draw lines between nodes
        ctx.moveTo(nodes[map[links[i].source]].x, nodes[map[links[i].source]].y);
        ctx.lineTo(nodes[map[links[i].target]].x, nodes[map[links[i].target]].y);

        ctx.stroke();
        ctx.closePath();
    }

    for (var i = 0; i < nodes.length; i++) {
        // This area is like a circle ring, filled with white color, which
        // probably contributes more to aesthetics.
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, radius * 1.4, 0, 2 * Math.PI, false);
        ctx.arc(nodes[i].x, nodes[i].y, radius * 1.0, 2 * Math.PI, 0, false);
        ctx.fillStyle = "white";
        ctx.closePath();
        ctx.fill();

        // We fill the inner domain with its relative color.
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = nodes[i].color;
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = nodes[i].color;
    }
}

/* the object of vector in Euclidean space */
var vector = {
    x: 0, y: 0, // members
    create : function(x = 0, y = 0) {
        var vec = Object.create(vector);
        vec.x = x; vec.y = y;
        return vec;
    },
    plus : function(vec)
    {
        return vector.create(this.x + vec.x, this.y + vec.y);
    },
    minus : function(vec)
    {
        return vector.create(this.x - vec.x, this.y - vec.y);
    },
    multi : function(factor)
    {
        return vector.create(this.x * factor, this.y * factor);
    },
    normalize : function()
    {
        var size = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        return vector.create(this.x / size, this.y / size);
    },
    dot : function(vec)
    {
        return this.x * vec.x + this.y * vec.y;
    }
}

// The model of repulsive force and attractive force.
function dist(_my_node1, _my_node2) {
    return Math.sqrt(Math.pow(_my_node1.x - _my_node2.x, 2) + 
                     Math.pow(_my_node1.y - _my_node2.y, 2));
}

function repu_force(_my_node1, _my_node2) {
    // Weaker repulsive force between two nodes in the same group so that
    // nodes in the same group can be gathered closely.
    var force = C * K / (Math.pow(dist(_my_node1, _my_node2), 2));
    if (_my_node1.group == _my_node2.group) force /= 2;    

    var repu_vec = vector.create(_my_node1.x - _my_node2.x, 
                                 _my_node1.y - _my_node2.y);
    return repu_vec.normalize().multi(force);
}

function attr_force(_my_node1, _my_node2) {
    // Here we use attractive force model.
    var force = dist(_my_node1, _my_node2) / K;    
    var attr_vec = vector.create(_my_node2.x - _my_node1.x,
                                 _my_node2.y - _my_node1.y);
    return attr_vec.normalize().multi(force);
}

function mouse_pos() {
    // Create a mouse object.
    // Consider compatibility in different rendering engines.
    var mpos = { x: 0, y: 0 };
    var event = arguments[0] || window.event;    
    var bbox = canvas.getBoundingClientRect();
    
    // Mouse event.
    mpos.x = event.clientX - bbox.left * (canvas.width / bbox.width);
    mpos.y = event.clientY - bbox.top * (canvas.height / bbox.height);
    return mpos;
}

// This function choose which node is being clicked.
function activate_click() {
    var mpos = mouse_pos();
    for (var i = 0; i < nodes.length; i++) {
        // At most one node can be clicked one time.
        if(dist(nodes[i], mpos) <= 3 * radius)
        {
            nodes[i].press = true;
            nodeclick = i;
            break;
        }
    }
}

// This function moves the chosen node to new position.
function move_node() {
    // No node is chosen.
    var mpos = mouse_pos();
    if (nodeclick == -1) return;
    
    // modify the coordinates
    nodes[nodeclick].x = mpos.x;
    nodes[nodeclick].y = mpos.y;
    
    // Clear canvas and draw layout again.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_layout();
}

// This function disarms activate status.
function deactivate_click()
{
    if (nodeclick == -1) return;    
    nodes[nodeclick].press = false;
    nodeclick = -1;
}

function update_layout() {
    // First clear rectangle area to update.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // calculate the barycenter position
    for (var i = 0; i < nodes.length; i++)
    {
        barycenter.x += nodes[i].x;
        barycenter.y += nodes[i].y;
    }
    barycenter.x /= nodes.length;
    barycenter.y /= nodes.length;
    gravity = vector.create(canvas.width  / 2 - barycenter.x,
                            canvas.height / 2 - barycenter.y).multi(1.6);
    
    // Calculate the force of each node at current status.
    for (var i = 0; i < nodes.length; i++)
    {
        force[i] = vector.create();
        for(var j = 0; j < i; j++) {
            var subforce = attr_force(nodes[i], nodes[j])
                .multi(Number(graph_links[i][j]))
                .plus(repu_force(nodes[i], nodes[j]));

            // Only linked nodes have attractive force.
            force[i] = force[i].plus(subforce);
            force[j] = force[j].minus(subforce);
        }
    }
    // Update coordinates of all nodes.
    for (var i = 0; i < nodes.length; i++)
    {
        if(nodes[i].press == false) {
            nodes[i].x += C * force[i].x + gravity.x;
            nodes[i].y += C * force[i].y + gravity.y;
        }
    }
    draw_layout();
}

canvas.addEventListener("mousedown", activate_click, false);
canvas.addEventListener("mousemove", move_node, false);
canvas.addEventListener("mouseup", deactivate_click, false);
init_layout();
setInterval(update_layout, interval);


