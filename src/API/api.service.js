const extractData = (str) => {
  const pattern = /([\d.]+),\s*([\d.]+):\s*(https?:\/\/\S+)/;
  const match = str.match(pattern);
  
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
      url: match[3]
    };
  } else {
    return null;
  }
};

export async function getData() {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1-f7nNfVlFYfQvfOfeITs4DK4huMSXMQqi1LNaXlctHo/values/Лист1!B2:I2?key=AIzaSyBKkvIa5Pleeun5KOyTfDon4TRLUsKA6_s`);
  
  const data = await response.json();
  
  if (data.values && Array.isArray(data.values)) {
    const extractedData = data.values.flat().map(item => extractData(String(item)));
    return extractedData.filter(item => item !== null); // Фильтрация null значений
  } else {
    return [];
  }
}
