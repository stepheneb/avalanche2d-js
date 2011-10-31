/*global 
  window, document, navigator, 
  requestAnimFrame, cancelRequestAnimFrame ,myRequire,
  avalanche2d, grapher, sprintf 
*/

var webgl = !!window.WebGLRenderingContext;

var visualizations = document.getElementById("visualizations");
var canvas = document.getElementById("patchesCanvas");

var model, array_selection, i;

var folder_size = 100;
var max_model_step = folder_size * folder_size / 2;
var model_options = { model: { nx: folder_size, ny: folder_size, initial_value: 2 }};

//
// JavaScript Array Type Initialization
//
var select_array_type = document.getElementById("select-array-type");
var select_array_type_choices = select_array_type.getElementsByTagName("option");

var safari_browser = false;
var chrome_browser = navigator.userAgent.toLowerCase().indexOf('chrome') > 0;
if (!chrome_browser) {
  safari_browser = navigator.userAgent.toLowerCase().indexOf('safari') > 0;
}

if (webgl) {
  select_array_type.value = safari_browser ? "regular" : "Uint8Array";
} else {
  for(i=2; i < select_array_type_choices.length; i++) {
    select_array_type_choices[i].disabled = true;
  }
}

//
// JavaScript Array Type Selector
//
function selectArrayTypeChange() {
  array_selection = select_array_type.value;
  model = new avalanche2d.Model(canvas, model_options, array_selection);
}

select_array_type.onchange = selectArrayTypeChange;
select_array_type.onchange();

var graph_data = [2];

var graph = grapher.graph({
  "title": "Average Number of folders on a desk",
  "xlabel": "Model Step Count",
  "xmin": 0, "xmax": 5000,
  "ylabel": null,
  "ymin": 2.0, "ymax": 2.2,
  "dataset": graph_data
});

//
// Maximum Model Steps Selector
//
var select_max_model_step = document.getElementById("select-max-model-step");

function selectMaxModelStepChange() {
  max_model_step = +select_max_model_step.value;
  graph.change_xaxis(max_model_step);
}

select_max_model_step.onchange = selectMaxModelStepChange;

//
// Desk Array Size Selector
//
var select_desk_array_size = document.getElementById("select-desk-array-size");

function selectDeskArraySizeChange() {
  folder_size = +select_desk_array_size.value;
  max_model_step = folder_size * folder_size / 2;
  select_max_model_step.value = max_model_step;
  model_options = { model: { nx: folder_size, ny: folder_size, initial_value: 2 }};
  model = new avalanche2d.Model(canvas, model_options, array_selection);
  graph_data = [2];
  graph.change_xaxis(max_model_step);
  modelReset();
}

select_desk_array_size.onchange = selectDeskArraySizeChange;

//
// Show Visualization Selector
//
var show_visualization = document.getElementById("show-visualization");

function displayVisualization() {
  if (show_visualization.checked) {
    model.renderFolderCanvas();
  }
}

show_visualization.onchange = displayVisualization;

//
// Show Graph Selector
//
var show_graph = document.getElementById("show-graph");

function displayGraph() {
  if (show_graph.checked) {
    graph.new_data(graph_data);
  }
}

show_graph.onchange = displayGraph;

//
// Show Folder Table Selector
//
var show_data_table = document.getElementById("show-data-table");
var folder_data = document.getElementById("folder-data");

function displayFolderTable() {
  if (show_data_table.checked) {
    model.renderFolderTable(folder_data);
  } else {
    folder_data.innerHTML = '';
  }
}

show_data_table.onchange = displayFolderTable;

//
// requestAnimationFrame measurements
//
var aloop_start, aloop_time;
var aloop = 0;
var aloop_max_count = 20;
var aloop_timings = [];
var aloop_average = 0;
var aloop_minimum = 16;
var aloop_output = document.getElementById("aloop-output");

function measureAnimationLoop() {
  if (aloop <= aloop_max_count) {
    aloop_time = +new Date();
    requestAnimFrame(measureAnimationLoop, visualizations);
    aloop_timings[aloop] = aloop_time - aloop_start;
    aloop++;
    aloop_start = aloop_time;
  } else {
    aloop_timings.shift();
    aloop_minimum = Math.min.apply(null, aloop_timings);
    var str = "Animation loop timing measurements for this browser: ";
    aloop_output.innerHTML = str + aloop_timings.join(", ");
  }
}

function startAnimationLoopMeasurement() {
  aloop = 0;
  aloop_timings = [];
  aloop_start = +new Date();
  requestAnimFrame(measureAnimationLoop, visualizations);
}

startAnimationLoopMeasurement();

//
// Model Controller
//
var step_model = document.getElementById("step-model");
var step_model_inputs = step_model.getElementsByTagName("input");

var step_model_warning = document.getElementById("step-model-warning");
var stats = document.getElementById("stats");

var run_mode;

var start_time  = +new Date();
var step_time = +new Date();
var last_step_time = step_time;
var step_duration = 0;
var step_duration_max = 0;
var step_start = 0;
var average_step_rate;
var foldersRunningAverage;
var running;

var loop_start, loop_time, loop_elapsed, previous_loop_start, animation_loop_timing;
var modelRunRequest;

var initial_model_loop_time = 13;
var model_loop_bump_factor = 1.2;

var model_loop_time = initial_model_loop_time;
var model_loop_goal = model_loop_time * model_loop_bump_factor;

var average_loop_time = 0, max_loop_time = 0;

var display_method;

function modelController() {
  for(i = 0; i < this.elements.length; i++) {
      if (this.elements[i].checked) { run_mode = this.elements[i].value; }
  }
  switch(run_mode) {
    case "stop":
      modelStop();
      break;
    case "step":
      modelStep();
      break;
    case "go":
      modelGo();
      break;
    case "reset":
      modelReset();
      break;
  }
}

function modelStop() {
  run_mode = "stop";
  running = false;
  if (modelRunRequest) { cancelRequestAnimFrame(modelRunRequest); }
  displayStats();
  if (!show_visualization.checked) {
    model.renderFolderCanvas();
  }
  graph.hide_canvas();
  graph.new_data(graph_data);
  step_model_inputs[0].checked = true;
}

function modelStep() {
  if (modelRunRequest) { cancelRequestAnimFrame(modelRunRequest); }
  running = false;
  runModelStep();
  if (!show_visualization.checked) {
    displayStats();
    model.renderFolderCanvas();
  }
  graph.hide_canvas();
  graph.new_data(graph_data);
  if (model.indexOfStep >= max_model_step) { displayResetWarning(); }
  step_model_inputs[0].checked = true;
}

function modelGo() {
  running = true;
  if (model.indexOfStep >= max_model_step) {
    displayResetWarning();
    step_model_inputs[0].checked = true;
  } else {
    start_time = +new Date();
    if (show_graph.checked) {
      graph.show_canvas();
    }
    previous_loop_start = +new Date();
    initial_model_loop_time = model_loop_time;
    model_loop_goal = model_loop_time * model_loop_bump_factor;
    animation_loop_timing = aloop_minimum;
    if (show_visualization.checked || show_graph.checked || show_data_table.checked) {
      modelRunRequest = requestAnimFrame(runModelLoop, visualizations);
    } else {
      while (model.indexOfStep < max_model_step) {
        model.nextStep();
        graph_data.push(model.averageFolders);
      }
      step_time = +new Date();
      modelStop();
    }
    model.renderFolderTable(folder_data);
  }
}

function modelReset() {
  if (modelRunRequest) { cancelRequestAnimFrame(modelRunRequest); }
  model.reset();
  model.renderFolderCanvas();
  folder_data.innerHTML = '';
  stats.innerHTML = '';
  step_model_warning.innerHTML = null;
  graph.hide_canvas();
  graph.clear_canvas();
  graph_data = [2];
  graph.new_data(graph_data);
  step_model_inputs[0].checked = true;
}

function displayResetWarning() {
  step_model_warning.innerHTML = "<fieldset><legend>Note</legend>Reset the model to start again.</fieldset>";
}

function displayStats() {
  average_step_rate = model.indexOfStep / (step_time - start_time) * 1000;
  stats.textContent = 'avalanches: ' + model.indexOfStep + 
    sprintf(", rate: %5.1f (steps/s)", average_step_rate) +
    sprintf(", last sample time: %3f (ms)", step_duration) +
    sprintf(", loop compute maximum: %3f", model_loop_time) +
    sprintf(", anim loop timing: %3f", animation_loop_timing) +
    sprintf(", folders: %2.3f (ave)", model.averageFolders);
}

step_model.onchange = modelController;
model.renderFolderCanvas();

function runModelStep() {
    last_step_time = +new Date(step_time);
    model.nextStep();
    graph_data.push(model.averageFolders);
    if (show_visualization.checked) { model.renderFolderCanvas(); }
    if (show_graph.checked) { graph.add_canvas_point(model.averageFolders); }
    if (show_data_table.checked) { model.renderFolderTable(folder_data); }
    step_time = +new Date();
    step_duration = step_time - last_step_time;
    if (show_visualization.checked) { displayStats(); }
}

function runModelStepWithoutVisualization() {
    last_step_time = +new Date(step_time);
    model.nextStep();
    graph_data.push(model.averageFolders);
    if (show_graph.checked) { graph.add_canvas_point(model.averageFolders); }
    step_time = +new Date();
    step_duration = step_time - last_step_time;
}

function runModelLoop(){
  if (model.indexOfStep < max_model_step && running) {
    loop_start = +new Date();
    animation_loop_timing = loop_start - previous_loop_start;
    modelRunRequest = requestAnimFrame(runModelLoop, visualizations);
    step_duration_max = 0;
    runModelStep();
    if (step_duration > step_duration_max) { step_duration_max = step_duration; }
    loop_time = +new Date();
    loop_elapsed = loop_time - loop_start;
    while (loop_elapsed < model_loop_time) {
      runModelStepWithoutVisualization();
      if (step_duration > step_duration_max) { step_duration_max = step_duration; }
      loop_time = +new Date();
      loop_elapsed = loop_time - loop_start;
      if (model.indexOfStep >= max_model_step) {
        running = false;
        break;
      }
    }
    if (animation_loop_timing > model_loop_goal && loop_elapsed < model_loop_goal) {
      model_loop_time++;
    } else {
      if (model_loop_goal > aloop_minimum) { model_loop_time--; }
    }
    model_loop_goal = model_loop_time * model_loop_bump_factor;
    previous_loop_start = loop_start;
  } else { 
    modelStop();
  }
}
