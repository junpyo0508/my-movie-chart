import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import yearData from "../../yearData.json";
import "./DonutChart.css";

const genreColors = {
  Crime: "#C4B8AC",
  Horror: "#E17860",
  Comic: "#EAB86E",
  Ani: "#F8E699",
  Show: "#B6D288",
  Action: "#94AADB",
  Fantasy: "#D985C5",
  Adven: "#6EA9AF",
  SF: "#706A99",
  Roman: "#E897A6",
  Drama: "#FFAE56",
};

const genreMap = {
  범죄: "Crime",
  공포: "Horror",
  코미디: "Comic",
  애니메이션: "Ani",
  공연: "Show",
  액션: "Action",
  판타지: "Fantasy",
  모험: "Adven",
  SF: "SF",
  로맨스: "Roman",
  드라마: "Drama",
};

const DonutChart = ({ year }) => {
  const svgRef = useRef();

  useEffect(() => {
    let data = yearData[year] || [];

    data = data.map((item) => ({
      ...item,
      genre: genreMap[item.genre] || item.genre,
    }));

    const minThreshold = 0.025;
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

    const smallPieces = data.filter((d) => d.revenue / totalRevenue < minThreshold);
    const otherData = {
      genre: "etc",
      revenue: smallPieces.reduce((sum, d) => sum + d.revenue, 0),
      count: smallPieces.reduce((sum, d) => sum + d.count, 0),
    };

    data = data.filter((d) => d.revenue / totalRevenue >= minThreshold);
    if (otherData.revenue > 0) {
      data.push(otherData);
    }

    const width = 200;
    const height = 200;
    const innerRadius = 20;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie()
      .sort(null)
      .value((d) => d.revenue);

    const maxCount = d3.max(data, (d) => d.count); // 
    const minRadius = innerRadius + 20;
    const maxRadius = innerRadius + 60;

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius((d) => {
        const normalizedHeight = (d.data.count / maxCount) * (maxRadius - minRadius);
        return minRadius + normalizedHeight;
      });


    const color = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.genre))
      .range(Object.values(genreColors));

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    const arcs = svg
      .selectAll("g.arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("fill", (d) => color(d.data.genre))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t));
        };
      });

    arcs
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("transform", "scale(1.1)");

        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.data.genre}</strong><br/>
             매출: ${formatNumber(d.data.revenue)}<br/>
             영화 수: ${formatNumber(d.data.count)}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("transform", "scale(1)");
        tooltip.style("opacity", 0);
      });

    function formatNumber(d) {
      if (d >= 1e12) return (d / 1e12).toFixed(1) + "T";
      if (d >= 1e9) return (d / 1e9).toFixed(1) + "B";
      if (d >= 1e6) return (d / 1e6).toFixed(1) + "M";
      if (d >= 1e3) return (d / 1e3).toFixed(1) + "K";
      return d.toString();
    }

    return () => {
      tooltip.remove();
    };
  }, [year]);


  return (
    <div className="donut-chart">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DonutChart;
