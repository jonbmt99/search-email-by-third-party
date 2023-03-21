const axios = require("axios");
const Outscraper = require('outscraper');
const data_input = require("./data-input/toronto-canada.json");
const data_output = [];
const fs = require("fs");

const headers = {
    headers: {
        'Content-Type': 'application/json', 
        'X-API-KEY': '8671fb30eea85be09d5bd9f1c80d70a617a0781f'
    }
}

function getDomain(url, subdomain) {
    subdomain = subdomain || false;
  
    url = url.replace(/(https?:\/\/)?(www.)?/i, "");
  
    if (!subdomain) {
      url = url.split(".");
  
      url = url.slice(url.length - 2).join(".");
    }
  
    if (url.indexOf("/") !== -1) {
      return url.split("/")[0];
    }
  
    return url;
  }

async function main() {
    console.log('total row: ', data_input.length);
    for (let i = 2000; i < 3000; i++) {
        console.log('current_row: ', i + 1);
        let row = data_input[i];
        const question = `Website of company ${row["CITY-VILLE"]} in ${row["COMPANY-ENTREPRISE"]}`;
        const body = {
            q: question
        };
        try {
            let response = await axios.post('https://google.serper.dev/search', 
            body,
            headers
            );
            row.url = response.data.organic[0].link;
            row.domain = getDomain(row.url);
            if(row.domain.includes('linkedin.com') || row.domain.includes('.html') || !row.domain.includes('.')) {
                row.domain = 'not found';
            }
            data_output.push(row);
            fs.writeFileSync('data_domain_2000_to_3000.json', JSON.stringify(data_output, null, 2));
        } catch (e) {
            console.log('error: ', e);
        }
    }
}

main()