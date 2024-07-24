import axios from 'axios'

export class APIService {
  async getData(){
    const { data } = axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.REACT_APP_SPREADSHEET_ID}/values/${process.env.GOOGLE_NAME_TABLE}!A1:B2?key=${process.env.GOOGLE_KEY}`)

    return data
  }
}