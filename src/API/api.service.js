const extractData = (str) => {
  const pattern = /([\d.]+),\s*([\d.]+):\s*(https?:\/\/\S+)/
  const match = str.match(pattern)

  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
      url: match[3]
    }
  } else {
    return null
  }
}

const normalizeName = (name) => {
  return name.toLowerCase().replace(/\s+/g, '')
}

function SearchThor(nameThor, tors) {
  const normalizedThorName = normalizeName(nameThor)
  return tors.find(tor => normalizeName(tor[0]) === normalizedThorName)
}

export async function getData(nameThor) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1-f7nNfVlFYfQvfOfeITs4DK4huMSXMQqi1LNaXlctHo/values/Лист1!A2:Z?key=AIzaSyBKkvIa5Pleeun5KOyTfDon4TRLUsKA6_s`)

  const data = await response.json()

  const thor = SearchThor(nameThor, data.values)

  if (thor && Array.isArray(thor)) {
    const extractedData = thor.slice(1).map(item => extractData(String(item)))
    return extractedData.filter(item => item !== null)
  } else {
    return []
  }
}