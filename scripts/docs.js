/* eslint-env node */
var fs = require('fs');
const path = require('path');
const jsdoc2md = require('jsdoc-to-markdown');

const packages = [
    {
        name: 'cricket',
        files: ['src/index.js'],
        readme: '# API',
    },
];

function createPackagePath(name) {
    return (str) => path.resolve('packages/' + name + '/' + str);
}

async function generateDocs({ name, files, readme }) {
    const p = createPackagePath(name);

    const docs = await jsdoc2md.render({ files: files.map(p) });
    fs.writeFileSync(p`API.md`, docs);

    if (readme) {
        // This replaces the `readme` section with the generated docs.
        // It replaces the token until the EOF (end of file) with the docs.
        let readmeFile = fs.readFileSync(p`README.md`, 'utf8');
        if (readmeFile) {
            // `[^]` matches any character, `.` doesn't include newlines.
            const regex = new RegExp(`${readme}[^]*$`, 'img');
            readmeFile = readmeFile.replace(regex, `${readme}\n\n${docs}`);
            fs.writeFileSync(p`README.md`, readmeFile);
        }
    }
}

packages.forEach(generateDocs);
