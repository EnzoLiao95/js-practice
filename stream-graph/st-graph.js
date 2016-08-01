var cav_width = 960, cav_height = 480;
// The size of canvas
// Of course we do not use the canvas attribute here

/* Some simple array operations are defined below */
Array.prototype.shuffle = function(end = this.length)
{ // this function is used to disrupt the order of array
	if (end > this.length) end = this.length;
	var shuffle_arr = [];
	for(var iter = 0; iter < end; iter++) {
		var randomIndex = parseInt(Math.random() * iter);
		// generate som random numbers in area allowed

		var temp = this[randomIndex];
		this[randomIndex] = this[iter];
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
    for(var i = 0; i < data[0].length; i++)
        layer_line[0].push({ x : data[0][i].x, y : data[0][i].y });
    // initiate baseline

    for(var i = 0; i < data.length; i++)
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
        for(var j = 0; j < data[i].length-1; j++) {
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

var layer = layer_stack(streamlayer);
scale(layer);

var color_idx = [];
for (var i = 0; i < layer.length; i++)
	color_idx.push(i);
color_idx.shuffle();

window.onload = function() {
    svg = document.getElementById("layout");
    svg.setAttribute("width", cav_width);
    svg.setAttribute("height", cav_height);
    // create svg image and set its attributes

    for(var i = 0; i < layer.length - 1; i++){
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var str = "M" + layer[i + 1][0].x + "," + layer[i + 1][0].y;
        for(var j = 1; j < layer[i + 1].length; j++)
            str += "L" + layer[i + 1][j].x + "," + layer[i + 1][j].y;
        for(var j = layer[i].length - 1; j >= 0; j--)
            str += "L" + layer[i][j].x + "," + layer[i][j].y;
        // get path string

        var r = Math.floor(color_idx[i] / layer.length * 100) + 119;
        var g = Math.floor(color_idx[i] / layer.length * 100) + 136;
        var b = Math.floor(color_idx[i] / layer.length * 100) + 153;
        // get layer colors

        path.setAttribute("fill", "rgb(" + r + "," + g + "," + b + ")");
        path.setAttribute("stroke", "rgb(" + 120 + "," + 135 + "," + 153 + ")");
        path.setAttribute("stroke-width", "0.1px");
        path.setAttribute("d", str);
        svg.appendChild(path);
    }
}