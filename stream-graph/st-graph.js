var cav_width = 960, cav_height = 480;
// The size of canvas
// Of course we do not use the canvas attribute here

/* Some simple array operations are defined below */
Array.prototype.shuffle = function(end = this.length)
{ // this function is used to disrupt the order of array
	if (end > this.length) end = this.length;
	var shuffle_arr = [];
	for(var iter = 0; iter < end; iter++) {
		var random_index = parseInt(Math.random() * iter);
		// generate som random numbers in area allowed

		var temp = this[random_index];
		this[random_index] = this[iter];
		this[iter] = temp;
		// exchange different elements in original array
		shuffle_arr.push(this[iter]);
	}
};

Array.prototype.sum = function(end = this.length)
{ // this simple function is used to calculate the sum of all elements
	if (end > this.length) end = this.length;
	for(var iter = 0, sum = 0; iter < end; iter++)
		sum += this[iter];
	return sum;
};

Array.prototype.colsum = function(idx, end = this.length)
{ // this function only fit 2d-array
	if (end > this.length) end = this.length;
	for (var iter = 0, sum = 0; iter < end; iter++) {
		if (Object.prototype.toString.call(this[iter]) != Object.prototype.toString.call([])) return;
		// exit function if any element is not an array

		if (this[iter].length <= idx || idx < 0) return;
		if (Object.prototype.toString.call(this[iter][idx]) != Object.prototype.toString.call(0)) return;
		// exit function if any 2d element is not a real number

		sum += this[iter][idx];
	}
	return sum;
};

Array.prototype.copy_2d = function()
{ // this function only fit 2d-array
    var arr = new Array(this.length);
    for (var iter = 0; iter < this.length; iter++) {
        if (Object.prototype.toString.call(this[iter]) != Object.prototype.toString.call([])) return;
        // exit function if any element in arr is not an array

        arr[iter] = this[iter].concat();
    }
    return arr;
};

Array.prototype.plus = function(arr)
{ // this simple function is used to plus another array
	if (arr.length != this.length) return;
	var plus_arr = [];
	for(var iter = 0; iter < this.length; iter++) {
		this[iter] += arr[iter];
		plus_arr.push(this[iter]);
	}
	return plus_arr;
};

Array.prototype.multi = function(factor)
{ // this simple function is used to do multiplication
	var multi_arr = [];
	if (Object.prototype.toString.call(factor) == Object.prototype.toString.call([]))
	{ // if the parameter is an array 
		if (arr.length != this.length) return;
		for (var iter = 0; iter < this.length; iter++) {
			this[iter] *= factor[iter];
			multi_arr.push(this[iter]);
		}
		return multi_arr;
	}
	else if (Object.prototype.toString.call(factor) == Object.prototype.toString.call(0))
	{ // if the parameter is a real number
		for (var iter = 0; iter < this.length; iter++) {
			this[iter] *= factor;
			multi_arr.push(this[iter]);
		}
		return multi_arr;
	}
	else return;
};

Array.prototype.inner_product = function(arr)
{ // this simple function is used to plus another array
	if (Object.prototype.toString.call(arr) != Object.prototype.toString.call([])) return;
	if (arr.length != this.length) return;
	for (var iter = 0, prod = 0; iter < this.length; iter++)
		prod += this[iter] * arr[iter];
	return prod;
};

function layer_stack(data){
    var layer_line = [], diff = [];
    layer_line.push([]);
    for (var i = 0; i < data[0].length; i++)
        layer_line[0].push({ x : data[0][i].x, y : data[0][i].y });
    // initiate baseline

    for (var i = 0; i < data.length; i++)
    { // initiate differences between two neighbor lines
        diff.push([]);
        diff[i].push(0);
        for(var j = 1; j < data[i].length; j++)
            diff[i].push(data[i][j].y - data[i][j - 1].y);
    }

    /* #####                                                                    ##### */
    /* ##### Formula here is given in paper by Lee Byron & Martin Wattenburg    ##### */
    /* ##### Take a look at their paper about stream graph:                     ##### */
    /* ##### http://leebyron.com/streamgraph/stackedgraphs_byron_wattenberg.pdf ##### */
    /* #####                                                                    ##### */

    for (var base_unit = 0; base_unit < layer_line[0].length; base_unit++) {
    	var buf = [], baseline = [], basediff = [];
        for (var i = 0; i < data.length; i++)
        { // re-initiate arrays here
        	buf.push(diff.colsum(base_unit, i));
        	baseline.push(data[i][base_unit].y);
        	basediff.push(diff[i][base_unit]);
        }

        var numerator = basediff.multi(0.5)
        	.plus(buf)
        	.inner_product(baseline);
        layer_line[0][base_unit].y = -numerator / baseline.sum();
        // calculate baseline position using ThemeRiver algorithm and reduce weighted_wiggle
    }

    for (var base_unit = 1; base_unit < layer_line[0].length; base_unit++)
    	layer_line[0][base_unit].y += layer_line[0][base_unit - 1].y;
    // we do this because the formula given by Byron shows the line-differences

    for (var i = 1; i < data.length; i++)
    { // in this circulation we complete array layer_line
        layer_line.push([]);
        for(var j = 0; j < data[i].length; j++) {
        	var pairs = { x : data[i][j].x, y : data[i][j].y };
        	pairs.y += layer_line[layer_line.length - 2][j].y;
            layer_line[layer_line.length - 1].push(pairs);
        }
    }
    return layer_line;
}

function scale(data) {
	var minimum = data[0][0].y;
	var maximum = data[data.length - 1][0].y;
	for(var i = 0; i < data[0].length; i++)
    	if(minimum > data[0][i].y)
    		minimum = data[0][i].y;
    // get the minimum

    for(var i = 0; i < data[data.length - 1].length; i++)
    	if(maximum < data[data.length - 1][i].y)
    		maximum = data[data.length - 1][i].y;
    // get the maximum

    for(var i = 0; i < data.length; i++)
    { // this function is used to adjust the svg data scale
        for(var j = 0; j < data[i].length; j++){
            data[i][j].x *= cav_width / data[i].length;
            data[i][j].y = (data[i][j].y - minimum) / (maximum - minimum) * cav_height;

            if(data[i][j].y < 0) data[i][j].y = cav_height;
            else data[i][j].y = cav_height - data[i][j].y;
        }
    }
}

/* Inspired by Lee Byron's test data generator. */
function bump_layer(n) {
    function bump(a) {
        var x = 1 / (.1 + Math.random()),
            y = 2 * Math.random() - .5,
            z = 10 / (.1 + Math.random());
        for (var i = 0; i < n; i++) {
            var w = (i / n - y) * z;
            a[i] += x * Math.exp(-w * w);
        }
    }

    var a = [], i;
    for (var i = 0; i < n; ++i) a[i] = 0;
    for (var i = 0; i < 5; ++i) bump(a);
    return a.map(function(d, i) { return { x: i, y : Math.max(0, d)}; });
}

var n = 20, // number of layers
    m = 200, // number of samples per layer
    cur_layer = 0; // current layer index
    stream_data = [],
    stream_layer = new Array(3);

for (var i = 0; i < n; i++) stream_data.push(i);
for (var j = 0; j < 3; j++)
{ // generate three different layers
    stream_layer[j] = layer_stack(stream_data.map(function() { 
        return bump_layer(200); 
    })); // use .map in Object Array
    scale(stream_layer[j]);
}

function layer_copy_2d(ori_layer)
{ // this function only fit 2d-array with layer data
    var arr = new Array(ori_layer.length);
    for (var iter = 0; iter < ori_layer.length; iter++) {
        if (Object.prototype.toString.call(ori_layer[iter]) != Object.prototype.toString.call([])) return;
        // exit function if any element in arr is not an array

        arr[iter] = new Array();
        for (subiter = 0; subiter < ori_layer[iter].length; subiter++) {
            var coord = { x : ori_layer[iter][subiter].x, y : ori_layer[iter][subiter].y};
            arr[iter].push(coord);
        }
    }
    return arr;
};

var layer = layer_copy_2d(stream_layer[cur_layer]),
    newlayer = layer_copy_2d(stream_layer[(cur_layer + 1) % 3]);
var color_idx = [];
for (var i = 0; i < layer.length; i++)
	color_idx.push(i);
color_idx.shuffle();

function draw_svg() {
    document.querySelector("svg").innerHTML = "";
    // clear original .svg image
    
    svg = document.getElementById("layout");
    svg.setAttribute("width", cav_width);
    svg.setAttribute("height", cav_height);
    // create svg image and set its attributes

    for(var i = 0; i < layer.length - 1; i++) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var str = "M" + layer[i + 1][0].x + "," + layer[i + 1][0].y;
        for(var j = 1; j < layer[i + 1].length; j++)
            str += "L" + layer[i + 1][j].x + "," + layer[i + 1][j].y;
        for(var j = layer[i].length - 1; j >= 0; j--)
            str += "L" + layer[i][j].x + "," + layer[i][j].y;
        // get path string

        var r = Math.floor(Math.pow(color_idx[i] / layer.length, 0.8) * 72) + 88;
        var g = Math.floor(Math.pow(color_idx[i] / layer.length, 0.8) * 72) + 88;
        var b = Math.floor(Math.pow(color_idx[i] / layer.length, 0.8) * 100) + 105;
        // get layer colors

        path.setAttribute("fill", "rgb(" + r + "," + g + "," + b + ")");
        path.setAttribute("stroke", "rgb(" + 88 + "," + 88 + "," + 105 + ")");
        path.setAttribute("stroke-width", "0.1px");
        path.setAttribute("d", str);
        svg.appendChild(path);
    }
}

function transition() {
    if (typeof(interval_id) != "undefined")
        clearInterval(interval_id);
    // clear the original animation if well-defined

    cur_layer = (cur_layer + 1) % 3;
    newlayer = layer_copy_2d(stream_layer[(cur_layer + 1) % 3]);
    interval_id = setInterval(update, 1);

    function update() {
        var count = 0, equal_judge = new Array(layer.length);
        for (var i = 0; i < layer.length; i++) 
        { // equal_judge array is used to determine whether layer-change is completed
            equal_judge[i] = new Array(layer[0].length);
            for (var j = 0; j < layer[i].length; j++)
                equal_judge[i][j] = 0;
        }

        for (var i = 0; i < layer.length; i++) {
            for (var j = 0; j < layer[i].length; j++) {
                if (layer[i][j].y - newlayer[i][j].y < 0.0001 && equal_judge[i][j] == 0) {
                    count++;
                    equal_judge[i][j] = 1;
                }
                layer[i][j].y = (layer[i][j].y + newlayer[i][j].y) / 2;
                // this formula is used to make animation
            }
        }
        draw_svg();

        if (count == layer.length * layer[0].length) {
            layer = layer_copy_2d(stream_layer[(cur_layer + 1) % 3]);
            count = 0;
            clearInterval(interval_id);
        }
    }
}

draw_svg();
