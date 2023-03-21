const axios = require("axios");
const Outscraper = require('outscraper');
const data_input = require("./data-input/data_domain_1000_to_2000.json");
const fs = require("fs");

let client = new Outscraper('Z29vZ2xlLW9hdXRoMnwxMDA0MDg0MzM2MTM0OTIwMzE4ODN8ODZmZWMzM2NlOQ');

async function main() {
    console.log('total row: ', data_input.length);
    for (let i = 305; i <  data_input.length; i++) {
        let row = data_input[i];
        console.log('current_row: ', i + 1);
        const domain_query = row.domain;
        if (!domain_query.includes('not found')) {
            try {
                let response = await client.emailsAndContacts([domain_query]);
                if (response && response[0] && response[0].emails) {
                    const emails = response[0].emails;
                    row.emails = '';
                    row.full_name = ''; 
                    row.title = '';
                    for (let email of emails) {
                        row.emails += email.value ? `${email.value} \n` : `\n`;
                        row.full_name += email.full_name ? `${email.full_name} \n` : `\n`;
                        row.title += email.title ?  `${email.title} \n` : `\n`;
                    }
                    console.log('emails: ', row.emails);
                }
            } catch (e) {
                console.log('error: ', e);
            }
        } else {
            row.emails = 'not found';
        }
        let current_output = await fs.readFileSync(`./data-output/data_email_output_full_1000_to_2000.json`);
        current_output = JSON.parse(current_output);
        current_output.push(row);
        fs.writeFileSync('./data-output/data_email_output_full_1000_to_2000.json', JSON.stringify(current_output, null, 2));
    }
}

main()

