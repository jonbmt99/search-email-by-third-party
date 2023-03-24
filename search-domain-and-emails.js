require('dotenv').config();
const axios = require("axios");
const SERPER_API_KEY = process.env['SERPER_API_KEY'];
const OUTSCRAPER_API_KEY = process.env['OUTSCRAPER_API_KEY'];
const input_file_name = process.env['INPUT_FILE_NAME'];
const output_file_name = process.env['OUTPUT_FILE_NAME'];
let rows = require(`./data-input/${input_file_name}`);
rows = rows.Data;
const Outscraper = require("outscraper");
let client = new Outscraper(OUTSCRAPER_API_KEY);
const fs = require("fs");
const XLSX = require("xlsx");
const input_row = parseInt(process.argv.splice(2).join(" "), 10);

const headers = {
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": SERPER_API_KEY,
  },
};

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
  console.log("total row: ", rows.length);
  let i = input_row ? input_row - 1 : 0;
  while (i < rows.length) {
    console.log("current_row: ", i + 1);
    i++;
    let row = rows[i];
    const question = `Website of company ${row["CITY-VILLE"]} in ${row["COMPANY-ENTREPRISE"]}`;
    const body = {
      q: question,
    };
    try {
      let response = await axios.post(
        "https://google.serper.dev/search",
        body,
        headers
      );
      row.url = response.data.organic[0].link;
      row.domain = getDomain(row.url);
      if (
        row.domain.includes("linkedin.com") ||
        row.domain.includes(".html") ||
        !row.domain.includes(".")
      ) {
        row.domain = "not found";
      }
      const domain_query = row.domain;
      if (!domain_query.includes("not found")) {
        try {
          let response = await client.emailsAndContacts([domain_query]);
          if (response && response[0] && response[0].emails) {
            const emails = response[0].emails;
            row.emails = "";
            row.full_name = "";
            row.title = "";
            for (let email of emails) {
              row.emails += email.value ? `${email.value} \n` : `\n`;
              row.full_name += email.full_name ? `${email.full_name} \n` : `\n`;
              row.title += email.title ? `${email.title} \n` : `\n`;
            }
            console.log("emails: ", row.emails);
          }
        } catch (e) {
          console.log("error: ", e);
        }
      } else {
        row.emails = "not found";
      }
      let current_output = fs.readFileSync(`./data-output/${output_file_name}`);
          current_output = JSON.parse(current_output);
          if (!current_output) {
            current_output = [];
          }
        current_output.push(row);
      fs.writeFileSync(
        `./data-output/${output_file_name}`,
        JSON.stringify(current_output, null, 2)
      );
      const worksheet = XLSX.utils.json_to_sheet(current_output);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "data");
      XLSX.writeFile(workbook, `./data-output-excel/${output_file_name.replace('.json', '')}.xlsx`);
      fs.writeFileSync(`./current-row/current-row-of-${input_file_name}`, `index row done: ${i}`);
    } catch (e) {
      console.log("error: ", e);
    }
  }
}

main();
