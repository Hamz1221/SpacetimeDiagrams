// Workarounds for different browsers
window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

// Enclose the entire simulation code in a module rather than using global namespace
var SpaceTimeModule = (function () {

    // Define private (module level) parameters (these can be adjusted)
    var graphTicks = 10;                    // interval between ticks on the graph in seconds
    var totalTime = 6;                      // time to run the simulation in units of graphTicks
    var gridLines = 0.2;                    // grid lines per light-sec
    var startPosition = 0.05;               // position at which the ufo starts (in light-sec) - should be edge of mother ship
    var lasersAllowed = 5;                  // too many lasers slows down the animation and makes it jerky
    var missilesAllowed = 5;                // too many missiles slows down the animation and makes it jerky
    var gameWidthLightSec = 1;              // number of light seconds represented by the width of the game canvas
    var visibleStars = 50;                  // number of stars to display in the background of each screen
    var missileSpeed = 0.25;                // speed of missiles relative to UFO (in units of c)
    var missileColour = "red";              // colour of missiles
    var laserColour = "orange";             // colour of laser pulses
    var ufoWorldLineColour = "blue";        // colour of rocketship worldline

    // Define constants (do not adjust)
    var maxTime = totalTime * graphTicks;   // time to run the simulation in seconds
    var ufoSize = 23;			            // Height/width of the square UFO sprite
    var baseHeight = 77;                    // Height of the mothership sprite
    var baseWidth = 33;                     // Width of the mothership sprite
    var leftGutter = 50;                    // width of gutter to left of the graph
    var rightGutter = 30;                   // width of gutter to right of the graph
    var backgroundWidth = 400;              // pixel width of the background square
    var backgroundHeight = 100;             // pixel height of the background square

    var basey;                              // y coordinate of mothership sprite
    var gameCanvasHeight;		            // Width of the canvas
    var gameCanvasWidth;		            // Width of the canvas
    var ufoy; 				                // y coordinate of rocketship image
    var missilePlotY;                       // y coordinate of missile

    // ** Define private (module level) functional object constructors

    var rocket = function (startX) {

        // create a new object
        var that = {};

        // Define private properties
        var startingX = startX;
        var xPosition = startingX;
        var xSpeed = 0;
        var myTime = 0;

        clockTick = function (currentTime) {
            var myTimeInterval = currentTime - myTime;
            if (myTimeInterval > 0) {
                myTime = currentTime;
                updatePosition(myTimeInterval);
            }
        };

        updatePosition = function (myTimeInterval) {
            xPosition += xSpeed * myTimeInterval / 1000; // myTimeInterval is in millisecs so convert to secs

            // check for return to mother ship
            if (xPosition <= startingX) {
                xPosition = startingX;
                xSpeed = 0;
            }

        };

        // Expose public methods
        that.getSpeed = function () {
            return xSpeed;
        };
        that.setSpeed = function (newSpeed) {
            xSpeed = newSpeed;
        };
        that.getPosition = function (currentTime) {
            clockTick(currentTime);
            return xPosition;
        };
        that.setPosition = function (newPosition) {
            xPosition = newPosition;
        };
        that.reset = function (x) { // optionally allow a value to be specified for x at time t = 0
            xPosition = (typeof x === "undefined") ? 0 : x; // if unspecified, x is set to zero at time t = 0
            myTime = 0;
        };
        return that;
    };

    var missile = function (sourceVelocity, relativeSpeed) {
        // create a new object
        var that = {};

        // work out object velocity from object speed (i.e. work out direction rocket is facing)
        var objectVelocity = (relativeSpeed * sourceVelocity / Math.abs(sourceVelocity)) || relativeSpeed; // if ufo is stationary then fire to the right by default

        // Define public properties and methods
        that.StartPosition = 0;
        that.StartTime = 0;
        that.Position = 0;
        that.Speed = addVelocities(sourceVelocity, objectVelocity);
        that.Thickness = 2; // default used for laser
        that.Extent = (ufoSize / 2); // default used for laser
        that.Colour = laserColour; // default used for laser

        that.missileTick = function (currentTime) {
            // x = ct
            that.Position = that.Speed * (currentTime - that.StartTime) / 1000 + that.StartPosition;
        };
        return that;
    };

    // ** Define private (module level) variables
    var simulationRunning = false;
    var graphMissileCanvas = document.getElementById("graphMissileCanvas");
    var graphCanvas = document.getElementById("graphCanvas");
    var gameCanvas = document.getElementById("gameCanvas");
    var backgroundGraphCanvas = document.getElementById("backgroundGraphCanvas");
    var backgroundGameCanvas = document.getElementById("backgroundGameCanvas");
    var gameContext = gameCanvas.getContext("2d");
    var backgroundGameContext = backgroundGameCanvas.getContext("2d");
    var graphDataContext = graphCanvas.getContext("2d");
    var graphMissileContext = graphMissileCanvas.getContext("2d");
    var labelScreen = document.getElementById("labelScreen");
    var labelNextScreen = document.getElementById("labelNextScreen");
    var objectGraph = null;
    var missileGraph = null;
    var graphData = [];
    var graphMissileData = [];
    var backgroundGraph = null;
    var currentTime = 0; // universal time
    var oldTime = 0; // used to keep track of when graph was last updated
    var ufoScreen = 0; // used to keep track of what screen the ufo is on (NB: the first screen is screen zero)
    var rocket1 = rocket(startPosition);
    var missiles = [];
    var missileData = [];
    var missileColours = [];
    var lasersRemaining = lasersAllowed;
    var missilesRemaining = missilesAllowed;

    // image objects
    var ufo = new Image();  	    // Rocketship image
    var launchpad = new Image();  	// Mothership image

    // functions
    var setButtons;
    var runSimulation;
    var stopSimulation;
    var setupPage;
    var setUpBackgroundGraph;
    var setUpGraph;
    var drawGraph;
    var timer;
    var timeZero;

    // ** Define private (module level) functions

    // Einstein's addition of velocities formula (with velocities in units of c)
    var addVelocities = function (v, w) {
        var u = (v + w) / (1 + v * w);
        return u;
    };

    // Define (Linear Congruential) pseudo-random number generator - used to plot the starscape background.
    // The algorithm and parameters are explained on Wikipedia.
    // Javascript's Math.random() function is no use as it does not accept a seed,
    // meaning that a particular random number sequence cannot be reproduced.
    var randomNumber = (function () {
        var m = 4294967296
        var a = 1664525
        var c = 1013904223
        var seed
        var z;

        return {
            setSeed: function (seedValue) {
                seed = seedValue || Math.floor(Math.random() * m); // if no seed given then pick a random one
                z = seed;
            },
            rnd: function () {
                z = (a * z + c) % m; // calculate the next "random" number in the sequence
                return z / m;
            }
        };
    }());

    // this function defines the static background graph (ie. axes, labels and grid)
    setUpBackgroundGraph = function (newGraph) {
        newGraph
            .Set('gutter.left', leftGutter)
            .Set('gutter.right', rightGutter)
            .Set('gutter.top', 30)
            .Set('gutter.bottom', 50)
            .Set('title.font', 'Arial')
            .Set('title.bold', true)
            .Set('text.font', 'Arial')
            .Set('text.size', 10)
            .Set('title.yaxis', 't / s')
            .Set('title.yaxis.bold', false)
            .Set('title.xaxis.bold', false)
            .Set('title.xaxis', 'x / light-sec')
            .Set('title.vpos', 0.5)
            .Set('title.yaxis.pos', 0.35)
            .Set('title.xaxis.pos', 0.35)
            .Set('line.linewidth', 2)
            .Set('line.stepped', false)
            .Set('background.grid.border', false)
            .Set('background.grid.hlines', true)
            .Set('background.grid.vlines', true)
            .Set('background.grid.autofit', true)
            .Set('background.grid.autofit.numhlines', maxTime * gridLines)
            .Set('background.grid.autofit.numvlines', maxTime * gridLines)
            .Set('tickmarks', null)
            .Set('ylabels.count', maxTime / graphTicks)
            .Set('numyticks', maxTime / graphTicks)
            .Set('numxticks', maxTime / graphTicks)
            .Set('xaxis', true)
            .Set('noyaxis', false)
            .Set('chart.axis.color', 'black')
            .Set('chart.axis.linewidth', 1)
            .Set('xscale', true)
            .Set('xscale.numlabels', maxTime / graphTicks)
            .Set('xscale.zerostart', true)
            .Set('ylabels', true)
            .Set('ymin', 0)
            .Set('ymax', maxTime)
            .Set('yaxispos', 'left')
            .Set('xmin', 0)
            .Set('xmax', maxTime)
            .Set('line', true);
    };

    // this function defines the dynamic foreground graphs (it shows the data but has NO axes, labels or grid)
    setUpGraph = function (newGraph, lineColours) {
        newGraph
            .Set('gutter.left', leftGutter)
            .Set('gutter.right', rightGutter)
            .Set('gutter.top', 30)
            .Set('gutter.bottom', 50)
            .Set('title.font', 'Arial')
            .Set('title.bold', true)
            .Set('text.font', 'Arial')
            .Set('text.size', 10)
            .Set('title.yaxis', '')
            .Set('title.yaxis.bold', false)
            .Set('title.xaxis.bold', false)
            .Set('title.xaxis', '')
            .Set('title.vpos', 0.5)
            .Set('title.yaxis.pos', 0.35)
            .Set('title.xaxis.pos', 0.35)
            .Set('line.linewidth', 2)
            .Set('line.stepped', false)
            .Set('line.colors', lineColours)
            .Set('background.grid.border', false)
            .Set('background.grid.hlines', false)
            .Set('background.grid.vlines', false)
            .Set('background.grid.autofit', true)
            .Set('background.grid.autofit.numhlines', maxTime * gridLines)
            .Set('background.grid.autofit.numvlines', maxTime * gridLines)
            .Set('tickmarks', null)
            .Set('ylabels.count', maxTime / graphTicks)
            .Set('numyticks', maxTime / graphTicks)
            .Set('numxticks', maxTime / graphTicks)
            .Set('xaxis', false)
            .Set('xscale', false)
            .Set('xscale.numlabels', maxTime / graphTicks)
            .Set('xscale.zerostart', true)
            .Set('ylabels', false)
            .Set('ymin', 0)
            .Set('ymax', maxTime)
            .Set('yaxispos', 'left')
            .Set('noyaxis', true)
            .Set('xmin', 0)
            .Set('xmax', maxTime)
            .Set('line', true);

    };

    drawGraph = function () {

        // the static background graph - grid, axes, etc.
        if (!backgroundGraph) {
            backgroundGraph = new RGraph.Scatter('backgroundGraphCanvas', []);
            setUpBackgroundGraph(backgroundGraph);
            backgroundGraph.Draw();
        };

        // dynamic, data-only, graph for the ufo's worldline
        if (!objectGraph) {
            objectGraph = new RGraph.Scatter('graphCanvas', [])
            setUpGraph(objectGraph, [ufoWorldLineColour]);
        };

        // dynamic, data-only, graph for missiles (e.g. lasers)
        if (!missileGraph) {
            missileGraph = new RGraph.Scatter('graphMissileCanvas', [])
            setUpGraph(missileGraph, missileColours);
        };

        // Copy over the data points to the ufo worldline graph
        objectGraph.data[0] = graphData;

        // Copy over the data sets to the missile worldlines graph
        // Need to do these individually as simply setting "missileGraph.data = graphMissileData"
        // doesn't work for some reason.
        for (i = 0; i < graphMissileData.length; i++) {
            missileGraph.data[i] = graphMissileData[i];
        };

        objectGraph.Draw();
        missileGraph.Draw();
    };

    showTimeUpMessage = function () {

        showCountdown(); // has to be run AFTER the background images are drawn
        showLasersRemaining();

        gameContext.font = "normal 26px 'VT323', sans-serif";
        gameContext.fillStyle = "white";
        gameContext.textAlign = 'center'
        gameContext.fillText("TIME UP", gameCanvasWidth / 2, (gameCanvasHeight + ufoSize / 2) / 2);
    };

    showCountdown = function () {
        var textRight = 98 * gameCanvasWidth / 100;
        var textTop = gameCanvasHeight / 6;
        var counterTime = (maxTime * 1000 - currentTime) / 1000;
        counterTime = (counterTime > 0) ? counterTime : 0;

        gameContext.clearRect(2 * gameCanvasWidth / 3, 0, textRight, textTop + 1);

        gameContext.font = "normal 16px 'VT323', sans-serif";
        gameContext.fillStyle = "white";
        gameContext.textAlign = 'end';
        gameContext.fillText("TIME: " + counterTime.toFixed(1), textRight, textTop);
        
    };

    showLasersRemaining = function () {
        var textTop = gameCanvasHeight / 6;
        gameContext.clearRect(0, 0, 2 * gameCanvasWidth / 3, textTop + 1);

        gameContext.font = "normal 16px 'VT323', sans-serif";
        gameContext.fillStyle = "white";
        gameContext.textAlign = 'start';
        gameContext.fillText("LASERS: " + lasersRemaining + "  MISSILES: " + missilesRemaining, 2 * gameCanvasWidth / 100, textTop);

    };

    updateGraph = function (currentPosition) {
        var n;
        var numMissiles = missiles.length;
        var MissilePosition;

        // First deal with any missiles
        //
        if (numMissiles > 0) {
            n = 1;
            for (; n < numMissiles; n++) {
                MissilePosition = missiles[n].Position;
                if (MissilePosition > 0) { // check whether missile worldline has disappeared off the left of the graph
                    if (missileData[n][1] && MissilePosition !== missiles[n].startPosition) {
                        missileData[n][0] = missileData[n][1];
                    };
                    graphMissileData[n - 1][1] = [MissilePosition, currentTime / 1000, 1];
                    missileData[n][1] = [MissilePosition, currentTime / 1000, 1];
                    missileGraph.data[n - 1] = missileData[n];
                };
            };
        };

        graphData.push([currentPosition, currentTime / 1000, 1]);
        objectGraph.data[0].push([currentPosition, currentTime / 1000, 1]);

        // erase the UFO's world line
        objectGraph.Set('line.linewidth', 4);
        graphDataContext.globalCompositeOperation = "destination-out";
        objectGraph.PlotData(0);
        objectGraph.Set('line.linewidth', 2);

        // plot the UFO's world line
        graphDataContext.globalCompositeOperation = "source-over";
        objectGraph.PlotData(0);

        // update the missiles' world lines
        missileGraph.PlotData();
    };

    currentScreen = function (x) {
        return Math.floor(x / gameWidthLightSec);
    };

    rect = function (theContext, x, y, w, h) {
        theContext.beginPath();
        theContext.rect(x, y, w, h);
        theContext.closePath();
        theContext.fill();
        theContext.stroke();
    };

    drawBase = function () {
        backgroundGameContext.clearRect(0, basey, baseWidth, baseHeight);
        backgroundGameContext.drawImage(launchpad, 0, basey);
        };

    drawUFO = function (ufoPosition, ufoVelocity) {
        var ufox = ((ufoPosition / gameWidthLightSec) % 1) * gameCanvasWidth - ufoSize / 2;
        //var length = Math.round(ufoSize * Math.sqrt(1 - ufoVelocity * ufoVelocity)); // contracted length - commented out as not currently illustrating length contraction

        gameContext.clearRect(0, ufoy, gameCanvasWidth, ufoSize);

        if (ufoVelocity < 0) {
            gameContext.drawImage(ufo, 0, 0, ufoSize, ufoSize, ufox, ufoy, ufoSize, ufoSize);
        }
        else {
            gameContext.drawImage(ufo, ufoSize, 0, ufoSize, ufoSize, ufox, ufoy, ufoSize, ufoSize);
        };

    };

    // This function draws the missiles and laser pulses
    drawMissiles = function () {
        var beamLength;
        var n;
        var missileScreen;

        n = 1;
        numMissiles = missiles.length;
        for (; n < numMissiles; n++) {
            rocketX = rocket1.getPosition();
            missiles[n].missileTick(currentTime);
            missileX = missiles[n].Position;

            missileScreen = currentScreen(missileX); // find out which screen the missile is on
            if (missileScreen === ufoScreen) { // only display missile if it's on the same screen as the ufo

                beamLength = missiles[n].Extent;
                gameContext.lineWidth = missiles[n].Thickness;
                gameContext.strokeStyle = missiles[n].Colour;

                gameContext.beginPath();

                missilePlotX = ((missileX / gameWidthLightSec) % 1) * gameCanvasWidth;

                if (missilePlotX >= 0) {
                    gameContext.moveTo(missilePlotX, missilePlotY);
                    gameContext.lineTo(missilePlotX + beamLength, missilePlotY);
                };

                gameContext.fill();
                gameContext.stroke();
            };
        };

    }

    drawRandomStars = function () {
        var counter = 1;
        randomNumber.setSeed(ufoScreen + 1); // cannot use zero as a seed, so add one to the current screen
        backgroundGameContext.clearRect(0, 0, gameCanvasWidth, gameCanvasHeight); // clear
        for (; counter < visibleStars; counter++) {
            x = randomNumber.rnd() * gameCanvasWidth;
            y = randomNumber.rnd() * gameCanvasHeight;
            brightness = randomNumber.rnd();
            backgroundGameContext.fillStyle = "rgba(" + 255 + "," + 255 + "," + 255 + "," + (brightness) + ")";
            backgroundGameContext.strokeStyle = "rgba(" + 255 + "," + 255 + "," + 255 + "," + (brightness) + ")";
            rect(backgroundGameContext, x, y, 1, 1);
        }
    };

    setButtons = function () {
        document.getElementById("StartStopButton").textContent = simulationRunning ? "Stop" : "Start";
    };

    updateScale = function () {
        labelScreen.textContent = ufoScreen * gameWidthLightSec;
        labelNextScreen.textContent = (ufoScreen + 1) * gameWidthLightSec;
    };

    timerTick = function () {

        currentTime = Date.now() - timeZero;

        if (currentTime > maxTime * 1000) {
            currentTime = maxTime * 1000;
            doAnimation();
            showTimeUpMessage();
            window.cancelAnimationFrame(timer);
            stopSimulation();
        }
        else {
            doAnimation();
            timer = requestAnimationFrame(timerTick);
        };
    };

    doAnimation = function () {
        var oldScreen = ufoScreen;
        var currentPosition = rocket1.getPosition(currentTime);
        var ufoVelocity = rocket1.getSpeed();

        drawUFO(currentPosition, ufoVelocity); // this clears the game screen so needs to be called before drawMissiles()
        drawMissiles(); // this also updates the missiles' positions, so need to call this function before updateGraph()

        if (currentTime > (oldTime + 100)) { // only update graph every 100 ms (to optimise for speed)
            oldTime = currentTime;
            updateGraph(currentPosition);
        };

        ufoScreen = currentScreen(currentPosition); // find out which screen the ufo is on
        if (ufoScreen != oldScreen) {
            // screen has changed, so...
            updateScale();
            drawRandomStars();
            if (ufoScreen == 0) {
                drawBase();
            };
        };

        showCountdown(); // has to be run AFTER the background images are drawn

        // if UFO has suddenly come to a halt, then reset the speed slider control to zero
        if (ufoVelocity === 0) {
            document.getElementById("speedSlider").value = 0;
            document.getElementById("speedLabel").innerHTML = "VELOCITY: " + Number(0).toFixed(3) + " c";
        };
    };

    runSimulation = function () {

        currentTime = 0;
        rocket1.reset(startPosition);
        rocket1.setSpeed(0);
        document.getElementById("speedSlider").value = 0;
        document.getElementById("speedLabel").innerHTML = "VELOCITY: " + Number(0).toFixed(3) + " c";
        simulationRunning = true;
        setButtons();
        missiles.length = 0;
        missileData.length = 0;
        missileColours.length = 0;
        graphMissileData.length = 0;
        graphData.length = 0;
        objectGraph.data.length = 0;
        missileGraph.data.length = 0;

        RGraph.Clear(graphCanvas); // clear the graph data (worldlines)
        RGraph.Clear(graphMissileCanvas); // clear the graph data (worldlines)
        gameContext.clearRect(0, 0, gameCanvasWidth, gameCanvasHeight); // clear the game screen (sprites)

        drawBase();
        drawUFO(startPosition);
        drawGraph();

        rocket1.getPosition(currentTime);
        lasersRemaining = lasersAllowed;
        missilesRemaining = missilesAllowed;
        showLasersRemaining();

        oldTime = 0;
        timeZero = Date.now();
        
        timer = requestAnimationFrame(timerTick);

    };

    stopSimulation = function () {
        // Game over!
        window.cancelAnimationFrame(timer);
        simulationRunning = false;
        setButtons();
    };

    // this function is called when the browser window is resized
    refreshPage = function () {
        setupPage();

        if (ufoScreen == 0) {
            drawBase();
        };

        drawUFO(rocket1.getPosition());

        showCountdown();
        showLasersRemaining();

        if (currentTime == maxTime * 1000) {
            showTimeUpMessage();
        }

    };

    setupPage = function () {
        var canvasHeight = (window.innerHeight - 90) * 2 / 3;
        var canvasWidth = window.innerWidth - 60;
        canvasHeight = Math.min(canvasHeight, 110 + (canvasWidth - 100) / 2);

        canvasHeight = Math.max(canvasHeight, 200); // 200px is the absolute minimum height allowed for the graph canvas
        canvasWidth = canvasHeight;

        document.getElementById("buttonDiv").style.width = canvasWidth + "px";

        graphMissileCanvas.height = canvasHeight;
        graphMissileCanvas.width = canvasWidth;
        graphCanvas.height = canvasHeight;
        graphCanvas.width = canvasWidth;
        //
        gameCanvasWidth = canvasWidth + 1;
        gameCanvasHeight = canvasHeight / 4;
        gameCanvas.width = gameCanvasWidth;
        gameCanvas.height = gameCanvasHeight;
        
        // now work out where to position the mothership sprite
        basey = (gameCanvasHeight - baseHeight) / 2;

        backgroundGraphCanvas.width = canvasWidth;
        backgroundGraphCanvas.height = canvasHeight;
        backgroundGameCanvas.width = gameCanvasWidth;
        backgroundGameCanvas.height = gameCanvasHeight;

        //

        backgroundGraphCanvas.__rgraph_aa_translated__ = false; // changing dimensions requires antialiasing fix to be reapplied
        backgroundGraph = null; // destroy graph so that it will be recreated (and hence redrawn) within the drawGraph() function

        graphCanvas.__rgraph_aa_translated__ = false; // changing dimensions requires antialiasing fix to be reapplied
        objectGraph = null; // destroy graph so that it will be recreated (and hence redrawn) within the drawGraph() function

        graphMissileCanvas.__rgraph_aa_translated__ = false; // changing dimensions requires antialiasing fix to be reapplied
        missileGraph = null; // destroy graph so that it will be recreated (and hence redrawn) within the drawGraph() function

        drawGraph();
        ufoy = (gameCanvasHeight - ufoSize) / 2;
        missilePlotY = ufoy + Math.round(ufoSize / 2);

        drawRandomStars();
        updateScale();
        //
    };

    loadImages = function () {
        launchpad.src = "mothership.png";
        launchpad.onload = function () {
            drawBase();
        };
        ufo.src = "rocket.png";
        ufo.onload = function () {
            drawUFO(startPosition);
            showCountdown(); // has to be run AFTER the background images are drawn
            showLasersRemaining();
        };
    };

    //

    // ** Main program code

    setButtons();
    window.addEventListener('resize', refreshPage, false); // Register an event listener to call refreshPage() when window is resized
    setupPage();
    loadImages();

    //


    return {
        // Expose public methods which wrap the private ones
        StartStopSimulation: function () {
            if (!simulationRunning) {
                runSimulation();
            }
            else {
                stopSimulation();
            };
        },
        FireLaser: function () {
            if (simulationRunning && lasersRemaining > 0) {
                // add a new laser to the missiles array
                var n = missiles.length || 1;
                var rocketSpeed = rocket1.getSpeed();
                missiles[n] = missile(rocketSpeed, 1);
                missiles[n].StartPosition = rocket1.getPosition()
                missiles[n].StartTime = currentTime;
                missileData[n] = []
                graphMissileData[n - 1] = [];
                graphMissileData[n - 1][0] = [missiles[n].StartPosition, missiles[n].StartTime / 1000, 1];
                missileData[n].push([missiles[n].StartPosition, missiles[n].StartTime / 1000, 1]);
                lasersRemaining -= 1; // reduce the number of laser shots left by one
                showLasersRemaining();

                // Set colour of this missile in the list of missile worldline colours.
                // NB. this array is zero-indexed.
                missileColours[n - 1] = missiles[n].Colour;
                // set colours of graph lines to the updated list of missile worldline colours
                missileGraph.Set('line.colors', missileColours);
                
            };
        },
        FireMissile: function () {
            if (simulationRunning && missilesRemaining > 0) {
                // add a new missile to the missiles array
                var n = missiles.length || 1;
                var rocketSpeed = rocket1.getSpeed();
                missiles[n] = missile(rocketSpeed, missileSpeed);
                missiles[n].StartPosition = rocket1.getPosition()
                missiles[n].StartTime = currentTime;
                missiles[n].Colour = missileColour;
                missiles[n].Extent = ufoSize / 4;
                missiles[n].Thickness = 4;
                missileData[n] = []
                graphMissileData[n - 1] = [];
                graphMissileData[n - 1][0] = [missiles[n].StartPosition, missiles[n].StartTime / 1000, 1];
                missileData[n].push([missiles[n].StartPosition, missiles[n].StartTime / 1000, 1]);
                missilesRemaining -= 1; // reduce the number of missiles by one
                showLasersRemaining(); // this displays number of lasers AND number of missiles remaining

                // Set colour of this missile in the list of missile worldline colours.
                // NB. this array is zero-indexed.
                missileColours[n - 1] = missiles[n].Colour;
                // set colours of graph lines to the updated list of missile worldline colours
                missileGraph.Set('line.colors', missileColours);

            };
        },
        speedChanged: function (newSpeed) {
            newSpeed = parseFloat(newSpeed); // for some reason the range input control sends its value as a string, so need to convert to number
            rocket1.setSpeed(newSpeed);
            // now display the speed to 3 d.p.
            document.getElementById("speedLabel").innerHTML = "VELOCITY: " + Number(newSpeed).toFixed(3) + " c";
        }
    };

})();

