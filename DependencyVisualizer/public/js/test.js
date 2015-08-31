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
      node.attr("fill", "#f05");
      node.attr("stroke", "none");
      node.attr("stroke-width", 2); //fo lataz
      node.score = 0;
      node.used = false; //whether or not this node has either dependencies or dependents (TBD)
      node.dependencies = data[el].dependencies;
      node.lines = [];
      node.operations = [];
      node.pureDependent = true;

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

        console.log(node.id);
        console.log(node.used);
      });

      node.hover(function() {
          node.attr("stroke", "#fff");
          var x = node.attr("cx");
          var y = node.attr("cy");
          var r = node.attr("r");
          var box = canvas.rect();
          /*box.insertBefore(node);
          box.attr("width", 200);
          box.attr("height", 20);
          box.attr("x", x);
          box.attr("y", y - 2*r);
          box.attr("fill", "white");
          box.attr("stroke", "none");
          node.box = box;*/
          var text = canvas.text(x + r, y - r, node.id);
          text.attr({
            "text-anchor" : "start",
            "fill" : "white",
            "font-size" : 14,
            "font-family" : "Helvetica"
          });
          node.text = text;
        },
        function() {
          node.attr("stroke", "none");
          //node.box.remove();
          node.text.remove();
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
    
    // generate scores and whether a node is 'used' or not
    dataKeys.map(function(el) {
      var node = canvas.getById(el);
      var nodeDeps = node.dependencies;
      if(nodeDeps) {
        node.used = true;
        nodeDeps.map(function(dependency) {
          var dep = canvas.getById(dependency);
          if(dep) {
            dep.used = true;
            dep.pureDependent = false;
            dep.score++;
            node.score--;
          }
        });
      }
    });

    // Prune all unused nodes
    //figure out why bv/ugc/auth and scripts/scout are sticking around
    dataKeys.map(function(el) {
      var node = canvas.getById(el);
      if(!node.used) {
        node.remove();
      }
    });

    // Realizing now that we're taking up processing power going through nodes that aren't on screen.  WE'RE BURNING MOONLIGHT
    // possibly make a set of all nodes remaining after pruning (or do this during pruning) and then only work with those
    // NOTE TO SELF MAKE A SEARCH FEATURE OTHERWISE THIS IS USELESS

    //move nodes to places on screen that (might?!) make sense
    dataKeys.map(function(el) {
      var node = canvas.getById(el);
      var box = 300;
      //size nodes interestingly
      if(node) {
        //node.attr("r", node.score > 5 ? node.score : 5);
        node.attr("r", node.score <= 0 ? 10 : 15 * Math.log(node.score) + 10);
      }
      
      // Dependencies on bottom right, dependents on top left.
      /*if(node && node.score > 0) {
        node.attr("cx", Math.random() * box + canvas.width - box);
        node.attr("cy", Math.random() * box + canvas.height - box);
      }*/
      /*if(node && node.score < 0) {
        node.attr("cx", Math.random() * box);
        node.attr("cy", Math.random() * box);
      }*/

      //Heavy dependencies in center
      /*if(node && node.score > 10) {
        node.attr("cx", canvas.width/2 + (Math.random() * box) - box/2);
        node.attr("cy", canvas.height/2 + (Math.random() * box) - box/2);
      }
      if(node && node.score < 0) {
        node.attr("cx", Math.random() * canvas.width);
        node.attr("cy", 20);
      }
      if(node && node.score > 0 && node.score < 10) {
        node.attr("cx", Math.random() * canvas.width);
        node.attr("cy", canvas.height - 50);
      }*/

      //Dependents along center axis
      /*if(node && node.pureDependent) {
        var p = Math.random() * .9 + .05;
        node.attr("cx", p * canvas.width);
        node.attr("cy", p * canvas.height);
      }
      else if(node && node.score > 10) {
        if(Math.random() > .5) {
          node.attr("cx", Math.random() * box);
          node.attr("cy", canvas.height - Math.random() * box);
        } else {
          node.attr("cx", canvas.width - Math.random() * box);
          node.attr("cy", Math.random() * box);
        }
      }
      else if(node && node.score == 1) {
        node.attr("cx", 1.5*box + Math.random() * (canvas.width - box*3));
        node.attr("cy", canvas.height - 50);
      } else if(node) {
        node.attr("cx", Math.random() * box)
        node.attr("cy", Math.random() * box + box/2);
      }*/

      //Herp derp.
      if(node && node.score > 5) {
        node.attr("cx", canvas.width - Math.random() * box);
        node.attr("cy", canvas.height - Math.random() * box);
      }
      else if(node && node.score == 1) {
        node.attr("cx", Math.random() * canvas.width);
        node.attr("cy", canvas.height - 50);
      }
      else if(node && node.pureDependent) {
        node.attr("cx", 400 + Math.random() * (canvas.width-500) );
        node.attr("cy", 50);
      } else if(node) {
        node.attr("cx", 50 + 400 * Math.exp(-1 * node.attr("cy")/(canvas.height/4)));
      }
    });

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
	});
});