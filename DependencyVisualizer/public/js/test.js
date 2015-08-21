$(document).ready(function() {
	$.get("/map", function(data) {
		console.log(data);

    var canvas = Raphael(0,0,window.innerWidth, window.innerHeight);
    canvas.canvas.style.backgroundColor = "#333";
    /*var circle = canvas.circle(50,40,10);
    circle.attr("fill", "#f00");
    circle.attr("stroke", "#000");

    circle.mousedown(function() {
      console.log("YOU CLICKED THE CIRCLE!");
    });*/

    //D3 and Raphael do not play nicely together

    /*testData.map(function(el) {
      var circle = canvas.circle(Math.random() * 300, Math.random() * 300, 10);
      circle.attr("fill", "#f00");
      circle.data("name", "circle"+el);
      circle.mousedown(function() {
        console.log(circle.data("name"));
      });
      circle.drag(function onMove(dx, dy, x, y) {
        circle.attr("cx", x);
        circle.attr("cy", y);
      });
    });*/

    //Draw nodes
    Object.keys(data).map(function(el) {
      var node = canvas.circle(Math.random() * canvas.width, Math.random() * canvas.height, 30);
      node.id = el;
      node.attr("fill", "#f04");
      node.data("file", el);
      node.data("dependencies", data[el].dependencies);

      node.mousedown(function() {
        console.log("Name: " + node.data("file"));
        console.log("Dependencies: " + node.data("dependencies"));
      });

      node.drag(function onMove(dx,dy, x, y) {
        node.attr("cx", x);
        node.attr("cy", y);
      })
    });

    //Draw lines between nodes
    //There's probably some fancy algorithm to optimize this, but I'm probably not going to use it.
    Object.keys(data).map(function(el) {
      var node = canvas.getById(el);
      var nodeDeps = node.data("dependencies");
      if(!nodeDeps) { return; }
      nodeDeps.map(function(dep) {
        var dependency = canvas.getById(dep);
        //draw the line
        var line = canvas.path([
          "M", node.attr("cx"), node.attr("cy"),
          "L", dependency.attr("cx"), dependency.attr("cy"), 
        ]);
        line.attr("stroke", "#FFF");
        line.attr("stroke-width", 3);

        node.drag(handleDrag);
        dependency.drag(handleDrag);

        function handleDrag() {
          line.attr("path", [
            "M", node.attr("cx"), node.attr("cy"),
            "L", dependency.attr("cx"), dependency.attr("cy"),
          ]);
        }

        //to properly update lines - can we bind each circle to the line somehow, and then call a change event when the line change?
          // Trigger - underscore?  events or something?
          //Figure out how to update line paths
          //Store the proper nodes in each line
          //Fire the drag event every time a thing moves and process it here.  Actually if you can do that it solves our binding problem.
          //binding the function to the node means that we don't have to go digging for the node.
          //Seems like the key here is definitions of functions already in teh scope they need to be?
          //Alex, you're fucking dumb.

      });
    });
	})
});