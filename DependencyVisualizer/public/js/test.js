$(document).ready(function() {

  $.get("/map", function(data) {
    //Set up canvas
    var canvas = Raphael(0,0,window.innerWidth, window.innerHeight);
    canvas.canvas.style.backgroundColor = "#2c3e50";
    var allNodes = canvas.set();
    var selectedNode;

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
      node.dependencies = data[el].dependencies || [];
      node.lines = [];
      node.operations = [];

      
      //Apply teh prettiez.
      styleNode(node);
      setStartingPosition(node);

      allNodes.push(node);


      //Add listeners to make things do things
      var nodeOp = 0;
      
      node.dblclick(function() {
        if(selectedNode !== node) {
          //erase lines from the old node
          if(selectedNode) {
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

      node.hover(hiliteNode, unHiliteNode, node, node);

      node.drag(handleDrag, null, null, node);

      node.click(function() {
        console.log(node);
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
    });

    function setStartingPosition(node) {
      var box = 300;

      if(node.score >= 5) {
        node.attr("cx", canvas.width - Math.random() * box);
        node.attr("cy", canvas.height - Math.random() * box);
      }
      else if(node.score == 1) {
        node.attr("cx", 200 + Math.random() * (canvas.width - 200 - box));
        node.attr("cy", canvas.height - 50);
      }
      else if(node.pureDependent) {
        node.attr("cx", 400 + Math.random() * (canvas.width-500) );
        node.attr("cy", 50);
      } else {
        node.attr("cy", 50 + Math.random() * (canvas.height-100));
        node.attr("cx", 50 + 400 * Math.exp(-1 * node.attr("cy")/(canvas.height/4)));
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
      allNodes.forEach(function(node) {
        if(node.id.indexOf(text) != -1 && text.length > 0) {
          hiliteNode.call(node);
        }
        else {  
          unHiliteNode.call(node);
        }
      });
    });
	});
});