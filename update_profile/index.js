import axios from "axios";
import fs from "fs";

async function generate_new_quote(filePath = `README.md`) {
    let md = fs.readFileSync(filePath, 'utf8');
    const reSingle = /<blockquote\b[^>]*>[\s\S]*?<\/blockquote>/i;

    let quote = await get_quote_of_the_day();
    if (!reSingle.test(md)) {
        fs.appendFileSync(filePath, `\n\n**${quote}**`, 'utf8');
        console.log('No <blockquote> found in', filePath, ', appending quote at the end.');
        return;
    }

    const replaced = md.replace(reSingle, quote);
    fs.writeFileSync(filePath, replaced, 'utf8');
}

/**
 *  [
 * {
 * "q": "Where focus goes, energy flows.",
 * "a": "Tony Robbins",
 * "h": "<blockquote>&ldquo;Where focus goes, energy flows.&rdquo; &mdash; <footer>Tony Robbins</footer></blockquote>"
 * }
 * ]
 */
async function get_quote_of_the_day() {
    try {
        const quotes = await axios.get("https://zenquotes.io/api/random");
        const quote = quotes.data[0].h;
        console.log("New quote", `"${quote}`);
        return quote;
    } catch (err) {
        console.error(err.message);
        return "Stare at the abyss long enough, and it starts to stare back at you...";
    }
}

await generate_new_quote("../README.md")