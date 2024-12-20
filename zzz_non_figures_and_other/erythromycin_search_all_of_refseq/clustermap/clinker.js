function serialise(svg) {
	/* Saves the figure to SVG in its current state.
	 * Clones the provided SVG and sets the width/height of the clone to the
	 * bounding box of the original SVG. Thus, downloaded figures will be sized
	 * correctly.
	 * This function returns a new Blob, which can then be downloaded.
	*/
	let node = svg.node()
		.cloneNode(true)

	// Remove all hidden elements
	d3.select(node)
		.selectAll(".hidden")
		.remove()

	// Draw filtered node in hidden <div> to calculate real bounding box
	let container = svg.node().parentNode
	let div = d3.select(container)
		.append("div")
		.attr("visibility", "hidden")
	div.append(() => node)
	let bbox = div.select("g.clusterMapG").node().getBBox()
	div.remove()

	const xmlns = "http://www.w3.org/2000/xmlns/"
	const xlinkns = "http://www.w3.org/1999/xlink"
	const xhtml = "http://www.w3.org/1999/xhtml"
	const svgns = "http://www.w3.org/2000/svg"

	node.setAttribute("width", bbox.width);
	node.setAttribute("height", bbox.height);
	node.setAttributeNS(xmlns, "xmlns", svgns);
	node.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
	node.setAttributeNS(xmlns, "xmlns:xhtml", xhtml);

	// Adjust x/y of <g> to account for axis/title position.
	// Replaces the transform attribute, so drag/zoom is ignored.
	d3.select(node)
		.select("g.clusterMapG")
		.attr("transform", `translate(${Math.abs(bbox.x)}, ${Math.abs(bbox.y)})`)

	const serializer = new window.XMLSerializer;
	const string = serializer.serializeToString(node);
	return new Blob([string], {type: "image/svg+xml"});
}

function download(blob, filename) {
	/* Downloads a given blob to filename.
	 * This function appends a new anchor to the document, which points to the
	 * supplied blob. The anchor.click() method is called to trigger the download,
	 * then the anchor is removed.
	*/
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function plot(data) {
  const div = d3.select("#plot")
  const chart = ClusterMap.ClusterMap()
    .config({
      scaleFactor: 30, 
      cluster: {
        spacing: 50,
        alignLabels: true,
      },
      gene: {
        label: {
          show: false,
        }
      },
    })

  let plot = d3.select("#plot")
		.data([data])
    .call(chart)

  d3.select("#btn-save-svg")
    .on("click", () => {
			const svg = div.select("svg.clusterMap")
			const blob = serialise(svg)
			download(blob, "clinker.svg")
		})

	/**
	 * Saves current chart config and data to JSON.
	 * Can be loaded back into the clinker webapp using loadData().
	 */
	function saveData() {
		const obj = { config: chart.config(), data: chart.data() }
		const blob = new Blob(
			[JSON.stringify(obj, null, 2)],
			{type: "application/json"}
		);
		download(blob, "clinker.json")
	}

	/**
	 * Loads JSON generated by saveData() into clinker webapp.
	 * Should contain config and data properties.
	 */
	function loadData(event) {
		const files = event.target.files
		const file = files[0]
		if (!file) return
		const reader = new FileReader()
		reader.readAsText(file)
		reader.onload = function() {
			let newData = JSON.parse(reader.result)
			chart.config(newData.config)
			plot.selectAll("*").remove()
			plot.data([newData.data])
			plot.call(chart)
		}
		reader.onerror = function() {
			console.log("Failed to load data", reader.error)
		}
	}

	// Bind save/load
	d3.select("#btn-save-data")
		.on("click", () => saveData("clinker.json"))
	d3.select("#input-load-data")
		.on("change", loadData)

  function update(opts) {
    chart.config(opts) 
    plot.call(chart)
  }

  // Populate label type multi select and bind change handler
  let labelTypes = new Set()
  data.clusters.forEach(cluster => {
    cluster.loci.forEach(locus => {
      locus.genes.forEach(gene => Object.keys(gene.names).forEach(type => labelTypes.add(type)))
    })
  })
  const changeLabel = event => {
    const type = event.target.value
    d3.selectAll("text.geneLabel")
      .each(d => d.label = d.names[type] ? d.names[type] : d.label)
    update({})
  }
  let select = d3.select("#select-label-type")
    .on("change", changeLabel)
  select.selectAll("option")
    .data(labelTypes)
    .join("option")
    .attr("value", d => d)
    .text(d => d)

  // Figure layout
  d3.select("#input-scale-factor")
    .on("change", function() {update({plot: {scaleFactor: +this.value}})})
  d3.select("#input-cluster-spacing")
    .on("change", function() {update({cluster: {spacing: +this.value}})})
  d3.select("#input-scale-genes")
    .on("change", function() {update({plot: {scaleGenes: d3.select(this).property("checked")}})})

  // Cluster
  d3.select("#input-cluster-align-labels")
    .on("change", function() {update({cluster: {alignLabels: d3.select(this).property("checked")}})})
  d3.select("#input-cluster-hide-coords")
    .on("change", function() {update({cluster: {hideLocusCoordinates: d3.select(this).property("checked")}})})
  d3.select("#input-cluster-name-size")
    .on("change", function() {update({cluster: {nameFontSize: +this.value}})})
  d3.select("#input-locus-name-size")
    .on("change", function() {update({cluster: {lociFontSize: +this.value}})})
  d3.select("#input-locus-spacing")
    .on("change", function() {update({locus: {spacing: +this.value}})})

  // Gene polygon shape
  d3.select("#input-body-height")
    .on("change", function() {update({gene: {shape: {bodyHeight: +this.value}}})})
  d3.select("#input-tip-height")
    .on("change", function() {update({gene: {shape: {tipHeight: +this.value}}})})
  d3.select("#input-tip-length")
    .on("change", function() {update({gene: {shape: {tipLength: +this.value}}})})
  d3.select("#input-gene-stroke-colour")
    .on("change", function() {update({gene: {shape: {stroke: this.value}}})})
  d3.select("#input-gene-stroke-width")
    .on("change", function() {update({gene: {shape: {strokeWidth: +this.value}}})})

  // Gene labels
  d3.select("#input-gene-labels")
    .on("change", function() {update({gene: {label: {show: d3.select(this).property("checked")}}})})
  d3.select("#input-label-rotation")
    .on("change", function() {update({gene: {label: {rotation: +this.value}}})})
  d3.select("#input-label-start")
    .on("change", function() {update({gene: {label: {start: +this.value}}})})
  d3.select("#select-label-anchor")
    .on("change", function() {update({gene: {label: {anchor: this.value}}})})
  d3.select("#input-label-size")
    .on("change", function() {update({gene: {label: {fontSize: +this.value}}})})
  d3.select("#input-label-spacing")
    .on("change", function() {update({gene: {label: {spacing: +this.value}}})})
  d3.select("#select-label-position")
    .on("change", function() {update({gene: {label: {position: this.value}}})})

  // Scale bar
  d3.select("#input-scalebar-fontsize")
    .on("change", function() {update({scaleBar: {fontSize: +this.value}})})
  d3.select("#input-scalebar-height")
    .on("change", function() {update({scaleBar: {height: +this.value}})})
  d3.select("#input-scalebar-basepair")
    .on("change", function() {update({scaleBar: {basePair: +this.value}})})
  d3.select("#input-scalebar-margin-top")
    .on("change", function() {update({scaleBar: {marginTop: +this.value}})})
  
  // Colour bar
  d3.select("#input-colourbar-fontsize")
    .on("change", function() {update({colourBar: {fontSize: +this.value}})})
  d3.select("#input-colourbar-height")
    .on("change", function() {update({colourBar: {height: +this.value}})})
  d3.select("#input-colourbar-margin-top")
    .on("change", function() {update({colourBar: {marginTop: +this.value}})})

  // Legend
  d3.select("#input-legend-fontsize")
    .on("change", function() {update({legend: {fontSize: +this.value}})})
  d3.select("#input-legend-entryheight")
    .on("change", function() {update({legend: {entryHeight: +this.value}})})
  d3.select("#input-legend-margin-left")
    .on("change", function() {update({legend: {marginLeft: +this.value}})})

  // Links
  d3.select("#input-link-show")
    .on("change", function() {update({link: {show: d3.select(this).property("checked")}})})
  d3.select("#input-link-best-only")
    .on("change", function() {update({link: {bestOnly: d3.select(this).property("checked")}})})
  d3.select("#input-link-as-line")
    .on("change", function() {update({link: {asLine: d3.select(this).property("checked")}})})
  d3.select("#input-link-straight")
    .on("change", function() {update({link: {straight: d3.select(this).property("checked")}})})
  d3.select("#input-link-group-colour")
    .on("change", function() {update({link: {groupColour: d3.select(this).property("checked")}})})
  d3.select("#input-link-stroke-width")
    .on("change", function() {update({link: {strokeWidth: +this.value}})})
  d3.select("#input-link-threshold")
    .on("change", function() {update({link: {threshold: +this.value}})})
  d3.select("#input-link-fontsize")
    .on("change", function() {update({link: {label: {fontSize: +this.value}}})})
  d3.select("#input-link-label-pos")
    .on("change", function() {update({link: {label: {position: +this.value}}})})
  d3.select("#input-link-label-show")
    .on("change", function() {update({link: {label: {show: d3.select(this).property("checked")}}})})
  d3.select("#input-link-labelbg-show")
    .on("change", function() {update({link: {label: {background: d3.select(this).property("checked")}}})})
}

if (typeof data === 'undefined') {
  const data = d3.json("data.json").then(plot)
} else {
  plot(data)
}