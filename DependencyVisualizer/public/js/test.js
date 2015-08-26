$(document).ready(function() {
	$.get("/map", function(data) {
		console.log(data);

    var canvas = Raphael(0,0,window.innerWidth, window.innerHeight);
    canvas.canvas.style.backgroundColor = "#333";

    //Draw nodes
    Object.keys(data).map(function(el) {
      var node = canvas.circle(Math.random() * canvas.width, Math.random() * canvas.height, 15);
      node.id = el;
      node.attr("fill", "#f04");
      node.attr("stroke", "none");
      node.score = 0;
      node.used = false; //whether or not this node has either dependencies or dependents
      node.dependencies = data[el].dependencies;
      //if(data[el].dependencies) {
        //console.log(data[el].dependencies);
        //node.attr("cy", data[el].dependencies.length + 20);
      //}

      //NEED TO REFACTOR THE ORDER OF EVERYTHING HERE SO YOU'RE NOT DOING SO MUCH EDGE CASE CHECKING

      //make only relevant lines show somehow (option to turn all lines on and off?  hiding all lines is gonna be difficult i suppose...well, make it a function)
      //fix singleton no dependency node...always sseems to be at least 1...

      node.mousedown(function() {
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
      });

      node.mouseup(function() {
        /*walkUpTree(node, function(thisNode) {
          if(thisNode.nodeGlow) {
            thisNode.nodeGlow.remove();
            thisNode.nodeGlow = null;
          }
        });*/
      });

      function walkUpTree(node, nodeFn) {
        nodeFn(node);
        var nodeDeps = node.dependencies;
        if(nodeDeps) {
          nodeDeps.map(function(el) {
            walkUpTree(canvas.getById(el), nodeFn);
          });
        }
      }

      node.drag(function onMove(dx,dy, x, y) {
        node.attr("cx", x);
        node.attr("cy", y);
      })
    });

    //Draw lines between nodes
    //There's probably some fancy algorithm to optimize this, but I'm probably not going to use it.
    Object.keys(data).map(function(el) {
      var node = canvas.getById(el);
      var nodeDeps = node.dependencies;
      if(!nodeDeps) { return; }
      node.used = true; //if it has dependencies, we want to show it on screen
      nodeDeps.map(function(dep) {
        var dependency = canvas.getById(dep);
        //hacky, fix eventually
        if(!dependency) return;
        //draw the line
        var line = canvas.path([
          "M", node.attr("cx"), node.attr("cy"),
          "L", dependency.attr("cx"), dependency.attr("cy"),
        ]);
        line.attr("arrow-end", "classic-wide");
        line.attr("stroke", "#FFF");
        line.attr("stroke-width", 1);

        node.drag(handleDrag);
        dependency.drag(handleDrag);

        //mark the dependency as having a dependent.  Thus, should be on screen
        dependency.used = true;
        dependency.score++;

        function handleDrag() {
          line.attr("path", [
            "M", node.attr("cx"), node.attr("cy"),
            "L", dependency.attr("cx"), dependency.attr("cy"),
          ]);
        }
      });
    });
    
    //generate scores and whether a node is 'used' or not
    /*Object.keys(data).map(function(el) {
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
    })*/

    //Prune all unused nodes
    Object.keys(data).map(function(el) {
      var node = canvas.getById(el);
      if(!node.used) {
        node.remove();
      }
    });
	});
});