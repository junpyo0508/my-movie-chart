import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import loadMovieData from "./loadMovieData.js";
import "./MovieChart.css";

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

const filePath = "data/2012~2023.csv";

const MovieChart = ({ year, ratingFactor, awardFactor, revenueFactor, selectedGenre }) => {
  const svgRef = useRef();
  const popupSvgRef = useRef();
  const [data, setData] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const popupContentRef = useRef();
  const [movieRatings, setMovieRatings] = useState({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [totalSums, setTotalSums] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const togglePopup = () => {
    setIsPopupOpen((prev) => !prev);
  };

  useEffect(() => {
    loadMovieData(filePath)
      .then((movieData) => {
        const ratingsMap = movieData.reduce((acc, movie) => {
          acc[movie.영화명] = movie;
          return acc;
        }, {});
        setMovieRatings(ratingsMap);

        const sortedMovies = Object.values(ratingsMap).sort((a, b) => b.관람평점 - a.관람평점);
        const ratingRankMap = sortedMovies.reduce((acc, movie, index) => {
          acc[movie.영화명] = index + 1; // 순위는 1부터 시작
          return acc;
        }, {});

        d3.csv(`${process.env.PUBLIC_URL}/data/${year}.csv`).then((rawData) => {
          const headers = Object.keys(rawData[0]).slice(1).map(String);
          const parsedData = rawData.slice(1).map((row) => {
            const cleanedRow = { week: +row.week };
            headers.forEach((movie) => {
              const rawValue = row[movie]?.toString().replace(/,/g, "") || "0";
              if (ratingsMap[movie]) {

                const rank = ratingRankMap[movie] || headers.length;
                const rankWeight = 1 / Math.log(rank + 1);

                let ratingMultiplier =
                  ratingFactor > 0
                    ? (ratingsMap[movie].관람평점 * ratingFactor / 10) * rankWeight
                    : 0;

                let awardMultiplier =
                  awardFactor > 0
                    ? ratingsMap[movie].수상횟수 * awardFactor / 10
                    : 0;

                const MIN_REVENUE_FACTOR = 1;
                const adjustedRevenueFactor = Math.max(revenueFactor, MIN_REVENUE_FACTOR);

                const gaugeAdjustedValue =
                  (+rawValue || 0) * (adjustedRevenueFactor / 100);

                cleanedRow[movie] =
                  gaugeAdjustedValue * (1 + ratingMultiplier + awardMultiplier);
              } else {
                const MIN_REVENUE_FACTOR = 1; // 1%
                const adjustedRevenueFactor = Math.max(revenueFactor, MIN_REVENUE_FACTOR);
                cleanedRow[movie] =
                  (+rawValue || 0) * (adjustedRevenueFactor / 100);
              }
            });
            return cleanedRow;
          });

          const totalSums = headers.reduce((acc, movie) => {
            acc[movie] = parsedData.reduce((sum, weekData) => sum + (weekData[movie] || 0), 0);
            return acc;
          }, {});

          setData({ parsedData, headers: headers.reverse() });
          setTotalSums(totalSums);
        });
      })
      .catch((error) => {
        console.error("Error loading movie data:", error);
      });
  }, [year, ratingFactor, awardFactor, revenueFactor]);



  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const { parsedData, headers } = data;

    const margin = { top: 10, right: 25, bottom: 30, left: 80 };
    const width = windowWidth - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const graphGroup = svg
      .selectAll("g.graph-group")
      .data([null])
      .join("g")
      .attr("class", "graph-group")
      .attr("transform", `translate(${margin.left},${margin.top})`);



    const x = d3.scaleLinear().domain([1, 52]).range([0, width]);
    const maxY = d3.max(parsedData, (d) => d3.sum(Object.values(d).slice(1)));

    const MIN_Y_DOMAIN = 1;
    const finalMaxY = Math.max(maxY, MIN_Y_DOMAIN);

    const y = d3.scaleLinear()
      .domain([0, finalMaxY])
      .range([height, 0]);

    graphGroup
      .selectAll(".grid-line")
      .data(d3.range(1, 53))
      .join("line")
      .attr("class", "grid-line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .lower();

    graphGroup
      .selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickValues(d3.range(1, 53))
          .tickFormat((d) => `${d}`)
      )
      .selectAll("text")
      .style("fill", "#666")
      .style("font-size", "13px")
      .style("font-weight", (d) => (d % 10 === 0 ? "bold" : "normal"));

    graphGroup.select(".x-axis .domain")
      .style("stroke", "#666")
      .style("stroke-width", "0px");

    graphGroup.selectAll(".x-axis .tick line")
      .style("stroke", "#666")
      .style("stroke-width", "1px");




    graphGroup
      .selectAll(".y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .call((g) => {
        const yAxis = d3.axisLeft(y).ticks(5);

        g.call(yAxis);

        g.select(".domain").remove();
        g.selectAll("line").remove();

        g.selectAll("text")
          .text((d) => {
            if (d >= 1e9) return `${(d / 1e9).toFixed(1)}B`;
            if (d >= 1e6) return `${(d / 1e6).toFixed(1)}M`;
            if (d >= 1e3) return `${(d / 1e3).toFixed(1)}K`;
            return d;
          })
          .style("font-size", "17px")
          .style("font-weight", "bold")
          .style("fill", "#666")
          .attr("x", -10)
          .attr("dy", "0.3em");
      });

      const color = d3
      .scaleOrdinal()
      .domain(headers)
      .range(
        headers.map((header) => {

          if (movieRatings[header]?.장르) {
            return genreColors[movieRatings[header]?.장르];
          }
          return "#aaa";
        })
      );

    const stacked = d3.stack()
      .keys(headers)
      .order(d3.stackOrderAppearance)
      .offset(d3.stackOffsetNone);

    const stackedData = stacked(parsedData);

    const area = d3.area()
      .curve(d3.curveBasis)
      .x((d) => x(d.data.week))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    const paths = graphGroup
      .selectAll(".layer")
      .data(stackedData, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "layer")
            .attr("d", area)
            .style("fill", (d) => color(d.key))
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1),
        (update) =>
          update
            .transition()
            .duration(1000)
            .attr("d", area)
            .style("fill", (d) => color(d.key))
            .style("opacity", (d) =>
              selectedGenre === "Total" || movieRatings[d.key]?.장르 === selectedGenre ? 1 : 0.15
            ),
        (exit) =>
          exit
            .transition()
            .duration(1000)
            .style("opacity", 0)
            .remove()
      );

    const streamTooltip = d3.select("body")
      .selectAll(".streamgraph-tooltip")
      .data([null])
      .join("div")
      .attr("class", "streamgraph-tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#f9f9f9")
      .style("pointer-events", "none")
      .style("opacity", 0);


    const highlight = (event, d) => {
      const movieTotalRevenue = parsedData.reduce((sum, weekData) => {
        return sum + (weekData[d.key] || 0);
      }, 0);

      const formattedTotal =
        movieTotalRevenue >= 1e12
          ? (movieTotalRevenue / 1e12).toFixed(1) + "T"
          : movieTotalRevenue >= 1e9
            ? (movieTotalRevenue / 1e9).toFixed(1) + "B"
            : movieTotalRevenue >= 1e6
              ? (movieTotalRevenue / 1e6).toFixed(1) + "M"
              : movieTotalRevenue >= 1e3
                ? (movieTotalRevenue / 1e3).toFixed(1) + "K"
                : movieTotalRevenue;



      graphGroup.selectAll(".layer").transition().duration(200).style("opacity", 0.15);

      d3.select(event.target)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("stroke", "#000")
        .style("stroke-width", 1);

      streamTooltip
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .html(
          `<strong>${d.key}</strong><br>
              총 합: ${formattedTotal}`
        );
    };

    const resetHighlight = () => {
      graphGroup
        .selectAll(".layer")
        .transition()
        .duration(200)
        .style("opacity", (d) => {
          return selectedGenre === "Total" || movieRatings[d.key]?.장르 === selectedGenre ? 1 : 0.2;
        })
        .style("stroke", "none")
        .style("stroke-width", 0);
      streamTooltip.style("opacity", 0);
    };

    paths
      .on("mouseover", highlight)
      .on("mousemove", highlight)
      .on("mouseleave", resetHighlight);
  }, [data, windowWidth, selectedGenre, movieRatings]);

  useEffect(() => {
    if (!isPopupOpen || !popupSvgRef.current || Object.keys(totalSums).length === 0) return;

    const sortedMovies = Object.entries(totalSums)
      .sort((a, b) => b[1] - a[1])
      .map(([movie, sum]) => ({ movie, sum }))
      .reverse();

    const margin = { top: 30, right: 80, bottom: 50, left: 120 };
    const barHeight = 25;
    const svgHeight = sortedMovies.length * barHeight + margin.top + margin.bottom;
    const svgWidth = 800;
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3
      .select(popupSvgRef.current)
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`) 
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "100%")
      .attr("height", "100%");


    const chartGroup = svg
      .selectAll("g.chart-group")
      .data([null])
      .join("g")
      .attr("class", "chart-group")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(sortedMovies, (d) => d.sum)])
      .nice()
      .range([0, width]);

    const y = d3
      .scaleBand()
      .domain(sortedMovies.map((d) => d.movie))
      .range([height, 0])
      .padding(0.2);

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
            .attr("fill", (d) => genreColors[movieRatings[d.movie]?.장르] || "#aaa")
            .style("rx", 3) // Rounded corners
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
            .attr("dy", "0.5em")
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#666")
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
            .style("font-size", "10px")
            .style("font-weight", "bold")
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
      .style("stroke-dasharray", "3, 3");

    chartGroup
      .select(".x-grid .domain")
      .remove(); 

    const popupTooltip = d3.select("body")
      .selectAll(".popup-tooltip")
      .data([null])
      .join("div")
      .attr("class", "popup-tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("border", "1px solid #363636")
      .style("padding", "5px")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("white-space", "nowrap")
      .style("z-index", "1000")
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
            popupTooltip
              .style("opacity", 1)
              .html(d) 
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mousemove", function (event) {
            popupTooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
          })
          .on("mouseleave", function () {
            popupTooltip.style("opacity", 0); 
          });
      });
    
      
    chartGroup
      .selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x).ticks(5).tickFormat((d) => {
          if (d >= 1e12) return (d / 1e12).toFixed(1) + "T";
          if (d >= 1e9) return (d / 1e9).toFixed(1) + "B";
          if (d >= 1e6) return (d / 1e6).toFixed(1) + "M";
          if (d >= 1e3) return (d / 1e3).toFixed(1) + "K";
          return d;
        })
      )
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#666")
      .style("font-weight", "bold");

  }, [isPopupOpen, totalSums, movieRatings]);


  return (
    <div className="chart-container">
      <div className="Year" onClick={togglePopup} style={{ cursor: "pointer" }}>
        {year}
      </div>{isPopupOpen && (
        <div className="popup">
          <div className="popup-content" ref={popupContentRef} style={{
            width: "800px",
            height: "500px",
          }}>
            <div className="popup-header">

              <h1 className='popup-title'>{year} Movie Details</h1>
              <div className="circle-buttons">
                <div className="circle red" onClick={togglePopup} title="닫기"></div>
              </div>
            </div>

            <div className="popup-graph">
              <svg ref={popupSvgRef}></svg>
            </div>

          </div>
        </div>
      )}
      <div
        className="streamgraph-container">
        <div className="streamgraph">
          <svg ref={svgRef}></svg>
        </div>
      </div>
    </div>
  );

};

export default MovieChart;
