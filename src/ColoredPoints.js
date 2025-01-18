// Jaren Kawai
// jkawai@ucsc.edu

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let rainbowMode = false;
currentRainbowIndex = 0;

// Rainbow mode array
const rainbowColors = [
  [1.0, 0.0, 0.0, 1.0], // Red
  [1.0, 0.5, 0.0, 1.0], // Orange
  [1.0, 1.0, 0.0, 1.0], // Yellow
  [0.0, 1.0, 0.0, 1.0], // Green
  [0.0, 0.0, 1.0, 1.0], // Blue
  [0.29, 0.0, 0.51, 1.0], // Indigo
  [0.93, 0.51, 0.93, 1.0] // Violet
];


function addActionsFromUI(){

  //Button information
  document.getElementById('green').onclick = function() { rainbowMode = false; g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function() { rainbowMode = false; g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() { g_shapesList = []; clearCanvas(); if (rainbowMode){ startRainbow(); }};
  document.getElementById('rainbow').onclick = function() {rainbowMode = !rainbowMode; if(rainbowMode){ startRainbow(); }};

  document.getElementById('pointButton').onclick = function() { g_selectedType=POINT; };
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE; };
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE; };
  document.getElementById('slugButton').onclick = function() { g_shapesList = []; clearCanvas(); drawSlug(); };




  //Slider information
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segSlide').addEventListener('mouseup', function() { g_selectedSegments = this.value});


}

function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionsFromUI();

  canvas.onmousedown = click;
  // Register function (event handler) to be called on a mouse press
  canvas.onmousemove = function(ev){ if(ev.buttons == 1) {click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}


var g_shapesList = [];

//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = []; // The array to store sizes of points

function click(ev) {
  
  let [x,y] = convertCoordinatesEventToGL(ev);


  // Create and store new point
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  }
  else if(g_selectedType == CIRCLE)
  {
    point = new Circle();
    point.segments = g_selectedSegments;
  }
  else{
    point = new Triangle();
  }
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  g_shapesList.push(point);

  //Draw every shape that is supposed to be in the canvas
  renderAllShapes();
  
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}

function renderAllShapes(){

  var startTime = performance.now();

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function clearCanvas(){
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot"); 
}

//set the text of HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}

function drawSlug(){
  var triangles = [

    {vertices: [-1, -.2, -1, 1, 1, 1], color: [0.67, 0.84, 0.9, 1.0]}, //sky
    {vertices: [1, -.2, 1, 1, -1, -.2], color: [0.67, 0.84, 0.9, 1.0]},

    {vertices: [-1, -.2, -1, -1, 1, -1], color: [0.0, .3, 0.0, 1.0]}, //ground
    {vertices: [-1, -.2, 1, -.2, 1, -1], color: [0.0, .3, 0.0, 1.0]}, 
   
    {vertices: [.3, 0.0, .4, 0.0, .4, .1], color: [1.0, .9, 0.0, 1.0]},//head
    {vertices: [.4, 0.0, .5, 0.0, .4, .1], color: [1.0, .95, 0.0, 1.0]},
    {vertices: [.5, 0.0, .5, .1, .4, .1], color: [1.0, .8, 0.0, 1.0]},
    {vertices: [.3, 0.0, .4, .1, .3, .2], color: [1.0, .85, 0.0, 1.0]},
    {vertices: [.3, .2, .4, .1, .5, .2], color: [1.0, .95, 0.0, 1.0]},
    {vertices: [.4, .1, .5, .1, .5, .2], color: [1.0, .9, 0.0, 1.0]},


    {vertices: [.3, .2, .4, .3, .4, .2], color: [1.0, .89, 0.0, 1.0]}, //ears
    {vertices: [.4, .2, .5, .3, .5, .2], color: [1.0, .95, 0.0, 1.0]}, 

    {vertices: [.3, -.2, .3, 0.0, .4, -.1], color: [1.0, .79, 0.0, 1.0]}, //slants
    {vertices: [.4, -.1, .3, 0.0, .5, 0.0], color: [1.0, .85, 0.0, 1.0]},


    {vertices: [.1, -.2, .2, -.1, .1, 0.0], color: [1.0, .9, 0.0, 1.0]}, //main body
    {vertices: [.1, 0.0, .3, 0.0, .2, -.1], color: [1.0, .8, 0.0, 1.0]},
    {vertices: [.1, -.2, .2, -.2, .2, -.1], color: [1.0, .85, 0.0, 1.0]},
    {vertices: [.2, -.2, .3, -.2, .2, -.1], color: [1.0, .75, 0.0, 1.0]},
    {vertices: [.2, -.1, .3, -.075, .3, 0.0], color: [1.0, .95, 0.0, 1.0]},
    {vertices: [.2, -.1, .3, -.2, .3, -.075], color: [1.0, .88, 0.0, 1.0]},


    {vertices: [.1, -.1, .1, 0.0, 0.0, -.05], color: [1.0, .92, 0.0, 1.0]}, //half1
    {vertices: [-.1, -.1, .1, -.1, 0.0, -.05], color: [1.0, .8, 0.0, 1.0]},

    {vertices: [0.0, -.15, .1, -.1, .1, -.2], color: [1.0, .95, 0.0, 1.0]}, //half2
    {vertices: [0.0, -.15, -.1, -.1, .1, -.1], color: [1.0, .84, 0.0, 1.0]},

    {vertices: [-.1, -.2, -.1, -.1, 0.0, -.15], color: [1.0, .92, 0.0, 1.0]}, //half3
    {vertices: [-.1, -.2, 0.0, -.15, .1, -.2], color: [1.0, 1.0, 0.0, 1.0]},


    {vertices: [-.1, -.1, -.2, -.15, -.1, -.2], color: [1.0, .9, 0.0, 1.0]}, //step down bottom
    {vertices: [-.1, -.2, -.2, -.15, -.3, -.2], color: [1.0, .86, 0.0, 1.0]}, //step down bottom


    {vertices: [-.3, -.2, -.3, -.1, -.2, -.15], color: [1.0, 1.0, 0.0, 1.0]}, //above step down
    {vertices: [-.3, -.1, -.1, -.1, -.2, -.15], color: [1.0, .8, 0.0, 1.0]}, //above step down


    {vertices: [-.3, -.2, -.4, -.2, -.3, -.1], color: [1.0, .85, 0.0, 1.0]}, //tail end
    {vertices: [-.5, -.2, -.4, -.2, -.33, -.14], color: [1.0, .9, 0.0, 1.0]}, //tail end

  ];

  for(var t of triangles){
    gl.uniform4f(u_FragColor, t.color[0], t.color[1], t.color[2], t.color[3]);
    drawTriangle(t.vertices);
  }
}

function startRainbow() {
  if (!rainbowMode) return; // Exit if rainbow mode is off

  // Set the current color to the next in the sequence
  g_selectedColor = rainbowColors[currentRainbowIndex];
  
  // Update the index for the next color
  currentRainbowIndex = (currentRainbowIndex + 1) % rainbowColors.length;
  
  // Schedule the next color update
  setTimeout(startRainbow, 200); // Change color every 200ms (adjust as needed)
}