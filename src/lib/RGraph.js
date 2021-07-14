    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/license                           |
    * o------------------------------------------------------------------------------o
    */

    /**
    * Initialise the various objects
    */
   /* eslint-disable */
     if (typeof(RGraph) == 'undefined') var RGraph = {isRGraph:true,type:'common'};

     RGraph.Highlight      = {};
     RGraph.Registry       = {};
     RGraph.Registry.store = [];
     RGraph.Registry.store['chart.event.handlers']       = [];
     RGraph.Registry.store['__rgraph_event_listeners__'] = []; // Used in the new system for tooltips
     RGraph.background     = {};
     RGraph.objects        = [];
     RGraph.Resizing       = {};
     RGraph.events         = [];
     RGraph.cursor         = [];
 
     RGraph.ObjectRegistry                    = {};
     RGraph.ObjectRegistry.objects            = {};
     RGraph.ObjectRegistry.objects.byUID      = [];
     RGraph.ObjectRegistry.objects.byCanvasID = [];
 
 
     /**
     * Some "constants"
     */
     var PI       = Math.PI;
     var HALFPI   = PI / 2;
     var TWOPI    = PI * 2;
    //  var ISFF     = navigator.userAgent.indexOf('Firefox') != -1;
     var ISOPERA  = navigator.userAgent.indexOf('Opera') != -1;
     var ISCHROME = navigator.userAgent.indexOf('Chrome') != -1;
     var ISSAFARI = navigator.userAgent.indexOf('Safari') != -1 && !ISCHROME;
     var ISWEBKIT = navigator.userAgent.indexOf('WebKit') != -1;
     //ISIE     is defined below
     //ISIE6    is defined below
     //ISIE7    is defined below
     //ISIE8    is defined below
     //ISIE9    is defined below
     //ISIE9    is defined below
     //ISIE9UP  is defined below
     //ISIE10   is defined below
     //ISIE10UP is defined below
     //ISOLD    is defined below
 
 
     /**
     * Returns five values which are used as a nice scale
     * 
     * @param  max int    The maximum value of the graph
     * @param  obj object The graph object
     * @return     array   An appropriate scale
     */
     RGraph.getScale = function (max, obj)
     {
         /**
         * Special case for 0
         */
         if (max == 0) {
             return ['0.2', '0.4', '0.6', '0.8', '1.0'];
         }
 
         var original_max = max;
 
         /**
         * Manually do decimals
         */
         if (max <= 1) {
             if (max > 0.5) {
                 return [0.2,0.4,0.6,0.8, Number(1).toFixed(1)];
 
             } else if (max >= 0.1) {
                 return obj.Get('chart.scale.round') ? [0.2,0.4,0.6,0.8,1] : [0.1,0.2,0.3,0.4,0.5];
 
             } else {
 
                 var tmp = max;
                 var exp = 0;
 
                 while (tmp < 1.01) {
                     exp += 1;
                     tmp *= 10;
                 }
 
                 var ret = ['2e-' + exp, '4e-' + exp, '6e-' + exp, '8e-' + exp, '10e-' + exp];
 
 
                 if (max <= ('5e-' + exp)) {
                     ret = ['1e-' + exp, '2e-' + exp, '3e-' + exp, '4e-' + exp, '5e-' + exp];
                 }
 
                 return ret;
             }
         }
 
         // Take off any decimals
         if (String(max).indexOf('.') > 0) {
             max = String(max).replace(/\.\d+$/, '');
         }
 
         var interval = Math.pow(10, Number(String(Number(max)).length - 1));
         var topValue = interval;
 
         while (topValue < max) {
             topValue += (interval / 2);
         }
 
         // Handles cases where the max is (for example) 50.5
         if (Number(original_max) > Number(topValue)) {
             topValue += (interval / 2);
         }
 
         // Custom if the max is greater than 5 and less than 10
         if (max < 10) {
             topValue = (Number(original_max) <= 5 ? 5 : 10);
         }
         
         /**
         * Added 02/11/2010 to create "nicer" scales
         */
         if (obj && typeof(obj.Get('chart.scale.round')) == 'boolean' && obj.Get('chart.scale.round')) {
             topValue = 10 * interval;
         }
 
         return [topValue * 0.2, topValue * 0.4, topValue * 0.6, topValue * 0.8, topValue];
     }
 
 
     /**
     * Returns an appropriate scale. The return value is actualy anm object consiosting of:
     *  scale.max
     *  scale.min
     *  scale.scale
     * 
     * @param  obj object  The graph object
     * @param  prop object An object consisting of configuration properties
     * @return     object  An object containg scale information
     */
     RGraph.getScale2 = function (obj, opt)
     {
         var RG   = RGraph;
         var ca   = obj.canvas;
         var co   = obj.context;
         var prop = obj.properties;
         
         var numlabels    = typeof(opt['ylabels.count']) == 'number' ? opt['ylabels.count'] : 5;
         var units_pre    = typeof(opt['units.pre']) == 'string' ? opt['units.pre'] : '';
         var units_post   = typeof(opt['units.post']) == 'string' ? opt['units.post'] : '';
         var max          = Number(opt['max']);
         var min          = typeof(opt['min']) == 'number' ? opt['min'] : 0;
         var strict       = opt['strict'];
         var decimals     = Number(opt['scale.decimals']); // Sometimes the default is null
         var point        = opt['scale.point']; // Default is a string in all chart libraries so no need to cast it
         var thousand     = opt['scale.thousand']; // Default is a string in all chart libraries so no need to cast it
         var original_max = max;
         var round        = opt['scale.round'];
         var scale        = {'max':1,'labels':[]};
 
 
 
         /**
         * Special case for 0
         * 
         * ** Must be first **
         */
         if (!max) {
 
             var max   = 1;
 
             var scale = {max:1,min:0,labels:[]};
 
             for (var i=0; i<numlabels; ++i) {
                 var label = ((((max - min) / numlabels) + min) * (i + 1)).toFixed(decimals);
                 scale.labels.push(units_pre + label + units_post);
             }
 
         /**
         * Manually do decimals
         */
         } else if (max <= 1 && !strict) {
 
             if (max > 0.5) {
 
                 max  = 1;
                 min  = min;
                 scale.min = min;
 
                 for (var i=0; i<numlabels; ++i) {
                     var label = ((((max - min) / numlabels) * (i + 1)) + min).toFixed(decimals);
 
                     scale.labels.push(units_pre + label + units_post);
                 }
 
             } else if (max >= 0.1) {
                 
                 max   = 0.5;
                 min   = min;
                 scale = {'max': 0.5, 'min':min,'labels':[]}
 
                 for (var i=0; i<numlabels; ++i) {
                     var label = ((((max - min) / numlabels) + min) * (i + 1)).toFixed(decimals);
                     scale.labels.push(units_pre + label + units_post);
                 }
 
             } else {
 
                 scale = {'min':min,'labels':[]}
                 var max_str = String(max);
                 
                 if (max_str.indexOf('e') > 0) {
                     var numdecimals = Math.abs(max_str.substring(max_str.indexOf('e') + 1));
                 } else {
                     var numdecimals = String(max).length - 2;
                 }
 
                 var max = 1  / Math.pow(10,numdecimals - 1);
 
                 for (var i=0; i<numlabels; ++i) {
                     var label = ((((max - min) / numlabels) + min) * (i + 1));
                         label = label.toExponential();
                         label = label.split(/e/);
                         label[0] = Math.round(label[0]);
                         label = label.join('e');
                     scale.labels.push(label);
                 }
 
                 //This makes the top scale value of the format 10e-2 instead of 1e-1
                 tmp = scale.labels[scale.labels.length - 1].split(/e/);
                 tmp[0] += 0;
                 tmp[1] = Number(tmp[1]) - 1;
                 tmp = tmp[0] + 'e' + tmp[1];
                 scale.labels[scale.labels.length - 1] = tmp;
                 
                 // Add the units
                 for (var i=0; i<scale.labels.length ; ++i) {
                     scale.labels[i] = units_pre + scale.labels[i] + units_post;
                 }
                 
                 scale.max = Number(max);
             }
 
 
         } else if (!strict) {
 
 
             /**
             * Now comes the scale handling for integer values
             */
 
 
             // This accomodates decimals by rounding the max up to the next integer
             max = Math.ceil(max);
 
             var interval = Math.pow(10, Math.max(1, Number(String(Number(max) - Number(min)).length - 1)) );
 
             var topValue = interval;
 
             while (topValue < max) {
                 topValue += (interval / 2);
             }
     
             // Handles cases where the max is (for example) 50.5
             if (Number(original_max) > Number(topValue)) {
                 topValue += (interval / 2);
             }
 
             // Custom if the max is greater than 5 and less than 10
             if (max <= 10) {
                 topValue = (Number(original_max) <= 5 ? 5 : 10);
             }
     
     
             // Added 02/11/2010 to create "nicer" scales
             if (obj && typeof(round) == 'boolean' && round) {
                 topValue = 10 * interval;
             }
 
             scale.max = topValue;
 
             // Now generate the scale. Temporarily set the objects chart.scale.decimal and chart.scale.point to those
             //that we've been given as the number_format functuion looks at those instead of using argumrnts.
             var tmp_point    = prop['chart.scale.point'];
             var tmp_thousand = prop['chart.scale.thousand'];
 
             obj.Set('chart.scale.thousand', thousand);
             obj.Set('chart.scale.point', point);
 
 
             for (var i=0; i<numlabels; ++i) {
                 scale.labels.push( RG.number_format(obj, ((((i+1) / numlabels) * (topValue - min)) + min).toFixed(decimals), units_pre, units_post) );
             }
 
             obj.Set('chart.scale.thousand', tmp_thousand);
             obj.Set('chart.scale.point', tmp_point);
         
         } else if (typeof(max) == 'number' && strict) {
 
             /**
             * ymax is set and also strict
             */
             for (var i=0; i<numlabels; ++i) {
                 scale.labels.push( RG.number_format(obj, ((((i+1) / numlabels) * (max - min)) + min).toFixed(decimals), units_pre, units_post) );
             }
             
             // ???
             scale.max = max;
         }
 
         
         scale.units_pre  = units_pre;
         scale.units_post = units_post;
         scale.point      = point;
         scale.decimals   = decimals;
         scale.thousand   = thousand;
         scale.numlabels  = numlabels;
         scale.round      = Boolean(round);
         scale.min        = min;
 
 
         return scale;
     }
 
 
 
 
 
 
 
 
 
 
 
 
     /**
     * Returns the maximum numeric value which is in an array
     * 
     * @param  array arr The array (can also be a number, in which case it's returned as-is)
     * @param  int       Whether to ignore signs (ie negative/positive)
     * @return int       The maximum value in the array
     */
     RGraph.array_max = function (arr)
     {
         var max       = null;
         var MathLocal = Math;
         
         if (typeof(arr) == 'number') {
             return arr;
         }
         
         if (RGraph.is_null(arr)) {
             return 0;
         }
 
         for (var i=0,len=arr.length; i<len; ++i) {
             if (typeof(arr[i]) == 'number') {
 
                 var val = arguments[1] ? MathLocal.abs(arr[i]) : arr[i];
                 
                 if (typeof max == 'number') {
                     max = MathLocal.max(max, val);
                 } else {
                     max = val;
                 }
             }
         }
         
         return max;
     }
 
 
 
 
     /**
     * Returns the maximum value which is in an array
     * 
     * @param  array arr The array
     * @param  int   len The length to pad the array to
     * @param  mixed     The value to use to pad the array (optional)
     */
     RGraph.array_pad = function (arr, len)
     {
         if (arr.length < len) {
             var val = arguments[2] ? arguments[2] : null;
             
             for (var i=arr.length; i<len; i+=1) {
                 arr[i] = val;
             }
         }
         
         return arr;
     }
 
 
 
 
     /**
     * An array sum function
     * 
     * @param  array arr The  array to calculate the total of
     * @return int       The summed total of the arrays elements
     */
     RGraph.array_sum = function (arr)
     {
         // Allow integers
         if (typeof(arr) == 'number') {
             return arr;
         }
         
         // Account for null
         if (RGraph.is_null(arr)) {
             return 0;
         }
 
         var i, sum;
         var len = arr.length;
 
         for(i=0,sum=0;i<len;sum+=arr[i++]);
         return sum;
     }
 
 
 
 
     /**
     * Takes any number of arguments and adds them to one big linear array
     * which is then returned
     * 
     * @param ... mixed The data to linearise. You can strings, booleans, numbers or arrays
     */
     RGraph.array_linearize = function ()
     {
         var arr  = [];
         var args = arguments;
         var RG   = RGraph;
 
         for (var i=0,len=args.length; i<len; ++i) {
 
             if (typeof(args[i]) == 'object' && args[i]) {
                 for (var j=0; j<args[i].length; ++j) {
                     var sub = RG.array_linearize(args[i][j]);
                     
                     for (var k=0; k<sub.length; ++k) {
                         arr.push(sub[k]);
                     }
                 }
             } else {
                 arr.push(args[i]);
             }
         }
 
         return arr;
     }
 
 
 
 
     /**
     * This is a useful function which is basically a shortcut for drawing left, right, top and bottom alligned text.
     * 
     * @param object context The context
     * @param string font    The font
     * @param int    size    The size of the text
     * @param int    x       The X coordinate
     * @param int    y       The Y coordinate
     * @param string text    The text to draw
     * @parm  string         The vertical alignment. Can be null. "center" gives center aligned  text, "top" gives top aligned text.
     *                       Anything else produces bottom aligned text. Default is bottom.
     * @param  string        The horizontal alignment. Can be null. "center" gives center aligned  text, "right" gives right aligned text.
     *                       Anything else produces left aligned text. Default is left.
     * @param  bool          Whether to show a bounding box around the text. Defaults not to
     * @param int            The angle that the text should be rotate at (IN DEGREES)
     * @param string         Background color for the text
     * @param bool           Whether the text is bold or not
     */
     RGraph.Text = function (context, font, size, x, y, text)
     {
         // "Cache" the args as a local variable
         var args = arguments;
 
         // Handle undefined - change it to an empty string
         if ((typeof(text) != 'string' && typeof(text) != 'number') || text == 'undefined') {
             return;
         }
 
 
 
 
         /**
         * This accommodates multi-line text
         */
         if (typeof(text) == 'string' && text.match(/\r\n/)) {
 
             var dimensions = RGraph.MeasureText('M', args[11], font, size);
 
             /**
             * Measure the text (width and height)
             */
 
             var arr = text.split('\r\n');
 
             /**
             * Adjust the Y position
             */
             
             // This adjusts the initial y position
             if (args[6] && args[6] == 'center') y = (y - (dimensions[1] * ((arr.length - 1) / 2)));
 
             for (var i=1; i<arr.length; ++i) {
     
                 RGraph.Text(context,
                             font,
                             size,
                             args[9] == -90 ? (x + (size * 1.5)) : x,
                             y + (dimensions[1] * i),
                             arr[i],
                             args[6] ? args[6] : null,
                             args[7],
                             args[8],
                             args[9],
                             args[10],
                             args[11],
                             args[12]);
             }
             
             // Update text to just be the first line
             text = arr[0];
         }
 
 
         // Accommodate MSIE
         if (document.all && ISOLD) {
             y += 2;
         }
 
 
         context.font = (args[11] ? 'Bold ': '') + size + 'pt ' + font;
 
         var i;
         var origX = x;
         var origY = y;
         var originalFillStyle = context.fillStyle;
         var originalLineWidth = context.lineWidth;
 
         // Need these now the angle can be specified, ie defaults for the former two args
         if (typeof(args[6])  == 'undefined') args[6]  = 'bottom'; // Vertical alignment. Default to bottom/baseline
         if (typeof(args[7])  == 'undefined') args[7]  = 'left';   // Horizontal alignment. Default to left
         if (typeof(args[8])  == 'undefined') args[8]  = null;     // Show a bounding box. Useful for positioning during development. Defaults to false
         if (typeof(args[9])  == 'undefined') args[9]  = 0;        // Angle (IN DEGREES) that the text should be drawn at. 0 is middle right, and it goes clockwise
 
         // The alignment is recorded here for purposes of Opera compatibility
         if (navigator.userAgent.indexOf('Opera') != -1) {
             context.canvas.__rgraph_valign__ = args[6];
             context.canvas.__rgraph_halign__ = args[7];
         }
 
         // First, translate to x/y coords
         context.save();
 
             context.canvas.__rgraph_originalx__ = x;
             context.canvas.__rgraph_originaly__ = y;
 
             context.translate(x, y);
             x = 0;
             y = 0;
 
             // Rotate the canvas if need be
             if (args[9]) {
                 context.rotate(args[9] / (180 / PI));
             }
 
 
             // Vertical alignment - defaults to bottom
             if (args[6]) {
 
                 var vAlign = args[6];
 
                 if (vAlign == 'center') {
                     context.textBaseline = 'middle';
                 } else if (vAlign == 'top') {
                     context.textBaseline = 'top';
                 }
             }
 
 
             // Hoeizontal alignment - defaults to left
             if (args[7]) {
 
                 var hAlign = args[7];
                 var width  = context.measureText(text).width;
     
                 if (hAlign) {
                     if (hAlign == 'center') {
                         context.textAlign = 'center';
                     } else if (hAlign == 'right') {
                         context.textAlign = 'right';
                     }
                 }
             }
             
             
             context.fillStyle = originalFillStyle;
 
             /**
             * Draw a bounding box if requested
             */
             context.save();
                  context.fillText(text,0,0);
                  context.lineWidth = 1;
 
                 var width = context.measureText(text).width;
                 var width_offset = (hAlign == 'center' ? (width / 2) : (hAlign == 'right' ? width : 0));
                 var height = size * 1.5; // !!!
                 var height_offset = (vAlign == 'center' ? (height / 2) : (vAlign == 'top' ? height : 0));
                 var ieOffset = ISOLD ? 2 : 0;
 
                 if (args[8]) {
 
                     context.strokeRect(-3 - width_offset,
                                        0 - 3 - height - ieOffset + height_offset,
                                        width + 6,
                                        height + 6);
                     /**
                     * If requested, draw a background for the text
                     */
                     if (args[10]) {
                         context.fillStyle = args[10];
                         context.fillRect(-3 - width_offset,
                                            0 - 3 - height - ieOffset + height_offset,
                                            width + 6,
                                            height + 6);
                     }
 
                     
                     context.fillStyle = originalFillStyle;
 
 
                     /**
                     * Do the actual drawing of the text
                     */
                     context.fillText(text,0,0);
                 }
             context.restore();
             
             // Reset the lineWidth
             context.lineWidth = originalLineWidth;
 
         context.restore();
     }
 
 
 
 
     /**
     * Clears the canvas by setting the width. You can specify a colour if you wish.
     * 
     * @param object canvas The canvas to clear
     */
     RGraph.Clear = function (ca)
     {
         var RG    = RGraph;
         var co    = ca.getContext('2d');
         var color = arguments[1];
 
         if (!ca) {
             return;
         }
         
         RG.FireCustomEvent(ca.__object__, 'onbeforeclear');
 
         if (ISIE8 && !color) {
             color = 'white';
         }
 
         /**
         * Can now clear the canvas back to fully transparent
         */
         if (!color || (color && color == 'rgba(0,0,0,0)' || color == 'transparent')) {
 
             co.clearRect(0,0,ca.width, ca.height);
             
             // Reset the globalCompositeOperation
             co.globalCompositeOperation = 'source-over';
 
         } else {
 
             co.fillStyle = color;
             co.beginPath();
 
             if (ISIE8) {
                 co.fillRect(0,0,ca.width,ca.height);
             } else {
                 co.fillRect(-10,-10,ca.width + 20,ca.height + 20);
             }
 
             co.fill();
         }
         
         //if (RG.ClearAnnotations) {
             //RG.ClearAnnotations(ca.id);
         //}
         
         /**
         * This removes any background image that may be present
         */
         if (RG.Registry.Get('chart.background.image.' + ca.id)) {
             var img = RG.Registry.Get('chart.background.image.' + ca.id);
             img.style.position = 'absolute';
             img.style.left     = '-10000px';
             img.style.top      = '-10000px';
         }
         
         /**
         * This hides the tooltip that is showing IF it has the same canvas ID as
         * that which is being cleared
         */
         if (RG.Registry.Get('chart.tooltip')) {
             RG.HideTooltip(ca);
             //RG.Redraw();
         }
 
         /**
         * Set the cursor to default
         */
         ca.style.cursor = 'default';
 
         RG.FireCustomEvent(ca.__object__, 'onclear');
     }
 
 
 
 
     /**
     * Draws the title of the graph
     * 
     * @param object  canvas The canvas object
     * @param string  text   The title to write
     * @param integer gutter The size of the gutter
     * @param integer        The center X point (optional - if not given it will be generated from the canvas width)
     * @param integer        Size of the text. If not given it will be 14
     */
     RGraph.DrawTitle = function (obj, text, gutterTop)
     {
         var RG           = RGraph;
         var ca = obj.canvas;
         var co = obj.context;
         var canvas  = obj.canvas;
         var context = obj.context;
         var prop         = obj.properties;
 
         var gutterLeft   = prop['chart.gutter.left'];
         var gutterRight  = prop['chart.gutter.right'];
         var gutterTop    = gutterTop;
         var gutterBottom = prop['chart.gutter.bottom'];
         var size         = arguments[4] ? arguments[4] : 12;
         var bold         = prop['chart.title.bold'];
         var centerx      = (arguments[3] ? arguments[3] : ((ca.width - gutterLeft - gutterRight) / 2) + gutterLeft);
         var keypos       = prop['chart.key.position'];
         var vpos         = prop['chart.title.vpos'];
         var hpos         = prop['chart.title.hpos'];
         var bgcolor      = prop['chart.title.background'];
         var x            = prop['chart.title.x'];
         var y            = prop['chart.title.y'];
         var halign       = 'center';
         var valign       = 'center';
 
         // Account for 3D effect by faking the key position
         if (obj.type == 'bar' && prop['chart.variant'] == '3d') {
             keypos = 'gutter';
         }
 
         co.beginPath();
         co.fillStyle = prop['chart.text.color'] ? prop['chart.text.color'] : 'black';
 
 
 
 
 
         /**
         * Vertically center the text if the key is not present
         */
         if (keypos && keypos != 'gutter') {
             var valign = 'center';
 
         } else if (!keypos) {
             var valign = 'center';
 
         } else {
             var valign = 'bottom';
         }
 
 
 
 
 
         // if chart.title.vpos is a number, use that
         if (typeof(prop['chart.title.vpos']) == 'number') {
             vpos = prop['chart.title.vpos'] * gutterTop;
 
             if (prop['chart.xaxispos'] == 'top') {
                 vpos = prop['chart.title.vpos'] * gutterBottom + gutterTop + (ca.height - gutterTop - gutterBottom);
             }
 
         } else {
             vpos = gutterTop - size - 5;
 
             if (prop['chart.xaxispos'] == 'top') {
                 vpos = ca.height  - gutterBottom + size + 5;
             }
         }
 
 
 
 
         // if chart.title.hpos is a number, use that. It's multiplied with the (entire) canvas width
         if (typeof(hpos) == 'number') {
             centerx = hpos * ca.width;
         }
 
         /**
         * Now the chart.title.x and chart.title.y settings override (is set) the above
         */
         if (typeof(x) == 'number') centerx = x;
         if (typeof(y) == 'number') vpos    = y;
 
 
 
 
         /**
         * Horizontal alignment can now (Jan 2013) be specified
         */
         if (typeof(prop['chart.title.halign']) == 'string') {
             halign = prop['chart.title.halign'];
         }
         
         /**
         * Vertical alignment can now (Jan 2013) be specified
         */
         if (typeof(prop['chart.title.valign']) == 'string') {
             valign = prop['chart.title.valign'];
         }
 
 
 
 
         
         // Set the colour
         if (typeof(prop['chart.title.color'] != null)) {
             var oldColor = co.fillStyle
             var newColor = prop['chart.title.color']
             co.fillStyle = newColor ? newColor : 'black';
         }
 
 
 
 
         /**
         * Default font is Arial
         */
         var font = prop['chart.text.font'];
 
 
 
 
         /**
         * Override the default font with chart.title.font
         */
         if (typeof(prop['chart.title.font']) == 'string') {
             font = prop['chart.title.font'];
         }
 
 
 
 
         /**
         * Draw the title
         */
         RG.Text2(obj,{'font':font,
                           'size':size,
                           'x':centerx,
                           'y':vpos,
                           'text':text,
                           'valign':valign,
                           'halign':halign,
                           'bounding':bgcolor != null,
                           'bounding.fill':bgcolor,
                           'bold':bold,
                           'tag':'title'
                          });
         
         // Reset the fill colour
         co.fillStyle = oldColor;
     }
 
 
 
 
 
     /**
     * This function returns the mouse position in relation to the canvas
     * 
     * @param object e The event object.
     *
     RGraph.getMouseXY = function (e)
     {
         var el = (ISOLD ? event.srcElement : e.target);
         var x;
         var y;
 
         // ???
         var paddingLeft = el.style.paddingLeft ? parseInt(el.style.paddingLeft) : 0;
         var paddingTop  = el.style.paddingTop ? parseInt(el.style.paddingTop) : 0;
         var borderLeft  = el.style.borderLeftWidth ? parseInt(el.style.borderLeftWidth) : 0;
         var borderTop   = el.style.borderTopWidth  ? parseInt(el.style.borderTopWidth) : 0;
         
         if (ISIE8) e = event;
 
         // Browser with offsetX and offsetY
         if (typeof(e.offsetX) == 'number' && typeof(e.offsetY) == 'number') {
             x = e.offsetX;
             y = e.offsetY;
 
         // FF and other
         } else {
             x = 0;
             y = 0;
 
             while (el != document.body && el) {
                 x += el.offsetLeft;
                 y += el.offsetTop;
 
                 el = el.offsetParent;
             }
 
             x = e.pageX - x;
             y = e.pageY - y;
         }
 
         return [x, y];
     }*/
 
 
     RGraph.getMouseXY = function(e)
     {
         var el      = e.target;
         var ca      = el;
         var caStyle = ca.style;
         var offsetX = 0;
         var offsetY = 0;
         var x;
         var y;
         var ISFIXED     = (ca.style.position == 'fixed');
         var borderLeft  = parseInt(caStyle.borderLeftWidth) || 0;
         var borderTop   = parseInt(caStyle.borderTopWidth) || 0;
         var paddingLeft = parseInt(caStyle.paddingLeft) || 0
         var paddingTop  = parseInt(caStyle.paddingTop) || 0
         var additionalX = borderLeft + paddingLeft;
         var additionalY = borderTop + paddingTop;
 
 
         if (typeof(e.offsetX) == 'number' && typeof(e.offsetY) == 'number') {
 
             if (ISFIXED) {
                 if (ISOPERA) {
                     x = e.offsetX;
                     y = e.offsetY;
                 
                 } else if (ISWEBKIT) {
                     x = e.offsetX - paddingLeft - borderLeft;
                     y = e.offsetY - paddingTop - borderTop;
                 
                 } else if (ISIE) {
                     x = e.offsetX - paddingLeft;
                     y = e.offsetY - paddingTop;
     
                 } else {
                     x = e.offsetX;
                     y = e.offsetY;
                 }
     
     
     
     
             } else {
     
     
     
     
                 if (!ISIE && !ISOPERA) {
                     x = e.offsetX - borderLeft - paddingLeft;
                     y = e.offsetY - borderTop - paddingTop;
                 
                 } else if (ISIE) {
                     x = e.offsetX - paddingLeft;
                     y = e.offsetY - paddingTop;
                 
                 } else {
                     x = e.offsetX;
                     y = e.offsetY;
                 }
             }   
 
         } else {
 
             if (typeof(el.offsetParent) != 'undefined') {
                 do {
                     offsetX += el.offsetLeft;
                     offsetY += el.offsetTop;
                 } while ((el = el.offsetParent));
             }
 
             x = e.pageX - offsetX - additionalX;
             y = e.pageY - offsetY - additionalY;
 
             x -= (2 * (parseInt(document.body.style.borderLeftWidth) || 0));
             y -= (2 * (parseInt(document.body.style.borderTopWidth) || 0));
 
             //x += (parseInt(caStyle.borderLeftWidth) || 0);
             //y += (parseInt(caStyle.borderTopWidth) || 0);
         }
 
         // We return a javascript array with x and y defined
         return [x, y];
     }
 
 
 
 
     /**
     * This function returns a two element array of the canvas x/y position in
     * relation to the page
     * 
     * @param object canvas
     */
     RGraph.getCanvasXY = function (canvas)
     {
         var x  = 0;
         var y  = 0;
         var el = canvas; // !!!
 
         do {
 
             x += el.offsetLeft;
             y += el.offsetTop;
             
             // ACCOUNT FOR TABLES IN wEBkIT
             if (el.tagName.toLowerCase() == 'table' && (ISCHROME || ISSAFARI)) {
                 x += parseInt(el.border) || 0;
                 y += parseInt(el.border) || 0;
             }
 
             el = el.offsetParent;
 
         } while (el && el.tagName.toLowerCase() != 'body');
 
 
         var paddingLeft = canvas.style.paddingLeft ? parseInt(canvas.style.paddingLeft) : 0;
         var paddingTop  = canvas.style.paddingTop ? parseInt(canvas.style.paddingTop) : 0;
         var borderLeft  = canvas.style.borderLeftWidth ? parseInt(canvas.style.borderLeftWidth) : 0;
         var borderTop   = canvas.style.borderTopWidth  ? parseInt(canvas.style.borderTopWidth) : 0;
 
         if (navigator.userAgent.indexOf('Firefox') > 0) {
             x += parseInt(document.body.style.borderLeftWidth) || 0;
             y += parseInt(document.body.style.borderTopWidth) || 0;
         }
 
         return [x + paddingLeft + borderLeft, y + paddingTop + borderTop];
     }
 
 
 
 
     /**
     * This function determines whther a canvas is fixed (CSS positioning) or not. If not it returns
     * false. If it is then the element that is fixed is returned (it may be a parent of the canvas).
     * 
     * @return Either false or the fixed positioned element
     */
     RGraph.isFixed = function (canvas)
     {
         var obj = canvas;
         var i = 0;
 
         while (obj && obj.tagName.toLowerCase() != 'body' && i < 99) {
 
             if (obj.style.position == 'fixed') {
                 return obj;
             }
             
             obj = obj.offsetParent;
         }
 
         return false;
     }
 
 
 
 
     /**
     * Registers a graph object (used when the canvas is redrawn)
     * 
     * @param object obj The object to be registered
     */
     RGraph.Register = function (obj)
     {
         // Checking this property ensures the object is only registered once
         if (!obj.Get('chart.noregister')) {
             // As of 21st/1/2012 the object registry is now used
             RGraph.ObjectRegistry.Add(obj);
             obj.Set('chart.noregister', true);
         }
     }
 
 
 
 
     /**
     * Causes all registered objects to be redrawn
     * 
     * @param string An optional color to use to clear the canvas
     */
     RGraph.Redraw = function ()
     {
         var objectRegistry = RGraph.ObjectRegistry.objects.byCanvasID;
 
         // Get all of the canvas tags on the page
         var tags = document.getElementsByTagName('canvas');
 
         for (var i=0,len=tags.length; i<len; ++i) {
             if (tags[i].__object__ && tags[i].__object__.isRGraph) {
                 
                 // Only clear the canvas if it's not Trace'ing - this applies to the Line/Scatter Trace effects
                 if (!tags[i].noclear) {
                     RGraph.Clear(tags[i], arguments[0] ? arguments[0] : null);
                 }
             }
         }
 
         // Go through the object registry and redraw *all* of the canvas'es that have been registered
         for (var i=0,len=objectRegistry.length; i<len; ++i) {
             if (objectRegistry[i]) {
                 var id = objectRegistry[i][0];
                 objectRegistry[i][1].Draw();
             }
         }
     }
 
 
 
 
     /**
     * Causes all registered objects ON THE GIVEN CANVAS to be redrawn
     * 
     * @param canvas object The canvas object to redraw
     * @param        bool   Optional boolean which defaults to true and determines whether to clear the canvas
     */
     RGraph.RedrawCanvas = function (canvas)
     {
         var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);
 
         /**
         * First clear the canvas
         */
         if (!arguments[1] || (typeof(arguments[1]) == 'boolean' && !arguments[1] == false) ) {
             RGraph.Clear(canvas);
         }
 
         /**
         * Now redraw all the charts associated with that canvas
         */
         for (var i=0,len=objects.length; i<len; ++i) {
             if (objects[i]) {
                 if (objects[i] && objects[i].isRGraph) { // Is it an RGraph object ??
                     objects[i].Draw();
                 }
             }
         }
     }
 
 
 
 
     /**
     * This function draws the background for the bar chart, line chart and scatter chart.
     * 
     * @param  object obj The graph object
     */
     RGraph.background.Draw = function (obj)
     {
         var RG           = RGraph;
         var ca = obj.canvas;
         var co = obj.context;
         var canvas  = obj.canvas;
         var context = obj.context;
         var prop         = obj.properties;
 
         var height       = 0;
         var gutterLeft   = obj.gutterLeft;
         var gutterRight  = obj.gutterRight;
         var gutterTop    = obj.gutterTop;
         var gutterBottom = obj.gutterBottom;
         var variant      = prop['chart.variant'];
         
         co.fillStyle = prop['chart.text.color'];
         
         // If it's a bar and 3D variant, translate
         if (variant == '3d') {
             co.save();
             co.translate(10, -5);
         }
 
         // X axis title
         if (typeof(prop['chart.title.xaxis']) == 'string' && prop['chart.title.xaxis'].length) {
         
             var size = prop['chart.text.size'] + 2;
             var font = prop['chart.text.font'];
             var bold = prop['chart.title.xaxis.bold'];
 
             if (typeof(prop['chart.title.xaxis.size']) == 'number') {
                 size = prop['chart.title.xaxis.size'];
             }
 
             if (typeof(prop['chart.title.xaxis.font']) == 'string') {
                 font = prop['chart.title.xaxis.font'];
             }
             
             var hpos = ((ca.width - gutterLeft - gutterRight) / 2) + gutterLeft;
             var vpos = ca.height - gutterBottom + 25;
             
             if (typeof(prop['chart.title.xaxis.pos']) == 'number') {
                 vpos = ca.height - (gutterBottom * prop['chart.title.xaxis.pos']);
             }
 
             RG.Text2(obj, {'font':font,
                            'size':size,
                            'x':hpos,
                            'y':vpos,
                            'text':prop['chart.title.xaxis'],
                            'halign':'center',
                            'valign':'center',
                            'bold':bold,
                            'tag': 'title xaxis'
                           });
         }
 
         // Y axis title
         if (typeof(prop['chart.title.yaxis']) == 'string' && prop['chart.title.yaxis'].length) {
 
             var size  = prop['chart.text.size'] + 2;
             var font  = prop['chart.text.font'];
             var angle = 270;
             var bold  = prop['chart.title.yaxis.bold'];
             var color = prop['chart.title.yaxis.color'];
 
             if (typeof(prop['chart.title.yaxis.pos']) == 'number') {
                 var yaxis_title_pos = prop['chart.title.yaxis.pos'] * gutterLeft;
             } else {
                 var yaxis_title_pos = ((gutterLeft - 25) / gutterLeft) * gutterLeft;
             }
 
             if (typeof(prop['chart.title.yaxis.size']) == 'number') {
                 size = prop['chart.title.yaxis.size'];
             }
 
             if (typeof(prop['chart.title.yaxis.font']) == 'string') {
                 font = prop['chart.title.yaxis.font'];
             }
 
             if (prop['chart.title.yaxis.align'] == 'right' || prop['chart.title.yaxis.position'] == 'right') {
                 angle = 90;
                 yaxis_title_pos = prop['chart.title.yaxis.pos'] ? (ca.width - gutterRight) + (prop['chart.title.yaxis.pos'] * gutterRight) :
                                                                    ca.width - gutterRight + prop['chart.text.size'] + 5;
             } else {
                 yaxis_title_pos = yaxis_title_pos;
             }
 
             co.fillStyle = color;
             RG.Text2(obj, {'font':font,
                            'size':size,
                            'x':yaxis_title_pos,
                            'y':((ca.height - gutterTop - gutterBottom) / 2) + gutterTop,
                            'valign':'center',
                            'halign':'center',
                            'angle':angle,
                            'bold':bold,
                            'text':prop['chart.title.yaxis'],
                            'tag':'title yaxis'
                           });
         }
 
         /**
         * If the background color is spec ified - draw that. It's a rectangle that fills the
         * entire are within the gutters
         */
         var bgcolor = prop['chart.background.color'];
         if (bgcolor) {
             co.fillStyle = bgcolor;
             co.fillRect(gutterLeft, gutterTop, ca.width - gutterLeft - gutterRight, ca.height - gutterTop - gutterBottom);
         }
 
         /**
         * Draw horizontal background bars
         */
         co.beginPath(); // Necessary?
 
         co.fillStyle   = prop['chart.background.barcolor1'];
         co.strokeStyle = co.fillStyle;
         height = (ca.height - gutterBottom);
 
         for (var i=gutterTop; i<height ; i+=80) {
             co.fillRect(gutterLeft, i, ca.width - gutterLeft - gutterRight, Math.min(40, ca.height - gutterBottom - i) );
         }
 
         co.fillStyle   = prop['chart.background.barcolor2'];
         co.strokeStyle = co.fillStyle;
         height = (ca.height - gutterBottom);
 
         for (var i= (40 + gutterTop); i<height; i+=80) {
             co.fillRect(gutterLeft, i, ca.width - gutterLeft - gutterRight, i + 40 > (ca.height - gutterBottom) ? ca.height - (gutterBottom + i) : 40);
         }
         
         //context.stroke();
         co.beginPath();
     
 
         // Draw the background grid
         if (prop['chart.background.grid']) {
 
             // If autofit is specified, use the .numhlines and .numvlines along with the width to work
             // out the hsize and vsize
             if (prop['chart.background.grid.autofit']) {
 
                 /**
                 * Align the grid to the tickmarks
                 */
                 if (prop['chart.background.grid.autofit.align']) {
                     
                     // Align the horizontal lines
                     obj.Set('chart.background.grid.autofit.numhlines', prop['chart.ylabels.count']);
 
                     // Align the vertical lines for the line
                     if (obj.type == 'line') {
                         if (prop['chart.labels'] && prop['chart.labels'].length) {
                             obj.Set('chart.background.grid.autofit.numvlines', prop['chart.labels'].length - 1);
                         } else {
                             obj.Set('chart.background.grid.autofit.numvlines', obj.data[0].length - 1);
                         }
 
                     // Align the vertical lines for the bar
                     } else if (obj.type == 'bar' && prop['chart.labels'] && prop['chart.labels'].length) {
                         obj.Set('chart.background.grid.autofit.numvlines', prop['chart.labels'].length);
                     }
                 }
 
                 var vsize = ((ca.width - gutterLeft - gutterRight)) / prop['chart.background.grid.autofit.numvlines'];
                 var hsize = (ca.height - gutterTop - gutterBottom) / prop['chart.background.grid.autofit.numhlines'];
 
                 obj.Set('chart.background.grid.vsize', vsize);
                 obj.Set('chart.background.grid.hsize', hsize);
             }
 
             co.beginPath();
             co.lineWidth   = prop['chart.background.grid.width'] ? prop['chart.background.grid.width'] : 1;
             co.strokeStyle = prop['chart.background.grid.color'];
 
             // Dashed background grid
             if (prop['chart.background.grid.dashed'] && typeof co.setLineDash == 'function') {
                 co.setLineDash([3,2]);
             }
             
             // Dotted background grid
             if (prop['chart.background.grid.dotted'] && typeof co.setLineDash == 'function') {
                 co.setLineDash([1,2]);
             }
 
 
             // Draw the horizontal lines
             if (prop['chart.background.grid.hlines']) {
                 height = (ca.height - gutterBottom)
                 for (var y=gutterTop; y<height; y+=prop['chart.background.grid.hsize']) {
                     context.moveTo(gutterLeft, Math.round(y));
                     context.lineTo(ca.width - gutterRight, Math.round(y));
                 }
             }
 
             if (prop['chart.background.grid.vlines']) {
                 // Draw the vertical lines
                 var width = (ca.width - gutterRight)
                 for (var x=gutterLeft; x<=width; x+=prop['chart.background.grid.vsize']) {
                     co.moveTo(Math.round(x), gutterTop);
                     co.lineTo(Math.round(x), ca.height - gutterBottom);
                 }
             }
 
             if (prop['chart.background.grid.border']) {
                 // Make sure a rectangle, the same colour as the grid goes around the graph
                 co.strokeStyle = prop['chart.background.grid.color'];
                 co.strokeRect(Math.round(gutterLeft), Math.round(gutterTop), ca.width - gutterLeft - gutterRight, ca.height - gutterTop - gutterBottom);
             }
         }
 
         context.stroke();
 
         // Reset the line dash
         if (typeof co.setLineDash == 'function') {
             co.setLineDash([1,0]);
         }
 
         // If it's a bar and 3D variant, translate
         if (variant == '3d') {
             co.restore();
         }
 
         // Draw the title if one is set
         if ( typeof(prop['chart.title']) == 'string') {
 
             if (obj.type == 'gantt') {
                 gutterTop -= 10;
             }
 
             RG.DrawTitle(obj,
                          prop['chart.title'],
                          gutterTop,
                          null,
                          prop['chart.title.size'] ? prop['chart.title.size'] : prop['chart.text.size'] + 2);
         }
 
         co.stroke();
     }
 
 
 
 
     /**
     * Makes a clone of an object
     * 
     * @param obj val The object to clone
     */
     RGraph.array_clone = function (obj)
     {
         var RG = RGraph;
 
         if(obj == null || typeof(obj) != 'object') {
             return obj;
         }
 
         var temp = [];
 
         for (var i=0,len=obj.length;i<len; ++i) {
 
             if (typeof(obj[i]) == 'number') {
                 temp[i] = (function (arg) {return Number(arg);})(obj[i]);
             } else if (typeof(obj[i]) == 'string') {
                 temp[i] = (function (arg) {return String(arg);})(obj[i]);
             } else if (typeof(obj[i]) == 'function') {
                 temp[i] = obj[i];
             
             } else {
                 temp[i] = RG.array_clone(obj[i]);
             }
         }
 
         return temp;
     }
 
 
 
 
     /**
     * Formats a number with thousand seperators so it's easier to read
     * 
     * @param  integer obj The chart object
     * @param  integer num The number to format
     * @param  string      The (optional) string to prepend to the string
     * @param  string      The (optional) string to append to the string
     * @return string      The formatted number
     */
     RGraph.number_format = function (obj, num)
     {
         var RG   = RGraph;
         var ca   = obj.canvas;
         var co   = obj.context;
         var prop = obj.properties;
 
         var i;
         var prepend = arguments[2] ? String(arguments[2]) : '';
         var append  = arguments[3] ? String(arguments[3]) : '';
         var output  = '';
         var decimal = '';
         var decimal_seperator  = typeof(prop['chart.scale.point']) == 'string' ? prop['chart.scale.point'] : '.';
         var thousand_seperator = typeof(prop['chart.scale.thousand']) == 'string' ? prop['chart.scale.thousand'] : ',';
         RegExp.$1   = '';
         var i,j;
 
         if (typeof(prop['chart.scale.formatter']) == 'function') {
             return prop['chart.scale.formatter'](obj, num);
         }
 
         // Ignore the preformatted version of "1e-2"
         if (String(num).indexOf('e') > 0) {
             return String(prepend + String(num) + append);
         }
 
         // We need then number as a string
         num = String(num);
         
         // Take off the decimal part - we re-append it later
         if (num.indexOf('.') > 0) {
             var tmp = num;
             num     = num.replace(/\.(.*)/, ''); // The front part of the number
             decimal = tmp.replace(/(.*)\.(.*)/, '$2'); // The decimal part of the number
         }
 
         // Thousand seperator
         //var seperator = arguments[1] ? String(arguments[1]) : ',';
         var seperator = thousand_seperator;
         
         /**
         * Work backwards adding the thousand seperators
         */
         var foundPoint;
         for (i=(num.length - 1),j=0; i>=0; j++,i--) {
             var character = num.charAt(i);
             
             if ( j % 3 == 0 && j != 0) {
                 output += seperator;
             }
             
             /**
             * Build the output
             */
             output += character;
         }
         
         /**
         * Now need to reverse the string
         */
         var rev = output;
         output = '';
         for (i=(rev.length - 1); i>=0; i--) {
             output += rev.charAt(i);
         }
 
         // Tidy up
         //output = output.replace(/^-,/, '-');
         if (output.indexOf('-' + prop['chart.scale.thousand']) == 0) {
             output = '-' + output.substr(('-' + prop['chart.scale.thousand']).length);
         }
 
         // Reappend the decimal
         if (decimal.length) {
             output =  output + decimal_seperator + decimal;
             decimal = '';
             RegExp.$1 = '';
         }
 
         // Minor bugette
         if (output.charAt(0) == '-') {
             output = output.replace(/-/, '');
             prepend = '-' + prepend;
         }
 
         return prepend + output + append;
     }
 
 
 
 
     /**
     * Draws horizontal coloured bars on something like the bar, line or scatter
     */
     RGraph.DrawBars = function (obj)
     {
         var prop  = obj.properties;
         var co    = obj.context;
         var ca    = obj.canvas;
         var RG    = RGraph;
         var hbars = prop['chart.background.hbars'];
 
         if (hbars === null) {
             return;
         }
 
         /**
         * Draws a horizontal bar
         */
         co.beginPath();
 
         for (i=0,len=hbars.length; i<len; ++i) {
         
             var start  = hbars[i][0];
             var length = hbars[i][1];
             var color  = hbars[i][2];
             
 
             // Perform some bounds checking
             if(RG.is_null(start))start = obj.scale2.max
             if (start > obj.scale2.max) start = obj.scale2.max;
             if (RG.is_null(length)) length = obj.scale2.max - start;
             if (start + length > obj.scale2.max) length = obj.scale2.max - start;
             if (start + length < (-1 * obj.scale2.max) ) length = (-1 * obj.scale2.max) - start;
 
             if (prop['chart.xaxispos'] == 'center' && start == obj.scale2.max && length < (obj.scale2.max * -2)) {
                 length = obj.scale2.max * -2;
             }
 
 
             /**
             * Draw the bar
             */
             var x = prop['chart.gutter.left'];
             var y = obj.getYCoord(start);
             var w = ca.width - prop['chart.gutter.left'] - prop['chart.gutter.right'];
             var h = obj.getYCoord(start + length) - y;
 
             // Accommodate Opera :-/
             if (ISOPERA != -1 && prop['chart.xaxispos'] == 'center' && h < 0) {
                 h *= -1;
                 y = y - h;
             }
 
             /**
             * Account for X axis at the top
             */
             if (prop['chart.xaxispos'] == 'top') {
                 y  = ca.height - y;
                 h *= -1;
             }
 
             co.fillStyle = color;
             co.fillRect(x, y, w, h);
         }
 /*
 
 
             
 
 
             // If the X axis is at the bottom, and a negative max is given, warn the user
             if (obj.Get('chart.xaxispos') == 'bottom' && (hbars[i][0] < 0 || (hbars[i][1] + hbars[i][1] < 0)) ) {
                 alert('[' + obj.type.toUpperCase() + ' (ID: ' + obj.id + ') BACKGROUND HBARS] You have a negative value in one of your background hbars values, whilst the X axis is in the center');
             }
 
             var ystart = (obj.grapharea - (((hbars[i][0] - obj.scale2.min) / (obj.scale2.max - obj.scale2.min)) * obj.grapharea));
             //var height = (Math.min(hbars[i][1], obj.max - hbars[i][0]) / (obj.scale2.max - obj.scale2.min)) * obj.grapharea;
             var height = obj.getYCoord(hbars[i][0]) - obj.getYCoord(hbars[i][1]);
 
             // Account for the X axis being in the center
             if (obj.Get('chart.xaxispos') == 'center') {
                 ystart /= 2;
                 //height /= 2;
             }
             
             ystart += obj.Get('chart.gutter.top')
 
             var x = obj.Get('chart.gutter.left');
             var y = ystart - height;
             var w = obj.canvas.width - obj.Get('chart.gutter.left') - obj.Get('chart.gutter.right');
             var h = height;
 
             // Accommodate Opera :-/
             if (navigator.userAgent.indexOf('Opera') != -1 && obj.Get('chart.xaxispos') == 'center' && h < 0) {
                 h *= -1;
                 y = y - h;
             }
             
             /**
             * Account for X axis at the top
             */
             //if (obj.Get('chart.xaxispos') == 'top') {
             //    y  = obj.canvas.height - y;
             //    h *= -1;
             //}
 
             //obj.context.fillStyle = hbars[i][2];
             //obj.context.fillRect(x, y, w, h);
         //}
     }
 
 
 
 
     /**
     * Draws in-graph labels.
     * 
     * @param object obj The graph object
     */
     RGraph.DrawInGraphLabels = function (obj)
     {
         var RG      = RGraph;
         var ca      = obj.canvas;
         var co      = obj.context;
         var prop    = obj.properties;
         var labels  = prop['chart.labels.ingraph'];
         var labels_processed = [];
 
         // Defaults
         var fgcolor   = 'black';
         var bgcolor   = 'white';
         var direction = 1;
 
         if (!labels) {
             return;
         }
 
         /**
         * Preprocess the labels array. Numbers are expanded
         */
         for (var i=0,len=labels.length; i<len; i+=1) {
             if (typeof(labels[i]) == 'number') {
                 for (var j=0; j<labels[i]; ++j) {
                     labels_processed.push(null);
                 }
             } else if (typeof(labels[i]) == 'string' || typeof(labels[i]) == 'object') {
                 labels_processed.push(labels[i]);
             
             } else {
                 labels_processed.push('');
             }
         }
 
         /**
         * Turn off any shadow
         */
         RG.NoShadow(obj);
 
         if (labels_processed && labels_processed.length > 0) {
 
             for (var i=0,len=labels_processed.length; i<len; ++i) {
                 if (labels_processed[i]) {
                     var coords = obj.coords[i];
                     
                     if (coords && coords.length > 0) {
                         var x      = (obj.type == 'bar' ? coords[0] + (coords[2] / 2) : coords[0]);
                         var y      = (obj.type == 'bar' ? coords[1] + (coords[3] / 2) : coords[1]);
                         var length = typeof(labels_processed[i][4]) == 'number' ? labels_processed[i][4] : 25;
     
                         co.beginPath();
                         co.fillStyle   = 'black';
                         co.strokeStyle = 'black';
                         
     
                         if (obj.type == 'bar') {
                         
                             /**
                             * X axis at the top
                             */
                             if (obj.Get('chart.xaxispos') == 'top') {
                                 length *= -1;
                             }
     
                             if (prop['chart.variant'] == 'dot') {
                                 co.moveTo(Math.round(x), obj.coords[i][1] - 5);
                                 co.lineTo(Math.round(x), obj.coords[i][1] - 5 - length);
                                 
                                 var text_x = Math.round(x);
                                 var text_y = obj.coords[i][1] - 5 - length;
                             
                             } else if (prop['chart.variant'] == 'arrow') {
                                 co.moveTo(Math.round(x), obj.coords[i][1] - 5);
                                 co.lineTo(Math.round(x), obj.coords[i][1] - 5 - length);
                                 
                                 var text_x = Math.round(x);
                                 var text_y = obj.coords[i][1] - 5 - length;
                             
                             } else {
     
                                 co.arc(Math.round(x), y, 2.5, 0, 6.28, 0);
                                 co.moveTo(Math.round(x), y);
                                 co.lineTo(Math.round(x), y - length);
 
                                 var text_x = Math.round(x);
                                 var text_y = y - length;
                             }
 
                             co.stroke();
                             co.fill();
                             
     
                         } else if (obj.type == 'line') {
                         
                             if (
                                 typeof(labels_processed[i]) == 'object' &&
                                 typeof(labels_processed[i][3]) == 'number' &&
                                 labels_processed[i][3] == -1
                                ) {
 
                                 co.moveTo(Math.round(x), y + 5);
                                 co.lineTo(Math.round(x), y + 5 + length);
                                 
                                 co.stroke();
                                 co.beginPath();                                
                                 
                                 // This draws the arrow
                                 co.moveTo(Math.round(x), y + 5);
                                 co.lineTo(Math.round(x) - 3, y + 10);
                                 co.lineTo(Math.round(x) + 3, y + 10);
                                 co.closePath();
                                 
                                 var text_x = x;
                                 var text_y = y + 5 + length;
                             
                             } else {
                                 
                                 var text_x = x;
                                 var text_y = y - 5 - length;
 
                                 co.moveTo(Math.round(x), y - 5);
                                 co.lineTo(Math.round(x), y - 5 - length);
                                 
                                 co.stroke();
                                 co.beginPath();
                                 
                                 // This draws the arrow
                                 co.moveTo(Math.round(x), y - 5);
                                 co.lineTo(Math.round(x) - 3, y - 10);
                                 co.lineTo(Math.round(x) + 3, y - 10);
                                 co.closePath();
                             }
                         
                             co.fill();
                         }
 
                         // Taken out on the 10th Nov 2010 - unnecessary
                         //var width = context.measureText(labels[i]).width;
                         
                         co.beginPath();
                             
                             // Fore ground color
                             co.fillStyle = (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][1]) == 'string') ? labels_processed[i][1] : 'black';
 
                             RG.Text2(obj,{'font':prop['chart.text.font'],
                                           'size':prop['chart.text.size'],
                                           'x':text_x,
                                           'y':text_y,
                                           'text': (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][0]) == 'string') ? labels_processed[i][0] : labels_processed[i],
                                           'valign': 'bottom',
                                           'halign':'center',
                                           'bounding':true,
                                           'bounding.fill': (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][2]) == 'string') ? labels_processed[i][2] : 'white',
                                           'tag':'labels ingraph'
                                          });
                         co.fill();
                     }
                 }
             }
         }
     }
 
 
 
 
     /**
     * This function "fills in" key missing properties that various implementations lack
     * 
     * @param object e The event object
     */
     RGraph.FixEventObject = function (e)
     {
         if (ISOLD) {
             var e = event;
 
             e.pageX  = (event.clientX + document.body.scrollLeft);
             e.pageY  = (event.clientY + document.body.scrollTop);
             e.target = event.srcElement;
             
             if (!document.body.scrollTop && document.documentElement.scrollTop) {
                 e.pageX += parseInt(document.documentElement.scrollLeft);
                 e.pageY += parseInt(document.documentElement.scrollTop);
             }
         }
 
         
         // Any browser that doesn't implement stopPropagation() (MSIE)
         if (!e.stopPropagation) {
             e.stopPropagation = function () {window.event.cancelBubble = true;}
         }
         
         return e;
     }
 
 
 
 
     /**
     * Thisz function hides the crosshairs coordinates
     */
     RGraph.HideCrosshairCoords = function ()
     {
         var RG  = RGraph;
         var div = RG.Registry.Get('chart.coordinates.coords.div');
 
         if (   div
             && div.style.opacity == 1
             && div.__object__.Get('chart.crosshairs.coords.fadeout')
            ) {
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.9;}, 50);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.8;}, 100);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.7;}, 150);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.6;}, 200);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.5;}, 250);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.4;}, 300);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.3;}, 350);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.2;}, 400);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0.1;}, 450);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.opacity = 0;}, 500);
             setTimeout(function() {RG.Registry.Get('chart.coordinates.coords.div').style.display = 'none';}, 550);
         }
     }
 
 
 
 
     /**
     * Draws the3D axes/background
     */
     RGraph.Draw3DAxes = function (obj)
     {
         var prop = obj.properties;
         var co   = obj.context;
         var ca   = obj.canvas;
 
         var gutterLeft    = prop['chart.gutter.left'];
         var gutterRight   = prop['chart.gutter.right'];
         var gutterTop     = prop['chart.gutter.top'];
         var gutterBottom  = prop['chart.gutter.bottom'];
 
 
         co.strokeStyle = '#aaa';
         co.fillStyle = '#ddd';
 
         // Draw the vertical left side
         co.beginPath();
             co.moveTo(gutterLeft, gutterTop);
             co.lineTo(gutterLeft + 10, gutterTop - 5);
             co.lineTo(gutterLeft + 10, ca.height - gutterBottom - 5);
             co.lineTo(gutterLeft, ca.height - gutterBottom);
         co.closePath();
         
         co.stroke();
         co.fill();
 
         // Draw the bottom floor
         co.beginPath();
             co.moveTo(gutterLeft, ca.height - gutterBottom);
             co.lineTo(gutterLeft + 10, ca.height - gutterBottom - 5);
             co.lineTo(ca.width - gutterRight + 10,  ca.height - gutterBottom - 5);
             co.lineTo(ca.width - gutterRight, ca.height - gutterBottom);
         co.closePath();
         
         co.stroke();
         co.fill();
     }
 
 
 
 
 
     /**
     * This function attempts to "fill in" missing functions from the canvas
     * context object. Only two at the moment - measureText() nd fillText().
     * 
     * @param object context The canvas 2D context
     */
     RGraph.OldBrowserCompat = function (co)
     {
         if (!co) {
             return;
         }
 
         if (!co.measureText) {
         
             // This emulates the measureText() function
             co.measureText = function (text)
             {
                 var textObj = document.createElement('DIV');
                 textObj.innerHTML = text;
                 textObj.style.position = 'absolute';
                 textObj.style.top = '-100px';
                 textObj.style.left = 0;
                 document.body.appendChild(textObj);
 
                 var width = {width: textObj.offsetWidth};
                 
                 textObj.style.display = 'none';
                 
                 return width;
             }
         }
 
         if (!co.fillText) {
             // This emulates the fillText() method
             co.fillText    = function (text, targetX, targetY)
             {
                 return false;
             }
         }
 
         // If IE8, add addEventListener()
         if (!co.canvas.addEventListener) {
             window.addEventListener = function (ev, func, bubble)
             {
                 return this.attachEvent('on' + ev, func);
             }
 
             co.canvas.addEventListener = function (ev, func, bubble)
             {
                 return this.attachEvent('on' + ev, func);
             }
         }
     }
 
 
 
 
     /**
     * Draws a rectangle with curvy corners
     * 
     * @param co object The context
     * @param x number The X coordinate (top left of the square)
     * @param y number The Y coordinate (top left of the square)
     * @param w number The width of the rectangle
     * @param h number The height of the rectangle
     * @param   number The radius of the curved corners
     * @param   boolean Whether the top left corner is curvy
     * @param   boolean Whether the top right corner is curvy
     * @param   boolean Whether the bottom right corner is curvy
     * @param   boolean Whether the bottom left corner is curvy
     */
     RGraph.strokedCurvyRect = function (co, x, y, w, h)
     {
         // The corner radius
         var r = arguments[5] ? arguments[5] : 3;
 
         // The corners
         var corner_tl = (arguments[6] || arguments[6] == null) ? true : false;
         var corner_tr = (arguments[7] || arguments[7] == null) ? true : false;
         var corner_br = (arguments[8] || arguments[8] == null) ? true : false;
         var corner_bl = (arguments[9] || arguments[9] == null) ? true : false;
 
         co.beginPath();
 
             // Top left side
             co.moveTo(x + (corner_tl ? r : 0), y);
             co.lineTo(x + w - (corner_tr ? r : 0), y);
             
             // Top right corner
             if (corner_tr) {
                 co.arc(x + w - r, y + r, r, PI + HALFPI, TWOPI, false);
             }
 
             // Top right side
             co.lineTo(x + w, y + h - (corner_br ? r : 0) );
 
             // Bottom right corner
             if (corner_br) {
                 co.arc(x + w - r, y - r + h, r, TWOPI, HALFPI, false);
             }
 
             // Bottom right side
             co.lineTo(x + (corner_bl ? r : 0), y + h);
 
             // Bottom left corner
             if (corner_bl) {
                 co.arc(x + r, y - r + h, r, HALFPI, PI, false);
             }
 
             // Bottom left side
             co.lineTo(x, y + (corner_tl ? r : 0) );
 
             // Top left corner
             if (corner_tl) {
                 co.arc(x + r, y + r, r, PI, PI + HALFPI, false);
             }
 
         co.stroke();
     }
 
 
 
 
     /**
     * Draws a filled rectangle with curvy corners
     * 
     * @param context object The context
     * @param x       number The X coordinate (top left of the square)
     * @param y       number The Y coordinate (top left of the square)
     * @param w       number The width of the rectangle
     * @param h       number The height of the rectangle
     * @param         number The radius of the curved corners
     * @param         boolean Whether the top left corner is curvy
     * @param         boolean Whether the top right corner is curvy
     * @param         boolean Whether the bottom right corner is curvy
     * @param         boolean Whether the bottom left corner is curvy
     */
     RGraph.filledCurvyRect = function (co, x, y, w, h)
     {
         // The corner radius
         var r = arguments[5] ? arguments[5] : 3;
 
         // The corners
         var corner_tl = (arguments[6] || arguments[6] == null) ? true : false;
         var corner_tr = (arguments[7] || arguments[7] == null) ? true : false;
         var corner_br = (arguments[8] || arguments[8] == null) ? true : false;
         var corner_bl = (arguments[9] || arguments[9] == null) ? true : false;
 
         co.beginPath();
 
             // First draw the corners
 
             // Top left corner
             if (corner_tl) {
                 co.moveTo(x + r, y + r);
                 co.arc(x + r, y + r, r, PI, PI + HALFPI, false);
             } else {
                 co.fillRect(x, y, r, r);
             }
 
             // Top right corner
             if (corner_tr) {
                 co.moveTo(x + w - r, y + r);
                 co.arc(x + w - r, y + r, r, PI + HALFPI, 0, false);
             } else {
                 co.moveTo(x + w - r, y);
                 co.fillRect(x + w - r, y, r, r);
             }
 
 
             // Bottom right corner
             if (corner_br) {
                 co.moveTo(x + w - r, y + h - r);
                 co.arc(x + w - r, y - r + h, r, 0, HALFPI, false);
             } else {
                 co.moveTo(x + w - r, y + h - r);
                 co.fillRect(x + w - r, y + h - r, r, r);
             }
 
             // Bottom left corner
             if (corner_bl) {
                 co.moveTo(x + r, y + h - r);
                 co.arc(x + r, y - r + h, r, HALFPI, PI, false);
             } else {
                 co.moveTo(x, y + h - r);
                 co.fillRect(x, y + h - r, r, r);
             }
 
             // Now fill it in
             co.fillRect(x + r, y, w - r - r, h);
             co.fillRect(x, y + r, r + 1, h - r - r);
             co.fillRect(x + w - r - 1, y + r, r + 1, h - r - r);
 
         co.fill();
     }
 
 
 
 
     /**
     * Hides the zoomed canvas
     */
     RGraph.HideZoomedCanvas = function ()
     {
         var interval = 15;
         var frames   = 10;
 
         if (typeof(__zoomedimage__) == 'object') {
             var obj  = __zoomedimage__.obj;
             var prop = obj.properties;
         } else {
             return;
         }
 
         if (prop['chart.zoom.fade.out']) {
             for (var i=frames,j=1; i>=0; --i, ++j) {
                 if (typeof(__zoomedimage__) == 'object') {
                     setTimeout("__zoomedimage__.style.opacity = " + String(i / 10), j * interval);
                 }
             }
 
             if (typeof(__zoomedbackground__) == 'object') {
                 setTimeout("__zoomedbackground__.style.opacity = " + String(i / frames), j * interval);
             }
         }
 
         if (typeof(__zoomedimage__) == 'object') {
             setTimeout("__zoomedimage__.style.display = 'none'", prop['chart.zoom.fade.out'] ? (frames * interval) + 10 : 0);
         }
 
         if (typeof(__zoomedbackground__) == 'object') {
             setTimeout("__zoomedbackground__.style.display = 'none'", prop['chart.zoom.fade.out'] ? (frames * interval) + 10 : 0);
         }
     }
 
 
 
 
     /**
     * Adds an event handler
     * 
     * @param object obj   The graph object
     * @param string event The name of the event, eg ontooltip
     * @param object func  The callback function
     */
     RGraph.AddCustomEventListener = function (obj, name, func)
     {
         var RG = RGraph;
 
         if (typeof(RG.events[obj.uid]) == 'undefined') {
             RG.events[obj.uid] = [];
         }
 
         RG.events[obj.uid].push([obj, name, func]);
         
         return RG.events[obj.uid].length - 1;
     }
 
 
 
 
     /**
     * Used to fire one of the RGraph custom events
     * 
     * @param object obj   The graph object that fires the event
     * @param string event The name of the event to fire
     */
     RGraph.FireCustomEvent = function (obj, name)
     {
         var RG = RGraph;
 
         if (obj && obj.isRGraph) {
         
             // New style of adding custom events
             if (obj[name]) {
                 (obj[name])(obj);
             }
             
             var uid = obj.uid;
     
             if (   typeof(uid) == 'string'
                 && typeof(RG.events) == 'object'
                 && typeof(RG.events[uid]) == 'object'
                 && RG.events[uid].length > 0) {
     
                 for(var j=0; j<RG.events[uid].length; ++j) {
                     if (RG.events[uid][j] && RG.events[uid][j][1] == name) {
                         RG.events[uid][j][2](obj);
                     }
                 }
             }
         }
     }
 
 
 
 
     /**
     * If you prefer, you can use the SetConfig() method to set the configuration information
     * for your chart. You may find that setting the configuration this way eases reuse.
     * 
     * @param object obj    The graph object
     * @param object config The graph configuration information
     */
     RGraph.SetConfig = function (obj, config)
     {
         for (i in config) {
             if (typeof(i) == 'string') {
                 obj.Set(i, config[i]);
             }
         }
         
         return obj;
     }
 
 
 
 
     /**
     * Clears all the custom event listeners that have been registered
     * 
     * @param    string Limits the clearing to this object ID
     */
     RGraph.RemoveAllCustomEventListeners = function ()
     {
         var RG = RGraph;
         var id = arguments[0];
 
         if (id && RG.events[id]) {
             RG.events[id] = [];
         } else {
             RG.events = [];
         }
     }
 
 
 
 
     /**
     * Clears a particular custom event listener
     * 
     * @param object obj The graph object
     * @param number i   This is the index that is return by .AddCustomEventListener()
     */
     RGraph.RemoveCustomEventListener = function (obj, i)
     {
         var RG = RGraph;
 
         if (   typeof(RG.events) == 'object'
             && typeof(RG.events[obj.id]) == 'object'
             && typeof(RG.events[obj.id][i]) == 'object') {
             
             RG.events[obj.id][i] = null;
         }
     }
 
 
 
 
     /**
     * This draws the background
     * 
     * @param object obj The graph object
     */
     RGraph.DrawBackgroundImage = function (obj)
     {
         var prop = obj.properties;
         var ca   = obj.canvas;
         var co   = obj.context;
         var RG   = RGraph;
 
         if (typeof(prop['chart.background.image']) == 'string') {
             if (typeof(ca.__rgraph_background_image__) == 'undefined') {
                 var img = new Image();
                 img.__object__  = obj;
                 img.__canvas__  = ca;
                 img.__context__ = co;
                 img.src         = obj.Get('chart.background.image');
                 
                 ca.__rgraph_background_image__ = img;
             } else {
                 img = ca.__rgraph_background_image__;
             }
             
             // When the image has loaded - redraw the canvas
             img.onload = function ()
             {
                 obj.__rgraph_background_image_loaded__ = true;
                 RG.Clear(ca);
                 RG.RedrawCanvas(ca);
             }
                 
             var gutterLeft   = obj.gutterLeft;
             var gutterRight  = obj.gutterRight;
             var gutterTop    = obj.gutterTop;
             var gutterBottom = obj.gutterBottom;
             var stretch      = prop['chart.background.image.stretch'];
             var align        = prop['chart.background.image.align'];
     
             // Handle chart.background.image.align
             if (typeof(align) == 'string') {
                 if (align.indexOf('right') != -1) {
                     var x = ca.width - img.width - gutterRight;
                 } else {
                     var x = gutterLeft;
                 }
     
                 if (align.indexOf('bottom') != -1) {
                     var y = ca.height - img.height - gutterBottom;
                 } else {
                     var y = gutterTop;
                 }
             } else {
                 var x = gutterLeft;
                 var y = gutterTop;
             }
             
             // X/Y coords take precedence over the align
             var x = typeof(prop['chart.background.image.x']) == 'number' ? prop['chart.background.image.x'] : x;
             var y = typeof(prop['chart.background.image.y']) == 'number' ? prop['chart.background.image.y'] : y;
             var w = stretch ? ca.width - gutterLeft - gutterRight : img.width;
             var h = stretch ? ca.height - gutterTop - gutterBottom : img.height;
             
             /**
             * You can now specify the width and height of the image
             */
             if (typeof(prop['chart.background.image.w']) == 'number') w  = prop['chart.background.image.w'];
             if (typeof(prop['chart.background.image.h']) == 'number') h = prop['chart.background.image.h'];
     
             co.drawImage(img,x,y,w, h);
         }
     }
 
 
 
 
     /**
     * This function determines wshether an object has tooltips or not
     * 
     * @param object obj The chart object
     */
     RGraph.hasTooltips = function (obj)
     {
         var prop = obj.properties;
 
         if (typeof(prop['chart.tooltips']) == 'object' && prop['chart.tooltips']) {
             for (var i=0,len=prop['chart.tooltips'].length; i<len; ++i) {
                 if (!RGraph.is_null(obj.Get('chart.tooltips')[i])) {
                     return true;
                 }
             }
         } else if (typeof(prop['chart.tooltips']) == 'function') {
             return true;
         }
         
         return false;
     }
 
 
 
 
     /**
     * This function creates a (G)UID which can be used to identify objects.
     * 
     * @return string (g)uid The (G)UID
     */
     RGraph.CreateUID = function ()
     {
         return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
         {
             var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
             return v.toString(16);
         });
     }
 
 
 
     /**
     * This is the new object registry, used to facilitate multiple objects per canvas.
     * 
     * @param object obj The object to register
     */
     RGraph.ObjectRegistry.Add = function (obj)
     {
         var uid = obj.uid;
         var id  = obj.canvas.id;
         var RG = RGraph;
 
         /**
         * Index the objects by UID
         */
         RG.ObjectRegistry.objects.byUID.push([uid, obj]);
         
         /**
         * Index the objects by the canvas that they're drawn on
         */
         RG.ObjectRegistry.objects.byCanvasID.push([id, obj]);
     }
 
 
 
 
     /**
     * Remove an object from the object registry
     * 
     * @param object obj The object to remove.
     */
     RGraph.ObjectRegistry.Remove = function (obj)
     {
         var id  = obj.id;
         var uid = obj.uid;
         var RG  = RGraph;
 
         for (var i=0; i<RG.ObjectRegistry.objects.byUID.length; ++i) {
             if (RG.ObjectRegistry.objects.byUID[i] && RG.ObjectRegistry.objects.byUID[i][1].uid == uid) {
                 RG.ObjectRegistry.objects.byUID[i] = null;
             }
         }
 
 
         for (var i=0; i<RG.ObjectRegistry.objects.byCanvasID.length; ++i) {
             if (   RG.ObjectRegistry.objects.byCanvasID[i]
                 && RG.ObjectRegistry.objects.byCanvasID[i][1]
                 && RG.ObjectRegistry.objects.byCanvasID[i][1].uid == uid) {
                 
                 RG.ObjectRegistry.objects.byCanvasID[i] = null;
             }
         }
 
     }
 
 
 
 
     /**
     * Removes all objects from the ObjectRegistry. If either the ID of a canvas is supplied,
     * or the canvas itself, then only objects pertaining to that canvas are cleared.
     * 
     * @param mixed   Either a canvas object (as returned by document.getElementById()
     *                or the ID of a canvas (ie a string)
     */
     RGraph.ObjectRegistry.Clear = function ()
     {
         var RG = RGraph;
 
         // If an ID is supplied restrict the learing to that
         if (arguments[0]) {
             var id      = (typeof(arguments[0]) == 'object' ? arguments[0].id : arguments[0]);
             var objects = RG.ObjectRegistry.getObjectsByCanvasID(id);
 
             for (var i=0; i<objects.length; ++i) {
                 RG.ObjectRegistry.Remove(objects[i]);
             }
 
         } else {
 
             RG.ObjectRegistry.objects            = {};
             RG.ObjectRegistry.objects.byUID      = [];
             RG.ObjectRegistry.objects.byCanvasID = [];
         }
     }
 
 
 
 
     /**
     * Lists all objects in the ObjectRegistry
     * 
     * @param boolean ret Whether to return the list or alert() it
     */
     RGraph.ObjectRegistry.List = function ()
     {
         var list = [];
         var RG   = RGraph;
 
         for (var i=0,len=RG.ObjectRegistry.objects.byUID.length; i<len; ++i) {
             if (RG.ObjectRegistry.objects.byUID[i]) {
                 list.push(RG.ObjectRegistry.objects.byUID[i][1].type);
             }
         }
         
         if (arguments[0]) {
             return list;
         } else {
             p(list);
         }
     }
 
 
 
 
     /**
     * Clears the ObjectRegistry of objects that are of a certain given type
     * 
     * @param type string The type to clear
     */
     RGraph.ObjectRegistry.ClearByType = function (type)
     {
         var RG      = RGraph;
         var objects = RG.ObjectRegistry.objects.byUID;
 
         for (var i=0; i<objects.length; ++i) {
             if (objects[i]) {
                 var uid = objects[i][0];
                 var obj = objects[i][1];
                 
                 if (obj && obj.type == type) {
                     RG.ObjectRegistry.Remove(obj);
                 }
             }
         }
     }
 
 
 
 
     /**
     * This function provides an easy way to go through all of the objects that are held in the
     * Registry
     * 
     * @param func function This function is run for every object. Its passed the object as an argument
     * @param string type Optionally, you can pass a type of object to look for
     */
     RGraph.ObjectRegistry.Iterate = function (func)
     {
         var objects = RGraph.ObjectRegistry.objects.byUID;
 
         for (var i=0; i<objects.length; ++i) {
         
             if (typeof arguments[1] == 'string') {
                 
                 var types = arguments[1].split(/,/);
 
                 for (var j=0; j<types.length; ++j) {
                     if (types[j] == objects[i][1].type) {
                         func(objects[i][1]);
                     }
                 }
             } else {
                 func(objects[i][1]);
             }
         }
     }
 
 
 
 
     /**
     * Retrieves all objects for a given canvas id
     * 
     * @patarm id string The canvas ID to get objects for.
     */
     RGraph.ObjectRegistry.getObjectsByCanvasID = function (id)
     {
         var store = RGraph.ObjectRegistry.objects.byCanvasID;
         var ret = [];
 
         // Loop through all of the objects and return the appropriate ones
         for (var i=0; i<store.length; ++i) {
             if (store[i] && store[i][0] == id ) {
                 ret.push(store[i][1]);
             }
         }
 
         return ret;
     }
 
 
 
 
     /**
     * Retrieves the relevant object based on the X/Y position.
     * 
     * @param  object e The event object
     * @return object   The applicable (if any) object
     */
     RGraph.ObjectRegistry.getFirstObjectByXY =
     RGraph.ObjectRegistry.getObjectByXY = function (e)
     {
         var canvas  = e.target;
         var ret     = null;
         var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);
 
         for (var i=(objects.length - 1); i>=0; --i) {
 
             var obj = objects[i].getObjectByXY(e);
 
             if (obj) {
                 return obj;
             }
         }
     }
 
 
 
 
     /**
     * Retrieves the relevant objects based on the X/Y position.
     * NOTE This function returns an array of objects
     * 
     * @param  object e The event object
     * @return          An array of pertinent objects. Note the there may be only one object
     */
     RGraph.ObjectRegistry.getObjectsByXY = function (e)
     {
         var canvas  = e.target;
         var ret     = [];
         var objects = RGraph.ObjectRegistry.getObjectsByCanvasID(canvas.id);
 
         // Retrieve objects "front to back"
         for (var i=(objects.length - 1); i>=0; --i) {
 
             var obj = objects[i].getObjectByXY(e);
 
             if (obj) {
                 ret.push(obj);
             }
         }
         
         return ret;
     }
 
 
 
 
     /**
     * Retrieves the object with the corresponding UID
     * 
     * @param string uid The UID to get the relevant object for
     */
     RGraph.ObjectRegistry.getObjectByUID = function (uid)
     {
         var objects = RGraph.ObjectRegistry.objects.byUID;
 
         for (var i=0; i<objects.length; ++i) {
             if (objects[i] && objects[i][1].uid == uid) {
                 return objects[i][1];
             }
         }
     }
 
 
 
 
     /**
     * Brings a chart to the front of the ObjectRegistry by
     * removing it and then readding it at the end and then
     * redrawing the canvas
     * 
     * @param object  obj    The object to bring to the front
     * @param boolean redraw Whether to redraw the canvas after the 
     *                       object has been moved
     */
     RGraph.ObjectRegistry.bringToFront = function (obj)
     {
         var redraw = typeof arguments[1] == 'undefined' ? true : arguments[1];
 
         RGraph.ObjectRegistry.Remove(obj);
         RGraph.ObjectRegistry.Add(obj);
         
         if (redraw) {
             RGraph.RedrawCanvas(obj.canvas);
         }
     }
 
 
 
 
     /**
     * Retrieves the objects that are the given type
     * 
     * @param  mixed canvas  The canvas to check. It can either be the canvas object itself or just the ID
     * @param  string type   The type to look for
     * @return array         An array of one or more objects
     */
     RGraph.ObjectRegistry.getObjectsByType = function (type)
     {
         var objects = RGraph.ObjectRegistry.objects.byUID;
         var ret     = [];
 
         for (var i=0; i<objects.length; ++i) {
 
             if (objects[i] && objects[i][1] && objects[i][1].type && objects[i][1].type && objects[i][1].type == type) {
                 ret.push(objects[i][1]);
             }
         }
 
         return ret;
     }
 
 
 
 
     /**
     * Retrieves the FIRST object that matches the given type
     *
     * @param  string type   The type of object to look for
     * @return object        The FIRST object that matches the given type
     */
     RGraph.ObjectRegistry.getFirstObjectByType = function (type)
     {
         var objects = RGraph.ObjectRegistry.objects.byUID;
     
         for (var i=0; i<objects.length; ++i) {
             if (objects[i] && objects[i][1] && objects[i][1].type == type) {
                 return objects[i][1];
             }
         }
         
         return null;
     }
 
 
 
 
     /**
     * This takes centerx, centery, x and y coordinates and returns the
     * appropriate angle relative to the canvas angle system. Remember
     * that the canvas angle system starts at the EAST axis
     * 
     * @param  number cx  The centerx coordinate
     * @param  number cy  The centery coordinate
     * @param  number x   The X coordinate (eg the mouseX if coming from a click)
     * @param  number y   The Y coordinate (eg the mouseY if coming from a click)
     * @return number     The relevant angle (measured in in RADIANS)
     */
     RGraph.getAngleByXY = function (cx, cy, x, y)
     {
         var angle = Math.atan((y - cy) / (x - cx));
             angle = Math.abs(angle)
 
         if (x >= cx && y >= cy) {
             angle += TWOPI;
 
         } else if (x >= cx && y < cy) {
             angle = (HALFPI - angle) + (PI + HALFPI);
 
         } else if (x < cx && y < cy) {
             angle += PI;
 
         } else {
             angle = PI - angle;
         }
 
         /**
         * Upper and lower limit checking
         */
         if (angle > TWOPI) {
             angle -= TWOPI;
         }
 
         return angle;
     }
 
 
 
 
     /**
     * This function returns the distance between two points. In effect the
     * radius of an imaginary circle that is centered on x1 and y1. The name
     * of this function is derived from the word "Hypoteneuse", which in
     * trigonmetry is the longest side of a triangle
     * 
     * @param number x1 The original X coordinate
     * @param number y1 The original Y coordinate
     * @param number x2 The target X coordinate
     * @param number y2 The target Y  coordinate
     */
     RGraph.getHypLength = function (x1, y1, x2, y2)
     {
         var ret = Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
 
         return ret;
     }
 
 
 
 
     /**
     * This function gets the end point (X/Y coordinates) of a given radius.
     * You pass it the center X/Y and the radius and this function will return
     * the endpoint X/Y coordinates.
     * 
     * @param number cx The center X coord
     * @param number cy The center Y coord
     * @param number r  The lrngth of the radius
     */
     RGraph.getRadiusEndPoint = function (cx, cy, angle, radius)
     {
         var x = cx + (Math.cos(angle) * radius);
         var y = cy + (Math.sin(angle) * radius);
         
         return [x, y];
     }
 
 
 
 
     /**
     * This installs all of the event listeners
     * 
     * @param object obj The chart object
     */
     RGraph.InstallEventListeners = function (obj)
     {
         var RG   = RGraph;
         var prop = obj.properties;
 
         /**
         * Don't attempt to install event listeners for older versions of MSIE
         */
         if (ISOLD) {
             return;
         }
 
         /**
         * If this function exists, then the dynamic file has been included.
         */
         if (RG.InstallCanvasClickListener) {
 
             RG.InstallWindowMousedownListener(obj);
             RG.InstallWindowMouseupListener(obj);
             RG.InstallCanvasMousemoveListener(obj);
             RG.InstallCanvasMouseupListener(obj);
             RG.InstallCanvasMousedownListener(obj);
             RG.InstallCanvasClickListener(obj);
         
         } else if (   RG.hasTooltips(obj)
                    || prop['chart.adjustable']
                    || prop['chart.annotatable']
                    || prop['chart.contextmenu']
                    || prop['chart.resizable']
                    || prop['chart.key.interactive']
                    || prop['chart.events.click']
                    || prop['chart.events.mousemove']
                    || typeof obj.onclick == 'function'
                    || typeof obj.onmousemove == 'function'
                   ) {
 
             alert('[RGRAPH] You appear to have used dynamic features but not included the file: RGraph.common.dynamic.js');
         }
     }
 
 
 
 
     /**
     * Loosly mimicks the PHP function print_r();
     */
     RGraph.pr = function (obj)
     {
         var indent = (arguments[2] ? arguments[2] : '    ');
         var str    = '';
 
         var counter = typeof arguments[3] == 'number' ? arguments[3] : 0;
         
         if (counter >= 5) {
             return '';
         }
         
         switch (typeof obj) {
             
             case 'string':    str += obj + ' (' + (typeof obj) + ', ' + obj.length + ')'; break;
             case 'number':    str += obj + ' (' + (typeof obj) + ')'; break;
             case 'boolean':   str += obj + ' (' + (typeof obj) + ')'; break;
             case 'function':  str += 'function () {}'; break;
             case 'undefined': str += 'undefined'; break;
             case 'null':      str += 'null'; break;
             
             case 'object':
                 // In case of null
                 if (RGraph.is_null(obj)) {
                     str += indent + 'null\n';
                 } else {
                     str += indent + 'Object {' + '\n'
                     for (j in obj) {
                         str += indent + '    ' + j + ' => ' + RGraph.pr(obj[j], true, indent + '    ', counter + 1) + '\n';
                     }
                     str += indent + '}';
                 }
                 break;
             
             
             default:
                 str += 'Unknown type: ' + typeof obj + '';
                 break;
         }
 
 
         /**
         * Finished, now either return if we're in a recursed call, or alert()
         * if we're not.
         */
         if (!arguments[1]) {
             alert(str);
         }
         
         return str;
     }
 
 
 
 
     /**
     * Produces a dashed line
     * 
     * @param object co The 2D context
     * @param number x1 The start X coordinate
     * @param number y1 The start Y coordinate
     * @param number x2 The end X coordinate
     * @param number y2 The end Y coordinate
     */
     RGraph.DashedLine = function(co, x1, y1, x2, y2)
     {
         /**
         * This is the size of the dashes
         */
         var size = 5;
 
         /**
         * The optional fifth argument can be the size of the dashes
         */
         if (typeof(arguments[5]) == 'number') {
             size = arguments[5];
         }
 
         var dx  = x2 - x1;
         var dy  = y2 - y1;
         var num = Math.floor(Math.sqrt((dx * dx) + (dy * dy)) / size);
 
         var xLen = dx / num;
         var yLen = dy / num;
 
         var count = 0;
 
         do {
             (count % 2 == 0 && count > 0) ? co.lineTo(x1, y1) : co.moveTo(x1, y1);
 
             x1 += xLen;
             y1 += yLen;
         } while(count++ <= num);
     }
 
 
 
 
     /**
     * Makes an AJAX call. It calls the given callback (a function) when ready
     * 
     * @param string   url      The URL to retrieve
     * @param function callback A function that is called when the response is ready, there's an example below
     *                          called "myCallback".
     */
     RGraph.AJAX = function (url, callback)
     {
         // Mozilla, Safari, ...
         if (window.XMLHttpRequest) {
             var httpRequest = new XMLHttpRequest();
 
         // MSIE
         } else if (window.ActiveXObject) {
             var httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
         }
 
         httpRequest.onreadystatechange = function ()
         {
             if (this.readyState == 4 && this.status == 200) {
                 this.__user_callback__ = callback;
                 this.__user_callback__(this.responseText);
             }
         }
 
         httpRequest.open('GET', url, true);
         httpRequest.send();
     }
 
 
 
 
     /**
     * Makes an AJAX POST request. It calls the given callback (a function) when ready
     * 
     * @param string   url      The URL to retrieve
     * @param object   data     The POST data
     * @param function callback A function that is called when the response is ready, there's an example below
     *                          called "myCallback".
     */
     RGraph.AJAX.POST = function (url, data, callback)
     {
         // Used when building the POST string
         var crumbs = [];
 
         // Mozilla, Safari, ...
         if (window.XMLHttpRequest) {
             var httpRequest = new XMLHttpRequest();
 
         // MSIE
         } else if (window.ActiveXObject) {
             var httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
         }
 
         httpRequest.onreadystatechange = function ()
         {
             if (this.readyState == 4 && this.status == 200) {
                 this.__user_callback__ = callback;
                 this.__user_callback__(this.responseText);
             }
         }
 
         httpRequest.open('POST', url, true);
         httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
         
         for (i in data) {
             if (typeof i == 'string') {
                 crumbs.push(i + '=' + encodeURIComponent(data[i]));
             }
         }
 
         httpRequest.send(crumbs.join('&'));
     }
 
 
 
 
     /**
     * Uses the above function but calls the call back passing a number as its argument
     * 
     * @param url string The URL to fetch
     * @param callback function Your callback function (which is passed the number as an argument)
     */
     RGraph.AJAX.getNumber = function (url, callback)
     {
         RGraph.AJAX(url, function ()
         {
             var num = parseFloat(this.responseText);
 
             callback(num);
         });
     }
 
 
 
 
     /**
     * Uses the above function but calls the call back passing a string as its argument
     * 
     * @param url string The URL to fetch
     * @param callback function Your callback function (which is passed the string as an argument)
     */
     RGraph.AJAX.getString = function (url, callback)
     {
         RGraph.AJAX(url, function ()
         {
             var str = String(this.responseText);
 
             callback(str);
         });
     }
 
 
 
 
     /**
     * Uses the above function but calls the call back passing JSON (ie a JavaScript object ) as its argument
     * 
     * @param url string The URL to fetch
     * @param callback function Your callback function (which is passed the JSON object as an argument)
     */
     RGraph.AJAX.getJSON = function (url, callback)
     {
         RGraph.AJAX(url, function ()
         {
 
             var json = eval('(' + this.responseText + ')');
 
             callback(json);
         });
     }
 
 
 
 
     /**
     * Uses the above RGraph.AJAX function but calls the call back passing an array as its argument.
     * Useful if you're retrieving CSV data
     * 
     * @param url string The URL to fetch
     * @param callback function Your callback function (which is passed the CSV/array as an argument)
     */
     RGraph.AJAX.getCSV = function (url, callback)
     {
         var seperator = arguments[2] ? arguments[2] : ',';
 
         RGraph.AJAX(url, function ()
         {
             var regexp = new RegExp(seperator);
             var arr = this.responseText.split(regexp);
             
             // Convert the strings to numbers
             for (var i=0,len=arr.length;i<len;++i) {
                 arr[i] = parseFloat(arr[i]);
             }
 
             callback(arr);
         });
     }
 
 
 
 
     /**
     * Rotates the canvas
     * 
     * @param object canvas The canvas to rotate
     * @param  int   x      The X coordinate about which to rotate the canvas
     * @param  int   y      The Y coordinate about which to rotate the canvas
     * @param  int   angle  The angle(in RADIANS) to rotate the canvas by
     */
     RGraph.RotateCanvas = function (ca, x, y, angle)
     {
         var co = ca.getContext('2d');
 
         co.translate(x, y);
         co.rotate(angle);
         co.translate(0 - x, 0 - y);    
     }
 
 
 
 
     /**
     * Measures text by creating a DIV in the document and adding the relevant text to it.
     * Then checking the .offsetWidth and .offsetHeight.
     * 
     * @param  string text   The text to measure
     * @param  bool   bold   Whether the text is bold or not
     * @param  string font   The font to use
     * @param  size   number The size of the text (in pts)
     * @return array         A two element array of the width and height of the text
     */
     RGraph.MeasureText = function (text, bold, font, size)
     {
         // Add the sizes to the cache as adding DOM elements is costly and causes slow downs
         if (typeof(__rgraph_measuretext_cache__) == 'undefined') {
             __rgraph_measuretext_cache__ = [];
         }
 
         var str = text + ':' + bold + ':' + font + ':' + size;
         if (typeof(__rgraph_measuretext_cache__) == 'object' && __rgraph_measuretext_cache__[str]) {
             return __rgraph_measuretext_cache__[str];
         }
         
         if (!__rgraph_measuretext_cache__['text-div']) {
             var div = document.createElement('DIV');
                 div.style.position = 'absolute';
                 div.style.top = '-100px';
                 div.style.left = '-100px';
             document.body.appendChild(div);
             
             // Now store the newly created DIV
             __rgraph_measuretext_cache__['text-div'] = div;
 
         } else if (__rgraph_measuretext_cache__['text-div']) {
             var div = __rgraph_measuretext_cache__['text-div'];
         }
 
         div.innerHTML = text.replace(/\r\n/g, '<br />');
         div.style.fontFamily = font;
         div.style.fontWeight = bold ? 'bold' : 'normal';
         div.style.fontSize = size + 'pt';
         
         var size = [div.offsetWidth, div.offsetHeight];
 
         //document.body.removeChild(div);
         __rgraph_measuretext_cache__[str] = size;
         
         return size;
     }
 
 
 
 
     /* New text function. Accepts two arguments:
     *  o obj - The chart object
     *  o opt - An object/hash/map of properties. This can consist of:
     *          x                The X coordinate (REQUIRED)
     *          y                The Y coordinate (REQUIRED)
     *          text             The text to show (REQUIRED)
     *          font             The font to use
     *          size             The size of the text (in pt)
     *          bold             Whether the text shouldd be bold or not
     *          marker           Whether to show a marker that indicates the X/Y coordinates
     *          valign           The vertical alignment
     *          halign           The horizontal alignment
     *          bounding         Whether to draw a bounding box for the text
     *          boundingStroke   The strokeStyle of the bounding box
     *          boundingFill     The fillStyle of the bounding box
     */
     RGraph.Text2 = function (obj, opt)
     {
         /**
         * An RGraph object can be given, or a string or the 2D rendering context
         * The coords are placed on the obj.coordsText variable ONLY if it's an RGraph object. The function
         * still returns the cooords though in all cases.
         */
         if (obj && obj.isRGraph) {
             var co = obj.context;
             var ca = obj.canvas;
         } else if (typeof obj == 'string') {
             var ca = document.getElementById(obj);
             var co = ca.getContext('2d');
         } else if (typeof obj.getContext == 'function') {
             var ca = obj;
             var co = ca.getContext('2d');
         } else if (obj.toString().indexOf('CanvasRenderingContext2D') != -1) {
             var co = obj;
             var ca = obj.context;
         }
 
         var x              = opt.x;
         var y              = opt.y;
         var originalX      = x;
         var originalY      = y;
         var text           = opt.text;
         var text_multiline = text.split(/\r?\n/g);
         var numlines       = text_multiline.length;
         var font           = opt.font ? opt.font : 'Arial';
         var size           = opt.size ? opt.size : 10;
         var size_pixels    = size * 1.5;
         var bold           = opt.bold;
         var halign         = opt.halign ? opt.halign : 'left';
         var valign         = opt.valign ? opt.valign : 'bottom';
         var tag            = typeof opt.tag == 'string' && opt.tag.length > 0 ? opt.tag : '';
         var marker         = opt.marker;
         var angle          = opt.angle || 0;
         
         /**
         * Changed the name of boundingFill/boundingStroke - this allows you to still use those names
         */
         if (typeof opt.boundingFill == 'string')   opt['bounding.fill']   = opt.boundingFill;
         if (typeof opt.boundingStroke == 'string') opt['bounding.stroke'] = opt.boundingStroke;
 
         var bounding                = opt.bounding;
         var bounding_stroke         = opt['bounding.stroke'] ? opt['bounding.stroke'] : 'black';
         var bounding_fill           = opt['bounding.fill'] ? opt['bounding.fill'] : 'rgba(255,255,255,0.7)';
         var bounding_shadow         = opt['bounding.shadow'];
         var bounding_shadow_color   = opt['bounding.shadow.color'] || '#ccc';
         var bounding_shadow_blur    = opt['bounding.shadow.blur'] || 3;
         var bounding_shadow_offsetx = opt['bounding.shadow.offsetx'] || 3;
         var bounding_shadow_offsety = opt['bounding.shadow.offsety'] || 3;
         var bounding_linewidth      = opt['bounding.linewidth'] || 1;
 
 
 
         /**
         * Initialize the return value to an empty object
         */
         var ret = {};
 
 
 
         /**
         * The text arg must be a string or a number
         */
         if (typeof text == 'number') {
             text = String(text);
         }
 
         if (typeof text != 'string') {
             alert('[RGRAPH TEXT] The text given must a string or a number');
             return;
         }
     
         /**
         * This facilitates vertical text
         */
         if (angle != 0) {
             co.save();
             co.translate(x, y);
             co.rotate((Math.PI / 180) * angle)
             x = 0;
             y = 0;
         }
 
         /**
         * Set the font
         */
         co.font = (opt.bold ? 'bold ' : '') + size + 'pt ' + font;
 
 
 
         /**
         * Measure the width/height. This must be done AFTER the font has been set
         */
         var width=0;
         for (var i=0; i<numlines; ++i) {
             width = Math.max(width, co.measureText(text_multiline[i]).width);
         }
         var height = size_pixels * numlines;
 
 
 
         /**
         * Accommodate old MSIE 7/8
         */
         //if (document.all && ISOLD) {
             //y += 2;
         //}
 
 
         /**
         * If marker is specified draw a marker at the X/Y coordinates
         */
         if (opt.marker) {
             var marker_size = 10;
             var strokestyle = co.strokeStyle;
             co.beginPath();
                 co.strokeStyle = 'red';
                 co.moveTo(x, y - marker_size);
                 co.lineTo(x, y + marker_size);
                 co.moveTo(x - marker_size, y);
                 co.lineTo(x + marker_size, y);
             co.stroke();
             co.strokeStyle = strokestyle;
         }
 
 
         /**
         * Set the horizontal alignment
         */
         if (halign == 'center') {
             co.textAlign = 'center';
             var boundingX = x - 2 - (width / 2);
         } else if (halign == 'right') {
             co.textAlign = 'right';
             var boundingX = x - 2 - width;
         } else {
             co.textAlign = 'left';
             var boundingX = x - 2;
         }
 
 
         /**
         * Set the vertical alignment
         */
         if (valign == 'center') {
             
             co.textBaseline = 'middle';
             // Move the text slightly
             y -= 1;
             
             y -= ((numlines - 1) / 2) * size_pixels;
             var boundingY = y - (size_pixels / 2) - 2;
         
         } else if (valign == 'top') {
             co.textBaseline = 'top';
 
             var boundingY = y - 2;
 
         } else {
 
             co.textBaseline = 'bottom';
             
             // Move the Y coord if multiline text
             if (numlines > 1) {
                 y -= ((numlines - 1) * size_pixels);
             }
 
             var boundingY = y - size_pixels - 2;
         }
         
         var boundingW = width + 4;
         var boundingH = height + 4;
 
 
 
         /**
         * Draw a bounding box if required
         */
         if (bounding) {
 
             var pre_bounding_linewidth     = co.lineWidth;
             var pre_bounding_strokestyle   = co.strokeStyle;
             var pre_bounding_fillstyle     = co.fillStyle;
             var pre_bounding_shadowcolor   = co.shadowColor;
             var pre_bounding_shadowblur    = co.shadowBlur;
             var pre_bounding_shadowoffsetx = co.shadowOffsetX;
             var pre_bounding_shadowoffsety = co.shadowOffsetY;
 
             co.lineWidth   = bounding_linewidth;
             co.strokeStyle = bounding_stroke;
             co.fillStyle   = bounding_fill;
 
             if (bounding_shadow) {
                 co.shadowColor   = bounding_shadow_color;
                 co.shadowBlur    = bounding_shadow_blur;
                 co.shadowOffsetX = bounding_shadow_offsetx;
                 co.shadowOffsetY = bounding_shadow_offsety;
             }
 
             //obj.context.strokeRect(boundingX, boundingY, width + 6, (size_pixels * numlines) + 4);
             //obj.context.fillRect(boundingX, boundingY, width + 6, (size_pixels * numlines) + 4);
             co.strokeRect(boundingX, boundingY, boundingW, boundingH);
             co.fillRect(boundingX, boundingY, boundingW, boundingH);
 
             // Reset the linewidth,colors and shadow to it's original setting
             co.lineWidth     = pre_bounding_linewidth;
             co.strokeStyle   = pre_bounding_strokestyle;
             co.fillStyle     = pre_bounding_fillstyle;
             co.shadowColor   = pre_bounding_shadowcolor
             co.shadowBlur    = pre_bounding_shadowblur
             co.shadowOffsetX = pre_bounding_shadowoffsetx
             co.shadowOffsetY = pre_bounding_shadowoffsety
         }
 
         /**
         * Draw the text
         */
         if (numlines > 1) {
             for (var i=0; i<numlines; ++i) {
                 co.fillText(text_multiline[i], x, y + (size_pixels * i));
             }
         } else {
             co.fillText(text, x, y);
         }
        
         /**
         * If the text is at 90 degrees restore() the canvas - getting rid of the rotation
         * and the translate that we did
         */
         if (angle != 0) {
             if (angle == 90) {
                 if (halign == 'left') {
                     if (valign == 'bottom') {boundingX = originalX - 2; boundingY = originalY - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'center') {boundingX = originalX - (height / 2) - 2; boundingY = originalY - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'top')    {boundingX = originalX - height - 2; boundingY = originalY - 2; boundingW = height + 4; boundingH = width + 4;}
                 
                 } else if (halign == 'center') {
                     if (valign == 'bottom') {boundingX = originalX - 2; boundingY = originalY - (width / 2) - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'center') {boundingX = originalX - (height / 2) -  2; boundingY = originalY - (width / 2) - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'top')    {boundingX = originalX - height -  2; boundingY = originalY - (width / 2) - 2; boundingW = height + 4; boundingH = width + 4;}
                 
                 } else if (halign == 'right') {
                     if (valign == 'bottom') {boundingX = originalX - 2; boundingY = originalY - width - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'center') {boundingX = originalX - (height / 2) - 2; boundingY = originalY - width - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'top')    {boundingX = originalX - height - 2; boundingY = originalY - width - 2; boundingW = height + 4; boundingH = width + 4;}
                 }
 
             } else if (angle == 180) {
 
                 if (halign == 'left') {
                     if (valign == 'bottom') {boundingX = originalX - width - 2; boundingY = originalY - 2; boundingW = width + 4; boundingH = height + 4;}
                     if (valign == 'center') {boundingX = originalX - width - 2; boundingY = originalY - (height / 2) - 2; boundingW = width + 4; boundingH = height + 4;}
                     if (valign == 'top')    {boundingX = originalX - width - 2; boundingY = originalY - height - 2; boundingW = width + 4; boundingH = height + 4;}
                 
                 } else if (halign == 'center') {
                     if (valign == 'bottom') {boundingX = originalX - (width / 2) - 2; boundingY = originalY - 2; boundingW = width + 4; boundingH = height + 4;}
                     if (valign == 'center') {boundingX = originalX - (width / 2) - 2; boundingY = originalY - (height / 2) - 2; boundingW = width + 4; boundingH = height + 4;}
                     if (valign == 'top')    {boundingX = originalX - (width / 2) - 2; boundingY = originalY - height - 2; boundingW = width + 4; boundingH = height + 4;}
                 
                 } else if (halign == 'right') {
                     if (valign == 'bottom') {boundingX = originalX - 2; boundingY = originalY - 2; boundingW = width + 4; boundingH = height + 4;}
                     if (valign == 'center') {boundingX = originalX - 2; boundingY = originalY - (height / 2) - 2; boundingW = width + 4; boundingH = height + 4;}
                     if (valign == 'top')    {boundingX = originalX - 2; boundingY = originalY - height - 2; boundingW = width + 4; boundingH = height + 4;}
                 }
             
             } else if (angle == 270) {
 
                 if (halign == 'left') {
                     if (valign == 'bottom') {boundingX = originalX - height - 2; boundingY = originalY - width - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'center') {boundingX = originalX - (height / 2) - 4; boundingY = originalY - width - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'top')    {boundingX = originalX - 2; boundingY = originalY - width - 2; boundingW = height + 4; boundingH = width + 4;}
                 
                 } else if (halign == 'center') {
                     if (valign == 'bottom') {boundingX = originalX - height - 2; boundingY = originalY - (width/2) - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'center') {boundingX = originalX - (height/2) - 4; boundingY = originalY - (width/2) - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'top')    {boundingX = originalX - 2; boundingY = originalY - (width/2) - 2; boundingW = height + 4; boundingH = width + 4;}
                 
                 } else if (halign == 'right') {
                     if (valign == 'bottom') {boundingX = originalX - height - 2; boundingY = originalY - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'center') {boundingX = originalX - (height/2) - 2; boundingY = originalY - 2; boundingW = height + 4; boundingH = width + 4;}
                     if (valign == 'top')    {boundingX = originalX - 2; boundingY = originalY - 2; boundingW = height + 4; boundingH = width + 4;}
                 }
             }
 
             co.restore();
         }
 
         /**
         * Reset the text alignment so that text rendered
         */
         co.textBaseline = 'alphabetic';
         co.textAlign    = 'left';
 
 
         /**
         * Fill the ret variable with details of the text
         */
         ret.x      = boundingX;
         ret.y      = boundingY;
         ret.width  = boundingW;
         ret.height = boundingH
         ret.object = obj;
         ret.text   = text;
         ret.tag    = tag;
 
         /**
         * Save and then return the details of the text (but oly
         * if it's an RGraph object that was given)
         */
         if (obj && obj.isRGraph && obj.coordsText) {
             obj.coordsText.push(ret);
         }
 
         return ret;
     }
 
 
     /**
     * Takes a sequential index abd returns the group/index variation of it. Eg if you have a
     * sequential index from a grouped bar chart this function can be used to convert that into
     * an appropriate group/index combination
     * 
     * @param nindex number The sequential index
     * @param data   array  The original data (which is grouped)
     * @return              The group/index information
     */
     RGraph.sequentialIndexToGrouped = function (index, data)
     {
         var group         = 0;
         var grouped_index = 0;
 
         while (--index >= 0) {
 
             if (RGraph.is_null(data[group])) {
                 group++;
                 grouped_index = 0;
                 continue;
             }
 
             // Allow for numbers as well as arrays in the dataset
             if (typeof data[group] == 'number') {
                 group++
                 grouped_index = 0;
                 continue;
             }
             
 
             grouped_index++;
             
             if (grouped_index >= data[group].length) {
                 group++;
                 grouped_index = 0;
             }
         }
         
         return [group, grouped_index];
     }
 
 
     /**
     * A sihm for the forEach array function so that it's available for older browsers that
     * don't have it
     */
     if ( !Array.prototype.forEach ) {
       Array.prototype.forEach = function(fn, scope) {
         for(var i = 0, len = this.length; i < len; ++i) {
           fn.call(scope, this[i], i, this);
         }
       }
     }
 
 
     /**
     * Checks whether strings or numbers are empty or not. It also
     * handles null or variables set to undefined. If a variable really
     * is undefined - ie it hasn't been declared at all - you need to use
     * "typeof variable" and check the return value - which will be undefined.
     * 
     * @param mixed value The variable to check
     */
     function empty (value)
     {
         if (!value || value.length <= 0) {
             return true;
         }
         
         return false;
     }
 
     /**
     * This function highlights a rectangle
     * 
     * @param object obj    The chart object
     * @param number shape  The coordinates of the rect to highlight
     */
     RGraph.Highlight.Rect = function (obj, shape)
     {        
         var ca   = obj.canvas;
         var co   = obj.context;
         var prop = obj.properties;
 
         if (prop['chart.tooltips.highlight']) {
             
         
             // Safari seems to need this
             co.lineWidth = 1;
 
             /**
             * Draw a rectangle on the canvas to highlight the appropriate area
             */
             co.beginPath();
 
                 co.strokeStyle = prop['chart.highlight.stroke'];
                 co.fillStyle   = prop['chart.highlight.fill'];
     
                 co.strokeRect(shape['x'],shape['y'],shape['width'],shape['height']);
                 co.fillRect(shape['x'],shape['y'],shape['width'],shape['height']);
             co.stroke;
             co.fill();
         }
     }
 
 
 
 
     /**
     * This function highlights a point
     * 
     * @param object obj    The chart object
     * @param number shape  The coordinates of the rect to highlight
     */
     RGraph.Highlight.Point = function (obj, shape)
     {
         var prop = obj.properties;
         var ca   = obj.canvas;
         var co   = obj.context;
 
         if (prop['chart.tooltips.highlight']) {
     
             /**
             * Draw a rectangle on the canvas to highlight the appropriate area
             */
             co.beginPath();
                 co.strokeStyle = prop['chart.highlight.stroke'];
                 co.fillStyle   = prop['chart.highlight.fill'];
                 var radius   = prop['chart.highlight.point.radius'] || 2;
                 co.arc(shape['x'],shape['y'],radius, 0, TWOPI, 0);
             co.stroke();
             co.fill();
         }
     }
 
 // Some other functions. Because they're rarely changed - they're hand minified
 RGraph.LinearGradient=function(obj,x1,y1,x2,y2,color1,color2){var gradient=obj.context.createLinearGradient(x1,y1,x2,y2);var numColors=arguments.length-5;for (var i=5;i<arguments.length;++i){var color=arguments[i];var stop=(i-5)/(numColors-1);gradient.addColorStop(stop,color);}return gradient;}
 RGraph.RadialGradient=function(obj,x1,y1,r1,x2,y2,r2,color1,color2){var gradient=obj.context.createRadialGradient(x1,y1,r1,x2,y2,r2);var numColors=arguments.length-7;for(var i=7;i<arguments.length; ++i){var color=arguments[i];var stop=(i-7)/(numColors-1);gradient.addColorStop(stop,color);}return gradient;}
 RGraph.array_shift=function(arr){var ret=[];for(var i=1;i<arr.length;++i){ret.push(arr[i]);}return ret;}
 RGraph.AddEventListener=function(id,e,func){var type=arguments[3]?arguments[3]:'unknown';RGraph.Registry.Get('chart.event.handlers').push([id,e,func,type]);}
 RGraph.ClearEventListeners=function(id){if(id&&id=='window'){window.removeEventListener('mousedown',window.__rgraph_mousedown_event_listener_installed__,false);window.removeEventListener('mouseup',window.__rgraph_mouseup_event_listener_installed__,false);}else{var canvas = document.getElementById(id);canvas.removeEventListener('mouseup',canvas.__rgraph_mouseup_event_listener_installed__,false);canvas.removeEventListener('mousemove',canvas.__rgraph_mousemove_event_listener_installed__,false);canvas.removeEventListener('mousedown',canvas.__rgraph_mousedown_event_listener_installed__,false);canvas.removeEventListener('click',canvas.__rgraph_click_event_listener_installed__,false);}}
 RGraph.HidePalette=function(){var div=RGraph.Registry.Get('palette');if(typeof(div)=='object'&&div){div.style.visibility='hidden';div.style.display='none';RGraph.Registry.Set('palette',null);}}
 RGraph.random=function(min,max){var dp=arguments[2]?arguments[2]:0;var r=Math.random();return Number((((max - min) * r) + min).toFixed(dp));}
 RGraph.random.array=function(num,min,max){var arr = [];for(var i=0;i<num;i++)arr.push(RGraph.random(min,max));return arr;}
 RGraph.NoShadow=function(obj){obj.context.shadowColor='rgba(0,0,0,0)';obj.context.shadowBlur=0;obj.context.shadowOffsetX=0;obj.context.shadowOffsetY=0;}
 RGraph.SetShadow=function(obj,color,offsetx,offsety,blur){obj.context.shadowColor=color;obj.context.shadowOffsetX=offsetx;obj.context.shadowOffsetY=offsety;obj.context.shadowBlur=blur;}
 RGraph.array_reverse=function(arr){var newarr=[];for(var i=arr.length-1;i>=0;i--){newarr.push(arr[i]);}return newarr;}
 RGraph.Registry.Set=function(name,value){RGraph.Registry.store[name]=value;return value;}
 RGraph.Registry.Get=function(name){return RGraph.Registry.store[name];}
 RGraph.degrees2Radians=function(degrees){return degrees*(PI/180);}
 RGraph.log=(function(n,base){var log=Math.log;return function(n,base){return log(n)/(base?log(base):1);};})();
 RGraph.is_array=function(obj){return obj!=null&&obj.constructor.toString().indexOf('Array')!=-1;}
 RGraph.trim=function(str){return RGraph.ltrim(RGraph.rtrim(str));}
 RGraph.ltrim=function(str){return str.replace(/^(\s|\0)+/, '');}
 RGraph.rtrim=function(str){return str.replace(/(\s|\0)+$/, '');}
 RGraph.GetHeight=function(obj){return obj.canvas.height;}
 RGraph.GetWidth=function(obj){return obj.canvas.width;}
 RGraph.is_null=function(arg){if(arg==null||(typeof(arg))=='object'&&!arg){return true;}return false;}
 RGraph.Timer=function(label){if(typeof(RGraph.TIMER_LAST_CHECKPOINT)=='undefined'){RGraph.TIMER_LAST_CHECKPOINT=Date.now();}var now=Date.now();console.log(label+': '+(now-RGraph.TIMER_LAST_CHECKPOINT).toString());RGraph.TIMER_LAST_CHECKPOINT=now;}
 RGraph.Async=function(func){return setTimeout(func,arguments[1]?arguments[1]:1);}
 RGraph.isIE=function(){return navigator.userAgent.indexOf('MSIE')>0;};var ISIE=RGraph.isIE();
 RGraph.isIE6=function(){return navigator.userAgent.indexOf('MSIE 6')>0;};var ISIE6=RGraph.isIE6();
 RGraph.isIE7=function(){return navigator.userAgent.indexOf('MSIE 7')>0;};var ISIE7=RGraph.isIE7();
 RGraph.isIE8=function(){return navigator.userAgent.indexOf('MSIE 8')>0;};var ISIE8=RGraph.isIE8();
 RGraph.isIE9=function(){return navigator.userAgent.indexOf('MSIE 9')>0;};var ISIE9=RGraph.isIE9();
 RGraph.isIE10=function(){return navigator.userAgent.indexOf('MSIE 10')>0;};var ISIE10=RGraph.isIE10();
 RGraph.isIE9up=function(){navigator.userAgent.match(/MSIE (\d+)/);return Number(RegExp.$1)>=9;};var ISIE9UP=RGraph.isIE9up();
 RGraph.isIE10up=function(){navigator.userAgent.match(/MSIE (\d+)/);return Number(RegExp.$1)>=10;};var ISIE10UP=RGraph.isIE10up();
 RGraph.isOld=function(){return ISIE6||ISIE7||ISIE8;};var ISOLD=RGraph.isOld();
 RGraph.Reset=function(canvas){canvas.width=canvas.width;RGraph.ObjectRegistry.Clear(canvas);canvas.__rgraph_aa_translated__=false;}
 function pd(variable){RGraph.pr(variable);}
 function p(variable){RGraph.pr(arguments[0],arguments[1],arguments[3]);}
 function a(variable){alert(variable);}
 function cl(variable){return console.log(variable);}

     /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/license                           |
    * o------------------------------------------------------------------------------o
    */
    
    /**
    * This is a library of a few functions that make it easier to do
    * effects like fade-ins or eaxpansion.
    */

    /**
    * Initialise the various objects
    */
     if (typeof(RGraph) == 'undefined') RGraph = {isRGraph:true,type:'common'};
    
     RGraph.Effects = {};
     RGraph.Effects.Fade             = {}; RGraph.Effects.jQuery           = {}
     RGraph.Effects.jQuery.HBlinds   = {}; RGraph.Effects.jQuery.VBlinds   = {}
     RGraph.Effects.jQuery.Slide     = {}; RGraph.Effects.Pie              = {}
     RGraph.Effects.Bar              = {}; RGraph.Effects.Line             = {}
     RGraph.Effects.Line.jQuery      = {}; RGraph.Effects.Fuel             = {}
     RGraph.Effects.Rose             = {}; RGraph.Effects.Odo              = {}
     RGraph.Effects.Gauge            = {}; RGraph.Effects.Meter            = {}
     RGraph.Effects.HBar             = {}; RGraph.Effects.HProgress        = {}
     RGraph.Effects.VProgress        = {}; RGraph.Effects.Radar            = {}
     RGraph.Effects.Waterfall        = {}; RGraph.Effects.Gantt            = {}
     RGraph.Effects.Thermometer      = {}; RGraph.Effects.Scatter          = {}
     RGraph.Effects.Scatter.jQuery   = {}; RGraph.Effects.CornerGauge      = {}
     RGraph.Effects.jQuery.HScissors = {}; RGraph.Effects.jQuery.VScissors = {}
 
 
 
     /**
     * Fadein
     * 
     * This function simply uses the CSS opacity property - initially set to zero and
     * increasing to 1 over the period of 0.5 second
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.Fade.In = function (obj)
     {
         var canvas   = obj.canvas;
         var duration = (arguments[1] && arguments[1].duration ? arguments[1].duration : 250);
         var frames   = (arguments[1] && arguments[1].frames ? arguments[1].frames : 5);
 
         // Initially the opacity should be zero
         canvas.style.opacity = 0;
         
         // Draw the chart
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         // Now fade the chart in
         for (var i=1; i<=frames; ++i) {
             setTimeout('document.getElementById("' + canvas.id + '").style.opacity = ' + (i * (1 / frames)), i * (duration / frames));
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], duration);
         }
     }
 
 
     /**
     * Fadeout
     * 
     * This function is a reversal of the above function - fading out instead of in
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.Fade.Out = function (obj)
     {
         var canvas   = obj.canvas;
         var duration = (arguments[1] && arguments[1].duration ? arguments[1].duration : 250);
         var frames   = (arguments[1] && arguments[1].frames ? arguments[1].frames : 5);
         
         // Draw the chart
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
         
         // Now fade the chart in
         for (var i=frames; i>=0; --i) {
             setTimeout('document.getElementById("' + canvas.id + '").style.opacity = ' + (i * (1 / frames)), (frames - i) * (duration / frames));
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], duration);
         }
     }
 
 
     /**
     * Expand
     * 
     * This effect is like the tooltip effect of the same name. I starts in the middle
     * and expands out to full size.
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.jQuery.Expand = function (obj)
     {
         // Check for jQuery
         if (typeof(jQuery) == 'undefined') {
             alert('[ERROR] Could not find jQuery object - have you included the jQuery file?');
         }
         
         var bounce = (!arguments[1] || (arguments[1] && (arguments[1].bounce || typeof(arguments[1].bounce) == 'undefined'))) ? true : false;
 
         var canvas = obj.canvas;
         
         if (!canvas.__rgraph_div_placeholder__) {
             var div    = RGraph.Effects.ReplaceCanvasWithDIV(canvas);
             canvas.__rgraph_div_placeholder__ = div;
         } else {
             div = canvas.__rgraph_div_placeholder__;
         }
 
         div.style.position = 'relative';
         canvas.style.position = 'absolute';
         canvas.style.top  = (canvas.height / 2) + 'px';
         canvas.style.left = (canvas.width / 2) + 'px';
         canvas.style.width  = 0;
         canvas.style.height = 0;
 
 
         canvas.style.opacity = 0;
 
 
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         if (bounce) {
             jQuery('#' + obj.id).animate({
                 opacity: 1,
                 width: '120%',
                 height: '120%',
                 left: (canvas.width * -0.1) + 'px',
                 top: (canvas.height * -0.1) + 'px'
             }, 500, function (){
                         jQuery('#' + obj.id).animate({width: '90%', height: '90%', top: (canvas.height * 0.05) + 'px', left: (canvas.width * 0.05) + 'px'}, 250, function ()
                         {
                             jQuery('#' + obj.id).animate({width: '101%', height: '101%', top: (canvas.height * -0.005) + 'px', left: (canvas.width * -0.005) + 'px'}, 250, function ()
                             {
                                 jQuery('#' + obj.id).animate({width: '100%', height: '100%', top: 0, left: 0}, 250);
                             });
                         });
                      });
         } else {
             jQuery('#' + obj.id).animate({
                 opacity: 1,
                 width: '100%',
                 height: '100%',
                 left: 0,
                 top: 0
             }, 1000)
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], 1000);
         }
     }
 
 
 
 
     /**
     * Contract
     * 
     * This effect is a good one to use with the Expand effect to make a transition
     * 
     * @param object obj The graph object
     * @param null       Not used
     * @param            Optional callback to run when the effect iss done.
     */
     RGraph.Effects.jQuery.Contract = function (obj)
     {
         // Check for jQuery
         if (typeof(jQuery) == 'undefined') {
             alert('[ERROR] Could not find jQuery object - have you included the jQuery file?');
         }
         
         var canvas = obj.canvas;
         
         if (!canvas.__rgraph_div_placeholder__) {
             var div    = RGraph.Effects.ReplaceCanvasWithDIV(canvas);
             canvas.__rgraph_div_placeholder__ = div;
         } else {
             div = canvas.__rgraph_div_placeholder__;
         }
 
         div.style.position = 'relative';
         canvas.style.position = 'absolute';
         canvas.style.top      = 0;
         canvas.style.left     = 0;
 
 
         jQuery('#' + obj.id).animate({
             width: (canvas.width * 1.2) + 'px',
             height: (canvas.height * 1.2) + 'px',
             left: (canvas.width * -0.1) + 'px',
             top: (canvas.height * -0.1) + 'px'
         }, 250, function ()
         {
                 jQuery('#' + obj.id).animate({
                     opacity: 0,
                     width: 0,
                     height: 0,
                     left: (canvas.width * 0.5) + 'px',
                     top: (canvas.height * 0.5) + 'px'
                 }, 750)
         });
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], 1000);
         }
     }
 
 
 
     /**
     * A function used to replace the canvas witha Div, which inturn holds the canvas. This way the page
     * layout doesn't shift in the canvas is resized.
     * 
     * @param object canvas The canvas to replace.
     */
     RGraph.Effects.ReplaceCanvasWithDIV  = function (canvas)
     {
         if (!canvas.replacementDIV) {
             // Create the place holder DIV
             var div = document.createElement('DIV');
                 div.style.width = canvas.width + 'px';
                 div.style.height = canvas.height + 'px';
                 div.style.cssFloat = canvas.style.cssFloat;
                 div.style.left = canvas.style.left;
                 div.style.top = canvas.style.top;
                 //div.style.position = canvas.style.position;
                 div.style.display = 'inline-block';
             canvas.parentNode.insertBefore(div, canvas);
             
     
             // Remove the canvas from the document
             canvas.parentNode.removeChild(canvas);
             
             // Add it back in as a child of the place holder
             div.appendChild(canvas);
             
             // Reset the positioning information on the canvas
             canvas.style.position = 'relative';
             canvas.style.left = (div.offsetWidth / 2) + 'px';
             canvas.style.top = (div.offsetHeight / 2) + 'px';
             canvas.style.cssFloat = '';
         
             // Add a reference to the canvas to the DIV so that repeated plays of the anumation
             // don't keep replacing the canvas with a new DIV
             canvas.replacementDIV = div;
 
         } else {
             var div = canvas.replacementDIV;
         }
         
         return div;
     }
 
 
     /**
     * Snap
     * 
     * Similar to the tooltip effect of the same name, this moves the canvas in from the top left corner
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.jQuery.Snap = function (obj)
     {
         var delay = 500;
 
         var div = RGraph.Effects.ReplaceCanvasWithDIV(obj.canvas);
         
         obj.canvas.style.position = 'absolute';
         obj.canvas.style.top = 0;
         obj.canvas.style.left = 0;
         obj.canvas.style.width = 0;
         obj.canvas.style.height = 0;
         obj.canvas.style.opacity = 0;
         
         var targetLeft   = div.offsetLeft;
         var targetTop    = div.offsetTop;
         var targetWidth  = div.offsetWidth;
         var targetHeight = div.offsetHeight;
 
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         jQuery('#' + obj.id).animate({
             opacity: 1,
             width: targetWidth + 'px',
             height: targetHeight + 'px',
             left: targetLeft + 'px',
             top: targetTop + 'px'
         }, delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay + 50);
         }
     }
 
 
 
     /**
     * Reveal
     * 
     * This effect issmilat to the Expand effect - the canvas is slowly revealed from
     * the centre outwards
     * 
     * @param object obj The chart object
     */
     RGraph.Effects.jQuery.Reveal = function (obj)
     {
         var opts   = arguments[1] ? arguments[1] : null;
         var delay  = 1000;
         var canvas = obj.canvas;
         var xy     = RGraph.getCanvasXY(obj.canvas);
 
 
         /**
         * Hide the canvas and draw it
         */
         obj.canvas.style.visibility = 'hidden';
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
 
         var divs = [
                     ['reveal_left', xy[0], xy[1], obj.canvas.width  / 2, obj.canvas.height],
                     ['reveal_right',(xy[0] + (obj.canvas.width  / 2)),xy[1],(obj.canvas.width  / 2),obj.canvas.height],
                     ['reveal_top',xy[0],xy[1],obj.canvas.width,(obj.canvas.height / 2)],
                     ['reveal_bottom',xy[0],(xy[1] + (obj.canvas.height  / 2)),obj.canvas.width,(obj.canvas.height / 2)]
                    ];
         
         for (var i=0; i<divs.length; ++i) {
             var div = document.createElement('DIV');
                 div.id = divs[i][0];
                 div.style.width =  divs[i][3]+ 'px';
                 div.style.height = divs[i][4] + 'px';
                 div.style.left   = divs[i][1] + 'px';
                 div.style.top   = divs[i][2] + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = opts && typeof(opts['color']) == 'string' ? opts['color'] : 'white';
             document.body.appendChild(div);
         }
         
         /**
         * Now the covering DIVs are in place show the canvas again
         */
         obj.canvas.style.visibility = 'visible';
 
 
         jQuery('#reveal_left').animate({width: 0}, delay);
         jQuery('#reveal_right').animate({left: '+=' + (obj.canvas.width / 2),width: 0}, delay);
         jQuery('#reveal_top').animate({height: 0}, delay);
         jQuery('#reveal_bottom').animate({top: '+=' + (obj.canvas.height / 2),height: 0}, delay);
         
         // Remove the DIVs from the DOM 100ms after the animation ends
         setTimeout(
             function ()
             {
                 document.body.removeChild(document.getElementById("reveal_top"))
                 document.body.removeChild(document.getElementById("reveal_bottom"))
                 document.body.removeChild(document.getElementById("reveal_left"))
                 document.body.removeChild(document.getElementById("reveal_right"))
             }
             , delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
 
     /**
     * RevealCircular
     * 
     * This effect is smilar to the Reveal effect - the canvas is slowly revealed from
     * the centre outwards using a circular shape
     * 
     * @param object   obj The chart object
     * @param object       An object of options
     * @param function     An optional callback function that runs when the effect is finished
     */
     RGraph.Effects.RevealCircular = function (obj)
     {
         var opts      = arguments[1] ? arguments[1] : null;
         var callback  = arguments[2] ? arguments[2] : null;
         var frames    = 30;
         var RG        = RGraph;
         var ca        = obj.canvas;
         var co        = obj.context;
         var ra        = 0; // The initial radius of the circle that is clipped to
         var cx        = ca.width / 2;
         var cy        = ca.height / 2;
         var target_ra = Math.max(ca.height, ca.width);
         
         // This is the iterator function which gradually increases the radius of the clip circle
         function Grow ()
         {
             // Begin by clearing the canvas
             RG.Clear(ca);
 
             co.save();
                 // First draw the circle and clip to it
                 co.beginPath();
                 co.arc(cx, cy, ra, 0, TWOPI, false);
                 co.clip();
                 
                 // Now draw the chart
                 obj.Draw();
             co.restore();
 
 
             // Increment the radius
             if (ra < target_ra) {
                 ra += target_ra / 30;
                 RG.Effects.UpdateCanvas(Grow);
             
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
         
         Grow();
     }
 
 
 
     /**
     * Conceal
     * 
     * This effect is the reverse of the Reveal effect - instead of revealing the canvas it
     * conceals it. Combined with the reveal effect would make for a nice wipe effect.
     * 
     * @param object obj The chart object
     */
     RGraph.Effects.jQuery.Conceal = function (obj)
     {
         var opts   = arguments[1] ? arguments[1] : null;
         var delay  = 1000;
         var canvas = obj.canvas;
         var xy     = RGraph.getCanvasXY(obj.canvas);
 
 
         var divs = [
                     ['conceal_left', xy[0], xy[1], 0, obj.canvas.height],
                     ['conceal_right',(xy[0] + obj.canvas.width),xy[1],0,obj.canvas.height],
                     ['conceal_top',xy[0],xy[1],obj.canvas.width,0],
                     ['conceal_bottom',xy[0],(xy[1] + obj.canvas.height),obj.canvas.width,0]
                    ];
         
         for (var i=0; i<divs.length; ++i) {
             var div = document.createElement('DIV');
                 div.id = divs[i][0];
                 div.style.width =  divs[i][3]+ 'px';
                 div.style.height = divs[i][4] + 'px';
                 div.style.left   = divs[i][1] + 'px';
                 div.style.top   = divs[i][2] + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = opts && typeof(opts['color']) == 'string' ? opts['color'] : 'white';
             document.body.appendChild(div);
         }
 
 
         jQuery('#conceal_left').animate({width: '+=' + (obj.canvas.width / 2)}, delay);
         jQuery('#conceal_right').animate({left: '-=' + (obj.canvas.width / 2),width: (obj.canvas.width / 2)}, delay);
         jQuery('#conceal_top').animate({height: '+=' + (obj.canvas.height / 2)}, delay);
         jQuery('#conceal_bottom').animate({top: '-=' + (obj.canvas.height / 2),height: (obj.canvas.height / 2)}, delay);
         
         // Remove the DIVs from the DOM 100ms after the animation ends
         setTimeout(
             function ()
             {
                 document.body.removeChild(document.getElementById("conceal_top"))
                 document.body.removeChild(document.getElementById("conceal_bottom"))
                 document.body.removeChild(document.getElementById("conceal_left"))
                 document.body.removeChild(document.getElementById("conceal_right"))
             }
             , delay);
             
         setTimeout(function () {RGraph.Clear(obj.canvas);}, delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Horizontal Blinds (open)
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.jQuery.HBlinds.Open = function (obj)
     {
         var canvas  = obj.canvas;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var height = canvas.height / 5;
         
         /**
         * First draw the chart
         */
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         for (var i=0; i<5; ++i) {
             var div = document.createElement('DIV');
                 div.id = 'blinds_' + i;
                 div.style.width =  canvas.width + 'px';
                 div.style.height = height + 'px';
                 div.style.left   = xy[0] + 'px';
                 div.style.top   = (xy[1] + (canvas.height * (i / 5))) + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = color;
             document.body.appendChild(div);
 
             jQuery('#blinds_' + i).animate({height: 0}, delay);
         }
 
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Horizontal Blinds (close)
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.jQuery.HBlinds.Close = function (obj)
     {
         var canvas  = obj.canvas;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var height = canvas.height / 5;
 
         for (var i=0; i<5; ++i) {
             var div = document.createElement('DIV');
                 div.id = 'blinds_' + i;
                 div.style.width =  canvas.width + 'px';
                 div.style.height = 0;
                 div.style.left   = xy[0] + 'px';
                 div.style.top   = (xy[1] + (canvas.height * (i / 5))) + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = color;
             document.body.appendChild(div);
 
             jQuery('#blinds_' + i).animate({height: height + 'px'}, delay);
         }
         
         setTimeout(function () {RGraph.Clear(obj.canvas);}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay + 100);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Vertical Blinds (open)
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.jQuery.VBlinds.Open = function (obj)
     {
         var canvas  = obj.canvas;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var width  = canvas.width / 10;
         
         /**
         * First draw the chart
         */
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         for (var i=0; i<10; ++i) {
             var div = document.createElement('DIV');
                 div.id = 'blinds_' + i;
                 div.style.width =  width + 'px';
                 div.style.height = canvas.height + 'px';
                 div.style.left   = (xy[0] + (canvas.width * (i / 10))) + 'px';
                 div.style.top   = (xy[1]) + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = color;
             document.body.appendChild(div);
 
             jQuery('#blinds_' + i).animate({width: 0}, delay);
         }
 
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_5'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_6'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_7'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_8'));}, delay + 100);
         setTimeout(function () {document.body.removeChild(document.getElementById('blinds_9'));}, delay + 100);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Vertical Blinds (close)
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.jQuery.VBlinds.Close = function (obj)
     {
         var canvas  = obj.canvas;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var width  = canvas.width / 10;
         
         // Don't draw the chart
 
         for (var i=0; i<10; ++i) {
             var div = document.createElement('DIV');
                 div.id = 'blinds_' + i;
                 div.style.width =  0;
                 div.style.height = canvas.height + 'px';
                 div.style.left   = (xy[0] + (canvas.width * (i / 10))) + 'px';
                 div.style.top   = (xy[1]) + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = color;
             document.body.appendChild(div);
 
             jQuery('#blinds_' + i).animate({width: width}, delay);
         }
 
         setTimeout(function () {RGraph.Clear(obj.canvas, color);}, delay + 100);
 
         if (opts['remove']) {
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_0'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_1'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_2'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_3'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_4'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_5'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_6'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_7'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_8'));}, delay + 100);
             setTimeout(function () {document.body.removeChild(document.getElementById('blinds_9'));}, delay + 100);
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Pie chart grow
     * 
     * Gradually increases the pie chart radius
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.Pie.Grow = function (obj)
     {
         var canvas  = obj.canvas;
         var opts   = arguments[1] ? arguments[1] : [];
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         
         canvas.style.visibility = 'hidden';
         RGraph.RedrawCanvas(canvas);
 
         var radius = obj.getRadius();
         
         if (typeof(obj.Get('chart.radius')) == 'number') {
             radius = obj.Get('chart.radius');
         }
         
         //RGraph.Clear(obj.canvas);
         canvas.style.visibility = 'visible';
 
         obj.Set('chart.radius', 0);
 
         RGraph.Effects.Animate(obj, {'chart.radius': radius}, arguments[2]);
     }
 
 
     /**
     * Grow
     * 
     * The Bar chart Grow effect gradually increases the values of the bars
     * 
     * @param object   obj The graph object
     * @param object       An array of options
     * @param function     A function to call when the effect is complete
     */
     RGraph.Effects.Bar.Grow = function (obj)
     {
         // Callback
         var callback = arguments[2];
 
         // Save the data
         obj.original_data = RGraph.array_clone(obj.data);
         
         // Zero the data
         obj.__animation_frame__ = 0;
 
         // Stop the scale from changing by setting chart.ymax (if it's not already set)
         if (obj.Get('chart.ymax') == null) {
 
             var ymax = 0;
 
             for (var i=0; i<obj.data.length; ++i) {
                 if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'stacked') {
                     ymax = Math.max(ymax, Math.abs(RGraph.array_sum(obj.data[i])));
 
                 } else if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'grouped') {
                     ymax = Math.max(ymax, Math.abs(RGraph.array_max(obj.data[i])));
                 } else {
                     ymax = Math.max(ymax, Math.abs(obj.data[i]));
                 }
             }
 
             var scale = RGraph.getScale2(obj, {'max':ymax});
             obj.Set('chart.ymax', scale.max);
         }
 
         function Grow ()
         {
             var numFrames = 30;
 
             if (!obj.__animation_frame__) {
                 obj.__animation_frame__  = 0;
                 obj.__original_hmargin__ = obj.Get('chart.hmargin');
                 obj.__hmargin__          = ((obj.canvas.width - obj.Get('chart.gutter.left') - obj.Get('chart.gutter.right')) / obj.data.length) / 2;
                 obj.Set('chart.hmargin', obj.__hmargin__);
             }
 
             // Alter the Bar chart data depending on the frame
             for (var j=0; j<obj.original_data.length; ++j) {
                 if (typeof(obj.data[j]) == 'object') {
                     for (var k=0; k<obj.data[j].length; ++k) {
                         obj.data[j][k] = (obj.__animation_frame__ / numFrames) * obj.original_data[j][k];
                     }
                 } else {
                     obj.data[j] = (obj.__animation_frame__ / numFrames) * obj.original_data[j];
                 }
             }
 
             /**
             * Increment the hmargin to the target
             */
             obj.Set('chart.hmargin', ((1 - (obj.__animation_frame__ / numFrames)) * (obj.__hmargin__ - obj.__original_hmargin__)) + obj.__original_hmargin__);
 
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (obj.__animation_frame__ < numFrames) {
                 obj.__animation_frame__ += 1;
 
                 RGraph.Effects.UpdateCanvas(Grow);
             // Call the callback function if it's defined
             } else {
                 if (callback) {
                     callback(obj);
                 }
             }
         }
         
         RGraph.Effects.UpdateCanvas(Grow);
     }
 
 
     /**
     * A wrapper function that encapsulate requestAnimationFrame
     * 
     * @param function func The animation function
     */
     RGraph.Effects.UpdateCanvas = function (func)
     {
         window.requestAnimationFrame =    window.requestAnimationFrame
                                        || window.webkitRequestAnimationFrame
                                        || window.msRequestAnimationFrame
                                        || window.amozRequestAnimationFrame
                                        || (function (func){setTimeout(func, 16.666);});
         
         window.requestAnimationFrame(func);
     }
 
 
     /**
     * Grow
     * 
     * The Fuel chart Grow effect gradually increases the values of the Fuel chart
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.Fuel.Grow = function (obj)
     {
         var callback  = arguments[2];
         var numFrames = 30;
         var frame     = 0;
         var origValue = Number(obj.currentValue);
         
         if (obj.currentValue == null) {
             obj.currentValue = obj.min;
             origValue = obj.min;
         }
 
         var newValue  = obj.value;
         var diff      = newValue - origValue;
         var step      = (diff / numFrames);
         var frame     = 0;
 
 
         function Grow ()
         {
             frame++;
 
             obj.value = ((frame / numFrames) * diff) + origValue
 
             if (obj.value > obj.max) obj.value = obj.max;
             if (obj.value < obj.min) obj.value = obj.min;
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (frame < numFrames) {
                 RGraph.Effects.UpdateCanvas(Grow);
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
 
         Grow();
     }
 
 
     /**
     * The Animate function. Similar to the jQuery Animate() function - simply pass it a
     * map of the properties and their target values, and this function will animate
     * them to get to those values.
     * 
     * @param object obj The chart object
     * @param object map A map (an associative array) of the properties and their target values.
     * @param            An optional function which will be called when the animation is complete
     */
     RGraph.Effects.Animate = function (obj, map)
     {
         RGraph.RedrawCanvas(obj.canvas);
 
         RGraph.Effects.__total_frames__  = (map && map['frames']) ? map['frames'] : 30;
 
         function Animate_Iterator (func)
         {
             var id = [obj.id +  '_' + obj.type];
 
             // Very first time in - initialise the arrays
             if (typeof(RGraph.Effects.__current_frame__ ) == 'undefined') {
                 RGraph.Effects.__current_frame__   = new Array();
                 RGraph.Effects.__original_values__ = new Array();
                 RGraph.Effects.__diffs__           = new Array();
                 RGraph.Effects.__steps__           = new Array();
                 RGraph.Effects.__callback__        = new Array();
             }
 
             // Initialise the arrays for THIS animation (not necessrily the first in the page)
             if (!RGraph.Effects.__current_frame__[id]) {
                 RGraph.Effects.__current_frame__[id] = RGraph.Effects.__total_frames__;
                 RGraph.Effects.__original_values__[id] = {};
                 RGraph.Effects.__diffs__[id]           = {};
                 RGraph.Effects.__steps__[id]           = {};
                 RGraph.Effects.__callback__[id]        = func;
             }
 
             for (var i in map) {
                 if (typeof(map[i]) == 'string' || typeof(map[i]) == 'number') {
 
                     // If this the first frame, record the proginal value
                     if (RGraph.Effects.__current_frame__[id] == RGraph.Effects.__total_frames__) {
                         RGraph.Effects.__original_values__[id][i] = obj.Get(i);
                         RGraph.Effects.__diffs__[id][i]           = map[i] - RGraph.Effects.__original_values__[id][i];
                         RGraph.Effects.__steps__[id][i]           = RGraph.Effects.__diffs__[id][i] / RGraph.Effects.__total_frames__;
                     }
 
                     obj.Set(i, obj.Get(i) + RGraph.Effects.__steps__[id][i]);
 
                     RGraph.RedrawCanvas(obj.canvas);
                 }
             }
 
             // If the current frame number is above zero, run the animation iterator again
             if (--RGraph.Effects.__current_frame__[id] > 0) {
                 //setTimeout(Animate_Iterator, 100)
                 RGraph.Effects.UpdateCanvas(Animate_Iterator);
             
             // Optional callback
             } else {
 
                 if (typeof(RGraph.Effects.__callback__[id]) == 'function') {
                     (RGraph.Effects.__callback__[id])(obj);
                 }
                 
                 // Get rid of the arrays
                 RGraph.Effects.__current_frame__[id]   = null;
                 RGraph.Effects.__original_values__[id] = null;
                 RGraph.Effects.__diffs__[id]           = null;
                 RGraph.Effects.__steps__[id]           = null;
                 RGraph.Effects.__callback__[id]        = null;
 
             }
         }
 
         Animate_Iterator(arguments[2]);
     }
 
 
     /**
     * Slide in
     * 
     * This function is a wipe that can be used when switching the canvas to a new graph
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.jQuery.Slide.In = function (obj)
     {
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         var canvas = obj.canvas;
         var div    = RGraph.Effects.ReplaceCanvasWithDIV(obj.canvas);
         var delay = 1000;
         div.style.overflow= 'hidden';
         var from = typeof(arguments[1]) == 'object' && typeof(arguments[1]['from']) == 'string' ? arguments[1]['from'] : 'left';
         
         canvas.style.position = 'relative';
         
         if (from == 'left') {
             canvas.style.left = (0 - div.offsetWidth) + 'px';
             canvas.style.top  = 0;
         } else if (from == 'top') {
             canvas.style.left = 0;
             canvas.style.top  = (0 - div.offsetHeight) + 'px';
         } else if (from == 'bottom') {
             canvas.style.left = 0;
             canvas.style.top  = div.offsetHeight + 'px';
         } else {
             canvas.style.left = div.offsetWidth + 'px';
             canvas.style.top  = 0;
         }
         
         jQuery('#' + obj.id).animate({left:0,top:0}, delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Slide out
     * 
     * This function is a wipe that can be used when switching the canvas to a new graph
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.jQuery.Slide.Out = function (obj)
     {
         var canvas = obj.canvas;
         var div    = RGraph.Effects.ReplaceCanvasWithDIV(obj.canvas);
         var delay = 1000;
         div.style.overflow= 'hidden';
         var to = typeof(arguments[1]) == 'object' && arguments[1] && typeof(arguments[1]['to']) == 'string' ? arguments[1]['to'] : 'left';
         
         canvas.style.position = 'relative';
         canvas.style.left = 0;
         canvas.style.top  = 0;
         
         if (to == 'left') {
             jQuery('#' + obj.id).animate({left: (0 - canvas.width) + 'px'}, delay);
         } else if (to == 'top') {
             jQuery('#' + obj.id).animate({left: 0, top: (0 - div.offsetHeight) + 'px'}, delay);
         } else if (to == 'bottom') {
             jQuery('#' + obj.id).animate({top: (0 + div.offsetHeight) + 'px'}, delay);
         } else {
             jQuery('#' + obj.id).animate({left: (0 + canvas.width) + 'px'}, delay);
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Unfold
     * 
     * This effect gradually increases the X/Y coordinatesfrom 0
     * 
     * @param object obj The chart object
     */
     RGraph.Effects.Line.Unfold = function (obj)
     {
         obj.Set('chart.animation.factor', obj.Get('chart.animation.unfold.initial'));
         RGraph.Effects.Animate(obj, {'chart.animation.factor': 1}, arguments[2]);
     }
 
 
     /**
     * RoundRobin
     * 
     * This effect is similar to the Pie chart RoundRobin effect
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.Rose.RoundRobin = function (obj)
     {
         var numFrames       = 60;
         var currentFrame    = 0;
         var original_margin = obj.Get('chart.margin');
         var margin          = (360 / obj.data.length) / 2;
         var callback        = arguments[2];
 
         obj.Set('chart.margin', margin);
         obj.Set('chart.animation.roundrobin.factor', 0);
 
         //RGraph.Effects.Animate(obj, {'chart.margin': original_margin, 'chart.animation.grow.factor': 1, 'frames': 45}, arguments[2]);
         function RoundRobin_inner ()
         {
             if (currentFrame++ < numFrames) {
                 obj.Set('chart.animation.roundrobin.factor', currentFrame / numFrames);
                 obj.Set('chart.margin', (currentFrame / numFrames) * original_margin);
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 RGraph.Effects.UpdateCanvas(RoundRobin_inner);
 
             } else {
                 obj.Set('chart.animation.roundrobin.factor', 1);
                 obj.Set('chart.margin', original_margin);
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
         }
         
         RGraph.Effects.UpdateCanvas(RoundRobin_inner);
     }
 
 
     /**
     * UnfoldFromCenter
     * 
     * Line chart  unfold from center
     */
     RGraph.Effects.Line.UnfoldFromCenter = function (obj)
     {
         var numFrames = 30;
 
         var original_opacity = obj.canvas.style.opacity;
         obj.canvas.style.opacity = 0;
         
         obj.Draw();
         RGraph.RedrawCanvas(obj.canvas);
 
         var center_value = obj.Get('chart.xaxispos') == 'center' ? obj.Get('chart.ymin') : ((obj.max - obj.min) / 2) + obj.min;
         obj.Set('chart.ymax', obj.scale2.max);
 
         RGraph.Clear(obj.canvas);
 
         obj.canvas.style.opacity = original_opacity;
         var original_data = RGraph.array_clone(obj.original_data);
         var callback = arguments[2];
 
         if (!obj.__increments__) {
         
             obj.__increments__ = new Array();
         
             for (var dataset=0; dataset<original_data.length; ++dataset) {
 
                 obj.__increments__[dataset] = new Array();
 
                 for (var i=0; i<original_data[dataset].length; ++i) {
                     if (obj.Get('chart.filled') && obj.Get('chart.filled.accumulative') && dataset > 0) {
                         obj.__increments__[dataset][i] = original_data[dataset][i] / numFrames;
                         obj.original_data[dataset][i] = 0;
                     } else {
                         obj.__increments__[dataset][i] = (original_data[dataset][i] - center_value) / numFrames;
                         obj.original_data[dataset][i] = center_value;
                     }
                 }
             }
         }
 
         function UnfoldFromCenter ()
         {
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
         
             for (var dataset=0; dataset<original_data.length; ++dataset) {
                 for (var i=0; i<original_data[dataset].length; ++i) {
                     obj.original_data[dataset][i] += obj.__increments__[dataset][i];
                 }
             }
 
             if (--numFrames > 0) {
                 RGraph.Effects.UpdateCanvas(UnfoldFromCenter);
             } else {
                 obj.original_data = RGraph.array_clone(original_data);
                 obj.__increments__ = null;
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
         }
         
         UnfoldFromCenter();
     }
 
 
 
     /**
     * UnfoldFromCenterTrace
     */
     RGraph.Effects.Line.jQuery.UnfoldFromCenterTrace = function  (obj)
     {
         // Hide the canvas first
         obj.canvas.style.visibility = 'hidden';
         setTimeout(function () {obj.canvas.style.visibility = 'visible';}, 10);
 
         /**
         * First draw the chart so we can get the max
         */
         obj.Draw();
         RGraph.Clear(obj.canvas);
 
 
         var data = RGraph.array_clone(obj.original_data);
         var callback = arguments[2];
 
         /**
         * When the Trace function finishes it calls this function
         */
         function Unfold_callback ()
         {
             obj.original_data = data;
             RGraph.Effects.Line.UnfoldFromCenter(obj, null, callback);
         }
 
         /**
         * Determine the mid-point
         */
         var half = obj.Get('chart.xaxispos') == 'center' ? obj.min : ((obj.max - obj.min) / 2) + obj.min;
         obj.Set('chart.ymax', obj.max);
 
         for (var i=0; i<obj.original_data.length; ++i) {
             for (var j=0; j<obj.original_data[i].length; ++j) {
                 obj.original_data[i][j] = (obj.Get('chart.filled') && obj.Get('chart.filled.accumulative') && i > 0) ? 0 : half;
             }
         }
 
         //RGraph.Clear(obj.canvas);
         RGraph.Effects.Line.jQuery.Trace(obj, {'duration':1000}, Unfold_callback);
     }
 
 
 
     /**
     * FoldToCenter
     * 
     * Line chart  FoldTocenter
     */
     RGraph.Effects.Line.FoldToCenter = function (obj)
     {
         var totalFrames = 30;
         var numFrame    = totalFrames;
         RGraph.RedrawCanvas(obj.canvas);
         var center_value = obj.scale2.max / 2;
         obj.Set('chart.ymax', obj.scale2.max);
         RGraph.Clear(obj.canvas);
         var original_data = RGraph.array_clone(obj.original_data);
         obj.Set('chart.shadow.blur', 0);
         var callback = arguments[2];
         
         function FoldToCenter ()
         {
             for (var i=0; i<obj.data.length; ++i) {
                 if (obj.data[i].length) {
                     for (var j=0; j<obj.data[i].length; ++j) {
                         if (obj.original_data[i][j] > center_value) {
                             obj.original_data[i][j] = ((original_data[i][j] - center_value) * (numFrame/totalFrames)) + center_value;
                         } else {
                             obj.original_data[i][j] = center_value - ((center_value - original_data[i][j]) * (numFrame/totalFrames));
                         }
                     }
                 }
             }
             
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas)
 
             if (numFrame-- > 0) {
                 RGraph.Effects.UpdateCanvas(FoldToCenter);
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
 
         RGraph.Effects.UpdateCanvas(FoldToCenter);
     }
 
 
     /**
     * Odo Grow
     * 
     * This effect gradually increases the represented value
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.Odo.Grow = function (obj)
     {
         var numFrames = 30;
         var curFrame  = 0;
         var origValue = Number(obj.currentValue);
         var newValue  = obj.value;
         var diff      = newValue - origValue;
         var step      = (diff / numFrames);
         var callback  = arguments[2];
 
         function Grow_inner ()
         {
             obj.value = origValue + (curFrame * step);
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (++curFrame <= numFrames) {
                 RGraph.Effects.UpdateCanvas(Grow_inner);
             } else if (callback) {
                 callback(obj);
             }
         }
         
         //setTimeout(Grow, 100);
         Grow_inner();
     }
 
 
     /**
     * Meter Grow
     * 
     * This effect gradually increases the represented value
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.Meter.Grow = function (obj)
     {
         if (!obj.currentValue) {
             obj.currentValue = obj.min;
         }
 
         var totalFrames = 60;
         var numFrame    = 0;
         var diff        = obj.value - obj.currentValue;
         var step        = diff / totalFrames
         var callback    = arguments[2];
         var initial     = obj.currentValue;
 
         function Grow_meter_inner ()
         {
             obj.value = initial + (numFrame++ * step);
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
         
             if (numFrame++ <= totalFrames) {
                 RGraph.Effects.UpdateCanvas(Grow_meter_inner);
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
         
         Grow_meter_inner();
     }
 
 
     /**
     * Grow
     * 
     * The HBar chart Grow effect gradually increases the values of the bars
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.HBar.Grow = function (obj)
     {
         // Save the data
         obj.original_data = RGraph.array_clone(obj.data);
         
         // Zero the data
         obj.__animation_frame__ = 0;
 
         // Stop the scale from changing by setting chart.ymax (if it's not already set)
         if (obj.Get('chart.xmax') == 0) {
 
             var xmax = 0;
 
             for (var i=0; i<obj.data.length; ++i) {
                 if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'stacked') {
                     xmax = Math.max(xmax, RGraph.array_sum(obj.data[i]));
                 } else if (RGraph.is_array(obj.data[i]) && obj.Get('chart.grouping') == 'grouped') {
                     xmax = Math.max(xmax, RGraph.array_max(obj.data[i]));
                 } else {
                     xmax = Math.max(xmax, RGraph.array_max(obj.data[i]));
                 }
             }
 
             var scale2 = RGraph.getScale2(obj, {'max':xmax});
             obj.Set('chart.xmax', scale2.max);
         }
         
         /**
         * Turn off shadow blur for the duration of the animation
         */
         if (obj.Get('chart.shadow.blur') > 0) {
             var __original_shadow_blur__ = obj.Get('chart.shadow.blur');
             obj.Set('chart.shadow.blur', 0);
         }
 
         function Grow ()
         {
             var numFrames = 30;
 
             if (!obj.__animation_frame__) {
                 obj.__animation_frame__  = 0;
                 obj.__original_vmargin__ = obj.Get('chart.vmargin');
                 obj.__vmargin__          = ((obj.canvas.height - obj.Get('chart.gutter.top') - obj.Get('chart.gutter.bottom')) / obj.data.length) / 2;
                 obj.Set('chart.vmargin', obj.__vmargin__);
             }
 
             // Alter the Bar chart data depending on the frame
             for (var j=0; j<obj.original_data.length; ++j) {
                 
                 // This stops the animatioon from being completely linear
                 var easing = Math.pow(Math.sin((obj.__animation_frame__ * (90 / numFrames)) / (180 / PI)), 4);
 
                 if (typeof(obj.data[j]) == 'object') {
                     for (var k=0; k<obj.data[j].length; ++k) {
                         obj.data[j][k] = (obj.__animation_frame__ / numFrames) * obj.original_data[j][k] * easing;
                     }
                 } else {
                     obj.data[j] = (obj.__animation_frame__ / numFrames) * obj.original_data[j] * easing;
                 }
             }
 
             /**
             * Increment the vmargin to the target
             */
             obj.Set('chart.vmargin', ((1 - (obj.__animation_frame__ / numFrames)) * (obj.__vmargin__ - obj.__original_vmargin__)) + obj.__original_vmargin__);
 
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (obj.__animation_frame__ < numFrames) {
                 obj.__animation_frame__ += 1;
                 
                 RGraph.Effects.UpdateCanvas(Grow);
             
             // Turn any shadow blur back on
             } else {
                 if (typeof(__original_shadow_blur__) == 'number' && __original_shadow_blur__ > 0) {
                     obj.Set('chart.shadow.blur', __original_shadow_blur__);
                     RGraph.Clear(obj.canvas);
                     RGraph.RedrawCanvas(obj.canvas);
                 }
             }
         }
         
         RGraph.Effects.UpdateCanvas(Grow);
     }
 
 
     /**
     * Trace
     * 
     * This effect is for the Line chart, uses the jQuery library and slowly
     * uncovers the Line , but you can see the background of the chart. This effect
     * is quite new (1/10/2011) and as such should be used with caution.
     * 
     * @param object obj The graph object
     * @param object     Not used
     * @param int        A number denoting how long (in millseconds) the animation should last for. Defauld
     *                   is 1500
     */
     RGraph.Effects.Line.jQuery.Trace = function (obj)
     {
         var callback = typeof(arguments[2]) == 'function' ? arguments[2] : function () {};
         var opt = arguments[1] || [];
         
         if (!opt['duration']) {
             opt['duration'] = 1000;
         }
 
         RGraph.Clear(obj.canvas);
         //obj.Draw();
         RGraph.RedrawCanvas(obj.canvas);
 
         /**
         * Create the DIV that the second canvas will sit in
         */
         var div = document.createElement('DIV');
             var xy = RGraph.getCanvasXY(obj.canvas);
             div.id = '__rgraph_trace_animation_' + RGraph.random(0, 4351623) + '__';
             div.style.left = xy[0] + 'px';
             div.style.top = xy[1] + 'px';
             div.style.width = obj.Get('chart.gutter.left');
             div.style.height = obj.canvas.height + 'px';
             div.style.position = 'absolute';
             div.style.overflow = 'hidden';
         document.body.appendChild(div);
         
         obj.canvas.__rgraph_trace_div__ = div;
 
         /**
         * Make the second canvas
         */
         var id      = '__rgraph_line_trace_animation_' + RGraph.random(0, 99999999) + '__';
         var canvas2 = document.createElement('CANVAS');
 
 
 
 
         // Copy the 3D CSS transformation properties across from the original canvas
         var properties = ['WebkitTransform','MozTransform','OTransform','MSTransform','transform'];
         
         for (i in properties) {
             var name = properties[i];
             if (typeof(obj.canvas.style[name]) == 'string' && obj.canvas.style[name]) {
                 canvas2.style[name] = obj.canvas.style[name];
             }
         }
         
         
 
         obj.canvas.__rgraph_line_canvas2__ = canvas2;
         canvas2.width = obj.canvas.width;
         canvas2.height = obj.canvas.height;
         canvas2.style.position = 'absolute';
         canvas2.style.left = 0;
         canvas2.style.top  = 0;
 
 
         // This stops the clear effect clearing the canvas - which can happen if you have multiple canvas tags on the page all with
         // dynamic effects that do redrawing
         canvas2.noclear = true;
 
         canvas2.id         = id;
         div.appendChild(canvas2);
 
         var reposition_canvas2 = function (e)
         {
             var xy = RGraph.getCanvasXY(obj.canvas);
             
             div.style.left = xy[0] + 'px';
             div.style.top = xy[1] + 'px';
         }
         window.addEventListener('resize', reposition_canvas2, false)
         
         /**
         * Make a copy of the original Line object
         */
         var obj2 = new RGraph.Line(id, RGraph.array_clone(obj.original_data));
         
         // Remove the new line from the ObjectRegistry so that it isn't redawn
         RGraph.ObjectRegistry.Remove(obj2);
 
         for (i in obj.properties) {
             if (typeof(i) == 'string') {
                 obj2.Set(i, obj.properties[i]);
             }
         }
 
         //obj2.Set('chart.tooltips', null);
         obj2.Set('chart.labels', []);
         obj2.Set('chart.background.grid', false);
         obj2.Set('chart.background.barcolor1', 'rgba(0,0,0,0)');
         obj2.Set('chart.background.barcolor2', 'rgba(0,0,0,0)');
         obj2.Set('chart.ylabels', false);
         obj2.Set('chart.noaxes', true);
         obj2.Set('chart.title', '');
         obj2.Set('chart.title.xaxis', '');
         obj2.Set('chart.title.yaxis', '');
         obj2.Set('chart.filled.accumulative', obj.Get('chart.filled.accumulative'));
         obj.Set('chart.key', []);
         obj2.Draw();
         
         obj.canvas.__rgraph_trace_obj2__ = obj2;
 
 
         /**
         * This effectively hides the line
         */
         obj.Set('chart.line.visible', false);
         obj.Set('chart.colors', ['rgba(0,0,0,0)']);
         if (obj.Get('chart.filled')) {
             var original_fillstyle = obj.Get('chart.fillstyle');
             obj.Set('chart.fillstyle', 'rgba(0,0,0,0)');
             obj.Set('chart.animation.trace.original.fillstyle', original_fillstyle);
         }
 
         RGraph.Clear(obj.canvas);
         //obj.Draw();
         RGraph.RedrawCanvas(obj.canvas);
         
         /**
         * Place a DIV over the canvas to stop interaction with it
         */
         if (!obj.canvas.__rgraph_trace_cover__) {
             var div2 = document.createElement('DIV');
                 div2.id = '__rgraph_trace_animation_' + RGraph.random(0, 4351623) + '__';
                 div2.style.left = xy[0] + 'px';
                 div2.style.top = xy[1] + 'px';
                 div2.style.width = obj.canvas.width + 'px';
                 div2.style.height = obj.canvas.height + 'px';
                 div2.style.position = 'absolute';
                 div2.style.overflow = 'hidden';
                 div2.style.backgroundColor = 'rgba(0,0,0,0)';
                 div.div2 = div2;
                 obj.canvas.__rgraph_trace_cover__ = div2;
             document.body.appendChild(div2);
         } else {
             div2 = obj.canvas.__rgraph_trace_cover__;
         }
 
         /**
         * Animate the DIV that contains the canvas
         */
         jQuery('#' + div.id).animate({
             width: obj.canvas.width + 'px'
         }, opt['duration'], function () {RGraph.Effects.Line.Trace_callback(obj)});
 
 
         /**
         * Get rid of the second canvas and turn the line back on
         * on the original.
         */
         RGraph.Effects.Line.Trace_callback = function (obj)
         {
             var obj2 = obj.canvas.__rgraph_trace_obj2__;
 
             // Remove the window resize listener
             window.removeEventListener('resize', reposition_canvas2, false);
 
             div.style.display = 'none';
             div2.style.display = 'none';
 
             //div.removeChild(canvas2);
             obj.Set('chart.line.visible', true);
             
             // Revert the filled status back to as it was
             obj.Set('chart.filled', RGraph.array_clone(obj2.Get('chart.filled')));
             obj.Set('chart.fillstyle', obj.Get('chart.animation.trace.original.fillstyle'));
             obj.Set('chart.colors', RGraph.array_clone(obj2.Get('chart.colors')));
             obj.Set('chart.key', RGraph.array_clone(obj2.Get('chart.key')));
 
             RGraph.RedrawCanvas(obj.canvas);
 
             obj.canvas.__rgraph_trace_div__.style.display = 'none';
             obj.canvas.__rgraph_trace_div__ = null;
             obj.canvas.__rgraph_line_canvas2__.style.display = 'none';
             obj.canvas.__rgraph_line_canvas2__ = null;
             obj.canvas.__rgraph_trace_cover__.style.display = 'none';
             obj.canvas.__rgraph_trace_cover__ = null;
             
             
             callback(obj);
         }
     }
 
 
 
     /**
     * Trace2
     * 
     * This is a new version of the Trace effect which no longer requires jQuery and is more compatible
     * with other effects (eg Expand). This new effect is considerably simpler and less code.
     * 
     * @param object obj The graph object
     * @param object     Options for the effect. Currently only "frames" is available.
     * @param int        A function that is called when the ffect is complete
     */
     RGraph.Effects.Line.Trace2 = function (obj)
     {
         var callback  = arguments[2];
         var numFrames = (arguments[1] && arguments[1].frames) ? arguments[1].frames : 60;
         var frame     = 0;
         
         obj.Set('animation.trace.clip', 0);
 
         function Grow ()
         {
             if (frame > numFrames) {
                 if (callback) {
                     callback(obj);
                 }
                 return;
             }
 
             obj.Set('animation.trace.clip', frame / numFrames );
 
             RGraph.RedrawCanvas(obj.canvas);
 
             frame++;
             RGraph.Effects.UpdateCanvas(Grow);
         }
         
         Grow();
     }
 
 
 
     /**
     * Trace (Radar chart)
     * 
     * This is a Trace effect for the Radar chart
     * 
     * @param object obj The graph object
     * @param object     Options for the effect. Currently only "frames" is available.
     * @param function   A function that is called when the ffect is complete
     */
     RGraph.Effects.Radar.Trace = function (obj)
     {
         var callback  = arguments[2];
         var numFrames = (arguments[1] && arguments[1].frames) ? arguments[1].frames : 60;
         var frame     = 0;
 
         obj.Set('animation.trace.clip', 0);
 
         function Grow ()
         {
             if (frame > numFrames) {
                 if (callback) {
                     callback(obj);
                 }
                 return;
             }
 
             obj.Set('animation.trace.clip', frame / numFrames );
 
             RGraph.RedrawCanvas(obj.canvas);
 
             frame++;
             RGraph.Effects.UpdateCanvas(Grow);
         }
         
         Grow();
     }
 
 
 
     /**
     * RoundRobin
     * 
     * This effect does two things:
     *  1. Gradually increases the size of each segment
     *  2. Gradually increases the size of the radius from 0
     * 
     * @param object obj The graph object
     */
     RGraph.Effects.Pie.RoundRobin = function (obj)
     {
         var callback     = arguments[2] ? arguments[2] : null;
         var opt          = arguments[1];
         var currentFrame = 0;
         var numFrames    = (opt && opt['frames']) ? opt['frames'] : 90;
         var targetRadius =  obj.getRadius();
         
         obj.Set('chart.events', false);
         
         // Fix for donuts
         if (obj.properties['chart.variant'] == 'donut' && typeof(obj.properties['chart.variant.donut.width']) == 'number') {
             if (RGraph.is_null(opt)) {
                 var opt = {radius: null}
             } else {
                 opt.radius = null;
             }
         }
 
 
         function RoundRobin_inner ()
         {
             obj.Set('chart.effect.roundrobin.multiplier', Math.pow(Math.sin((currentFrame * (90 / numFrames)) / (180 / PI)), 2) * (currentFrame / numFrames) );
 
             if (!opt || typeof(opt['radius']) == 'undefined' || opt['radius'] == true) {
                 obj.Set('chart.radius', targetRadius * obj.Get('chart.effect.roundrobin.multiplier'));
             }
             
             RGraph.RedrawCanvas(obj.canvas);
 
             if (currentFrame++ < numFrames) {
                 RGraph.Effects.UpdateCanvas(RoundRobin_inner);
             
             } else {
                 
                 // Re-enable the events and redraw the chart.
                 obj.Set('chart.events', true);
                 RGraph.RedrawCanvas(obj.canvas);
 
                 if (callback) {
                     callback(obj);
                 }
             }
         }
 
         RGraph.Effects.UpdateCanvas(RoundRobin_inner);
     }
 
 
     /**
     * Implode (pie chart)
     * 
     * Here the segments are initially exploded - and gradually
     * contract inwards to create the Pie chart
     * 
     * @param object obj The Pie chart object
     */
     RGraph.Effects.Pie.Implode = function (obj)
     {
         var numFrames = 90;
         var distance  = Math.min(obj.canvas.width, obj.canvas.height);
         var exploded  = obj.Get('chart.exploded');
         var callback  = arguments[2];
         
         function Implode_inner ()
         {
             obj.Set('chart.exploded', Math.sin(numFrames / (180 / PI)) * distance);
             RGraph.Clear(obj.canvas)
             //obj.Draw();
             RGraph.RedrawCanvas(obj.canvas);
 
             if (numFrames > 0) {
                 numFrames--;
                 RGraph.Effects.UpdateCanvas(Implode_inner);
             } else {
                 // Finish off the animation
                 obj.Set('chart.exploded', exploded);
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
         }
         
         RGraph.Effects.UpdateCanvas(Implode_inner);
     }
 
 
 
     /**
     * Pie chart explode
     * 
     * Explodes the Pie chart - gradually incrementing the size of the chart.explode property
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.Pie.Explode = function (obj)
     {
         var canvas   = obj.canvas;
         var opts     = arguments[1] ? arguments[1] : [];
         var callback = arguments[2] ? arguments[2] : null;
         var frames   = opts['frames'] ? opts['frames'] : 60;
 
         obj.Set('chart.exploded', 0);
 
         RGraph.Effects.Animate(obj, {'frames': frames, 'chart.exploded': Math.max(canvas.width, canvas.height)}, callback);
     }
 
 
 
     /**
     * Gauge Grow
     * 
     * This effect gradually increases the represented value
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.Gauge.Grow = function (obj)
     {
 
         var callback  = arguments[2];
         var numFrames = 30;
         var frame     = 0;
 
         // Single pointer
         if (typeof(obj.value) == 'number') {
 
             var origValue = Number(obj.currentValue);
 
             if (obj.currentValue == null) {
                 obj.currentValue = obj.min;
                 origValue = obj.min;
             }
 
             var newValue  = obj.value;
             var diff      = newValue - origValue;
             var step      = (diff / numFrames);
             var frame     = 0;
 
 
             function Grow_single ()
             {
 
                 frame++;
 
                 obj.value = ((frame / numFrames) * diff) + origValue;
 
                 if (obj.value > obj.max) obj.value = obj.max;
                 if (obj.value < obj.min) obj.value = obj.min;
     
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
     
                 if (frame < 30) {
                     RGraph.Effects.UpdateCanvas(Grow_single);
                 } else if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
 
             Grow_single();
 
         // Multiple pointers
         } else {
 
             if (obj.currentValue == null) {
                 obj.currentValue = [];
                 
                 for (var i=0; i<obj.value.length; ++i) {
                     obj.currentValue[i] = obj.min;
                 }
                 
                 origValue = RGraph.array_clone(obj.currentValue);
             }
 
             var origValue = RGraph.array_clone(obj.currentValue);
             var newValue  = RGraph.array_clone(obj.value);
             var diff      = [];
             var step      = [];
             
             for (var i=0; i<newValue.length; ++i) {
                 diff[i] = newValue[i] - Number(obj.currentValue[i]);
                 step[i] = (diff[i] / numFrames);
             }
 
 
 
             function Grow_multiple ()
             {
                 frame++;
                 
                 for (var i=0; i<obj.value.length; ++i) {
                     
                     obj.value[i] = ((frame / numFrames) * diff[i]) + origValue[i];
 
                     if (obj.value[i] > obj.max) obj.value[i] = obj.max;
                     if (obj.value[i] < obj.min) obj.value[i] = obj.min;
         
                     RGraph.Clear(obj.canvas);
                     RGraph.RedrawCanvas(obj.canvas);
                     
                 }
     
                 if (frame < 30) {
                     RGraph.Effects.UpdateCanvas(Grow_multiple);
                 } else if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
     
             Grow_multiple();
         }
     }
 
 
     /**
     * Radar chart grow
     * 
     * This effect gradually increases the magnitude of the points on the radar chart
     * 
     * @param object obj The chart object
     * @param null       Not used
     * @param function   An optional callback that is run when the effect is finished
     */
     RGraph.Effects.Radar.Grow = function (obj)
     {
         var totalframes   = 30;
         var framenum      = totalframes;
         var data          = RGraph.array_clone(obj.data);
         var callback      = arguments[2];
         obj.original_data = RGraph.array_clone(obj.original_data);
 
         function Grow_inner ()
         {
             for (var i=0; i<data.length; ++i) {
                 
                 if (obj.original_data[i] == null) {
                     obj.original_data[i] = [];
                 }
 
                 for (var j=0; j<data[i].length; ++j) {
                     obj.original_data[i][j] = ((totalframes - framenum)/totalframes)  * data[i][j];
                 }
             }
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (framenum > 0) {
                 framenum--;
                 RGraph.Effects.UpdateCanvas(Grow_inner);
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
         
         RGraph.Effects.UpdateCanvas(Grow_inner);
     }
 
 
     /**
     * Waterfall Grow
     * 
     * @param object obj The chart object
     * @param null Not used
     * @param function An optional function which is called when the animation is finished
     */
     RGraph.Effects.Waterfall.Grow = function (obj)
     {
         var totalFrames = 45;
         var numFrame    = 0;
         var data = RGraph.array_clone(obj.data);
         var callback = arguments[2];
         
         //Reset The data to zeros
         for (var i=0; i<obj.data.length; ++i) {
             obj.data[i] /= totalFrames;
         }
         
         /**
         * Fix the scale
         */
         if (obj.Get('chart.ymax') == null) {
             var max   = obj.getMax(data);
             var scale2 = RGraph.getScale2(obj, {'max':max});
             obj.Set('chart.ymax', scale2.max);
         }
         
         //obj.Set('chart.multiplier.x', 0);
         //obj.Set('chart.multiplier.w', 0);
 
         function Grow_inner ()
         {
             for (var i=0; i<obj.data.length; ++i) {
                 obj.data[i] = data[i] * (numFrame/totalFrames);
             }
             
             var multiplier = Math.pow(Math.sin(((numFrame / totalFrames) * 90) / (180 / PI)), 20);
             //obj.Set('chart.multiplier.x', (numFrame / totalFrames) * multiplier);
             //obj.Set('chart.multiplier.w', (numFrame / totalFrames) * multiplier);
             
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (numFrame++ < totalFrames) {
                 RGraph.Effects.UpdateCanvas(Grow_inner);
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
         
         RGraph.Effects.UpdateCanvas(Grow_inner)
     }
 
 
 
     /**
     * Bar chart Wave effect This effect defaults to 30 frames - which is
     * approximately half a second
     * 
     * @param object obj The chart object
     */
     RGraph.Effects.Bar.Wave2 =
     RGraph.Effects.Bar.Wave = function (obj)
     {
         var totalframes   = (arguments[1] && arguments[1].frames) ? arguments[1].frames : 15;
         var original_data = [];
 
         obj.Draw();
         //var scale = RGraph.getScale2(obj, {'max':obj.max});
         obj.Set('chart.ymax', obj.scale2.max);
         RGraph.Clear(obj.canvas);
         
         for (var i=0; i<obj.data.length; ++i) {
         
             (function (idx)
             {
                 original_data[i] = obj.data[i];
                 obj.data[i] = typeof(obj.data[i]) == 'object' ? [] : 0;
                 setTimeout(function () {Iterator(idx, totalframes);}, 100 * i)
             })(i);
         }
         
         function Iterator(idx, frames)
         {
             if (frames-- > 0) {
 
                 // Update the data point
                 if (typeof(obj.data[idx]) == 'number') {
                     obj.data[idx] = ((totalframes - frames) / totalframes) * original_data[idx]
 
                 } else if (typeof(obj.data[idx]) == 'object') {
                     for (var k=0; k<original_data[idx].length; ++k) {
                         obj.data[idx][k] = ((totalframes - frames) / totalframes) * original_data[idx][k];
                     }
                 }
 
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 RGraph.Effects.UpdateCanvas(function () {Iterator(idx, frames);});
             }
         }
     }
 
 
 
     /**
     * HProgress Grow effect (which is also the VPogress Grow effect)
     * 
     * @param object obj The chart object
     */
     RGraph.Effects.VProgress.Grow =
     RGraph.Effects.HProgress.Grow = function (obj)
     {
         var canvas        = obj.canvas;
         var context       = obj.context;
         var initial_value = obj.currentValue;
         var numFrames     = 30;
         var currentFrame  = 0
 
         if (typeof(obj.value) == 'object') {
 
             if (RGraph.is_null(obj.currentValue)) {
                 obj.currentValue = [];
                 for (var i=0; i<obj.value.length; ++i) {
                     obj.currentValue[i] = 0;
                 }
             }
 
             var diff      = [];
             var increment = [];
 
             for (var i=0; i<obj.value.length; ++i) {
                 diff[i]      = obj.value[i] - Number(obj.currentValue[i]);
                 increment[i] = diff[i] / numFrames;
             }
             
             if (initial_value == null) {
                 initial_value = [];
                 for (var i=0; i< obj.value.length; ++i) {
                     initial_value[i] = 0;
                 }
             }
 
         } else {
 
             var diff = obj.value - Number(obj.currentValue);
             var increment = diff  / numFrames;
         }
         var callback      = arguments[2] ? arguments[2] : null;
 
         function Grow ()
         {
             currentFrame++;
 
             if (currentFrame <= numFrames) {
 
                 if (typeof(obj.value) == 'object') {
                     obj.value = [];
                     for (var i=0; i<initial_value.length; ++i) {
                         obj.value[i] = initial_value[i] + (increment[i] * currentFrame);
                     }
                 } else {
                     obj.value = initial_value + (increment * currentFrame);
                 }
 
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 RGraph.Effects.UpdateCanvas(Grow);
 
             } else if (callback) {
                 callback(obj);
             }
         }
         
         RGraph.Effects.UpdateCanvas(Grow);
     }
 
 
 
     /**
     * Gantt chart Grow effect
     * 
     * @param object obj The chart object
     */
     RGraph.Effects.Gantt.Grow = function (obj)
     {
         var canvas       = obj.canvas;
         var context      = obj.context;
         var numFrames    = 30;
         var currentFrame = 0;
         var callback     = arguments[2] ? arguments[2] : null;
         var events       = obj.data;
         
         var original_events = RGraph.array_clone(events);
 
         function Grow_gantt_inner ()
         {
             if (currentFrame <= numFrames) {
                 // Update the events
                 for (var i=0; i<events.length; ++i) {
                     if (typeof(events[i][0]) == 'object') {
                         for (var j=0; j<events[i].length; ++j) {
                             events[i][j][1] = (currentFrame / numFrames) * original_events[i][j][1];
                         }
                     } else {
 
                         events[i][1] = (currentFrame / numFrames) * original_events[i][1];
                     }
                 }
 
                 obj.data = events;
 
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 currentFrame++;
                 
                 RGraph.Effects.UpdateCanvas(Grow_gantt_inner);
 
             } else if (callback) {            
                 callback(obj);
             }
         }
         
         RGraph.Effects.UpdateCanvas(Grow_gantt_inner);
     }
 
 
     /**
     * This is a compatibility hack provided for Opera and Safari which
     * don't support ther Javascript 1.8.5 function.bind()
     */
     if (!Function.prototype.bind) {  
       Function.prototype.bind = function (oThis) {  
         if (typeof this !== "function") {  
           // closest thing possible to the ECMAScript 5 internal IsCallable function  
           if (console && console.log) {
             console.log('Function.prototype.bind - what is trying to be bound is not callable');
           }
         }  
       
         var aArgs = Array.prototype.slice.call(arguments, 1),   
             fToBind = this,   
             fNOP = function () {},  
             fBound = function () {  
               return fToBind.apply(this instanceof fNOP  
                                      ? this  
                                      : oThis || window,  
                                    aArgs.concat(Array.prototype.slice.call(arguments)));  
             };  
       
         fNOP.prototype = this.prototype;  
         fBound.prototype = new fNOP();  
       
         return fBound;  
       };  
     }
 
 
     /**
     * Rose chart explode
     * 
     * Explodes the Rose chart - gradually incrementing the size of the chart.explode property
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.Rose.Explode = function (obj)
     {
         var canvas   = obj.canvas;
         var opts     = arguments[1] ? arguments[1] : [];
         var callback = arguments[2] ? arguments[2] : null;
         var frames   = opts['frames'] ? opts['frames'] : 60;
 
         obj.Set('chart.exploded', 0);
 
         RGraph.Effects.Animate(obj, {'frames': frames, 'chart.exploded': Math.min(canvas.width, canvas.height)}, callback);
     }
 
 
     /**
     * Rose chart implode
     * 
     * Implodes the Rose chart - gradually decreasing the size of the chart.explode property. It starts at the largest of
     * the canvas width./height
     * 
     * @params object obj The graph object
     */
     RGraph.Effects.Rose.Implode = function (obj)
     {
         var canvas   = obj.canvas;
         var opts     = arguments[1] ? arguments[1] : [];
         var callback = arguments[2] ? arguments[2] : null;
         var frames   = opts['frames'] ? opts['frames'] : 60;
 
         obj.Set('chart.exploded', Math.min(canvas.width, canvas.height));
 
         RGraph.Effects.Animate(obj, {'frames': frames, 'chart.exploded': 0}, callback);
     }
 
 
 
     /**
     * Gauge Grow
     * 
     * This effect gradually increases the represented value
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.Thermometer.Grow = function (obj)
     {
         var callback  = arguments[2];
         var numFrames = 30;
         var origValue = Number(obj.currentValue);
 
         if (obj.currentValue == null) {
             obj.currentValue = 0
             origValue        = 0;
         }
 
         var newValue  = obj.value;
         var diff      = newValue - origValue;
         var step      = (diff / numFrames);
         var frame = 0;
 
         function Grow ()
         {
             frame++
             
             // Set the new value
             obj.value = v = ((frame / numFrames) * diff) + origValue
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (frame < 30) {
                 RGraph.Effects.UpdateCanvas(Grow);
             } else if (typeof(callback) == 'function') {
                 callback(obj);
             }
         }
 
         RGraph.Effects.UpdateCanvas(Grow);
     }
 
 
     /**
     * Trace
     * 
     * This effect is for the Scatter chart, uses the jQuery library and slowly
     * uncovers the Line/marks, but you can see the background of the chart.
     * 
     * @param object obj The graph object
     * @param object     Options - you can specify duration to set how long the effect lasts for
     */
     RGraph.Effects.Scatter.jQuery.Trace = function (obj)
     {
         var callback  = typeof(arguments[2]) == 'function' ? arguments[2] : function () {};
         var opt       = arguments[1] || [];
         
         if (!opt['duration']) {
             opt['duration'] = 1500;
         }
 
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
 
         /**
         * Create the DIV that the second canvas will sit in
         */
         var div = document.createElement('DIV');
             var xy = RGraph.getCanvasXY(obj.canvas);
             div.id = '__rgraph_trace_animation_' + RGraph.random(0, 4351623) + '__';
             div.style.left = xy[0] + 'px';
             div.style.top = xy[1] + 'px';
             div.style.width = obj.Get('chart.gutter.left');
             div.style.height = obj.canvas.height + 'px';
             div.style.position = 'absolute';
             div.style.overflow = 'hidden';
         document.body.appendChild(div);
         
         /**
         * Make the second canvas
         */
         var id      = '__rgraph_scatter_trace_animation_' + RGraph.random(0, 99999999) + '__';
         var canvas2 = document.createElement('CANVAS');
         canvas2.width = obj.canvas.width;
         canvas2.height = obj.canvas.height;
         canvas2.style.position = 'absolute';
         canvas2.style.left = 0;
         canvas2.style.top  = 0;
         
         // This stops the clear effect clearing the canvas - which can happen if you have multiple canvas tags on the page all with
         // dynamic effects that do redrawing
         canvas2.noclear = true;
 
         canvas2.id         = id;
         div.appendChild(canvas2);
 
         var reposition_canvas2 = function (e)
         {
 
             var xy = RGraph.getCanvasXY(obj.canvas);
             
             div.style.left = xy[0]   + 'px';
             div.style.top = xy[1] + 'px';
         }
         window.addEventListener('resize', reposition_canvas2, false)
 
         /**
         * Make a copy of the original Line object
         */
         var obj2 = new RGraph.Scatter(id, RGraph.array_clone(obj.data));
 
         // Remove the new line from the ObjectRegistry so that it isn't redawn
         RGraph.ObjectRegistry.Remove(obj2);
 
         for (i in obj.properties) {
             if (typeof(i) == 'string') {
                 obj2.Set(i, obj.properties[i]);
             }
         }
 
 
         obj2.Set('chart.labels', []);
         obj2.Set('chart.background.grid', false);
         obj2.Set('chart.background.barcolor1', 'rgba(0,0,0,0)');
         obj2.Set('chart.background.barcolor2', 'rgba(0,0,0,0)');
         obj2.Set('chart.ylabels', false);
         obj2.Set('chart.noaxes', true);
         obj2.Set('chart.title', '');
         obj2.Set('chart.title.xaxis', '');
         obj2.Set('chart.title.yaxis', '');
         obj.Set('chart.key', []);
         obj2.Draw();
 
 
         /**
         * This effectively hides the line
         */
         obj.Set('chart.line.visible', false);
 
 
         RGraph.Clear(obj.canvas);
         RGraph.RedrawCanvas(obj.canvas);
         
         /**
         * Place a DIV over the canvas to stop interaction with it
         */
             if (!obj.canvas.__rgraph_scatter_trace_cover__) {
             var div2 = document.createElement('DIV');
                 div2.id = '__rgraph_trace_animation_' + RGraph.random(0, 4351623) + '__';
                 div2.style.left = xy[0] + 'px';
                 div2.style.top = xy[1] + 'px';
                 div2.style.width = obj.canvas.width + 'px';
                 div2.style.height = obj.canvas.height + 'px';
                 div2.style.position = 'absolute';
                 div2.style.overflow = 'hidden';
                 div2.style.backgroundColor = 'rgba(0,0,0,0)';
                 div.div2 = div2;
                 obj.canvas.__rgraph_scatter_trace_cover__ = div2
             document.body.appendChild(div2);
         } else {
             div2 = obj.canvas.__rgraph_scatter_trace_cover__;
         }
 
         /**
         * Animate the DIV that contains the canvas
         */
         jQuery('#' + div.id).animate({
             width: obj.canvas.width + 'px'
         }, opt['duration'], function () {
 
             // Remove the window resize listener
             window.removeEventListener('resize', reposition_canvas2, false);
 
             div.style.display  = 'none';
             div2.style.display = 'none';
 
             //div.removeChild(canvas2);
             obj.Set('chart.line.visible', true);
 
             // Revert the colors back to what they were
             obj.Set('chart.colors', RGraph.array_clone(obj2.Get('chart.colors')));
             obj.Set('chart.key', RGraph.array_clone(obj2.Get('chart.key')));
 
             RGraph.RedrawCanvas(obj.canvas);
             
             obj.canvas.__rgraph_trace_cover__ = null;
 
             callback(obj);
         });
     }
 
 
 
     /**
     * CornerGauge Grow
     * 
     * This effect gradually increases the represented value
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.CornerGauge.Grow = function (obj)
     {
         var callback  = arguments[2];
         var numFrames = 30;
         var frame     = 0;
 
         // Single pointer
         if (typeof(obj.value) == 'number') {
 
             var origValue = Number(obj.currentValue);
             
             if (obj.currentValue == null) {
                 obj.currentValue = obj.min;
                 origValue = obj.min;
             }
     
             var newValue  = obj.value;
             var diff      = newValue - origValue;
             var step      = (diff / numFrames);
             var frame     = 0;
     
 
             function Grow_single ()
             {
                 frame++;
 
                 obj.value = ((frame / numFrames) * diff) + origValue
 
                 if (obj.value > obj.max) obj.value = obj.max;
                 if (obj.value < obj.min) obj.value = obj.min;
     
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
     
                 if (frame < 30) {
                     RGraph.Effects.UpdateCanvas(Grow_single);
                 } else if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
 
             Grow_single();
 
         // Multiple pointers
         } else {
 
             if (obj.currentValue == null) {
                 obj.currentValue = [];
                 
                 for (var i=0; i<obj.value.length; ++i) {
                     obj.currentValue[i] = obj.min;
                 }
                 
                 origValue = RGraph.array_clone(obj.currentValue);
             }
 
             var origValue = RGraph.array_clone(obj.currentValue);
             var newValue  = RGraph.array_clone(obj.value);
             var diff      = [];
             var step      = [];
             
             for (var i=0; i<newValue.length; ++i) {
                 diff[i] = newValue[i] - Number(obj.currentValue[i]);
                 step[i] = (diff[i] / numFrames);
             }
 
 
 
             function Grow_multiple ()
             {
                 frame++;
                 
                 for (var i=0; i<obj.value.length; ++i) {
                     
                     obj.value[i] = ((frame / numFrames) * diff[i]) + origValue[i];
 
                     if (obj.value[i] > obj.max) obj.value[i] = obj.max;
                     if (obj.value[i] < obj.min) obj.value[i] = obj.min;
         
                     RGraph.Clear(obj.canvas);
                     RGraph.RedrawCanvas(obj.canvas);
                     
                 }
     
                 if (frame < 30) {
                     RGraph.Effects.UpdateCanvas(Grow_multiple);
                 } else if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
     
             Grow_multiple();
         }
     }
 
 
 
     /**
     * Rose chart Grow
     * 
     * This effect gradually increases the size of the Rose chart
     * 
     * @param object   obj The chart object
     * @param              Not used - pass null
     * @param function     An optional callback function
     */
     RGraph.Effects.Rose.Grow = function (obj)
     {
         var callback  = arguments[2];
         var numFrames = 60;
         var frame     = 0;
 
 
         function Grow ()
         {
             frame++;
             
             obj.Set('chart.animation.grow.multiplier', frame / numFrames);
 
             RGraph.Clear(obj.canvas);
             RGraph.RedrawCanvas(obj.canvas);
 
             if (frame < numFrames) {
                 ++frame;
                 RGraph.Effects.UpdateCanvas(Grow);
             } else {
                 obj.Set('chart.animation.grow.multiplier', 1);
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 
                 if (typeof(callback) == 'function') {
                     callback(obj);
                 }
             }
         }
 
         RGraph.Effects.UpdateCanvas(Grow);
     }
 
 
 
     /**
     * Horizontal Scissors (open)
     * 
     * @param object   obj The graph object
     * @param @object      An array of options
     * @param function     Optional callback function
     * 
     */
     RGraph.Effects.jQuery.HScissors.Open = function (obj)
     {
         var canvas = obj.isRGraph ? obj.canvas : obj;;
         var id     = canvas.id;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var height = canvas.height / 5;
         
         /**
         * First draw the chart
         */
         RGraph.Clear(canvas);
         RGraph.RedrawCanvas(canvas);
 
         for (var i=0; i<5; ++i) {
             var div = document.getElementById(id + "scissors_" + i)
             if (!div) {
                 var div = document.createElement('DIV');
                     div.id = id + 'scissors_' + i;
                     div.style.width =  canvas.width + 'px';
                     div.style.height = height + 'px';
                     div.style.left   = xy[0] + 'px';
                     div.style.top   = (xy[1] + (canvas.height * (i / 5))) + 'px';
                     div.style.position = 'absolute';
                     div.style.backgroundColor = color;
                 document.body.appendChild(div);
             }
     
             if (i % 2 == 0) {
                 jQuery('#' + id + 'scissors_' + i).animate({left: canvas.width + 'px', width: 0}, delay);
             } else {
                 jQuery('#' + id + 'scissors_' + i).animate({width: 0}, delay);
             }
         }
 
         setTimeout(function () {document.body.removeChild(document.getElementById(id + 'scissors_0'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + 'scissors_1'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + 'scissors_2'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + 'scissors_3'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + 'scissors_4'));}, delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
 
     /**
     * Horizontal Scissors (Close)
     * 
     * @param object   obj The graph object
     * @param @object      An array of options
     * @param function     Optional callback function
     * 
     */
     RGraph.Effects.jQuery.HScissors.Close = function (obj)
     {
         var canvas = obj.isRGraph ? obj.canvas : obj;
         var id     = canvas.id;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var height = canvas.height / 5;
         
         /**
         * First draw the chart
         */
         RGraph.Clear(canvas);
         RGraph.RedrawCanvas(canvas);
 
         for (var i=0; i<5; ++i) {
             var div = document.createElement('DIV');
                 div.id             = id + '_scissors_' + i;
                 div.style.width    = 0;
                 div.style.height   = height + 'px';
                 div.style.left     = (i % 2 == 0 ? xy[0] + canvas.width : xy[0]) + 'px';
                 div.style.top      = (xy[1] + (canvas.height * (i / 5))) + 'px';
                 div.style.position = 'absolute';
                 div.style.backgroundColor = color;
             document.body.appendChild(div);
 
             if (i % 2 == 0) {
                 jQuery('#' + id + '_scissors_' + i).animate({left: xy[0] + 'px', width: canvas.width + 'px'}, delay);
             } else {
                 jQuery('#' + id + '_scissors_' + i).animate({width: canvas.width + 'px'}, delay);
             }
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
 
     /**
     * Vertical Scissors (open)
     * 
     * @param object   obj The graph object
     * @param @object      An array of options
     * @param function     Optional callback function
     * 
     */
     RGraph.Effects.jQuery.VScissors.Open = function (obj)
     {
         var canvas = obj.isRGraph ? obj.canvas : obj;;
         var id     = canvas.id;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var width = canvas.width / 5;
         
         /**
         * First draw the chart
         */
         RGraph.Clear(canvas);
         RGraph.RedrawCanvas(canvas);
 
         for (var i=0; i<5; ++i) {
             var div = document.getElementById(id + "_vscissors_" + i)
             if (!div) {
                 var div = document.createElement('DIV');
                     div.id = id + '_vscissors_' + i;
                     div.style.width =  width + 'px';
                     div.style.height = canvas.height + 'px';
                     div.style.left   = xy[0] + (canvas.width * (i / 5)) + 'px';
                     div.style.top   = xy[1] + 'px';
                     div.style.position = 'absolute';
                     div.style.backgroundColor = color;
                 document.body.appendChild(div);
             }
 
             if (i % 2 == 0) {
                 jQuery('#' + id + '_vscissors_' + i).animate({top: xy[1] + canvas.height + 'px', height: 0}, delay);
             } else {
                 jQuery('#' + id + '_vscissors_' + i).animate({height: 0}, delay);
             }
         }
 
         setTimeout(function () {document.body.removeChild(document.getElementById(id + '_vscissors_0'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + '_vscissors_1'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + '_vscissors_2'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + '_vscissors_3'));}, delay);
         setTimeout(function () {document.body.removeChild(document.getElementById(id + '_vscissors_4'));}, delay);
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * Vertical Scissors (close)
     * 
     * @param object   obj The graph object
     * @param @object      An array of options
     * @param function     Optional callback function
     * 
     */
     RGraph.Effects.jQuery.VScissors.Close = function (obj)
     {
         var canvas = obj.isRGraph ? obj.canvas : obj;
         var id     = canvas.id;
         var opts   = arguments[1] ? arguments[1] : [];
         var delay  = 1000;
         var color  = opts['color'] ? opts['color'] : 'white';
         var xy     = RGraph.getCanvasXY(canvas);
         var width  = canvas.width / 5;
         
         /**
         * First draw the chart
         */
         RGraph.Clear(canvas);
         RGraph.RedrawCanvas(canvas);
 
         for (var i=0; i<5; ++i) {
             var div = document.getElementById(id + "_vscissors_" + i)
             if (!div) {
                 var div                = document.createElement('DIV');
                     div.id             = id + '_vscissors_' + i;
                     div.style.width    =  width + 'px';
                     div.style.height   = 0;
                     div.style.left     = xy[0] + (width * i) + 'px';
                     div.style.top      = (i % 2 == 0 ? xy[1] + canvas.height : xy[1]) + 'px';
                     div.style.position = 'absolute';
                     div.style.backgroundColor = color;
                 document.body.appendChild(div);
             }
 
             if (i % 2 == 0) {
                 jQuery('#' + id + '_vscissors_' + i).animate({top: xy[1] + 'px', height: canvas.height + 'px'}, delay);
             } else {
                 jQuery('#' + id + '_vscissors_' + i).animate({height: canvas.height + 'px'}, delay);
             }
         }
         
         /**
         * Callback
         */
         if (typeof(arguments[2]) == 'function') {
             setTimeout(arguments[2], delay);
         }
     }
 
 
     /**
     * The effect that gradually fades in the colors
     * 
     * @param object obj The Bar chart object
     */
     RGraph.Effects.Bar.WaveFadeIn = function (obj)
     {
         var totalframes   = (arguments[1] && arguments[1].frames) ? arguments[1].frames : 30;
         
         for (var i=0; i<obj.data.length; ++i) {
         
             (function (idx)
             {
                 setTimeout(function () {Iterator(idx, totalframes);}, 50 * i)
             })(i);
         }
         
         function Iterator(idx, frames)
         {
             if (frames-- > 0) {
 
                 // Update the color
                 if (obj.properties['chart.colors'][idx].match(/^rgba\(([\d.]+),([\d.]+),([\d.]+),[\d.]+\)$/)) {
                     obj.properties['chart.colors'][idx] = 'rgba(' + RegExp.$1 + ',' + RegExp.$2 + ',' + RegExp.$3 + ',' + ((totalframes - frames) / totalframes) + ')';
                 }
 
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 RGraph.Effects.UpdateCanvas(function () {Iterator(idx, frames);});
             }
         }
     }
 
 
 
 
     /**
     * The effect that gradually fades out the colors
     * 
     * @param object obj The Bar chart object
     */
     RGraph.Effects.Bar.WaveFadeOut = function (obj)
     {
         var totalframes   = (arguments[1] && arguments[1].frames) ? arguments[1].frames : 30;
         
         for (var i=0; i<obj.data.length; ++i) {
         
             (function (idx)
             {
                 setTimeout(function () {Iterator(idx, totalframes);}, 50 * i)
             })(i);
         }
         
         function Iterator(idx, frames)
         {
             if (frames-- > 0) {
 
                 // Update the color
                 if (obj.properties['chart.colors'][idx].match(/^rgba\(([\d.]+),([\d.]+),([\d.]+),[\d.]+\)$/)) {
                     obj.properties['chart.colors'][idx] = 'rgba(' + RegExp.$1 + ',' + RegExp.$2 + ',' + RegExp.$3 + ',' + (1 - (((totalframes - frames) / totalframes) )) + ')';
                 }
 
                 RGraph.Clear(obj.canvas);
                 RGraph.RedrawCanvas(obj.canvas);
                 RGraph.Effects.UpdateCanvas(function () {Iterator(idx, frames);});
             }
         }
     }

    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */

     if (typeof(RGraph) == 'undefined') RGraph = {};

     /**
     * The scatter graph constructor
     * 
     * @param object canvas The cxanvas object
     * @param array  data   The chart data
     */
     RGraph.Scatter = function (id, data)
     {
         // Get the canvas and context objects
         this.id                = id;
         this.canvas            = document.getElementById(id);
         this.canvas.__object__ = this;
         this.context           = this.canvas.getContext ? this.canvas.getContext("2d") : null;
         this.max               = 0;
         this.coords            = [];
         this.data              = [];
         this.type              = 'scatter';
         this.isRGraph          = true;
         this.uid               = RGraph.CreateUID();
         this.canvas.uid        = this.canvas.uid ? this.canvas.uid : RGraph.CreateUID();
         this.colorsParsed      = false;
         this.coordsText        = [];
 
 
         /**
         * Compatibility with older browsers
         */
         RGraph.OldBrowserCompat(this.context);
 
 
         // Various config properties
         this.properties = {
             'chart.background.barcolor1':   'rgba(0,0,0,0)',
             'chart.background.barcolor2':   'rgba(0,0,0,0)',
             'chart.background.grid':        true,
             'chart.background.grid.width':  1,
             'chart.background.grid.color':  '#ddd',
             'chart.background.grid.hsize':  20,
             'chart.background.grid.vsize':  20,
             'chart.background.hbars':       null,
             'chart.background.vbars':       null,
             'chart.background.grid.vlines': true,
             'chart.background.grid.hlines': true,
             'chart.background.grid.border': true,
             'chart.background.grid.autofit':true,
             'chart.background.grid.autofit.numhlines': 5,
             'chart.background.grid.autofit.numvlines': 20,
             'chart.background.image':       null,
             'chart.background.image.stretch': true,
             'chart.background.image.x':     null,
             'chart.background.image.y':     null,
             'chart.background.image.w':     null,
             'chart.background.image.h':     null,
             'chart.background.image.align': null,
             'chart.text.size':              10,
             'chart.text.angle':             0,
             'chart.text.color':             'black',
             'chart.text.font':              'Arial',
             'chart.tooltips':               [], // Default must be an empty array
             'chart.tooltips.effect':         'fade',
             'chart.tooltips.event':          'onmousemove',
             'chart.tooltips.hotspot':        3,
             'chart.tooltips.css.class':      'RGraph_tooltip',
             'chart.tooltips.highlight':      true,
             'chart.tooltips.coords.page':   false,
             'chart.units.pre':              '',
             'chart.units.post':             '',
             'chart.numyticks':              10,
             'chart.tickmarks':              'cross',
             'chart.ticksize':               5,
             'chart.numxticks':              true,
             'chart.xaxis':                  true,
             'chart.gutter.left':            25,
             'chart.gutter.right':           25,
             'chart.gutter.top':             25,
             'chart.gutter.bottom':          25,
             'chart.xmin':                   0,
             'chart.xmax':                   0,
             'chart.ymax':                   null,
             'chart.ymin':                   0,
             'chart.scale.decimals':         null,
             'chart.scale.point':            '.',
             'chart.scale.thousand':         ',',
             'chart.title':                  '',
             'chart.title.background':       null,
             'chart.title.hpos':             null,
             'chart.title.vpos':             null,
             'chart.title.bold':             true,
             'chart.title.font':             null,
             'chart.title.xaxis':            '',
             'chart.title.xaxis.bold':       true,
             'chart.title.xaxis.size':       null,
             'chart.title.xaxis.font':       null,
             'chart.title.yaxis':            '',
             'chart.title.yaxis.bold':       true,
             'chart.title.yaxis.size':       null,
             'chart.title.yaxis.font':       null,
             'chart.title.yaxis.color':      null,
             'chart.title.xaxis.pos':        null,
             'chart.title.yaxis.pos':        null,
             'chart.title.x':                null,
             'chart.title.y':                null,
             'chart.title.halign':           null,
             'chart.title.valign':           null,
             'chart.labels':                 [],
             'chart.labels.ingraph':         null,
             'chart.labels.above':           false,
             'chart.labels.above.size':      8,
             'chart.labels.above.decimals':  0,
             'chart.ylabels':                true,
             'chart.ylabels.count':          5,
             'chart.ylabels.invert':         false,
             'chart.ylabels.specific':       null,
             'chart.ylabels.inside':         false,
             'chart.contextmenu':            null,
             'chart.defaultcolor':           'black',
             'chart.xaxispos':               'bottom',
             'chart.yaxispos':               'left',
             'chart.crosshairs':             false,
             'chart.crosshairs.color':       '#333',
             'chart.crosshairs.linewidth':   1,
             'chart.crosshairs.coords':      false,
             'chart.crosshairs.coords.fixed':true,
             'chart.crosshairs.coords.fadeout':false,
             'chart.crosshairs.coords.labels.x': 'X',
             'chart.crosshairs.coords.labels.y': 'Y',
             'chart.crosshairs.hline':       true,
             'chart.crosshairs.vline':       true,
             'chart.annotatable':            false,
             'chart.annotate.color':         'black',
             'chart.line':                   false,
             'chart.line.linewidth':         1,
             'chart.line.colors':            ['green', 'red'],
             'chart.line.shadow.color':      'rgba(0,0,0,0)',
             'chart.line.shadow.blur':       2,
             'chart.line.shadow.offsetx':    3,
             'chart.line.shadow.offsety':    3,
             'chart.line.stepped':           false,
             'chart.line.visible':           true,
             'chart.noaxes':                 false,
             'chart.noyaxis':                false,
             'chart.key':                    null,
             'chart.key.background':         'white',
             'chart.key.position':           'graph',
             'chart.key.halign':             'right',
             'chart.key.shadow':             false,
             'chart.key.shadow.color':       '#666',
             'chart.key.shadow.blur':        3,
             'chart.key.shadow.offsetx':     2,
             'chart.key.shadow.offsety':     2,
             'chart.key.position.gutter.boxed': false,
             'chart.key.position.x':         null,
             'chart.key.position.y':         null,
             
             'chart.key.interactive': false,
             'chart.key.interactive.highlight.chart.fill': 'rgba(255,0,0,0.9)',
             'chart.key.interactive.highlight.label': 'rgba(255,0,0,0.2)',
             
             'chart.key.color.shape':        'square',
             'chart.key.rounded':            true,
             'chart.key.linewidth':          1,
             'chart.key.colors':             null,
             'chart.axis.color':             'black',
             'chart.zoom.factor':            1.5,
             'chart.zoom.fade.in':           true,
             'chart.zoom.fade.out':          true,
             'chart.zoom.hdir':              'right',
             'chart.zoom.vdir':              'down',
             'chart.zoom.frames':            25,
             'chart.zoom.delay':             16.666,
             'chart.zoom.shadow':            true,
             'chart.zoom.background':        true,
             'chart.zoom.action':            'zoom',
             'chart.boxplot.width':          1,
             'chart.boxplot.capped':         true,
             'chart.resizable':              false,
             'chart.resize.handle.background': null,
             'chart.xmin':                   0,
             'chart.labels.specific.align':  'left',
             'chart.xscale':                 false,
             'chart.xscale.units.pre':       '',
             'chart.xscale.units.post':      '',
             'chart.xscale.numlabels':       10,
             'chart.xscale.formatter':       null,
             'chart.xscale.decimals':        0,
             'chart.xscale.thousand':        ',',
             'chart.xscale.point':           '.',
             'chart.noendxtick':             false,
             'chart.noendytick':             true,
             'chart.events.mousemove':       null,
             'chart.events.click':           null,
             'chart.highlight.stroke':       'rgba(0,0,0,0)',
             'chart.highlight.fill':         'rgba(255,255,255,0.7)'
         }
 
         // Handle multiple datasets being given as one argument
         if (arguments[1][0] && arguments[1][0][0] && typeof(arguments[1][0][0]) == 'object') {
             // Store the data set(s)
             for (var i=0; i<arguments[1].length; ++i) {
                 this.data[i] = arguments[1][i];
             }
 
         // Handle multiple data sets being supplied as seperate arguments
         } else {
             // Store the data set(s)
             for (var i=1; i<arguments.length; ++i) {
                 this.data[i - 1] = arguments[i];
             }
         }
 
         /**
         * This allows the data points to be given as dates as well as numbers. Formats supported by Date.parse() are accepted.
         */
         for (var i=0; i<this.data.length; ++i) {
             for (var j=0; j<this.data[i].length; ++j) {
                  if (typeof(this.data[i][j][0]) == 'string') {
                     this.data[i][j][0] = Date.parse(this.data[i][j][0]);
                  }
             }
         }
 
 
         /**
         * Now make the data_arr array - all the data as one big array
         */
         this.data_arr = [];
 
         for (var i=0; i<this.data.length; ++i) {
             for (var j=0; j<this.data[i].length; ++j) {
                 this.data_arr.push(this.data[i][j]);
             }
         }
 
         // Create the $ objects so that they can be used
         for (var i=0; i<this.data_arr.length; ++i) {
             this['$' + i] = {}
         }
 
 
         // Check for support
         if (!this.canvas) {
             alert('[SCATTER] No canvas support');
             return;
         }
 
 
         /**
         * Translate half a pixel for antialiasing purposes - but only if it hasn't beeen
         * done already
         */
         if (!this.canvas.__rgraph_aa_translated__) {
             this.context.translate(0.5,0.5);
             this.canvas.__rgraph_aa_translated__ = true;
         }
 
 
 
 
         ///////////////////////////////// SHORT PROPERTIES /////////////////////////////////
 
 
 
 
         var RG   = RGraph;
         var ca   = this.canvas;
         var co   = ca.getContext('2d');
         var prop = this.properties;
 
 
 
 
         //////////////////////////////////// METHODS ///////////////////////////////////////
 
 
 
 
 
 
 
         /**
         * A simple setter
         * 
         * @param string name  The name of the property to set
         * @param string value The value of the property
         */
         this.Set = function (name, value)
         {
             /**
             * This should be done first - prepend the propertyy name with "chart." if necessary
             */
             if (name.substr(0,6) != 'chart.') {
                 name = 'chart.' + name;
             }
     
             /**
             * BC for chart.xticks
             */
             if (name == 'chart.xticks') {
                 name == 'chart.numxticks';
             }
     
             /**
             * This is here because the key expects a name of "chart.colors"
             */
             if (name == 'chart.line.colors') {
                 prop['chart.colors'] = value;
             }
             
             /**
             * Allow compatibility with older property names
             */
             if (name == 'chart.tooltip.hotspot') {
                 name = 'chart.tooltips.hotspot';
             }
             
             /**
             * chart.yaxispos should be left or right
             */
             /**
             if (name == 'chart.yaxispos' && value != 'left' && value != 'right') {
                 alert("[SCATTER] chart.yaxispos should be left or right. You've set it to: '" + value + "' Changing it to left");
                 value = 'left';
             }
             */
 
             // Changed by Paul Secular - added a 'middle' setting
             if (name == 'chart.yaxispos' && value != 'left' && value != 'right' && value != 'middle') {
                 alert("[SCATTER] chart.yaxispos should be left, right or middle. You've set it to: '" + value + "' Changing it to left");
                 value = 'left';
             }
 
             /**
             * Check for xaxispos
             */
             if (name == 'chart.xaxispos' ) {
                 if (value != 'bottom' && value != 'center') {
                     alert('[SCATTER] (' + this.id + ') chart.xaxispos should be center or bottom. Tried to set it to: ' + value + ' Changing it to center');
                     value = 'center';
                 }
             }
     
             prop[name.toLowerCase()] = value;
     
             return this;
         }
 
 
 
 
         /**
         * A simple getter
         * 
         * @param string name  The name of the property to set
         */
         this.Get = function (name)
         {
             /**
             * This should be done first - prepend the property name with "chart." if necessary
             */
             if (name.substr(0,6) != 'chart.') {
                 name = 'chart.' + name;
             }
     
             return prop[name];
         }
 
 
 
 
 
         /**
         * ADDED BY: Paul Secular; 29-03-2014
         * New function to just draw the line chart data: PlotData()
         * PlotData is basically based on the Draw method but has less functionality
         */
         this.PlotData = function (dataset) {
 
             /**
             * Fire the onbeforedraw event
             */
             RG.FireCustomEvent(this, 'onbeforedraw');
 
             /**
             * Parse the colors. This allows for simple gradient syntax
             */
             if (!this.colorsParsed) {
                 this.parseColors();
 
                 // Don't want to do this again
                 this.colorsParsed = true;
             }
 
             /**
             * This is new in May 2011 and facilitates indiviual gutter settings,
             * eg chart.gutter.left
             */
             this.gutterLeft = prop['chart.gutter.left'];
             this.gutterRight = prop['chart.gutter.right'];
             this.gutterTop = prop['chart.gutter.top'];
             this.gutterBottom = prop['chart.gutter.bottom'];
 
             // Reset the coords array
             this.coords = [];
 
             //// Reset the maximum value
             //this.max = 0;
 
             //// Work out the maximum Y value
             //if (prop['chart.ymax'] && prop['chart.ymax'] > 0) {
             //    if (typeof (prop['chart.ymax']) == 'number') {
 
             //        this.max = prop['chart.ymax'];
             //        this.min = prop['chart.ymin'] ? prop['chart.ymin'] : 0;
 
             //    } else {
 
             //        var i = 0;
             //        var j = 0;
 
             //        for (i = 0; i < this.data.length; ++i) {
             //            for (j = 0; j < this.data[i].length; ++j) {
             //                if (this.data[i][j][1] != null) {
             //                    this.max = Math.max(this.max, typeof (this.data[i][j][1]) == 'object' ? RG.array_max(this.data[i][j][1]) : Math.abs(this.data[i][j][1]));
             //                }
             //            }
             //        }
 
             //        this.min = prop['chart.ymin'] ? prop['chart.ymin'] : 0;
             //    }
             //}
 
             //this.grapharea = ca.height - this.gutterTop - this.gutterBottom;
 
 
             // Progressively Draw the chart
 
             if (arguments.length === 0) {
                 // no data set was specified, so plot points for ALL data sets
                 i = 0;
                 for (i = 0; i < this.data.length; ++i) {
                     this.DrawMarks(i);
                     this.DrawLine(i);
 
                     // Turn the shadow off
                     RG.NoShadow(this);
                 }
             }
             else {
                 // just plot the points belonging to the one specified data set
                 this.DrawMarks(dataset);
                 this.DrawLine(dataset);
 
                 // Turn the shadow off
                 RG.NoShadow(this);
             };
 
             /**
             * This function enables resizing
             */
             if (prop['chart.resizable']) {
                 RG.AllowResizing(this);
             }
 
             /**
             * This installs the event listeners
             */
             RG.InstallEventListeners(this);
 
             /**
             * Fire the RGraph ondraw event
             */
             RG.FireCustomEvent(this, 'ondraw');
 
             return this;
         }
 
 
 
         /**
         * The function you call to draw the line chart
         */
         this.Draw = function ()
         {
             // MUST be the first thing done!
             if (typeof(prop['chart.background.image']) == 'string') {
                 RG.DrawBackgroundImage(this);
             }
     
     
             /**
             * Fire the onbeforedraw event
             */
             RG.FireCustomEvent(this, 'onbeforedraw');
     
     
             /**
             * Parse the colors. This allows for simple gradient syntax
             */
             if (!this.colorsParsed) {
                 this.parseColors();
                 
                 // Don't want to do this again
                 this.colorsParsed = true;
             }
     
             
             /**
             * This is new in May 2011 and facilitates indiviual gutter settings,
             * eg chart.gutter.left
             */
             this.gutterLeft   = prop['chart.gutter.left'];
             this.gutterRight  = prop['chart.gutter.right'];
             this.gutterTop    = prop['chart.gutter.top'];
             this.gutterBottom = prop['chart.gutter.bottom'];
     
             // Go through all the data points and see if a tooltip has been given
             this.hasTooltips = false;
             var overHotspot  = false;
     
             // Reset the coords array
             this.coords = [];
     
             /**
             * This facilitates the xmax, xmin and X values being dates
             */
             if (typeof(prop['chart.xmin']) == 'string') prop['chart.xmin'] = Date.parse(prop['chart.xmin']);
             if (typeof(prop['chart.xmax']) == 'string') prop['chart.xmax'] = Date.parse(prop['chart.xmax']);
     
     
             /**
             * Look for tooltips and populate chart.tooltips
             * 
             * NB 26/01/2011 Updated so that chart.tooltips is ALWAYS populated
             */
             if (!ISOLD) {
                 this.Set('chart.tooltips', []);
                 for (var i=0; i<this.data.length; ++i) {
                     for (var j =0;j<this.data[i].length; ++j) {
     
                         if (this.data[i][j] && this.data[i][j][3]) {
                             prop['chart.tooltips'].push(this.data[i][j][3]);
                             this.hasTooltips = true;
                         } else {
                             prop['chart.tooltips'].push(null);
                         }
                     }
                 }
             }
     
             // Reset the maximum value
             this.max = 0;
     
             // Work out the maximum Y value
             //if (prop['chart.ymax'] && prop['chart.ymax'] > 0) {
             if (typeof(prop['chart.ymax']) == 'number') {
     
                 this.max   = prop['chart.ymax'];
                 this.min   = prop['chart.ymin'] ? prop['chart.ymin'] : 0;
     
     
                 this.scale2 = RG.getScale2(this, {
                                                     'max':this.max,
                                                     'min':this.min,
                                                     'strict':true,
                                                     'scale.thousand':prop['chart.scale.thousand'],
                                                     'scale.point':prop['chart.scale.point'],
                                                     'scale.decimals':prop['chart.scale.decimals'],
                                                     'ylabels.count':prop['chart.ylabels.count'],
                                                     'scale.round':prop['chart.scale.round'],
                                                     'units.pre': prop['chart.units.pre'],
                                                     'units.post': prop['chart.units.post']
                                                    });
                 
                 this.max = this.scale2.max;
                 this.min = this.scale2.min;
                 var decimals = prop['chart.scale.decimals'];
     
             } else {
     
                 var i = 0;
                 var j = 0;
     
                 for (i=0; i<this.data.length; ++i) {
                     for (j=0; j<this.data[i].length; ++j) {
                         if (this.data[i][j][1] != null) {
                             this.max = Math.max(this.max, typeof(this.data[i][j][1]) == 'object' ? RG.array_max(this.data[i][j][1]) : Math.abs(this.data[i][j][1]));
                         }
                     }
                 }
     
                 this.min   = prop['chart.ymin'] ? prop['chart.ymin'] : 0;
 
                 this.scale2 = RG.getScale2(this, {
                                                     'max':this.max,
                                                     'min':this.min,
                                                     'scale.thousand':prop['chart.scale.thousand'],
                                                     'scale.point':prop['chart.scale.point'],
                                                     'scale.decimals':prop['chart.scale.decimals'],
                                                     'ylabels.count':prop['chart.ylabels.count'],
                                                     'scale.round':prop['chart.scale.round'],
                                                     'units.pre': prop['chart.units.pre'],
                                                     'units.post': prop['chart.units.post']
                                                    });
 
                 this.max = this.scale2.max;
                 this.min = this.scale2.min;
             }
     
             this.grapharea = ca.height - this.gutterTop - this.gutterBottom;
     
     
     
             // Progressively Draw the chart
             RG.background.Draw(this);
     
             /**
             * Draw any horizontal bars that have been specified
             */
             if (prop['chart.background.hbars'] && prop['chart.background.hbars'].length) {
                 RG.DrawBars(this);
             }
     
             /**
             * Draw any vertical bars that have been specified
             */
             if (prop['chart.background.vbars'] && prop['chart.background.vbars'].length) {
                 this.DrawVBars();
             }
     
             if (!prop['chart.noaxes']) {
                 this.DrawAxes();
             }
     
             this.DrawLabels();
     
             i = 0;
             for(i=0; i<this.data.length; ++i) {
                 this.DrawMarks(i);
     
                 // Set the shadow
                 co.shadowColor   = prop['chart.line.shadow.color'];
                 co.shadowOffsetX = prop['chart.line.shadow.offsetx'];
                 co.shadowOffsetY = prop['chart.line.shadow.offsety'];
                 co.shadowBlur    = prop['chart.line.shadow.blur'];
                 
                 this.DrawLine(i);
     
                 // Turn the shadow off
                 RG.NoShadow(this);
             }
     
     
             if (prop['chart.line']) {
                 for (var i=0;i<this.data.length; ++i) {
                     this.DrawMarks(i); // Call this again so the tickmarks appear over the line
                 }
             }
     
     
     
             /**
             * Setup the context menu if required
             */
             if (prop['chart.contextmenu']) {
                 RG.ShowContext(this);
             }
     
             
             
             /**
             * Draw the key if necessary
             */
             if (prop['chart.key'] && prop['chart.key'].length) {
                 RG.DrawKey(this, prop['chart.key'], prop['chart.line.colors']);
             }
     
     
             /**
             * Draw " above" labels if enabled
             */
             if (prop['chart.labels.above']) {
                 this.DrawAboveLabels();
             }
     
             /**
             * Draw the "in graph" labels, using the member function, NOT the shared function in RGraph.common.core.js
             */
             this.DrawInGraphLabels(this);
     
             
             /**
             * This function enables resizing
             */
             if (prop['chart.resizable']) {
                 RG.AllowResizing(this);
             }
     
     
             /**
             * This installs the event listeners
             */
             RG.InstallEventListeners(this);
             
             /**
             * Fire the RGraph ondraw event
             */
             RG.FireCustomEvent(this, 'ondraw');
             
             return this;
         }
 
 
 
 
         /**
         * Draws the axes of the scatter graph
         */
         this.DrawAxes = function ()
         {
             var graphHeight = ca.height - this.gutterTop - this.gutterBottom;
     
             co.beginPath();
             co.strokeStyle = prop['chart.axis.color'];
             co.lineWidth   = (prop['chart.axis.linewidth'] || 1) + 0.001;
 
             // Draw the Y axis
             if (prop['chart.noyaxis'] == false) {
                 if (prop['chart.yaxispos'] == 'left') {
                     co.moveTo(this.gutterLeft, this.gutterTop);
                     co.lineTo(this.gutterLeft, ca.height - this.gutterBottom);
                 } else if (prop['chart.yaxispos'] == 'middle') { // Modified by Paul Secular - added 'middle' position option for y axis
                     co.moveTo((ca.width - this.gutterRight - this.gutterLeft) / 2 + this.gutterLeft, this.gutterTop);
                     co.lineTo((ca.width - this.gutterRight - this.gutterLeft) / 2 + this.gutterLeft, ca.height - this.gutterBottom);
                 } else {
                     co.moveTo(ca.width - this.gutterRight, this.gutterTop);
                     co.lineTo(ca.width - this.gutterRight, ca.height - this.gutterBottom);
                 }
         }
     
     
             // Draw the X axis
             if (prop['chart.xaxis']) {
                 if (prop['chart.xaxispos'] == 'center') {
 
                     // modified by Paul Secular
 //                    co.moveTo(this.gutterLeft, Math.round(this.gutterTop + ((ca.height - this.gutterTop - this.gutterBottom) / 2)));
 //                    co.lineTo(ca.width - this.gutterRight, Math.round(this.gutterTop + ((ca.height - this.gutterTop - this.gutterBottom) / 2)));
                     co.moveTo(this.gutterLeft - 1, Math.round(this.gutterTop + ((ca.height - this.gutterTop - this.gutterBottom) / 2)));
                     co.lineTo(ca.width - this.gutterRight + 1, Math.round(this.gutterTop + ((ca.height - this.gutterTop - this.gutterBottom) / 2)));
 
                 } else {
 
                     // modified by Paul Secular
 //                    co.moveTo(this.gutterLeft, ca.height - this.gutterBottom);
 //                    co.lineTo(ca.width - this.gutterRight, ca.height - this.gutterBottom);
                     co.moveTo(this.gutterLeft - 1, ca.height - this.gutterBottom);
                     co.lineTo(ca.width - this.gutterRight + 1, ca.height - this.gutterBottom);
 
                 }
             }
     
             // Draw the Y tickmarks
             if (prop['chart.noyaxis'] == false) {
                 var numyticks = prop['chart.numyticks'];
         
                 //for (y=this.gutterTop; y < ca.height - this.gutterBottom + (prop['chart.xaxispos'] == 'center' ? 1 : 0) ; y+=(graphHeight / numyticks)) {
                 for (i=0; i<numyticks; ++i) {
         
                     var y = ((ca.height - this.gutterTop - this.gutterBottom) / numyticks) * i;
                         y = y + this.gutterTop;
                     
                     if (prop['chart.xaxispos'] == 'center' && i == (numyticks / 2)) {
                         continue;
                     }
         
                     if (prop['chart.yaxispos'] == 'left') {
                         co.moveTo(this.gutterLeft, Math.round(y));
                         co.lineTo(this.gutterLeft - 3, Math.round(y));
                     } else if (prop['chart.yaxispos'] == 'middle') { // Modified by Paul Secular - added 'middle' position option for y axis
                         co.moveTo((ca.width - this.gutterRight - this.gutterLeft) / 2 + this.gutterLeft, Math.round(y));
                         co.lineTo((ca.width - this.gutterRight - this.gutterLeft) / 2 + this.gutterLeft - 3, Math.round(y));
                     } else {
                         co.moveTo(ca.width - this.gutterRight +3, Math.round(y));
                         co.lineTo(ca.width - this.gutterRight, Math.round(y));
                     }
                 }
                 
                 /**
                 * Draw the end Y tickmark if the X axis is in the centre
                 */
                 if (prop['chart.numyticks'] > 0) {
                     if (prop['chart.xaxispos'] == 'center' && prop['chart.yaxispos'] == 'left') {
                         co.moveTo(this.gutterLeft, Math.round(ca.height - this.gutterBottom));
                         co.lineTo(this.gutterLeft - 3, Math.round(ca.height - this.gutterBottom));
                     } else if (prop['chart.xaxispos'] == 'center') {
                         co.moveTo(ca.width - this.gutterRight + 3, Math.round(ca.height - this.gutterBottom));
                         co.lineTo(ca.width - this.gutterRight, Math.round(ca.height - this.gutterBottom));
                     }
                 }
     
                 /**
                 * Draw an extra tick if the X axis isn't being shown
                 */
                 /**
                 if (prop['chart.xaxis'] == false && prop['chart.yaxispos'] == 'left') {
                     co.moveTo(this.gutterLeft, Math.round(ca.height - this.gutterBottom));
                     co.lineTo(this.gutterLeft - 3, Math.round(ca.height - this.gutterBottom));
                 } else if (prop['chart.xaxis'] == false && prop['chart.yaxispos'] == 'right') {
                     co.moveTo(ca.width - this.gutterRight, Math.round(ca.height - this.gutterBottom));
                     co.lineTo(ca.width - this.gutterRight + 3, Math.round(ca.height - this.gutterBottom));
                 }
                 */
                 // Modified by Paul Secular - always draw the extra tick
                 if (prop['chart.yaxispos'] == 'left') {
                     co.moveTo(this.gutterLeft, Math.round(ca.height - this.gutterBottom));
                     co.lineTo(this.gutterLeft - 3, Math.round(ca.height - this.gutterBottom));
                 } else if (prop['chart.yaxispos'] == 'right') {
                     co.moveTo(ca.width - this.gutterRight, Math.round(ca.height - this.gutterBottom));
                     co.lineTo(ca.width - this.gutterRight + 3, Math.round(ca.height - this.gutterBottom));
                 }
             }
     
     
             /**
             * Draw the X tickmarks
             */
             if (prop['chart.numxticks'] > 0 && prop['chart.xaxis']) {
                 
                 var x  = 0;
                 var y  =  (prop['chart.xaxispos'] == 'center') ? this.gutterTop + (this.grapharea / 2) : (ca.height - this.gutterBottom);
                 this.xTickGap = (prop['chart.labels'] && prop['chart.labels'].length) ? ((ca.width - this.gutterLeft - this.gutterRight ) / prop['chart.labels'].length) : (ca.width - this.gutterLeft - this.gutterRight) / 10;
     
                 /**
                 * This allows the number of X tickmarks to be specified
                 */
                 if (typeof(prop['chart.numxticks']) == 'number') {
                     this.xTickGap = (ca.width - this.gutterLeft - this.gutterRight) / (prop['chart.numxticks']);
                 }
     
     
                 for (x=(this.gutterLeft); // Modified by Paul Secular - Always draw the leftmost tick
                      x <= (ca.width - this.gutterRight + 1) ;  // Modified by Paul Secular - Always draw the rightmost tick
 
                 x += this.xTickGap) {
 
 
 
     
                     if (prop['chart.yaxispos'] == 'left' && prop['chart.noendxtick'] == true && x == (ca.width - this.gutterRight) ) {
                         continue;
                     } else if (prop['chart.yaxispos'] == 'right' && prop['chart.noendxtick'] == true && x == this.gutterLeft) {
                         continue;
                     }
     
                     co.moveTo(Math.round(x), y - (prop['chart.xaxispos'] == 'center' ? 3 : 0));
                     co.lineTo(Math.round(x), y + 3);
                 }
 
 
             }
     
             co.stroke();
             
             /**
             * Reset the linewidth back to one
             */
             co.lineWidth = 1;
         }
     
     
     
         /**
         * Draws the labels on the scatter graph
         */
         this.DrawLabels = function ()
         {
             co.fillStyle   = prop['chart.text.color'];
             var font       = prop['chart.text.font'];
             var xMin       = prop['chart.xmin'];
             var xMax       = prop['chart.xmax'];
             var yMax       = this.scale2.max;
             var yMin       = prop['chart.ymin'] ? prop['chart.ymin'] : 0;
             var text_size  = prop['chart.text.size'];
             var units_pre  = prop['chart.units.pre'];
             var units_post = prop['chart.units.post'];
             var numYLabels = prop['chart.ylabels.count'];
             var invert     = prop['chart.ylabels.invert'];
             var inside     = prop['chart.ylabels.inside'];
             var context    = co;
             var canvas     = ca;
             var boxed      = false;
     
             this.halfTextHeight = text_size / 2;
     
     
             this.halfGraphHeight = (ca.height - this.gutterTop - this.gutterBottom) / 2;
     
             /**
             * Draw the Y yaxis labels, be it at the top or center
             */
             if (prop['chart.ylabels']) {
     
                 // Modified by Paul Secular - added 'middle' option
 //                var xPos  = prop['chart.yaxispos'] == 'left' ? this.gutterLeft - 5 : ca.width - this.gutterRight + 5;
                 if (prop['chart.yaxispos'] == 'left') {
                     var xPos = this.gutterLeft - 5;
                 } else if (prop['chart.yaxispos'] == 'middle') {
                     var xPos = ((ca.width - this.gutterLeft - this.gutterRight) / 2) + this.gutterLeft - 5;
                 } else {
                     var xPos = ca.width - this.gutterRight + 5;
                 };
 
 
                 var align = prop['chart.yaxispos'] == 'right' ? 'left' : 'right';
                 
                 /**
                 * Now change the two things above if chart.ylabels.inside is specified
                 */
                 if (inside) {
                     if (prop['chart.yaxispos'] == 'left') {
                         xPos  = prop['chart.gutter.left'] + 5;
                         align = 'left';
                         boxed = true;
                     } else {
                         xPos  = ca.width - prop['chart.gutter.right'] - 5;
                         align = 'right';
                         boxed = true;
                     }
                 }
     
                 if (prop['chart.xaxispos'] == 'center') {
     
     
                     /**
                     * Specific Y labels
                     */
                     if (typeof(prop['chart.ylabels.specific']) == 'object' && prop['chart.ylabels.specific'] != null && prop['chart.ylabels.specific'].length) {
     
                         var labels = prop['chart.ylabels.specific'];
                         
                         if (prop['chart.ymin'] > 0) {
                             labels = [];
                             for (var i=0; i<(prop['chart.ylabels.specific'].length - 1); ++i) {
                                 labels.push(prop['chart.ylabels.specific'][i]);
                             }
                         }
     
                         for (var i=0; i<labels.length; ++i) {
                             var y = this.gutterTop + (i * (this.grapharea / (labels.length * 2) ) );
                             RG.Text2(this, {'font':font,
                                                 'size':text_size,
                                                 'x':xPos,
                                                 'y':y,
                                                 'text':labels[i],
                                                 'valign':'center',
                                                 'halign':align,
                                                 'bounding':boxed,
                                                 'tag': 'labels.specific'
                                                });
                         }
                         
                         var reversed_labels = RG.array_reverse(labels);
                     
                         for (var i=0; i<reversed_labels.length; ++i) {
                             var y = this.gutterTop + (this.grapharea / 2) + ((i+1) * (this.grapharea / (labels.length * 2) ) );
                             RG.Text2(this, {'font':font,
                                                 'size':text_size,
                                                 'x':xPos,
                                                 'y':y,
                                                 'text':reversed_labels[i],
                                                 'valign':'center',
                                                 'halign':align,
                                                 'bounding':boxed,
                                                 'tag': 'labels.specific'
                                                });
                         }
                         
                         /**
                         * Draw the center label if chart.ymin is specified
                         */
                         if (prop['chart.ymin'] != 0) {
                             RG.Text2(this, {'font':font,
                                                 'size':text_size,
                                                 'x':xPos,
                                                 'y':(this.grapharea / 2) + this.gutterTop,
                                                 'text':prop['chart.ylabels.specific'][prop['chart.ylabels.specific'].length - 1],
                                                 'valign':'center',
                                                 'halign':align,
                                                 'bounding':boxed,
                                                 'tag': 'labels.specific'
                                                });
                         }
                     }
     
     
                     if (!prop['chart.ylabels.specific'] && typeof(numYLabels) == 'number') {
                         
                         /**
                         * Draw the top half 
                         */
                         for (var i=0; i<this.scale2.labels.length; ++i) {
     
                             //var value = ((this.max - this.min)/ numYLabels) * (i+1);
                             //value  = (invert ? this.max - value : value);
                             //if (!invert) value += this.min;
                             //value = value.toFixed(prop['chart.scale.decimals']);
                         
                             if (!invert) { 
                                 RG.Text2(this, {'font':font,
                                                     'size': text_size,
                                                     'x': xPos,
                                                     'y': this.gutterTop + this.halfGraphHeight - (((i + 1)/numYLabels) * this.halfGraphHeight),
                                                     'valign': 'center',
                                                     'halign':align,
                                                     'bounding': boxed,
                                                     'boundingFill': 'white',
                                                     'text': this.scale2.labels[i],
                                                     'tag': 'scale'
                                                    });
                             } else {
                                 RG.Text2(this, {'font':font,
                                                     'size': text_size,
                                                     'x': xPos,
                                                     'y': this.gutterTop + this.halfGraphHeight - ((i/numYLabels) * this.halfGraphHeight),
                                                     'valign': 'center',
                                                     'halign':align,
                                                     'bounding': boxed,
                                                     'boundingFill': 'white',
                                                     'text': this.scale2.labels[this.scale2.labels.length - (i + 1)],
                                                     'tag': 'scale'
                                                    });
                             }
                         }
     
                         /**
                         * Draw the bottom half
                         */
                         for (var i=0; i<this.scale2.labels.length; ++i) {
                         
                             //var value = (((this.max - this.min)/ numYLabels) * i) + this.min;
                             //    value = (invert ? value : this.max - (value - this.min)).toFixed(prop['chart.scale.decimals']);
     
                             if (!invert) {
                                 RG.Text2(this, {'font':font,
                                                     'size': text_size,
                                                     'x': xPos,
                                                     'y': this.gutterTop + this.halfGraphHeight + this.halfGraphHeight - ((i/numYLabels) * this.halfGraphHeight),
                                                     'valign': 'center',
                                                     'halign':align,
                                                     'bounding': boxed,
                                                     'boundingFill': 'white',
                                                     'text': '-' + this.scale2.labels[this.scale2.labels.length - (i+1)],
                                                     'tag': 'scale'
                                                    });
                             } else {
                             
                                 // This ensures that the center label isn't drawn twice
                                 if (i == (this.scale2.labels.length - 1)&& invert) {
                                     continue;
                                 }
     
                                 RG.Text2(this, {'font':font,
                                                     'size': text_size,
                                                     'x': xPos,
                                                     'y': this.gutterTop + this.halfGraphHeight + this.halfGraphHeight - (((i + 1)/numYLabels) * this.halfGraphHeight),
                                                     'valign': 'center',
                                                     'halign':align,
                                                     'bounding': boxed,
                                                     'boundingFill': 'white',
                                                     'text': '-' + this.scale2.labels[i],
                                                     'tag': 'scale'
                                                    });
                             }
                         }
     
     
     
                         
                         // If ymin is specified draw that
                         if (!invert && yMin > 0) {
                             RG.Text2(this, {'font':font,
                                                 'size': text_size,
                                                 'x': xPos,
                                                 'y': this.gutterTop + this.halfGraphHeight,
                                                 'valign': 'center',
                                                 'halign':align,
                                                 'bounding': boxed,
                                                 'boundingFill': 'white',
                                                 'text': RG.number_format(this, yMin.toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                 'tag': 'scale'
                                                });
                         }
                         
                         if (invert) {
                             RG.Text2(this, {'font':font,
                                                 'size': text_size,
                                                 'x': xPos,
                                                 'y': this.gutterTop,
                                                 'valign': 'center',
                                                 'halign':align,
                                                 'bounding': boxed,
                                                 'boundingFill': 'white',
                                                 'text': RG.number_format(this, yMin.toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                 'tag': 'scale'
                                                });
                             RG.Text2(this, {'font':font,
                                                 'size': text_size,
                                                 'x': xPos,
                                                 'y': this.gutterTop + (this.halfGraphHeight * 2),
                                                 'valign': 'center',
                                                 'halign':align,
                                                 'bounding': boxed,
                                                 'boundingFill': 'white',
                                                 'text': RG.number_format(this, yMin.toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                 'tag': 'scale'
                                                });
                         }
                     }
         
                 // X axis at the bottom
                 } else {
                     
                     // Modified by Paul Secular - added 'middle' option
                     if (prop['chart.yaxispos'] == 'left') {
                         var xPos = this.gutterLeft - 5;
                     } else if (prop['chart.yaxispos'] == 'middle') {
                         var xPos = ((ca.width - this.gutterLeft - this.gutterRight) / 2) + this.gutterLeft - 5;
                     } else {
                         var xPos = ca.width - this.gutterRight + 5;
                     };
 
                     var align = prop['chart.yaxispos'] == 'right' ? 'left' : 'right';
     
                     if (inside) {
                         if (prop['chart.yaxispos'] == 'left') {
                             xPos  = prop['chart.gutter.left'] + 5;
                             align = 'left';
                             boxed = true;
                         } else {
                             xPos  = ca.width - obj.gutterRight - 5;
                             align = 'right';
                             boxed = true;
                         }
                     }
     
                     /**
                     * Specific Y labels
                     */
                     if (typeof(prop['chart.ylabels.specific']) == 'object' && prop['chart.ylabels.specific']) {
     
                         var labels = prop['chart.ylabels.specific'];
                         
                         // Lose the last label
                         if (prop['chart.ymin'] > 9999) {
                             labels = [];
                             for (var i=0; i<(prop['chart.ylabels.specific'].length - 1); ++i) {
                                 labels.push(prop['chart.ylabels.specific'][i]);
                             }
                         }
     
                         for (var i=0; i<labels.length; ++i) {
                             
                             var y = this.gutterTop + (i * (this.grapharea / (labels.length - 1)) );
     
                             RG.Text2(this, {'font':font,
                                                 'size':text_size,
                                                 'x':xPos,
                                                 'y':y,
                                                 'text':labels[i],
                                                 'halign':align,
                                                 'valign':'center',
                                                 'bounding':boxed,
                                                 'tag': 'scale'
                                                });
                         }
                     
                     /**
                     * X axis at the bottom
                     */
                     } else {
     
                         if (typeof(numYLabels) == 'number') {
     
                             if (invert) {
     
                                 for (var i=0; i<numYLabels; ++i) {
 
                                     //var value = ((this.max - this.min)/ numYLabels) * i;
                                     //    value = value.toFixed(prop['chart.scale.decimals']);
                                     var interval = (ca.height - this.gutterTop - this.gutterBottom) / numYLabels;
                                 
                                     RG.Text2(this, {'font':font,
                                                         'size': text_size,
                                                         'x': xPos,
                                                         'y': this.gutterTop + ((i+1) * interval),
                                                         'valign': 'center',
                                                         'halign':align,
                                                         'bounding': boxed,
                                                         'boundingFill': 'white',
                                                         'text': this.scale2.labels[i],
                                                         'tag': 'scale'
                                                        });
                                 }
     
         
                                 // No X axis being shown and there's no ymin. If ymin IS set its added further down
                                 if (!prop['chart.xaxis'] && !prop['chart.ymin']) {
                                     RG.Text2(this, {'font':font,
                                                         'size': text_size,
                                                         'x': xPos,
                                                         'y': this.gutterTop,
                                                         'valign': 'center',
                                                         'halign':align,
                                                         'bounding': boxed,
                                                         'boundingFill': 'white',
                                                         'text': RG.number_format(this, (this.min).toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                         'tag': 'scale'
                                                        });
                                 }
         
                             } else {
                                 for (var i=0; i<this.scale2.labels.length; ++i) {
 
                                     //var value = ((this.max - this.min)/ numYLabels) * (i+1);
                                     //    value  = (invert ? this.max - value : value);
                                     //    if (!invert) value += this.min;
                                     //    value = value.toFixed(prop['chart.scale.decimals']);
                                 
                                     RG.Text2(this, {'font':font,
                                                         'size': text_size,
                                                         'x': xPos,
                                                         'y': this.gutterTop + this.grapharea - (((i + 1)/this.scale2.labels.length) * this.grapharea),
                                                         'valign': 'center',
                                                         'halign':align,
                                                         'bounding': boxed,
                                                         'boundingFill': 'white',
                                                         'text': this.scale2.labels[i],
                                                         'tag': 'scale'
                                                        });
                                 }
     
                                 // Modified by Paul Secular - ALWAYS draw the zero label on the y axis
 //                                if (!prop['chart.xaxis'] && prop['chart.ymin'] == 0) {
                                 if (prop['chart.ymin'] == 0) {
                                 //
 
                                 RG.Text2(this, {'font':font,
                                                         'size': text_size,
                                                         'x': xPos,
                                                         'y': ca.height - this.gutterBottom,
                                                         'valign': 'center',
                                                         'halign':align,
                                                         'bounding': boxed,
                                                         'boundingFill': 'white',
                                                         'text': RG.number_format(this, (0).toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                         'tag': 'scale'
                                                        });
                                 }
                             }
                         }
                         
                         if (prop['chart.ymin'] && !invert) {
                             RG.Text2(this, {'font':font,
                                                 'size': text_size,
                                                 'x': xPos,
                                                 'y': ca.height - this.gutterBottom,
                                                 'valign': 'center',
                                                 'halign':align,
                                                 'bounding': boxed,
                                                 'boundingFill': 'white',
                                                 'text': RG.number_format(this, prop['chart.ymin'].toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                 'tag': 'scale'
                                                });
                         } else if (invert) {
                             RG.Text2(this, {'font':font,
                                                 'size': text_size,
                                                 'x': xPos,
                                                 'y': this.gutterTop,
                                                 'valign': 'center',
                                                 'halign':align,
                                                 'bounding': boxed,
                                                 'boundingFill': 'white',
                                                 'text': RG.number_format(this, prop['chart.ymin'].toFixed(prop['chart.scale.decimals']), units_pre, units_post),
                                                 'tag': 'scale'
                                                });
     
                         }
                     }
                 }
             }
     
     
     
     
             /**
             * Draw an X scale
             */
             if (prop['chart.xscale']) {
     
                 var numXLabels   = prop['chart.xscale.numlabels'];
                 var y            = ca.height - this.gutterBottom + 5 + (text_size / 2);
                 var units_pre_x  = prop['chart.xscale.units.pre'];
                 var units_post_x = prop['chart.xscale.units.post'];
                 var decimals     = prop['chart.xscale.decimals'];
                 var point        = prop['chart.xscale.point'];
                 var thousand     = prop['chart.xscale.thousand'];
 
     
                 if (!prop['chart.xmax']) {
                     
                     var xmax = 0;
                     var xmin = prop['chart.xmin'];
                     
                     for (var ds=0; ds<this.data.length; ++ds) {
                         for (var point=0; point<this.data[ds].length; ++point) {
                             xmax = Math.max(xmax, this.data[ds][point][0]);
                         }
                     }
                 } else {
                     xmax = prop['chart.xmax'];
                     xmin = prop['chart.xmin']
                 }
 
                 this.xscale2 = RG.getScale2(this, {'max':xmax,
                                                    'min': xmin,
                                                        'scale.decimals': decimals,
                                                        'scale.point': point,
                                                        'scale.thousand': thousand,
                                                        'units.pre': units_pre_x,
                                                        'units.post': units_post_x,
                                                        'ylabels.count': numXLabels,
                                                        'strict': true
                                                       });
     
                 this.Set('chart.xmax', this.xscale2.max);
                 var interval = (ca.width - this.gutterLeft - this.gutterRight) / this.xscale2.labels.length;
     
                 for (var i=0; i<this.xscale2.labels.length; ++i) {
                 
                     var num  = ( (prop['chart.xmax'] - prop['chart.xmin']) * ((i+1) / numXLabels)) + (xmin || 0);
 
                     var x    = this.gutterLeft + ((i+1) * interval);
     
                     if (typeof(prop['chart.xscale.formatter']) == 'function') {
                         var text = String(prop['chart.xscale.formatter'](this, num));
 
                     } else {
     
                         var text = this.xscale2.labels[i]
                     }
     
                     RG.Text2(this, {'font':font,
                                         'size': text_size,
                                         'x': x,
                                         'y': y + 3, // modified by Paul Secular - add more spacing between axis and labels
                                         'valign': 'center',
                                         'halign':'center',
                                         'text':text,
                                         'tag': 'xscale'
                                        });
                 }
                 
                 // Modified by Paul Secular - ALWAYS draw the left most X label
                 RG.Text2(this, {'font':font,
                                     'size': text_size,
                                     'x': this.gutterLeft,
                                     'y': y + 3, // modified by Paul Secular - add more spacing between axis and labels
                                     'valign': 'center',
                                     'halign':'center',
                                     'text':String(prop['chart.xmin']),
                                     'tag': 'xscale'
                                     });
     
             /**
             * Draw X labels
             */
             } else {
     
                 // Put the text on the X axis
                 var graphArea = ca.width - this.gutterLeft - this.gutterRight;
                 var xInterval = graphArea / prop['chart.labels'].length;
                 var xPos      = this.gutterLeft;
                 var yPos      = (ca.height - this.gutterBottom) + 3;
                 var labels    = prop['chart.labels'];
     
                 /**
                 * Text angle
                 */
                 var angle  = 0;
                 var valign = 'top';
                 var halign = 'center';
         
                 if (prop['chart.text.angle'] > 0) {
                     angle  = -1 * prop['chart.text.angle'];
                     valign = 'center';
                     halign = 'right';
                     yPos += 10;
                 }
     
                 for (i=0; i<labels.length; ++i) {
     
                     if (typeof(labels[i]) == 'object') {
     
                         if (prop['chart.labels.specific.align'] == 'center') {
                             var rightEdge = 0;
         
                             if (labels[i+1] && labels[i+1][1]) {
                                 rightEdge = labels[i+1][1];
                             } else {
                                 rightEdge = prop['chart.xmax'];
                             }
     
                             var offset = (this.getXCoord(rightEdge) - this.getXCoord(labels[i][1])) / 2;
     
                         } else {
                             var offset = 5;
                         }
                     
     
                         RG.Text2(this, {'font':font,
                                             'size': prop['chart.text.size'],
                                             'x': this.getXCoord(labels[i][1]) + offset,
                                             'y': yPos,
                                             'valign': valign,
                                             'halign':angle != 0 ? 'right' : (prop['chart.labels.specific.align'] == 'center' ? 'center' : 'left'),
                                             'text':String(labels[i][0]),
                                             'angle':angle,
                                             'marker':false,
                                             'tag': 'labels.specific'
                                            });
                         
                         /**
                         * Draw the gray indicator line
                         */
                         co.beginPath();
                             co.strokeStyle = '#bbb';
                             co.moveTo(Math.round(this.gutterLeft + (graphArea * ((labels[i][1] - xMin)/ (prop['chart.xmax'] - xMin)))), ca.height - this.gutterBottom);
                             co.lineTo(Math.round(this.gutterLeft + (graphArea * ((labels[i][1] - xMin)/ (prop['chart.xmax'] - xMin)))), ca.height - this.gutterBottom + 20);
                         co.stroke();
                     
                     } else {
     
                         RG.Text2(this, {'font':font,
                                             'size': prop['chart.text.size'],
                                             'x': xPos + (xInterval / 2),
                                             'y': yPos,
                                             'valign': valign,
                                             'halign':halign,
                                             'text':String(labels[i]),
                                             'angle':angle,
                                             'tag': 'labels'
                                            });
                     }
                     
                     // Do this for the next time around
                     xPos += xInterval;
                 }
         
                 /**
                 * Draw the final indicator line
                 */
                 if (typeof(labels[0]) == 'object') {
                     co.beginPath();
                         co.strokeStyle = '#bbb';
                         co.moveTo(this.gutterLeft + graphArea, ca.height - this.gutterBottom);
                         co.lineTo(this.gutterLeft + graphArea, ca.height - this.gutterBottom + 20);
                     co.stroke();
                 }
             }
         }
     
     
     
     
     
     
     
     
     
     
     
     
     
     
         /**
         * Draws the actual scatter graph marks
         * 
         * @param i integer The dataset index
         */
         this.DrawMarks = function (i)
         {
             /**
             *  Reset the coords array
             */
             this.coords[i] = [];
     
             /**
             * Plot the values
             */
             var xmax          = prop['chart.xmax'];
             var default_color = prop['chart.defaultcolor'];
     
             for (var j=0; j<this.data[i].length; ++j) {
                 /**
                 * This is here because tooltips are optional
                 */
                 var data_point = this.data[i];
     
                 var xCoord = data_point[j][0];
                 var yCoord = data_point[j][1];
                 var color  = data_point[j][2] ? data_point[j][2] : default_color;
                 var tooltip = (data_point[j] && data_point[j][3]) ? data_point[j][3] : null;
     
                 
                 this.DrawMark(
                               i,
                               xCoord,
                               yCoord,
                               xmax,
                               this.scale2.max,
                               color,
                               tooltip,
                               this.coords[i],
                               data_point,
                               j
                              );
             }
         }
 
 
 
 
         /**
         * Draws a single scatter mark
         */
         this.DrawMark = function (data_set_index, x, y, xMax, yMax, color, tooltip, coords, data, data_index)
         {
             var tickmarks = prop['chart.tickmarks'];
             var tickSize  = prop['chart.ticksize'];
             var xMin      = prop['chart.xmin'];
             var x         = ((x - xMin) / (xMax - xMin)) * (ca.width - this.gutterLeft - this.gutterRight);
             var originalX = x;
             var originalY = y;
     
             /**
             * This allows chart.tickmarks to be an array
             */
             if (tickmarks && typeof(tickmarks) == 'object') {
                 tickmarks = tickmarks[data_set_index];
             }
     
     
             /**
             * This allows chart.ticksize to be an array
             */
             if (typeof(tickSize) == 'object') {
                 var tickSize     = tickSize[data_set_index];
                 var halfTickSize = tickSize / 2;
             } else {
                 var halfTickSize = tickSize / 2;
             }
     
     
             /**
             * This bit is for boxplots only
             */
             if (   y
                 && typeof(y) == 'object'
                 && typeof(y[0]) == 'number'
                 && typeof(y[1]) == 'number'
                 && typeof(y[2]) == 'number'
                 && typeof(y[3]) == 'number'
                 && typeof(y[4]) == 'number'
                ) {
     
                 //var yMin = prop['chart.ymin'] ? prop['chart.ymin'] : 0;
                 this.Set('chart.boxplot', true);
                 //this.graphheight = ca.height - this.gutterTop - this.gutterBottom;
                 
                 //if (prop['chart.xaxispos'] == 'center') {
                 //    this.graphheight /= 2;
                 //}
     
     
                 var y0 = this.getYCoord(y[0]);//(this.graphheight) - ((y[4] - yMin) / (yMax - yMin)) * (this.graphheight);
                 var y1 = this.getYCoord(y[1]);//(this.graphheight) - ((y[3] - yMin) / (yMax - yMin)) * (this.graphheight);
                 var y2 = this.getYCoord(y[2]);//(this.graphheight) - ((y[2] - yMin) / (yMax - yMin)) * (this.graphheight);
                 var y3 = this.getYCoord(y[3]);//(this.graphheight) - ((y[1] - yMin) / (yMax - yMin)) * (this.graphheight);
                 var y4 = this.getYCoord(y[4]);//(this.graphheight) - ((y[0] - yMin) / (yMax - yMin)) * (this.graphheight);
     
     
                 var col1  = y[5];
                 var col2  = y[6];
     
                 var boxWidth = typeof(y[7]) == 'number' ? y[7] : prop['chart.boxplot.width'];
     
                 //var y = this.graphheight - y2;
     
             } else {
     
                 /**
                 * The new way of getting the Y coord. This function (should) handle everything
                 */
                 var yCoord = this.getYCoord(y);
             }
     
             //if (prop['chart.xaxispos'] == 'center'] {
             //    y /= 2;
             //    y += this.halfGraphHeight;
             //    
             //    if (prop['chart.ylabels.invert']) {
             //        p(y)
             //    }
             //}
     
             /**
             * Account for the X axis being at the centre
             */
             // This is so that points are on the graph, and not the gutter
             x += this.gutterLeft;
             //y = ca.height - this.gutterBottom - y;
     
     
     
     
             co.beginPath();
             
             // Color
             co.strokeStyle = color;
     
     
     
             /**
             * Boxplots
             */
             if (prop['chart.boxplot']) {
     
                 // boxWidth is now a scale value, so convert it to a pixel vlue
                 boxWidth = (boxWidth / prop['chart.xmax']) * (ca.width -this.gutterLeft - this.gutterRight);
     
                 var halfBoxWidth = boxWidth / 2;
     
                 if (prop['chart.line.visible']) {
                     co.beginPath();
                         co.strokeRect(x - halfBoxWidth, y1, boxWidth, y3 - y1);
             
                         // Draw the upper coloured box if a value is specified
                         if (col1) {
                             co.fillStyle = col1;
                             co.fillRect(x - halfBoxWidth, y1, boxWidth, y2 - y1);
                         }
             
                         // Draw the lower coloured box if a value is specified
                         if (col2) {
                             co.fillStyle = col2;
                             co.fillRect(x - halfBoxWidth, y2, boxWidth, y3 - y2);
                         }
                     co.stroke();
         
                     // Now draw the whiskers
                     co.beginPath();
                     if (prop['chart.boxplot.capped']) {
                         co.moveTo(x - halfBoxWidth, Math.round(y0));
                         co.lineTo(x + halfBoxWidth, Math.round(y0));
                     }
         
                     co.moveTo(Math.round(x), y0);
                     co.lineTo(Math.round(x), y1);
         
                     if (prop['chart.boxplot.capped']) {
                         co.moveTo(x - halfBoxWidth, Math.round(y4));
                         co.lineTo(x + halfBoxWidth, Math.round(y4));
                     }
         
                     co.moveTo(Math.round(x), y4);
                     co.lineTo(Math.round(x), y3);
         
                     co.stroke();
                 }
             }
     
     
             /**
             * Draw the tickmark, but not for boxplots
             */
             if (prop['chart.line.visible'] && typeof(y) == 'number' && !y0 && !y1 && !y2 && !y3 && !y4) {
     
                 if (tickmarks == 'circle') {
                     co.arc(x, yCoord, halfTickSize, 0, 6.28, 0);
                     co.fillStyle = color;
                     co.fill();
                 
                 } else if (tickmarks == 'plus') {
     
                     co.moveTo(x, yCoord - halfTickSize);
                     co.lineTo(x, yCoord + halfTickSize);
                     co.moveTo(x - halfTickSize, yCoord);
                     co.lineTo(x + halfTickSize, yCoord);
                     co.stroke();
                 
                 } else if (tickmarks == 'square') {
                     co.strokeStyle = color;
                     co.fillStyle = color;
                     co.fillRect(
                                           x - halfTickSize,
                                           yCoord - halfTickSize,
                                           tickSize,
                                           tickSize
                                          );
                     //co.fill();
     
                 } else if (tickmarks == 'cross') {
     
                     co.moveTo(x - halfTickSize, yCoord - halfTickSize);
                     co.lineTo(x + halfTickSize, yCoord + halfTickSize);
                     co.moveTo(x + halfTickSize, yCoord - halfTickSize);
                     co.lineTo(x - halfTickSize, yCoord + halfTickSize);
                     
                     co.stroke();
                 
                 /**
                 * Diamond shape tickmarks
                 */
                 } else if (tickmarks == 'diamond') {
                     co.fillStyle = co.strokeStyle;
     
                     co.moveTo(x, yCoord - halfTickSize);
                     co.lineTo(x + halfTickSize, yCoord);
                     co.lineTo(x, yCoord + halfTickSize);
                     co.lineTo(x - halfTickSize, yCoord);
                     co.lineTo(x, yCoord - halfTickSize);
     
                     co.fill();
                     co.stroke();
     
                 /**
                 * Custom tickmark style
                 */
                 } else if (typeof(tickmarks) == 'function') {
     
                     var graphWidth  = ca.width - this.gutterLeft - this.gutterRight
                     var graphheight = ca.height - this.gutterTop - this.gutterBottom;
                     var xVal = ((x - this.gutterLeft) / graphWidth) * xMax;
                     var yVal = ((graphheight - (yCoord - this.gutterTop)) / graphheight) * yMax;
     
                     tickmarks(this, data, x, yCoord, xVal, yVal, xMax, yMax, color, data_set_index, data_index)
     
                 /**
                 * No tickmarks
                 */
                 } else if (tickmarks == null) {
         
                 /**
                 * Unknown tickmark type
                 */
                 } else {
                     alert('[SCATTER] (' + this.id + ') Unknown tickmark style: ' + tickmarks );
                 }
             }
     
             /**
             * Add the tickmark to the coords array
             */
             if (   prop['chart.boxplot']
                 && typeof(y0) == 'number'
                 && typeof(y1) == 'number'
                 && typeof(y2) == 'number'
                 && typeof(y3) == 'number'
                 && typeof(y4) == 'number') {
     
                 x      = [x - halfBoxWidth, x + halfBoxWidth];
                 yCoord = [y0, y1, y2, y3, y4];
             }
     
             coords.push([x, yCoord, tooltip]);
         }
 
 
 
 
         /**
         * Draws an optional line connecting the tick marks.
         * 
         * @param i The index of the dataset to use
         */
         this.DrawLine = function (i)
         {
             if (typeof(prop['chart.line.visible']) == 'boolean' && prop['chart.line.visible'] == false) {
                 return;
             }
     
             if (prop['chart.line'] && this.coords[i].length >= 2) {
     
                 co.lineCap     = 'round';
                 co.lineJoin    = 'round';
                 co.lineWidth   = this.GetLineWidth(i);// i is the index of the set of coordinates
                 co.strokeStyle = prop['chart.line.colors'][i];
                 
                 co.beginPath();
                     
                     var len = this.coords[i].length;
                     
                     var prevY = null;
                     var currY = null;
 
                     var stepped = prop['chart.line.stepped']; // Paul Secular; 28/04/14. This belongs here, not inside loop
 
                     for (var j=0; j<this.coords[i].length; ++j) {
                     
         
                         var xPos = this.coords[i][j][0];
                         var yPos = this.coords[i][j][1];
                         
                         if (j > 0) prevY = this.coords[i][j - 1][1];
                         currY = yPos;
     
                         if (j == 0 || RG.is_null(prevY) || RG.is_null(currY)) {
                             co.moveTo(xPos, yPos);
                         } else {
                         
 //                            var stepped = prop['chart.line.stepped']; - Paul Secular; 28/04/14. Should NOT be here. Belongs at top
         
                             // Stepped?
                             if ((typeof (stepped) == 'boolean' && stepped)
                                 || (typeof(stepped) == 'object' && stepped[i])
                                ) {
                                 co.lineTo(this.coords[i][j][0], this.coords[i][j - 1][1]);
                             }
         
                             co.lineTo(xPos, yPos);
                         }
                     }
                 co.stroke();
             }
             
             /**
             * Set the linewidth back to 1
             */
             co.lineWidth = 1;
         }
 
 
 
 
         /**
         * Returns the linewidth
         * 
         * @param number i The index of the "line" (/set of coordinates)
         */
         this.GetLineWidth = function (i)
         {
             var linewidth = prop['chart.line.linewidth'];
             
             if (typeof(linewidth) == 'number') {
                 return linewidth;
             
             } else if (typeof(linewidth) == 'object') {
                 if (linewidth[i]) {
                     return linewidth[i];
                 } else {
                     return linewidth[0];
                 }
     
                 alert('[SCATTER] Error! chart.linewidth should be a single number or an array of one or more numbers');
             }
         }
 
 
 
 
         /**
         * Draws vertical bars. Line chart doesn't use a horizontal scale, hence this function
         * is not common
         */
         this.DrawVBars = function ()
         {
             var vbars = prop['chart.background.vbars'];
             var graphWidth = ca.width - this.gutterLeft - this.gutterRight;
             
             if (vbars) {
             
                 var xmax = prop['chart.xmax'];
     
                 for (var i=0; i<vbars.length; ++i) {
                     var startX = ((vbars[i][0] / xmax) * graphWidth) + this.gutterLeft;
                     var width  = (vbars[i][1] / xmax) * graphWidth;
     
                     co.beginPath();
                         co.fillStyle = vbars[i][2];
                         co.fillRect(startX, this.gutterTop, width, (ca.height - this.gutterTop - this.gutterBottom));
                     co.fill();
                 }
             }
         }
 
 
 
 
         /**
         * Draws in-graph labels.
         * 
         * @param object obj The graph object
         */
         this.DrawInGraphLabels = function (obj)
         {
             var labels  = obj.Get('chart.labels.ingraph');
             var labels_processed = [];
     
             // Defaults
             var fgcolor   = 'black';
             var bgcolor   = 'white';
             var direction = 1;
     
             if (!labels) {
                 return;
             }
     
             /**
             * Preprocess the labels array. Numbers are expanded
             */
             for (var i=0; i<labels.length; ++i) {
                 if (typeof(labels[i]) == 'number') {
                     for (var j=0; j<labels[i]; ++j) {
                         labels_processed.push(null);
                     }
                 } else if (typeof(labels[i]) == 'string' || typeof(labels[i]) == 'object') {
                     labels_processed.push(labels[i]);
                 
                 } else {
                     labels_processed.push('');
                 }
             }
     
             /**
             * Turn off any shadow
             */
             RG.NoShadow(obj);
     
             if (labels_processed && labels_processed.length > 0) {
     
                 var i=0;
     
                 for (var set=0; set<obj.coords.length; ++set) {
                     for (var point = 0; point<obj.coords[set].length; ++point) {
                         if (labels_processed[i]) {
                             var x = obj.coords[set][point][0];
                             var y = obj.coords[set][point][1];
                             var length = typeof(labels_processed[i][4]) == 'number' ? labels_processed[i][4] : 25;
                                 
                             var text_x = x;
                             var text_y = y - 5 - length;
     
                             co.moveTo(x, y - 5);
                             co.lineTo(x, y - 5 - length);
                             
                             co.stroke();
                             co.beginPath();
                             
                             // This draws the arrow
                             co.moveTo(x, y - 5);
                             co.lineTo(x - 3, y - 10);
                             co.lineTo(x + 3, y - 10);
                             co.closePath();
     
     
                             co.beginPath();
                                 // Fore ground color
                                 co.fillStyle = (typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][1]) == 'string') ? labels_processed[i][1] : 'black';
                                 RG.Text2(this, {
                                                     'font':obj.Get('chart.text.font'),                            
                                                     'size':obj.Get('chart.text.size'),
                                                     'x':text_x,
                                                     'y':text_y,
                                                     'text':(typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][0]) == 'string') ? labels_processed[i][0] : labels_processed[i],
                                                     'valign':'bottom',
                                                     'halign':'center',
                                                     'bounding':true,
                                                     'boundingFill':(typeof(labels_processed[i]) == 'object' && typeof(labels_processed[i][2]) == 'string') ? labels_processed[i][2] : 'white',
                                                     'tag': 'labels.ingraph'
                                                     });
                             co.fill();
                         }
                         
                         i++;
                     }
                 }
             }
         }
 
 
 
 
         /**
         * This function makes it much easier to get the (if any) point that is currently being hovered over.
         * 
         * @param object e The event object
         */
         this.getShape =
         this.getPoint = function (e)
         {
             var mouseXY     = RG.getMouseXY(e);
             var mouseX      = mouseXY[0];
             var mouseY      = mouseXY[1];
             var overHotspot = false;
             var offset      = prop['chart.tooltips.hotspot']; // This is how far the hotspot extends
     
             for (var set=0; set<this.coords.length; ++set) {
     
                 for (var i=0; i<this.coords[set].length; ++i) {
     
                     var x = this.coords[set][i][0];
                     var y = this.coords[set][i][1];
                     var tooltip = this.data[set][i][3];
     
                     if (typeof(y) == 'number') {
                         if (mouseX <= (x + offset) &&
                             mouseX >= (x - offset) &&
                             mouseY <= (y + offset) &&
                             mouseY >= (y - offset)) {
     
                             var tooltip = RG.parseTooltipText(this.data[set][i][3], 0);
                             var index_adjusted = i;
     
                             for (var ds=(set-1); ds >=0; --ds) {
                                 index_adjusted += this.data[ds].length;
                             }
     
                             return {
                                     0: this, 1: x, 2: y, 3: set, 4: i, 5: this.data[set][i][3],
                                     'object': this, 'x': x, 'y': y, 'dataset': set, 'index': i, 'tooltip': tooltip, 'index_adjusted': index_adjusted
                                    };
                         }
                     } else if (RG.is_null(y)) {
                         // Nothing to see here
     
                     } else {
     
                         var mark = this.data[set][i];
     
                         /**
                         * Determine the width
                         */
                         var width = prop['chart.boxplot.width'];
                         
                         if (typeof(mark[1][7]) == 'number') {
                             width = mark[1][7];
                         }
     
                         if (   typeof(x) == 'object'
                             && mouseX > x[0]
                             && mouseX < x[1]
                             && mouseY < y[1]
                             && mouseY > y[3]
                             ) {
     
                             var tooltip = RG.parseTooltipText(this.data[set][i][3], 0);
     
                             return {
                                     0: this, 1: x[0], 2: x[1] - x[0], 3: y[1], 4: y[3] - y[1], 5: set, 6: i, 7: this.data[set][i][3],
                                     'object': this, 'x': x[0], 'y': y[1], 'width': x[1] - x[0], 'height': y[3] - y[1], 'dataset': set, 'index': i, 'tooltip': tooltip
                                    };
                         }
                     }
                 }
             }
         }
 
 
 
 
         /**
         * Draws the above line labels
         */
         this.DrawAboveLabels = function ()
         {
             var size       = prop['chart.labels.above.size'];
             var font       = prop['chart.text.font'];
             var units_pre  = prop['chart.units.pre'];
             var units_post = prop['chart.units.post'];
     
     
             for (var set=0; set<this.coords.length; ++set) {
                 for (var point=0; point<this.coords[set].length; ++point) {
                     
                     var x_val = this.data[set][point][0];
                     var y_val = this.data[set][point][1];
                     
                     if (!RG.is_null(y_val)) {
                         
                         // Use the top most value from a box plot
                         if (RG.is_array(y_val)) {
                             var max = 0;
                             for (var i=0; i<y_val; ++i) {
                                 max = Math.max(max, y_val[i]);
                             }
                             
                             y_val = max;
                         }
                         
                         var x_pos = this.coords[set][point][0];
                         var y_pos = this.coords[set][point][1];
     
                         RG.Text2(this, {
                                             'font':font,
                                             'size':size,
                                             'x':x_pos,
                                             'y':y_pos - 5 - size,
                                             'text':x_val.toFixed(prop['chart.labels.above.decimals']) + ', ' + y_val.toFixed(prop['chart.labels.above.decimals']),
                                             'valign':'center',
                                             'halign':'center',
                                             'bounding':true,
                                             'boundingFill':'rgba(255, 255, 255, 0.7)',
                                             'tag': 'labels.above'
                                             });
                     }
                 }
             }
         }
 
 
 
 
         /**
         * When you click on the chart, this method can return the Y value at that point. It works for any point on the
         * chart (that is inside the gutters) - not just points within the Bars.
         * 
         * @param object e The event object
         */
         this.getYValue =
         this.getValue = function (arg)
         {
             if (arg.length == 2) {
                 var mouseX = arg[0];
                 var mouseY = arg[1];
             } else {
                 var mouseCoords = RG.getMouseXY(arg);
                 var mouseX      = mouseCoords[0];
                 var mouseY      = mouseCoords[1];
             }
             
             var obj = this;
     
             if (   mouseY < this.gutterTop
                 || mouseY > (ca.height - this.gutterBottom)
                 || mouseX < this.gutterLeft
                 || mouseX > (ca.width - this.gutterRight)
                ) {
                 return null;
             }
             
             if (prop['chart.xaxispos'] == 'center') {
                 var value = (((this.grapharea / 2) - (mouseY - this.gutterTop)) / this.grapharea) * (this.max - this.min)
                 value *= 2;
                 if (value >= 0) {
                     value += this.min
                 } else {
                     value -= this.min
                 }
             } else {
                 var value = ((this.grapharea - (mouseY - this.gutterTop)) / this.grapharea) * (this.max - this.min)
                 value += this.min;
             }
     
             return value;
         }
 
 
 
 
         /**
         * When you click on the chart, this method can return the X value at that point.
         * 
         * @param mixed  arg This can either be an event object or the X coordinate
         * @param number     If specifying the X coord as the first arg then this should be the Y coord
         */
         this.getXValue = function (arg)
         {
             if (arg.length == 2) {
                 var mouseX = arg[0];
                 var mouseY = arg[1];
             } else {
                 var mouseXY = RG.getMouseXY(arg);
                 var mouseX  = mouseXY[0];
                 var mouseY  = mouseXY[1];
             }
             var obj = this;
             
             if (   mouseY < this.gutterTop
                 || mouseY > (ca.height - this.gutterBottom)
                 || mouseX < this.gutterLeft
                 || mouseX > (ca.width - this.gutterRight)
                ) {
                 return null;
             }
     
             var width = (ca.width - this.gutterLeft - this.gutterRight);
             var value = ((mouseX - this.gutterLeft) / width) * (prop['chart.xmax'] - prop['chart.xmin'])
             value += prop['chart.xmin'];
 
             return value;
         }
 
 
 
 
         /**
         * Each object type has its own Highlight() function which highlights the appropriate shape
         * 
         * @param object shape The shape to highlight
         */
         this.Highlight = function (shape)
         {
             // Boxplot highlight
             if (shape['height']) {
                 RG.Highlight.Rect(this, shape);
     
             // Point highlight
             } else {
                 RG.Highlight.Point(this, shape);
             }
         }
 
 
 
 
         /**
         * The getObjectByXY() worker method. Don't call this call:
         * 
         * RG.ObjectRegistry.getObjectByXY(e)
         * 
         * @param object e The event object
         */
         this.getObjectByXY = function (e)
         {
             var mouseXY = RG.getMouseXY(e);
     
             if (
                    mouseXY[0] > (this.gutterLeft - 3)
                 && mouseXY[0] < (ca.width - this.gutterRight + 3)
                 && mouseXY[1] > (this.gutterTop - 3)
                 && mouseXY[1] < ((ca.height - this.gutterBottom) + 3)
                 ) {
     
                 return this;
             }
         }
 
 
 
 
         /**
         * This function can be used when the canvas is clicked on (or similar - depending on the event)
         * to retrieve the relevant X coordinate for a particular value.
         * 
         * @param int value The value to get the X coordinate for
         */
         this.getXCoord = function (value)
         {
             if (typeof(value) != 'number') {
                 return null;
             }
             
             var xmin = prop['chart.xmin'];
             var xmax = prop['chart.xmax'];
             var x;
     
             if (value < xmin) return null;
             if (value > xmax) return null;
             
             var gutterRight = this.gutterRight;
             var gutterLeft  = this.gutterLeft;
     
             if (prop['chart.yaxispos'] == 'right') {
                 x = ((value - xmin) / (xmax - xmin)) * (ca.width - gutterLeft - gutterRight);
                 x = (ca.width - gutterRight - x);
             } else {
                 x = ((value - xmin) / (xmax - xmin)) * (ca.width - gutterLeft - gutterRight);
                 x = x + gutterLeft;
             }
             
             return x;
         }
 
 
 
 
         /**
         * This function positions a tooltip when it is displayed
         * 
         * @param obj object    The chart object
         * @param int x         The X coordinate specified for the tooltip
         * @param int y         The Y coordinate specified for the tooltip
         * @param objec tooltip The tooltips DIV element
         */
         this.positionTooltip = function (obj, x, y, tooltip, idx)
         {
             var shape      = RG.Registry.Get('chart.tooltip.shape');
             var dataset    = shape['dataset'];
             var index      = shape['index'];
             var coordX     = obj.coords[dataset][index][0]
             var coordY     = obj.coords[dataset][index][1]
             var canvasXY   = RG.getCanvasXY(obj.canvas);
             var gutterLeft = obj.gutterLeft;
             var gutterTop  = obj.gutterTop;
             var width      = tooltip.offsetWidth;
             var height     = tooltip.offsetHeight;
             tooltip.style.left = 0;
             tooltip.style.top  = 0;
     
             // Is the coord a boxplot
             var isBoxplot = typeof(coordY) == 'object' ? true : false;
     
             // Show any overflow (ie the arrow)
             tooltip.style.overflow = '';
     
             // Create the arrow
             var img = new Image();
                 img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAFCAYAAACjKgd3AAAARUlEQVQYV2NkQAN79+797+RkhC4M5+/bd47B2dmZEVkBCgcmgcsgbAaA9GA1BCSBbhAuA/AagmwQPgMIGgIzCD0M0AMMAEFVIAa6UQgcAAAAAElFTkSuQmCC';
                 img.style.position = 'absolute';
                 img.id = '__rgraph_tooltip_pointer__';
                 img.style.top = (tooltip.offsetHeight - 2) + 'px';
             tooltip.appendChild(img);
             
             // Reposition the tooltip if at the edges:
             
             // LEFT edge //////////////////////////////////////////////////////////////////
     
             if ((canvasXY[0] + (coordX[0] || coordX) - (width / 2)) < 10) {
                 
                 if (isBoxplot) {
                     tooltip.style.left = canvasXY[0] + coordX[0] + ((coordX[1] - coordX[0]) / 2) - (width * 0.1) + 'px';
                     tooltip.style.top  = canvasXY[1] + coordY[2] - height - 5 + 'px';
                     img.style.left = ((width * 0.1) - 8.5) + 'px';
     
                 } else {
                     tooltip.style.left = (canvasXY[0] + coordX - (width * 0.1)) + 'px';
                     tooltip.style.top  = canvasXY[1] + coordY - height - 9 + 'px';
                     img.style.left = ((width * 0.1) - 8.5) + 'px';
                 }
     
             // RIGHT edge //////////////////////////////////////////////////////////////////
             
             } else if ((canvasXY[0] + (coordX[0] || coordX) + (width / 2)) > document.body.offsetWidth) {
                 if (isBoxplot) {
                     tooltip.style.left = canvasXY[0] + coordX[0] + ((coordX[1] - coordX[0]) / 2) - (width * 0.9) + 'px';
                     tooltip.style.top  = canvasXY[1] + coordY[2] - height - 5 + 'px';
                     img.style.left = ((width * 0.9) - 8.5) + 'px';
             
                 } else {
                     tooltip.style.left = (canvasXY[0] + coordX - (width * 0.9)) + 'px';
                     tooltip.style.top  = canvasXY[1] + coordY - height - 9 + 'px';
                     img.style.left = ((width * 0.9) - 8.5) + 'px';
                 }
     
             // Default positioning - CENTERED //////////////////////////////////////////////////////////////////
     
             } else {
                 if (isBoxplot) {
                     tooltip.style.left = canvasXY[0] + coordX[0] + ((coordX[1] - coordX[0]) / 2) - (width / 2) + 'px';
                     tooltip.style.top  = canvasXY[1] + coordY[2] - height - 5 + 'px';
                     img.style.left = ((width * 0.5) - 8.5) + 'px';
     
                 } else {
                     tooltip.style.left = (canvasXY[0] + coordX - (width * 0.5)) + 'px';
                     tooltip.style.top  = canvasXY[1] + coordY - height - 9 + 'px';
                     img.style.left = ((width * 0.5) - 8.5) + 'px';
                 }
             }
         }
 
 
 
 
         /**
         * Returns the applicable Y COORDINATE when given a Y value
         * 
         * @param int value The value to use
         * @return int The appropriate Y coordinate
         */
         this.getYCoord =
         this.getYCoordFromValue = function (value)
         {
             if (typeof(value) != 'number') {
                 return null;
             }
     
             var invert          = prop['chart.ylabels.invert'];
             var xaxispos        = prop['chart.xaxispos'];
             var graphHeight     = ca.height - this.gutterTop - this.gutterBottom;
             var halfGraphHeight = graphHeight / 2;
             var ymax            = this.max;
             var ymin            = prop['chart.ymin'];
             var coord           = 0;
     
             if (value > ymax || (prop['chart.xaxispos'] == 'bottom' && value < ymin) || (prop['chart.xaxispos'] == 'center' && ((value > 0 && value < ymin) || (value < 0 && value > (-1 * ymin))))) {
                 return null;
             }
     
             /**
             * This calculates scale values if the X axis is in the center
             */
             if (xaxispos == 'center') {
     
                 coord = ((Math.abs(value) - ymin) / (ymax - ymin)) * halfGraphHeight;
     
                 if (invert) {
                     coord = halfGraphHeight - coord;
                 }
                 
                 if (value < 0) {
                     coord += this.gutterTop;
                     coord += halfGraphHeight;
                 } else {
                     coord  = halfGraphHeight - coord;
                     coord += this.gutterTop;
                 }
     
             /**
             * And this calculates scale values when the X axis is at the bottom
             */
             } else {
     
                 coord = ((value - ymin) / (ymax - ymin)) * graphHeight;
                 
                 if (invert) {
                     coord = graphHeight - coord;
                 }
     
                 // Invert the coordinate because the Y scale starts at the top
                 coord = graphHeight - coord;
     
                 // And add on the top gutter
                 coord = this.gutterTop + coord;
             }
     
             return coord;
         }
 
 
 
 
 
 
         /**
         * A helper class that helps facilitatesbubble charts
         */
         RG.Scatter.Bubble = function (scatter, min, max, width, data)
         {
             this.scatter = scatter;
             this.min     = min;
             this.max     = max;
             this.width   = width;
             this.data    = data;
 
 
 
             /**
             * A setter for the Bubble chart class - it just acts as a "passthru" to the Scatter object
             */
             this.Set = function (name, value)
             {
                 this.scatter.Set(name, value);
                 
                 return this;
             }
 
 
 
             /**
             * A getter for the Bubble chart class - it just acts as a "passthru" to the Scatter object
             */
             this.Get = function (name)
             {
                 this.scatter.Get(name);
             }
 
 
 
 
             /**
             * Tha Bubble chart draw function
             */
             this.Draw = function ()
             {
                 var bubble_min       = this.min;
                 var bubble_max       = this.max;
                 var bubble_data      = this.data;
                 var bubble_max_width = this.width;
         
                 // This custom ondraw event listener draws the bubbles
                 this.scatter.ondraw = function (obj)
                 {
                     // Loop through all the points (first dataset)
                     for (var i=0; i<obj.coords[0].length; ++i) {
                         
                         bubble_data[i] = Math.max(bubble_data[i], bubble_min);
                         bubble_data[i] = Math.min(bubble_data[i], bubble_max);
         
                         var r = ((bubble_data[i] - bubble_min) / (bubble_max - bubble_min) ) * bubble_max_width;
         
                         co.beginPath();
                         co.fillStyle = RG.RadialGradient(obj,
                                                               obj.coords[0][i][0] + 5,
                                                               obj.coords[0][i][1] - 5,
                                                               0,
                                                               obj.coords[0][i][0] + 5,
                                                               obj.coords[0][i][1] - 5,
                                                               50,
                                                               'white',
                                                               obj.data[0][i][2] ? obj.data[0][i][2] : obj.properties['chart.defaultcolor']
                                                              );
                         co.arc(obj.coords[0][i][0], obj.coords[0][i][1], r, 0, TWOPI, false);
                         co.fill();
                     }
                 }
                 
                 return this.scatter.Draw();
             }
         }
 
 
 
 
 
         /**
         * This allows for easy specification of gradients
         */
         this.parseColors = function ()
         {
             // Colors
             var data = this.data;
             if (data) {
                 for (var dataset=0; dataset<data.length; ++dataset) {
                     for (var i=0; i<this.data[dataset].length; ++i) {
                         
                         // Boxplots
                         if (typeof(this.data[dataset][i][1]) == 'object' && this.data[dataset][i][1]) {
     
                             if (typeof(this.data[dataset][i][1][5]) == 'string') this.data[dataset][i][1][5] = this.parseSingleColorForGradient(this.data[dataset][i][1][5]);
                             if (typeof(this.data[dataset][i][1][6]) == 'string') this.data[dataset][i][1][6] = this.parseSingleColorForGradient(this.data[dataset][i][1][6]);
                         }
                         
                         this.data[dataset][i][2] = this.parseSingleColorForGradient(this.data[dataset][i][2]);
                     }
                 }
             }
             
             // Parse HBars
             var hbars = prop['chart.background.hbars'];
             if (hbars) {
                 for (i=0; i<hbars.length; ++i) {
                     hbars[i][2] = this.parseSingleColorForGradient(hbars[i][2]);
                 }
             }
             
             // Parse HBars
             var vbars = prop['chart.background.vbars'];
             if (vbars) {
                 for (i=0; i<vbars.length; ++i) {
                     vbars[i][2] = this.parseSingleColorForGradient(vbars[i][2]);
                 }
             }
             
             // Parse line colors
             var colors = prop['chart.line.colors'];
             if (colors) {
                 for (i=0; i<colors.length; ++i) {
                     colors[i] = this.parseSingleColorForGradient(colors[i]);
                 }
             }
     
              prop['chart.defaultcolor']          = this.parseSingleColorForGradient(prop['chart.defaultcolor']);
              prop['chart.crosshairs.color']      = this.parseSingleColorForGradient(prop['chart.crosshairs.color']);
              prop['chart.highlight.stroke']      = this.parseSingleColorForGradient(prop['chart.highlight.stroke']);
              prop['chart.highlight.fill']        = this.parseSingleColorForGradient(prop['chart.highlight.fill']);
              prop['chart.background.barcolor1']  = this.parseSingleColorForGradient(prop['chart.background.barcolor1']);
              prop['chart.background.barcolor2']  = this.parseSingleColorForGradient(prop['chart.background.barcolor2']);
              prop['chart.background.grid.color'] = this.parseSingleColorForGradient(prop['chart.background.grid.color']);
              prop['chart.axis.color']            = this.parseSingleColorForGradient(prop['chart.axis.color']);
         }
 
 
 
 
         /**
         * This parses a single color value for a gradient
         */
         this.parseSingleColorForGradient = function (color)
         {
             if (!color || typeof(color) != 'string') {
                 return color;
             }
     
             if (color.match(/^gradient\((.*)\)$/i)) {
                 
                 var parts = RegExp.$1.split(':');
     
                 // Create the gradient
                 var grad = co.createLinearGradient(0,ca.height - prop['chart.gutter.bottom'], 0, prop['chart.gutter.top']);
     
                 var diff = 1 / (parts.length - 1);
     
                 grad.addColorStop(0, RG.trim(parts[0]));
     
                 for (var j=1; j<parts.length; ++j) {
                     grad.addColorStop(j * diff, RG.trim(parts[j]));
                 }
             }
                 
             return grad ? grad : color;
         }
 
 
 
 
         /**
         * This function handles highlighting an entire data-series for the interactive
         * key
         * 
         * @param int index The index of the data series to be highlighted
         */
         this.interactiveKeyHighlight = function (index)
         {
             if (this.coords && this.coords[index] && this.coords[index].length) {
                 this.coords[index].forEach(function (value, idx, arr)
                 {
                     co.beginPath();
                     co.fillStyle = prop['chart.key.interactive.highlight.chart.fill'];
                     co.arc(value[0], value[1], prop['chart.ticksize'] + 3, 0, TWOPI, false);
                     co.fill();
                 });
             }
         }
 
 
 
 
         /**
         * Register the object
         */
         RG.Register(this);
     }


export default RGraph;