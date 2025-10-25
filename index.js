const axios = require("axios");
const fs = require("fs");

const getQuote = async () => {
    try {
        const {data} = await axios.get("https://quotes.rest/qod?language=en&quot;");
        const quote = data.contents.quotes[0].quote;
        const author = data.contents.quotes[0].author;

        console.log("new quote", `"${quote}`);

        return {
            quote,
            author
        };
    } catch (err) {
        console.error(err.message);
        return {};
    }
};

const generate = async () => {
    const { quote, author } = await getQuote();
    const  interestingRepositories = fs.readFileSync("InterestingRepositories.md");

    if(!quote) return;
    if(author==="Jack Ma"){
        author+=`\nif(author==="Jack Ma"){\nDont trust that, I hate him! }`
    }
    
    fs.writeFileSync("README.md", `${interestingRepositories}\n\n_**${quote}**_\n\n${author}`);
}

/**
 * {
 * "q": "Where focus goes, energy flows.",
 * "a": "Tony Robbins",
 * "h": "<blockquote>&ldquo;Where focus goes, energy flows.&rdquo; &mdash; <footer>Tony Robbins</footer></blockquote>"
 * }
 * ]
 */
function get_quote_of_the_day() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Access the result here
            alert(this.responseText);
        }
    };
    xhttp.open("GET", "https://zenquotes.io/api/random", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
}

get_quote_of_the_day()