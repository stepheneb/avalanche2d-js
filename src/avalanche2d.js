//     avalanche2d.js 0.1.0
//     (c) 2010 The Concord Consortium
//     created by Stephen Bannasch
//     avalanche2d.js may be freely distributed under the LGPL license.

(function() {

var avalanche2d = {};
var root = this;
avalanche2d.VERSION = '0.1.0';

// Constants

avalanche2d.array_type = "regular";

// Extend the Array object with a shuffle method

Array.prototype.shuffle = function() {
    var s = this, len = s.length; 
    for(var i = len-1; i > 0; i--) {
        var r = Math.floor(Math.random()*(i+1)), temp;
        temp = s[i], s[i] = s[r], s[r] = temp;
    } return this;
};

function createArray(size, fill) {
    fill = fill || 0;
    var a;
    if (avalanche2d.array_type === "regular") {
        a = new Array(size);
    } else {
      switch(avalanche2d.array_type) {
      case "Float64Array":
        a = new Float64Array(size);
        break;
      case "Float32Array":
        a = new Float32Array(size);
        break;
      case "Int32Array":
        a = new Int32Array(size);
        break;
      case "Int16Array":
        a = new Int16Array(size);
        break;
      case "Int8Array":
        a = new Int8Array(size);
        break;
      case "Uint32Array":
        a = new Uint32Array(size);
        break;
      case "Uint16Array":
        a = new Uint16Array(size);
        break;
      case "Uint8Array":
        a = new Uint8Array(size);
        break;
      };
    };
    if (a[size-1] !== fill) {
      for (var i = 0; i < size; i++) {
          a[i] = fill;
      }
    };
    return a;
}

avalanche2d.config = {
    model: { nx: 50, ny: 50, initial_value: 2 }
};

avalanche2d.Model = function(options, array_type) {

    if (!array_type) array_type = "regular";
    avalanche2d.array_type = array_type;

    if (!options || options === {}) {
        this.options = avalanche2d.config;
    } else {
        this.options = options;
    }

    if (!this.options.model) this.options.model = {};

    this.nx = options.model.nx;
    this.ny = options.model.ny;
    
    this.ARRAY_SIZE = this.nx * this.ny;

    this.reset();
};

avalanche2d.Model.prototype.random_cell = function() {
    return [Math.floor(Math.random()*this.nx), Math.floor(Math.random()*this.ny)];
};

avalanche2d.Model.prototype.reset = function() {
    this.indexOfStep = 0;

    this.folder = createArray(this.ARRAY_SIZE, this.options.model.initial_value)

    this.averageFolders = this.options.model.initial_value;
    
    this.folderSolver = new avalanche2d.FolderSolver2D(this);
};


avalanche2d.Model.prototype.nextStep = function() {
    this.folderSolver.solve();
    this.indexOfStep++;
};

//
// Utilities
//

avalanche2d.copyArray = function(destination, source) {
    var source_length = source.length;
    var destination_length = destination.length;
    for (i = 0; i < source_length; i++) destination[i] = source[i];
};

/** @return true if x is between a and b. */
// float a, float b, float x
avalanche2d.between = function(a, b, x) {
    return x < Math.max(a, b) && x > Math.min(a, b);
};

// float[] array
avalanche2d.getMax = function(array) {
    return Math.max.apply( Math, array );
};

// float[] array
avalanche2d.getMin = function(array) {
    return Math.min.apply( Math, array );
};

// FloatxxArray[] array
avalanche2d.getMaxTypedArray = function(array) {
    var max = Number.MIN_VALUE;
    var length = array.length;
    var test;
    for(i = 0; i < length; i++) {
        test = array[i];
        max = test > max ? test : max
    }
    return max;
};

// FloatxxArray[] array
avalanche2d.getMinTypedArray = function(array) {
    var min = Number.MAX_VALUE;
    var length = array.length;
    var test;
    for(i = 0; i < length; i++) {
        test = array[i];
        min = test < min ? test : min
    }
    return min;
};

// float[] array
avalanche2d.getMaxAnyArray = function(array) {
    try {
        return Math.max.apply( Math, array );
    }
    catch (e) {
        if (e instanceof TypeError) {
            var max = Number.MIN_VALUE;
            var length = array.length;
            var test;
            for(i = 0; i < length; i++) {
                test = array[i];
                max = test > max ? test : max
            }
            return max;
        }
    }
};

// float[] array
avalanche2d.getMinAnyArray = function(array) {
    try {
        return Math.min.apply( Math, array );
    }
    catch (e) {
        if (e instanceof TypeError) {
            var min = Number.MAX_VALUE;
            var length = array.length;
            var test;
            for(i = 0; i < length; i++) {
                test = array[i];
                min = test < min ? test : min
            }
            return min;
        }
    }
};

avalanche2d.getAverage = function(array) {
    var acc = 0;
    var length = array.length;
    for (i = 0; i < length; i++) {
        acc += array[i];
    };
    return acc / length;
};

// *******************************************************
//
//   FolderSolver2D
//
// *******************************************************

avalanche2d.FolderSolver2D = function(model) {

    this.model = model

    this.nx = model.nx;
    this.ny = model.ny;
    
    this.cells_to_process = [];
    this.new_cells_to_process = [];

};

avalanche2d.FolderSolver2D.prototype.solve = function() {
    if (this.drop()) {
        this.step()
    }
    this.model.averageFolders = avalanche2d.getAverage(this.model.folder);
};

avalanche2d.FolderSolver2D.prototype.drop = function() {
    var xpos, ypos;
    xpos = Math.floor(Math.random()*this.nx);
    ypos = Math.floor(Math.random()*this.ny);
    return this.add(xpos, ypos);
};

avalanche2d.FolderSolver2D.prototype.add = function(xpos, ypos, index) {
    index = index || ypos * this.model.nx + xpos;
    var folder_count = this.model.folder[index];
    folder_count++;
    if (folder_count > 3) {
        folder_count = folder_count - 4;
        this.model.folder[index] = folder_count;
        return this.distributeFolders(xpos, ypos, index);
    } else {
        this.model.folder[index] = folder_count;
        return false;
    }
};

avalanche2d.FolderSolver2D.prototype.distributeFolders = function(xpos, ypos, index) {
    var folder = this.model.folder;
    var size = this.model.ARRAY_SIZE;
    
    var nx = this.nx;
    var nx_minus_one = nx - 1;

    var ny = this.ny;
    var ny_minus_one = ny - 1;
    
    var index_plus_x, index_minus_x, index_plus_y, index_minus_y;
    
    var caused_avalanche = false;
    
    // if we're not on the left edge increment the neighbor to the left
    if (xpos > 0) {
        index_minus_x = index - 1;
        folder[index_minus_x]++;
        if (folder[index_minus_x] > 3) {
            this.new_cells_to_process.push([xpos-1, ypos, index_minus_x]);
            caused_avalanche = true;
        };
    };
    
    // if we're not on the right edge increment the neighbor to the right
    if (xpos < nx_minus_one) {
        index_plus_x  = index + 1;
        folder[index_plus_x]++;
        if (folder[index_plus_x] > 3) {
            this.new_cells_to_process.push([xpos+1, ypos, index_plus_x]);
            caused_avalanche = true;
        };
    };
    
    // if there is a row above increment the neighbor above
    if (index >= nx)  {
        index_minus_y = index - nx;
        folder[index_minus_y]++;
        if (folder[index_minus_y] > 3) {
            this.new_cells_to_process.push([xpos, ypos-1, index_minus_y]);
            caused_avalanche = true;
        };
     };

    // if there is a row below increment the neighbor below
    index_plus_y = index + nx;
    if (index_plus_y < size) {
        folder[index_plus_y]++;
        if (folder[index_plus_y] > 3) {
            this.new_cells_to_process.push([xpos, ypos+1, index_plus_y]);
            caused_avalanche = true;
        };
    };
    return caused_avalanche;
};

avalanche2d.FolderSolver2D.prototype.distributeFoldersRandomOrder = function(xpos, ypos, index) {
    // Currently about 10% slower than the non-random distributeFolders() function
    var folder = this.model.folder;
    var size = this.model.ARRAY_SIZE;
    
    var nx = this.nx;
    var nx_minus_one = nx - 1;

    var ny = this.ny;
    var ny_minus_one = ny - 1;
    
    var neighbors = [];
    
    var caused_avalanche = false;
    
    // if we're not on the left edge queue the neighbor to the left
    if (xpos > 0) neighbors.push([xpos-1, ypos, index-1]);

    // if we're not on the right edge queue the neighbor to the right
    if (xpos < nx_minus_one) neighbors.push([xpos+1, ypos, index+1]);

    // if there is a row above queue the neighbor above
    if (index >= nx) neighbors.push([xpos, ypos-1, index-nx]);

    // if there is a row below queue the neighbor below
    var index_plus_y = index + nx;
    if (index_plus_y < size) neighbors.push([xpos, ypos+1, index_plus_y]);
    
    // randomize the order in which we process the neighbors
    neighbors.shuffle();
    
    while (neighbors.length > 0) {
        cell = neighbors.shift();
        folder[cell[2]]++;
        if (folder[cell[2]] > 3) {
            this.new_cells_to_process.push(cell);
            caused_avalanche = true;
        };
    };
    return caused_avalanche;
};

avalanche2d.FolderSolver2D.prototype.step = function() {
    var cell;
    var folder = this.model.folder;
    var folder_count;
    var relaxation_cycles = 0;
    while (this.new_cells_to_process.length > 0) {
        relaxation_cycles++;
        // if (relaxation_cycles > 4) return this.finish_with_brute_force();
        this.cells_to_process = this.new_cells_to_process;
        this.new_cells_to_process = [];
        while (this.cells_to_process.length > 0) {
            cell = this.cells_to_process.shift();
            folder_count = folder[cell[2]];
            if (folder_count > 3) {
                folder[cell[2]] = folder_count-4;
                this.distributeFolders(cell[0], cell[1], cell[2]);
            }
        };
    };
};

avalanche2d.FolderSolver2D.prototype.finish_with_brute_force = function() {
    var folder = this.model.folder;
    var nx = this.nx;
    var ny = this.ny;
    var xpos, ypos, index;
    var folder_count;
    
    this.cells_to_process = [];
    this.new_cells_to_process = [];
    
    var avalanche = true;
    var new_avalanche = true;

    var row_index = 0;
    while (avalanche) {
        avalanche = false;
        for (ypos = 0; ypos < ny; ypos++) {
            for (xpos = 0; xpos < nx; xpos++) {
                index = row_index + xpos;
                folder_count = folder[index];
                if (folder_count > 3) {
                    folder[index] = folder_count - 4;
                    new_avalanche = this.distributeFolders(xpos, ypos, index);
                    avalanche = avalanche || new_avalanche;
                    this.new_cells_to_process = [];
                }
            };
            row_index = row_index + nx;
        }
    }
};

// *******************************************************
//
//   Graphics Canvas
//
// *******************************************************


/**
* HSV to RGB color conversion
*
* H runs from 0 to 360 degrees
* S and V run from 0 to 100
* 
* Ported from the excellent java algorithm by Eugene Vishnevsky at:
* http://www.cs.rit.edu/~ncs/color/t_convert.html
* 
* http://snipplr.com/view.php?codeview&id=14590
*
*/
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
        r = v;
        g = t;
        b = p;
        break;

        case 1:
        r = q;
        g = v;
        b = p;
        break;

        case 2:
        r = p;
        g = v;
        b = t;
        break;

        case 3:
        r = p;
        g = q;
        b = v;
        break;

        case 4:
        r = t;
        g = p;
        b = v;
        break;

        default: // case 5:
        r = v;
        g = p;
        b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
var red_color_table   = [];
var blue_color_table  = [];
var green_color_table = [];
var alpha_color_table = [];

avalanche2d.setupRGBAColorTables = function() {
    var rgb = [];
    for(var i = 0; i < 256; i++) {
        rgb = hsvToRgb(i, 100, 90);
        red_color_table[i]   = rgb[0];
        blue_color_table[i]  = rgb[1];
        green_color_table[i] = rgb[2];
    }
}

avalanche2d.displayFolderCanvas = function(canvas, model) {
    if (red_color_table.length == 0) {
        avalanche2d.setupRGBAColorTables;
    };
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.globalCompositeOperation = "destination-atop";

    var columns = model.nx;
    var rows = model.ny;

    canvas.style.width = canvas.clientWidth + 'px';
    canvas.style.height = canvas.clientHeight + 'px';

    canvas.width = columns;
    canvas.height = rows;
    
    var hue, rgb;

    //  folder hue mapping:
    //  count    color      hue
    // ---------------------------
    //   0       blue       183
    //   1       green      115
    //   2       yellow     59
    //   3       orange     30
    //   4       red        0
    //
    var folder_hue_map = [183, 115, 59, 30, 0];
    
    var ycols;

    var folder_count;
    var imageData = ctx.getImageData(0, 0, columns, rows);
    var data = imageData.data;
    var pix_index = 0;
    for (var y = 0; y < rows; y++) {
        ycols = y * rows;
        pix_index = ycols * 4;
        for (var x = 0; x < columns; x++) {
            folder_count = model.folder[ycols + x];
            hue =  (folder_count > 4) ? 0 : folder_hue_map[folder_count]
            data[pix_index]     = red_color_table[hue];
            data[pix_index + 1] = blue_color_table[hue];
            data[pix_index + 2] = green_color_table[hue];
            data[pix_index + 3] = 255;
            pix_index += 4;
        }
    };
    ctx.putImageData(imageData, 0, 0);
}

avalanche2d.displayFolderTable = function(destination, model) {
    var columns = model.nx;
    var rows = model.ny;
    var ycols, ycols_plus_x;
    var folder_count;
    var table_strings = ["    "];
    for (y = 0; y < rows; y++) {
      table_strings[table_strings.length] = sprintf("%2.0f ", y);
    };
    table_strings[table_strings.length] = '\n';
    for (y = 0; y < rows; y++) {
        ycols = y * rows;
        table_strings[table_strings.length] = sprintf("%2.0f: ", y);
        for (x = 0; x < columns; x++) {
            ycols_plus_x = ycols + x;
            folder_count = model.folder[ycols_plus_x];
            table_strings[table_strings.length] = sprintf("%2.0f ", folder_count);
        }
        table_strings[table_strings.length] = '\n';
    }
    destination.innerHTML = table_strings.join("");
}

// export namespace
if (root !== 'undefined') root.avalanche2d = avalanche2d;
})();
