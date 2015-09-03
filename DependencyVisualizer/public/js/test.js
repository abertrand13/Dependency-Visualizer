$(document).ready(function() {

  $.get("/map", function(data) {
    console.log(data);

    //FLAGS
    var SHOW_EXTENDED_DEPENDENCIES = false;

    //Set up canvas
    var canvas = Raphael(0,0,window.innerWidth, window.innerHeight);
    canvas.canvas.style.backgroundColor = "#2c3e50";
    canvas.canvas.id = "canvas"
    var allNodes = canvas.set();
    
    //node 'state' variables
    var selectedNode; //The currently selected node.  This var is most useful when selecting a new node, in which case it represents the older, originally selected node
    var nodeOp = 0;

    // Add proper attributes to nodes
    // This will allow us to filter down to only the nodes that need to be shown
    var dataKeys = Object.keys(data);
    dataKeys.map(function(el) {
      if(!data[el].hasOwnProperty('pureDependent')) {
        data[el].pureDependent = true;
      }
      var dependencies = data[el].dependencies;
      //if the given item does indeed have dependencies
      if(dependencies) {
        data[el].used = true;
        dependencies.map(function(dep) {
          if(!data[dep]) { return; } // This fixes an issue with scoutfile modules not being found.  Need to look into fixing properly.
          data[dep].used = true;
          data[dep].pureDependent = false;
          data[dep].score = data[dep].score ? ++(data[dep].score) : 1;
          data[el].score = data[el].score ? --data[el].score : -1;
        });
      }
    });
    
    //First loop - get nodes on teh page!
    dataKeys.map(function(el) {
      if(!data[el].used) { return; } //node doesn't need to be drawn
      
      //Generate a node!
      var node = canvas.circle(0, 0, 10); //irrelevant starting values
      node.id = el;
      node.score = data[el].score;
      node.used = true;
      node.pureDependent = data[el].pureDependent;
      node.centered = false;
      node.dependencies = data[el].dependencies || [];
      node.lines = [];
      node.operations = [];

      
      //Apply teh prettiez.
      styleNode(node);
      setStartingPosition(node);

      allNodes.push(node);


      //Add listeners to make things do things
      node.dblclick(function() {
        if(selectedNode !== node) {
          //erase old node lines and move old node away from center
          if(selectedNode) {
            eraseLines(selectedNode);
          }
          //move newly selected node to center and draw lines
          drawLines(node);

          selectedNode = node;
        } else {
          eraseLines(node);
          setStartingPosition(node, true);
          selectedNode = null;
        }
      });

      node.hover(hiliteNode, unHiliteNode, node, node);

      node.drag(handleDrag, null, null, node);
    });

    function drawLines(node) {
      //move new node to center
      node.animate({
        "cx" : canvas.width/4,
        "cy" : canvas.height/2
      }, 500, "<>", function() {
        //draw lines
        if(SHOW_EXTENDED_DEPENDENCIES) {
          nodeOp++;
          walkUpTree(node,
            function() {},
            function(node, dep) {
              var line = canvas.path();
              node.lines.push(line);
              drawLine(line, node, dep);
              styleLine(line);
              node.drag(function() { drawLine(line, node, dep); });
              dep.drag(function() { drawLine(line, node, dep); });
            }, "DRAWLINES", false);
        } else {
          var nodeDeps = node.dependencies;
          if(nodeDeps) {
            nodeDeps.map(function(el) { //perhaps factor this out to a function (common code)
              var dep = canvas.getById(el);
              if(!dep) return;
              //bring dep to sort of center (congregate around main node)
              dep.animate({
                "cx" : canvas.width/4 + Math.random() * 200,
                "cy" : canvas.height/2 - 200 + Math.random() * 400
              }, 500, "<>", function() {
                var line = canvas.path();
                node.lines.push(line);
                drawLine(line, node, dep);
                styleLine(line);
                node.drag(function() { drawLine(line, node, dep); });
                dep.drag(function() { drawLine(line, node, dep); });
              });
              //dep.centered = true;
            });
          }
        }
      });
    }

    function eraseLines(selectedNode) {
      if(SHOW_EXTENDED_DEPENDENCIES) {
        nodeOp++;
        walkUpTree(selectedNode,
          function(node) {
            node.lines.map(function(el) {
              el.remove();
            });
            node.lines = [];
            node.undrag();
            node.drag(handleDrag, null, null, node);
          },
          function() {}, "ERASELINES", true); //have it repeat for security.  Careful with cycles here.
        setStartingPosition(selectedNode, true);
      } else {
        selectedNode.lines.map(function(el) {
          el.remove();
        });
        var nodeDeps = selectedNode.dependencies;
        if(!nodeDeps) { return; }
        nodeDeps.map(function(el) {
          var dep = canvas.getById(el);
          if(!dep) return;
          setStartingPosition(dep, true);
        });

        selectedNode.lines = [];
        selectedNode.undrag();
        selectedNode.drag(handleDrag, null, null, selectedNode);
        setStartingPosition(selectedNode, true);
      }
    }

    function walkUpTree(node, nodeFn, nodeDepFn, operation, repeat) {
      repeat = repeat || false;
      op = (operation + nodeOp.toString()) || "generic";
      if(node.operations.indexOf(op) !== -1 && !repeat) { return; } //controls for whether or not to repeat operations on a node
      node.operations.push(operation);
      if(nodeFn) { nodeFn(node); }
      var nodeDeps = node.dependencies;
      if(nodeDeps) {
        nodeDeps.map(function(el) {
          var dep = canvas.getById(el);
          if(!dep) {return;} //sometimes dependencies aren't found due to file system irregularites.  This should probably be fixed at some point...
          if(nodeDepFn) { nodeDepFn(node, dep); }
          walkUpTree(dep, nodeFn, nodeDepFn, operation, repeat);
        });
      }
    }

    function setStartingPosition(node, animate) {
      var cx, cy, angle;

      //When thinking about the angle here, flip the diagram 90 degrees to the search section (left edge on the screen) lies at the bottom
      //So when I say 60 to 90 degrees, for example, it means approximately bottom right quadrant

      if(node.score >= 5) {
        //sweep out 60 to 90 degrees
        angle = Math.PI/3 + Math.random() * Math.PI/6;
      }
      else if(node.score == 1) {
        //sweep out 0 to 60 degrees
        angle = Math.random() * Math.PI/3;
      }
      else if(node.pureDependent) {
        //sweep out 90 to 120 degrees
        angle = Math.PI/2 + Math.random() * Math.PI/6;
      } else {
        //sweep out 120 to 180 degrees
        angle = 2*Math.PI/3 + Math.random() * Math.PI/3
      }

      //var angle = Math.random() * Math.PI;
      var locusX = canvas.width/4;
      var locusY = canvas.height/2;
      var locusR = 400;
      var buffer = 50;

      var xBound = (canvas.width - locusX) / Math.sin(angle);
      //yBound calculation assumes vertical centering of locus
      var yBound = Math.abs(canvas.height - locusY) / Math.abs(Math.cos(angle));

      var length = xBound > yBound ? locusR + Math.random()*(yBound - locusR - buffer) : locusR + Math.random()*(xBound - locusR - buffer);
      cx = locusX + length * Math.sin(angle);
      cy = locusY + length * Math.cos(angle);


      if(animate) {
        node.animate({
          "cx" : cx,
          "cy" : cy
        }, 500, "<>");
      } else {
        node.attr("cx", cx);
        node.attr("cy", cy);
      }
    }

    function styleNode(node) {
      node.attr("fill", colorHash(node.id));
      node.attr("stroke", "none");
      node.attr("stroke-width", 2);
      node.attr("r", node.score <= 0 ? 10 : 15 * Math.log(node.score) + 10);
    }

    function handleDrag(dx, dy, x, y) {
      this.attr("cx", x);
      this.attr("cy", y);
    }

    function hiliteNode() {
      // this = node. passed in by context.
      this.attr("stroke", "#fff");
      var x = this.attr("cx");
      var y = this.attr("cy");
      var r = this.attr("r");
      var box = canvas.rect();
      /*box.insertBefore(node);
      box.attr("width", 200);
      box.attr("height", 20);
      box.attr("x", x);
      box.attr("y", y - 2*r);
      box.attr("fill", "white");
      box.attr("stroke", "none");
      node.box = box;*/
      if(!this.labelText) {
        var text = canvas.text(x + r, y - r, this.id);
        text.attr({
          "text-anchor" : "start",
          "fill" : "white",
          "font-size" : 14,
          "font-family" : "Helvetica"
        });
        this.labelText = text;
      }
    }

    function unHiliteNode() {
      this.attr("stroke", "none");
      //node.box.remove();
      if(this.labelText) {
        this.labelText.remove();
        delete this.labelText;
      }
    }

    function styleLine(line) {
      line.attr("arrow-end", "block-wide-long");
      line.attr("stroke", "#FFF");
      line.attr("stroke-width", 1);
    }
    
    function drawLine(line, node, dep) {
      line.attr("path", [
        "M", node.attr("cx"), node.attr("cy"),
        "L", dep.attr("cx"), dep.attr("cy")
      ]);
    }

    function colorHash(name) {
      //name will be fully qualified file path
      //we want scripts in the same folder to have the same color
      //eliminate file name
      var folderPathRegex = new RegExp(/((\w+\/)+)\w+/g);
      var match = folderPathRegex.exec(name);
      if(!match) { return "#FFF"; }
      match = match[1];
      var colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c", "#bdc3c7", "#c0392b"];
      return colors[match.length % colors.length];

    }

    //Draw lines between nodes
    //There's probably some fancy algorithm to optimize this, but I'm probably not going to use it.
    //UNCOMMENT TO SEE SHITSHOW
    /*dataKeys.map(function(el) {
      var node = canvas.getById(el);
      if(!node) { return; }
      var nodeDeps = node.dependencies;
      if(!nodeDeps) { return; }
      node.used = true; //if it has dependencies, we want to show it on screen
      nodeDeps.map(function(dependency) {
        var dep = canvas.getById(dependency);
        //hacky, fix eventually
        if(!dep) return;
        //draw the line
        var line = canvas.path();
        drawLine(line, node, dep);
        styleLine(line);

        node.drag(function() { drawLine(line, node, dep); });
        dep.drag(function() { drawLine(line, node, dep); });

        //mark the dependency as having a dependent.  Thus, should be on screen
        dep.used = true;
        dep.score++;
      });
    });*/

    //set up node search
    $('#searchbar').keyup(function() {
      var text = $(this).val();
      yOffset = 150; //starting
      //if(text.length == 0) {
      //}

      //wait to search
      setTimeout(function() {
        //check to see that text hasn't changed from when the timeout was set
        if(text !== $('#searchbar').val()) { return; }
        //check to see that the search string isn't blank
        if(text.length == 0) {
          allNodes.forEach(function(node) {
            if(node.centered) {
              unHiliteNode.call(node);
              setStartingPosition(node, true);
              node.centered = false;
            }
          });
          return;
        }

        allNodes.forEach(function(node) {
          if(node.id.indexOf(text) != -1) {
            unHiliteNode.call(node);
            node.animate({
              "cx": 50,
              "cy": yOffset + 10 + node.attr("r")
            }, 1000, "<>", function() {
              //setTimeout(function() { hiliteNode.call(node); }, 500); //fudge time.
              node.centered = true;
              hiliteNode.call(node);
            });
            yOffset += 10 + node.attr("r") * 2;
          }
          else {  
            if(node.centered) {
              unHiliteNode.call(node);
              setStartingPosition(node, true);
              node.centered = false;
            }
          }
        });
      }, 500);
    });
	});
});