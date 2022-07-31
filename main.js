const axios = require("axios");
const https = require("https");
const cheerio = require("cheerio");
const fs = require("fs");

const selectedClass = "Cleric";
const url = `https://wiki.project1999.com/${selectedClass}`;
const spellUrls = [];
const spells = {};

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function scrapeData() {
  try {
    const { data: classReq } = await axios.get(url, { httpsAgent });
    const classPage = cheerio.load(classReq);

    //go to class page, get all the spell links
    const spellLinks = classPage('table[width="92%"] td[width="22%"] a');
    spellLinks.each((idx, el) => {
      const href = el.attribs.href;
      spellUrls.push(`https://wiki.project1999.com${href}`)
    });

    for(const spellUrl of spellUrls) {
      const { data: spellReq } = await axios.get(spellUrl, { httpsAgent });
      const spellPage = cheerio.load(spellReq);
      const spellName = spellPage('#firstHeading span').text();
   
      const spellTables = spellPage('table:not([class])');
      const spellMeta = spellPage(spellTables[1]).find('td');
      const spellEffects = spellPage(spellTables[2]).find('td');

      const spell = {
        name: spellName,
        mana: spellPage(spellMeta[1]).text().trim(),
        skill: spellPage(spellMeta[3]).text().trim(),
        castTime: spellPage(spellMeta[5]).text().trim(),
        recastTime: spellPage(spellMeta[7]).text().trim(),
        fizzleTime: spellPage(spellMeta[9]).text().trim(),
        resist: spellPage(spellMeta[11]).text().trim(),
        range: spellPage(spellMeta[13]).text().trim(),
        targetType: spellPage(spellMeta[15]).text().trim(),
        spellType: spellPage(spellMeta[17]).text().trim(),
        duration: spellPage(spellMeta[19]).text().trim(),
        castOnYou: spellPage(spellEffects[1]).text().trim(),
        castOnOther: spellPage(spellEffects[3]).text().trim(),
        wearsOff: spellPage(spellEffects[5]).text().trim(),
      }

      console.log(`pushing ${spellName}`);
      spells[spellName] = spell;
    };

    fs.writeFile(`data/${selectedClass}.json`, JSON.stringify(spells, null, 2), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Successfully written data to file");
    });
  } catch (err) {
    console.error(err);
  }
}
// Invoke the above function
scrapeData();