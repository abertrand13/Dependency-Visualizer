$(document).ready(function() {
	$.get("/map", function(data) {
    var canvas = Raphael(0,0,window.innerWidth, window.innerHeight);
    canvas.canvas.style.backgroundColor = "#333";

    var dataKeys = Object.keys(data);
    var selectedNode;

    //Draw nodes
    dataKeys.map(function(el) {
      var node = canvas.circle(Math.random() * canvas.width, Math.random() * canvas.height, 15);
      node.id = el;
      node.attr("fill", "#f04");
      node.attr("stroke", "none");
      node.score = 0;
      node.used = false; //whether or not this node has either dependencies or dependents (TBD)
      node.dependencies = data[el].dependencies;
      node.lines = [];
      node.operations = [];;

      var nodeOp = 0; //keep track of node ops.

      //add listeners for various important events
      node.mouseup(function() {
        /*console.log("Name: " + node.data("file"));
        console.log("Dependencies: " + node.data("dependencies"));
        console.log("Score: " + node.data("score"));*/

        /*walkUpTree(node, function(thisNode) {
          thisNode.nodeGlow = thisNode.glow({
            color : "#0FF",
            width : 20,
            opacity : 1
          });
        });*/

        if(selectedNode !== node) {
          //erase lines from the old node
          if(selectedNode) {
            nodeOp++;
            walkUpTree(selectedNode,
              function(node) {
                //debugger;
                if(node.lines) { //we need this check for dependencies that get called here, but not to create lines (because they themselves have no dependencies)
                  //console.log(node.lines.length);
                  node.lines.map(function(el) {
                    //console.log("Removing a line");
                    el.remove();
                  });
                  node.lines = [];
                }
              },
              function() {}, "ERASELINES", true); //have it repeat for security.  Careful with cycles here.
          }
          //draw lines from the newly clicked node
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
        }
        selectedNode = node;
      });

      //USED TO BE MOUSEUP
      node.mousedown(function() {
        /*walkUpTree(node, function(thisNode) {
          if(thisNode.nodeGlow) {
            thisNode.nodeGlow.remove();
            thisNode.nodeGlow = null;
          }
        });*/
      });

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

      node.drag(function onMove(dx,dy, x, y) {
        node.attr("cx", x);
        node.attr("cy", y);
      });
    });

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

    //Draw lines between nodes
    //There's probably some fancy algorithm to optimize this, but I'm probably not going to use it.
    //UNCOMMENT TO SEE SHITSHOW
    dataKeys.map(function(el) {
      var node = canvas.getById(el);
      var nodeDeps = node.dependencies;
      if(!nodeDeps) { return; }
      node.used = true; //if it has dependencies, we want to show it on screen
      nodeDeps.map(function(dependency) {
        var dep = canvas.getById(dependency);
        //hacky, fix eventually
        if(!dep) return;
        //draw the line
        var line = canvas.path();
        styleLine(line);
        drawLine(line, node, dep);

        node.drag(function() { drawLine(line, node, dep); });
        dep.drag(function() { drawLine(line, node, dep); });

        //mark the dependency as having a dependent.  Thus, should be on screen
        dep.used = true;
        dep.score++;
      });
    });
    
    //generate scores and whether a node is 'used' or not
    dataKeys.map(function(el) {
      var node = canvas.getById(el);
      var nodeDeps = node.dependencies;
      if(nodeDeps) {
        node.used = true;
        nodeDeps.map(function(dependency) {
          var dep = canvas.getById(dependency);
          if(dep) {
            dep.used = true;
            dep.score++;
          }
        });
      }
    });

    //Prune all unused nodes
    dataKeys.map(function(el) {
      var node = canvas.getById(el);
      if(!node.used) {
        node.remove();
      }
    });
	});
});