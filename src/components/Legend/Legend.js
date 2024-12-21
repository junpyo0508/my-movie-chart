import React, { useState } from "react";
import MovieCharts from "../MovieCharts/MovieCharts";
import OverallBarChart from "../OverallBarChart/OverallBarChart";
import DonutChart from "./DonutChart";
import "./Legend.css";
import legendImage from "../../image.jpg";

const Legend = () => {
  const [ratingFactor, setRatingFactor] = useState(0);
  const [awardFactor, setAwardFactor] = useState(0);
  const [revenueFactor, setRevenueFactor] = useState(100);
  const [selectedGenre, setSelectedGenre] = useState("Total");
  const [selectedYear, setSelectedYear] = useState(2012);

  const genres = ["Crime", "Horror", "Comic", "Ani", "Show", "Action", "Fantasy", "Adven", "SF", "Roman", "Drama"];

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

  const years = Array.from({ length: 12 }, (_, i) => 2012 + i);

  return (
    <div className="legend-container">
      <div className="legend-header">
        <div className="legend-left">
          <h1 style={{ fontFamily: 'Kokila' }}>Movies Overall Ranking by Weight</h1>
          <div className="overall-bar-chart-container">
            <OverallBarChart ratingFactor={ratingFactor} awardFactor={awardFactor} />
          </div>
        </div>

        <div className="title-section">
          <h1 className="legend-title">CHARTING CINEMA</h1>
          <h2 className="small-title">Visualizing Domestic Box Office History</h2>

          <div className="genre-buttons">
            {genres.map((genre) => (
              <button
                key={genre}
                className={`genre-button ${selectedGenre === genre ? "active" : ""}`}
                onClick={() =>
                  setSelectedGenre((prevGenre) => (prevGenre === genre ? "Total" : genre))
                }
                style={{ backgroundColor: genreColors[genre] || "#eaeaea" }}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="year-buttons">
            {years.map((year) => (
              <button
                key={year}
                className={`year-button ${selectedYear === year ? "active" : ""}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>

        </div>


        <div className="donut-chart-container">
          <div className='right-title'>Sales and number of moives by genre
          </div>
          <div className='donut-content'>
            <div className="legend-image">
              <img src={legendImage} alt="Legend"></img>
            </div>
            <div class="donut-chart">
            <DonutChart year={selectedYear} />
            </div>
          </div>
        </div>
      </div>

      <MovieCharts
        ratingFactor={ratingFactor}
        awardFactor={awardFactor}
        revenueFactor={revenueFactor}
        setRatingFactor={setRatingFactor}
        setAwardFactor={setAwardFactor}
        setRevenueFactor={setRevenueFactor}
        selectedGenre={selectedGenre}
        selectedYear={selectedYear}
      />
    </div>
  );
};

export default Legend;
