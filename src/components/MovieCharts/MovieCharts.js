import React from 'react';
import MovieChart from '../MovieChart';
import GaugeBar from '../GaugeBar/GaugeBar';
import './MovieCharts.css';

const MovieCharts = ({
  ratingFactor,
  awardFactor,
  revenueFactor,
  setRatingFactor,
  setAwardFactor,
  setRevenueFactor,
  selectedGenre,
  selectedYear, 
}) => {
  return (
    <div>
      <div className="movie-charts-container">
        <div key={selectedYear} className="chart-wrapper">
          <MovieChart
            year={selectedYear.toString()}
            ratingFactor={ratingFactor}
            awardFactor={awardFactor}
            selectedGenre={selectedGenre}
            revenueFactor={revenueFactor}
          />
        </div>
      </div>
      <div className="gauge-bar-fixed-container">
        <div className="gauge-bar-row">
          <div className="gauge-bar-item">
            <GaugeBar
              label="Gross"
              min={0}
              max={100}
              value={revenueFactor}
              setValue={setRevenueFactor}
              color="#4F6436"
            />
          </div>
          <div className="gauge-bar-item">
            <GaugeBar
              label="Rating"
              min={0}
              max={100}
              value={ratingFactor}
              setValue={setRatingFactor}
              color="#FDCB05"
            />
          </div>
          <div className="gauge-bar-item">
            <GaugeBar
              label="Awards"
              min={0}
              max={100}
              value={awardFactor}
              setValue={setAwardFactor}
              color="#D0A367"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCharts;
