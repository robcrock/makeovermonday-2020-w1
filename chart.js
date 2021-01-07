// prettier-ignore

import * as d3 from "d3"
import * as d3Collection from 'd3-collection';

async function drawLineChart() {
  // 1. Access data

  let dataset = await d3.csv("./data/data.csv")

  let dataByYear = d3Collection.nest()
    .key(d => d.year)
    .entries(dataset)

  console.log(dataByYear);

  const yAccessor = (d) => parseInt(d.count)
  const dateParser = d3.timeParse("%m/%d/%y")
  const dateFormatter = d3.timeFormat("%Y-%m-%d")
  const xAccessor = (d) => dateParser(d.date)
  dataset = dataset.sort((a, b) => xAccessor(a) - xAccessor(b))

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  }
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // 3. Draw canvas

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

  // BONUS Create chart sections

  const defs = bounds.append("defs")

  const gradientId = "timeline-gradient"
  const gradient = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad")

  const stops = ["#34495e", "#c8d6e5", "#34495e"]
  stops.forEach((stop, i) => {
    gradient
      .append("stop")
      .attr("offset", `${(i * 100) / (stops.length - 1)}%`)
      .attr("stop-color", stop)
      .attr("stop-opacity", 1)
  })

  // 4. Create scales

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice(8)

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])

  // 5. Draw data

  const seasonBoundaries = ["3-20", "6-21", "9-21", "12-21"]
  const seasonNames = ["Spring", "Summer", "Fall", "Winter"]

  let seasonsData = []
  const startDate = xAccessor(dataset[0])
  const endDate = xAccessor(dataset[dataset.length - 1])
  const years = d3.timeYears(d3.timeMonth.offset(startDate, -13), endDate)
  years.forEach((yearDate) => {
    const year = +d3.timeFormat("%Y")(yearDate)
    seasonBoundaries.forEach((boundary, index) => {
      const seasonStart = dateParser(`${year}-${boundary}`)
      const seasonEnd = seasonBoundaries[index + 1]
        ? dateParser(`${year}-${seasonBoundaries[index + 1]}`)
        : dateParser(`${year + 1}-${seasonBoundaries[0]}`)
      const boundaryStart = d3.max([startDate, seasonStart])
      const boundaryEnd = d3.min([endDate, seasonEnd])
      const days = dataset.filter(
        (d) => xAccessor(d) > boundaryStart && xAccessor(d) <= boundaryEnd
      )
      if (!days.length) return
      seasonsData.push({
        start: boundaryStart,
        end: boundaryEnd,
        name: seasonNames[index],
        mean: d3.mean(days, yAccessor),
      })
    })
  })

  // const seasonOffset = 10
  // const seasons = bounds
  //   .selectAll(".season")
  //   .data(seasonsData)
  //   .join("rect")
  //   .attr("x", (d) => xScale(d.start))
  //   .attr("width", (d) => xScale(d.end) - xScale(d.start))
  //   .attr("y", seasonOffset)
  //   .attr("height", dimensions.boundedHeight - seasonOffset)
  //   .attr("class", (d) => `season ${d.name}`)

  // draw the line

  // const areaGenerator = d3.area()
  //   .x((d) => xScale(xAccessor(d)))
  //   .y0(dimensions.boundedHeight / 2)
  //   .y1((d) => yScale(yAccessor(d)))
  //   .curve(d3.curveBasis)

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

  const line = bounds.selectAll("lines")
    .data(dataByYear)
    .enter()
    .append("g")

  line
    .append("path")
    .attr("class", "line")
    .attr("d", dataByYear.map(d => lineGenerator(d.values)))

  // 6. Draw peripherals

  // const seasonMeans = bounds
  //   .selectAll(".season-mean")
  //   .data(seasonsData)
  //   .join("line")
  //   .attr("x1", (d) => xScale(d.start))
  //   .attr("x2", (d) => xScale(d.end))
  //   .attr("y1", (d) => yScale(d.mean))
  //   .attr("y2", (d) => yScale(d.mean))
  //   .attr("class", "season-mean")

  // const seasonMeanLabel = bounds
  //   .append("text")
  //   .attr("x", -15)
  //   .attr("y", yScale(seasonsData[0].mean))
  //   .attr("class", "season-mean-label")
  //   .text("Season mean")

  // const seasonLabels = bounds
  //   .selectAll(".season-label")
  //   .data(seasonsData)
  //   .join("text")
  //   .filter((d) => xScale(d.end) - xScale(d.start) > 60)
  //   .attr("x", (d) => xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2)
  //   .attr("y", dimensions.boundedHeight + 30)
  //   .text((d) => d.name)
  //   .attr("class", "season-label")

  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(3)

  const yAxis = bounds.append("g").attr("class", "y-axis").call(yAxisGenerator)

  const yAxisLabelSuffix = bounds
    .append("text")
    .attr("y", 5.5)
    .text("relative humidity")
    .attr("class", "y-axis-label y-axis-label-suffix")

  bounds
    .append("line")
    .attr("x1", 0)
    .attr("x2", dimensions.boundedWidth)
    .attr("y1", dimensions.boundedHeight / 2)
    .attr("y2", dimensions.boundedHeight / 2)
    .attr("class", "y-axis-tick-2")
}
drawLineChart()