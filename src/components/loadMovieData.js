import * as d3 from "d3";

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

const loadMovieData = async (filePath) => {
  if (!filePath) {
    throw new Error("Please specify the path to the CSV file.");
  }

  const data = await d3.csv(filePath, (d) => ({
    순위: +d["순위"] || 0,
    영화명: d["영화명"] || "Unknown",
    개봉일: d["개봉일"] || "Unknown",
    매출액: +d["매출액"]?.replace(/,/g, "") || 0,
    가중치: +d["가중치"]?.replace(/,/g, "") || 0,
    관객수: +d["관객수"]?.replace(/,/g, "") || 0,
    스크린수: +d["스크린수"] || 0,
    상영횟수: +d["상영횟수"] || 0,
    대표국적: d["대표국적"] || "Unknown",
    제작국적: d["제작국적"] || "Unknown",
    배급사: d["배급사"] || "Unknown",
    장르: genreMap[d["장르"]] || "Unknown", 
    등급: +d["등급"] || 0,
    러닝타임: +d["러닝타임"] || 0,
    수상횟수: +d["수상횟수"] || 0,
    관람평점: +d["관람평점"] || 0,
    남자평점: +d["남자 평점"] || 0,
    여자평점: +d["여자 평점"] || 0,
  }));
  console.log(data);
  return data;
};

export default loadMovieData;
