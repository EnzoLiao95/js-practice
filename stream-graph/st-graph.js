// The size of canvas
// Of course we do not use the canvas attribute here
var cav_width = 960, cav_height = 480;

// Some simple array operations are defined below.
// This function is used to disrupt the order of array.
Array.prototype.shuffle = function(end = this.length)
{
    if (end > this.length) end = this.length;
    var shuffle_arr = [];
    for(var iter = 0; iter < end; iter++) {
        var random_index = parseInt(Math.random() * iter);
        var temp = this[random_index];
        this[random_index] = this[iter];
        this[iter] = temp;
        shuffle_arr.push(this[iter]);
    }
};

// This simple function is used to calculate the sum of all elements.
Array.prototype.sum = function(end = this.length)
{
    if (end > this.length) end = this.length;
    for(var iter = 0, sum = 0; iter < end; iter++)
        sum += this[iter];
    return sum;
};

// This function only fit 2d-array.
Array.prototype.colsum = function(idx, end = this.length)
{
    if (end > this.length) end = this.length;
    for (var iter = 0, sum = 0; iter < end; iter++) {
        // Exit function if any element is not an array.
        if (Object.prototype.toString.call(this[iter]) !=
            Object.prototype.toString.call([])) return;

        // Exit function if any 2d element is not a real number.
        if (this[iter].length <= idx || idx < 0) return;
        if (Object.prototype.toString.call(this[iter][idx]) !=
            Object.prototype.toString.call(0)) return;
        sum += this[iter][idx];
    }
    return sum;
};

// This function only fit 2d-array.
Array.prototype.copy_2d = function()
{
    var arr = new Array(this.length);
    for (var iter = 0; iter < this.length; iter++) {
        if (Object.prototype.toString.call(this[iter]) !=
            Object.prototype.toString.call([])) return;
        arr[iter] = this[iter].concat();
    }
    return arr;
};

// This simple function is used to plus another array.
Array.prototype.plus = function(arr)
{
    if (arr.length != this.length) return;
    var plus_arr = [];
    for(var iter = 0; iter < this.length; iter++) {
        this[iter] += arr[iter];
        plus_arr.push(this[iter]);
    }
    return plus_arr;
};

// This simple function is used for multiplication.
Array.prototype.multi = function(factor)
{
    var multi_arr = [];
    if (Object.prototype.toString.call(factor) ==
        Object.prototype.toString.call([])) {
        if (arr.length != this.length) return;
        for (var iter = 0; iter < this.length; iter++) {
            this[iter] *= factor[iter];
            multi_arr.push(this[iter]);
        }
        return multi_arr;
    } else if (Object.prototype.toString.call(factor) ==
               Object.prototype.toString.call(0)) {
        for (var iter = 0; iter < this.length; iter++) {
            this[iter] *= factor;
            multi_arr.push(this[iter]);
        }
        return multi_arr;
    }
    else return;
};

// This simple function is used to plus another array.
Array.prototype.inner_product = function(arr)
{
    if (Object.prototype.toString.call(arr) !=
        Object.prototype.toString.call([])) return;
    if (arr.length != this.length) return;
    for (var iter = 0, prod = 0; iter < this.length; iter++)
        prod += this[iter] * arr[iter];
    return prod;
};

function layer_stack(data) {
    // Initialize baseline.
    var layer_line = [], diff = [];
    layer_line.push([]);
    for (var i = 0; i < data[0].length; i++)
        layer_line[0].push({ x : data[0][i].x, y : data[0][i].y });
    
    // Initiate differences between two neighbor lines.
    for (var i = 0; i < data.length; i++) {
        diff.push([]);
        diff[i].push(0);
        for(var j = 1; j < data[i].length; j++)
            diff[i].push(data[i][j].y - data[i][j - 1].y);
    }

    // Formula here is given in paper by Lee Byron & Martin Wattenburg.
    // Take a look at their paper about stream graph:
    // http://leebyron.com/streamgraph/stackedgraphs_byron_wattenberg.pdf
    for (var base_unit = 0; base_unit < layer_line[0].length; base_unit++) {
        var buf = [], baseline = [], basediff = [];
        for (var i = 0; i < data.length; i++) {
            buf.push(diff.colsum(base_unit, i));
            baseline.push(data[i][base_unit].y);
            basediff.push(diff[i][base_unit]);
        }
        var numerator = basediff
            .multi(0.5)
            .plus(buf)
            .inner_product(baseline);
        // Calculate baseline position using ThemeRiver algorithm and
        // reduce weighted_wiggle.
        layer_line[0][base_unit].y = -numerator / baseline.sum();
    }
    // We do this operation because the formula given by Byron shows the
    // line-differences.
    for (var base_unit = 1; base_unit < layer_line[0].length; base_unit++)
        layer_line[0][base_unit].y += layer_line[0][base_unit - 1].y;

    // In this circulation we complete array layer_line.
    for (var i = 1; i < data.length; i++) {
        layer_line.push([]);
        for(var j = 0; j < data[i].length; j++) {
            var pairs = { x : data[i][j].x, y : data[i][j].y };
            pairs.y += layer_line[layer_line.length - 2][j].y;
            layer_line[layer_line.length - 1].push(pairs);
        }
    }
    return layer_line;
}

// This function adjusts the svg data scale.
function scale(data) {
    var minimum = data[0][0].y;
    var maximum = data[data.length - 1][0].y;

    // The minimum of y-coordinate in data[0].
    for(var i = 0; i < data[0].length; i++)
        if(minimum > data[0][i].y)
            minimum = data[0][i].y;

    // The maximum of y-coordinate in data[data.length - 1].
    for(var i = 0; i < data[data.length - 1].length; i++)
        if(maximum < data[data.length - 1][i].y)
            maximum = data[data.length - 1][i].y;

    // Scaling operation.
    for(var i = 0; i < data.length; i++) {
        for(var j = 0; j < data[i].length; j++) {
            data[i][j].x *= cav_width / data[i].length;
            var factor = (data[i][j].y - minimum) / (maximum - minimum);
            data[i][j].y = factor * cav_height;
            if(data[i][j].y < 0) data[i][j].y = cav_height;
            else data[i][j].y = cav_height - data[i][j].y;
        }
    }
}

// Inspired by Lee Byron's test data generator.
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

// number of layers
var n = 20;
// number of layers
var m = 200;
// number of layers

var cur_layer = 0;
var stream_data = [];
var stream_layer = new Array(3);

// Initialization of stream layers.
for (var i = 0; i < n; i++)
    stream_data.push(i);

// generate three different layers
for (var j = 0; j < 3; j++) {
    stream_layer[j] = layer_stack(stream_data.map(
        function() { 
            return bump_layer(200); 
        }));
    scale(stream_layer[j]);
}

// This function only fit 2d-array with layer data.
function layer_copy_2d(ori_layer)
{
    var arr = new Array(ori_layer.length);
    for (var iter = 0; iter < ori_layer.length; iter++) {
        if (Object.prototype.toString.call(ori_layer[iter]) !=
            Object.prototype.toString.call([])) return;

        arr[iter] = new Array();
        for (subiter = 0; subiter < ori_layer[iter].length; subiter++) {
            var coord = { x : ori_layer[iter][subiter].x,
                          y : ori_layer[iter][subiter].y};
            arr[iter].push(coord);
        }
    }
    return arr;
};

var layer = layer_copy_2d(stream_layer[cur_layer]);
var newlayer = layer_copy_2d(stream_layer[(cur_layer + 1) % 3]);
var color_idx = [];
for (var i = 0; i < layer.length; i++)
    color_idx.push(i);
color_idx.shuffle();

// This function draws svg image.
function draw_svg() {
    // Clear original .svg image.
    document.querySelector("svg").innerHTML = "";

    // Create svg image and set its attributes.
    svg = document.getElementById("layout");
    svg.setAttribute("width", cav_width);
    svg.setAttribute("height", cav_height);
    for(var i = 0; i < layer.length - 1; i++) {
        var path = document.createElementNS("http://www.w3.org/2000/svg",
                                            "path");
        // Get path string.
        var str = "M" + layer[i + 1][0].x + "," + layer[i + 1][0].y;
        for(var j = 1; j < layer[i + 1].length; j++)
            str += "L" + layer[i + 1][j].x + "," + layer[i + 1][j].y;
        for(var j = layer[i].length - 1; j >= 0; j--)
            str += "L" + layer[i][j].x + "," + layer[i][j].y;

        // Compute color values.
        var tmp = Math.pow(color_idx[i] / layer.length, 0.8);
        var r = Math.floor(tmp * 72) + 88;
        var g = Math.floor(tmp * 72) + 88;
        var b = Math.floor(tmp * 100) + 105;

        path.setAttribute("fill", "rgb(" + r + "," + g + "," + b + ")");
        path.setAttribute("stroke", "rgb(" + 88 + "," + 88 + "," + 105 + ")");
        path.setAttribute("stroke-width", "0.1px");
        path.setAttribute("d", str);
        svg.appendChild(path);
    }
}

function transition() {
    // the speed of animation.
    var speed = 0;
    // the factor in speed formula.
    var speed_count = 0;
    // the speed constant in formula.
    var SPEED_CONST = 0.000003;
    // the number of points which complete layer-change.
    var count = 0;
    // This param determines whether all points are counted.
    var equal_judge = new Array(layer.length); 
    // This param determines whether all layer-changes have been done.
    var complete_judge = false;
    
    for (var i = 0; i < layer.length; i++) 
    {
        equal_judge[i] = new Array(layer[0].length);
        for (var j = 0; j < layer[i].length; j++)
            equal_judge[i][j] = 0;
    }
    // Clear the original animation if well-defined.
    if (typeof(interval_id) != "undefined")
        clearInterval(interval_id);  
    if (complete_judge == true)
        layer = layer_copy_2d(stream_layer[cur_layer]);

    // Switch the current layer to the next one.
    cur_layer = (cur_layer + 1) % 3;
    newlayer = layer_copy_2d(stream_layer[cur_layer]);
    interval_id = setInterval(update, 1);

    function update() {
        // Speed calculating formula.
        speed_count++;
        speed = SPEED_CONST * Math.pow(speed_count, 2);
        for (var i = 0; i < layer.length; i++) {
            for (var j = 0; j < layer[i].length; j++) {
                if (layer[i][j].y - newlayer[i][j].y < 0.001 &&
                    equal_judge[i][j] == 0) {
                    count++;
                    equal_judge[i][j] = 1;
                }
                // this formula is for animation.
                layer[i][j].y = layer[i][j].y +
                    speed * (newlayer[i][j].y - layer[i][j].y);
            }
        }
        draw_svg();
        // This expression shows that a layer-change is completed.
        if (count >= layer.length * layer[0].length) {
            complete_judge = true;
            clearInterval(interval_id);
        }
    }
}

draw_svg();


