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

generate();