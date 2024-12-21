// OverallBarChart.js

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import loadMovieData from "../loadMovieData.js";
import "./OverallBarChart.css";

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

const OverallBarChart = ({ ratingFactor, awardFactor }) => {
  const overallSvgRef = useRef();
  const [movieRatings, setMovieRatings] = useState({});
  const [overallTotalSums, setOverallTotalSums] = useState({});

  useEffect(() => {
    loadMovieData("data/2012~2023.csv")
      .then((movieData) => {
        const ratingsMap = movieData.reduce((acc, movie) => {
          acc[movie.영화명] = movie;
          return acc;
        }, {});
        setMovieRatings(ratingsMap);

        const years = Array.from({ length: 2023 - 2012 + 1 }, (_, i) => 2012 + i);
        const promises = years.map((yr) =>
          d3.csv(`${process.env.PUBLIC_URL}/data/${yr}.csv`)
        );

        Promise.all(promises).then((allData) => {
          const overallSums = {};

          allData.forEach((yearData) => {
            const headers = Object.keys(yearData[0]).slice(1);
            const parsedData = yearData.slice(1).map((row) => {
              const cleanedRow = { week: +row.week };
              headers.forEach((movie) => {
                const rawValue = row[movie]?.toString().replace(/,/g, "") || "0";
                if (ratingsMap[movie]) {
                  const ratingMultiplier =
                    ratingFactor > 0 ? ratingsMap[movie].관람평점 * ratingFactor : 0;
                  const awardMultiplier =
                    awardFactor > 0 ? ratingsMap[movie].수상횟수 * awardFactor : 0;
                  cleanedRow[movie] =
                    (+rawValue || 0) * (1 + ratingMultiplier + awardMultiplier);
                } else {
                  cleanedRow[movie] = +rawValue || 0;
                }
              });
              return cleanedRow;
            });

            headers.forEach((movie) => {
              const total = parsedData.reduce(
                (sum, weekData) => sum + (weekData[movie] || 0),
                0
              );
              if (overallSums[movie]) {
                overallSums[movie] += total;
              } else {
                overallSums[movie] = total;
              }
            });
          });

          setOverallTotalSums(overallSums);
        });
      })
      .catch((error) => {
        console.error("Error loading movie data:", error);
      });
  }, [ratingFactor, awardFactor]);

  useEffect(() => {
    if (!overallSvgRef.current || Object.keys(overallTotalSums).length === 0) return;

    const drawChart = () => {
      d3.select(overallSvgRef.current).selectAll("*").remove();

      const containerWidth = overallSvgRef.current.parentElement.offsetWidth;
      const margin = { top: 0, right: 40, bottom: 40, left: 100 };
      const barHeight = 20;

      const sortedMovies = Object.entries(overallTotalSums)
        .sort((a, b) => b[1] - a[1])
        .map(([movie, sum]) => ({ movie, sum }))
        .reverse();

      const svgHeight = sortedMovies.length * barHeight + margin.top + margin.bottom;

      const svgWidth = Math.min(containerWidth, 400);
      const width = svgWidth - margin.left - margin.right;
      const height = svgHeight - margin.top - margin.bottom;

      const svg = d3
        .select(overallSvgRef.current)
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      const scaleFactor = 0.9;
      const chartGroup = svg
        .append("g")
        .attr("class", "chart-group")
        .attr(
          "transform",
          `translate(${margin.left},${margin.top}) scale(${scaleFactor})`
        );

      const x = d3
        .scaleLinear()
        .domain([0, d3.max(sortedMovies, (d) => d.sum)])
        .nice()
        .range([0, width]);

      const y = d3
        .scaleBand()
        .domain(sortedMovies.map((d) => d.movie))
        .range([height, 0])
        .padding(0.25);

      const xAxisGrid = d3.axisBottom(x)
        .ticks(5) 
        .tickSize(-height) 
        .tickFormat("");

      chartGroup
        .selectAll(".x-grid")
        .data([null])
        .join("g")
        .attr("class", "x-grid")
        .attr("transform", `translate(0,${height})`)
        .lower()
        .call(xAxisGrid)
        .selectAll("line")
        .style("stroke", "#ddd")
        .style("stroke-width", 2) 
        .style("stroke-dasharray", "3, 3");;

      chartGroup
        .select(".x-grid .domain")
        .remove(); 

      chartGroup
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(5)
            .tickFormat((d) => {
              if (d >= 1e12) return (d / 1e12).toFixed(1) + "T";
              if (d >= 1e9) return (d / 1e9).toFixed(1) + "B";
              if (d >= 1e6) return (d / 1e6).toFixed(1) + "M";
              if (d >= 1e3) return (d / 1e3).toFixed(1) + "K";
              return d;
            })
        );

      const overalltooltip = d3.select("body")
        .selectAll(".overalltooltip")
        .data([null])
        .join("div")
        .attr("class", "overalltooltip")
        .style("position", "absolute")
        .style("background", "#333")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("white-space", "nowrap")
        .style("opacity", 0);

      chartGroup
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .style("fill", "#666")
        .style("text-anchor", "end")
        .each(function (d) {
          const text = d3.select(this);
          const maxWidth = 77;

          let title = d;
          text.text(title);

          if (this.getComputedTextLength() > maxWidth) {
            while (this.getComputedTextLength() > maxWidth && title.length > 0) {
              title = title.slice(0, -1);
              text.text(title + "...");
            }
          }

          text
            .on("mouseenter", function (event) {
              overalltooltip
                .style("opacity", 1)
                .html(d)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", function (event) {
              overalltooltip
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseleave", function () {
              overalltooltip.style("opacity", 0);
            });
        });




      chartGroup
        .selectAll(".bar")
        .data(sortedMovies, (d) => d.movie)
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("class", "bar")
              .attr("x", 0)
              .attr("y", (d) => y(d.movie))
              .attr("width", 0)
              .attr("height", y.bandwidth())
              .style("rx", 3)
              .attr("fill", (d) => {
                const genre = movieRatings[d.movie]?.장르;
                return genreColors[genre] || "#ccc";
              })
              .transition()
              .duration(800)
              .attr("width", (d) => x(d.sum)),
          (update) =>
            update
              .transition()
              .duration(800)
              .attr("x", 0)
              .attr("y", (d) => y(d.movie))
              .attr("width", (d) => x(d.sum))
              .attr("height", y.bandwidth()),
          (exit) => exit.remove()
        );

      chartGroup
        .selectAll(".label")
        .data(sortedMovies, (d) => d.movie)
        .join(
          (enter) =>
            enter
              .append("text")
              .attr("class", "label")
              .attr("x", (d) => x(d.sum) + 5)
              .attr("y", (d) => y(d.movie) + y.bandwidth() / 2)
              .attr("dy", "0.3em")
              .attr("text-anchor", "start")
              .style("font-size", "13px")
              .style("font-weight", "bold")
              .text((d) => {
                const sum = d.sum;
                if (sum >= 1e12) return (sum / 1e12).toFixed(1) + "T";
                if (sum >= 1e9) return (sum / 1e9).toFixed(1) + "B";
                if (sum >= 1e6) return (sum / 1e6).toFixed(1) + "M";
                if (sum >= 1e3) return (sum / 1e3).toFixed(1) + "K";
                return sum;
              }),
          (update) =>
            update
              .attr("x", (d) => x(d.sum) + 5)
              .attr("y", (d) => y(d.movie) + y.bandwidth() / 2)
              .style("font-size", "8px")
              .text((d) => {
                const sum = d.sum;
                if (sum >= 1e12) return (sum / 1e12).toFixed(1) + "T";
                if (sum >= 1e9) return (sum / 1e9).toFixed(1) + "B";
                if (sum >= 1e6) return (sum / 1e6).toFixed(1) + "M";
                if (sum >= 1e3) return (sum / 1e3).toFixed(1) + "K";
                return sum;
              }),
          (exit) => exit.remove()
        );
    };

    drawChart();
    window.addEventListener("resize", drawChart);
    return () => window.removeEventListener("resize", drawChart);
  }, [overallTotalSums, movieRatings]);

  return (
    <div className="overall-bar-chart">
      <svg ref={overallSvgRef}></svg>
    </div>
  );
};

export default OverallBarChart;
