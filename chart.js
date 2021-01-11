// prettier-ignore

import * as d3 from "d3"
import { timeFormat } from "d3"

async function drawLineChart() {
  // ********************************************************************************
  // 1. Access the data
  // ********************************************************************************

  let dataset = await d3.csv("./data/data.csv")

  const yAccessor = (d) => parseInt(d.count)
  const dateParser = d3.timeParse("%m/%d")
  const dateFormatter = d3.timeFormat("%Y-%m-%d")
  const xAccessor = (d) => { return dateParser((d.date.match(/^\d{1,2}\/\d{1,2}/))[0]); };
  dataset = dataset.sort((a, b) => xAccessor(a) - xAccessor(b))

  // Group the data by year
  let dataByYear = d3.group(dataset, d => d.year)
  // Convert the Map to an Array
  dataByYear = Array.from(dataByYear)

  // ********************************************************************************
  // 2. Create chart dimensions
  // ********************************************************************************

  let dimensions = {
    width: 900,
    height: 540,
    margin: {
      top: 15,
      right: 60,
      bottom: 40,
      left: 60,
    },
  }

  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // ********************************************************************************
  // 3. Draw the canvas
  // ********************************************************************************

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    )

  // ********************************************************************************
  // 4. Create scales
  // ********************************************************************************

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice(8)

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice()

  // ********************************************************************************
  // 5. Draw data
  // ********************************************************************************

  const dots = bounds
    .selectAll(".dot")
    .data(dataset)
    .join("circle")
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("r", 2)
    .attr("class", "dot")

  const lineGenerator = d3.line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .curve(d3.curveBasis)

  const lines = bounds.selectAll("lines")
    .data(dataByYear)
    .enter()
    .append("g")

  lines
    .append("path")
    .attr("class", "line")
    .attr('d', d => lineGenerator(d[1]));

  // ********************************************************************************
  // 6. Draw peripherals
  // ********************************************************************************

  console.log(yScale(yAccessor(dataByYear[0][1][dataByYear[0][1].length - 1])));
  console.log(dimensions.boundedWidth);

  const lineLabels = bounds.selectAll(".line-label")
      .data(dataByYear)
    .enter().append("text")
      .attr("x", dimensions.boundedWidth - dimensions.margin.right + 20)
      .attr("y", (d) => yScale(yAccessor(d[1][d[1].length - 1])))
      .text(d => d[0])
      .attr("class", "line-label")

  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(3)

  const yAxis = bounds.append("g").attr("class", "y-axis").call(yAxisGenerator)

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .tickFormat(d => {
      // This fixes our trailing January
      // documentation here: https://github.com/d3/d3-axis
      if (timeFormat("%Y")(d) > 1900) {
        return ""
      } else {
        return timeFormat("%b")(d)
      }
    })

  const xAxis = bounds.append("g")
    .attr("class", "x-axis")
    .call(xAxisGenerator)
      .style("transform", `translateY(${
        dimensions.boundedHeight
      }px)`)

  const yAxisLabelSuffix = bounds.append("text")
    .attr("y", 64)
    .text("weekly trail usage")
    .attr("class", "y-axis-label y-axis-label-suffix")
}
drawLineChart()